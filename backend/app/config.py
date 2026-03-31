from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/astrologer_portal"
    upload_dir: str = "./uploads"
    allowed_origins: str = "http://localhost:5173"
    max_photo_size_mb: int = 5
    max_pdf_size_mb: int = 10

    class Config:
        env_file = ".env"


settings = Settings()
