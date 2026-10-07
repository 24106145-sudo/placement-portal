"""
Application service module.
Handles student job application submissions, eligibility enforcement,
officer candidate reviews, status updates, and CSV batch exports.
"""

import io
import csv
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application
from app.models.company import PlacementDrive
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.application import (
    ApplicationStatusUpdate,
    StudentApplicationResponse,
    OfficerApplicationResponse
)
from app.schemas.company import PlacementDriveResponse, CompanyResponse
from app.services.drive_service import evaluate_student_eligibility


def apply_to_drive(db: Session, student_user: User, drive_id: int) -> StudentApplicationResponse:
    """
    Submits a student's application to a campus recruitment drive after enforcing real-time eligibility checks.
    """
    # 1. Fetch Student Profile & Academic Record
    profile = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.academic_record))
        .filter(StudentProfile.user_id == student_user.id)
        .first()
    )
    if not profile or not profile.academic_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your Academic History in 'My Profile' before applying to placement drives."
        )

    # 2. Fetch Target Placement Drive
    drive = (
        db.query(PlacementDrive)
        .options(joinedload(PlacementDrive.company))
        .filter(PlacementDrive.id == drive_id)
        .first()
    )
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Placement drive with ID {drive_id} was not found."
        )

    # 3. Check for Duplicate Application
    existing_app = (
        db.query(Application)
        .filter(Application.drive_id == drive_id, Application.student_id == profile.id)
        .first()
    )
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this placement drive."
        )

    # 4. Enforce Real-Time Eligibility Criteria
    is_eligible, failed_reasons, _ = evaluate_student_eligibility(drive, profile.academic_record)
    if not is_eligible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not meet the eligibility criteria for this drive: {'; '.join(failed_reasons)}"
        )

    # 5. Create Application Record in MySQL
    new_app = Application(
        drive_id=drive.id,
        student_id=profile.id,
        status="Applied"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return StudentApplicationResponse(
        id=new_app.id,
        drive_id=new_app.drive_id,
        student_id=new_app.student_id,
        applied_at=new_app.applied_at,
        status=new_app.status,
        notes=new_app.notes,
        drive=PlacementDriveResponse.model_validate(drive)
    )


from app.models.schedule import DriveSchedule
from app.schemas.schedule import DriveScheduleResponse


def list_student_applications(db: Session, student_user: User) -> list[StudentApplicationResponse]:
    """
    Lists all placement drive applications submitted by the authenticated student.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
    if not profile:
        return []

    apps = (
        db.query(Application)
        .options(joinedload(Application.drive).joinedload(PlacementDrive.company))
        .filter(Application.student_id == profile.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    drive_ids = [a.drive_id for a in apps]
    schedules = (
        db.query(DriveSchedule)
        .filter(DriveSchedule.drive_id.in_(drive_ids))
        .order_by(DriveSchedule.scheduled_at.asc())
        .all()
    ) if drive_ids else []

    sched_by_drive: dict[int, list[DriveScheduleResponse]] = {}
    for s in schedules:
        if s.drive_id not in sched_by_drive:
            sched_by_drive[s.drive_id] = []
        sched_by_drive[s.drive_id].append(DriveScheduleResponse.model_validate(s))

    results: list[StudentApplicationResponse] = []
    for a in apps:
        results.append(
            StudentApplicationResponse(
                id=a.id,
                drive_id=a.drive_id,
                student_id=a.student_id,
                applied_at=a.applied_at,
                status=a.status,
                notes=a.notes,
                offered_ctc_lpa=a.offered_ctc_lpa,
                drive=PlacementDriveResponse.model_validate(a.drive),
                schedules=sched_by_drive.get(a.drive_id, [])
            )
        )
    return results


def _build_officer_application_response(
    app: Application,
    db: Session | None = None,
    sched_by_drive: dict[int, list[DriveScheduleResponse]] | None = None
) -> OfficerApplicationResponse:
    profile = app.student
    user = profile.user if profile else None
    acad = profile.academic_record if profile else None

    # Load drive schedules
    sched_responses: list[DriveScheduleResponse] = []
    if sched_by_drive is not None:
        sched_responses = sched_by_drive.get(app.drive_id, [])
    elif db:
        schedules = (
            db.query(DriveSchedule)
            .filter(DriveSchedule.drive_id == app.drive_id)
            .order_by(DriveSchedule.scheduled_at.asc())
            .all()
        )
        sched_responses = [DriveScheduleResponse.model_validate(s) for s in schedules]

    return OfficerApplicationResponse(
        id=app.id,
        drive_id=app.drive_id,
        student_id=app.student_id,
        applied_at=app.applied_at,
        status=app.status,
        notes=app.notes,
        offered_ctc_lpa=app.offered_ctc_lpa,
        drive=PlacementDriveResponse.model_validate(app.drive),
        schedules=sched_responses,
        student_name=profile.full_name if profile and profile.full_name else (user.full_name if user and user.full_name else "Unknown Student"),
        student_email=user.email if user and user.email else "",
        phone_number=profile.phone_number if profile else None,
        city=profile.city if profile else None,
        college_name=acad.college_name if acad else None,
        roll_no=acad.roll_no if acad else None,
        department=acad.department if acad else None,
        degree=acad.degree if acad else None,
        cgpa=acad.cgpa if acad else None,
        active_backlogs=acad.active_backlogs if acad else 0,
        tenth_percentage=acad.tenth_percentage if acad else None,
        twelfth_percentage=acad.twelfth_percentage if acad else None,
        technical_skills=profile.technical_skills or [] if profile else [],
        resume_link=profile.resume_link if profile else None,
        linkedin_url=profile.linkedin_url if profile else None,
        github_url=profile.github_url if profile else None
    )


def list_officer_applications(
    db: Session,
    drive_id: int | None = None,
    status_filter: str | None = None
) -> list[OfficerApplicationResponse]:
    """
    Lists applications for Placement Officers with filter by drive_id and status.
    """
    query = (
        db.query(Application)
        .options(
            joinedload(Application.drive).joinedload(PlacementDrive.company),
            joinedload(Application.student).joinedload(StudentProfile.user),
            joinedload(Application.student).joinedload(StudentProfile.academic_record)
        )
    )

    if drive_id is not None:
        query = query.filter(Application.drive_id == drive_id)
    if status_filter and status_filter.strip().lower() != "all":
        query = query.filter(Application.status == status_filter.strip())

    apps = query.order_by(Application.applied_at.desc()).all()

    # Pre-fetch schedules in a single query
    drive_ids = list({a.drive_id for a in apps})
    schedules = (
        db.query(DriveSchedule)
        .filter(DriveSchedule.drive_id.in_(drive_ids))
        .order_by(DriveSchedule.scheduled_at.asc())
        .all()
    ) if drive_ids else []

    sched_by_drive: dict[int, list[DriveScheduleResponse]] = {}
    for s in schedules:
        if s.drive_id not in sched_by_drive:
            sched_by_drive[s.drive_id] = []
        sched_by_drive[s.drive_id].append(DriveScheduleResponse.model_validate(s))

    return [_build_officer_application_response(a, db=db, sched_by_drive=sched_by_drive) for a in apps]


def update_application_status(
    db: Session,
    application_id: int,
    status_in: ApplicationStatusUpdate
) -> OfficerApplicationResponse:
    """
    Updates candidate progress stage (e.g. 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected').
    """
    app = (
        db.query(Application)
        .options(
            joinedload(Application.drive).joinedload(PlacementDrive.company),
            joinedload(Application.student).joinedload(StudentProfile.user),
            joinedload(Application.student).joinedload(StudentProfile.academic_record)
        )
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found."
        )

    app.status = status_in.status.strip()
    if status_in.notes is not None:
        app.notes = status_in.notes.strip()

    db.commit()
    db.refresh(app)

    # Trigger targeted notification for candidate
    try:
        if app.student and app.student.user_id:
            from app.services.notification_service import create_notification
            company_name = app.drive.company.name if app.drive and app.drive.company else "Recruiter"
            create_notification(
                db=db,
                title=f"Application Update: {company_name}",
                message=f"Your application status for {app.drive.job_title} has been updated to '{app.status}'.",
                category="STATUS_UPDATE",
                target_route="student-applications",
                user_id=app.student.user_id
            )
    except Exception:
        pass

    return _build_officer_application_response(app, db=db)


def export_applications_csv(db: Session, drive_id: int | None = None) -> str:
    """
    Generates CSV formatted stream of student candidate records.
    """
    apps = list_officer_applications(db=db, drive_id=drive_id, status_filter=None)

    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Application ID",
        "Company",
        "Job Title",
        "Package (LPA)",
        "Student Name",
        "Email",
        "Phone",
        "City",
        "Roll No",
        "Department",
        "Degree",
        "CGPA",
        "10th %",
        "12th %",
        "Backlogs",
        "Application Status",
        "Applied Date",
        "Resume Link",
        "LinkedIn URL",
        "GitHub URL"
    ])

    # Write Data Rows
    for a in apps:
        writer.writerow([
            a.id,
            a.drive.company.name,
            a.drive.job_title,
            a.drive.package_lpa,
            a.student_name,
            a.student_email,
            a.phone_number or "",
            a.city or "",
            a.roll_no or "",
            a.department or "",
            a.degree or "",
            a.cgpa if a.cgpa is not None else "",
            a.tenth_percentage if a.tenth_percentage is not None else "",
            a.twelfth_percentage if a.twelfth_percentage is not None else "",
            a.active_backlogs,
            a.status,
            a.applied_at.strftime("%Y-%m-%d %H:%M:%S") if a.applied_at else "",
            a.resume_link or "",
            a.linkedin_url or "",
            a.github_url or ""
        ])

    return output.getvalue()
