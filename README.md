# ✨ Astro Portal CRM

A full-stack CRM application built for astrologers to manage customers, visits, solutions, and communications. Features a beautiful mandala-themed UI, persistent sessions, and Docker-based deployment.

---

## Tech Stack

| Layer     | Technology                                                  |
| --------- | ----------------------------------------------------------- |
| Frontend  | Vue 3 (Composition API), Vite, Tailwind CSS, Pinia, Chart.js |
| Backend   | FastAPI, SQLModel, SQLAlchemy 2.0 (async), Pydantic v2      |
| Database  | PostgreSQL 18 (asyncpg)                                     |
| Auth      | JWT (python-jose) + bcrypt, 24h tokens with auto-refresh    |
| Messaging | aiosmtplib (email), Twilio SDK (WhatsApp)                   |
| Tasks     | Celery 5 + Redis 7 (optional async workers)                 |
| Proxy     | Nginx (optional, with HTTPS support)                        |
| Container | Docker Compose with profiles                                |

---

## Features

### Customer Management
- Full CRUD (create, read, update, delete) for customer profiles
- Photo and kundali image uploads with file preview
- Astrology-specific fields: rashi, nakshatra, gotra, date of birth
- Customer search with text filtering and pagination
- Customer detail page with tabs (Details, Timeline, Solutions)
- 4 KPI cards on customer list: total customers, new this month, with email, with phone
- 4 KPI cards on customer detail: total visits, solutions given, total fees, messages sent

### Visit Tracking
- Create visits linked to customers with date, notes, fee, payment status
- Assign solutions from the catalog to each visit
- Payment status tracking: paid, pending, partial
- Visit history per customer in timeline view

### Solutions Catalog
- Full CRUD for solutions (gemstones, mantras, pujas, remedies)
- Category-based organization with grid layout
- Description and instruction fields
- Search across solutions
- 4 KPI cards: total solutions, categories used, with description, with instructions

### Messaging & Communications
- Email and WhatsApp message template management
- Placeholder rendering in templates (`{name}`, `{solution}`, `{date}`, etc.)
- Send email via aiosmtplib with SMTP configuration
- Send WhatsApp via Twilio SDK integration
- Message send log with full history tracking
- 4 KPI cards: total templates, email templates, whatsapp templates, messages sent
- Optional async sending via Celery workers with retry logic (3 retries, exponential backoff)

### Visual Timeline
- Vertical timeline with gradient line and color-coded dots
- Blue dots for visits, amber for solutions, green for messages
- Month separator headers for chronological grouping
- Displayed within customer detail page

### Dashboard & Analytics
- 6 KPI cards: Total Customers, Visits This Month, Revenue, Pending Payments, Avg Fee/Visit, Collection Rate
- Date range filter: 7, 30, 90, 365 day views
- Earnings bar chart with weekly/monthly/yearly period selector
- Payment status doughnut chart (paid vs pending vs partial)
- Recent visits list with quick access
- Solution category breakdown
- Quick action buttons for common tasks

### Page-Level Metrics
- Every major page displays contextual KPIs at the top
- Customer list: total, new this month, with email, with phone
- Customer detail: visits, solutions, total fees, messages
- Solutions: total, categories, with description, with instructions
- Templates: total, email templates, whatsapp templates, messages sent

### Authentication & Session Management
- JWT-based authentication with bcrypt password hashing
- Role-based access control: Admin, Astrologer, Receptionist
- 24-hour token lifetime with automatic refresh on use
- Persistent sessions via localStorage — survives page refresh, new tabs, browser restart
- Smart 401 interceptor: silently refreshes expired token before logging out
- Concurrent request queuing during token refresh (no duplicate refresh calls)
- Router init guard: session restored from localStorage before first navigation (no login page flash)
- Bootstrap endpoint: create first admin user without authentication (`POST /auth/bootstrap`)
- Profile edit modal: users can update their own name and phone
- Admin user management panel: list, create, and deactivate user accounts

