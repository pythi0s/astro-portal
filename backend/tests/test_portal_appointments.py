"""Customer portal: sign-up/login, booking rules, isolation and staff visibility."""

import zlib
from datetime import datetime, timedelta

import pytest

from app.models.user import UserRole
from app.services.appointments import clinic_now

PASSWORD = "portal-pass-123"


def _slot(hour: int, minute: int = 0, days_ahead: int = 1) -> str:
    day = clinic_now().date() + timedelta(days=days_ahead)
    return datetime(day.year, day.month, day.day, hour, minute).isoformat()


def _mobile_for(email: str) -> str:
    return f"98{zlib.crc32(email.lower().encode()) % 10**8:08d}"


async def _register(client, email="asha@example.com", name="Asha", phone=None, **extra):
    resp = await client.post(
        "/portal/auth/register",
        json={
            "name": name,
            "email": email,
            "phone": phone or _mobile_for(email),
            "password": PASSWORD,
            **extra,
        },
    )
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


async def _staff_headers(client, staff_factory, role=UserRole.admin, email="admin@example.com"):
    user, password = await staff_factory(email, role)
    resp = await client.post("/auth/login", json={"email": user.email, "password": password})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


async def _book(client, headers, start, duration=30, notes=None):
    return await client.post(
        "/portal/appointments",
        json={"start_at": start, "duration_minutes": duration, "notes": notes},
        headers=headers,
    )


# ── Accounts ──────────────────────────────────────────────────────────────────


async def test_register_with_mobile_only_then_login_by_mobile_or_email(raw_client):
    resp = await raw_client.post(
        "/portal/auth/register",
        json={"name": "  Asha  ", "phone": "98765 43210", "password": PASSWORD},
    )
    assert resp.status_code == 201, resp.text
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    me = (await raw_client.get("/portal/auth/me", headers=headers)).json()
    assert me["phone"] == "+919876543210"
    assert me["email"] is None
    assert me["name"] == "Asha"

    for identifier in ("9876543210", "+91 98765-43210", "09876543210"):
        login = await raw_client.post(
            "/portal/auth/login", json={"identifier": identifier, "password": PASSWORD}
        )
        assert login.status_code == 200, (identifier, login.text)

    await raw_client.put("/portal/profile", json={"email": "Asha@Example.com"}, headers=headers)
    by_email = await raw_client.post(
        "/portal/auth/login", json={"identifier": "ASHA@example.com", "password": PASSWORD}
    )
    assert by_email.status_code == 200


async def test_register_stores_optional_details_on_customer(raw_client, staff_factory):
    headers = await _register(
        raw_client,
        name="Meera Joshi",
        gender="female",
        date_of_birth="1992-04-18",
        birth_time="06:45",
        birth_place="Nashik",
        occupation="Teacher",
        city="Pune",
        pincode="411001",
        rashi="",
    )
    profile = (await raw_client.get("/portal/profile", headers=headers)).json()
    assert profile["gender"] == "female"
    assert profile["date_of_birth"] == "1992-04-18"
    assert profile["birth_place"] == "Nashik"
    assert profile["rashi"] is None

    staff = await _staff_headers(raw_client, staff_factory)
    customers = (await raw_client.get("/customers/", headers=staff)).json()
    meera = next(c for c in customers if c["name"] == "Meera Joshi")
    detail = (await raw_client.get(f"/customers/{meera['id']}", headers=staff)).json()
    assert detail["phone"] == profile["phone"]
    assert detail["occupation"] == "Teacher"
    assert detail["city"] == "Pune"


async def test_register_creates_customer_visible_to_staff(raw_client, staff_factory):
    await _register(raw_client, name="Visible Customer")
    staff = await _staff_headers(raw_client, staff_factory)
    customers = await raw_client.get("/customers/", headers=staff)
    assert customers.status_code == 200
    assert any(c["name"] == "Visible Customer" for c in customers.json())


