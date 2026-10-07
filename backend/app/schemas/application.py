"""
Pydantic schemas for Job Application submission, status management, and candidate review.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.company import PlacementDriveResponse
from app.schemas.schedule import DriveScheduleResponse


class ApplicationStatusUpdate(BaseModel):
    """
    Schema for updating an application's progress stage.
    """
    status: str = Field(
        ...,
        description="One of: 'Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'"
    )
    notes: str | None = Field(None, description="Internal feedback or interview instructions for candidate")


class StudentApplicationResponse(BaseModel):
    """
    Schema returned to student viewing their submitted job applications.
    """
    id: int
    drive_id: int
    student_id: int
    applied_at: datetime
    status: str
    notes: str | None = None
    offered_ctc_lpa: float | None = None
    drive: PlacementDriveResponse
    schedules: list[DriveScheduleResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class OfficerApplicationResponse(BaseModel):
    """
    Comprehensive candidate response model for Placement Officers with full student credentials.
    """
    id: int
    drive_id: int
    student_id: int
    applied_at: datetime
    status: str
    notes: str | None = None
    offered_ctc_lpa: float | None = None
    drive: PlacementDriveResponse
    schedules: list[DriveScheduleResponse] = Field(default_factory=list)

    # Student Details
    student_name: str
    student_email: str
    phone_number: str | None = None
    city: str | None = None

    # Academic Snapshot
    college_name: str | None = None
    roll_no: str | None = None
    department: str | None = None
    degree: str | None = None
    cgpa: float | None = None
    active_backlogs: int = 0
    tenth_percentage: float | None = None
    twelfth_percentage: float | None = None

    # Professional & Links
    technical_skills: list[str] = Field(default_factory=list)
    resume_link: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None

    model_config = ConfigDict(from_attributes=True)