### UI/UX Design
- Subtle mandala SVG background pattern across all pages (spiritual theme)
- Collapsible sidebar: pin/unpin (auto-hide with hover), collapse/expand, mobile responsive
- Global confirmation dialogs for all destructive actions (delete, deactivate) via Vue provide/inject
- Header bar with app branding, breadcrumb navigation, user dropdown menu
- Orange-red primary color theme with Tailwind CSS custom palette
- Login page with gradient background and centered card
- Responsive layout using Tailwind CSS utilities
- Unicode emoji icons throughout the interface

### Infrastructure & DevOps
- Docker Compose with 6 services: PostgreSQL, Redis, FastAPI backend, Vue frontend, Celery worker, Nginx
- Docker profiles: `with-celery` for async workers, `with-nginx` for reverse proxy
- Nginx reverse proxy with HTTP and HTTPS (SSL-ready) server blocks
- Let's Encrypt SSL certificate instructions included
- URL and domain configuration via environment variables
- `.gitignore` covering node_modules, .env, backups, uploads, SSL certs, Python artifacts

### Database Management
- Alembic async migrations with auto-detect model changes
- One-command auto-migrate script (`./scripts/db.sh auto-migrate`)
- Timestamped gzip database backups (`./scripts/db.sh backup`)
- One-command restore from backup file
- Interactive psql shell access
- Debug commands: list tables, row counts, database size, describe columns, run raw SQL
- Database reset (drop and recreate)
- Migration history and current revision inspection

### API & Backend
- FastAPI with async SQLAlchemy 2.0 and SQLModel ORM
- PostgreSQL 18 with asyncpg driver
- Full REST API with Swagger/OpenAPI docs at `/docs`
- CORS middleware configured
- Static file serving for uploaded photos/kundalis
- Health check endpoint (`/api/health`)
- Pydantic v2 request/response validation schemas
- Structured logging

### Celery & Async Tasks
- Celery 5 with Redis 7 as message broker and result backend
- Async email delivery task with 3 retries and exponential backoff
- Async WhatsApp delivery task with 3 retries and exponential backoff
- JSON serialization, UTC timezone configuration
- Worker monitoring via built-in Celery inspect commands

---

## Quick Start

```bash
# Clone and enter
git clone <repo-url> && cd astro-portal

# Copy environment file and configure
cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY and optionally BOOTSTRAP_ADMIN_* vars

# Start everything (migrations and admin bootstrap happen automatically)
docker compose up --build
```

On first start, the backend will:
1. **Run database migrations** automatically (Alembic `upgrade head`)
2. **Create an admin user** if the database is empty and `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` are set in `.env`

On subsequent starts, migrations are re-checked (no-op if up to date) and admin creation is skipped if users already exist.

> **Manual bootstrap** is still available via `POST /auth/bootstrap` if you prefer not to set env vars.

**Access Points:**

| Service        | URL                              |
| -------------- | -------------------------------- |
| Frontend       | http://localhost:5173            |
| Backend API    | http://localhost:8000            |
| API Docs       | http://localhost:8000/docs       |
| With Nginx     | http://localhost (port 80)       |

---

## Docker Compose Profiles

```bash
# Core only (db + backend + frontend)
docker compose up --build

# With async task workers
docker compose --profile with-celery up --build

# With Nginx reverse proxy (production / HTTPS)
docker compose --profile with-nginx up --build

# Everything
docker compose --profile with-celery --profile with-nginx up --build
```

### Services

| Service        | Image                  | Profile       | Purpose                          |
| -------------- | ---------------------- | ------------- | -------------------------------- |
| db             | postgres:18-alpine     | default       | PostgreSQL database              |
| redis          | redis:7-alpine         | default       | Cache / Celery broker            |
| backend        | python:3.11-slim + uv  | default       | FastAPI application              |
| frontend       | node:20-alpine         | default       | Vue 3 / Vite dev server          |
| celery-worker  | (same as backend)      | with-celery   | Async email/WhatsApp processing  |
| nginx          | nginx:alpine           | with-nginx    | Reverse proxy + SSL termination  |

---

## Authentication Flow

```
Login → POST /api/auth/login → JWT access_token (24h)
                                  ↓
                        Stored in localStorage
                                  ↓
              Attached to all requests via axios interceptor
                                  ↓
          On page refresh → router guard calls auth.init()
          → GET /api/auth/me (restore user) → POST /api/auth/refresh (extend token)
                                  ↓
          On 401 → silent refresh attempt → re-issue request → or logout
```

