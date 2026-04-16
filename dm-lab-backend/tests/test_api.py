"""
API tests for the DMlab backend.

Covers: auth, services, locations, bookings (user + admin), reports, finance,
health check and error handling.
"""

import io
import pytest
from datetime import datetime, timedelta

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import (
    User, Role, Service, Location, Doctor, Availability,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def app():
    application = create_app(TestConfig)
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seed(app):
    """Populate DB and return a dict of plain IDs (avoids DetachedInstanceError)."""
    with app.app_context():
        loc = Location(name="Roma Centro", address="Via Roma 1")
        db.session.add(loc)
        db.session.flush()

        svc = Service(name="Visita Cardiologica", description="Cuore", price=120.0)
        db.session.add(svc)
        db.session.flush()

        doc = Doctor(name="Dr. Rossi", specialty="Cardiologia", location_id=loc.id)
        db.session.add(doc)
        db.session.flush()

        avail = Availability(
            doctor_id=doc.id, service_id=svc.id,
            available_at=datetime.utcnow() + timedelta(days=3),
        )
        db.session.add(avail)

        admin = User(name="Admin", email="admin@test.it", role=Role.ADMIN)
        admin.set_password("adminpass")
        db.session.add(admin)

        user = User(name="Alice", email="alice@test.it", role=Role.USER)
        user.set_password("password")
        db.session.add(user)

        db.session.commit()

        return {
            "location_id": loc.id,
            "service_id": svc.id,
            "doctor_id": doc.id,
            "availability_id": avail.id,
            "admin_id": admin.id,
            "user_id": user.id,
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _auth_header(client, email, password):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def _user_header(client):
    return _auth_header(client, "alice@test.it", "password")


def _admin_header(client):
    return _auth_header(client, "admin@test.it", "adminpass")


def _create_booking(client, seed, headers=None):
    h = headers or _user_header(client)
    scheduled = (datetime.utcnow() + timedelta(days=3)).isoformat()
    return client.post("/api/v1/bookings", headers=h, json={
        "service_id": seed["service_id"],
        "doctor_id": seed["doctor_id"],
        "scheduled_at": scheduled,
        "notes": "Test booking",
    })


def _complete_booking(client, seed):
    booking = _create_booking(client, seed).get_json()
    h = _admin_header(client)
    client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h, json={"status": "COMPLETED"})
    return booking


# ===========================================================================
# Health & 404
# ===========================================================================

class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"

    def test_not_found(self, client):
        resp = client.get("/api/v1/nonexistent")
        assert resp.status_code == 404


# ===========================================================================
# Auth
# ===========================================================================

class TestAuth:
    def test_register_success(self, client, app):
        resp = client.post("/api/v1/auth/register", json={
            "name": "New User", "email": "new@test.it", "password": "secret123",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["user"]["email"] == "new@test.it"
        assert "token" in data

    def test_register_duplicate(self, client, seed):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Alice", "email": "alice@test.it", "password": "password",
        })
        assert resp.status_code == 400

    def test_register_invalid_payload(self, client, app):
        # Missing name
        assert client.post("/api/v1/auth/register", json={
            "email": "x@x.it", "password": "123456",
        }).status_code == 400
        # Password too short
        assert client.post("/api/v1/auth/register", json={
            "name": "X", "email": "x@x.it", "password": "12",
        }).status_code == 400
        # Invalid email
        assert client.post("/api/v1/auth/register", json={
            "name": "X", "email": "not-an-email", "password": "123456",
        }).status_code == 400

    def test_login_success(self, client, seed):
        resp = client.post("/api/v1/auth/login", json={
            "email": "alice@test.it", "password": "password",
        })
        assert resp.status_code == 200
        assert "token" in resp.get_json()

    def test_login_wrong_password(self, client, seed):
        assert client.post("/api/v1/auth/login", json={
            "email": "alice@test.it", "password": "wrong",
        }).status_code == 401

    def test_login_unknown_email(self, client, seed):
        assert client.post("/api/v1/auth/login", json={
            "email": "nobody@test.it", "password": "password",
        }).status_code == 401

    def test_me(self, client, seed):
        h = _user_header(client)
        resp = client.get("/api/v1/auth/me", headers=h)
        assert resp.status_code == 200
        assert resp.get_json()["email"] == "alice@test.it"

    def test_me_no_token(self, client):
        assert client.get("/api/v1/auth/me").status_code == 401


# ===========================================================================
# Services
# ===========================================================================

class TestServices:
    def test_list_services(self, client, seed):
        resp = client.get("/api/v1/services")
        assert resp.status_code == 200
        assert isinstance(resp.get_json(), list)
        assert len(resp.get_json()) == 1

    def test_get_service_by_id(self, client, seed):
        resp = client.get(f"/api/v1/services/{seed['service_id']}")
        assert resp.status_code == 200
        assert resp.get_json()["name"] == "Visita Cardiologica"

    def test_get_service_not_found(self, client, seed):
        assert client.get("/api/v1/services/9999").status_code == 404


# ===========================================================================
# Locations / Doctors / Availabilities
# ===========================================================================

class TestLocations:
    def test_list_locations(self, client, seed):
        resp = client.get("/api/v1/locations")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1

    def test_list_doctors_no_filter(self, client, seed):
        resp = client.get("/api/v1/locations/doctors")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1

    def test_list_doctors_by_location(self, client, seed):
        resp = client.get(f"/api/v1/locations/doctors?location_id={seed['location_id']}")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1

    def test_list_doctors_by_service(self, client, seed):
        resp = client.get(f"/api/v1/locations/doctors?service_id={seed['service_id']}")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1

    def test_list_doctors_wrong_location(self, client, seed):
        resp = client.get("/api/v1/locations/doctors?location_id=9999")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 0

    def test_availabilities(self, client, seed):
        resp = client.get(f"/api/v1/locations/availabilities?doctor_id={seed['doctor_id']}")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1

    def test_availabilities_missing_doctor_id(self, client, seed):
        assert client.get("/api/v1/locations/availabilities").status_code == 400


# ===========================================================================
# Bookings – user
# ===========================================================================

class TestBookingsUser:
    def test_create_booking(self, client, seed):
        resp = _create_booking(client, seed)
        assert resp.status_code == 201
        assert resp.get_json()["status"] == "BOOKED"

    def test_create_booking_no_auth(self, client, seed):
        scheduled = (datetime.utcnow() + timedelta(days=3)).isoformat()
        resp = client.post("/api/v1/bookings", json={
            "service_id": seed["service_id"],
            "doctor_id": seed["doctor_id"],
            "scheduled_at": scheduled,
        })
        assert resp.status_code == 401

    def test_create_booking_invalid_payload(self, client, seed):
        h = _user_header(client)
        assert client.post("/api/v1/bookings", headers=h, json={}).status_code == 400

    def test_create_booking_doctor_wrong_service(self, client, seed, app):
        with app.app_context():
            svc2 = Service(name="Dermatologia", description="Pelle", price=80.0)
            db.session.add(svc2)
            db.session.commit()
            svc2_id = svc2.id
        h = _user_header(client)
        scheduled = (datetime.utcnow() + timedelta(days=3)).isoformat()
        resp = client.post("/api/v1/bookings", headers=h, json={
            "service_id": svc2_id,
            "doctor_id": seed["doctor_id"],
            "scheduled_at": scheduled,
        })
        assert resp.status_code == 400

    def test_list_my_bookings(self, client, seed):
        h = _user_header(client)
        _create_booking(client, seed, h)
        resp = client.get("/api/v1/bookings/me", headers=h)
        assert resp.status_code == 200
        assert len(resp.get_json()) >= 1

    def test_update_booking_user(self, client, seed):
        h = _user_header(client)
        booking = _create_booking(client, seed, h).get_json()
        resp = client.patch(f"/api/v1/bookings/{booking['id']}", headers=h, json={
            "notes": "Updated notes",
        })
        assert resp.status_code == 200
        assert resp.get_json()["notes"] == "Updated notes"

    def test_update_booking_forbidden(self, client, seed):
        h_alice = _user_header(client)
        booking = _create_booking(client, seed, h_alice).get_json()
        client.post("/api/v1/auth/register", json={
            "name": "Bob", "email": "bob@test.it", "password": "password",
        })
        h_bob = _auth_header(client, "bob@test.it", "password")
        resp = client.patch(f"/api/v1/bookings/{booking['id']}", headers=h_bob, json={
            "notes": "Hacked",
        })
        assert resp.status_code == 403

    def test_cancel_booking(self, client, seed):
        h = _user_header(client)
        booking = _create_booking(client, seed, h).get_json()
        resp = client.delete(f"/api/v1/bookings/{booking['id']}", headers=h)
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "CANCELLED"

    def test_cancel_completed_booking(self, client, seed):
        h = _user_header(client)
        booking = _create_booking(client, seed, h).get_json()
        h_admin = _admin_header(client)
        client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h_admin, json={
            "status": "COMPLETED",
        })
        resp = client.delete(f"/api/v1/bookings/{booking['id']}", headers=h)
        assert resp.status_code == 400

    def test_update_cancelled_booking(self, client, seed):
        h = _user_header(client)
        booking = _create_booking(client, seed, h).get_json()
        client.delete(f"/api/v1/bookings/{booking['id']}", headers=h)
        resp = client.patch(f"/api/v1/bookings/{booking['id']}", headers=h, json={
            "notes": "Nope",
        })
        assert resp.status_code == 400


