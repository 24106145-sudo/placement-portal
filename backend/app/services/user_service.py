"""
User service containing business logic for user management, registration, and authentication.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegisterRequest
from app.utils.security import hash_password, verify_password


def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Finds a user in the database by their email address.
    """
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """
    Finds a user in the database by their primary key ID.
    """
    return db.query(User).filter(User.id == user_id).first()


def register_new_user(db: Session, user_data: UserRegisterRequest) -> User:
    """
    Registers a new user in the database.
    1. Checks if the email is already registered.
    2. Hashes the password with bcrypt.
    3. Creates and saves the new User record into MySQL.
    """
    clean_email = user_data.email.lower().strip()

    # 1. Check for duplicate email
    existing_user = get_user_by_email(db, clean_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with the email '{clean_email}' is already registered."
        )

    # 2. Hash the plaintext password securely
    hashed_pwd = hash_password(user_data.password)

    # 3. Create SQLAlchemy model instance
    new_user = User(
        full_name=user_data.full_name.strip(),
        email=clean_email,
        password_hash=hashed_pwd,
        role=user_data.role
    )

    # 4. Save to MySQL database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticates a user by email and password.
    1. Looks up the user in MySQL.
    2. Verifies the password using bcrypt.
    3. Returns the user object on success, or raises HTTP 401 Unauthorized.
    """
    clean_email = email.lower().strip()
    user = get_user_by_email(db, clean_email)

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
