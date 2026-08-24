"""
DaySmart → ASM Medical Sync Script
------------------------------------
Pulls medical data from DaySmart Vetter and pushes it to Shelter Manager (ASM)
via the csv_import service endpoint.

Data synced:
  - Vaccinations       (from /reminders where item.type = "Vaccinations")
  - Microchip numbers  (from /patients where chip is not empty)
  - Spay / Neuter      (from /invoice-items where name contains "spay" or "neuter")
  - Medical treatments (from /invoice-items for medications, labs, dewormers, etc.)

Matching: Uses the ASM shelter code already embedded in DaySmart patient names
          (e.g. "Biscuit - A2024001" → ANIMALCODE = A2024001).
          Animals without an ASM code in their name are skipped.

SETUP: Credentials are read from environment variables (see .env.asm_daysmart).
Run manually (dry run):  python3 scripts/daysmart_to_asm_medical_sync.py --dry-run
Run manually (live):     python3 scripts/daysmart_to_asm_medical_sync.py
Scheduled:    Every day at 4PM Arizona time via Cowork.
"""

from __future__ import annotations

import argparse
import base64
import csv
import io
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests

from medical_sync_report_lib import send_sync_report

# ---------------------------------------------------------------------------
# Credentials — loaded from environment (see .env.asm_daysmart)
# ---------------------------------------------------------------------------

ASM_BASE_URL = os.environ.get("ASM_BASE_URL", "https://us01d.sheltermanager.com")
ASM_ACCOUNT  = os.environ["ASM_ACCOUNT"]
ASM_USERNAME = os.environ["ASM_USERNAME"]
ASM_PASSWORD = os.environ["ASM_PASSWORD"]

DS_CLIENT_ID     = os.environ["DS_CLIENT_ID"]
DS_CLIENT_SECRET = os.environ["DS_CLIENT_SECRET"]
DS_API_KEY       = os.environ["DS_API_KEY"]
DS_DOMAIN        = os.environ["DS_DOMAIN"]

# Comma-separated recipients for the post-sync detail report email. Optional —
# if unset, the report email is skipped (see medical_sync_report_lib.send_sync_report).
MEDICAL_SYNC_REPORT_TO = [
    addr.strip() for addr in os.environ.get("MEDICAL_SYNC_REPORT_TO", "").split(",") if addr.strip()
]

# Temporarily disabled while duplicate vaccination entries are cleaned up in DaySmart.
# Set back to True to resume syncing vaccinations to ASM.
SYNC_VACCINATIONS = False

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

# ASM shelter codes must match this pattern before being sent.
# Codes look like A2024001, D2025012, etc. — one uppercase letter + 7 digits.
# Any code that doesn't match this is flagged as suspicious and skipped.
ASM_CODE_VALID = re.compile(r"^[A-Z]\d{7}$")

def extract_asm_code(patient_name: str) -> str | None:
    """Extract ASM shelter code from a DaySmart patient name like 'Biscuit - A2024001'."""
    m = ASM_CODE_PATTERN.search(patient_name)
    return m.group(1) if m else None


def validate_asm_code(code: str, patient_name: str) -> bool:
    """
    Returns True if the code looks like a valid ASM shelter code.
    Logs a warning and returns False if it doesn't match the expected format,
    which prevents the row from being sent to ASM and avoids accidental record creation.
    """
    if ASM_CODE_VALID.match(code):
        return True
    log.warning(
        "SKIPPED — suspicious ASM code '%s' extracted from DaySmart patient '%s'. "
        "Expected format: one uppercase letter + 7 digits (e.g. A2024001). "
        "This row will NOT be sent to ASM.",
        code, patient_name,
    )
    return False


def fmt_date(iso_string: str | None) -> str:
    """Convert ISO8601 date string to MM/DD/YYYY for ASM CSV, or empty string."""
    if not iso_string:
        return ""
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        return dt.strftime("%m/%d/%Y")
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# ASM API
# ---------------------------------------------------------------------------

