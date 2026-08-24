"""
ASM → DaySmart Patient Creation Script  (Task 1 of the nightly sync)
----------------------------------------------------------------------
Finds ASM shelter animals (on-shelter + foster) that have NO matching
DaySmart patient, then creates new DaySmart patient profiles for them
with the ASM shelter code embedded in the name.

Example: ASM animal "Biscuit" (A2024001) → DaySmart patient "Biscuit - A2024001"

Sex mapping uses ASM SEXNAME + NEUTERED integer → DaySmart sex id:
  Male   + intact  → 1 (Male intact)
  Male   + neutered → 2 (Male neutered)
  Female + intact  → 3 (Female intact)
  Female + spayed  → 4 (Female spayed)
  Unknown          → 5 (Unknown)

After creation, emails a report of newly created patients to the configured
recipients via the Resend API (RESEND_API_KEY + FROM_EMAIL in .env.asm_daysmart).

SETUP:
  1. Add DS_SHELTER_CLIENT_ID to .env.asm_daysmart.
     Run with --list-clients first to find the right ID.
  2. All other credentials are shared with the existing sync scripts.

Run (find shelter client):  python3 scripts/asm_to_daysmart_create_patients.py --list-clients
Run (dry run):               python3 scripts/asm_to_daysmart_create_patients.py --dry-run
Run (live):                  python3 scripts/asm_to_daysmart_create_patients.py
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

import requests

# ---------------------------------------------------------------------------
# Credentials — loaded from environment (see .env.asm_daysmart)
# ---------------------------------------------------------------------------

ASM_BASE_URL = os.environ.get("ASM_BASE_URL", "https://us01d.sheltermanager.com")
ASM_ACCOUNT  = os.environ["ASM_ACCOUNT"]
ASM_USERNAME = os.environ["ASM_USERNAME"]
ASM_PASSWORD = os.environ["ASM_PASSWORD"]

DS_CLIENT_ID         = os.environ["DS_CLIENT_ID"]
DS_CLIENT_SECRET     = os.environ["DS_CLIENT_SECRET"]
DS_API_KEY           = os.environ["DS_API_KEY"]
DS_DOMAIN            = os.environ["DS_DOMAIN"]
DS_SHELTER_CLIENT_ID = os.environ.get("DS_SHELTER_CLIENT_ID", "")

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
ASM_CODE_ANYWHERE = re.compile(r'\b([A-Z]\d{4,})\b')  # finds ASM codes anywhere in a name
ASM_CODE_VALID   = re.compile(r"^[A-Z]\d{7,8}$")


def normalise(s: str) -> str:
    return (s or "").strip().lower().replace(" & ", " and ")


def extract_asm_code(patient_name: str) -> str | None:
    m = ASM_CODE_PATTERN.search(patient_name)
    return m.group(1) if m else None


# ---------------------------------------------------------------------------
# ASM API
# ---------------------------------------------------------------------------

def asm_get_shelter_animals() -> list[dict]:
    """Fetch all current shelter animals from ASM."""
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
    log.info("DaySmart token obtained.")
    return resp.json()["access_token"]


def ds_scan_clients(token: str) -> tuple[dict, dict, dict, set[str], set[str], set[str], dict]:
    """
    Collects reference data from DaySmart:
      species_map      — normalised label → {id, label}
      sex_map          — normalised label → {id, label}
      breed_map        — normalised label → id
      asm_codes_in_ds  — set of ASM codes found in ANY DaySmart patient name
      ds_base_names    — normalised patient base names (ASM code suffix stripped)
      ds_full_names    — normalised full patient names
      clients_summary  — client id → {name, patient_count}

    Scans BOTH /clients (for reference data + client list) AND /patients (for
    complete duplicate detection — /clients nests only a subset of patients).
    """
    species_map: dict[str, dict]  = {}
    sex_map: dict[str, dict]      = {}
    breed_map: dict[str, int]     = {}
    asm_codes_in_ds: set[str]     = set()
    ds_base_names: set[str]       = set()
    ds_full_names: set[str]       = set()
    clients_summary: dict         = {}

    headers = {
        "Authorization": f"Bearer {token}",
        "x-api-key": DS_CLIENT_SECRET,
        "Accept": "application/json",
    }

    # Pass 1: /clients — collect reference maps (species/sex/breed) and client list
    url = f"{DS_DOMAIN}/api/1.0.0/{DS_API_KEY}/clients"
    page = 1
    while True:
        resp = requests.get(url, headers=headers, params={"page": page, "perPage": 200}, timeout=30)
        resp.raise_for_status()
        body = resp.json()["response"]
        for client in body.get("resources", []):
            cid   = client["id"]
            fname = client.get("firstName", "")
            lname = client.get("lastName", "")
            cname = (fname + " " + lname).strip() or client.get("companyName", "") or cid
            clients_summary[cid] = {"name": cname, "patient_count": len(client.get("patients", []))}
            for p in client.get("patients", []):
                sp = p.get("species")
                if isinstance(sp, dict) and sp.get("id"):
                    key = normalise(sp.get("label", ""))
                    if key and key not in species_map:
                        species_map[key] = {"id": sp["id"], "label": sp.get("label", "")}
                sx = p.get("sex")
                if isinstance(sx, dict) and sx.get("id"):
                    key = normalise(sx.get("label", ""))
                    if key and key not in sex_map:
                        sex_map[key] = {"id": sx["id"], "label": sx.get("label", "")}
                for breed in p.get("breeds", []):
                    if isinstance(breed, dict) and breed.get("id"):
                        key = normalise(breed.get("label", ""))
                        if key and key not in breed_map:
                            breed_map[key] = breed["id"]
        meta = body.get("meta", {})
        if page >= meta.get("lastPage", 1):
            break
        page += 1
    log.info("DaySmart: %d clients scanned for reference data.", len(clients_summary))

    # Pass 2: /patients — full scan for duplicate detection (catches all patients,
    # including those not nested under /clients responses)
    url = f"{DS_DOMAIN}/api/1.0.0/{DS_API_KEY}/patients"
    page = 1
    total_patients = 0
    while True:
        resp = requests.get(url, headers=headers, params={"page": page, "perPage": 200}, timeout=30)
        resp.raise_for_status()
        body = resp.json()["response"]
        for p in body.get("resources", []):
            total_patients += 1
            pname = p.get("name", "")
            ds_full_names.add(normalise(pname))
            base = ASM_CODE_PATTERN.sub("", pname).strip()
            ds_base_names.add(normalise(base))
            # Catch ASM codes in any position/format: "Name - CODE", "Name CODE 4 Paws", etc.
            for m in ASM_CODE_ANYWHERE.finditer(pname):
                asm_codes_in_ds.add(m.group(1))
            # Also collect reference data from full patient records
            sp = p.get("species")
            if isinstance(sp, dict) and sp.get("id"):
                key = normalise(sp.get("label", ""))
                if key and key not in species_map:
                    species_map[key] = {"id": sp["id"], "label": sp.get("label", "")}
            sx = p.get("sex")
            if isinstance(sx, dict) and sx.get("id"):
                key = normalise(sx.get("label", ""))
                if key and key not in sex_map:
                    sex_map[key] = {"id": sx["id"], "label": sx.get("label", "")}
            for breed in p.get("breeds", []):
                if isinstance(breed, dict) and breed.get("id"):
                    key = normalise(breed.get("label", ""))
                    if key and key not in breed_map:
                        breed_map[key] = breed["id"]
        meta = body.get("meta", {})
        if page >= meta.get("lastPage", 1):
            break
        page += 1

    log.info("DaySmart: %d total patients scanned for duplicates.", total_patients)
    log.info("  ASM codes already in DaySmart: %d", len(asm_codes_in_ds))
    log.info("  Unique patient base names: %d", len(ds_base_names))
    log.info("  Species available: %s", sorted(species_map.keys()))
    log.info("  Sexes available: %s", sorted(sex_map.keys()))
    log.info("  Breeds available: %d", len(breed_map))
    return species_map, sex_map, breed_map, asm_codes_in_ds, ds_base_names, ds_full_names, clients_summary


def ds_create_patient(token: str, payload: dict) -> bool:
    """POST a new patient to DaySmart."""
    url = f"{DS_DOMAIN}/api/1.0.0/{DS_API_KEY}/patients"
    headers = {
        "Authorization": f"Bearer {token}",
        "x-api-key": DS_CLIENT_SECRET,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=15)
    if resp.status_code in (200, 201):
        return True
    log.warning(
        "  Failed to create '%s': HTTP %s — %s",
        payload.get("name"), resp.status_code, resp.text[:400],
    )
    return False


# ---------------------------------------------------------------------------
# Mapping helpers
# ---------------------------------------------------------------------------

_SPECIES_SYNONYMS: dict[str, list[str]] = {
    "cat":    ["cat", "feline", "kitten"],
    "dog":    ["dog", "canine", "puppy"],
    "rabbit": ["rabbit", "bunny"],
    "bird":   ["bird", "avian", "parrot", "cockatiel"],
}


def map_species(asm_value: str, species_map: dict) -> dict | None:
    key = normalise(asm_value)
    if key in species_map:
        return species_map[key]
    for canonical, aliases in _SPECIES_SYNONYMS.items():
        if any(a in key for a in aliases):
            for ds_key, ds_val in species_map.items():
                if any(a in ds_key for a in aliases):
                    return ds_val
    return None


# DaySmart sex id lookup: (sex, is_neutered) → id
# ids confirmed from live DaySmart data:
#   1=Male (intact), 2=Male (neutered), 3=Female (intact), 4=Female (spayed), 5=Unknown
_DS_SEX_ID: dict[tuple[str, bool], int] = {
    ("male",   False): 1,
    ("male",   True):  2,
    ("female", False): 3,
    ("female", True):  4,
}


def map_sex_from_asm(sexname: str, neutered: int) -> int:
    """Map ASM SEXNAME + NEUTERED integer → DaySmart sex id."""
    s = (sexname or "").strip().lower()
    n = neutered == 1
    if "female" in s:
        return _DS_SEX_ID[("female", n)]
    if "male" in s:
        return _DS_SEX_ID[("male", n)]
    return 5  # Unknown


def map_breed(asm_value: str, breed_map: dict) -> int | None:
    key = normalise(asm_value)
    if key in breed_map:
        return breed_map[key]
    # Partial match (e.g. "domestic shorthair" vs "shorthair")
    for ds_key, ds_id in breed_map.items():
        if key in ds_key or ds_key in key:
            return ds_id
    # "Mix", "Mixed", or "Unknown" as last resort
    for ds_key, ds_id in breed_map.items():
        if any(word in ds_key for word in ("mix", "mixed", "unknown", "domestic")):
            return ds_id
    return None


# ---------------------------------------------------------------------------
# Email report (Task 2)
# ---------------------------------------------------------------------------

def send_creation_report(created_animals: list[dict], dry_run: bool) -> None:
    """Email a report of newly created DaySmart patients via Resend."""
    if not created_animals:
        log.info("No animals created — skipping creation report email.")
        return
    if not RESEND_API_KEY or not FROM_EMAIL:
        log.warning("RESEND_API_KEY or FROM_EMAIL not set — skipping creation report email.")
        return

    run_label = "[DRY RUN] " if dry_run else ""
    now = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")
    rows_html = "".join(
        f"<tr><td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['name']}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['code']}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['species']}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['sex']}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #eee'>{a['location']}</td></tr>"
        for a in created_animals
    )
    html = f"""
