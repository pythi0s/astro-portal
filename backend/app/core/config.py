from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Application URL
    base_url: str = "http://localhost:5173"
    domain: str = "localhost"

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

    # Bootstrap admin (auto-created on first start if DB is empty)
    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_name: str = "Admin"

    # Bootstrap admin (auto-created on first start if DB is empty)
    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_name: str = "Admin"

    upload_dir: str = "/workspace/uploads"

    class Config:
        env_file = ".env"


settings = Settings()
