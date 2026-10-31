"""Appointment confirmations and reminders (automation triggers)."""

from datetime import UTC, datetime

from sqlmodel import select

from app.models.appointment import Appointment, AppointmentStatus
from app.models.automation_rule import AutomationRule, AutomationTrigger
from app.models.customer import Customer
from app.models.customer_account import CustomerAccount
from app.models.message_log import MessageLog, MessageStatus
from app.models.message_template import MessageChannel, MessageTemplate
from app.services.automation import execute_appointment_rules

RULE_CREATED = datetime(2026, 9, 1, 0, 0)
# Appointment wall-clock times are IST; `now` values below are UTC (IST-5:30).
START_IST = datetime(2026, 9, 10, 10, 0)
BOOKED_AT_UTC = datetime(2026, 9, 8, 6, 0)


async def _seed(
    session_factory,
    *,
    trigger=AutomationTrigger.appointment_reminder,
    channel=MessageChannel.whatsapp,
    offset_hours=24,
    email="asha@example.com",
    opt_in=True,
    booked_at=BOOKED_AT_UTC,
    status=AppointmentStatus.booked,
    with_account=True,
):
    async with session_factory() as session:
        template = MessageTemplate(
            name="Reminder",
            channel=channel,
            subject="Your visit on {{appointment_date}}",
            body=(
                "Namaste {{customer_name}}, see you on {{appointment_date}} at "
                "{{appointment_time}} ({{appointment_duration}})."
            ),
        )
        customer = Customer(name="Asha", phone="+919800000001", email=email)
        session.add_all([template, customer])
        await session.flush()
        if with_account:
            session.add(
                CustomerAccount(
                    customer_id=customer.id,
                    phone="+919800000001",
                    hashed_password="x",
                    reminders_opt_in=opt_in,
                )
            )
        rule = AutomationRule(
            name="Reminder rule",
            trigger=trigger,
            template_id=template.id,
            channel=channel,
            offset_hours=offset_hours,
            created_at=RULE_CREATED,
        )
        appointment = Appointment(
            customer_id=customer.id,
            start_at=START_IST,
            end_at=START_IST.replace(minute=30),
            duration_minutes=30,
            status=status,
            created_at=booked_at,
        )
        session.add_all([rule, appointment])
        await session.commit()
        return rule.id, appointment.id


async def _run(session_factory, now: datetime):
    enqueued: list[int] = []
    async with session_factory() as session:
        summary = await execute_appointment_rules(
            session, lambda log_id, _channel: enqueued.append(log_id), now=now
        )
        logs = (await session.execute(select(MessageLog))).scalars().all()
    return summary, enqueued, logs


def utc(*args) -> datetime:
    return datetime(*args, tzinfo=UTC)


async def test_reminder_sent_once_inside_window_with_rendered_placeholders(session_factory):
    rule_id, appointment_id = await _seed(session_factory)

    # 24.5h before (09:30 IST on the 9th): too early.
    summary, enqueued, logs = await _run(session_factory, utc(2026, 9, 9, 4, 0))
    assert summary["messages_queued"] == 0 and logs == []

    # 23h59m before: due.
    summary, enqueued, logs = await _run(session_factory, utc(2026, 9, 9, 4, 31))
    assert summary == {"rules_scanned": 1, "schedules_created": 1, "messages_queued": 1}
    [log] = logs
    assert enqueued == [log.id]
    assert log.status == MessageStatus.queued
    assert log.channel == "whatsapp"
    assert log.recipient == "+919800000001"
    assert log.body_snapshot == (
        "Namaste Asha, see you on Thu, 10 Sep 2026 at 10:00 AM (30 minutes)."
    )
    assert log.automation_event_key == (
        f"appointment_reminder:{rule_id}:appointment:{appointment_id}"
    )

    # Later scans never resend.
    summary, enqueued, logs = await _run(session_factory, utc(2026, 9, 10, 2, 0))
    assert summary["messages_queued"] == 0 and len(logs) == 1


async def test_reminder_not_sent_after_start_or_when_cancelled(session_factory):
    await _seed(session_factory, status=AppointmentStatus.cancelled)
    _, _, logs = await _run(session_factory, utc(2026, 9, 9, 23, 0))
    assert logs == []

    _, _, logs = await _run(session_factory, utc(2026, 9, 10, 5, 0))  # after start
    assert logs == []


async def test_reminder_skipped_when_booked_after_reminder_moment(session_factory):
    await _seed(session_factory, booked_at=datetime(2026, 9, 9, 20, 0))
    _, _, logs = await _run(session_factory, utc(2026, 9, 9, 21, 0))
    assert logs == []


