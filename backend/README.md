# ClientDesk backend

The backend is the FastAPI service used by the ClientDesk frontend. It provides account registration and authentication, contact and deal management, payment tracking, and reporting endpoints. It uses SQLAlchemy to access the database and Alembic to manage schema migrations.

For the complete product overview and frontend setup, see the [project README](../README.md).

## Features

- Email-verified account registration, login, current-user lookup, token refresh, and logout.
- Short-lived access tokens and rotating refresh tokens stored in an HTTP-only cookie.
- Contact creation, search/listing, detail retrieval, editing, and deletion.
- Deal/offer pipeline management, summary data, stage updates, and payment updates.
- Report data, PDF downloads, and emailed reports.
- Per-user authorization for CRM data.

## Technology

- Python with FastAPI and Pydantic
- SQLAlchemy 2 for database access
- PostgreSQL with psycopg2
- Alembic for database migrations
- PyJWT and pwdlib/Argon2 for authentication
- Resend for email delivery
- ReportLab for PDF reports

## Project layout

```text
app/portal/
  main.py              FastAPI app, CORS configuration, and router registration
  auth.py              Authentication endpoints
  contacts.py          Contact endpoints
  offers.py            Deal and payment endpoints
  reports.py           Reporting, PDF, and email endpoints
  models.py            Pydantic request and response models
shared_package/
  db/                  SQLAlchemy engine, session dependency, and database models
  sync_function/       Authentication and domain service functions
alembic/
  versions/             Database migration revisions
alembic.ini             Alembic configuration
requirements.txt        Python dependencies
```

## Requirements

- Python 3.10 or later
- PostgreSQL
- A Resend account with a verified sender address for registration email

## Local setup

Run commands from the `backend` directory so `.env` is loaded as expected.

### 1. Create a virtual environment and install dependencies

Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment variables

Create `backend/.env` and set values for your local environment. Never commit real secrets.

```dotenv
DATABASE_URL=postgresql://postgres:your-local-password@localhost:5432/clientdesk
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=ClientDesk <verified-sender@example.com>
FRONTEND_REDIRECT_URI=http://localhost:5173
COOKIE_SECURE=false
```

Create the PostgreSQL database named in `DATABASE_URL` before migrating. The current Alembic environment uses `psycopg2`, so use a PostgreSQL connection URL when running migrations.

The backend requires `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `RESEND_API_KEY`, and `EMAIL_FROM`. A valid Resend API key and verified sender are needed for email verification and report email.

Optional settings:

| Variable | Default | Description |
| --- | --- | --- |
| `FRONTEND_REDIRECT_URI` | `http://localhost:5173` | Frontend origin used for CORS and signup links |
| `FRONTEND_URI` | None | Fallback frontend origin for signup links |
| `COOKIE_SECURE` | `false` | Set to `true` when the API is served over HTTPS |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `14` | Refresh-token lifetime |
| `EMAIL_VERIFY_EXPIRE_MINUTES` | `60` | Signup verification-link lifetime |
| `BRAND_NAME` | `ClientDesk` | Brand name used in emails |

### 3. Apply migrations

With the virtual environment active and `.env` configured:

```powershell
python -m alembic upgrade head
```

The same command works in macOS/Linux shells.

### 4. Start the API

```powershell
python -m uvicorn app.portal.main:app --reload
```

The API listens at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`; the generated schema is at `http://localhost:8000/openapi.json`.

## API route groups

| Prefix | Description |
| --- | --- |
| `/auth` | Registration, signup verification, current-user lookup, login, refresh, and logout |
| `/contacts` | List/search, create, retrieve, update, and delete contacts |
| `/offers` | List and create offers, view summaries, update stages, and update payments |
| `/reports` | Retrieve report data, download a PDF, and email a report |

CRM endpoints require an authenticated user. See `/docs` for endpoint methods, request schemas, and query parameters.

## Frontend connection and CORS

The frontend API client defaults to `http://localhost:8000`. Set `VITE_API_URL` in the frontend environment to use a different API origin. The frontend sends credentialed requests so the browser can include the refresh cookie.

The current CORS configuration allows the `FRONTEND_REDIRECT_URI` origin and these local origins:

- `http://127.0.0.1:5173`
- `http://localhost:5174`

The default `FRONTEND_REDIRECT_URI` is `http://localhost:5173`. If the frontend runs on another origin, update the backend CORS configuration in `app/portal/main.py` as well as `FRONTEND_REDIRECT_URI`.

## Production notes

- Use a strong, unique `SECRET_KEY` and keep it outside version control.
- Serve the API and frontend over HTTPS, and set `COOKIE_SECURE=true` in production.
- Restrict CORS to the intended frontend origin rather than broadening it unnecessarily.
- Use production database credentials and take regular database backups.
- Apply Alembic migrations during deployment and verify the resulting schema.
- Configure Resend with a verified production sender address.