**Key behaviors:**
- Token persists across page refresh, new tabs, and browser restart (localStorage)
- Every successful session restore auto-refreshes the token (extends another 24h)
- If token expires during use, the interceptor silently tries `/auth/refresh` before logging out
- Admin role check waits for user data to load (no race condition)

---

## Database Management

All commands run from project root via `./scripts/db.sh`:

### Migrations
```bash
./scripts/db.sh init                    # Run all migrations (first-time setup)
./scripts/db.sh revision "add_column"   # Create named migration
./scripts/db.sh auto-migrate            # Auto-detect model changes + apply
./scripts/db.sh migrate                 # Apply pending migrations only
./scripts/db.sh downgrade 1             # Rollback 1 step
./scripts/db.sh history                 # Show migration history
./scripts/db.sh current                 # Show current revision
```

### Backup & Restore
```bash
./scripts/db.sh backup                  # Create timestamped backup → backups/
./scripts/db.sh restore backups/backup_20260405.sql.gz  # Restore from file
./scripts/db.sh reset                   # Drop & recreate (destructive!)
```

### Debug & Inspect
```bash
./scripts/db.sh shell                   # Open psql interactive shell
./scripts/db.sh tables                  # List all tables with sizes
./scripts/db.sh count                   # Row counts per table
./scripts/db.sh size                    # Total database size
./scripts/db.sh describe customer       # Show table columns/types
./scripts/db.sh query "SELECT * FROM customer LIMIT 5"  # Run raw SQL
```

### Common Debug Scenarios

```bash
# Verify database is working
./scripts/db.sh tables
./scripts/db.sh current

# Check if data exists
./scripts/db.sh count

# Inspect table structure
./scripts/db.sh describe visit

# Query recent customers
./scripts/db.sh query "SELECT id, name, email FROM customer ORDER BY created_at DESC LIMIT 10"

# Check pending payments
./scripts/db.sh query "SELECT * FROM visit WHERE payment_status = 'pending'"

# Backup before destructive operations
./scripts/db.sh backup

# After changing a model, auto-generate and apply migration
./scripts/db.sh auto-migrate
```

---

## HTTPS Setup

1. Place SSL certificates in `nginx/ssl/`:
   - `fullchain.pem`
   - `privkey.pem`

2. Uncomment the HTTPS server block in `nginx/default.conf`

3. Start with nginx profile:
```bash
docker compose --profile with-nginx up -d
```

See `nginx/ssl/README.md` for Let's Encrypt certificate instructions.

---

## Environment Variables

| Variable                 | Required | Default                  | Description                        |
| ------------------------ | -------- | ------------------------ | ---------------------------------- |
| `DATABASE_URL`           | Yes      | —                        | PostgreSQL async connection string |
| `SECRET_KEY`             | Yes      | `change-me-in-production`| JWT signing key (change this!)     |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440`                   | JWT token lifetime (24 hours)      |
| `BASE_URL`               | No       | `http://localhost:5173`  | Application base URL               |
| `DOMAIN`                 | No       | `localhost`              | Domain name for nginx/CORS         |
| `SMTP_HOST`              | No       | —                        | SMTP server hostname               |
| `SMTP_PORT`              | No       | `587`                    | SMTP port                          |
| `SMTP_USER`              | No       | —                        | SMTP username                      |
| `SMTP_PASSWORD`          | No       | —                        | SMTP password                      |
| `SMTP_FROM_EMAIL`        | No       | —                        | Sender email address               |
| `TWILIO_ACCOUNT_SID`     | No       | —                        | Twilio Account SID                 |
| `TWILIO_AUTH_TOKEN`       | No       | —                        | Twilio Auth Token                  |
| `TWILIO_WHATSAPP_FROM`   | No       | —                        | Twilio WhatsApp sender number      |
| `CELERY_BROKER_URL`      | No       | `redis://redis:6379/0`   | Redis URL for Celery broker        |
| `CELERY_RESULT_BACKEND`  | No       | `redis://redis:6379/1`   | Redis URL for Celery results       |
| `BOOTSTRAP_ADMIN_EMAIL`  | No       | —                        | Auto-create admin with this email on first start |
| `BOOTSTRAP_ADMIN_PASSWORD`| No      | —                        | Password for auto-created admin |
| `BOOTSTRAP_ADMIN_NAME`   | No       | `Admin`                  | Display name for auto-created admin |
| `BOOTSTRAP_ADMIN_EMAIL`  | No       | —                        | Auto-create admin with this email on first start |
| `BOOTSTRAP_ADMIN_PASSWORD`| No      | —                        | Password for auto-created admin |
| `BOOTSTRAP_ADMIN_NAME`   | No       | `Admin`                  | Display name for auto-created admin |
| `UPLOAD_DIR`             | No       | `/workspace/uploads`     | File upload directory              |

