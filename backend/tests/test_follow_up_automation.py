from datetime import UTC, date, datetime

from sqlmodel import select

from app.models.automation_rule import AutomationRule, AutomationTrigger
from app.models.customer import Customer
from app.models.message_log import MessageLog, MessageStatus
from app.models.message_schedule import MessageSchedule, ScheduleStatus
from app.models.message_template import MessageChannel, MessageTemplate
from app.models.visit import Visit
from app.services.automation import execute_due_follow_up_rules


async def _seed_follow_up_rule(session_factory, *, offset_days: int = -1):
    async with session_factory() as session:
        template = MessageTemplate(
            name="Follow-up email",
            channel=MessageChannel.email,
            subject="Follow-up for {{customer_name}}",
            body="Hello {{name}}, your follow-up is due.",
        )
        customer = Customer(
            name="Asha",
            email="asha@example.com",
            city="Pune",
            is_active=True,
        )
        session.add(template)
        session.add(customer)
        await session.flush()

        rule = AutomationRule(
            name="Due follow-up",
            trigger=AutomationTrigger.follow_up_due,
            template_id=template.id,
            channel=MessageChannel.email,
            offset_days=offset_days,
            filter={"city": "Pune"},
            timezone="Asia/Kolkata",
            send_window_start_hour=9,
            send_window_end_hour=18,
        )
        visit = Visit(
            customer_id=customer.id,
            follow_up_date=date(2026, 9, 2),
            is_active=True,
        )
        session.add(rule)
        session.add(visit)
        await session.commit()
        return rule.id, customer.id, visit.id


async def test_due_follow_up_is_logged_enqueued_and_deduplicated(session_factory):
    rule_id, customer_id, visit_id = await _seed_follow_up_rule(session_factory)
    enqueued: list[tuple[int, MessageChannel]] = []

    async with session_factory() as session:
        first = await execute_due_follow_up_rules(
            session,
            lambda log_id, channel: enqueued.append((log_id, channel)),
            now=datetime(2026, 9, 1, 5, 0, tzinfo=UTC),
        )
        second = await execute_due_follow_up_rules(
            session,
            lambda log_id, channel: enqueued.append((log_id, channel)),
            now=datetime(2026, 9, 1, 5, 15, tzinfo=UTC),
        )

        logs = (await session.execute(select(MessageLog))).scalars().all()
        schedules = (await session.execute(select(MessageSchedule))).scalars().all()

    assert first == {"rules_scanned": 1, "schedules_created": 1, "messages_queued": 1}
    assert second == {"rules_scanned": 1, "schedules_created": 0, "messages_queued": 0}
    assert len(enqueued) == 1
    assert len(logs) == 1
    assert logs[0].status == MessageStatus.queued
    assert logs[0].automation_rule_id == rule_id
    assert logs[0].customer_id == customer_id
    assert logs[0].visit_id == visit_id
    assert logs[0].subject == "Follow-up for Asha"
    assert len(schedules) == 1
    assert schedules[0].status == ScheduleStatus.queued
    assert schedules[0].total_count == 1


async def test_due_follow_up_respects_send_window(session_factory):
    await _seed_follow_up_rule(session_factory)

    async with session_factory() as session:
        summary = await execute_due_follow_up_rules(
            session,
            lambda _log_id, _channel: None,
            now=datetime(2026, 9, 1, 1, 0, tzinfo=UTC),
        )
        schedules = (await session.execute(select(MessageSchedule))).scalars().all()

    assert summary == {"rules_scanned": 0, "schedules_created": 0, "messages_queued": 0}
    assert schedules == []


async def test_due_follow_up_does_not_create_empty_daily_run(session_factory):
    await _seed_follow_up_rule(session_factory, offset_days=0)

    async with session_factory() as session:
        summary = await execute_due_follow_up_rules(
            session,
            lambda _log_id, _channel: None,
            now=datetime(2026, 9, 1, 5, 0, tzinfo=UTC),
        )
        schedules = (await session.execute(select(MessageSchedule))).scalars().all()

    assert summary == {
        "rules_scanned": 1,
        "schedules_created": 0,
        "messages_queued": 0,
    }
    assert schedules == []


async def test_due_follow_up_excludes_ineligible_customers(session_factory):
    await _seed_follow_up_rule(session_factory)
    async with session_factory() as session:
        no_email = Customer(name="No Email", city="Pune", is_active=True)
        wrong_city = Customer(
            name="Wrong City",
            email="wrong@example.com",
            city="Mumbai",
            is_active=True,
        )
        inactive = Customer(
            name="Inactive",
            email="inactive@example.com",
            city="Pune",
            is_active=False,
        )
        session.add_all([no_email, wrong_city, inactive])
        await session.flush()
        session.add_all(
            [
                Visit(customer_id=customer.id, follow_up_date=date(2026, 9, 2))
                for customer in (no_email, wrong_city, inactive)
            ]
        )
        await session.commit()

        await execute_due_follow_up_rules(
            session,
            lambda _log_id, _channel: None,
            now=datetime(2026, 9, 1, 5, 0, tzinfo=UTC),
        )
        logs = (await session.execute(select(MessageLog))).scalars().all()

    assert len(logs) == 1
    assert logs[0].recipient == "asha@example.com"


async def test_enqueue_failure_is_persisted(session_factory):
    await _seed_follow_up_rule(session_factory)

    def fail_enqueue(_log_id: int, _channel: MessageChannel):
        raise RuntimeError("broker unavailable")

    async with session_factory() as session:
        summary = await execute_due_follow_up_rules(
            session,
            fail_enqueue,
            now=datetime(2026, 9, 1, 5, 0, tzinfo=UTC),
        )
        log = (await session.execute(select(MessageLog))).scalar_one()
        schedule = (await session.execute(select(MessageSchedule))).scalar_one()

    assert summary["messages_queued"] == 0
    assert log.status == MessageStatus.failed
    assert log.error_message == "Could not enqueue message delivery."
    assert schedule.status == ScheduleStatus.failed
    assert schedule.failed_count == 1
