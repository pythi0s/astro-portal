# app/services/whatsapp.py
from twilio.rest import Client

from app.core.config import settings


async def send_whatsapp(to: str, body: str) -> str:
    """Send a WhatsApp message via Twilio. Returns the message SID."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise RuntimeError(
            "Twilio credentials not configured. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in .env"
        )

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

    # Ensure 'whatsapp:' prefix
    wa_to = to if to.startswith("whatsapp:") else f"whatsapp:{to}"
    wa_from = settings.twilio_whatsapp_from
    if not wa_from.startswith("whatsapp:"):
        wa_from = f"whatsapp:{wa_from}"

    message = client.messages.create(
        body=body,
        from_=wa_from,
        to=wa_to,
    )
    return message.sid
