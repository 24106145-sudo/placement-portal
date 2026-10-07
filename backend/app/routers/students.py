"""
Student API Router.
Handles endpoints for retrieving and updating student personal, academic records,
and exploring active campus recruitment drives with real-time eligibility evaluation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.schemas.student_profile import (
    StudentProfileResponse,
    StudentProfileUpdate
)
from app.schemas.company import StudentPlacementDriveResponse
from app.schemas.application import StudentApplicationResponse
from app.schemas.ml import (
    PlacementPredictionResponse,
    WhatIfCustomRequest,
    WhatIfCustomResponse
)
from app.services.student_service import (
    get_or_create_student_profile,
    update_student_profile
)
from app.services.drive_service import list_student_drives
from app.services.application_service import (
    apply_to_drive,
    list_student_applications
)
from app.services.ml_service import (
    predict_student_placement,
    simulate_custom_what_if
)

router = APIRouter(prefix="/students", tags=["Student Profile & Campus Drives"])


@router.get(
    "/me/profile",
    response_model=StudentProfileResponse,
    summary="Get current student's full profile (Personal, Academic, Skills & Links)"
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the complete profile of the currently logged-in student.
    Auto-creates the profile if it doesn't exist yet.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students or administrators can access student profile records."
        )

    return get_or_create_student_profile(db=db, user=current_user)


@router.put(
    "/me/profile",
    response_model=StudentProfileResponse,
    summary="Update current student's profile and academic records"
)
def update_my_profile(
    profile_data: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the student profile:
    - Personal info (DOB, Gender, Phone, Address, City)
    - 10th & 12th/Diploma schooling
    - College info, current semester, CGPA & backlogs
    - Sem 1-8 SGPA breakdown
    - Technical skills, certifications, projects, resume link, LinkedIn & GitHub URLs
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students or administrators can update student profile records."
        )

    return update_student_profile(db=db, user=current_user, profile_data=profile_data)


@router.get(
    "/drives",
    response_model=list[StudentPlacementDriveResponse],
    summary="List all active campus recruitment drives with real-time student eligibility calculation"
)
def get_available_drives(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all active campus recruitment drives.
    For each drive, evaluates the student's CGPA, 10th %, 12th %, backlogs, and branch,
    returning `is_eligible` (boolean) along with explicit reason breakdown strings.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students or administrators can browse campus recruitment drives."
        )

    return list_student_drives(db=db, student_user=current_user)


@router.post(
    "/drives/{drive_id}/apply",
    response_model=StudentApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for an active placement drive with automated eligibility check"
)
def apply_drive_endpoint(
    drive_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a job application for the current student to a specific placement drive.
    Validates that:
    1. Student has filled their profile.
    2. Student meets all drive cutoff criteria (CGPA, 10th %, 12th %, max backlogs, eligible branches).
    3. Student has not already applied to this drive.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit job applications."
        )

    return apply_to_drive(db=db, student_user=current_user, drive_id=drive_id)


@router.get(
    "/my-applications",
    response_model=list[StudentApplicationResponse],
    summary="List all applications submitted by the current student"
)
def get_my_applications_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all job applications submitted by the logged-in student along with
    drive details, company details, current status, and progress timeline.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their application pipeline."
        )

    return list_student_applications(db=db, student_user=current_user)


@router.get(
    "/me/placement-prediction",
    response_model=PlacementPredictionResponse,
    summary="AIML Placement Probability & Prescriptive Improvement Engine"
)
def get_placement_prediction_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes real-time placement probability (%) for the logged-in student using
    a trained GradientBoostingClassifier model. Returns readiness tiers, feature
    summaries, actionable prescriptive recommendations, and What-If improvement scenarios.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access placement prediction analytics."
        )

    return predict_student_placement(db=db, student_user=current_user)


@router.post(
    "/me/simulate-what-if",
    response_model=WhatIfCustomResponse,
    summary="Dynamic What-If Improvement Simulator"
)
def simulate_what_if_endpoint(
    custom_req: WhatIfCustomRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulates changes to student credentials (e.g. CGPA, cleared backlogs, extra skills/projects)
    in real time and calculates the expected statistical placement probability increase.
    """
    if current_user.role != UserRole.STUDENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can run what-if improvement simulations."
        )

    return simulate_custom_what_if(db=db, student_user=current_user, custom_req=custom_req)
