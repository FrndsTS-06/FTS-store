from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, revoke_token
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    PasswordChangeRequest,
)
from app.services.auth_service import (
    register_customer,
    authenticate_user,
    update_user_profile,
    change_user_password,
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Customer Account",
    description="Registers a new customer account, hashes password securely, and returns an access token."
)
def register(
    data: UserRegister,
    response: Response,
    db: Session = Depends(get_db)
):
    user = register_customer(db, data)
    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email
    )

    # Set secure HttpOnly cookie as an extra defense-in-depth layer
    response.set_cookie(
        key="fts_access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.SECURE_COOKIES or settings.is_production()
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate User",
    description="Authenticates credentials with rate-limiting protection and issues a signed JWT access token."
)
def login(
    data: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    user = authenticate_user(db, data.email, data.password, client_ip)

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email
    )

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="fts_access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.SECURE_COOKIES or settings.is_production()
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Revokes current token and clears authentication cookies."
)
def logout(
    response: Response,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    current_user: User = Depends(get_current_user)
):
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            revoke_token(parts[1])

    response.delete_cookie(
        key="fts_access_token",
        httponly=True,
        samesite="lax",
        secure=settings.SECURE_COOKIES or settings.is_production()
    )
    return {"message": "Logged out successfully."}

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns authenticated customer or administrator profile details."
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return UserResponse.model_validate(current_user)

@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Profile",
    description="Update profile details for the authenticated user."
)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = update_user_profile(db, current_user, data)
    return UserResponse.model_validate(updated)

@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change Password",
    description="Secure password update requiring current password verification."
)
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    change_user_password(db, current_user, data.current_password, data.new_password)
    return {"message": "Password changed successfully."}
