"""
Database session and connection configuration using SQLAlchemy.

Beginner Explanation:
1. 'engine': The core connector that opens the pipeline to your MySQL database.
2. 'SessionLocal': A session factory that gives each API request its own isolated workspace.
3. 'Base': The parent class that all your future database tables (models) will inherit from.
4. 'get_db': A FastAPI dependency that automatically opens a session and closes it when done.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# 1. Create the SQLAlchemy Database Engine
# pool_pre_ping=True tests the connection before using it to prevent stale connection errors
engine_kwargs = {"pool_pre_ping": True}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_recycle"] = 3600
    if "tidbcloud" in settings.DATABASE_URL.lower():
        engine_kwargs["connect_args"] = {"ssl_verify_cert": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    **engine_kwargs
)

# 2. Session Factory
# autocommit=False ensures transactions are explicitly committed
# autoflush=False prevents premature writing before commit
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 3. Base class for all future SQLAlchemy Models (e.g. Student, Company, Job)
Base = declarative_base()


# 4. Database Dependency for FastAPI Endpoints
def get_db() -> Generator[Session, None, None]:
    """
    Dependency generator for FastAPI endpoints.
    Yields a database session and guarantees it gets closed when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
