from app.models.user import UserRole


async def test_receptionist_can_manage_intake_but_cannot_delete(client, test_user):
    test_user.role = UserRole.receptionist

    create_customer = await client.post(
        "/customers/",
        json={"name": "Reception Intake", "phone": "+919999999999"},
    )
    assert create_customer.status_code == 200, create_customer.text
    customer_id = create_customer.json()["id"]

    update_customer = await client.put(
        f"/customers/{customer_id}",
        json={"city": "Pune"},
    )
    assert update_customer.status_code == 200, update_customer.text

    create_visit = await client.post(
        "/visits/",
        json={"customer_id": customer_id, "solution_ids": []},
    )
    assert create_visit.status_code == 200, create_visit.text
    visit_id = create_visit.json()["id"]

    assert (await client.get("/customers/")).status_code == 200
    assert (await client.get("/visits/")).status_code == 200
    assert (await client.delete(f"/visits/{visit_id}")).status_code == 403
    assert (await client.delete(f"/customers/{customer_id}")).status_code == 403


async def test_receptionist_cannot_access_practitioner_surfaces(client, test_user):
    test_user.role = UserRole.receptionist

    for path in ("/solutions/", "/templates/", "/messages/log"):
        response = await client.get(path)
        assert response.status_code == 403, (path, response.text)


async def test_astrologer_can_access_practitioner_surfaces(client, test_user):
    test_user.role = UserRole.astrologer

    for path in ("/solutions/", "/templates/", "/messages/log"):
        response = await client.get(path)
        assert response.status_code == 200, (path, response.text)
