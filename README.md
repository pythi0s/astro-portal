# Astrologer Client Management Portal

A full-stack web application for astrologers to manage clients, kundalis, and consultation history.

## Tech Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Backend   | Python 3.12 + FastAPI + SQLAlchemy      |
| Database  | PostgreSQL 16                           |
| Frontend  | Vue.js 3 + Vite + Vue Router + Pinia   |
| File Mgmt | Local uploads (photos + kundali PDFs)   |

## Features

- **Client CRUD** — Add, edit, view, delete clients with full details
- **Search** — Search by name, mobile, email, city, rashi, nakshatra
- **Photo Upload** — Client profile photos (JPEG/PNG/WebP, max 5MB)
- **Kundali Upload** — Kundali PDF upload and viewer (max 10MB)
- **Interaction Timeline** — Chronological history of consultations, remedies, predictions
- **Dashboard** — Quick stats and recently added clients
- **Astrological Fields** — Rashi, Nakshatra, Lagna, Gotra, Manglik status
- **Payment Tracking** — Fees charged and payment mode per interaction

## Prerequisites

Install the following before proceeding:

- **Python 3.12+** — https://www.python.org/downloads/
- **Node.js 20+** — https://nodejs.org/
- **PostgreSQL 16+** — https://www.postgresql.org/download/

Verify all are installed:

```powershell
python --version
node --version
npm --version
psql --version
```

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup (Step by Step)

#### Step 1 — Create the PostgreSQL Database

```powershell
# Open psql as the postgres superuser (enter password when prompted)
psql -U postgres
```

Inside the `psql` prompt, run:

```sql
CREATE DATABASE astrologer_portal;

-- Verify it was created
\l

-- Exit psql
\q
```

> **Note:** If your PostgreSQL password is not `postgres`, you will update it in the `.env` file in Step 2.

#### Step 2 — Set Up the Backend

```powershell
# Navigate to the backend folder
cd C:\Users\Public\astrologer-portal\backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment (Windows)
.\venv\Scripts\Activate
# On macOS/Linux: source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt

# Create your .env configuration file from the template
copy .env.example .env
# On macOS/Linux: cp .env.example .env
```

Now open the `.env` file and update it **only if** your PostgreSQL credentials differ from the defaults:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/astrologer_portal
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:5173
```

#### Step 3 — Run the Backend

```powershell
# Make sure you are in the backend folder with the venv activated
cd C:\Users\Public\astrologer-portal\backend
.\venv\Scripts\Activate

# Start the FastAPI server (database tables auto-create on first run)
uvicorn app.main:app --reload
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Verify it works:

- http://localhost:8000/api/health → should return `{"status":"ok"}`
- http://localhost:8000/docs → Swagger UI with all API endpoints

> **Keep this terminal running.** Open a **new terminal** for the frontend.

#### Step 4 — Set Up & Run the Frontend

```powershell
# In a NEW terminal, navigate to the frontend folder
cd C:\Users\Public\astrologer-portal\frontend

# Install all Node.js dependencies
npm install

# Start the Vite dev server
npm run dev
```

You should see:

```
  VITE v5.x.x  ready

  ➜  Local:   http://localhost:5173/
```

#### Step 5 — Open the App

Open **http://localhost:5173** in your browser. You can now:

1. Click **+ New Client** to add your first client
2. Fill in personal + astrological details
3. Upload photo and kundali PDF from the client detail page
4. Add consultations/interactions to build the timeline

### Terminals Summary

You need **two terminals** running simultaneously:

| Terminal   | Folder    | Command                          | Purpose                   |
| ---------- | --------- | -------------------------------- | ------------------------- |
| Terminal 1 | `backend` | `uvicorn app.main:app --reload`  | Backend API on port 8000  |
| Terminal 2 | `frontend`| `npm run dev`                    | Frontend UI on port 5173  |

The Vite dev server automatically proxies all `/api` requests to the FastAPI backend.

### Stopping the App

Press `Ctrl+C` in each terminal to stop the respective server.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `psql` not recognized | Add PostgreSQL `bin` folder to your system PATH |
| `python` not recognized | Add Python to PATH or use `py` instead of `python` |
| Database connection refused | Ensure PostgreSQL service is running (`services.msc` → postgresql) |
| Port 8000/5173 already in use | Kill the process using the port or change the port in config |
| CORS errors in browser | Ensure backend is running and `ALLOWED_ORIGINS` in `.env` matches the frontend URL |

## API Endpoints

### Clients
| Method   | Endpoint                         | Description              |
| -------- | -------------------------------- | ------------------------ |
| GET      | `/api/clients`                   | List clients (paginated, searchable) |
| POST     | `/api/clients`                   | Create client            |
| GET      | `/api/clients/{id}`              | Get client + timeline    |
| PUT      | `/api/clients/{id}`              | Update client            |
| DELETE   | `/api/clients/{id}`              | Delete client            |
| POST     | `/api/clients/{id}/photo`        | Upload photo             |
| POST     | `/api/clients/{id}/kundali`      | Upload kundali PDF       |
| GET      | `/api/clients/{id}/photo`        | Get photo                |
| GET      | `/api/clients/{id}/kundali`      | Download kundali         |

### Interactions (per client)
| Method   | Endpoint                                       | Description          |
| -------- | ---------------------------------------------- | -------------------- |
| GET      | `/api/clients/{id}/interactions`               | List interactions    |
| POST     | `/api/clients/{id}/interactions`               | Add interaction      |
| GET      | `/api/clients/{id}/interactions/{int_id}`      | Get interaction      |
| PUT      | `/api/clients/{id}/interactions/{int_id}`      | Update interaction   |
| DELETE   | `/api/clients/{id}/interactions/{int_id}`      | Delete interaction   |

### Dashboard
| Method   | Endpoint           | Description       |
| -------- | ------------------ | ----------------- |
| GET      | `/api/dashboard`   | Stats + recent    |

## Project Structure

```
astrologer-portal/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   └── models.py        # Client & Interaction tables
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── clients.py       # /api/clients routes
│   │   │   ├── interactions.py  # /api/clients/{id}/interactions routes
│   │   │   └── dashboard.py     # /api/dashboard route
│   │   └── services/
│   │       └── crud.py          # Database operations
│   ├── alembic/                 # DB migrations
│   ├── uploads/                 # Uploaded files
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── api.js               # Axios instance
│   │   ├── router.js
│   │   ├── assets/style.css
│   │   └── views/
│   │       ├── DashboardView.vue
│   │       ├── ClientListView.vue
│   │       ├── ClientDetailView.vue
│   │       └── ClientFormView.vue
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
