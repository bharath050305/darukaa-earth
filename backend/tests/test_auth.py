def test_register_and_login(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "strongpassword", "full_name": "Alice"},
    )
    assert resp.status_code == 201
    assert resp.json()["email"] == "alice@example.com"

    resp = client.post(
        "/api/auth/login",
        data={"username": "alice@example.com", "password": "strongpassword"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_register_duplicate_email_rejected(client):
    payload = {"email": "bob@example.com", "password": "strongpassword", "full_name": "Bob"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "password": "strongpassword", "full_name": "Carol"},
    )
    resp = client.post(
        "/api/auth/login",
        data={"username": "carol@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_me_requires_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "tester@example.com"
