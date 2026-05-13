from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Application URL / public origin
    base_url: str = "http://localhost:5173"
    domain: str = "localhost"

    # CORS: comma-separated list of allowed origins. Wildcard is rejected when
    # allow_credentials is true (spec-compliant behaviour). Defaults cover both
    # the Vue frontend (5173) and the new React frontend (5174) for local dev.
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    cors_allow_credentials: bool = True

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""

    # Twilio WhatsApp
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = ""

    # Celery (optional - only needed if running async tasks)
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    # Seed admin (idempotent; runs on startup only if no admin exists).
    # Prefer these new names; the legacy BOOTSTRAP_* names below still work.
    seed_admin_email: str = ""
    seed_admin_password: str = ""
    seed_admin_name: str = "Admin"

    # Legacy aliases kept for backward compatibility with existing .env files.
    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_name: str = "Admin"

    # Public POST /auth/bootstrap: closed once any active admin exists, but can
    # be force-disabled via env for hardened deployments.
    bootstrap_endpoint_enabled: bool = True

    # Login rate limit (per client IP, per window). Defaults: 5 failed attempts
    # in a 900 s window triggers 429. Set either to 0 to disable the check.
    login_rate_limit_max_attempts: int = 5
    login_rate_limit_window_seconds: int = 900

    upload_dir: str = "/workspace/uploads"

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = [o.strip() for o in self.cors_origins.split(",")]
        return [o for o in raw if o]

    @property
    def effective_seed_admin_email(self) -> str:
        return self.seed_admin_email or self.bootstrap_admin_email

    @property
    def effective_seed_admin_password(self) -> str:
        return self.seed_admin_password or self.bootstrap_admin_password

    @property
    def effective_seed_admin_name(self) -> str:
        return self.seed_admin_name or self.bootstrap_admin_name or "Admin"


settings = Settings()
