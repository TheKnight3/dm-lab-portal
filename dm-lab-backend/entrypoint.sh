#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Use psycopg2 to wait for the database instead of relying on the pg_isready
python - <<'PY'
import os, time, psycopg2

host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
user = os.environ.get("POSTGRES_USER", "postgres")
password = os.environ.get("POSTGRES_PASSWORD", "postgres")
dbname = os.environ.get("POSTGRES_DB", "postgres")

for i in range(60):
    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)
        conn.close()
        print("Database is ready")
        break
    except Exception:
        print("Postgres is unavailable - sleeping")
        time.sleep(1)
else:
    raise SystemExit("Could not connect to database after 60 attempts")
PY

echo "Creating tables (SQLAlchemy create_all)..."
python - <<'PY'
from app import create_app
from app.extensions import db
app = create_app()
with app.app_context():
    db.create_all()
PY

echo "Seeding database..."
python seed.py

echo "Starting Flask server"
exec flask run --host=0.0.0.0 --port=5000