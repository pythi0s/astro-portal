"""Functional coverage for every staff API surface (happy paths + key errors)."""

from datetime import date, timedelta

import pytest

from app.models.user import UserRole

# ── Health / root ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("path", "expected"),
    [("/", "ok"), ("/health", "ok"), ("/health/live", "alive")],
)
async def test_health_endpoints(client, path, expected):
    resp = await client.get(path)
    assert resp.status_code == 200
    assert resp.json()["status"] == expected


# ── Auth (real JWT) ───────────────────────────────────────────────────────────


async def test_login_me_refresh_and_profile_update(raw_client, staff_factory):
    user, password = await staff_factory("astro@example.com", UserRole.astrologer)

    bad = await raw_client.post("/auth/login", json={"email": user.email, "password": "nope"})
    assert bad.status_code == 401

    login = await raw_client.post("/auth/login", json={"email": user.email, "password": password})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    me = await raw_client.get("/auth/me", headers=headers)
    assert me.json()["email"] == user.email
    assert me.json()["role"] == "astrologer"

    refreshed = await raw_client.post("/auth/refresh", headers=headers)
    assert refreshed.status_code == 200 and refreshed.json()["access_token"]

    upd = await raw_client.put(
        "/auth/me", json={"full_name": "New Name", "phone": "123"}, headers=headers
    )
    assert upd.json()["full_name"] == "New Name"
    assert upd.json()["phone"] == "123"


async def test_change_password(raw_client, staff_factory):
    user, password = await staff_factory("pw@example.com")
    token = (
        await raw_client.post("/auth/login", json={"email": user.email, "password": password})
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    wrong = await raw_client.post(
        "/auth/change-password",
        json={"current_password": "wrong", "new_password": "brand-new-pass"},
        headers=headers,
    )
    assert wrong.status_code == 400

    same = await raw_client.post(
        "/auth/change-password",
        json={"current_password": password, "new_password": password},
        headers=headers,
    )
    assert same.status_code == 400

    ok = await raw_client.post(
        "/auth/change-password",
        json={"current_password": password, "new_password": "brand-new-pass"},
        headers=headers,
    )
    assert ok.status_code == 204
    relogin = await raw_client.post(
        "/auth/login", json={"email": user.email, "password": "brand-new-pass"}
    )
    assert relogin.status_code == 200


async def test_inactive_user_cannot_login(raw_client, staff_factory, client):
    user, password = await staff_factory("gone@example.com", UserRole.receptionist)
    await client.delete(f"/admin/users/{user.id}")
    resp = await raw_client.post("/auth/login", json={"email": user.email, "password": password})
    assert resp.status_code == 401


async def test_bootstrap_closed_when_admin_exists(client):
    resp = await client.post(
        "/auth/bootstrap", json={"email": "boot@example.com", "password": "bootstrap-123"}
    )
    assert resp.status_code == 409


async def test_unauthenticated_requests_rejected(raw_client):
    for path in ("/auth/me", "/customers/", "/visits/", "/dashboard/summary"):
        assert (await raw_client.get(path)).status_code in (401, 403), path


# ── Customers ─────────────────────────────────────────────────────────────────


async def test_customer_crud_and_search(client):
    a = (await client.post("/customers/", json={"name": "Anita", "phone": "9000"})).json()
    await client.post("/customers/", json={"name": "Bharat", "email": "b@example.com"})

    found = await client.get("/customers/?search=anit")
    assert [c["name"] for c in found.json()] == ["Anita"]
    by_email = await client.get("/customers/?search=b@example")
    assert [c["name"] for c in by_email.json()] == ["Bharat"]

    detail = await client.get(f"/customers/{a['id']}")
    assert detail.status_code == 200

    assert (await client.delete(f"/customers/{a['id']}")).status_code == 200
    inactive = await client.get("/customers/?is_active=false")
    assert [c["id"] for c in inactive.json()] == [a["id"]]


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/customers/999"),
        ("put", "/customers/999"),
        ("delete", "/customers/999"),
        ("get", "/visits/999"),
        ("put", "/visits/999"),
        ("delete", "/visits/999"),
        ("get", "/solutions/999"),
        ("put", "/solutions/999"),
        ("delete", "/solutions/999"),
        ("put", "/templates/999"),
        ("delete", "/templates/999"),
        ("get", "/admin/users/999"),
        ("put", "/admin/users/999"),
        ("delete", "/admin/users/999"),
    ],
)
async def test_unknown_ids_return_404(client, method, path):
    kwargs = {"json": {}} if method == "put" else {}
    resp = await getattr(client, method)(path, **kwargs)
    assert resp.status_code == 404, resp.text


async def test_customer_validation(client):
    assert (await client.post("/customers/", json={})).status_code == 422


# ── Solutions ─────────────────────────────────────────────────────────────────


async def test_solution_crud(client):
    created = await client.post(
        "/solutions/", json={"name": "Ruby", "category": "gemstone", "typical_duration": "40d"}
    )
    assert created.status_code == 200, created.text
    sid = created.json()["id"]

    assert (await client.get(f"/solutions/{sid}")).json()["name"] == "Ruby"
    upd = await client.put(f"/solutions/{sid}", json={"description": "Wear on Sunday"})
    assert upd.json()["description"] == "Wear on Sunday"

    by_cat = await client.get("/solutions/?category=gemstone")
    assert [s["id"] for s in by_cat.json()] == [sid]

    assert (await client.delete(f"/solutions/{sid}")).status_code == 200
    assert (await client.get(f"/solutions/{sid}")).json()["is_active"] is False


# ── Visits ────────────────────────────────────────────────────────────────────


