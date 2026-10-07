from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    PlacementDriveCreate,
    PlacementDriveResponse
)
from app.schemas.application import (
    ApplicationStatusUpdate,
    OfficerApplicationResponse
)
from app.schemas.officer import OfficerDashboardMetricsResponse
from app.schemas.schedule import (
    DriveScheduleCreate,
    DriveScheduleUpdate,
    DriveScheduleResponse,
    OfferRecordRequest
)
from app.services.drive_service import (
    get_officer_dashboard_metrics,
    create_company,
    list_companies,
    create_placement_drive,
    list_officer_drives
)
from app.services.application_service import (
    list_officer_applications,
    update_application_status,
    export_applications_csv
)
from app.services.schedule_service import (
    create_drive_schedule,
    list_drive_schedules,
    list_all_schedules,
    update_drive_schedule,
    delete_drive_schedule,
    record_final_offer
)

router = APIRouter(prefix="/officer", tags=["Placement Officer & Campus Drives"])


def require_officer_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user is a Placement Officer or Administrator.
    """
    if current_user.role != UserRole.OFFICER and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Placement Officers and Administrators."
        )
    return current_user


@router.post(
    "/companies",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new recruiting company"
)
def register_company_endpoint(
    company_in: CompanyCreate,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Register a new visiting company / organization.
    """
    return create_company(db=db, company_in=company_in)


@router.get(
    "/companies",
    response_model=list[CompanyResponse],
    summary="List all registered companies"
)
def get_companies_endpoint(
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    List all companies for selection in placement drive postings.
    """
    return list_companies(db=db)


@router.post(
    "/drives",
    response_model=PlacementDriveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create & post a new campus recruitment drive"
)
def create_drive_endpoint(
    drive_in: PlacementDriveCreate,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new campus placement drive with job specs and automated eligibility cutoffs.
    """
    return create_placement_drive(db=db, drive_in=drive_in)


@router.get(
    "/drives",
    response_model=list[PlacementDriveResponse],
    summary="List all placement drives posted by officers"
)
def get_officer_drives_endpoint(
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    List all posted drives with company details and eligibility criteria.
    """
    return list_officer_drives(db=db)


@router.get(
    "/applications",
    response_model=list[OfficerApplicationResponse],
    summary="List all student applications across drives with optional filters"
)
def get_officer_applications_endpoint(
    drive_id: Optional[int] = None,
    status: Optional[str] = None,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves all submitted applications with rich student profiles, academic metrics,
    and drive info. Supports optional filtering by `drive_id` and `status`.
    """
    return list_officer_applications(db=db, drive_id=drive_id, status_filter=status)


@router.put(
    "/applications/{application_id}/status",
    response_model=OfficerApplicationResponse,
    summary="Update candidate application pipeline status (Shortlisted, Selected, etc.)"
)
def update_application_status_endpoint(
    application_id: int,
    status_in: ApplicationStatusUpdate,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Transitions an application status through stages:
    Applied -> Shortlisted -> Interview Scheduled -> Selected / Rejected.
    """
    return update_application_status(db=db, application_id=application_id, status_in=status_in)


@router.get(
    "/applications/export",
    summary="Export applicant data as downloadable CSV format"
)
def export_applications_endpoint(
    drive_id: Optional[int] = None,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Generates and returns a CSV file containing applicant roster, contact info,
    academic records, CGPA, backlogs, and resume links for the specified drive or all drives.
    """
    csv_content = export_applications_csv(db=db, drive_id=drive_id)
    filename = f"placement_applicants_drive_{drive_id or 'all'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# ================= DRIVE SCHEDULES & INTERVIEW ROUNDS =================

@router.post(
    "/drives/{drive_id}/schedules",
    response_model=DriveScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a new interview round / assessment for a placement drive"
)
def create_drive_schedule_endpoint(
    drive_id: int,
    schedule_in: DriveScheduleCreate,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Creates an assessment/interview round (e.g. Aptitude Test, Tech Round 1, HR) with date, venue/link, and instructions.
    """
    return create_drive_schedule(db=db, drive_id=drive_id, schedule_in=schedule_in)


@router.get(
    "/drives/{drive_id}/schedules",
    response_model=list[DriveScheduleResponse],
    summary="List all interview rounds scheduled for a specific drive"
)
def get_drive_schedules_endpoint(
    drive_id: int,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves all scheduled interview rounds for a specific placement drive.
    """
    return list_drive_schedules(db=db, drive_id=drive_id)


@router.get(
    "/schedules",
    response_model=list[DriveScheduleResponse],
    summary="List all interview rounds scheduled across all drives"
)
def get_all_schedules_endpoint(
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves all scheduled rounds across drives ordered chronologically.
    """
    return list_all_schedules(db=db)


@router.put(
    "/schedules/{schedule_id}",
    response_model=DriveScheduleResponse,
    summary="Update a scheduled interview round"
)
def update_schedule_endpoint(
    schedule_id: int,
    schedule_in: DriveScheduleUpdate,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Updates schedule round time, venue, or marks it completed.
    """
    return update_drive_schedule(db=db, schedule_id=schedule_id, schedule_in=schedule_in)


@router.delete(
    "/schedules/{schedule_id}",
    summary="Delete a scheduled interview round"
)
def delete_schedule_endpoint(
    schedule_id: int,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Deletes a scheduled round.
    """
    return delete_drive_schedule(db=db, schedule_id=schedule_id)


@router.post(
    "/applications/{application_id}/offer",
    response_model=OfficerApplicationResponse,
    summary="Record confirmed job offer for selected candidate"
)
def record_offer_endpoint(
    application_id: int,
    offer_in: OfferRecordRequest,
    _user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Transitions applicant status to 'Selected', stores official Offered CTC (LPA), and saves offer notes.
    """
    return record_final_offer(db=db, application_id=application_id, offer_in=offer_in)



@router.get(
    "/dashboard/metrics",
    response_model=OfficerDashboardMetricsResponse,
    summary="Get real-time live database metrics for the Officer / Overview Dashboard"
)
def get_officer_dashboard_metrics_endpoint(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns live statistics computed directly from MySQL tables (students, companies, drives, applications, CTCs).
    """
    return get_officer_dashboard_metrics(db=db)
