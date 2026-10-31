"""GET /dashboard/overview: home-dashboard KPIs."""

from datetime import date, datetime, timedelta

from app.models.user import UserRole
from app.services.appointments import clinic_now

PASSWORD = "portal-pass-123"


async def _staff(client, staff_factory, role=UserRole.admin):
    user, password = await staff_factory(f"{role}@example.com", role)
    resp = await client.post("/auth/login", json={"email": user.email, "password": password})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


async def _customer(client, name, phone):
    resp = await client.post(
        "/portal/auth/register", json={"name": name, "phone": phone, "password": PASSWORD}
    )
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _slot(day: date, hour: int) -> str:
    return datetime(day.year, day.month, day.day, hour).isoformat()


async def test_overview_empty_state(raw_client, staff_factory):
    staff = await _staff(raw_client, staff_factory)
    resp = await raw_client.get("/dashboard/overview", headers=staff)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["appointments_today"] == 0
    assert body["next_appointment"] is None
    assert body["collected_change_pct"] is None
    assert body["recent_customers"] == []
    assert body["follow_ups_due"] == []
    today = clinic_now().date()
    assert len(body["collected_daily"]) == today.day


async def test_overview_aggregates(raw_client, staff_factory):
    staff = await _staff(raw_client, staff_factory)
    today = clinic_now().date()
    tomorrow = today + timedelta(days=1)
    month_start = today.replace(day=1)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    asha = await _customer(raw_client, "Asha", "9800000001")
    ravi = await _customer(raw_client, "Ravi", "9800000002")
    for headers, hour in ((asha, 10), (ravi, 11)):
        booked = await raw_client.post(
            "/portal/appointments",
            json={"start_at": _slot(tomorrow, hour), "duration_minutes": 30},
            headers=headers,
        )
        assert booked.status_code == 201, booked.text
    walk_in = await raw_client.post("/customers/", json={"name": "Walk-in"}, headers=staff)
    walk_in_id = walk_in.json()["id"]

    for visit_date, fees, status, follow_up in (
        (month_start, "1500.00", "paid", today + timedelta(days=2)),
        (month_start, "500.00", "pending", None),
        (prev_month_start, "1000.00", "paid", None),
    ):
        resp = await raw_client.post(
            "/visits/",
            json={
                "customer_id": walk_in_id,
                "visit_date": visit_date.isoformat(),
                "fees": fees,
                "payment_status": status,
                "follow_up_date": follow_up.isoformat() if follow_up else None,
            },
            headers=staff,
        )
        assert resp.status_code == 200, resp.text

    body = (await raw_client.get("/dashboard/overview", headers=staff)).json()
    assert body["upcoming_7_days"] == 2
    assert body["appointments_total"] == 2
    assert body["next_appointment"]["customer_name"] == "Asha"
    assert body["next_appointment"]["start_at"].startswith(tomorrow.isoformat())
    assert float(body["collected_this_month"]) == 1500
    assert float(body["collected_last_month"]) == 1000
    assert body["collected_change_pct"] == 50.0
    assert float(body["outstanding_total"]) == 500
    assert sum(float(d["amount"]) for d in body["collected_daily"]) == 1500
    assert body["new_customers_this_month"] == 3

    recent = {c["name"]: c for c in body["recent_customers"]}
    assert recent["Asha"]["self_registered"] is True
    assert recent["Walk-in"]["self_registered"] is False
    [follow_up] = body["follow_ups_due"]
    assert follow_up["customer_name"] == "Walk-in"


async def test_overview_ignores_cancelled_and_counts_today(raw_client, staff_factory):
    staff = await _staff(raw_client, staff_factory)
    customer = await _customer(raw_client, "Meera", "9800000003")
    tomorrow = clinic_now().date() + timedelta(days=1)
    booked = await raw_client.post(
        "/portal/appointments",
        json={"start_at": _slot(tomorrow, 12), "duration_minutes": 15},
        headers=customer,
    )
    await raw_client.post(f"/portal/appointments/{booked.json()['id']}/cancel", headers=customer)

    body = (await raw_client.get("/dashboard/overview", headers=staff)).json()
    assert body["appointments_total"] == 0
    assert body["upcoming_7_days"] == 0
    assert body["next_appointment"] is None


async def test_overview_requires_staff(raw_client):
    assert (await raw_client.get("/dashboard/overview")).status_code in (401, 403)
    customer = await _customer(raw_client, "Not Staff", "9800000004")
    assert (await raw_client.get("/dashboard/overview", headers=customer)).status_code == 401
