"""Contact form — sends email via SMTP when configured."""

from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Form, HTTPException

from config import get_settings

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("/send")
async def send_contact_message(
    name: str = Form(..., min_length=1, max_length=200),
    email: str = Form(..., min_length=3, max_length=200),
    message: str = Form(..., min_length=1, max_length=20_000),
):
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        raise HTTPException(
            status_code=503,
            detail=(
                "Email is not configured on the server. Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD, "
                "and CONTACT_NOTIFY_EMAIL to backend/.env (see .env.example)."
            ),
        )
    to_addr = (settings.contact_notify_email or "").strip()
    if not to_addr:
        raise HTTPException(status_code=503, detail="Set CONTACT_NOTIFY_EMAIL in backend .env")

    from_addr = (settings.contact_from_email or settings.smtp_user).strip()

    subject = f"[FileGenie] Message from {name}"
    body = f"From: {name} <{email}>\n\n{message}"

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        if settings.smtp_use_tls:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(from_addr, [to_addr], msg.as_string())
        else:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(from_addr, [to_addr], msg.as_string())
    except smtplib.SMTPException as e:
        raise HTTPException(status_code=502, detail=f"Could not send email: {e!s}") from e
    except OSError as e:
        raise HTTPException(status_code=502, detail=f"Mail server error: {e!s}") from e

    return {"ok": True, "message": "Message sent."}
