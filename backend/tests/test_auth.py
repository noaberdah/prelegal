def _signup(client, email="alice@example.com", password="hunter2hunter2"):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


def test_signup_creates_user_and_sets_cookie(client):
    response = _signup(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert isinstance(body["id"], int)
    assert "prelegal_auth" in response.cookies


def test_signup_lowercases_email(client):
    response = _signup(client, email="Alice@Example.com")
    assert response.status_code == 201
    assert response.json()["email"] == "alice@example.com"


def test_signup_rejects_duplicate(client):
    assert _signup(client).status_code == 201
    duplicate = _signup(client)
    assert duplicate.status_code == 409


def test_signup_rejects_short_password(client):
    response = client.post(
        "/api/auth/signup", json={"email": "a@b.com", "password": "short"}
    )
    assert response.status_code == 422


def test_signin_with_valid_credentials(client):
    _signup(client)
    response = client.post(
        "/api/auth/signin",
        json={"email": "alice@example.com", "password": "hunter2hunter2"},
    )
    assert response.status_code == 200
    assert "prelegal_auth" in response.cookies


def test_signin_with_wrong_password(client):
    _signup(client)
    response = client.post(
        "/api/auth/signin",
        json={"email": "alice@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_signin_unknown_email(client):
    response = client.post(
        "/api/auth/signin",
        json={"email": "nobody@example.com", "password": "hunter2hunter2"},
    )
    assert response.status_code == 401


def test_me_requires_cookie(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_user_after_signin(client):
    _signup(client)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_signout_clears_cookie(client):
    _signup(client)
    assert client.get("/api/auth/me").status_code == 200
    response = client.post("/api/auth/signout")
    assert response.status_code == 200
    # Cookie is cleared, subsequent /me should fail
    client.cookies.clear()
    assert client.get("/api/auth/me").status_code == 401


def test_me_rejects_invalid_token(client):
    client.cookies.set("prelegal_auth", "not-a-real-jwt")
    assert client.get("/api/auth/me").status_code == 401
