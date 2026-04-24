import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def send_email_task(self, customer_id: int, template_id: int, visit_id: int | None = None):
    """Send email asynchronously via Celery."""
    import asyncio

    from app.db.database import async_session_factory
    from app.models.customer import Customer
    from app.models.message_template import MessageTemplate
    from app.services.email import send_email as send_email_svc

    async def _send():
        async with async_session_factory() as session:
            from sqlmodel import select
            customer = (
                await session.execute(select(Customer).where(Customer.id == customer_id))
            ).scalar_one_or_none()
            template = (
                await session.execute(
                    select(MessageTemplate).where(MessageTemplate.id == template_id)
                )
            ).scalar_one_or_none()
            if not customer or not template:
                return {"status": "error", "detail": "Customer or template not found"}
            body = template.body_text
            placeholders = {
                "name": customer.name,
                "phone": customer.phone or "",
                "email": customer.email or "",
            }
            for key, val in placeholders.items():
                body = body.replace("{{" + key + "}}", val)
            await send_email_svc(
                to=customer.email,
                subject=template.subject or "Notification",
                body=body,
            )
            return {"status": "sent"}

    try:
        return asyncio.run(_send())
    except Exception as exc:
        logger.error("send_email_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60) from exc


@celery_app.task(bind=True, max_retries=3)
def send_whatsapp_task(self, customer_id: int, template_id: int, visit_id: int | None = None):
    """Send WhatsApp message asynchronously via Celery."""
    import asyncio

    from app.db.database import async_session_factory
    from app.models.customer import Customer
    from app.models.message_template import MessageTemplate
    from app.services.whatsapp import send_whatsapp

    async def _send():
        async with async_session_factory() as session:
            from sqlmodel import select
            customer = (
                await session.execute(select(Customer).where(Customer.id == customer_id))
            ).scalar_one_or_none()
            template = (
                await session.execute(
                    select(MessageTemplate).where(MessageTemplate.id == template_id)
                )
            ).scalar_one_or_none()
            if not customer or not template:
                return {"status": "error", "detail": "Customer or template not found"}
            body = template.body_text
            placeholders = {
                "name": customer.name,
                "phone": customer.phone or "",
                "email": customer.email or "",
            }
            for key, val in placeholders.items():
                body = body.replace("{{" + key + "}}", val)
            sid = await send_whatsapp(to=customer.phone, body=body)
            return {"status": "sent", "sid": sid}

    try:
        return asyncio.run(_send())
    except Exception as exc:
        logger.error("send_whatsapp_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60) from exc
