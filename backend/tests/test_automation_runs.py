from datetime import datetime, timedelta

from app.models.automation_rule import AutomationRule, AutomationTrigger
from app.models.message_schedule import MessageSchedule, ScheduleStatus
from app.models.message_template import MessageChannel, MessageTemplate


async def test_admin_can_filter_automation_runs_newest_first(client, session_factory):
    async with session_factory() as session:
        template = MessageTemplate(
            name="Follow-up",
            channel=MessageChannel.email,
            subject="Reminder",
            body="Reminder",
        )
        session.add(template)
        await session.flush()
        first_rule = AutomationRule(
            name="First rule",
            trigger=AutomationTrigger.follow_up_due,
            template_id=template.id,
            channel=MessageChannel.email,
        )
        second_rule = AutomationRule(
            name="Second rule",
            trigger=AutomationTrigger.follow_up_due,
            template_id=template.id,
            channel=MessageChannel.email,
        )
        session.add_all([first_rule, second_rule])
        await session.flush()
        older = datetime(2026, 9, 1, 8, 0)
        session.add_all(
            [
                MessageSchedule(
                    template_id=template.id,
                    automation_rule_id=first_rule.id,
                    event_key="first:older",
                    channel=MessageChannel.email,
                    scheduled_for=older,
                    status=ScheduleStatus.completed,
                    sent_count=2,
                    failed_count=1,
                    total_count=3,
                ),
                MessageSchedule(
                    template_id=template.id,
                    automation_rule_id=first_rule.id,
                    event_key="first:newer",
                    channel=MessageChannel.email,
                    scheduled_for=older + timedelta(hours=1),
                    status=ScheduleStatus.queued,
                    total_count=4,
                ),
                MessageSchedule(
                    template_id=template.id,
                    automation_rule_id=second_rule.id,
                    event_key="second:run",
                    channel=MessageChannel.email,
                    scheduled_for=older + timedelta(hours=2),
                    status=ScheduleStatus.completed,
                    total_count=1,
                ),
            ]
        )
        await session.commit()

    response = await client.get(f"/admin/automation-rules/runs?rule_id={first_rule.id}")

    assert response.status_code == 200, response.text
    runs = response.json()
    assert [run["event_key"] for run in runs] == ["first:newer", "first:older"]
    assert runs[1]["sent_count"] == 2
    assert runs[1]["failed_count"] == 1
    assert runs[1]["total_count"] == 3


async def test_manual_schedule_without_rule_is_not_an_automation_run(client, session_factory):
    async with session_factory() as session:
        template = MessageTemplate(name="Manual", channel=MessageChannel.email, body="Hello")
        session.add(template)
        await session.flush()
        session.add(
            MessageSchedule(
                template_id=template.id,
                event_key="manual",
                channel=MessageChannel.email,
                scheduled_for=datetime(2026, 9, 1, 8, 0),
            )
        )
        await session.commit()

    response = await client.get("/admin/automation-rules/runs")

    assert response.status_code == 200
    assert response.json() == []
