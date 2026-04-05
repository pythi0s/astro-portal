# Astro Portal — Backend

FastAPI-based REST API for the Astro Portal CRM.

## Stack

- **Framework**: FastAPI with async support
- **ORM**: SQLModel + SQLAlchemy 2.0 (async)
- **Database**: PostgreSQL (asyncpg driver)
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) + bcrypt password hashing
- **Email**: aiosmtplib
- **WhatsApp**: Twilio SDK
- **Package Manager**: uv

## Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, middleware, router mounts
│   ├── api/routes/
│   │   ├── auth.py                # Login, register, profile
│   │   ├── customers.py           # Customer CRUD + file uploads
│   │   ├── visits.py              # Visit CRUD with solution linking
│   │   ├── solutions.py           # Solution catalog CRUD
│   │   ├── messages.py            # Templates, send email/WhatsApp, logs
│   │   ├── timeline.py            # Customer timeline
│   │   ├── dashboard.py           # KPIs and earnings data
│   │   └── admin.py               # User management (admin only)
│   ├── models/                    # SQLModel database models
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── core/                      # Config, security, uploads
│   ├── services/                  # Email & WhatsApp services
│   └── db/                        # Async session factory
├── alembic/                       # Database migrations
├── pyproject.toml
└── Dockerfile
```

## Environment Variables

| Variable               | Required | Description                          |
| ---------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string         |
| `SECRET_KEY`           | Yes      | JWT signing key                      |
| `SMTP_HOST`            | No       | SMTP server hostname                 |
| `SMTP_PORT`            | No       | SMTP port (default: 587)             |
| `SMTP_USER`            | No       | SMTP username                        |
| `SMTP_PASSWORD`        | No       | SMTP password                        |
| `SMTP_FROM_EMAIL`      | No       | Sender email address                 |
| `TWILIO_ACCOUNT_SID`   | No       | Twilio Account SID                   |
| `TWILIO_AUTH_TOKEN`    | No       | Twilio Auth Token                    |
| `TWILIO_WHATSAPP_FROM` | No       | Twilio WhatsApp sender number        |

## Running Migrations

```bash
uv run alembic upgrade head       # Apply
uv run alembic downgrade -1       # Rollback
uv run alembic revision --autogenerate -m "description"  # New migration
```

## API Docs

When running: Swagger UI at `/docs`, ReDoc at `/redoc`.
