from unittest.mock import AsyncMock

import pytest

from app.models.customer import Customer
from app.models.message_log import MessageLog, MessageStatus
from app.models.message_schedule import MessageSchedule, ScheduleStatus
from app.models.message_template import MessageChannel, MessageTemplate
from app.services.message_delivery import deliver_logged_message


async def _seed_delivery(session_factory, channel: MessageChannel):
    async with session_factory() as session:
        customer = Customer(
            name="Asha",
            email="asha@example.com",
            phone="+919999999999",
        )
        template = MessageTemplate(
            name="Reminder",
            channel=channel,
            subject="Follow-up" if channel == MessageChannel.email else None,
            body="Reminder body",
        )
        session.add_all([customer, template])
        await session.flush()
        schedule = MessageSchedule(
            template_id=template.id,
            channel=channel,
            event_key=f"test:{channel.value}",
            scheduled_for=customer.created_at,
            total_count=1,
            status=ScheduleStatus.queued,
        )
        session.add(schedule)
        await session.flush()
        log = MessageLog(
            customer_id=customer.id,
            template_id=template.id,
            schedule_id=schedule.id,
            channel=channel.value,
            recipient=(customer.email if channel == MessageChannel.email else customer.phone),
            subject=template.subject,
            body_snapshot=template.body,
            status=MessageStatus.queued,
        )
        session.add(log)
        await session.commit()
        return log.id, schedule.id


async def test_email_delivery_updates_log_and_schedule(session_factory):
    log_id, schedule_id = await _seed_delivery(session_factory, MessageChannel.email)
    email_sender = AsyncMock()
    whatsapp_sender = AsyncMock()

    async with session_factory() as session:
        result = await deliver_logged_message(
            session,
            log_id,
            email_sender=email_sender,
            whatsapp_sender=whatsapp_sender,
        )
        log = await session.get(MessageLog, log_id)
        schedule = await session.get(MessageSchedule, schedule_id)

    assert result == "sent"
    email_sender.assert_awaited_once_with("asha@example.com", "Follow-up", "Reminder body")
    whatsapp_sender.assert_not_awaited()
    assert log.status == MessageStatus.sent
    assert log.sent_at is not None
    assert schedule.status == ScheduleStatus.completed
    assert schedule.sent_count == 1
    assert schedule.failed_count == 0


async def test_whatsapp_delivery_records_provider_id(session_factory):
    log_id, _ = await _seed_delivery(session_factory, MessageChannel.whatsapp)
    whatsapp_sender = AsyncMock(return_value="SM123")

    async with session_factory() as session:
        result = await deliver_logged_message(
            session,
            log_id,
            email_sender=AsyncMock(),
            whatsapp_sender=whatsapp_sender,
        )
        log = await session.get(MessageLog, log_id)

    assert result == "sent"
    assert log.provider_message_id == "SM123"


async def test_retryable_failure_stays_queued_and_sanitized(session_factory):
    log_id, schedule_id = await _seed_delivery(session_factory, MessageChannel.email)
    email_sender = AsyncMock(side_effect=RuntimeError("smtp.internal:587 refused"))

    async with session_factory() as session:
        with pytest.raises(RuntimeError, match="refused"):
            await deliver_logged_message(session, log_id, email_sender=email_sender)
        log = await session.get(MessageLog, log_id)
        schedule = await session.get(MessageSchedule, schedule_id)

    assert log.status == MessageStatus.queued
    assert log.retry_count == 1
    assert "smtp.internal" not in log.error_message
    assert schedule.status == ScheduleStatus.in_progress


async def test_final_failure_completes_schedule_as_failed(session_factory):
    log_id, schedule_id = await _seed_delivery(session_factory, MessageChannel.email)
    email_sender = AsyncMock(side_effect=RuntimeError("provider secret"))

    async with session_factory() as session:
        with pytest.raises(RuntimeError):
            await deliver_logged_message(
                session,
                log_id,
                final_attempt=True,
                email_sender=email_sender,
            )
        log = await session.get(MessageLog, log_id)
        schedule = await session.get(MessageSchedule, schedule_id)

    assert log.status == MessageStatus.failed
    assert log.retry_count == 1
    assert schedule.status == ScheduleStatus.completed
    assert schedule.failed_count == 1


async def test_completed_delivery_is_idempotent(session_factory):
    log_id, _ = await _seed_delivery(session_factory, MessageChannel.email)
    sender = AsyncMock()

    async with session_factory() as session:
        log = await session.get(MessageLog, log_id)
        log.status = MessageStatus.sent
        await session.commit()
        result = await deliver_logged_message(session, log_id, email_sender=sender)

    assert result == "already_delivered"
    sender.assert_not_awaited()
