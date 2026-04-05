# app/api/routes/customers.py
from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models import Customer

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/")
async def create_customer(customer: Customer, session: AsyncSession = Depends(get_session)):
    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return customer


@router.get("/")
async def list_customers(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Customer))
    return result.scalars().all()
