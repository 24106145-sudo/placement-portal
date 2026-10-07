"""
SQLAlchemy database model for Users.
Defines the structure of the 'users' table in MySQL.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum as SQLEnum, DateTime, func
from app.database.session import Base


class UserRole(str, enum.Enum):
    """
    Allowed user roles in the Placement Portal system.
    """
    STUDENT = "student"
    OFFICER = "officer"
    ADMIN = "admin"


class User(Base):
    """
    User Table Model.
    Stores registered accounts for Students, Placement Officers, and Admins.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=UserRole.STUDENT
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"
