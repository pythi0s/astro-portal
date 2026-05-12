"""Regression tests for the CustomerRead / CustomerReadDetail schema split.

Before the split, `POST /customers/` declared `response_model=CustomerRead`
and `CustomerRead` carried two relationship fields (`visits`,
`customer_solutions`). Pydantic serialization triggered a sync lazy-load on
the SQLAlchemy AsyncSession-bound Customer, raising `MissingGreenlet` → 500.

These tests pin the contract: write endpoints return the slim schema (no
relationships), the GET-by-id endpoint returns the detail schema (with the
two relationship keys present, empty for a fresh row).
"""


async def test_create_customer_returns_slim_payload(client):
    """POST /customers/ must succeed and omit relationship fields."""
    resp = await client.post(
        "/customers/",
        json={"name": "Ada Lovelace", "email": "ada@example.com"},
    )
    # The original bug returned 500 here; pinning 200 catches the regression.
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert isinstance(body["id"], int)
    assert body["name"] == "Ada Lovelace"
    assert body["email"] == "ada@example.com"

    # Slim schema: relationship fields must NOT appear on POST responses,
    # otherwise Pydantic re-introduces the MissingGreenlet lazy-load.
    assert "visits" not in body
    assert "customer_solutions" not in body


async def test_create_customer_then_update_returns_slim_payload(client):
    """PUT /customers/{id} must mirror the POST contract."""
    create = await client.post("/customers/", json={"name": "Bea Test"})
    assert create.status_code == 200, create.text
    customer_id = create.json()["id"]

    update = await client.put(
        f"/customers/{customer_id}",
        json={"city": "Bengaluru"},
    )
    assert update.status_code == 200, update.text

    body = update.json()
    assert body["id"] == customer_id
    assert body["city"] == "Bengaluru"
    assert "visits" not in body
    assert "customer_solutions" not in body


async def test_get_customer_detail_returns_relationship_keys(client):
    """GET /customers/{id} uses CustomerReadDetail and always carries the keys."""
    create = await client.post("/customers/", json={"name": "Cara Detail"})
    assert create.status_code == 200, create.text
    customer_id = create.json()["id"]

    detail = await client.get(f"/customers/{customer_id}")
    assert detail.status_code == 200, detail.text

    body = detail.json()
    # CustomerReadDetail eagerly loads the two relationships; for a freshly
    # created customer they're empty lists, but the keys themselves are
    # guaranteed by the response schema.
    assert body["visits"] == []
    assert body["customer_solutions"] == []
