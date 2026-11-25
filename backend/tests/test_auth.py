def register_user(client, email="alex@example.com"):
    return client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Alex Stock",
            "password": "secure-password-123",
            "organization_name": "Alex's Store",
        },
    )


def test_register_login_and_read_current_user(client):
    registration = register_user(client)

    assert registration.status_code == 201
    assert registration.json()["email"] == "alex@example.com"
    assert "hashed_password" not in registration.json()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@example.com", "password": "secure-password-123"},
    )

    assert login.status_code == 200
    token = login.json()["access_token"]
    current_user = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert current_user.status_code == 200
    assert current_user.json()["email"] == "alex@example.com"


def test_registration_rejects_duplicate_email(client):
    assert register_user(client).status_code == 201
    duplicate = register_user(client)

    assert duplicate.status_code == 409


def test_current_user_requires_valid_token(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_invited_registration_joins_the_inviter_organization(client):
    registration = register_user(client)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@example.com", "password": "secure-password-123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    invitation = client.post(
        "/api/v1/organizations/invitations",
        json={"email": "teammate@example.com"},
        headers=headers,
    )
    assert invitation.status_code == 201

    invited_registration = client.post(
        "/api/v1/auth/register",
        json={
            "email": "teammate@example.com",
            "full_name": "Team Member",
            "password": "secure-password-456",
            "invitation_token": invitation.json()["invitation_token"],
        },
    )

    assert registration.status_code == 201
    assert invited_registration.status_code == 201
    assert (
        invited_registration.json()["organization_id"]
        == registration.json()["organization_id"]
    )
