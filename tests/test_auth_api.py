import uuid
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.core.rate_limit import login_limiter
from app.models.user import User
from app.models.enums import UserRole

@pytest.fixture(autouse=True)
def reset_rate_limits():
    login_limiter.reset()
    yield
    login_limiter.reset()

@pytest.fixture
def db_session():
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_register_customer_success(client: TestClient, db_session: Session):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Jane Developer"
    }

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_email.lower()
    assert data["user"]["full_name"] == "Jane Developer"
    assert data["user"]["role"] == "customer"
    assert "password" not in data["user"]

    # Verify password was hashed in database
    db_user = db_session.query(User).filter(User.email == unique_email.lower()).first()
    assert db_user is not None
    assert db_user.hashed_password != "SecurePassword123!"
    assert verify_password("SecurePassword123!", db_user.hashed_password) is True

def test_register_duplicate_email_rejected(client: TestClient):
    unique_email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "First User"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt to register with uppercase variant
    payload_dup = {
        "email": unique_email.upper(),
        "password": "AnotherPassword456!",
        "full_name": "Second User"
    }
    res2 = client.post("/api/v1/auth/register", json=payload_dup)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()

def test_register_weak_password_rejected(client: TestClient):
    # Too short (< 8 chars)
    res = client.post("/api/v1/auth/register", json={
        "email": f"short_{uuid.uuid4().hex[:6]}@example.com",
        "password": "Pass1",
        "full_name": "Short Password"
    })
    assert res.status_code == 422

    # No digits
    res2 = client.post("/api/v1/auth/register", json={
        "email": f"nodigit_{uuid.uuid4().hex[:6]}@example.com",
        "password": "PasswordOnlyLetters",
        "full_name": "No Digits"
    })
    assert res2.status_code == 422

    # No letters
    res3 = client.post("/api/v1/auth/register", json={
        "email": f"noletters_{uuid.uuid4().hex[:6]}@example.com",
        "password": "1234567890123",
        "full_name": "No Letters"
    })
    assert res3.status_code == 422

def test_login_success(client: TestClient):
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "ValidPassword789!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Login Tester"
    })

    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": pwd
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

def test_login_wrong_password_rejected(client: TestClient):
    email = f"wrong_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "CorrectPassword123!",
        "full_name": "User One"
    })

    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    assert "invalid email" in res.json()["detail"].lower()

def test_login_rate_limiting_abuse_mitigation(client: TestClient):
    email = f"brute_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "MyGoodPassword123!",
        "full_name": "Brute Target"
    })

    # Fail 4 times (under threshold)
    for _ in range(4):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "BadPassword1!"})
        assert res.status_code == 401

    # 5th failure trips rate limit
    res_trip = client.post("/api/v1/auth/login", json={"email": email, "password": "BadPassword1!"})
    assert res_trip.status_code == 401

    # 6th attempt is blocked with 429
    res_blocked = client.post("/api/v1/auth/login", json={"email": email, "password": "MyGoodPassword123!"})
    assert res_blocked.status_code == 429
    assert "too many failed" in res_blocked.json()["detail"].lower()

def test_get_current_user_profile(client: TestClient):
    email = f"me_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "GoodPassword123!",
        "full_name": "Me Tester"
    })
    token = reg_res.json()["access_token"]

    # Valid token header
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Unauthenticated (clear cookie)
    client.cookies.clear()
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

def test_expired_token_rejected(client: TestClient, db_session: Session):
    email = f"expired_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "GoodPassword123!",
        "full_name": "Expired Tester"
    })
    user_id = reg_res.json()["user"]["id"]

    # Create expired token (-10 minutes)
    expired_token = create_access_token(
        subject=user_id,
        role="customer",
        email=email,
        expires_delta=timedelta(minutes=-10)
    )

    client.cookies.clear()
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()

def test_logout_revokes_token(client: TestClient):
    email = f"logout_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "GoodPassword123!",
        "full_name": "Logout Tester"
    })
    token = reg_res.json()["access_token"]

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200

    # Attempt to access with revoked token
    after_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert after_res.status_code == 401

def test_customer_cannot_access_admin_endpoints(client: TestClient):
    """Verify role-based authorization prevents customer from executing admin operations."""
    email = f"cust_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "GoodPassword123!",
        "full_name": "Regular Customer"
    })
    customer_token = reg_res.json()["access_token"]

    # Customer attempts to create a category
    admin_action_res = client.post(
        "/api/v1/categories",
        json={"name": "Hacked Category", "slug": "hacked-cat", "description": "Should fail"},
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert admin_action_res.status_code == 403
    assert "administrative" in admin_action_res.json()["detail"].lower()

def test_update_profile_and_change_password(client: TestClient):
    email = f"update_{uuid.uuid4().hex[:8]}@example.com"
    old_pwd = "InitialPassword123!"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": old_pwd,
        "full_name": "Original Name"
    })
    token = reg_res.json()["access_token"]

    # 1. Update Profile
    put_res = client.put(
        "/api/v1/auth/me",
        json={"full_name": "Updated New Name"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert put_res.status_code == 200
    assert put_res.json()["full_name"] == "Updated New Name"

    # 2. Change Password
    new_pwd = "NewSecurePassword456!"
    pwd_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": old_pwd, "new_password": new_pwd},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pwd_res.status_code == 200

    # 3. Old password should fail
    fail_login = client.post("/api/v1/auth/login", json={"email": email, "password": old_pwd})
    assert fail_login.status_code == 401

    # 4. New password should succeed
    succ_login = client.post("/api/v1/auth/login", json={"email": email, "password": new_pwd})
    assert succ_login.status_code == 200
