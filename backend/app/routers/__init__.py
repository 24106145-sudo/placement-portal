"""
Routers package containing API route definitions.
"""

from app.routers import health, auth, students, officer

__all__ = ["health", "auth", "students", "officer"]
