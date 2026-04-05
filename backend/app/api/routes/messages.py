# app/api/routes/messages.py
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.customer import Customer
from app.models.message_log import MessageLog, MessageStatus
from app.models.message_template import MessageChannel, MessageTemplate, TriggerType
from app.models.user import User
from app.schemas.message import (
    MessageLogRead,
    SendEmailRequest,
    TemplateCreate,
    TemplateRead,
    TemplateUpdate,
)

router = APIRouter(tags=["messages"])


# ── Template CRUD ──


@router.post("/templates/", response_model=TemplateRead)
async def create_template(
    body: TemplateCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    template = MessageTemplate(**body.model_dump())
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return template


@router.get("/templates/", response_model=list[TemplateRead])
async def list_templates(
    channel: Optional[MessageChannel] = Query(None),
    trigger_type: Optional[TriggerType] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(MessageTemplate).where(MessageTemplate.is_active == True)
    if channel:
        query = query.where(MessageTemplate.channel == channel)
    if trigger_type:
        query = query.where(MessageTemplate.trigger_type == trigger_type)
    result = await session.execute(query.order_by(MessageTemplate.name))
    return result.scalars().all()


@router.put("/templates/{template_id}", response_model=TemplateRead)
async def update_template(
    template_id: int,
    body: TemplateUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(MessageTemplate).where(MessageTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(template, key, value)
    template.updated_at = datetime.utcnow()

    session.add(template)
    await session.commit()
    await session.refresh(template)
    return template


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(MessageTemplate).where(MessageTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.is_active = False
    template.updated_at = datetime.utcnow()
    session.add(template)
    await session.commit()
    return {"detail": "Template deactivated"}


# ── Send Email ──


@router.post("/messages/send-email", response_model=MessageLogRead)
async def send_email(
    body: SendEmailRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Fetch customer
    cust_result = await session.execute(select(Customer).where(Customer.id == body.customer_id))
    customer = cust_result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if not customer.email:
        raise HTTPException(status_code=400, detail="Customer has no email address")

    # Fetch template
    tpl_result = await session.execute(select(MessageTemplate).where(MessageTemplate.id == body.template_id))
    template = tpl_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Render placeholders
    context = {
        "customer_name": customer.name,
        "customer_email": customer.email or "",
        "customer_phone": customer.phone or "",
    }
    rendered_subject = template.subject or ""
    rendered_body = template.body
    for key, val in context.items():
        rendered_subject = rendered_subject.replace(f"{{{{{key}}}}}", val)
        rendered_body = rendered_body.replace(f"{{{{{key}}}}}", val)

    # Try to send via email service
    status = MessageStatus.pending
    error_msg = None
    sent_at = None

    try:
        from app.services.email import send_email as smtp_send
        await smtp_send(to=customer.email, subject=rendered_subject, html_body=rendered_body)
        status = MessageStatus.sent
        sent_at = datetime.utcnow()
    except Exception as e:
        status = MessageStatus.failed
        error_msg = str(e)

    # Log
    log = MessageLog(
        customer_id=customer.id,
        template_id=template.id,
        visit_id=body.visit_id,
        channel=template.channel.value,
        recipient=customer.email,
        subject=rendered_subject,
        body_snapshot=rendered_body,
        status=status,
        error_message=error_msg,
        sent_at=sent_at,
    )
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


# ── Message Log ──


@router.get("/messages/log", response_model=list[MessageLogRead])
async def get_message_log(
    customer_id: Optional[int] = Query(None),
    channel: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(MessageLog)
    if customer_id:
        query = query.where(MessageLog.customer_id == customer_id)
    if channel:
        query = query.where(MessageLog.channel == channel)
    query = query.order_by(MessageLog.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()
