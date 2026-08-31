from app.models.message_template import MessageChannel, MessageTemplate
from app.models.user import UserRole


async def _create_template(session_factory, channel: MessageChannel) -> int:
    async with session_factory() as session:
        template = MessageTemplate(
            name=f"{channel.value.title()} follow-up",
            channel=channel,
            subject="Follow-up reminder" if channel == MessageChannel.email else None,
            body="Hello {{name}}, your follow-up is due.",
            is_active=True,
        )
        session.add(template)
        await session.commit()
        await session.refresh(template)
        assert template.id is not None
        return template.id


async def test_admin_can_manage_automation_rule(client, session_factory):
    template_id = await _create_template(session_factory, MessageChannel.email)

    create = await client.post(
        "/admin/automation-rules/",
        json={
            "name": "  Due follow-up  ",
            "trigger": "follow_up_due",
            "template_id": template_id,
            "channel": "email",
            "offset_days": -1,
            "filter": {"city": "Pune"},
            "timezone": "Asia/Kolkata",
            "send_window_start_hour": 9,
            "send_window_end_hour": 18,
        },
    )

    assert create.status_code == 201, create.text
    rule = create.json()
    assert rule["name"] == "Due follow-up"
    assert rule["offset_days"] == -1
    rule_id = rule["id"]

    get_rule = await client.get(f"/admin/automation-rules/{rule_id}")
    assert get_rule.status_code == 200

    update = await client.put(
        f"/admin/automation-rules/{rule_id}",
        json={"send_window_start_hour": 10, "send_window_end_hour": 19},
    )
    assert update.status_code == 200, update.text
    assert update.json()["send_window_start_hour"] == 10

    deactivate = await client.delete(f"/admin/automation-rules/{rule_id}")
    assert deactivate.status_code == 200

    inactive = await client.get("/admin/automation-rules/?is_active=false")
    assert inactive.status_code == 200
    assert [item["id"] for item in inactive.json()] == [rule_id]


async def test_rule_requires_matching_active_template(client, session_factory):
    template_id = await _create_template(session_factory, MessageChannel.email)

    response = await client.post(
        "/admin/automation-rules/",
        json={
            "name": "Wrong channel",
            "trigger": "follow_up_due",
            "template_id": template_id,
            "channel": "whatsapp",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Template channel does not match rule channel"


async def test_rule_validates_timezone_window_and_trigger_filter(client):
    invalid_payloads = [
        {"timezone": "Mars/Olympus"},
        {"send_window_start_hour": 20, "send_window_end_hour": 9},
        {"trigger": "no_visit_days", "filter": {"days": 0}},
        {"filter": {"unsupported": "value"}},
    ]

    for invalid in invalid_payloads:
        payload = {
            "name": "Invalid rule",
            "trigger": "follow_up_due",
            "template_id": 1,
        }
        payload.update(invalid)
        response = await client.post("/admin/automation-rules/", json=payload)
        assert response.status_code == 422, (invalid, response.text)


async def test_automation_rules_are_admin_only(client, test_user):
    test_user.role = UserRole.astrologer

    response = await client.get("/admin/automation-rules/")

    assert response.status_code == 403
