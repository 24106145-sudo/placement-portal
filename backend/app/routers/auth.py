"""
Authentication, Registration, and Login router.
Provides endpoints for user registration, JWT login, and profile access.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse
)
from app.services.user_service import (
    register_new_user,
    authenticate_user,
    get_user_by_id
)
from app.utils.security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication & Registration"])
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI Dependency to get the currently authenticated user from a JWT Bearer token.
    Validates token signature and expiration.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload["sub"])
    user = get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user (Student, Placement Officer, or Admin)"
)
def register_user(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account:
    - **full_name**: Name of the user (min 2 characters)
    - **email**: Unique email address
    - **password**: Secure password (min 8 characters with letters & numbers)
    - **role**: One of `student`, `officer`, or `admin`
    """
    created_user = register_new_user(db=db, user_data=user_data)
    return created_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with email and password to receive a JWT access token"
)
def login_user(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and issue a secure JWT access token.
    - **email**: Registered email
    - **password**: User password
    """
    user = authenticate_user(db=db, email=login_data.email, password=login_data.password)

    # Create JWT Token with user identity and role in payload
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "name": user.full_name
    }
    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current logged-in user profile (Protected Route)"
)
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Protected endpoint to fetch current authenticated user profile.
    Requires header: `Authorization: Bearer <token>`
    """
    return current_user
