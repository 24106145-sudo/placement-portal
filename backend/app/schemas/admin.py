"""
Pydantic schemas for System Administrator management, Institutional Analytics, and System Health.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class AdminUserResponse(BaseModel):
    """
    User response with profile status for System Admin overview.
    """
    id: int
    full_name: str
    email: str
    role: UserRole
    created_at: datetime
    has_profile: bool = False
    department: str | None = None
    roll_no: str | None = None
    cgpa: float | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    """
    Schema for updating user role or details by Administrator.
    """
    role: UserRole = Field(..., description="Target role: 'student', 'officer', or 'admin'")


class BranchPlacementMetric(BaseModel):
    """
    Placement statistics breakdown for a specific academic department.
    """
    department: str
    total_students: int
    placed_students: int
    placement_rate_pct: float
    avg_ctc_lpa: float
    highest_ctc_lpa: float


class TopRecruiterMetric(BaseModel):
    """
    Company performance metrics in campus hiring.
    """
    company_name: str
    total_drives: int
    total_selections: int
    highest_package_lpa: float
    avg_package_lpa: float


class PlacementAnalyticsResponse(BaseModel):
    """
    Macro-level institutional placement analytics dashboard.
    """
    total_registered_students: int
    total_placement_officers: int
    total_companies_registered: int
    total_drives_posted: int
    total_applications_submitted: int
    total_students_placed: int
    overall_placement_rate_pct: float
    average_ctc_lpa: float
    highest_ctc_lpa: float
    branch_breakdown: list[BranchPlacementMetric]
    top_recruiters: list[TopRecruiterMetric]


class SystemActivityLog(BaseModel):
    """
    Recent audit log / activity item in the system.
    """
    id: str
    timestamp: datetime
    action_type: str  # "User Registered", "Drive Posted", "Application Submitted", "Offer Extended", "Round Scheduled"
    description: str
    actor: str
    severity: str = "info"  # "info", "success", "warning"


class SystemHealthResponse(BaseModel):
    """
    Database and operational health status response.
    """
    status: str
    database_engine: str
    database_name: str
    host: str
    port: int
    connected: bool
    table_counts: dict[str, int]
    recent_activities: list[SystemActivityLog]
