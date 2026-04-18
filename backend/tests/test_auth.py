import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from app.core.security import hash_password

_FIXED_UUID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
_FIXED_DT = datetime(2026, 4, 18, 12, 0, 0, tzinfo=timezone.utc)


def _make_user(**kwargs):
    user = MagicMock()
    user.id = _FIXED_UUID
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.preferred_language = "de"
    user.is_active = True
    user.is_premium = False
    user.created_at = _FIXED_DT
    for k, v in kwargs.items():
        setattr(user, k, v)
    return user


# ── Register ──────────────────────────────────────────────────────────────────

def test_register_success(client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    new_user = _make_user(email="new@example.com", full_name="New User")

    with patch("app.routers.auth.User", return_value=new_user):
        response = client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "Password1!",
            "full_name": "New User",
        })

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "hashed_password" not in data
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


def test_register_duplicate_email_returns_409(client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = _make_user()

    response = client.post("/api/v1/auth/register", json={
        "email": "existing@example.com",
        "password": "Password1!",
    })

    assert response.status_code == 409


def test_register_invalid_email_returns_422(client, mock_db):
    response = client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "Password1!",
    })
    assert response.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_success_returns_token(client, mock_db):
    user = _make_user(hashed_password=hash_password("Password1!"))
    mock_db.query.return_value.filter.return_value.first.return_value = user

    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Password1!",
    })

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_returns_401(client, mock_db):
    user = _make_user(hashed_password=hash_password("Password1!"))
    mock_db.query.return_value.filter.return_value.first.return_value = user

    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPass1!",
    })

    assert response.status_code == 401


def test_login_unknown_email_returns_401(client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "Password1!",
    })

    assert response.status_code == 401


def test_login_inactive_user_returns_403(client, mock_db):
    user = _make_user(hashed_password=hash_password("Password1!"), is_active=False)
    mock_db.query.return_value.filter.return_value.first.return_value = user

    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Password1!",
    })

    assert response.status_code == 403


# ── Logout ────────────────────────────────────────────────────────────────────

def test_logout_returns_204(client):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 204
