"""
Models package for SQLAlchemy database models.
"""

from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile, AcademicRecord
from app.models.company import Company, PlacementDrive
from app.models.application import Application
from app.models.schedule import DriveSchedule
from app.models.notification import Notification

__all__ = [
    "User",
    "UserRole",
    "StudentProfile",
    "AcademicRecord",
    "Company",
    "PlacementDrive",
    "Application",
    "DriveSchedule",
    "Notification"
]
