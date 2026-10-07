"""
Pydantic schemas for Student Profile and Academic Record data validation and serialization.
"""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class AcademicRecordBase(BaseModel):
    """
    Academic Record Schema.
    """
    # 10th Standard Schooling
    tenth_school_name: str | None = Field(None, max_length=150)
    tenth_board: str | None = Field(None, max_length=100)
    tenth_year: int | None = Field(None, ge=1900, le=2100, description="Passing year (e.g. 2020)")
    tenth_percentage: float | None = Field(None, ge=0.0, le=100.0)

    # 12th Standard / Diploma Schooling
    twelfth_college_name: str | None = Field(None, max_length=150)
    twelfth_board: str | None = Field(None, max_length=100)
    twelfth_year: int | None = Field(None, ge=1900, le=2100, description="Passing year (e.g. 2022)")
    twelfth_percentage: float | None = Field(None, ge=0.0, le=100.0)
    is_diploma: bool = False

    # College Details
    college_name: str | None = Field(None, max_length=200)
    university: str | None = Field(None, max_length=200)
    degree: str | None = Field(None, max_length=100)
    department: str | None = Field(None, max_length=100)
    current_year: int | None = Field(None, ge=1, le=10)
    current_sem: int | None = Field(None, ge=1, le=20)
    roll_no: str | None = Field(None, max_length=50)
    cgpa: float | None = Field(None, ge=0.0, le=10.0)
    active_backlogs: int = Field(0, ge=0)

    # Semester Breakdown (SGPA 1-8)
    sgpa_sem1: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem2: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem3: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem4: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem5: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem6: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem7: float | None = Field(None, ge=0.0, le=10.0)
    sgpa_sem8: float | None = Field(None, ge=0.0, le=10.0)


class AcademicRecordUpdate(AcademicRecordBase):
    """
    Schema for updating academic records.
    """
    pass


class AcademicRecordResponse(AcademicRecordBase):
    """
    Response schema for academic record data.
    """
    id: int | None = None
    profile_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class StudentProfileUpdate(BaseModel):
    """
    Schema for updating a student profile and its nested academic record.
    """
    full_name: str | None = Field(None, min_length=2, max_length=150)
    dob: str | None = Field(None, max_length=30)
    gender: str | None = Field(None, max_length=20)
    phone_number: str | None = Field(None, max_length=25)
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)

    technical_skills: list[str] | None = None
    certifications: list[Any] | None = None
    projects: list[Any] | None = None
    resume_link: str | None = Field(None, max_length=500)
    linkedin_url: str | None = Field(None, max_length=500)
    github_url: str | None = Field(None, max_length=500)

    academic: AcademicRecordUpdate | None = None


class StudentProfileResponse(BaseModel):
    """
    Complete Student Profile response schema including personal, academic, professional details,
    and the calculated completion percentage.
    """
    id: int
    user_id: int
    email: str | None = None
    full_name: str | None = None
    dob: str | None = None
    gender: str | None = None
    phone_number: str | None = None
    address: str | None = None
    city: str | None = None

    technical_skills: list[str] = Field(default_factory=list)
    certifications: list[Any] = Field(default_factory=list)
    projects: list[Any] = Field(default_factory=list)
    resume_link: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None

    academic: AcademicRecordResponse | None = None
    completion_percentage: int = 0

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
