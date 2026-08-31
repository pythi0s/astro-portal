from collections.abc import Awaitable, Callable
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.message_log import MessageLog, MessageStatus
from app.models.message_schedule import MessageSchedule, ScheduleStatus
from app.models.message_template import MessageChannel
from app.services.email import send_email
from app.services.whatsapp import send_whatsapp

EmailSender = Callable[[str, str, str], Awaitable[None]]
WhatsAppSender = Callable[[str, str], Awaitable[str]]

_SANITIZED_SEND_ERROR = "Send failed — see server logs for details."


async def _refresh_schedule(session: AsyncSession, schedule_id: int | None) -> None:
    if schedule_id is None:
        return
    schedule = await session.get(MessageSchedule, schedule_id)
    if schedule is None:
        return

    sent_count = await session.scalar(
        select(func.count()).select_from(MessageLog).where(
            MessageLog.schedule_id == schedule_id,
            MessageLog.status.in_(
                (MessageStatus.sent, MessageStatus.delivered, MessageStatus.read)
            ),
        )
    )
    failed_count = await session.scalar(
        select(func.count()).select_from(MessageLog).where(
            MessageLog.schedule_id == schedule_id,
            MessageLog.status == MessageStatus.failed,
        )
    )
    schedule.sent_count = sent_count or 0
    schedule.failed_count = failed_count or 0
    finished = schedule.sent_count + schedule.failed_count
    schedule.status = (
        ScheduleStatus.completed if finished >= schedule.total_count else ScheduleStatus.in_progress
    )
    schedule.updated_at = datetime.utcnow()
    session.add(schedule)


async def deliver_logged_message(
    session: AsyncSession,
    message_log_id: int,
    *,
    final_attempt: bool = False,
    email_sender: EmailSender = send_email,
    whatsapp_sender: WhatsAppSender = send_whatsapp,
) -> str:
    log = await session.get(MessageLog, message_log_id)
    if log is None:
        return "missing"
    if log.status in (MessageStatus.sent, MessageStatus.delivered, MessageStatus.read):
        return "already_delivered"

    try:
        if log.channel == MessageChannel.email.value:
            await email_sender(
                log.recipient,
                log.subject or "Notification",
                log.body_snapshot or "",
            )
            provider_message_id = None
        elif log.channel == MessageChannel.whatsapp.value:
            provider_message_id = await whatsapp_sender(
                log.recipient,
                log.body_snapshot or "",
            )
        else:
            raise ValueError(f"Unsupported message channel: {log.channel}")
    except Exception:
        log.retry_count += 1
        log.error_message = _SANITIZED_SEND_ERROR
        log.status = MessageStatus.failed if final_attempt else MessageStatus.queued
        session.add(log)
        await _refresh_schedule(session, log.schedule_id)
        await session.commit()
        raise

    log.status = MessageStatus.sent
    log.error_message = None
    log.provider_message_id = provider_message_id
    log.sent_at = datetime.utcnow()
    session.add(log)
    await _refresh_schedule(session, log.schedule_id)
    await session.commit()
    return "sent"
