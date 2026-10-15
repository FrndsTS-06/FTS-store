import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class UserRegister(BaseModel):
    email: EmailStr = Field(..., description="Customer email address")
    password: str = Field(..., min_length=8, max_length=128, description="Strong customer password")
    full_name: str = Field(..., min_length=2, max_length=150, description="Customer full name")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Account email address")
    password: str = Field(..., description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 2:
                raise ValueError("Full name must be at least 2 characters long")
            return cleaned
        return v

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., description="Existing account password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New strong password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("New password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("New password must contain at least one digit")
        return v
