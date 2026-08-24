"""
ASM → DaySmart Pre-Import Verify Report  (Task 4 of the nightly sync)
----------------------------------------------------------------------
Runs BEFORE the nightly import (Task 1). Emails a report of all ASM animals
that do NOT yet have a matching DaySmart patient, so staff can review before
creation happens at 9:15 PM.

Recipients: erin@everypetmatters.org, angie.romero@4pawsrescue.org

Run manually:  python3 scripts/asm_daysmart_verify_report.py
Scheduled:     9:00 PM Arizona time (04:00 UTC), nightly.
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

import requests

# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

ASM_BASE_URL = os.environ.get("ASM_BASE_URL", "https://us01d.sheltermanager.com")
ASM_ACCOUNT  = os.environ["ASM_ACCOUNT"]
ASM_USERNAME = os.environ["ASM_USERNAME"]
ASM_PASSWORD = os.environ["ASM_PASSWORD"]

DS_CLIENT_ID     = os.environ["DS_CLIENT_ID"]
DS_CLIENT_SECRET = os.environ["DS_CLIENT_SECRET"]
DS_API_KEY       = os.environ["DS_API_KEY"]
DS_DOMAIN        = os.environ["DS_DOMAIN"]

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL     = os.environ.get("FROM_EMAIL", "")
REPORT_TO      = ["erin@everypetmatters.org", "angie.romero@4pawsrescue.org"]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ASM_CODE_PATTERN = re.compile(r"\s*-\s*([A-Z]\d{4,})\s*$")
ASM_CODE_ANYWHERE = re.compile(r'\b([A-Z]\d{4,})\b')
ASM_CODE_VALID   = re.compile(r"^[A-Z]\d{7}$")


def normalise(s: str) -> str:
    return (s or "").strip().lower().replace(" & ", " and ")


# ---------------------------------------------------------------------------
# ASM
# ---------------------------------------------------------------------------

def asm_get_shelter_animals() -> list[dict]:
    resp = requests.get(
        f"{ASM_BASE_URL}/service",
        params={
            "method": "json_shelter_animals",
            "account": ASM_ACCOUNT,
            "username": ASM_USERNAME,
            "password": ASM_PASSWORD,
        },
        timeout=30,
    )
    resp.raise_for_status()
    animals = resp.json()
    log.info("ASM: %d shelter animals fetched.", len(animals))
    return animals


# ---------------------------------------------------------------------------
# DaySmart
# ---------------------------------------------------------------------------

def ds_get_token() -> str:
    resp = requests.post(
        f"{DS_DOMAIN}/oauth/access_token",
        data={
            "grant_type": "client_credentials",
            "client_id": DS_CLIENT_ID,
            "client_secret": DS_CLIENT_SECRET,
            "scope": "APIService",
        },
        headers={
            "x-api-key": DS_CLIENT_SECRET,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def ds_scan_patients(token: str) -> tuple[set[str], set[str], set[str]]:
    """
    Scan all DaySmart patients and return:
      asm_codes_in_ds  — ASM codes found in any patient name
      ds_base_names    — normalised patient names with ASM code suffix stripped
      ds_full_names    — normalised full patient names
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "x-api-key": DS_CLIENT_SECRET,
        "Accept": "application/json",
    }
    url = f"{DS_DOMAIN}/api/1.0.0/{DS_API_KEY}/patients"
    page = 1
    total = 0
    asm_codes_in_ds: set[str] = set()
    ds_base_names: set[str]   = set()
    ds_full_names: set[str]   = set()

    while True:
        resp = requests.get(url, headers=headers, params={"page": page, "perPage": 200}, timeout=30)
        resp.raise_for_status()
        body = resp.json()["response"]
        for p in body.get("resources", []):
            total += 1
            pname = p.get("name", "")
            ds_full_names.add(normalise(pname))
            base = ASM_CODE_PATTERN.sub("", pname).strip()
            ds_base_names.add(normalise(base))
            for m in ASM_CODE_ANYWHERE.finditer(pname):
                asm_codes_in_ds.add(m.group(1))
        if page >= body.get("meta", {}).get("lastPage", 1):
            break
        page += 1

    log.info("DaySmart: %d total patients scanned.", total)
    log.info("  ASM codes already in DaySmart: %d", len(asm_codes_in_ds))
    return asm_codes_in_ds, ds_base_names, ds_full_names


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------