async def test_register_links_existing_staff_record_by_mobile(raw_client, staff_factory):
    staff = await _staff_headers(raw_client, staff_factory)
    created = await raw_client.post(
        "/customers/",
        json={"name": "Ravi (walk-in)", "phone": "+91-99887 76655", "city": "Nagpur"},
        headers=staff,
    )
    assert created.status_code == 200
    existing_id = created.json()["id"]

    headers = await _register(
        raw_client, name="Ravi Kumar", phone="9988776655", city="Mumbai", occupation="Engineer"
    )
    me = (await raw_client.get("/portal/auth/me", headers=headers)).json()
    assert me["customer_id"] == existing_id

    detail = (await raw_client.get(f"/customers/{existing_id}", headers=staff)).json()
    assert detail["name"] == "Ravi (walk-in)"  # staff data is not overwritten
    assert detail["city"] == "Nagpur"
    assert detail["occupation"] == "Engineer"  # blanks are filled in
    names = [c["name"] for c in (await raw_client.get("/customers/", headers=staff)).json()]
    assert names.count("Ravi (walk-in)") == 1 and "Ravi Kumar" not in names


async def test_duplicate_mobile_rejected_in_any_format(raw_client):
    await _register(raw_client, phone="9876543210")
    resp = await raw_client.post(
        "/portal/auth/register",
        json={"name": "Again", "phone": "+91 98765 43210", "password": PASSWORD},
    )
    assert resp.status_code == 409
    assert "mobile" in resp.json()["detail"].lower()


async def test_duplicate_email_rejected(raw_client):
    await _register(raw_client, phone="9876543210")
    resp = await raw_client.post(
        "/portal/auth/register",
        json={
            "name": "Again",
            "phone": "9123456780",
            "email": "ASHA@example.com",
            "password": PASSWORD,
        },
    )
    assert resp.status_code == 409


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "", "phone": "9876543210", "password": PASSWORD},
        {"name": "   ", "phone": "9876543210", "password": PASSWORD},
        {"name": "X", "password": PASSWORD},
        {"name": "X", "phone": "12345", "password": PASSWORD},
        {"name": "X", "phone": "98765abc10", "password": PASSWORD},
        {"name": "X", "phone": "9876543210", "email": "not-an-email", "password": PASSWORD},
        {"name": "X", "phone": "9876543210", "password": "short"},
        {"name": "X", "phone": "9876543210", "password": PASSWORD, "gender": "robot"},
        {"name": "X", "phone": "9876543210", "password": PASSWORD, "date_of_birth": "31-12-1990"},
    ],
)
async def test_register_validation(raw_client, payload):
    resp = await raw_client.post("/portal/auth/register", json=payload)
    assert resp.status_code == 422


async def test_login_wrong_password_and_unknown_identifier(raw_client):
    await _register(raw_client, phone="9876543210")
    for identifier in ("9876543210", "0000", "nobody@example.com"):
        resp = await raw_client.post(
            "/portal/auth/login", json={"identifier": identifier, "password": "wrong-password"}
        )
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid credentials"


async def test_login_rate_limited(raw_client):
    for _ in range(5):
        resp = await raw_client.post(
            "/portal/auth/login", json={"identifier": "9000000000", "password": "nope-nope"}
        )
        assert resp.status_code == 401
    resp = await raw_client.post(
        "/portal/auth/login", json={"identifier": "9000000000", "password": "nope-nope"}
    )
    assert resp.status_code == 429


