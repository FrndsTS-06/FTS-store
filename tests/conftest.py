import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

@pytest.fixture(scope="module")
def client():
    """Shared FastAPI TestClient for foundation tests."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def db():
    """Database session fixture with automatic cleanup."""
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def test_db_session(db):
    """Alias for db fixture for backward compatibility."""
    return db