async def test_visit_crud_with_solutions_and_timeline(client):
    cust = (await client.post("/customers/", json={"name": "Visitor"})).json()
    sol = (await client.post("/solutions/", json={"name": "Mantra", "category": "mantra"})).json()

    visit = await client.post(
        "/visits/",
        json={
            "customer_id": cust["id"],
            "fees": "1500.00",
            "payment_status": "paid",
            "payment_method": "upi",
            "solution_ids": [sol["id"]],
        },
    )
    assert visit.status_code == 200, visit.text
    vid = visit.json()["id"]
    assert visit.json()["visit_date"] == date.today().isoformat()

    detail = (await client.get(f"/visits/{vid}")).json()
    assert [s["name"] for s in detail["solutions"]] == ["Mantra"]

    upd = await client.put(f"/visits/{vid}", json={"payment_status": "partial"})
    assert upd.json()["payment_status"] == "partial"

    assert len((await client.get(f"/visits/?customer_id={cust['id']}")).json()) == 1
    assert len((await client.get("/visits/?payment_status=paid")).json()) == 0
    assert len((await client.get(f"/customers/{cust['id']}/visits")).json()) == 1
    history = (await client.get(f"/customers/{cust['id']}/solutions")).json()
    assert history[0]["solution_name"] == "Mantra"

    timeline = (await client.get(f"/timeline/{cust['id']}")).json()
    assert {e["type"] for e in timeline} == {"visit", "solution"}

    assert (await client.delete(f"/visits/{vid}")).status_code == 200
    assert (await client.get("/visits/")).json() == []
    assert len((await client.get("/visits/?include_inactive=true")).json()) == 1


async def test_visit_date_filters(client):
    cust = (await client.post("/customers/", json={"name": "Dated"})).json()
    old = (date.today() - timedelta(days=10)).isoformat()
    await client.post("/visits/", json={"customer_id": cust["id"], "visit_date": old})
    await client.post("/visits/", json={"customer_id": cust["id"]})

    recent = await client.get(f"/visits/?date_from={date.today().isoformat()}")
    assert len(recent.json()) == 1
    older = await client.get(f"/visits/?date_to={old}")
    assert len(older.json()) == 1


# ── Templates / messages ──────────────────────────────────────────────────────


async def test_template_crud(client):
    created = await client.post(
        "/templates/",
        json={
            "name": "Welcome",
            "channel": "email",
            "subject": "Hi",
            "body": "Hi {{customer_name}}",
        },
    )
    assert created.status_code == 200, created.text
    tid = created.json()["id"]

    upd = await client.put(f"/templates/{tid}", json={"subject": "Hello"})
    assert upd.json()["subject"] == "Hello"
    assert any(t["id"] == tid for t in (await client.get("/templates/")).json())

    assert (await client.delete(f"/templates/{tid}")).status_code == 200


async def test_message_log_lists(client):
    resp = await client.get("/messages/log")
    assert resp.status_code == 200
    assert resp.json() == []


# ── Dashboard ─────────────────────────────────────────────────────────────────


async def test_dashboard_endpoints(client):
    cust = (await client.post("/customers/", json={"name": "Payer"})).json()
    await client.post(
        "/visits/", json={"customer_id": cust["id"], "fees": "1000", "payment_status": "paid"}
    )
    await client.post(
        "/visits/", json={"customer_id": cust["id"], "fees": "500", "payment_status": "pending"}
    )

    summary = await client.get("/dashboard/summary")
    assert summary.status_code == 200, summary.text

    earnings = await client.get("/dashboard/earnings?period=daily&days=7")
    assert earnings.status_code == 200, earnings.text

    revenue = (await client.get("/dashboard/revenue")).json()
    assert float(revenue["collected"]) == 1000
    assert float(revenue["outstanding"]) == 500
    assert revenue["visit_count"] == 2

    by_cat = await client.get("/dashboard/revenue-by-category")
    assert by_cat.status_code == 200, by_cat.text


async def test_dashboard_rejects_inverted_range(client):
    resp = await client.get("/dashboard/revenue?from=2030-01-10&to=2030-01-01")
    assert resp.status_code == 400


async def test_dashboard_rejects_bad_period(client):
    assert (await client.get("/dashboard/earnings?period=hourly")).status_code == 422


# ── Admin ─────────────────────────────────────────────────────────────────────


async def test_admin_user_lifecycle(client, test_user):
    created = await client.post(
        "/admin/users",
        json={"email": "rec@example.com", "password": "secret-123", "role": "receptionist"},
    )
    assert created.status_code == 201, created.text
    uid = created.json()["id"]

    dup = await client.post(
        "/admin/users", json={"email": "rec@example.com", "password": "secret-123"}
    )
    assert dup.status_code == 400

    by_role = await client.get("/admin/users?role=receptionist")
    assert [u["id"] for u in by_role.json()] == [uid]

    upd = await client.put(f"/admin/users/{uid}", json={"role": "astrologer", "full_name": "R"})
    assert upd.json()["role"] == "astrologer"

    clash = await client.put(f"/admin/users/{uid}", json={"email": test_user.email})
    assert clash.status_code == 400

    assert (await client.delete(f"/admin/users/{test_user.id}")).status_code == 400
    assert (await client.delete(f"/admin/users/{uid}")).status_code == 200

    stats = (await client.get("/admin/stats")).json()
    assert stats == {"total_users": 2, "active_users": 1, "admin_count": 1}


@pytest.mark.parametrize("role", [UserRole.astrologer, UserRole.receptionist])
async def test_admin_surfaces_forbidden_for_non_admin(client, test_user, role):
    test_user.role = role
    for path in ("/admin/users", "/admin/stats", "/admin/automation-rules/"):
        assert (await client.get(path)).status_code == 403, path
