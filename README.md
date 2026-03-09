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
│   └── screenshots/        # Screenshots of the running application
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

### Troubleshooting

If you change ports or database credentials, update the following files accordingly:

- `.env` (backend environment variables)
- `docker-compose.yml` (service ports and environment)
- `frontend/src/environments/environment.ts` (API base URL)

If migrations fail, delete the `backend/migrations` folder and run `flask db init` followed by `flask db migrate` and `flask db upgrade`.