async def test_customer_opt_out_is_respected(session_factory):
    await _seed(session_factory, opt_in=False)
    _, _, logs = await _run(session_factory, utc(2026, 9, 9, 23, 0))
    assert logs == []


async def test_email_rule_skips_customers_without_email(session_factory):
    await _seed(session_factory, channel=MessageChannel.email, email=None)
    _, _, logs = await _run(session_factory, utc(2026, 9, 9, 23, 0))
    assert logs == []


async def test_email_reminder_renders_subject(session_factory):
    await _seed(session_factory, channel=MessageChannel.email)
    _, _, [log] = await _run(session_factory, utc(2026, 9, 9, 23, 0))
    assert log.recipient == "asha@example.com"
    assert log.subject == "Your visit on Thu, 10 Sep 2026"


async def test_booking_confirmation_sent_for_new_bookings_only(session_factory):
    await _seed(session_factory, trigger=AutomationTrigger.appointment_booked, offset_hours=0)
    summary, _, [log] = await _run(session_factory, utc(2026, 9, 8, 6, 2))
    assert summary["messages_queued"] == 1
    assert log.automation_event_key.startswith("appointment_booked:")
    summary, _, logs = await _run(session_factory, utc(2026, 9, 8, 6, 4))
    assert summary["messages_queued"] == 0 and len(logs) == 1


async def test_booking_confirmation_ignores_bookings_before_rule_or_too_old(session_factory):
    await _seed(
        session_factory,
        trigger=AutomationTrigger.appointment_booked,
        booked_at=datetime(2026, 8, 31, 12, 0),
    )
    _, _, logs = await _run(session_factory, utc(2026, 9, 1, 1, 0))
    assert logs == []


async def test_booking_confirmation_lookback_limit(session_factory):
    await _seed(
        session_factory,
        trigger=AutomationTrigger.appointment_booked,
        booked_at=datetime(2026, 9, 5, 6, 0),
    )
    _, _, logs = await _run(session_factory, utc(2026, 9, 8, 6, 0))  # 3 days after booking
    assert logs == []


async def test_inactive_rule_and_inactive_template_are_ignored(session_factory):
    rule_id, _ = await _seed(session_factory)
    async with session_factory() as session:
        rule = await session.get(AutomationRule, rule_id)
        rule.is_active = False
        await session.commit()
    summary, _, logs = await _run(session_factory, utc(2026, 9, 9, 23, 0))
    assert summary["rules_scanned"] == 0 and logs == []


async def test_enqueue_failure_marks_log_failed(session_factory):
    await _seed(session_factory)

    def boom(_log_id, _channel):
        raise RuntimeError("broker down")

    async with session_factory() as session:
        summary = await execute_appointment_rules(session, boom, now=utc(2026, 9, 9, 23, 0))
        [log] = (await session.execute(select(MessageLog))).scalars().all()
    assert summary["messages_queued"] == 0
    assert log.status == MessageStatus.failed


async def test_rule_api_validates_reminder_hours(client):
    template = await client.post(
        "/templates/",
        json={"name": "WA reminder", "channel": "whatsapp", "body": "Hi {{customer_name}}"},
    )
    template_id = template.json()["id"]
    base = {
        "name": "Day-before reminder",
        "trigger": "appointment_reminder",
        "template_id": template_id,
        "channel": "whatsapp",
    }
    bad = await client.post("/admin/automation-rules/", json={**base, "offset_hours": 0})
    assert bad.status_code == 422
    good = await client.post("/admin/automation-rules/", json={**base, "offset_hours": 24})
    assert good.status_code == 201, good.text
    assert good.json()["offset_hours"] == 24

    confirm = await client.post(
        "/admin/automation-rules/",
        json={**base, "name": "Confirmation", "trigger": "appointment_booked"},
    )
    assert confirm.status_code == 201, confirm.text


async def test_portal_reminder_opt_in_round_trip(raw_client):
    resp = await raw_client.post(
        "/portal/auth/register",
        json={
            "name": "Ravi",
            "phone": "9811111111",
            "password": "portal-pass-123",
            "reminders_opt_in": False,
        },
    )
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}
    profile = (await raw_client.get("/portal/profile", headers=headers)).json()
    assert profile["reminders_opt_in"] is False

    updated = await raw_client.put(
        "/portal/profile", json={"reminders_opt_in": True}, headers=headers
    )
    assert updated.json()["reminders_opt_in"] is True
