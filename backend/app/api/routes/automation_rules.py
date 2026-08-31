from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import require_role
from app.db.database import get_session
from app.models.automation_rule import AutomationRule, AutomationTrigger
from app.models.message_schedule import MessageSchedule
from app.models.message_template import MessageChannel, MessageTemplate
from app.models.user import UserRole
from app.schemas.automation import (
    AutomationRuleCreate,
    AutomationRuleRead,
    AutomationRuleUpdate,
    AutomationRunRead,
)

router = APIRouter(prefix="/admin/automation-rules", tags=["automation"])
_admin_only = require_role((UserRole.admin,))


async def _get_rule(rule_id: int, session: AsyncSession) -> AutomationRule:
    result = await session.execute(select(AutomationRule).where(AutomationRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    return rule


async def _validate_template(
    template_id: int,
    channel: MessageChannel,
    session: AsyncSession,
) -> None:
    result = await session.execute(
        select(MessageTemplate).where(
            MessageTemplate.id == template_id,
            MessageTemplate.is_active == True,  # noqa: E712
        )
    )
    template = result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=422, detail="Active message template not found")
    if template.channel != channel:
        raise HTTPException(status_code=422, detail="Template channel does not match rule channel")


@router.get("/", response_model=list[AutomationRuleRead])
async def list_automation_rules(
    trigger: AutomationTrigger | None = Query(None),
    is_active: bool | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user=Depends(_admin_only),
):
    query = select(AutomationRule)
    if trigger is not None:
        query = query.where(AutomationRule.trigger == trigger)
    if is_active is not None:
        query = query.where(AutomationRule.is_active == is_active)
    result = await session.execute(query.order_by(AutomationRule.updated_at.desc()))
    return result.scalars().all()


@router.get("/runs", response_model=list[AutomationRunRead])
async def list_automation_runs(
    rule_id: int | None = Query(None, gt=0),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user=Depends(_admin_only),
):
    query = select(MessageSchedule).where(MessageSchedule.automation_rule_id.is_not(None))
    if rule_id is not None:
        query = query.where(MessageSchedule.automation_rule_id == rule_id)
    result = await session.execute(
        query.order_by(MessageSchedule.scheduled_for.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{rule_id}", response_model=AutomationRuleRead)
async def get_automation_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(_admin_only),
):
    return await _get_rule(rule_id, session)


@router.post("/", response_model=AutomationRuleRead, status_code=status.HTTP_201_CREATED)
async def create_automation_rule(
    body: AutomationRuleCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(_admin_only),
):
    await _validate_template(body.template_id, body.channel, session)
    rule = AutomationRule(**body.model_dump())
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=AutomationRuleRead)
async def update_automation_rule(
    rule_id: int,
    body: AutomationRuleUpdate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(_admin_only),
):
    rule = await _get_rule(rule_id, session)
    current = AutomationRuleRead.model_validate(rule).model_dump(
        exclude={"id", "created_at", "updated_at"}
    )
    updates = body.model_dump(exclude_unset=True)
    candidate = AutomationRuleCreate.model_validate(current | updates)
    await _validate_template(candidate.template_id, candidate.channel, session)

    for field in updates:
        setattr(rule, field, getattr(candidate, field))
    rule.updated_at = datetime.utcnow()
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.delete("/{rule_id}")
async def deactivate_automation_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(_admin_only),
):
    rule = await _get_rule(rule_id, session)
    rule.is_active = False
    rule.updated_at = datetime.utcnow()
    session.add(rule)
    await session.commit()
    return {"detail": "Automation rule deactivated"}
