"""
Drive service module.
Handles business logic for Companies, Placement Drives, and automated Student Eligibility evaluation.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.company import Company, PlacementDrive
from app.models.user import User
from app.models.student_profile import StudentProfile, AcademicRecord
from app.models.application import Application
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    PlacementDriveCreate,
    PlacementDriveResponse,
    StudentPlacementDriveResponse
)


def create_company(db: Session, company_in: CompanyCreate) -> Company:
    """
    Registers a new recruiting company.
    """
    existing = db.query(Company).filter(Company.name == company_in.name.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Company with the name '{company_in.name}' is already registered."
        )

    company = Company(
        name=company_in.name.strip(),
        industry=company_in.industry.strip() if company_in.industry else None,
        website=company_in.website.strip() if company_in.website else None,
        location=company_in.location.strip() if company_in.location else None,
        description=company_in.description.strip() if company_in.description else None,
        contact_email=company_in.contact_email.strip() if company_in.contact_email else None
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def list_companies(db: Session) -> list[CompanyResponse]:
    """
    Lists all registered companies.
    """
    companies = db.query(Company).order_by(Company.name.asc()).all()
    return [CompanyResponse.model_validate(c) for c in companies]


def create_placement_drive(db: Session, drive_in: PlacementDriveCreate) -> PlacementDriveResponse:
    """
    Creates a new campus recruitment drive with eligibility cutoffs.
    """
    company = db.query(Company).filter(Company.id == drive_in.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with ID {drive_in.company_id} not found."
        )

    drive = PlacementDrive(
        company_id=drive_in.company_id,
        job_title=drive_in.job_title.strip(),
        role_type=drive_in.role_type.strip(),
        package_lpa=drive_in.package_lpa,
        job_location=drive_in.job_location.strip() if drive_in.job_location else None,
        description=drive_in.description.strip() if drive_in.description else None,
        deadline=drive_in.deadline,
        status="active",
        min_cgpa=drive_in.min_cgpa,
        min_tenth_pct=drive_in.min_tenth_pct,
        min_twelfth_pct=drive_in.min_twelfth_pct,
        max_active_backlogs=drive_in.max_active_backlogs,
        allowed_departments=drive_in.allowed_departments or []
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)

    # Trigger student broadcast notification
    try:
        from app.services.notification_service import create_notification
        create_notification(
            db=db,
            title=f"New Drive: {company.name} - {drive.job_title}",
            message=f"Applications are now open for {drive.role_type} ({drive.package_lpa} LPA). Review eligibility and apply.",
            category="DRIVE_POSTED",
            target_route="student-drives",
            user_id=None
        )
    except Exception:
        pass

    return PlacementDriveResponse.model_validate(drive)


def list_officer_drives(db: Session) -> list[PlacementDriveResponse]:
    """
    Lists all recruitment drives for Placement Officers.
    """
    drives = (
        db.query(PlacementDrive)
        .options(joinedload(PlacementDrive.company))
        .order_by(PlacementDrive.created_at.desc())
        .all()
    )
    return [PlacementDriveResponse.model_validate(d) for d in drives]


def evaluate_student_eligibility(
    drive: PlacementDrive,
    academic: AcademicRecord | None
) -> tuple[bool, list[str], list[str]]:
    """
    Evaluates whether a student meets the drive's cutoff criteria:
    - CGPA Cutoff
    - 10th Percentage Cutoff
    - 12th / Diploma Percentage Cutoff
    - Max Active Backlogs Limit
    - Department / Branch Eligibility
    Returns: (is_eligible, failed_reasons, matched_criteria)
    """
    failed_reasons: list[str] = []
    matched_criteria: list[str] = []

    if not academic:
        return False, ["Please complete your Academic History in 'My Profile' to evaluate eligibility."], []

    # 1. CGPA Cutoff
    if drive.min_cgpa > 0.0:
        if academic.cgpa is None:
            failed_reasons.append(f"Requires min CGPA {drive.min_cgpa:.2f} (CGPA not filled in profile)")
        elif academic.cgpa < drive.min_cgpa:
            failed_reasons.append(f"Requires min CGPA {drive.min_cgpa:.2f} (Your CGPA: {academic.cgpa:.2f})")
        else:
            matched_criteria.append(f"CGPA {academic.cgpa:.2f} meets requirement (min {drive.min_cgpa:.2f})")

    # 2. 10th Standard Cutoff
    if drive.min_tenth_pct > 0.0:
        if academic.tenth_percentage is None:
            failed_reasons.append(f"Requires min 10th mark {drive.min_tenth_pct:.1f}% (Not provided in profile)")
        elif academic.tenth_percentage < drive.min_tenth_pct:
            failed_reasons.append(f"Requires min 10th mark {drive.min_tenth_pct:.1f}% (Your 10th: {academic.tenth_percentage:.1f}%)")
        else:
            matched_criteria.append(f"10th percentage {academic.tenth_percentage:.1f}% meets requirement ({drive.min_tenth_pct:.1f}%+)")

    # 3. 12th / Diploma Cutoff
    if drive.min_twelfth_pct > 0.0:
        if academic.twelfth_percentage is None:
            failed_reasons.append(f"Requires min 12th/Diploma mark {drive.min_twelfth_pct:.1f}% (Not provided in profile)")
        elif academic.twelfth_percentage < drive.min_twelfth_pct:
            failed_reasons.append(f"Requires min 12th/Diploma mark {drive.min_twelfth_pct:.1f}% (Your 12th: {academic.twelfth_percentage:.1f}%)")
        else:
            matched_criteria.append(f"12th/Diploma percentage {academic.twelfth_percentage:.1f}% meets requirement ({drive.min_twelfth_pct:.1f}%+)")

    # 4. Active Backlogs Limit
    student_backlogs = academic.active_backlogs if academic.active_backlogs is not None else 0
    if student_backlogs > drive.max_active_backlogs:
        failed_reasons.append(f"Max allowed active backlogs: {drive.max_active_backlogs} (You have: {student_backlogs})")
    else:
        matched_criteria.append(f"Active backlogs ({student_backlogs}) within limit (max {drive.max_active_backlogs})")

    # 5. Department / Branch Eligibility
    if drive.allowed_departments and len(drive.allowed_departments) > 0:
        if not academic.department or not academic.department.strip():
            failed_reasons.append("Department not specified in your profile")
        else:
            student_dept = academic.department.strip().lower()
            allowed_depts_lower = [d.strip().lower() for d in drive.allowed_departments]
            is_branch_allowed = (
                student_dept in allowed_depts_lower or
                any(allowed in student_dept or student_dept in allowed for allowed in allowed_depts_lower)
            )
            if not is_branch_allowed:
                allowed_str = ", ".join(drive.allowed_departments)
                failed_reasons.append(f"Eligible branches: {allowed_str} (Your branch: {academic.department})")
            else:
                matched_criteria.append(f"Branch '{academic.department}' is eligible")

    is_eligible = len(failed_reasons) == 0
    return is_eligible, failed_reasons, matched_criteria


def list_student_drives(db: Session, student_user: User) -> list[StudentPlacementDriveResponse]:
    """
    Lists all active recruitment drives for a student, enriched with automated eligibility calculation
    and existing application status.
    """
    # Fetch student's profile & academic record
    profile = (
        db.query(StudentProfile)
        .options(joinedload(StudentProfile.academic_record))
        .filter(StudentProfile.user_id == student_user.id)
        .first()
    )
    academic = profile.academic_record if profile else None

    # Fetch applications map for this student (drive_id -> Application)
    existing_apps = {}
    if profile:
        apps = db.query(Application).filter(Application.student_id == profile.id).all()
        for a in apps:
            existing_apps[a.drive_id] = a

    # Fetch all active drives
    drives = (
        db.query(PlacementDrive)
        .options(joinedload(PlacementDrive.company))
        .order_by(PlacementDrive.created_at.desc())
        .all()
    )

    results: list[StudentPlacementDriveResponse] = []
    for d in drives:
        is_eligible, failed_reasons, matched_criteria = evaluate_student_eligibility(d, academic)
        app_record = existing_apps.get(d.id)
        has_applied = app_record is not None
        application_status = app_record.status if app_record else None

        drive_resp = StudentPlacementDriveResponse(
            id=d.id,
            company_id=d.company_id,
            job_title=d.job_title,
            role_type=d.role_type,
            package_lpa=d.package_lpa,
            job_location=d.job_location,
            description=d.description,
            deadline=d.deadline,
            status=d.status,
            min_cgpa=d.min_cgpa,
            min_tenth_pct=d.min_tenth_pct,
            min_twelfth_pct=d.min_twelfth_pct,
            max_active_backlogs=d.max_active_backlogs,
            allowed_departments=d.allowed_departments or [],
            created_at=d.created_at,
            company=CompanyResponse.model_validate(d.company),
            is_eligible=is_eligible,
            eligibility_reasons=failed_reasons,
            matched_criteria=matched_criteria,
            has_applied=has_applied,
            application_status=application_status
        )
        results.append(drive_resp)

    return results


def get_officer_dashboard_metrics(db: Session):
    """
    Computes real-time live placement metrics from MySQL database tables.
    """
    from app.models.user import UserRole
    from app.schemas.officer import OfficerDashboardMetricsResponse

    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    if total_students == 0:
        total_students = db.query(StudentProfile).count()

    placed_apps = db.query(Application.student_id).filter(Application.status == "Selected").all()
    placed_student_ids = {a[0] for a in placed_apps}
    placed_students = len(placed_student_ids)

    placement_rate_pct = (
        round((placed_students / total_students) * 100.0, 1)
        if total_students > 0 else 0.0
    )

    total_companies = db.query(Company).count()
    top_comps = db.query(Company.name).order_by(Company.created_at.desc()).limit(4).all()
    top_company_names = [c[0] for c in top_comps]

    total_drives = db.query(PlacementDrive).count()
    active_drives_count = db.query(PlacementDrive).filter(PlacementDrive.status == "active").count()
    active_openings = active_drives_count if active_drives_count > 0 else total_drives

    drive_pkgs = [d[0] for d in db.query(PlacementDrive.package_lpa).filter(PlacementDrive.package_lpa > 0).all() if d[0] is not None]
    offer_pkgs = [o[0] for o in db.query(Application.offered_ctc_lpa).filter(Application.offered_ctc_lpa > 0).all() if o[0] is not None]

    all_packages = offer_pkgs if offer_pkgs else drive_pkgs
    if not all_packages:
        all_packages = drive_pkgs

    highest_ctc = round(max(all_packages), 1) if all_packages else 0.0
    average_ctc = round(sum(all_packages) / len(all_packages), 1) if all_packages else 0.0

    return OfficerDashboardMetricsResponse(
        total_students=total_students,
        placed_students=placed_students,
        placement_rate_pct=placement_rate_pct,
        total_companies=total_companies,
        top_company_names=top_company_names,
        total_drives=total_drives,
        active_openings=active_openings,
        highest_ctc=highest_ctc,
        average_ctc=average_ctc
    )