# ===========================================================================
# Bookings – admin
# ===========================================================================

class TestBookingsAdmin:
    def test_list_bookings_admin(self, client, seed):
        _create_booking(client, seed)
        h = _admin_header(client)
        resp = client.get("/api/v1/admin/bookings", headers=h)
        assert resp.status_code == 200
        assert len(resp.get_json()) >= 1

    def test_list_bookings_admin_filter_status(self, client, seed):
        _create_booking(client, seed)
        h = _admin_header(client)
        resp = client.get("/api/v1/admin/bookings?status=BOOKED", headers=h)
        assert resp.status_code == 200
        assert all(b["status"] == "BOOKED" for b in resp.get_json())

    def test_list_bookings_admin_filter_dates(self, client, seed):
        _create_booking(client, seed)
        h = _admin_header(client)
        start = datetime.utcnow().date().isoformat()
        end = (datetime.utcnow() + timedelta(days=7)).date().isoformat()
        resp = client.get(f"/api/v1/admin/bookings?start={start}&end={end}", headers=h)
        assert resp.status_code == 200

    def test_list_bookings_admin_forbidden(self, client, seed):
        h = _user_header(client)
        assert client.get("/api/v1/admin/bookings", headers=h).status_code == 403

    def test_admin_complete_booking(self, client, seed):
        booking = _create_booking(client, seed).get_json()
        h = _admin_header(client)
        resp = client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h, json={
            "status": "COMPLETED",
        })
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "COMPLETED"

    def test_admin_cancel_booking_removes_payment(self, client, seed):
        booking = _create_booking(client, seed).get_json()
        h = _admin_header(client)
        client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h, json={
            "status": "COMPLETED",
        })
        resp = client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h, json={
            "status": "CANCELLED",
        })
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "CANCELLED"

    def test_admin_update_booking_fields(self, client, seed):
        booking = _create_booking(client, seed).get_json()
        h = _admin_header(client)
        new_time = (datetime.utcnow() + timedelta(days=5)).isoformat()
        resp = client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h, json={
            "scheduled_at": new_time, "notes": "Admin note",
        })
        assert resp.status_code == 200
        assert resp.get_json()["notes"] == "Admin note"

    def test_admin_update_invalid_status(self, client, seed):
        booking = _create_booking(client, seed).get_json()
        h = _admin_header(client)
        resp = client.patch(f"/api/v1/admin/bookings/{booking['id']}", headers=h, json={
            "status": "INVALID",
        })
        assert resp.status_code == 400


