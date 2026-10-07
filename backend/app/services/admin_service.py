"""
Service layer for System Administrator operations: User Management, Institutional Analytics, and System Health.
"""

from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile, AcademicRecord
from app.models.company import Company, PlacementDrive
from app.models.application import Application
from app.models.schedule import DriveSchedule
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserUpdate,
    BranchPlacementMetric,
    TopRecruiterMetric,
    PlacementAnalyticsResponse,
    SystemActivityLog,
    SystemHealthResponse
)
from app.core.config import settings


def list_all_users(db: Session) -> list[AdminUserResponse]:
    """
    Lists all registered user accounts with enriched student profile metadata.
    """
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    # Fetch all profiles with academic records
    profiles = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.academic_record))
        .all()
    )
    profile_by_user_id = {p.user_id: p for p in profiles}

    results: list[AdminUserResponse] = []
    for u in users:
        p = profile_by_user_id.get(u.id)
        acad = p.academic_record if p else None

        results.append(
            AdminUserResponse(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                role=u.role,
                created_at=u.created_at,
                has_profile=bool(p),
                department=acad.department if acad else None,
                roll_no=acad.roll_no if acad else None,
                cgpa=acad.cgpa if acad else None
            )
        )
    return results


def update_user_role(
    db: Session,
    user_id: int,
    user_in: AdminUserUpdate,
    current_admin: User
) -> AdminUserResponse:
    """
    Updates a user's role (e.g. promoting a user to Placement Officer or Admin).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    # Prevent admin from removing their own admin role accidentally
    if user.id == current_admin.id and user_in.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change or demote your own active Administrator role."
        )

    user.role = user_in.role
    db.commit()
    db.refresh(user)

    profile = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.academic_record))
        .filter(StudentProfile.user_id == user.id)
        .first()
    )
    acad = profile.academic_record if profile else None

    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        has_profile=bool(profile),
        department=acad.department if acad else None,
        roll_no=acad.roll_no if acad else None,
        cgpa=acad.cgpa if acad else None
    )


def delete_user(db: Session, user_id: int, current_admin: User) -> dict:
    """
    Deletes a user account from MySQL.
    Cascades to student profile, academic record, and applications.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own active Administrator account."
        )

    db.delete(user)
    db.commit()
    return {"message": f"User '{user.full_name}' (#{user_id}) successfully deleted from system."}


def get_placement_analytics(db: Session) -> PlacementAnalyticsResponse:
    """
    Calculates macro institutional placement statistics, branch breakdowns, and top recruiters.
    """
    # Counters
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    total_officers = db.query(User).filter(User.role == UserRole.OFFICER).count()
    total_companies = db.query(Company).count()
    total_drives = db.query(PlacementDrive).count()
    total_applications = db.query(Application).count()

    # Placed applications (status == 'Selected')
    placed_apps = (
        db.query(Application)
        .options(
            joinedload(Application.drive).joinedload(PlacementDrive.company),
            joinedload(Application.student).joinedload(StudentProfile.academic_record)
        )
        .filter(Application.status == "Selected")
        .all()
    )

    placed_student_ids = {a.student_id for a in placed_apps}
    total_placed_students = len(placed_student_ids)

    overall_placement_rate = (
        round((total_placed_students / total_students) * 100.0, 1)
        if total_students > 0 else 0.0
    )

    # Calculate average & highest CTC
    packages: list[float] = []
    for a in placed_apps:
        if a.offered_ctc_lpa and a.offered_ctc_lpa > 0:
            packages.append(a.offered_ctc_lpa)
        elif a.drive and a.drive.package_lpa > 0:
            packages.append(a.drive.package_lpa)

    avg_ctc = round(sum(packages) / len(packages), 2) if packages else 0.0
    highest_ctc = round(max(packages), 2) if packages else 0.0

    # Branch-wise breakdown
    # Common engineering branches
    standard_departments = [
        "Computer Science & Engineering",
        "Information Technology",
        "Artificial Intelligence & Data Science",
        "Electronics & Telecommunication",
        "Mechanical Engineering",
        "Civil Engineering"
    ]

    # Map department -> students & placed
    all_academic_records = db.query(AcademicRecord).all()
    branch_student_count: dict[str, int] = {dept: 0 for dept in standard_departments}
    branch_placed_count: dict[str, int] = {dept: 0 for dept in standard_departments}
    branch_packages: dict[str, list[float]] = {dept: [] for dept in standard_departments}

    for record in all_academic_records:
        dept = record.department or "Other"
        if dept not in branch_student_count:
            branch_student_count[dept] = 0
            branch_placed_count[dept] = 0
            branch_packages[dept] = []
        branch_student_count[dept] += 1

    for a in placed_apps:
        if a.student and a.student.academic_record:
            dept = a.student.academic_record.department or "Other"
            if dept not in branch_placed_count:
                branch_placed_count[dept] = 0
                branch_packages[dept] = []
            branch_placed_count[dept] += 1
            pkg = a.offered_ctc_lpa or (a.drive.package_lpa if a.drive else 0.0)
            if pkg > 0:
                branch_packages[dept].append(pkg)

    branch_breakdown: list[BranchPlacementMetric] = []
    for dept, count in branch_student_count.items():
        if count == 0 and dept not in standard_departments[:3]:
            continue
        placed = branch_placed_count.get(dept, 0)
        rate = round((placed / count) * 100.0, 1) if count > 0 else 0.0
        pkgs = branch_packages.get(dept, [])
        dept_avg = round(sum(pkgs) / len(pkgs), 2) if pkgs else 0.0
        dept_high = round(max(pkgs), 2) if pkgs else 0.0

        branch_breakdown.append(
            BranchPlacementMetric(
                department=dept,
                total_students=count,
                placed_students=placed,
                placement_rate_pct=rate,
                avg_ctc_lpa=dept_avg,
                highest_ctc_lpa=dept_high
            )
        )

    # Top Recruiters
    all_companies = db.query(Company).options(joinedload(Company.drives)).all()
    top_recruiters: list[TopRecruiterMetric] = []

    for c in all_companies:
        drive_ids = [d.id for d in c.drives]
        selections = sum(1 for a in placed_apps if a.drive_id in drive_ids)
        pkgs = [d.package_lpa for d in c.drives if d.package_lpa > 0]
        c_high = max(pkgs) if pkgs else 0.0
        c_avg = round(sum(pkgs) / len(pkgs), 2) if pkgs else 0.0

        top_recruiters.append(
            TopRecruiterMetric(
                company_name=c.name,
                total_drives=len(c.drives),
                total_selections=selections,
                highest_package_lpa=c_high,
                avg_package_lpa=c_avg
            )
        )

    # Sort top recruiters by selections and then highest package
    top_recruiters.sort(key=lambda x: (x.total_selections, x.highest_package_lpa), reverse=True)

    return PlacementAnalyticsResponse(
        total_registered_students=total_students,
        total_placement_officers=total_officers,
        total_companies_registered=total_companies,
        total_drives_posted=total_drives,
        total_applications_submitted=total_applications,
        total_students_placed=total_placed_students,
        overall_placement_rate_pct=overall_placement_rate,
        average_ctc_lpa=avg_ctc,
        highest_ctc_lpa=highest_ctc,
        branch_breakdown=branch_breakdown,
        top_recruiters=top_recruiters
    )


