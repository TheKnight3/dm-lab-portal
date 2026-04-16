"""
Shared fixtures for integration tests.

These tests require the full stack running (docker-compose up).
"""

import uuid
import pytest
import requests

BASE_URL = "http://localhost:5000/api/v1"


def _unique_email():
    return f"e2e_{uuid.uuid4().hex[:8]}@test.it"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def admin_headers():
    """Login as the seeded admin and return auth headers."""
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@dmlab.it",
        "password": "adminpass",
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def user_credentials():
    """Generate unique credentials for a fresh user."""
    email = _unique_email()
    password = "TestPass123"
    return {"name": "E2E User", "email": email, "password": password}


@pytest.fixture()
def user_headers(user_credentials):
    """Register a new user and return auth headers."""
    resp = requests.post(f"{BASE_URL}/auth/register", json=user_credentials)
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def seed_ids():
    """Fetch IDs of the first service, doctor and availability slot."""
    services = requests.get(f"{BASE_URL}/services").json()
    assert len(services) > 0, "No services found — is the DB seeded?"

    doctors = requests.get(f"{BASE_URL}/locations/doctors").json()
    assert len(doctors) > 0, "No doctors found"

    doctor_id = doctors[0]["id"]
    avail = requests.get(
        f"{BASE_URL}/locations/availabilities",
        params={"doctor_id": doctor_id},
    ).json()
    assert len(avail) > 0, f"No availability for doctor {doctor_id}"

    return {
        "service_id": services[0]["id"],
        "doctor_id": doctor_id,
        "slot": avail[0]["available_at"],
    }