<div style='font-family:sans-serif;max-width:700px'>
  <h2 style='color:#2d6a4f'>{run_label}DaySmart Import Report — {now}</h2>
  <p>{len(created_animals)} animal(s) were newly created in DaySmart from ASM.</p>
  <table style='border-collapse:collapse;width:100%'>
    <thead>
      <tr style='background:#2d6a4f;color:#fff'>
        <th style='padding:8px 12px;text-align:left'>Name</th>
        <th style='padding:8px 12px;text-align:left'>ASM Code</th>
        <th style='padding:8px 12px;text-align:left'>Species</th>
        <th style='padding:8px 12px;text-align:left'>Sex</th>
        <th style='padding:8px 12px;text-align:left'>Location</th>
      </tr>
    </thead>
    <tbody>{rows_html}</tbody>
  </table>
  <p style='color:#888;font-size:12px;margin-top:20px'>
    Every Pet Matters / Sun Cities 4 Paws — automated nightly sync
  </p>
</div>
"""
    payload = {
        "from": FROM_EMAIL,
        "to": REPORT_TO,
        "subject": f"{run_label}DaySmart Import: {len(created_animals)} animal(s) added — {now}",
        "html": html,
    }
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=15,
    )
    if resp.status_code in (200, 201):
        log.info("Creation report emailed to %s", REPORT_TO)
    else:
        log.warning("Failed to send creation report: %s — %s", resp.status_code, resp.text[:200])


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Create DaySmart patient profiles for ASM shelter animals not yet in DaySmart."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Log intended creations without calling the DaySmart create endpoint.",
    )
    parser.add_argument(
        "--list-clients",
        action="store_true",
        help="List all DaySmart clients with patient counts, then exit. "
             "Use this to find DS_SHELTER_CLIENT_ID.",
    )
    args = parser.parse_args()

    log.info(
        "=== ASM → DaySmart patient creation started at %s (dry_run=%s) ===",
        datetime.now(timezone.utc).isoformat(), args.dry_run,
    )

    # 1. Authenticate
    token = ds_get_token()

    # 2. Scan DaySmart
    log.info("Scanning DaySmart clients/patients for reference data …")
    species_map, sex_map, breed_map, asm_codes_in_ds, ds_base_names, ds_full_names, clients_summary = ds_scan_clients(token)

    # --list-clients mode: print and exit
    if args.list_clients:
        log.info("--- DaySmart clients (sorted by patient count) ---")
        for cid, info in sorted(clients_summary.items(), key=lambda x: -x[1]["patient_count"]):
            log.info("  ID: %-14s  Patients: %-4d  Name: %s", cid, info["patient_count"], info["name"])
        log.info("Set DS_SHELTER_CLIENT_ID=<id> in .env.asm_daysmart, then re-run without --list-clients.")
        return

    # 3. Resolve shelter client
    shelter_client_id = DS_SHELTER_CLIENT_ID
    if not shelter_client_id:
        log.error(
            "DS_SHELTER_CLIENT_ID is not set. "
            "Run with --list-clients to identify the shelter's DaySmart client ID, "
            "then add DS_SHELTER_CLIENT_ID=<id> to .env.asm_daysmart."
        )
        sys.exit(1)
    if shelter_client_id not in clients_summary:
        log.error(
            "DS_SHELTER_CLIENT_ID='%s' was not found in DaySmart. "
            "Run --list-clients to verify the correct ID.",
            shelter_client_id,
        )
        sys.exit(1)
    log.info(
        "Shelter DaySmart client: %s (%s)",
        shelter_client_id, clients_summary[shelter_client_id]["name"],
    )

    # 4. Fetch ASM animals
    log.info("Fetching ASM shelter animals …")
    asm_animals = asm_get_shelter_animals()

    # 5. Find animals missing from DaySmart
    to_create = []
    skipped_in_ds    = 0
    skipped_bad_code = 0

    for animal in asm_animals:
        name = (animal.get("ANIMALNAME") or "").strip()
        code = (animal.get("SHELTERCODE") or "").strip()

        if not code:
            skipped_bad_code += 1
            continue
        if not ASM_CODE_VALID.match(code):
            log.warning("Skipping animal with unexpected code format: '%s'", code)
            skipped_bad_code += 1
            continue

        ds_name = f"{name} - {code}"

        # 1. Full "Name - CODE" already exists in DaySmart
        if normalise(ds_name) in ds_full_names:
            log.debug("  Already in DaySmart by full name+ID: '%s'", ds_name)
            skipped_in_ds += 1
            continue

        # 2. Base name (without code) already exists in DaySmart
        if normalise(name) in ds_base_names:
            log.info("  SKIPPED '%s' — name '%s' already exists in DaySmart (no ASM tag yet).", ds_name, name)
            skipped_in_ds += 1
            continue

        # 3. ASM code already tagged to any patient in DaySmart
        if code in asm_codes_in_ds:
            log.debug("  Already in DaySmart by ASM code: '%s'", code)
            skipped_in_ds += 1
            continue

        to_create.append(animal)

    log.info(
        "ASM animals: %d total → %d already in DaySmart, %d to create, %d bad/missing code.",
        len(asm_animals), skipped_in_ds, len(to_create), skipped_bad_code,
    )

    if not to_create:
        log.info("Nothing to do — all ASM animals are already in DaySmart.")
        log.info("=== Sync complete at %s ===", datetime.now(timezone.utc).isoformat())
        return

    # 6. Create patients
    created_animals: list[dict] = []
    failed          = 0
    skipped_no_species = 0

    # DaySmart sex label lookup for logging
    _DS_SEX_LABEL = {1: "Male (intact)", 2: "Male (neutered)", 3: "Female (intact)",
                     4: "Female (spayed)", 5: "Unknown"}

    for animal in to_create:
        name        = (animal.get("ANIMALNAME") or "").strip()
        code        = (animal.get("SHELTERCODE") or "").strip()
        asm_species = (animal.get("SPECIESNAME") or animal.get("ANIMALTYPENAME") or "").strip()
        asm_sexname = (animal.get("SEXNAME") or "").strip()
        asm_neutered = int(animal.get("NEUTERED") or 0)
        asm_breed   = (animal.get("BREED1NAME") or animal.get("BREEDNAME") or "").strip()
        asm_color   = (animal.get("BASECOLOURNAME") or "").strip()
        asm_dob     = (animal.get("DATEOFBIRTH") or "").strip()
        asm_chip    = (animal.get("IDENTICHIPNUMBER") or "").strip()
        asm_loc     = (animal.get("SHELTERLOCATIONNAME") or animal.get("ACTIVEMOVEMENTTYPENAME") or "").strip()
        ds_name     = f"{name} - {code}"

        # Species is required — skip if unmappable
        sp = map_species(asm_species, species_map)
        if sp is None:
            log.warning(
                "  SKIPPED '%s' — cannot map ASM species '%s' to any DaySmart species %s.",
                ds_name, asm_species, sorted(species_map.keys()),
            )
            skipped_no_species += 1
            continue

        sex_id   = map_sex_from_asm(asm_sexname, asm_neutered)
        breed_id = map_breed(asm_breed, breed_map)

        if breed_id is None:
            log.warning("  '%s' — breed '%s' not mapped; omitting breed field.", ds_name, asm_breed)

        payload: dict = {
            "name":    ds_name,
            "client":  {"id": shelter_client_id},
            "species": {"id": sp["id"]},
            "sex":     {"id": sex_id},
            "status":  "Active",
        }
        if breed_id is not None:
            payload["breeds"] = [{"id": breed_id}]
        if asm_color:
            payload["color"] = asm_color
        if asm_chip:
            payload["chip"] = asm_chip
        if asm_dob:
            try:
                dob_dt = datetime.fromisoformat(asm_dob.replace("Z", "+00:00"))
                payload["birthday"] = dob_dt.strftime("%Y-%m-%dT%H:%M:%S")
            except Exception:
                pass

        sex_label = _DS_SEX_LABEL.get(sex_id, "Unknown")

        if args.dry_run:
            log.info(
                "[DRY RUN] Would create: name='%s'  species='%s'  sex='%s'  breed='%s'  color='%s'  chip='%s'",
                ds_name, sp["label"], sex_label, asm_breed or "(none)", asm_color or "(none)", asm_chip or "(none)",
            )
            created_animals.append({"name": name, "code": code, "species": sp["label"],
                                     "sex": sex_label, "location": asm_loc})
            continue

        log.info("Creating patient: '%s'  (species=%s  sex=%s)", ds_name, sp["label"], sex_label)
        success = ds_create_patient(token, payload)
        if success:
            created_animals.append({"name": name, "code": code, "species": sp["label"],
                                     "sex": sex_label, "location": asm_loc})
        else:
            failed += 1

    # 7. Email creation report (Task 2)
    send_creation_report(created_animals, args.dry_run)

    # 8. Summary
    log.info("--- Summary ---")
    log.info("Created%s: %d", " (would create)" if args.dry_run else "", len(created_animals))
    log.info("Already in DaySmart (skipped): %d", skipped_in_ds)
    log.info("Skipped — species not mappable: %d", skipped_no_species)
    log.info("Failed to create: %d", failed)
    log.info("=== Sync complete at %s ===", datetime.now(timezone.utc).isoformat())


if __name__ == "__main__":
    main()
