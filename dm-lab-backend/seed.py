"""
Standalone script to initialise the database and insert seed data.

Run this script after running migrations to populate your database with
dummy users, services, bookings, payments and reports. It leverages the
``seed_db`` function defined in ``app/seed_data.py``.
"""

from flask import current_app
from flask.cli import with_appcontext
import click

from app import create_app
from app.extensions import db
from app.seed_data import seed_db


app = create_app()


@app.cli.command("seed")
@with_appcontext
def seed_command():
    """Seed the database with initial data."""
    click.echo("Seeding database...")
    seed_db()
    click.echo("Seeding complete.")


if __name__ == "__main__":
    # create context and seed
    with app.app_context():
        seed_db()