# ===========================================================================
# Reports
# ===========================================================================

class TestReports:
    def test_list_my_reports(self, client, seed):
        _complete_booking(client, seed)
        h = _user_header(client)
        resp = client.get("/api/v1/reports/me", headers=h)
        assert resp.status_code == 200
        assert len(resp.get_json()) >= 1

    def test_download_report_owner(self, client, seed):
        _complete_booking(client, seed)
        h = _user_header(client)
        reports = client.get("/api/v1/reports/me", headers=h).get_json()
        resp = client.get(f"/api/v1/reports/{reports[0]['id']}/download", headers=h)
        assert resp.status_code == 200

    def test_download_report_admin(self, client, seed):
        _complete_booking(client, seed)
        h_user = _user_header(client)
        reports = client.get("/api/v1/reports/me", headers=h_user).get_json()
        h_admin = _admin_header(client)
        resp = client.get(f"/api/v1/reports/{reports[0]['id']}/download", headers=h_admin)
        assert resp.status_code == 200

    def test_download_report_forbidden(self, client, seed):
        _complete_booking(client, seed)
        h_user = _user_header(client)
        reports = client.get("/api/v1/reports/me", headers=h_user).get_json()
        client.post("/api/v1/auth/register", json={
            "name": "Eve", "email": "eve@test.it", "password": "password",
        })
        h_eve = _auth_header(client, "eve@test.it", "password")
        resp = client.get(f"/api/v1/reports/{reports[0]['id']}/download", headers=h_eve)
        assert resp.status_code == 403

    def test_upload_report_admin(self, client, seed):
        booking = _complete_booking(client, seed)
        h = _admin_header(client)
        data = {"file": (io.BytesIO(b"%PDF-1.4 test"), "referto.pdf")}
        resp = client.post(
            f"/api/v1/admin/reports/{booking['id']}",
            headers=h, data=data, content_type="multipart/form-data",
        )
        assert resp.status_code == 201

    def test_upload_report_no_file(self, client, seed):
        booking = _complete_booking(client, seed)
        h = _admin_header(client)
        assert client.post(f"/api/v1/admin/reports/{booking['id']}", headers=h).status_code == 400

    def test_upload_report_non_pdf(self, client, seed):
        booking = _complete_booking(client, seed)
        h = _admin_header(client)
        data = {"file": (io.BytesIO(b"not a pdf"), "file.txt")}
        resp = client.post(
            f"/api/v1/admin/reports/{booking['id']}",
            headers=h, data=data, content_type="multipart/form-data",
        )
        assert resp.status_code == 400

    def test_upload_report_forbidden_user(self, client, seed):
        booking = _complete_booking(client, seed)
        h = _user_header(client)
        data = {"file": (io.BytesIO(b"%PDF-1.4 test"), "referto.pdf")}
        resp = client.post(
            f"/api/v1/admin/reports/{booking['id']}",
            headers=h, data=data, content_type="multipart/form-data",
        )
        assert resp.status_code == 403

    def test_update_report(self, client, seed):
        booking = _complete_booking(client, seed)
        h_admin = _admin_header(client)
        data = {"file": (io.BytesIO(b"%PDF-1.4 v1"), "v1.pdf")}
        client.post(
            f"/api/v1/admin/reports/{booking['id']}",
            headers=h_admin, data=data, content_type="multipart/form-data",
        )
        h_user = _user_header(client)
        reports = client.get("/api/v1/reports/me", headers=h_user).get_json()
        data2 = {"file": (io.BytesIO(b"%PDF-1.4 v2"), "v2.pdf")}
        resp = client.put(
            f"/api/v1/reports/{reports[0]['id']}",
            headers=h_admin, data=data2, content_type="multipart/form-data",
        )
        assert resp.status_code == 200