def send_verify_report(to_create: list[dict], total_asm: int, total_ds_matched: int) -> None:
    if not RESEND_API_KEY or not FROM_EMAIL:
        log.warning("RESEND_API_KEY or FROM_EMAIL not set — printing report to stdout only.")
        for a in to_create:
            print(f"  {a['code']:12}  {a['name']:30}  {a['species']:10}  {a['sex']:20}  {a['location']}")
        return

    now = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")

    if not to_create:
        html = f"""
<div style='font-family:sans-serif;max-width:700px'>
  <h2 style='color:#2d6a4f'>Pre-Import Verify Report — {now}</h2>
  <p style='color:#2d6a4f;font-weight:bold'>✓ All {total_asm} ASM animals are already in DaySmart. No new imports scheduled.</p>
  <p style='color:#888;font-size:12px'>Every Pet Matters / Sun Cities 4 Paws — automated nightly sync</p>
</div>
"""
        subject = f"Pre-Import Report: All clear — no new animals to import ({now})"
    else:
        rows_html = "".join(
            f"<tr style='background:{'#f9f9f9' if i % 2 else '#fff'}'>"
            f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['name']}</td>"
            f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['code']}</td>"
            f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['species']}</td>"
            f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['sex']}</td>"
            f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['location']}</td>"
            f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['intake_date']}</td></tr>"
            for i, a in enumerate(to_create)
        )
        html = f"""
<div style='font-family:sans-serif;max-width:800px'>
  <h2 style='color:#2d6a4f'>Pre-Import Verify Report — {now}</h2>
  <p>The nightly import (9:15 PM) will create <strong>{len(to_create)}</strong> new patient(s) in DaySmart
     from ASM's {total_asm} shelter animals ({total_ds_matched} already matched).</p>
  <p style='color:#856404;background:#fff3cd;padding:10px;border-radius:4px'>
    ⚠ Review this list before 9:15 PM if you want to prevent any of these from being created.
  </p>
  <table style='border-collapse:collapse;width:100%'>
    <thead>
      <tr style='background:#2d6a4f;color:#fff'>
        <th style='padding:8px 12px;text-align:left'>Name</th>
        <th style='padding:8px 12px;text-align:left'>ASM Code</th>
        <th style='padding:8px 12px;text-align:left'>Species</th>
        <th style='padding:8px 12px;text-align:left'>Sex</th>
        <th style='padding:8px 12px;text-align:left'>Location</th>
        <th style='padding:8px 12px;text-align:left'>Intake Date</th>
      </tr>
    </thead>
    <tbody>{rows_html}</tbody>
  </table>
  <p style='color:#888;font-size:12px;margin-top:20px'>
    Every Pet Matters / Sun Cities 4 Paws — automated nightly sync
  </p>
</div>
"""
        subject = f"Pre-Import Report: {len(to_create)} animal(s) will be added to DaySmart tonight — {now}"

    payload = {
        "from": FROM_EMAIL,
        "to": REPORT_TO,
        "subject": subject,
        "html": html,
    }
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=15,
    )
    if resp.status_code in (200, 201):
        log.info("Verify report emailed to %s", REPORT_TO)
    else:
        log.warning("Failed to send verify report: %s — %s", resp.status_code, resp.text[:200])


# ---------------------------------------------------------------------------
# Sex label helper (for report display only)
# ---------------------------------------------------------------------------

_DS_SEX_LABEL = {
    ("male",   False): "Male (intact)",
    ("male",   True):  "Male (neutered)",
    ("female", False): "Female (intact)",
    ("female", True):  "Female (spayed)",
}


def sex_display(sexname: str, neutered: int) -> str:
    s = (sexname or "").strip().lower()
    n = neutered == 1
    if "female" in s:
        return _DS_SEX_LABEL[("female", n)]
    if "male" in s:
        return _DS_SEX_LABEL[("male", n)]
    return "Unknown"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    log.info("=== Pre-import verify report started at %s ===",
             datetime.now(timezone.utc).isoformat())

    token = ds_get_token()
    log.info("Scanning DaySmart patients …")
    asm_codes_in_ds, ds_base_names, ds_full_names = ds_scan_patients(token)

    log.info("Fetching ASM shelter animals …")
    asm_animals = asm_get_shelter_animals()

    to_create = []
    matched = 0

    for animal in asm_animals:
        name = (animal.get("ANIMALNAME") or "").strip()
        code = (animal.get("SHELTERCODE") or "").strip()

        if not code or not ASM_CODE_VALID.match(code):
            continue

        ds_name = f"{name} - {code}"

        if (normalise(ds_name) in ds_full_names
                or normalise(name) in ds_base_names
                or code in asm_codes_in_ds):
            matched += 1
            continue

        intake_raw = animal.get("DATEBROUGHTIN") or animal.get("MOSTRECENTENTRYDATE") or ""
        try:
            intake_dt = datetime.fromisoformat(intake_raw.replace("Z", "+00:00"))
            intake_str = intake_dt.strftime("%m/%d/%Y")
        except Exception:
            intake_str = ""

        to_create.append({
            "name":        name,
            "code":        code,
            "species":     (animal.get("SPECIESNAME") or animal.get("ANIMALTYPENAME") or "").strip(),
            "sex":         sex_display(animal.get("SEXNAME", ""), int(animal.get("NEUTERED") or 0)),
            "location":    (animal.get("SHELTERLOCATIONNAME") or animal.get("ACTIVEMOVEMENTTYPENAME") or "").strip(),
            "intake_date": intake_str,
        })

    log.info(
        "ASM: %d total  |  %d already in DaySmart  |  %d pending creation",
        len(asm_animals), matched, len(to_create),
    )

    send_verify_report(to_create, len(asm_animals), matched)

    log.info("=== Verify report complete at %s ===", datetime.now(timezone.utc).isoformat())


if __name__ == "__main__":
    main()