def get_system_health_audit(db: Session) -> SystemHealthResponse:
    """
    Retrieves MySQL database connection status, table record counts, and dynamic audit logs.
    """
    # Count rows across all tables
    counts = {
        "users": db.query(User).count(),
        "student_profiles": db.query(StudentProfile).count(),
        "academic_records": db.query(AcademicRecord).count(),
        "companies": db.query(Company).count(),
        "placement_drives": db.query(PlacementDrive).count(),
        "applications": db.query(Application).count(),
        "drive_schedules": db.query(DriveSchedule).count(),
    }

    # Generate dynamic activity audit trail from recent database actions
    activities: list[SystemActivityLog] = []

    # 1. Recent placed selections
    recent_placed = (
        db.query(Application)
        .options(
            joinedload(Application.drive).joinedload(PlacementDrive.company),
            joinedload(Application.student).joinedload(StudentProfile.user)
        )
        .filter(Application.status == "Selected")
        .order_by(Application.applied_at.desc())
        .limit(3)
        .all()
    )
    for a in recent_placed:
        s_name = a.student.user.full_name if a.student and a.student.user else "Student"
        c_name = a.drive.company.name if a.drive and a.drive.company else "Company"
        pkg = a.offered_ctc_lpa or (a.drive.package_lpa if a.drive else 0)
        activities.append(
            SystemActivityLog(
                id=f"offer-{a.id}",
                timestamp=a.applied_at,
                action_type="Offer Extended",
                description=f"Offer awarded to {s_name} by {c_name} (₹{pkg} LPA).",
                actor="Placement Officer",
                severity="success"
            )
        )

    # 2. Recent schedules
    recent_sched = (
        db.query(DriveSchedule)
        .options(joinedload(DriveSchedule.drive).joinedload(PlacementDrive.company))
        .order_by(DriveSchedule.created_at.desc())
        .limit(3)
        .all()
    )
    for s in recent_sched:
        c_name = s.drive.company.name if s.drive and s.drive.company else "Drive"
        activities.append(
            SystemActivityLog(
                id=f"sched-{s.id}",
                timestamp=s.created_at,
                action_type="Round Scheduled",
                description=f"'{s.round_name}' announced for {c_name} drive on {s.scheduled_at.strftime('%b %d, %Y')}.",
                actor="Placement Officer",
                severity="info"
            )
        )

    # 3. Recent applications
    recent_apps = (
        db.query(Application)
        .options(
            joinedload(Application.drive).joinedload(PlacementDrive.company),
            joinedload(Application.student).joinedload(StudentProfile.user)
        )
        .order_by(Application.applied_at.desc())
        .limit(4)
        .all()
    )
    for a in recent_apps:
        s_name = a.student.user.full_name if a.student and a.student.user else "Candidate"
        c_name = a.drive.company.name if a.drive and a.drive.company else "Company"
        activities.append(
            SystemActivityLog(
                id=f"app-{a.id}",
                timestamp=a.applied_at,
                action_type="Application Submitted",
                description=f"{s_name} applied for {a.drive.job_title if a.drive else 'Drive'} at {c_name}.",
                actor=s_name,
                severity="info"
            )
        )

    # Sort all activities by timestamp descending
    activities.sort(key=lambda x: x.timestamp, reverse=True)

    return SystemHealthResponse(
        status="Operational",
        database_engine="MySQL",
        database_name=settings.DB_NAME,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        connected=True,
        table_counts=counts,
        recent_activities=activities[:10]
    )