def asm_login() -> requests.Session:
    """Return an authenticated ASM session via POST /login."""
    session = requests.Session()
    resp = session.post(
        f"{ASM_BASE_URL}/login",
        data={"username": ASM_USERNAME, "password": ASM_PASSWORD, "database": ASM_ACCOUNT},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    resp.raise_for_status()
    if "WRONGSERVER" in resp.text or "LOGIN" in resp.text.upper()[:200]:
        raise RuntimeError(f"ASM login failed: {resp.text[:200]}")
    log.info("ASM session authenticated.")
    return session


def post_sync_cleanup(dry_run: bool) -> None:
    """
    After csv_import runs, fetch all shelter animals and delete any that have
    a DS-prefixed shelter code — these are phantom records created as a side
    effect of csv_import processing rows for animals no longer in ASM.
    """
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
    ds_animals = [a for a in animals if a.get("SHELTERCODE", "").upper().startswith("DS")]

    if not ds_animals:
        log.info("Post-sync cleanup: no DS phantom records found. ASM is clean.")
        return

    log.warning(
        "Post-sync cleanup: found %d DS phantom record(s) to remove: %s",
        len(ds_animals),
        [f"{a['SHELTERCODE']} / {a['ANIMALNAME']} (ID {a['ID']})" for a in ds_animals],
    )

    if dry_run:
        log.info("[DRY RUN] Would delete %d DS phantom record(s).", len(ds_animals))
        return

    session = asm_login()
    deleted = 0
    for a in ds_animals:
        r = session.post(
            f"{ASM_BASE_URL}/animal",
            data={"mode": "delete", "animalid": a["ID"]},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        if r.status_code == 200 and r.text.strip() in ("", "None", "null"):
            log.info("  Deleted DS phantom: %s / %s (ID %s)", a["SHELTERCODE"], a["ANIMALNAME"], a["ID"])
            deleted += 1
        else:
            log.warning("  Failed to delete %s (ID %s): %s %s", a["SHELTERCODE"], a["ID"], r.status_code, r.text[:100])
        time.sleep(0.1)

    log.info("Post-sync cleanup: deleted %d / %d DS phantom record(s).", deleted, len(ds_animals))


def asm_get_animal_names() -> dict[str, str]:
    """Fetch current shelter animals from ASM and return SHELTERCODE -> ANIMALNAME."""
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
    names = {a["SHELTERCODE"]: a["ANIMALNAME"] for a in animals if a.get("SHELTERCODE")}
    log.info("ASM animal names loaded: %d", len(names))
    return names


# ---------------------------------------------------------------------------
# DaySmart API
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
    token = resp.json()["access_token"]
    log.info("DaySmart token obtained.")
    return token


def ds_paginate(token: str, endpoint: str, extra_params: dict = {}) -> list[dict]:
    """Page through a DaySmart endpoint and return all resources."""
    url = f"{DS_DOMAIN}/api/1.0.0/{DS_API_KEY}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "x-api-key": DS_CLIENT_SECRET,
        "Accept": "application/json",
    }
    results = []
    page = 1
    while True:
        params = {"page": page, "perPage": 200, **extra_params}
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        body = resp.json()["response"]
        resources = body.get("resources", [])
        results.extend(resources)
        meta = body.get("meta", {})
        if page >= meta.get("lastPage", 1):
            break
        page += 1
    log.info("  /%s → %d records", endpoint, len(results))
    return results


def ds_get_patients(token: str) -> dict[str, dict]:
    """
    Fetch all DaySmart patients and return a dict keyed by patient_id.
    Only includes Active patients that have an ASM code in their name.
    Inactive (adopted/discharged) and Deceased patients are skipped.
    """
    raw = ds_paginate(token, "patients")
    patients = {}
    skipped_status = 0
    skipped_code = 0
    for p in raw:
        status = (p.get("status") or "").strip()
        if status != "Active":
            skipped_status += 1
            continue  # skip Inactive (adopted/discharged) and Deceased
        name = p.get("name", "")
        asm_code = extract_asm_code(name)
        if not asm_code:
            continue  # no ASM code appended yet — normal, skip silently
        if not validate_asm_code(asm_code, name):
            skipped_code += 1
            continue  # malformed code — skip and warn
        patients[p["id"]] = {
            "asm_code": asm_code,
            "name": name,
            "chip": p.get("chip", ""),
        }
    log.info("  Patients with valid ASM codes (Active only): %d", len(patients))
    log.info("  Skipped — Inactive/Deceased status: %d", skipped_status)
    if skipped_code:
        log.warning("  Patients skipped due to invalid ASM code format: %d", skipped_code)
    return patients


# ---------------------------------------------------------------------------
# Build CSV rows
# ---------------------------------------------------------------------------

def build_microchip_rows(patients: dict[str, dict], asm_names: dict[str, str]) -> list[dict]:
    """One row per patient that has a chip number in DaySmart."""
    rows = []
    for pid, p in patients.items():
        chip = (p.get("chip") or "").strip()
        if chip and p["asm_code"] in asm_names:
            rows.append({
                "ANIMALCODE": p["asm_code"],
                "ANIMALNAME": asm_names[p["asm_code"]],
                "ANIMALMICROCHIP": chip,
            })
    log.info("Microchip rows: %d", len(rows))
    return rows


def build_vaccination_rows(token: str, patients: dict[str, dict], asm_names: dict[str, str]) -> list[dict]:
    """
    Pull /reminders filtered to Vaccinations and build ASM vaccination rows.
    """
    raw = ds_paginate(token, "reminders")
    rows = []
    for r in raw:
        # Only process vaccination reminders that have been given
        item = r.get("item") or {}
        if (item.get("type") or "").lower() != "vaccinations":
            continue
        given_date = r.get("givenDate", "")
        if not given_date:
            continue  # skip reminders not yet administered

        patient_id = (r.get("patient") or {}).get("id", "")
        patient = patients.get(patient_id)
        if not patient or patient["asm_code"] not in asm_names:
            continue  # no ASM code, or animal not currently in ASM — skip

        rows.append({
            "ANIMALCODE":          patient["asm_code"],
            "ANIMALNAME":          asm_names[patient["asm_code"]],
            "VACCINATIONTYPE":     item.get("label", ""),
            "VACCINATIONDATE":     fmt_date(given_date),
            "VACCINATIONDUEDATE":  fmt_date(r.get("dueDate", "")),
            "VACCINATIONCOMMENTS": r.get("note", ""),
        })

    log.info("Vaccination rows: %d", len(rows))
    return rows


def build_spayneuter_rows(token: str, patients: dict[str, dict], asm_names: dict[str, str]) -> list[dict]:
    """
    Pull /invoice-items and find spay/neuter procedures.
    Only matches items whose name contains 'spay' or 'neuter' (case-insensitive).
    """
    raw = ds_paginate(token, "invoice-items")
    rows = []
    seen = set()  # avoid duplicate neuter entries per animal

    for item in raw:
        name = (item.get("name") or item.get("displayName") or "").lower()
        if "spay" not in name and "neuter" not in name:
            continue

        patient_id = (item.get("patient") or {}).get("id", "")
        patient = patients.get(patient_id)
        if not patient or patient["asm_code"] not in asm_names:
            continue

        asm_code = patient["asm_code"]
        if asm_code in seen:
            continue  # already have a neuter/spay row for this animal
        seen.add(asm_code)

        rows.append({
            "ANIMALCODE":        asm_code,
            "ANIMALNAME":        asm_names[asm_code],
            "ANIMALNEUTERED":    "Y",
            "ANIMALNEUTEREDDATE": fmt_date(item.get("date", "")),
        })

    log.info("Spay/neuter rows: %d", len(rows))
    return rows


def build_medical_rows(token: str, patients: dict[str, dict], asm_names: dict[str, str]) -> list[dict]:
    """
    Pull /invoice-items and build medical regimen rows for medications,
    labs, dewormers, etc. Excludes spay/neuter (handled separately).
    """
    raw = ds_paginate(token, "invoice-items")

    # Item types to include as medical records in ASM
    INCLUDE_TYPES = {
        "medication", "medications",
        "laboratory / diagnostics", "labs + diagnostics",
        "dewormer", "dewormers",
        "treatment", "treatments",
        "supplement", "supplements",
        "preventative", "preventatives",
    }

    rows = []
    for item in raw:
        name = (item.get("name") or item.get("displayName") or "").strip()
        name_lower = name.lower()

        # Skip spay/neuter — handled by build_spayneuter_rows
        if "spay" in name_lower or "neuter" in name_lower:
            continue

        # Check item type
        item_type = (item.get("itemType") or {}).get("type", "").lower()
        item_type_label = (item.get("itemType") or {}).get("label", "").lower()
        if item_type not in INCLUDE_TYPES and item_type_label not in INCLUDE_TYPES:
            continue

        patient_id = (item.get("patient") or {}).get("id", "")
        patient = patients.get(patient_id)
        if not patient or patient["asm_code"] not in asm_names:
            continue

        qty = item.get("quantity", "")
        uom = (item.get("itemUom") or {}).get("label", "")
        dosage = f"{qty} {uom}".strip() if qty else ""

        rows.append({
            "ANIMALCODE":      patient["asm_code"],
            "ANIMALNAME":      asm_names[patient["asm_code"]],
            "MEDICALNAME":     name,
            "MEDICALDATE":     fmt_date(item.get("date", "")),
            "MEDICALDOSAGE":   dosage,
            "MEDICALCOMMENTS": f"Invoice: {(item.get('invoice') or {}).get('label', '')}",
        })

    log.info("Medical treatment rows: %d", len(rows))
    return rows


# ---------------------------------------------------------------------------
# ASM csv_import
# ---------------------------------------------------------------------------

def send_to_asm(rows: list[dict], description: str, dry_run: bool) -> bool:
    """
    Send a list of row dicts to ASM via csv_import.
    All rows must have the same keys (columns).

    Returns True if the batch was sent successfully (or there was nothing to
    send), False if the ASM import call failed. Callers use this to decide
    whether it's accurate to report these rows as synced.
    """
    if not rows:
        log.info("No rows to send for: %s", description)
        return True

    # Safety check: re-validate every ASM code before sending.
    # This is a last-resort guard — codes should already be validated in ds_get_patients,
    # but this ensures nothing slips through if rows are built by other means.
    safe_rows = []
    for row in rows:
        code = row.get("ANIMALCODE", "")
        if ASM_CODE_VALID.match(code):
            safe_rows.append(row)
        else:
            log.warning(
                "FINAL SAFETY CHECK — dropping row with invalid ANIMALCODE '%s' "
                "before sending to ASM. Row: %s", code, row
            )
    if len(safe_rows) < len(rows):
        log.warning(
            "%d row(s) blocked by final safety check for: %s",
            len(rows) - len(safe_rows), description
        )
    if not safe_rows:
        log.info("No safe rows remain to send for: %s", description)
        return True
    rows = safe_rows

    # Build CSV in memory
    output = io.StringIO()
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    csv_data = output.getvalue()

    if dry_run:
        log.info("[DRY RUN] Would send %d rows to ASM for: %s", len(rows), description)
        log.info("[DRY RUN] CSV preview:\n%s", csv_data)
        return True

    # Base64 encode
    encoded = base64.b64encode(csv_data.encode("utf-8")).decode("utf-8")

    log.info("Sending %d rows to ASM for: %s", len(rows), description)
    # POST, not GET — a GET query string can exceed the server's URL length
    # limit once a batch gets into the hundreds of rows (base64 CSV data is
    # large). POST puts the same params in the request body instead.
    resp = requests.post(
        f"{ASM_BASE_URL}/service",
        data={
            "method": "csv_import",
            "account": ASM_ACCOUNT,
            "username": ASM_USERNAME,
            "password": ASM_PASSWORD,
            "data": encoded,
            "encoding": "utf-8",
        },
        timeout=60,
    )

    if resp.status_code == 200:
        result = resp.json()
        errors = result.get("errors", [])
        log.info(
            "  ASM import result — rows: %d, success: %d, errors: %d",
            result.get("rows", 0),
            result.get("success", 0),
            len(errors),
        )
        if errors:
            for err in errors:
                log.warning("  Row error: %s", err)
        return True
    else:
        log.error("  ASM import failed: %s — %s", resp.status_code, resp.text[:300])
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Sync DaySmart medical data into ASM via csv_import.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build CSV rows and log/preview them without calling the ASM csv_import endpoint.",
    )
    args = parser.parse_args()

    log.info("=== DaySmart → ASM medical sync started at %s (dry_run=%s) ===",
              datetime.now(timezone.utc).isoformat(), args.dry_run)

    # 1. Authenticate with DaySmart
    token = ds_get_token()

    # 2. Fetch patients (only those with ASM codes in their name)
    log.info("Fetching DaySmart patients …")
    patients = ds_get_patients(token)

    if not patients:
        log.warning("No DaySmart patients have ASM codes yet. Run asm_daysmart_sync.py first.")
        return

    # 3. Fetch current ASM animal names (ASM requires ANIMALNAME on every row)
    log.info("Fetching ASM animal names …")
    asm_names = asm_get_animal_names()

    # 4. Build each type of CSV rows
    log.info("Building microchip records …")
    chip_rows = build_microchip_rows(patients, asm_names)

    if SYNC_VACCINATIONS:
        log.info("Building vaccination records …")
        vax_rows = build_vaccination_rows(token, patients, asm_names)
    else:
        log.info("Vaccination sync is temporarily disabled (SYNC_VACCINATIONS=False) — skipping.")
        vax_rows = []

    log.info("Building spay/neuter records …")
    sn_rows = build_spayneuter_rows(token, patients, asm_names)

    log.info("Building medical treatment records …")
    med_rows = build_medical_rows(token, patients, asm_names)

    # 5. Send each batch to ASM
    chip_ok = send_to_asm(chip_rows, "Microchip numbers", args.dry_run)
    vax_ok  = send_to_asm(vax_rows,  "Vaccinations", args.dry_run)
    sn_ok   = send_to_asm(sn_rows,   "Spay/Neuter", args.dry_run)
    med_ok  = send_to_asm(med_rows,  "Medical treatments", args.dry_run)

    # Guard: detect and delete any DS phantom records created as a side effect of csv_import.
    log.info("Running post-sync cleanup check for DS phantom records …")
    post_sync_cleanup(args.dry_run)

    # 6. Email a detail report of everything synced this run (skipped if MEDICAL_SYNC_REPORT_TO unset,
    # and skipped entirely in --dry-run since nothing was actually sent to ASM).
    # A batch that failed to send is reported as failed, not as synced — its
    # rows are never shown as if they made it into ASM.
    if not args.dry_run:
        failed = [
            name for name, ok in [
                ("Microchip Numbers", chip_ok),
                ("Vaccinations", vax_ok),
                ("Spay / Neuter", sn_ok),
                ("Medical Treatments", med_ok),
            ] if not ok
        ]
        send_sync_report(
            chip_rows if chip_ok else [],
            vax_rows if vax_ok else [],
            sn_rows if sn_ok else [],
            med_rows if med_ok else [],
            MEDICAL_SYNC_REPORT_TO,
            failed_sections=failed,
        )

    log.info("=== Sync complete at %s ===", datetime.now(timezone.utc).isoformat())


if __name__ == "__main__":
    main()
