"""
Pydantic schemas for Company and Placement Drive validation and serialization.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Company Name")
    industry: str | None = Field(None, max_length=100, description="e.g. Software & IT, Consulting")
    website: str | None = Field(None, max_length=255, description="Company Website URL")
    location: str | None = Field(None, max_length=150, description="Headquarters / Office Location")
    description: str | None = Field(None, description="About the company")
    contact_email: str | None = Field(None, max_length=255, description="HR / Recruiter Email")


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlacementDriveBase(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=150, description="Role / Job Title")
    role_type: str = Field("Full-time", max_length=50, description="Full-time, Internship, or Both")
    package_lpa: float = Field(..., gt=0.0, description="Salary Package in LPA (e.g. 12.5)")
    job_location: str | None = Field(None, max_length=150, description="Work location / Remote")
    description: str | None = Field(None, description="Job Description and Responsibilities")
    deadline: datetime = Field(..., description="Application Deadline")

    # Eligibility Criteria
    min_cgpa: float = Field(0.0, ge=0.0, le=10.0, description="Minimum CGPA Cutoff")
    min_tenth_pct: float = Field(0.0, ge=0.0, le=100.0, description="Minimum 10th Standard Percentage")
    min_twelfth_pct: float = Field(0.0, ge=0.0, le=100.0, description="Minimum 12th / Diploma Percentage")
    max_active_backlogs: int = Field(0, ge=0, description="Maximum Active Live Backlogs Allowed")
    allowed_departments: list[str] = Field(default_factory=list, description="List of eligible engineering branches/departments")


class PlacementDriveCreate(PlacementDriveBase):
    company_id: int = Field(..., description="ID of the registered recruiting company")


class PlacementDriveResponse(PlacementDriveBase):
    id: int
    company_id: int
    status: str
    created_at: datetime
    company: CompanyResponse

    model_config = ConfigDict(from_attributes=True)


class StudentPlacementDriveResponse(PlacementDriveResponse):
    """
    Drive model returned to students enriched with real-time eligibility evaluation and application state.
    """
    is_eligible: bool = True
    eligibility_reasons: list[str] = Field(default_factory=list)
    matched_criteria: list[str] = Field(default_factory=list)
    has_applied: bool = False
    application_status: str | None = None
