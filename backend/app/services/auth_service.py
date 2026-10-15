import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import UserRegister, UserProfileUpdate
from app.core.security import hash_password, verify_password
from app.core.rate_limit import login_limiter

def register_customer(db: Session, data: UserRegister) -> User:
    """
    Register a new customer account.
    - Validates email uniqueness
    - Never stores plaintext passwords; hashes with bcrypt
    - Strictly forces role to UserRole.CUSTOMER
    """
    normalized_email = data.email.strip().lower()

    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    hashed = hash_password(data.password)

    new_user = User(
        id=str(uuid.uuid4()),
        email=normalized_email,
        hashed_password=hashed,
        full_name=data.full_name.strip(),
        role=UserRole.CUSTOMER,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str, client_ip: str) -> User:
    """
    Authenticate user credentials with brute-force rate-limiting protection.
    """
    rate_limit_key = f"{client_ip}:{email.strip().lower()}"
    login_limiter.check_allowed(rate_limit_key)

    normalized_email = email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not user.is_active:
        login_limiter.record_failure(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(password, user.hashed_password):
        login_limiter.record_failure(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Success: reset rate limit attempts
    login_limiter.record_success(rate_limit_key)
    return user

def update_user_profile(db: Session, user: User, data: UserProfileUpdate) -> User:
    """
    Update profile details for the authenticated user.
    """
    if data.full_name is not None:
        user.full_name = data.full_name.strip()

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def change_user_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str
) -> User:
    """
    Secure password change verifying the existing password before updating.
    """
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
