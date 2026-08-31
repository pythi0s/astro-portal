from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.automation_rule import AutomationRule, AutomationTrigger
from app.models.customer import Customer
from app.models.message_log import MessageLog, MessageStatus
from app.models.message_schedule import MessageSchedule, ScheduleStatus
from app.models.message_template import MessageChannel, MessageTemplate
from app.models.visit import Visit

EnqueueDelivery = Callable[[int, MessageChannel], None]


def _render_template(text: str, customer: Customer) -> str:
    values = {
        "customer_name": customer.name,
        "customer_email": customer.email or "",
        "customer_phone": customer.phone or "",
        "name": customer.name,
        "email": customer.email or "",
        "phone": customer.phone or "",
    }
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    return text


def _inside_send_window(rule: AutomationRule, now: datetime) -> bool:
    local_hour = now.astimezone(ZoneInfo(rule.timezone)).hour
    return rule.send_window_start_hour <= local_hour < rule.send_window_end_hour


def _apply_customer_filters(query, filters: dict | None):
    if not filters:
        return query
    for field in ("city", "gender", "rashi"):
        value = filters.get(field)
        if value is not None:
            query = query.where(getattr(Customer, field) == value)
    return query


async def execute_due_follow_up_rules(
    session: AsyncSession,
    enqueue: EnqueueDelivery,
    *,
    now: datetime | None = None,
) -> dict[str, int]:
    """Create and enqueue one delivery per matching follow-up event.

    Offset semantics are `send_date = follow_up_date + offset_days`, so a
    rule with offset -1 runs one day before the visit's follow-up date.
    """
    current = now or datetime.now(UTC)
    if current.tzinfo is None:
        current = current.replace(tzinfo=UTC)

    rules_result = await session.execute(
        select(AutomationRule).where(
            AutomationRule.is_active == True,  # noqa: E712
            AutomationRule.trigger == AutomationTrigger.follow_up_due,
        )
    )

    summary = {"rules_scanned": 0, "schedules_created": 0, "messages_queued": 0}
    for rule in rules_result.scalars().all():
        if rule.id is None or not _inside_send_window(rule, current):
            continue
        summary["rules_scanned"] += 1

        local_date = current.astimezone(ZoneInfo(rule.timezone)).date()
        follow_up_date = local_date - timedelta(days=rule.offset_days)
        schedule_key = f"follow_up_due:{rule.id}:{local_date.isoformat()}"
        existing = await session.execute(
            select(MessageSchedule).where(MessageSchedule.event_key == schedule_key)
        )
        if existing.scalar_one_or_none() is not None:
            continue

        template_result = await session.execute(
            select(MessageTemplate).where(
                MessageTemplate.id == rule.template_id,
                MessageTemplate.is_active == True,  # noqa: E712
                MessageTemplate.channel == rule.channel,
            )
        )
        template = template_result.scalar_one_or_none()
        if template is None:
            continue

        candidates = (
            select(Visit, Customer)
            .join(Customer, Visit.customer_id == Customer.id)
            .where(
                Visit.is_active == True,  # noqa: E712
                Customer.is_active == True,  # noqa: E712
                Visit.follow_up_date == follow_up_date,
            )
        )
        candidates = _apply_customer_filters(candidates, rule.filter)
        if rule.channel == MessageChannel.email:
            candidates = candidates.where(Customer.email.is_not(None), Customer.email != "")
        else:
            candidates = candidates.where(Customer.phone.is_not(None), Customer.phone != "")

        rows = (await session.execute(candidates.order_by(Visit.id))).all()
        if not rows:
            continue
        schedule = MessageSchedule(
            template_id=template.id,
            automation_rule_id=rule.id,
            event_key=schedule_key,
            channel=rule.channel,
            target_query={
                "trigger": rule.trigger.value,
                "follow_up_date": follow_up_date.isoformat(),
                "filter": rule.filter or {},
            },
            scheduled_for=current.astimezone(UTC).replace(tzinfo=None),
            timezone=rule.timezone,
            status=ScheduleStatus.pending,
            total_count=len(rows),
        )
        session.add(schedule)
        await session.flush()

        logs: list[MessageLog] = []
        for visit, customer in rows:
            recipient = customer.email if rule.channel == MessageChannel.email else customer.phone
            if recipient is None:
                continue
            event_key = f"{schedule_key}:visit:{visit.id}:customer:{customer.id}"
            log = MessageLog(
                customer_id=customer.id,
                template_id=template.id,
                visit_id=visit.id,
                schedule_id=schedule.id,
                automation_rule_id=rule.id,
                automation_event_key=event_key,
                channel=rule.channel.value,
                recipient=recipient,
                subject=(
                    _render_template(template.subject or "Notification", customer)
                    if rule.channel == MessageChannel.email
                    else None
                ),
                body_snapshot=_render_template(template.body, customer),
                status=MessageStatus.queued,
            )
            session.add(log)
            logs.append(log)

        await session.commit()
        summary["schedules_created"] += 1

        failed = 0
        for log in logs:
            if log.id is None:
                continue
            try:
                enqueue(log.id, rule.channel)
            except Exception:
                log.status = MessageStatus.failed
                log.error_message = "Could not enqueue message delivery."
                failed += 1
            else:
                summary["messages_queued"] += 1

        schedule.failed_count = failed
        schedule.status = ScheduleStatus.failed if failed == len(logs) and logs else (
            ScheduleStatus.queued if logs else ScheduleStatus.completed
        )
        schedule.updated_at = datetime.utcnow()
        await session.commit()

    return summary
