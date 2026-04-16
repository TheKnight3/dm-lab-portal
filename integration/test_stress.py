"""
Stress and load tests.

Simulate concurrent users hitting the most critical endpoints (login and
booking creation) to verify the system behaves correctly under load.

Run with the full stack active (docker-compose up):
    pytest integration/test_stress.py -v -s
"""

import time
import uuid
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import pytest

BASE = "http://localhost:5000/api/v1"

CONCURRENT_USERS = 100


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _register_and_login():
    """Register a unique user and return (token, email)."""
    email = f"stress_{uuid.uuid4().hex[:8]}@test.it"
    password = "StressPass1"
    requests.post(f"{BASE}/auth/register", json={
        "name": "Stress User",
        "email": email,
        "password": password,
    })
    resp = requests.post(f"{BASE}/auth/login", json={
        "email": email,
        "password": password,
    })
    return resp.json()["token"], email


def _timed_request(method, url, **kwargs):
    """Execute a request and return (status_code, elapsed_ms)."""
    start = time.perf_counter()
    resp = method(url, **kwargs)
    elapsed = (time.perf_counter() - start) * 1000
    return resp.status_code, elapsed


# ---------------------------------------------------------------------------
# Stress test: concurrent logins
# ---------------------------------------------------------------------------

class TestStressLogin:
    """Simulate CONCURRENT_USERS simultaneous login attempts."""

    @pytest.fixture(autouse=True, scope="class")
    def _setup(self):
        """Pre-register users so the login stress test only measures login."""
        self.__class__.credentials = []
        for _ in range(CONCURRENT_USERS):
            email = f"slogin_{uuid.uuid4().hex[:8]}@test.it"
            pwd = "StressPass1"
            requests.post(f"{BASE}/auth/register", json={
                "name": "Login Stress",
                "email": email,
                "password": pwd,
            })
            self.__class__.credentials.append((email, pwd))

    def test_concurrent_logins(self):
        results = []

        def do_login(creds):
            email, pwd = creds
            return _timed_request(
                requests.post,
                f"{BASE}/auth/login",
                json={"email": email, "password": pwd},
            )

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as pool:
            futures = [pool.submit(do_login, c) for c in self.credentials]
            for f in as_completed(futures):
                results.append(f.result())

        statuses = [r[0] for r in results]
        times = [r[1] for r in results]
        success = statuses.count(200)
        errors = len(statuses) - success

        print(f"\n{'='*60}")
        print(f"STRESS TEST: {CONCURRENT_USERS} concurrent logins")
        print(f"  Success: {success}/{CONCURRENT_USERS}")
        print(f"  Errors:  {errors}")
        print(f"  Avg response time: {statistics.mean(times):.0f} ms")
        print(f"  Median:            {statistics.median(times):.0f} ms")
        print(f"  P95:               {sorted(times)[int(len(times)*0.95)]:.0f} ms")
        print(f"  Max:               {max(times):.0f} ms")
        print(f"{'='*60}")

        # At least 95% of requests should succeed
        assert success >= CONCURRENT_USERS * 0.95, (
            f"Too many login failures: {errors}/{CONCURRENT_USERS}"
        )


# ---------------------------------------------------------------------------
# Stress test: concurrent bookings
# ---------------------------------------------------------------------------

class TestStressBookings:
    """Simulate CONCURRENT_USERS simultaneous booking creations."""

    @pytest.fixture(autouse=True, scope="class")
    def _setup(self, seed_ids):
        """Pre-register users and store tokens + seed IDs."""
        self.__class__.tokens = []
        self.__class__.seed = seed_ids
        for _ in range(CONCURRENT_USERS):
            token, _ = _register_and_login()
            self.__class__.tokens.append(token)

    def test_concurrent_bookings(self):
        results = []

        def do_booking(token):
            headers = {"Authorization": f"Bearer {token}"}
            return _timed_request(
                requests.post,
                f"{BASE}/bookings",
                headers=headers,
                json={
                    "service_id": self.seed["service_id"],
                    "doctor_id": self.seed["doctor_id"],
                    "scheduled_at": self.seed["slot"],
                },
            )

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as pool:
            futures = [pool.submit(do_booking, t) for t in self.tokens]
            for f in as_completed(futures):
                results.append(f.result())

        statuses = [r[0] for r in results]
        times = [r[1] for r in results]
        success = statuses.count(201)
        errors = len(statuses) - success

        print(f"\n{'='*60}")
        print(f"STRESS TEST: {CONCURRENT_USERS} concurrent bookings")
        print(f"  Success (201): {success}/{CONCURRENT_USERS}")
        print(f"  Errors:        {errors}")
        print(f"  Avg response time: {statistics.mean(times):.0f} ms")
        print(f"  Median:            {statistics.median(times):.0f} ms")
        print(f"  P95:               {sorted(times)[int(len(times)*0.95)]:.0f} ms")
        print(f"  Max:               {max(times):.0f} ms")
        print(f"{'='*60}")

        assert success >= CONCURRENT_USERS * 0.95, (
            f"Too many booking failures: {errors}/{CONCURRENT_USERS}"
        )


# ---------------------------------------------------------------------------
# Stress test: mixed read load (services + locations)
# ---------------------------------------------------------------------------

class TestStressReadEndpoints:
    """Simulate CONCURRENT_USERS hitting read-only endpoints concurrently."""

    def test_concurrent_reads(self):
        results = []
        endpoints = [
            f"{BASE}/services",
            f"{BASE}/locations",
            f"{BASE}/locations/doctors",
        ]

        def do_read(url):
            return _timed_request(requests.get, url)

        with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as pool:
            futures = []
            for i in range(CONCURRENT_USERS):
                url = endpoints[i % len(endpoints)]
                futures.append(pool.submit(do_read, url))
            for f in as_completed(futures):
                results.append(f.result())

        statuses = [r[0] for r in results]
        times = [r[1] for r in results]
        success = statuses.count(200)

        print(f"\n{'='*60}")
        print(f"STRESS TEST: {CONCURRENT_USERS} concurrent reads (services/locations/doctors)")
        print(f"  Success: {success}/{CONCURRENT_USERS}")
        print(f"  Avg response time: {statistics.mean(times):.0f} ms")
        print(f"  Median:            {statistics.median(times):.0f} ms")
        print(f"  P95:               {sorted(times)[int(len(times)*0.95)]:.0f} ms")
        print(f"  Max:               {max(times):.0f} ms")
        print(f"{'='*60}")

        assert success >= CONCURRENT_USERS * 0.95