async def test_profile_update(raw_client):
    headers = await _register(raw_client, phone="9876543210")
    resp = await raw_client.put(
        "/portal/profile",
        json={"name": "Asha Patil", "marital_status": "married", "nakshatra": "Rohini"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "Asha Patil"
    assert body["nakshatra"] == "Rohini"
    assert body["phone"] == "+919876543210"
    me = (await raw_client.get("/portal/auth/me", headers=headers)).json()
    assert me["name"] == "Asha Patil"


async def test_profile_email_must_be_unique(raw_client):
    await _register(raw_client, email="taken@example.com")
    other = await _register(raw_client, email="other@example.com")
    resp = await raw_client.put(
        "/portal/profile", json={"email": "taken@example.com"}, headers=other
    )
    assert resp.status_code == 409


async def test_profile_ignores_phone_changes(raw_client):
    headers = await _register(raw_client, phone="9876543210")
    resp = await raw_client.put("/portal/profile", json={"phone": "9111111111"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["phone"] == "+919876543210"


async def test_portal_requires_auth(raw_client):
    for method, path in (
        ("get", "/portal/auth/me"),
        ("get", "/portal/appointments"),
        ("get", "/portal/availability?date=2030-01-01"),
        ("get", "/portal/profile"),
    ):
        resp = await getattr(raw_client, method)(path)
        assert resp.status_code in (401, 403), (path, resp.status_code)

    bad = {"Authorization": "Bearer not-a-jwt"}
    assert (await raw_client.get("/portal/auth/me", headers=bad)).status_code == 401


async def test_tokens_are_not_interchangeable(raw_client, staff_factory):
    customer = await _register(raw_client)
    staff = await _staff_headers(raw_client, staff_factory)

    # Customer token must never reach staff surfaces.
    for path in ("/auth/me", "/customers/", "/appointments/", "/admin/users"):
        assert (await raw_client.get(path, headers=customer)).status_code == 401, path
    assert (await raw_client.post("/auth/refresh", headers=customer)).status_code == 401

    # Staff token must not act as a customer.
    assert (await raw_client.get("/portal/auth/me", headers=staff)).status_code == 401
    assert (await _book(raw_client, staff, _slot(10))).status_code == 401


# ── Booking rules ─────────────────────────────────────────────────────────────


async def test_book_and_list_own_appointment(raw_client):
    headers = await _register(raw_client)
    resp = await _book(raw_client, headers, _slot(10), 45, notes="Career question")
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "booked"
    assert body["duration_minutes"] == 45
    assert body["end_at"].endswith("10:45:00")
    assert body["notes"] == "Career question"

    mine = await raw_client.get("/portal/appointments", headers=headers)
    assert [a["id"] for a in mine.json()] == [body["id"]]


@pytest.mark.parametrize("duration", [15, 30, 45, 60])
async def test_allowed_durations(raw_client, duration):
    headers = await _register(raw_client)
    assert (await _book(raw_client, headers, _slot(11), duration)).status_code == 201


@pytest.mark.parametrize("duration", [0, 10, 14, 61, 90, 120])
async def test_rejected_durations(raw_client, duration):
    headers = await _register(raw_client)
    assert (await _book(raw_client, headers, _slot(11), duration)).status_code == 422


async def test_past_slot_rejected(raw_client):
    headers = await _register(raw_client)
    resp = await _book(raw_client, headers, _slot(10, days_ahead=-1))
    assert resp.status_code == 422
    assert "future" in resp.json()["detail"]


@pytest.mark.parametrize(
    ("hour", "minute", "duration"),
    [(8, 45, 30), (18, 45, 30), (19, 0, 15), (23, 30, 60)],
)
async def test_outside_opening_hours_rejected(raw_client, hour, minute, duration):
    headers = await _register(raw_client)
    resp = await _book(raw_client, headers, _slot(hour, minute), duration)
    assert resp.status_code == 422


async def test_last_slot_of_day_allowed(raw_client):
    headers = await _register(raw_client)
    assert (await _book(raw_client, headers, _slot(18, 0), 60)).status_code == 201


@pytest.mark.parametrize(
    ("start_h", "start_m", "duration"),
    [
        (10, 0, 30),  # identical
        (10, 15, 15),  # inside
        (9, 45, 30),  # overlaps start
        (10, 15, 60),  # overlaps end
        (9, 30, 60),  # fully covers
    ],
)
async def test_overlapping_booking_rejected_for_other_customer(
    raw_client, start_h, start_m, duration
):
    first = await _register(raw_client, email="first@example.com")
    second = await _register(raw_client, email="second@example.com")
    assert (await _book(raw_client, first, _slot(10, 0), 30)).status_code == 201

    resp = await _book(raw_client, second, _slot(start_h, start_m), duration)
    assert resp.status_code == 409
    assert "already booked" in resp.json()["detail"]


async def test_same_customer_cannot_double_book(raw_client):
    headers = await _register(raw_client)
    assert (await _book(raw_client, headers, _slot(12), 60)).status_code == 201
    assert (await _book(raw_client, headers, _slot(12, 30), 15)).status_code == 409


async def test_adjacent_slots_are_allowed(raw_client):
    first = await _register(raw_client, email="first@example.com")
    second = await _register(raw_client, email="second@example.com")
    assert (await _book(raw_client, first, _slot(10, 0), 30)).status_code == 201
    assert (await _book(raw_client, second, _slot(10, 30), 30)).status_code == 201
    assert (await _book(raw_client, second, _slot(9, 30), 30)).status_code == 201


async def test_timezone_aware_start_is_converted(raw_client):
    headers = await _register(raw_client)
    day = clinic_now().date() + timedelta(days=1)
    # 05:00 UTC == 10:30 Asia/Kolkata
    resp = await _book(raw_client, headers, f"{day.isoformat()}T05:00:00+00:00", 30)
    assert resp.status_code == 201, resp.text
    assert resp.json()["start_at"] == f"{day.isoformat()}T10:30:00"


# ── Availability ──────────────────────────────────────────────────────────────


async def test_availability_lists_busy_ranges_without_pii(raw_client):
    first = await _register(raw_client, email="first@example.com", name="Secret Name")
    second = await _register(raw_client, email="second@example.com")
    await _book(raw_client, first, _slot(10), 30)
    await _book(raw_client, first, _slot(14), 60)

    day = (clinic_now().date() + timedelta(days=1)).isoformat()
    resp = await raw_client.get(f"/portal/availability?date={day}", headers=second)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["open_time"] == "09:00"
    assert body["close_time"] == "19:00"
    assert body["min_duration"] == 15
    assert body["max_duration"] == 60
    assert [b["start_at"][11:16] for b in body["busy"]] == ["10:00", "14:00"]
    assert "Secret Name" not in resp.text
    assert set(body["busy"][0]) == {"start_at", "end_at"}


async def test_availability_requires_valid_date(raw_client):
    headers = await _register(raw_client)
    assert (
        await raw_client.get("/portal/availability?date=nope", headers=headers)
    ).status_code == 422


# ── Cancellation ──────────────────────────────────────────────────────────────


async def test_cancel_frees_the_slot(raw_client):
    first = await _register(raw_client, email="first@example.com")
    second = await _register(raw_client, email="second@example.com")
    appt = (await _book(raw_client, first, _slot(10))).json()

    cancel = await raw_client.post(f"/portal/appointments/{appt['id']}/cancel", headers=first)
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"

    again = await raw_client.post(f"/portal/appointments/{appt['id']}/cancel", headers=first)
    assert again.status_code == 400

    assert (await _book(raw_client, second, _slot(10))).status_code == 201


async def test_cannot_see_or_cancel_other_customers_appointment(raw_client):
    first = await _register(raw_client, email="first@example.com")
    second = await _register(raw_client, email="second@example.com")
    appt = (await _book(raw_client, first, _slot(10))).json()

    assert (await raw_client.get("/portal/appointments", headers=second)).json() == []
    resp = await raw_client.post(f"/portal/appointments/{appt['id']}/cancel", headers=second)
    assert resp.status_code == 404


# ── Staff visibility ──────────────────────────────────────────────────────────


@pytest.mark.parametrize("role", list(UserRole))
async def test_staff_sees_portal_bookings(raw_client, staff_factory, role):
    customer = await _register(raw_client, name="Ravi Kumar", phone="9988776655")
    await _book(raw_client, customer, _slot(15), 45, notes="Marriage match")
    staff = await _staff_headers(raw_client, staff_factory, role=role, email=f"{role}@example.com")

    resp = await raw_client.get("/appointments/", headers=staff)
    assert resp.status_code == 200, resp.text
    [row] = resp.json()
    assert row["customer_name"] == "Ravi Kumar"
    assert row["customer_phone"] == "+919988776655"
    assert row["duration_minutes"] == 45
    assert row["notes"] == "Marriage match"


async def test_staff_list_filters(raw_client, staff_factory):
    customer = await _register(raw_client)
    await _book(raw_client, customer, _slot(10, days_ahead=1))
    later = (await _book(raw_client, customer, _slot(10, days_ahead=3))).json()
    await raw_client.post(f"/portal/appointments/{later['id']}/cancel", headers=customer)
    staff = await _staff_headers(raw_client, staff_factory)

    day1 = (clinic_now().date() + timedelta(days=1)).isoformat()
    day3 = (clinic_now().date() + timedelta(days=3)).isoformat()

    only_day1 = await raw_client.get(
        f"/appointments/?date_from={day1}&date_to={day1}", headers=staff
    )
    assert len(only_day1.json()) == 1

    cancelled = await raw_client.get("/appointments/?status=cancelled", headers=staff)
    assert [a["id"] for a in cancelled.json()] == [later["id"]]

    from_day3 = await raw_client.get(f"/appointments/?date_from={day3}", headers=staff)
    assert [a["id"] for a in from_day3.json()] == [later["id"]]


async def test_staff_can_complete_and_cancel(raw_client, staff_factory):
    customer = await _register(raw_client)
    appt = (await _book(raw_client, customer, _slot(10))).json()
    staff = await _staff_headers(raw_client, staff_factory, role=UserRole.receptionist)

    done = await raw_client.patch(
        f"/appointments/{appt['id']}", json={"status": "completed", "notes": "Seen"}, headers=staff
    )
    assert done.status_code == 200, done.text
    assert done.json()["status"] == "completed"
    assert done.json()["notes"] == "Seen"

    # Completed appointments still occupy their slot.
    other = await _register(raw_client, email="other@example.com")
    assert (await _book(raw_client, other, _slot(10))).status_code == 409

    cancelled = await raw_client.patch(
        f"/appointments/{appt['id']}", json={"status": "cancelled"}, headers=staff
    )
    assert cancelled.json()["status"] == "cancelled"
    assert (await _book(raw_client, other, _slot(10))).status_code == 201


async def test_staff_cannot_revive_into_taken_slot(raw_client, staff_factory):
    first = await _register(raw_client, email="first@example.com")
    second = await _register(raw_client, email="second@example.com")
    appt = (await _book(raw_client, first, _slot(10))).json()
    await raw_client.post(f"/portal/appointments/{appt['id']}/cancel", headers=first)
    assert (await _book(raw_client, second, _slot(10))).status_code == 201

    staff = await _staff_headers(raw_client, staff_factory)
    resp = await raw_client.patch(
        f"/appointments/{appt['id']}", json={"status": "booked"}, headers=staff
    )
    assert resp.status_code == 409


async def test_staff_update_unknown_appointment(raw_client, staff_factory):
    staff = await _staff_headers(raw_client, staff_factory)
    resp = await raw_client.patch("/appointments/999", json={"status": "completed"}, headers=staff)
    assert resp.status_code == 404


async def test_staff_endpoints_require_auth(raw_client):
    assert (await raw_client.get("/appointments/")).status_code in (401, 403)
