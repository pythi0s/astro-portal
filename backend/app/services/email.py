# app/services/email.py
import logging

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html_body: str) -> None:
    if not settings.smtp_host:
        raise RuntimeError("SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env")

    message = MIMEMultipart("alternative")
    message["From"] = settings.smtp_from_email or settings.smtp_user
    message["To"] = to
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        message,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=True,
    )
    logger.info("Email sent to %s: %s", to, subject)
