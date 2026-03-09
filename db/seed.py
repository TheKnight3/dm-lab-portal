"""
Convenience script to run the seed command from the project root.

This script simply imports the backend application factory and invokes the
``seed_db`` function. It allows you to execute ``python db/seed.py`` from
the project root without having to enter the backend folder.
"""

from backend.app import create_app
from backend.app.seed_data import seed_db

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        seed_db()
        print("Database seeded.")