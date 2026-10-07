"""
Pydantic schemas for User data validation and serialization.
"""

from datetime import datetime
import re
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.models.user import UserRole


class UserRegisterRequest(BaseModel):
    """
    Schema for User Registration input data.
    Validates name, email, password strength, and user role.
    """
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Full name of the user",
        examples=["John Doe"]
    )
    email: EmailStr = Field(
        ...,
        description="Valid email address (must be unique)",
        examples=["john.doe@example.com"]
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (minimum 8 characters with letters and numbers)",
        examples=["SecurePass123!"]
    )
    role: UserRole = Field(
        ...,
        description="User role in the system: 'student', 'officer', or 'admin'",
        examples=["student"]
    )

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return trimmed

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserLoginRequest(BaseModel):
    """
    Schema for User Login credentials.
    """
    email: EmailStr = Field(
        ...,
        description="Registered email address",
        examples=["john.doe@example.com"]
    )
    password: str = Field(
        ...,
        description="User password",
        examples=["SecurePass123!"]
    )


class UserResponse(BaseModel):
    """
    Safe User Response schema.
    Excludes sensitive fields like password_hash!
    """
    id: int
    full_name: str
    email: str
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """
    Schema for successful Login JWT Token response.
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