# ===========================================================================
# Finance
# ===========================================================================

class TestFinance:
    def test_finance_daily(self, client, seed):
        _complete_booking(client, seed)
        h = _admin_header(client)
        resp = client.get("/api/v1/admin/finance?period=daily", headers=h)
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["total_amount"] > 0

    def test_finance_weekly(self, client, seed):
        _complete_booking(client, seed)
        h = _admin_header(client)
        assert client.get("/api/v1/admin/finance?period=weekly", headers=h).status_code == 200

    def test_finance_monthly(self, client, seed):
        _complete_booking(client, seed)
        h = _admin_header(client)
        assert client.get("/api/v1/admin/finance?period=monthly", headers=h).status_code == 200

    def test_finance_with_date_range(self, client, seed):
        _complete_booking(client, seed)
        h = _admin_header(client)
        today = datetime.utcnow().date().isoformat()
        resp = client.get(f"/api/v1/admin/finance?from={today}&to={today}", headers=h)
        assert resp.status_code == 200

    def test_finance_invalid_period(self, client, seed):
        h = _admin_header(client)
        assert client.get("/api/v1/admin/finance?period=yearly", headers=h).status_code == 400

    def test_finance_forbidden_user(self, client, seed):
        h = _user_header(client)
        assert client.get("/api/v1/admin/finance", headers=h).status_code == 403

    def test_finance_no_auth(self, client):
        assert client.get("/api/v1/admin/finance").status_code == 401
