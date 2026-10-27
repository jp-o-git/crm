# ClientDesk

ClientDesk is a customer relationship management (CRM) application for freelancers and small businesses. It brings client records, sales opportunities, payment tracking, and business reporting into one workspace.

## What it does

- **Contacts:** Store and search client details, including names, email addresses, phone numbers, and companies. View and update individual contact records.
- **Deals and offers:** Create opportunities associated with contacts, track them through New, Contacted, Proposal, Won, and Lost stages, and review pipeline summaries.
- **Payments and transactions:** Record payment details for won deals and track whether payments are outstanding or paid.
- **Dashboard and reports:** Review contacts, open deals, revenue, pending payments, and reporting summaries. Reports can be downloaded as PDFs or emailed.
- **Account access:** Register with email verification, sign in, restore sessions, and log out. The API issues short-lived access tokens and stores rotating refresh tokens in an HTTP-only cookie.

The public landing page and authentication screens are available to logged-out visitors. Dashboard, contacts, offers, and reports are protected and require an authenticated session.

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Database and schema migrations | PostgreSQL, Alembic, psycopg2 |
| Email and PDF reports | Resend, ReportLab |

## Repository layout

```text
backend/
  app/portal/            FastAPI application, API routes, and request/response models
  shared_package/db/     SQLAlchemy database setup and models
  shared_package/sync_function/
                         Authentication, domain services, email, and report helpers
  alembic/               Database migration environment and migration revisions
  requirements.txt       Python dependencies
frontend/
  src/app/               React app, providers, layout, and routing
  src/pages/             Public and authenticated pages
  src/components/        Reusable UI components
  src/lib/               API client and frontend utilities
  index.html             Document metadata and frontend entry point
```

## Run locally

### Prerequisites

- Python 3.10 or later (use a version compatible with the installed project dependencies)
- Node.js and npm
- PostgreSQL
- A Resend account and a verified sender address for email-based signup verification

### Configure the backend

Create a `backend/.env` file. Do not commit this file or put real credentials in source control.

```dotenv
DATABASE_URL=postgresql://postgres:your-local-password@localhost:5432/clientdesk
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
BREVO_API_KEY=re_xxxxxxxxx
EMAIL_FROM=ClientDesk <verified-sender@example.com>
FRONTEND_REDIRECT_URI=http://localhost:5173
COOKIE_SECURE=false
```

The database named in `DATABASE_URL` must exist before applying migrations. `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `BREVO_API_KEY`, and `EMAIL_FROM` are required by the current backend configuration. `FRONTEND_REDIRECT_URI` is used for email links and CORS; `FRONTEND_URI` is accepted as an email-link fallback. Configure `BREVO_API_KEY` and `EMAIL_FROM` with valid Resend values to use signup email verification.

Optional authentication and signup settings have defaults:

| Variable | Default | Description |
| --- | --- | --- |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `14` | Refresh-token lifetime |
| `EMAIL_VERIFY_EXPIRE_MINUTES` | `60` | Signup verification-link lifetime |
| `BRAND_NAME` | `ClientDesk` | Brand name in email messages |
| `COOKIE_SECURE` | `false` | Set to `true` when serving the API over HTTPS in production |

On Windows PowerShell, create and activate a virtual environment and install dependencies:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Apply the database migrations and start the API from the `backend` directory:

```powershell
python -m alembic upgrade head
python -m uvicorn app.portal.main:app --reload
```

The API is available at `http://localhost:8000`. FastAPI's interactive API documentation is at `http://localhost:8000/docs`.

### Configure and run the frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173` by default. The API client uses `http://localhost:8000` unless `VITE_API_URL` is set in the frontend environment, for example:

```dotenv
VITE_API_URL=http://localhost:8000
```

The backend CORS configuration allows the configured `FRONTEND_REDIRECT_URI` and local origins `http://127.0.0.1:5173` and `http://localhost:5174`; adjust it in `backend/app/portal/main.py` if your frontend uses another origin.

## API overview

The backend exposes these route groups:

| Prefix | Purpose |
| --- | --- |
| `/auth` | Signup start and verification, current-user lookup, token login, refresh, and logout |
| `/contacts` | List, create, retrieve, update, and delete contacts |
| `/offers` | List and create deals, view summaries, update stages, and update payments |
| `/reports` | Retrieve report data, download a PDF, and email a report |

Most CRM endpoints require authentication. The API schema and full endpoint details are available at `/docs` while the backend is running.

## Frontend routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Product landing page |
| `/login` | Public | Sign in |
| `/register` | Public | Start registration |
| `/register/complete` | Public | Complete email-verified registration |
| `/dashboard` | Authenticated | Business overview |
| `/contacts` | Authenticated | Contact list |
| `/contacts/:id` | Authenticated | Contact details |
| `/offers` | Authenticated | Deals and payment tracking |
| `/reports` | Authenticated | Reporting |

## Development checks

Run frontend commands from `frontend`:

```powershell
npm run lint
npm run build
```

`npm run build` runs the TypeScript project build before producing optimized frontend assets in `frontend/dist/`.
