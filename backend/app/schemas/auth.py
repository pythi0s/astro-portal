from datetime import datetime

from pydantic import BaseModel, Field

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""
    phone: str | None = None
    role: UserRole = UserRole.astrologer


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None = None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class BootstrapRequest(BaseModel):
    """Body for POST /auth/bootstrap. Role is always forced to admin server-side;
    a `role` field in the request is intentionally absent to avoid confusion.
    """

    email: str
    password: str = Field(..., min_length=8)
    full_name: str = ""
    phone: str | None = None


class AdminStats(BaseModel):
    total_users: int
    active_users: int
    admin_count: int
