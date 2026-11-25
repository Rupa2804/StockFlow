def register_user(client, email="alex@example.com"):
    return client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Alex Stock",
            "password": "secure-password-123",
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
