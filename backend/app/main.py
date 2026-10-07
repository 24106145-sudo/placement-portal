"""
Main entry point for the FastAPI Backend Application.
This file initializes the FastAPI app, configures CORS middleware,
and connects all API routes.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import Base, engine
from app.models import (
    user as _user_model,
    student_profile as _student_model,
    company as _company_model,
    application as _application_model,
    schedule as _schedule_model
)
from app.routers import health, auth, students, officer, admin, notifications

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("placement_portal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown tasks.
    """
    import os
    if not os.getenv("VERCEL"):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("[SUCCESS] Database tables verified in local MySQL.")
        except Exception as e:
            logger.warning(f"[NOTICE] Local database not reachable on startup: {e}")
    yield


# 1. Initialize the FastAPI app with metadata
app = FastAPI(
    title="College Placement Portal API",
    description="Backend API for managing campus placements, students, drives, and companies.",
    version="1.0.0",
    docs_url="/docs",      # Interactive Swagger UI documentation
    redoc_url="/redoc",    # Alternative ReDoc documentation
    lifespan=lifespan
)

# 2. Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Include API Routers
app.include_router(health.router, prefix="/api", tags=["Health & Status"])
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication & Registration"])
app.include_router(auth.router, prefix="/api", tags=["Authentication & Registration"])

# Register Student Profile & Drives endpoints under /api/v1 and /api
app.include_router(students.router, prefix="/api/v1", tags=["Student Profile & Campus Drives"])
app.include_router(students.router, prefix="/api", tags=["Student Profile & Campus Drives"])

# Register Placement Officer endpoints under /api/v1 and /api
app.include_router(officer.router, prefix="/api/v1", tags=["Placement Officer & Campus Drives"])
app.include_router(officer.router, prefix="/api", tags=["Placement Officer & Campus Drives"])

# Register System Administrator endpoints under /api/v1 and /api
app.include_router(admin.router, prefix="/api/v1", tags=["System Administration & Analytics"])
app.include_router(admin.router, prefix="/api", tags=["System Administration & Analytics"])

# Register Notifications endpoints under /api/v1 and /api
app.include_router(notifications.router, prefix="/api/v1", tags=["Notifications & Alerts"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications & Alerts"])


# 4. Root Welcome Endpoint
@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint to quickly verify the API is online.
    """
    return {
        "message": "Welcome to the College Placement Portal API!",
        "status": "online",
        "docs_url": "/docs"
    }