---

## API Endpoints

### Auth
| Method | Endpoint           | Auth     | Description                    |
| ------ | ------------------ | -------- | ------------------------------ |
| POST   | `/auth/login`      | Public   | Login, returns JWT token       |
| POST   | `/auth/refresh`    | Bearer   | Refresh token (extend session) |
| GET    | `/auth/me`         | Bearer   | Get current user profile       |
| PUT    | `/auth/me`         | Bearer   | Update own profile             |
| POST   | `/auth/register`   | Admin    | Create new user                |
| POST   | `/auth/bootstrap`  | Public*  | Create first admin (one-time)  |

### Customers
| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/customers`          | List with search/pagination |
| POST   | `/customers`          | Create customer          |
| GET    | `/customers/{id}`     | Get customer details     |
| PUT    | `/customers/{id}`     | Update customer          |
| DELETE | `/customers/{id}`     | Delete customer          |

### Visits
| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| GET    | `/visits`       | List visits              |
| POST   | `/visits`       | Create visit             |
| GET    | `/visits/{id}`  | Get visit details        |
| PUT    | `/visits/{id}`  | Update visit             |
| DELETE | `/visits/{id}`  | Delete visit             |

### Solutions
| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/solutions`        | List solutions           |
| POST   | `/solutions`        | Create solution          |
| PUT    | `/solutions/{id}`   | Update solution          |
| DELETE | `/solutions/{id}`   | Delete solution          |

### Messages
| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/messages/templates`       | List templates           |
| POST   | `/messages/templates`       | Create template          |
| PUT    | `/messages/templates/{id}`  | Update template          |
| DELETE | `/messages/templates/{id}`  | Delete template          |
| POST   | `/messages/send-email`      | Send email to customer   |
| POST   | `/messages/send-whatsapp`   | Send WhatsApp message    |
| GET    | `/messages/log`             | Message send history     |

### Other
| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/timeline/{customer_id}` | Customer event timeline |
| GET    | `/dashboard/stats`      | Dashboard KPIs and data  |
| GET    | `/admin/users`          | List all users (admin)   |
| PUT    | `/admin/users/{id}`     | Update user (admin)      |
| GET    | `/health`               | Health check endpoint    |

---

## Project Structure

