# Astro Portal - Astrologer CRM

A full-stack Customer Relationship Management system built for astrologers. Manage customers, visits, solutions, send emails and WhatsApp messages, and track everything in one place.

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Backend  | Python 3.11, FastAPI, SQLModel, SQLAlchemy (async), Alembic   |
| Database | PostgreSQL 18                                                 |
| Frontend | Vue 3 (Composition API), Vite, Tailwind CSS, Pinia, Chart.js  |
| Auth     | JWT (python-jose), bcrypt                                     |
| Email    | aiosmtplib (async SMTP)                                       |
| WhatsApp | Twilio API                                                    |
| Infra    | Docker Compose                                                |

## Features

- **Customer Management** — Full CRUD with photo/kundali uploads, astrology details, search & filters
- **Visit Tracking** — Record consultations, fees, payment status, link solutions to visits
- **Solution Catalog** — Manage remedies (gemstones, mantras, pujas, etc.) with categories
- **Email & WhatsApp** — Template-based messaging with placeholder rendering (`{{customer_name}}`, etc.)
- **Dashboard** — KPIs, earnings charts, payment status breakdown, recent activity
- **Timeline** — Chronological customer history (visits + messages)
- **RBAC** — Three roles: admin, astrologer, receptionist
- **Admin Panel** — User management (create, edit, deactivate users) for admins

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Twilio account for WhatsApp messaging

### 1. Clone & configure

```bash
git clone <repo-url>
cd astro-portal
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and secrets
```

### 2. Start services

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Backend API** on http://localhost:8000 (docs at `/docs`)
- **Frontend** on http://localhost:5173

### 3. Run migrations

```bash
docker compose exec backend uv run alembic upgrade head
```

### 4. Bootstrap admin user

```bash
curl -X POST http://localhost:8000/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123", "full_name": "Admin"}'
```

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://crm_user:crm_password@db:5432/crm_database
SECRET_KEY=your-secret-key-here

# SMTP (for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# Twilio (for WhatsApp messaging)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=+14155238886
```

## Project Structure

```
astro-portal/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entrypoint
│   │   ├── api/routes/          # API route handlers
│   │   ├── models/              # SQLModel database models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── core/                # Config, security, uploads
│   │   ├── services/            # Email & WhatsApp services
│   │   └── db/                  # Database session management
│   ├── alembic/                 # Database migrations
│   └── pyproject.toml
└── frontend/
    ├── src/
    │   ├── App.vue              # Root layout (sidebar, header, profile)
    │   ├── views/               # Page components
    │   ├── api/                 # Axios API layer
    │   ├── stores/              # Pinia state management
    │   └── router/              # Vue Router config
    └── vite.config.js
```

## License

Private — All rights reserved.
