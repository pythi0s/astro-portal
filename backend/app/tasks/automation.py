import asyncio
import logging

from app.db.database import async_session
from app.models.message_template import MessageChannel
from app.services.automation import execute_appointment_rules, execute_due_follow_up_rules
from app.services.message_delivery import deliver_logged_message
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, name="messaging.deliver_logged_message")
def deliver_logged_message_task(self, message_log_id: int):
    async def run() -> str:
        async with async_session() as session:
            return await deliver_logged_message(
                session,
                message_log_id,
                final_attempt=self.request.retries >= self.max_retries,
            )

    try:
        return {"status": asyncio.run(run())}
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            logger.exception("message delivery exhausted retries for log_id=%s", message_log_id)
            return {"status": "failed"}
        raise self.retry(exc=exc, countdown=60) from exc


def _enqueue_delivery(message_log_id: int, _channel: MessageChannel) -> None:
    deliver_logged_message_task.delay(message_log_id)


@celery_app.task(name="automation.scan_due_follow_ups", ignore_result=True)
def scan_due_follow_ups():
    async def run() -> dict[str, int]:
        async with async_session() as session:
            return await execute_due_follow_up_rules(session, _enqueue_delivery)

    try:
        summary = asyncio.run(run())
    except Exception:
        logger.exception("due follow-up automation scan failed")
        raise
    logger.info("due follow-up automation scan complete: %s", summary)
    return summary


@celery_app.task(name="automation.scan_appointments", ignore_result=True)
def scan_appointments():
    async def run() -> dict[str, int]:
        async with async_session() as session:
            return await execute_appointment_rules(session, _enqueue_delivery)

    try:
        summary = asyncio.run(run())
    except Exception:
        logger.exception("appointment automation scan failed")
        raise
    logger.info("appointment automation scan complete: %s", summary)
    return summary
