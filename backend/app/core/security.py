import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from threading import Lock
from typing import Sequence

import bcrypt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.db.database import get_session
from app.models.user import User, UserRole

ALGORITHM = "HS256"

security_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await session.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(allowed_roles: Sequence[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return role_checker


# ---------------------------------------------------------------------------
# Login rate limiter
# ---------------------------------------------------------------------------
# In-memory, per-process sliding window keyed by client IP. This is deliberately
# simple: it survives container restarts only (no Redis), is not cluster-aware,
# and is safe to replace with slowapi or a Redis-backed limiter later. The
# contract it exposes (`check_login_rate_limit`, `record_login_failure`,
# `reset_login_attempts`) stays the same regardless of the backend.

class LoginRateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, bucket: deque[float], now: float, window: int) -> None:
        cutoff = now - window
        while bucket and bucket[0] < cutoff:
            bucket.popleft()

    def check(self, key: str) -> None:
        max_attempts = settings.login_rate_limit_max_attempts
        window = settings.login_rate_limit_window_seconds
        if max_attempts <= 0 or window <= 0:
            return
        now = time.monotonic()
        with self._lock:
            bucket = self._buckets[key]
            self._prune(bucket, now, window)
            if len(bucket) >= max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many login attempts. Try again later.",
                    headers={"Retry-After": str(window)},
                )

    def record_failure(self, key: str) -> None:
        if settings.login_rate_limit_max_attempts <= 0:
            return
        now = time.monotonic()
        with self._lock:
            self._buckets[key].append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._buckets.pop(key, None)


login_rate_limiter = LoginRateLimiter()


def client_ip(request: Request) -> str:
    # When behind a reverse proxy the caller should set trusted proxy rules;
    # for now prefer X-Forwarded-For's first entry if present, otherwise the
    # socket peer. This intentionally does NOT trust arbitrary upstreams in
    # production — operator must terminate at a proxy they control.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"
