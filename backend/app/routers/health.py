"""
Health check and Database connection test router.
Provides endpoints to monitor API and MySQL database connectivity.
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db

router = APIRouter(prefix="/health", tags=["Health & Database Status"])


@router.get("", summary="General Health & Database Status Check")
def check_health(db: Session = Depends(get_db)):
    """
    Checks general API status and attempts a test query against MySQL.
    """
    db_status = "disconnected"
    db_message = ""
    is_connected = False

    try:
        # Execute a minimal, lightweight test query
        db.execute(text("SELECT 1"))
        db_status = "connected"
        db_message = f"Successfully connected to MySQL database '{settings.DB_NAME}'!"
        is_connected = True
    except Exception as e:
        # Catch connection errors gracefully (e.g., MySQL server offline or invalid password)
        # Note: We do NOT print raw exceptions that might contain credentials
        db_status = "disconnected"
        db_message = (
            f"Could not connect to MySQL at {settings.DB_HOST}:{settings.DB_PORT}. "
            f"Ensure your local MySQL server is running and credentials in backend/.env are correct."
        )

    response_payload = {
        "api_status": "healthy",
        "service": "placement-portal-backend",
        "database": {
            "status": db_status,
            "connected": is_connected,
            "database_name": settings.DB_NAME,
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "user": settings.DB_USER,
            "connection_uri": settings.SAFE_DATABASE_URI_DISPLAY,
            "message": db_message,
        }
    }

    return response_payload


@router.get("/db", summary="Direct MySQL Connection Test")
def test_database_connection(db: Session = Depends(get_db)):
    """
    Direct endpoint specifically for testing the MySQL database connection.
    """
    try:
        result = db.execute(text("SELECT VERSION()")).scalar()
        return {
            "status": "success",
            "connected": True,
            "database_name": settings.DB_NAME,
            "mysql_version": str(result),
            "message": f"Successfully connected to MySQL database '{settings.DB_NAME}'!"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "connected": False,
                "database_name": settings.DB_NAME,
                "host": settings.DB_HOST,
                "port": settings.DB_PORT,
                "message": (
                    f"Connection to MySQL database '{settings.DB_NAME}' failed. "
                    "Please verify that MySQL is running and your password in .env is correct."
                )
            }
        )
