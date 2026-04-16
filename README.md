# DMlab Healthcare Platform

This repository contains the complete project work for a full‑stack application developed for **DMlab** – a network of poly‑specialist clinics located in Rome and Ostia. The goal of the project is to demonstrate how a modern web application can digitalise and streamline healthcare services such as booking medical appointments, managing patient reports and providing administrative dashboards.

## Project overview

The solution implements a **separation of concerns** between a RESTful backend and a client side single page application. A PostgreSQL database stores all domain entities (users, services, bookings, payments and reports). Authentication and authorisation is based on JSON Web Tokens (JWT) with two roles:

- **USER** – patients/clients who can browse services, make bookings, view their appointments and download reports.
- **ADMIN** – clinic staff who can see all bookings for the current day, update booking statuses and access a financial dashboard showing daily, weekly and monthly revenue.

### Stack

| Layer    | Technology                         |
|---------|-------------------------------------|
| Frontend| React (TypeScript) via Vite         |
| Backend | Python with Flask (REST API)        |
| Database| PostgreSQL via SQLAlchemy ORM       |
| Auth    | JWT (Flask‑JWT‑Extended)            |
| API docs| OpenAPI/Swagger (serves at `/docs`) |

## Repository structure

```
dm-lab-project/
├── dm-lab-backend/        # Flask application and database models
│   ├── app/
│   │   ├── __init__.py    # Application factory
│   │   ├── config.py      # Config classes
│   │   ├── extensions.py  # Initialises DB and JWT
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── routes/        # Blueprints for each resource
│   │   │   ├── __init__.py
│   │   │   ├── auth.py    # Authentication endpoints
│   │   │   ├── services.py
│   │   │   ├── bookings.py
│   │   │   ├── reports.py
│   │   │   └── finance.py
│   │   ├── schemas.py     # Marshmallow schemas for input validation
│   │   └── seed_data.py   # Script used by seed.py to populate the DB
│   ├── migrations/        # Database migration scripts (Alembic)
│   ├── seed.py            # CLI script to seed initial data
│   ├── requirements.txt   # Python dependencies
│   ├── tests/
│   │   └── test_api.py    # Automated API test suite (pytest)
│   ├── .env.example       # Example environment variables
│   └── Dockerfile         # Container definition for backend
├── dm-lab-frontend/       # Frontend SPA (React + TypeScript using Vite)
│   ├── package.json            # Dependency management and npm scripts
│   ├── package-lock.json       # Locks dependency versions for reproducible builds
│   ├── index.html              # SPA entry point
│   ├── vite.config.ts          # Vite configuration (dev server and proxy)
│   ├── tailwind.config.ts      # Tailwind CSS configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── public/
│   │   └── favicon.ico         # Custom application favicon
│   └── src/
│       ├── main.tsx            # React application bootstrap
│       ├── App.tsx             # Application routing (react-router)
│       ├── lib/                # Centralized API client
│       ├── contexts/           # React contexts (authentication and global state)
│       ├── pages/              # Pages: home, booking, login, register, user area, admin area, finance dashboard
│       ├── components/         # Reusable UI components (Navbar, Footer, tables, forms)
│       ├── test/               # Frontend test suite (Vitest + React Testing Library)
│       │   ├── setup.ts        # Test environment setup (jest-dom, matchMedia polyfill)
│       │   ├── helpers.tsx     # Shared renderWithProviders wrapper
│       │   ├── utils.test.ts   # Unit tests for utilities and API client
│       │   └── components.test.tsx  # Component rendering tests
│       └── styles/             # Custom styles and Tailwind utilities
├── db/
│   └── seed.py            # Convenience script for seeding from the project root
├── docs/
│   ├── diagrams/
│   │   ├── use_case_diagram.puml
│   │   ├── class_diagram.puml
│   │   ├── sequence_login.puml
│   │   ├── sequence_booking.puml
│   │   ├── sequence_download.puml
│   │   ├── sequence_admin.puml
│   │   └── er_diagram.puml
│   ├── api/
│   │   └── openapi.yaml
│   ├── screenshots/        # Screenshots of the running application
│   └── report/             # Test results and HTML coverage report
├── integration/            # End-to-end and stress tests (require running stack)
│   ├── conftest.py         # Shared fixtures (base URL, auth helpers, seed IDs)
│   ├── test_end_to_end.py  # Full user and admin journey tests
│   ├── test_stress.py      # Load tests with 100 concurrent users
│   └── run_integration_tests.sh  # Script to start stack, run tests, save reports
├── docker-compose.yml      # Defines services for backend, frontend and database
└── README.md               # This file
```

