import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app

_FIXED_UUID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
_FIXED_DT = datetime(2026, 4, 18, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.execute.return_value = None
    return db


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = _FIXED_UUID
    user.email = "test@stud.hs-hannover.de"
    user.full_name = "Test User"
    user.is_active = True
    user.is_premium = False
    user.created_at = _FIXED_DT
    return user


@pytest.fixture
def client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def authed_client(mock_db, mock_user):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
