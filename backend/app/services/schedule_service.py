"""
Service layer for managing Drive Schedules, Interview Rounds, and Offer records in MySQL.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.company import PlacementDrive
from app.models.schedule import DriveSchedule
from app.models.application import Application
from app.models.student_profile import StudentProfile
from app.schemas.schedule import (
    DriveScheduleCreate,
    DriveScheduleUpdate,
    DriveScheduleResponse,
    OfferRecordRequest
)
from app.schemas.application import OfficerApplicationResponse
from app.schemas.company import PlacementDriveResponse


def create_drive_schedule(
    db: Session,
    drive_id: int,
    schedule_in: DriveScheduleCreate
) -> DriveScheduleResponse:
    """
    Creates a new scheduled interview round or assessment for a placement drive.
    """
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Placement Drive with ID {drive_id} not found."
        )

    new_schedule = DriveSchedule(
        drive_id=drive_id,
        round_name=schedule_in.round_name.strip(),
        round_type=schedule_in.round_type.strip(),
        scheduled_at=schedule_in.scheduled_at,
        venue_or_link=schedule_in.venue_or_link.strip() if schedule_in.venue_or_link else None,
        instructions=schedule_in.instructions.strip() if schedule_in.instructions else None,
        is_completed=schedule_in.is_completed
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    # Trigger notifications for applicant students
    try:
        from app.services.notification_service import create_notification
        from app.models.application import Application
        from app.models.student_profile import StudentProfile
        apps = (
            db.query(Application)
            .join(StudentProfile, Application.student_id == StudentProfile.id)
            .filter(Application.drive_id == drive_id)
            .all()
        )
        time_str = new_schedule.scheduled_at.strftime('%b %d, %Y at %I:%M %p') if new_schedule.scheduled_at else 'Upcoming'
        for a in apps:
            if a.student and a.student.user_id:
                create_notification(
                    db=db,
                    title=f"Interview Scheduled: {drive.job_title}",
                    message=f"'{new_schedule.round_name}' is scheduled for {time_str}. Venue/Link: {new_schedule.venue_or_link or 'Check details'}.",
                    category="ROUND_SCHEDULED",
                    target_route="student-applications",
                    user_id=a.student.user_id
                )
    except Exception:
        pass

    return DriveScheduleResponse.model_validate(new_schedule)


def list_drive_schedules(db: Session, drive_id: int) -> list[DriveScheduleResponse]:
    """
    Lists all scheduled rounds for a specific drive ordered chronologically.
    """
    schedules = (
        db.query(DriveSchedule)
        .filter(DriveSchedule.drive_id == drive_id)
        .order_by(DriveSchedule.scheduled_at.asc())
        .all()
    )
    return [DriveScheduleResponse.model_validate(s) for s in schedules]


def list_all_schedules(db: Session) -> list[DriveScheduleResponse]:
    """
    Lists all scheduled rounds across all recruitment drives.
    """
    schedules = (
        db.query(DriveSchedule)
        .order_by(DriveSchedule.scheduled_at.desc())
        .all()
    )
    return [DriveScheduleResponse.model_validate(s) for s in schedules]


def update_drive_schedule(
    db: Session,
    schedule_id: int,
    schedule_in: DriveScheduleUpdate
) -> DriveScheduleResponse:
    """
    Updates an existing scheduled round (e.g. reschedule date, mark completed, change venue).
    """
    schedule = db.query(DriveSchedule).filter(DriveSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule round with ID {schedule_id} not found."
        )

    if schedule_in.round_name is not None:
        schedule.round_name = schedule_in.round_name.strip()
    if schedule_in.round_type is not None:
        schedule.round_type = schedule_in.round_type.strip()
    if schedule_in.scheduled_at is not None:
        schedule.scheduled_at = schedule_in.scheduled_at
    if schedule_in.venue_or_link is not None:
        schedule.venue_or_link = schedule_in.venue_or_link.strip() if schedule_in.venue_or_link else None
    if schedule_in.instructions is not None:
        schedule.instructions = schedule_in.instructions.strip() if schedule_in.instructions else None
    if schedule_in.is_completed is not None:
        schedule.is_completed = schedule_in.is_completed

    db.commit()
    db.refresh(schedule)

    return DriveScheduleResponse.model_validate(schedule)


def delete_drive_schedule(db: Session, schedule_id: int) -> dict:
    """
    Deletes a scheduled round.
    """
    schedule = db.query(DriveSchedule).filter(DriveSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule round with ID {schedule_id} not found."
        )

    db.delete(schedule)
    db.commit()
    return {"message": f"Schedule round #{schedule_id} successfully deleted."}


def record_final_offer(
    db: Session,
    application_id: int,
    offer_in: OfferRecordRequest
) -> OfficerApplicationResponse:
    """
    Awards and records a final placement offer for an applicant.
    Transitions status to 'Selected', updates offered_ctc_lpa, and appends notes.
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

    app.status = "Selected"
    app.offered_ctc_lpa = offer_in.offered_ctc_lpa
    if offer_in.notes:
        app.notes = offer_in.notes.strip()

    db.commit()
    db.refresh(app)

    # Fetch drive schedules
    schedules = (
        db.query(DriveSchedule)
        .filter(DriveSchedule.drive_id == app.drive_id)
        .order_by(DriveSchedule.scheduled_at.asc())
        .all()
    )
    sched_responses = [DriveScheduleResponse.model_validate(s) for s in schedules]

    profile = app.student
    user = profile.user if profile else None
    acad = profile.academic_record if profile else None

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
        student_name=profile.full_name or (user.full_name if user else "Unknown"),
        student_email=user.email if user else "",
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