## Running the application

The recommended way to start the project is using [Docker Compose](https://docs.docker.com/compose/). Ensure Docker and Docker Compose are installed on your system, then run the following commands from within the `dm-lab-project` directory:

```bash
# build and start all services (database, backend and frontend)
docker-compose up --build

# alternatively, start services in the background
docker-compose up -d
```

### Services exposed

- **Frontend**: <http://localhost:4200> – the SPA React
- **Backend API**: <http://localhost:5000/api/v1/> – REST endpoints
- **Swagger UI**: <http://localhost:5000/docs> – interactive API documentation
- **PostgreSQL**: port `5432` (internal to docker network)

The first boot may take a few minutes because the database is initialised, migrations are run and dummy seed data is inserted. After the stack is running you can log in using the credentials defined in the seed (see `.env.example`).

### Manual setup (without Docker)

If you prefer not to use Docker, you can run the backend and frontend directly on your machine. Follow these steps:

1. **Backend**
   - Install Python 3.9 or later and create a virtual environment.
   - Copy `.env.example` to `.env` and adjust variables such as `DATABASE_URL` and `JWT_SECRET_KEY`.
   - Install dependencies:
     ```bash
     cd dm-lab-backend
     python -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     ```
   - Initialise the database:
     ```bash
     flask db upgrade
     python seed.py
     ```
   - Start the API server:
     ```bash
     flask run --host=0.0.0.0 --port=5000
     ```

2. **Frontend**
   - Install Node.js (16.x+) and npm.
   - Inside the `dm-lab-frontend` folder run:
     ```bash
     npm install
     npm start
     ```
   - The SPA React app will be served at <http://localhost:4200> and will proxy API requests to the backend.

### Default credentials

The seed script creates an administrator and two demo users:

| Role  | Email                | Password |
|------|----------------------|----------|
| Admin | `admin@dmlab.it`   | `adminpass` |
| User  | `alice@dmlab.it`   | `password`  |
| User  | `bob@dmlab.it`     | `password`  |

After logging in you can make and manage bookings, view reports and browse the financial dashboard.

## Backend testing

The backend includes a comprehensive automated test suite located in `dm-lab-backend/tests/test_api.py`. The tests are written with **pytest** and use an in‑memory SQLite database so that no external services are required.

### Test categories

The 54 test cases are organised into seven groups:

| Group | Tests | What is verified |
|---|---|---|
| Health & 404 | 2 | Health‑check endpoint and generic not‑found handler |
| Auth | 8 | Registration (success, duplicate, invalid payload), login (success, wrong password, unknown email), profile retrieval with and without JWT |
| Services | 3 | List all services, get by ID, 404 on missing service |
| Locations | 7 | List locations, doctors (no filter, by location, by service, wrong location), availabilities (success, missing parameter) |
| Bookings – user | 10 | Create (success, no auth, invalid payload, wrong doctor/service), list own bookings, update, forbidden update by another user, cancel, cancel completed (400), update cancelled (400) |
| Bookings – admin | 8 | List with filters (status, date range), forbidden for non‑admin, complete booking (creates payment + report), cancel (removes payment), update fields, invalid status |
| Reports | 9 | List own reports, download (owner, admin, forbidden), upload (admin, no file, non‑PDF, forbidden user), update report |
| Finance | 7 | Daily/weekly/monthly aggregation, date range filter, invalid period, forbidden for non‑admin, no auth |

### Prerequisites

Python 3.9+ is required. Install the test dependencies alongside the application ones:

```bash
cd dm-lab-backend
pip install -r requirements.txt pytest pytest-cov
```

### Running the tests

```bash
# Run all tests with verbose output
pytest tests/test_api.py -v

# Run with coverage report (terminal)
pytest tests/test_api.py -v --cov=app --cov-report=term-missing

# Generate an HTML coverage report
pytest tests/test_api.py --cov=app --cov-report=html:../docs/report/htmlcov
```

The HTML report is saved under `docs/report/htmlcov/` and can be opened in a browser (`index.html`).

### Coverage results

| Module | Statements | Missed | Coverage |
|---|---|---|---|
| `app/__init__.py` | 31 | 0 | **100 %** |
| `app/config.py` | 19 | 0 | **100 %** |
| `app/extensions.py` | 8 | 0 | **100 %** |
| `app/models.py` | 94 | 8 | **91 %** |
| `app/schemas.py` | 75 | 0 | **100 %** |
| `app/routes/auth.py` | 57 | 7 | **88 %** |
| `app/routes/services.py` | 14 | 0 | **100 %** |
| `app/routes/locations.py` | 32 | 0 | **100 %** |
| `app/routes/bookings.py` | 197 | 46 | **77 %** |
| `app/routes/reports.py` | 115 | 20 | **83 %** |
| `app/routes/finance.py` | 54 | 5 | **91 %** |
| `app/seed_data.py` | 74 | 74 | 0 % |
| **TOTAL** | **770** | **160** | **79 %** |

> `seed_data.py` is a one‑off data population script and is intentionally excluded from the test scope. Excluding it, the effective coverage of application code rises to approximately **88 %**.

## Frontend testing

The frontend includes a test suite written with **Vitest** and **React Testing Library**, located under `dm-lab-frontend/src/test/`. The test environment uses **jsdom** to simulate a browser DOM and a setup file (`setup.ts`) that configures `@testing-library/jest-dom` matchers and polyfills `window.matchMedia`.

### Test categories

The test cases are split into two files:

| File | Tests | What is verified |
|---|---|---|
| `utils.test.ts` | 8 | Pure unit tests for the `cn` Tailwind merge utility (merge, conflict resolution, conditional classes), `getServiceBySlug` lookup (known slug, unknown slug, data integrity), and the `ApiError` class (status, message, body) |
| `components.test.tsx` | 18 | Component rendering tests for Navbar (brand, navigation items, "Prenota ora" button, "Area Riservata" link, contact info), Footer (brand, copyright, contacts, locations, useful links), NotFound page (404 heading, home link), ProtectedRoute (redirect when unauthenticated), LoginPage (form fields, registration link, submit button), RegisterPage (form fields, login link, submit button) |

All component tests use a shared `renderWithProviders` helper (`helpers.tsx`) that wraps components with `MemoryRouter`, `QueryClientProvider` and `AuthProvider`. The API module is mocked via `vi.mock` so that no real HTTP calls are made during testing.

### Prerequisites

Node.js 16+ and npm are required. Install dependencies (if not already done):

```bash
cd dm-lab-frontend
npm install
```

### Running the tests

```bash
# Run all tests once
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with verbose output
npx vitest run --reporter=verbose
```

## Integration and stress testing

The `integration/` folder contains end‑to‑end and load tests that run against the **full application stack** (PostgreSQL + Flask + React via Docker Compose). These tests use **pytest** with the **requests** library to make real HTTP calls.

### What is tested

| File | Tests | Description |
|---|---|---|
| `test_end_to_end.py` | 9 | Full user journey (register → browse → book → update → cancel), admin journey (complete → report → cancel), auth edge cases, finance |
| `test_stress.py` | 3 | 100 concurrent logins, 100 concurrent bookings, 100 concurrent reads on public endpoints |

The stress tests measure **response time** (avg, median, P95, max) and **success rate**, with a pass threshold of ≥ 95 %.

### Running the integration tests

A single script handles the entire lifecycle:

```bash
bash integration/run_integration_tests.sh
```

The script will:
1. Build and start all services with `docker-compose up -d --build`
2. Wait for the backend health endpoint to respond (up to 120 s)
3. Install test dependencies (`requests`, `pytest`)
4. Run `test_end_to_end.py` and save output to `docs/report/integration_e2e_results.txt`
5. Run `test_stress.py` and save output to `docs/report/integration_stress_results.txt`
6. Print a summary and tear down the stack with `docker-compose down`

You can also run the tests manually (with the stack already running):

```bash
# End-to-end only
pytest integration/test_end_to_end.py -v

# Stress only (use -s to see timing output)
pytest integration/test_stress.py -v -s
```

> **Note:** If running on Windows with WSL, start Docker inside WSL first (`sudo service docker start`) then run the script from the WSL shell.

## Troubleshooting

If you change ports or database credentials, update the following files accordingly:

- `.env` (backend environment variables)
- `docker-compose.yml` (service ports and environment)
- `frontend/src/environments/environment.ts` (API base URL)

If migrations fail, delete the `backend/migrations` folder and run `flask db init` followed by `flask db migrate` and `flask db upgrade`.