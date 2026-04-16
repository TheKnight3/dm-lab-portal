"""
End-to-end integration tests.

Run with the full stack active (docker-compose up):
    pytest integration/test_end_to_end.py -v
"""

import requests
import pytest

BASE = "http://localhost:5000/api/v1"


# ── Health ──────────────────────────────────────────────────────────────────

def test_health():
    resp = requests.get("http://localhost:5000/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── Full user journey ───────────────────────────────────────────────────────

def test_user_journey(user_headers, seed_ids):
    """Register → browse → book → update → cancel."""
    h = user_headers

    # Browse services
    services = requests.get(f"{BASE}/services", headers=h)
    assert services.status_code == 200
    assert len(services.json()) > 0

    # Browse locations
    locations = requests.get(f"{BASE}/locations", headers=h)
    assert locations.status_code == 200

    # Browse doctors
    doctors = requests.get(f"{BASE}/locations/doctors", headers=h)
    assert doctors.status_code == 200

    # Browse availability
    avail = requests.get(
        f"{BASE}/locations/availabilities",
        headers=h,
        params={"doctor_id": seed_ids["doctor_id"]},
    )
    assert avail.status_code == 200

    # Create booking
    booking_resp = requests.post(f"{BASE}/bookings", headers=h, json={
        "service_id": seed_ids["service_id"],
        "doctor_id": seed_ids["doctor_id"],
        "scheduled_at": seed_ids["slot"],
    })
    assert booking_resp.status_code == 201
    booking = booking_resp.json()
    assert booking["status"] == "BOOKED"
    booking_id = booking["id"]

    # List my bookings
    my = requests.get(f"{BASE}/bookings/me", headers=h)
    assert my.status_code == 200
    assert any(b["id"] == booking_id for b in my.json())

    # Update booking notes
    upd = requests.patch(f"{BASE}/bookings/{booking_id}", headers=h, json={
        "notes": "E2E updated",
    })
    assert upd.status_code == 200
    assert upd.json()["notes"] == "E2E updated"

    # Cancel booking
    cancel = requests.delete(f"{BASE}/bookings/{booking_id}", headers=h)
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"


# ── Admin journey ───────────────────────────────────────────────────────────

def test_admin_journey(user_headers, admin_headers, seed_ids):
    """User books → admin completes → payment created → admin cancels."""
    h_user = user_headers
    h_admin = admin_headers

    # User creates booking
    resp = requests.post(f"{BASE}/bookings", headers=h_user, json={
        "service_id": seed_ids["service_id"],
        "doctor_id": seed_ids["doctor_id"],
        "scheduled_at": seed_ids["slot"],
    })
    assert resp.status_code == 201
    booking_id = resp.json()["id"]

    # Admin lists bookings
    admin_list = requests.get(f"{BASE}/admin/bookings", headers=h_admin)
    assert admin_list.status_code == 200
    assert any(b["id"] == booking_id for b in admin_list.json())

    # Admin completes booking (creates payment + report)
    complete = requests.patch(
        f"{BASE}/admin/bookings/{booking_id}",
        headers=h_admin,
        json={"status": "COMPLETED"},
    )
    assert complete.status_code == 200
    assert complete.json()["status"] == "COMPLETED"

    # User can see report
    reports = requests.get(f"{BASE}/reports/me", headers=h_user)
    assert reports.status_code == 200
    assert any(r["booking"]["id"] == booking_id for r in reports.json())

    # Admin cancels (removes payment)
    cancel = requests.patch(
        f"{BASE}/admin/bookings/{booking_id}",
        headers=h_admin,
        json={"status": "CANCELLED"},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"


# ── Auth edge cases ─────────────────────────────────────────────────────────

def test_login_wrong_password():
    resp = requests.post(f"{BASE}/auth/login", json={
        "email": "admin@dmlab.it",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_protected_endpoint_no_token():
    resp = requests.get(f"{BASE}/bookings/me")
    assert resp.status_code == 401


def test_admin_endpoint_forbidden_for_user(user_headers):
    resp = requests.get(f"{BASE}/admin/bookings", headers=user_headers)
    assert resp.status_code == 403


def test_finance_forbidden_for_user(user_headers):
    resp = requests.get(f"{BASE}/admin/finance?period=daily", headers=user_headers)
    assert resp.status_code == 403


# ── Finance (admin) ─────────────────────────────────────────────────────────

def test_finance_daily(admin_headers):
    resp = requests.get(f"{BASE}/admin/finance?period=daily", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_finance_invalid_period(admin_headers):
    resp = requests.get(f"{BASE}/admin/finance?period=yearly", headers=admin_headers)
    assert resp.status_code == 400
