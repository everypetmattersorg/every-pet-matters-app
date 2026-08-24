"""
Shared HTML/email report builder for the DaySmart → ASM medical sync.
Used by both daysmart_to_asm_medical_sync.py (auto-sent after every sync run)
and daysmart_to_asm_medical_sync_report.py (standalone/ad-hoc report).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

import requests

RESEND_API_KEY = os.environ.get("FOURPAWS_RESEND_API_KEY", os.environ.get("RESEND_API_KEY", ""))
FROM_EMAIL     = os.environ.get("FROM_EMAIL", "noreply@everypetmatters.org")

log = logging.getLogger(__name__)


def send_email(to: list[str], subject: str, text_body: str, html_body: str) -> bool:
    if not RESEND_API_KEY:
        log.error("RESEND_API_KEY / FOURPAWS_RESEND_API_KEY is not set — skipping email.")
        return False
    if not to:
        log.warning("No report recipients configured — skipping email.")
        return False
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        json={"from": FROM_EMAIL, "to": to, "subject": subject, "text": text_body, "html": html_body},
        timeout=15,
    )
    if resp.status_code in (200, 201):
        log.info("Report emailed to %s (id=%s)", ", ".join(to), resp.json().get("id"))
        return True
    log.error("Failed to send email: %s — %s", resp.status_code, resp.text[:300])
    return False


def html_table(rows: list[dict]) -> str:
    if not rows:
        return "<p style='color:#888;font-size:13px'>None this run.</p>"
    cols = list(rows[0].keys())
    head = "".join(f"<th style='text-align:left;padding:4px 12px 4px 0;border-bottom:1px solid #ddd'>{c}</th>" for c in cols)
    body = "".join(
        "<tr>" + "".join(f"<td style='padding:4px 12px 4px 0;font-size:13px'>{r.get(c, '')}</td>" for c in cols) + "</tr>"
        for r in rows
    )
    return f"<table style='border-collapse:collapse;width:100%'><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


def text_table(rows: list[dict]) -> str:
    if not rows:
        return "  None this run.\n"
    return "\n".join("  " + ", ".join(f"{k}: {v}" for k, v in r.items()) for r in rows) + "\n"


def build_report(chip_rows, vax_rows, sn_rows, med_rows, run_date: str, failed_sections: list[str] | None = None) -> tuple[str, str, str]:
    failed_sections = failed_sections or []
    subject = f"DaySmart → ASM Medical Sync — Detail Report ({run_date})"
    if failed_sections:
        subject += " — SEND FAILED: " + ", ".join(failed_sections)

    warning_text = ""
    if failed_sections:
        warning_text = (
            "\n*** WARNING: the following section(s) FAILED TO SEND to ASM and were NOT synced this run: "
            + ", ".join(failed_sections) + " ***\n"
        )

    text_body = "\n".join([
        "DaySmart → ASM Medical Sync — Detail Report",
        f"Generated: {run_date}",
        warning_text,
        f"Microchips ({len(chip_rows)}):",
        text_table(chip_rows),
        f"Vaccinations ({len(vax_rows)}):",
        text_table(vax_rows),
        f"Spay/Neuter ({len(sn_rows)}):",
        text_table(sn_rows),
        f"Medical treatments ({len(med_rows)}):",
        text_table(med_rows),
    ])

    def section(title: str, rows: list[dict]) -> str:
        if title in failed_sections:
            return f"""
            <h3 style='color:#c00;margin-bottom:4px'>{title} — SEND FAILED, NOT SYNCED</h3>
            <p style='color:#c00;font-size:13px'>The ASM import call for this section failed. No rows in this category were updated in ASM this run.</p>
            """
        return f"""
        <h3 style='color:#333;margin-bottom:4px'>{title} ({len(rows)})</h3>
        {html_table(rows)}
        """

    warning_html = ""
    if failed_sections:
        warning_html = f"""
      <p style='color:#c00;font-weight:bold;background:#fee;padding:10px;border:1px solid #c00'>
        WARNING: the following section(s) failed to send to ASM and were NOT synced this run: {", ".join(failed_sections)}
      </p>
        """

    html_body = f"""
    <div style='font-family:Arial,sans-serif;max-width:820px;margin:0 auto'>
      <h2 style='color:#333'>DaySmart → ASM Medical Sync — Detail Report</h2>
      <p style='color:#666'>Generated: {run_date}</p>
      <p style='color:#666;font-size:13px'>Every row below was written to ASM via csv_import on existing animal records only — no new animals are ever created by this sync.</p>
      {warning_html}
      {section("Microchip Numbers", chip_rows)}
      {section("Vaccinations", vax_rows)}
      {section("Spay / Neuter", sn_rows)}
      {section("Medical Treatments", med_rows)}

      <p style='color:#aaa;font-size:12px;margin-top:32px'>
        Automated report from Every Pet Matters · DaySmart → ASM medical sync
      </p>
    </div>
    """

    return subject, text_body, html_body


def send_sync_report(chip_rows, vax_rows, sn_rows, med_rows, recipients: list[str], failed_sections: list[str] | None = None) -> None:
    """Build and send the report for rows already synced in this run. No-op if no recipients."""
    if not recipients:
        log.info("MEDICAL_SYNC_REPORT_TO not set — skipping detail report email.")
        return
    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    subject, text_body, html_body = build_report(chip_rows, vax_rows, sn_rows, med_rows, run_date, failed_sections)
    log.info("Sending medical sync detail report to %s …", ", ".join(recipients))
    send_email(recipients, subject, text_body, html_body)