```
astro-portal/
├── docker-compose.yml              # 6 services: db, redis, backend, frontend, celery, nginx
├── scripts/db.sh                   # Database management CLI (wrapper)
├── .gitignore
│
├── nginx/
│   ├── default.conf                # Reverse proxy config (HTTP + HTTPS)
│   └── ssl/
│       └── README.md               # Let's Encrypt instructions
│
├── backend/
│   ├── Dockerfile                  # Python 3.11-slim + uv
│   ├── pyproject.toml              # Dependencies (FastAPI, SQLModel, Celery, etc.)
│   ├── .env.example                # Environment variable template
│   ├── alembic.ini                 # Alembic config
│   ├── scripts/db.sh               # DB management commands
│   ├── alembic/
│   │   ├── env.py                  # Migration environment (async)
│   │   └── versions/               # Migration files
│   └── app/
│       ├── main.py                 # FastAPI app, middleware, route registration
│       ├── api/
│       │   ├── health.py           # Health check endpoint
│       │   └── routes/
│       │       ├── auth.py         # Login, refresh, register, bootstrap, profile
│       │       ├── customers.py    # Customer CRUD + search + uploads
│       │       ├── visits.py       # Visit CRUD
│       │       ├── solutions.py    # Solution CRUD
│       │       ├── messages.py     # Templates + send email/WhatsApp + log
│       │       ├── timeline.py     # Customer timeline events
│       │       ├── dashboard.py    # Stats & KPIs
│       │       └── admin.py        # User management (admin only)
│       ├── core/
│       │   ├── config.py           # Pydantic settings (env vars)
│       │   ├── security.py         # JWT, bcrypt, auth dependencies
│       │   ├── logger.py           # Structured logging
│       │   └── uploads.py          # File upload handler
│       ├── db/
│       │   └── database.py         # Async session factory
│       ├── models/
│       │   ├── user.py             # User + UserRole enum
│       │   ├── customer.py         # Customer + astrology fields
│       │   ├── visit.py            # Visit + payment tracking
│       │   ├── solution.py         # Solution catalog
│       │   ├── customer_solution.py # Customer-solution link
│       │   ├── message_template.py # Email/WhatsApp templates
│       │   └── message_log.py      # Message send history
│       ├── schemas/                # Pydantic request/response models
│       ├── services/
│       │   ├── email.py            # aiosmtplib email sender
│       │   └── whatsapp.py         # Twilio WhatsApp sender
│       └── tasks/
│           ├── celery_app.py       # Celery configuration
│           └── messaging.py        # Async email/WhatsApp tasks
│
└── frontend/
    ├── Dockerfile                  # Node 20-alpine
    ├── package.json
    ├── vite.config.js              # Vite + API proxy to backend
    ├── tailwind.config.js          # Custom primary colors (orange-red theme)
    ├── index.html
    └── src/
        ├── main.js                 # App bootstrap (Pinia + Router)
        ├── App.vue                 # Layout: sidebar, header, mandala bg, confirm dialog
        ├── style.css               # Tailwind + mandala overlay + timeline CSS
        ├── api/
        │   ├── client.js           # Axios instance + auth interceptor + token refresh
        │   ├── auth.js             # Login, refresh, me, register
        │   ├── customers.js        # Customer API calls
        │   ├── visits.js           # Visit API calls
        │   ├── solutions.js        # Solution API calls
        │   ├── messages.js         # Template + send API calls
        │   ├── dashboard.js        # Dashboard stats
        │   └── admin.js            # Admin user management
        ├── stores/
        │   └── auth.js             # Auth state: token, user, init, refresh, logout
        ├── router/
        │   └── index.js            # Routes + auth guard + session init
        └── views/
            ├── Login.vue           # Login form
            ├── Dashboard.vue       # KPIs, charts, date filter, recent visits
            ├── CustomerList.vue    # Customer table + KPIs + search
            ├── CustomerDetail.vue  # Profile, timeline, solutions tabs + KPIs
            ├── CustomerForm.vue    # Create/edit customer
            ├── VisitForm.vue       # Create visit with solutions
            ├── SolutionList.vue    # Solution grid + KPIs
            ├── SolutionForm.vue    # Create/edit solution
            ├── TemplateList.vue    # Templates + send + message log + KPIs
            ├── TemplateForm.vue    # Create/edit template
            └── AdminUsers.vue      # User management (admin only)
```

---

## Celery Workers (Optional)

For async email/WhatsApp processing:

```bash
# Start with celery profile
docker compose --profile with-celery up --build

# Monitor active tasks
docker compose exec celery-worker uv run celery -A app.tasks.celery_app inspect active

# Worker stats
docker compose exec celery-worker uv run celery -A app.tasks.celery_app inspect stats

# Purge all queued tasks
docker compose exec celery-worker uv run celery -A app.tasks.celery_app purge
```

**Available tasks:**
- `send_email_task(customer_id, template_id, visit_id)` — Async email delivery with 3 retries
- `send_whatsapp_task(customer_id, template_id, visit_id)` — Async WhatsApp delivery with 3 retries

---

## Development

```bash
# Rebuild after dependency changes
docker compose up --build

# View backend logs
docker compose logs -f backend

# View all logs
docker compose logs -f

# Restart a specific service
docker compose restart backend

# Enter backend container
docker compose exec backend bash

# Enter database shell
./scripts/db.sh shell
```

---

## License

Private project.
