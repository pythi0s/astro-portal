# app/api/routes/customers.py
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.core.uploads import delete_upload, save_kundali, save_photo
from app.db.database import get_session
from app.models.customer import Customer
from app.models.customer_solution import CustomerSolution
from app.models.solution import Solution
from app.models.user import User
from app.models.visit import Visit
from app.schemas.customer import CustomerCreate, CustomerList, CustomerRead, CustomerUpdate
from app.schemas.solution import CustomerSolutionHistory
from app.schemas.visit import VisitRead

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/", response_model=CustomerRead)
async def create_customer(
    body: CustomerCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    customer = Customer(**body.model_dump(), created_by=current_user.id)
    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return customer


@router.get("/", response_model=list[CustomerRead])
async def list_customers(
    search: Optional[str] = Query(None, description="Search by name, phone, or email"),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Customer)
    if is_active is not None:
        query = query.where(Customer.is_active == is_active)
    if search:
        like = f"%{search}%"
        query = query.where(
            (Customer.name.ilike(like))
            | (Customer.phone.ilike(like))
            | (Customer.email.ilike(like))
        )
    query = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(
    customer_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerRead)
async def update_customer(
    customer_id: int,
    body: CustomerUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    customer.updated_at = datetime.utcnow()

    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return customer


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.is_active = False
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    await session.commit()
    return {"detail": "Customer deactivated"}


@router.post("/{customer_id}/photo", response_model=CustomerRead)
async def upload_photo(
    customer_id: int,
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.photo_path:
        delete_upload(customer.photo_path)

    customer.photo_path = await save_photo(file)
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return customer


@router.post("/{customer_id}/kundali", response_model=CustomerRead)
async def upload_kundali(
    customer_id: int,
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.kundali_file_path:
        delete_upload(customer.kundali_file_path)

    customer.kundali_file_path = await save_kundali(file)
    customer.kundali_original_name = file.filename
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return customer


@router.get("/{customer_id}/visits", response_model=list[VisitRead])
async def get_customer_visits(
    customer_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(Visit).where(Visit.customer_id == customer_id).order_by(Visit.visit_date.desc())
    )
    return result.scalars().all()


@router.get("/{customer_id}/solutions", response_model=list[CustomerSolutionHistory])
async def get_customer_solutions(
    customer_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(CustomerSolution, Solution)
        .join(Solution, CustomerSolution.solution_id == Solution.id)
        .where(CustomerSolution.customer_id == customer_id)
        .order_by(CustomerSolution.given_date.desc())
    )
    rows = result.all()
    return [
        CustomerSolutionHistory(
            **{k: getattr(cs, k) for k in CustomerSolutionHistory.model_fields if hasattr(cs, k)},
            solution_name=sol.name,
            solution_category=sol.category.value,
        )
        for cs, sol in rows
    ]
