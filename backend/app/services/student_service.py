"""
Student service module.
Handles business logic for student profile management, academic records,
and real-time profile completion calculation.
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.student_profile import StudentProfile, AcademicRecord
from app.schemas.student_profile import (
    StudentProfileUpdate,
    StudentProfileResponse,
    AcademicRecordResponse
)


def calculate_profile_completion(profile: StudentProfile, academic: AcademicRecord | None) -> int:
    """
    Calculates profile completion percentage (0 - 100%) based on key filled fields.
    """
    total_points = 20
    score = 0

    # 1. Personal Details (6 points)
    if profile.full_name and len(profile.full_name.strip()) > 0:
        score += 1
    if profile.dob:
        score += 1
    if profile.gender:
        score += 1
    if profile.phone_number and len(profile.phone_number.strip()) > 0:
        score += 1
    if profile.address and len(profile.address.strip()) > 0:
        score += 1
    if profile.city and len(profile.city.strip()) > 0:
        score += 1

    # 2. Professional & Links (5 points)
    if profile.technical_skills and len(profile.technical_skills) > 0:
        score += 1.5
    if (profile.projects and len(profile.projects) > 0) or (profile.certifications and len(profile.certifications) > 0):
        score += 1
    if profile.resume_link and len(profile.resume_link.strip()) > 0:
        score += 1.5
    if (profile.linkedin_url and len(profile.linkedin_url.strip()) > 0) or (profile.github_url and len(profile.github_url.strip()) > 0):
        score += 1

    # 3. Academic Details (9 points)
    if academic:
        if academic.tenth_school_name and academic.tenth_percentage is not None:
            score += 2
        if academic.twelfth_college_name and academic.twelfth_percentage is not None:
            score += 2
        if academic.college_name and academic.department and academic.degree:
            score += 2
        if academic.cgpa is not None:
            score += 2
        if academic.current_sem is not None:
            score += 1

    percent = int(min(100, (score / total_points) * 100))
    return percent


def get_or_create_student_profile(db: Session, user: User) -> StudentProfileResponse:
    """
    Retrieves the student profile for a given user.
    If none exists, auto-creates a new profile and linked academic record pre-filled with the user's name.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()

    if not profile:
        profile = StudentProfile(
            user_id=user.id,
            full_name=user.full_name,
            technical_skills=[],
            certifications=[],
            projects=[]
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Create linked empty AcademicRecord
        academic = AcademicRecord(
            profile_id=profile.id,
            active_backlogs=0
        )
        db.add(academic)
        db.commit()
        db.refresh(academic)
        db.refresh(profile)

    # Ensure academic record exists
    if not profile.academic_record:
        academic = AcademicRecord(
            profile_id=profile.id,
            active_backlogs=0
        )
        db.add(academic)
        db.commit()
        db.refresh(profile)

    completion = calculate_profile_completion(profile, profile.academic_record)

    academic_resp = None
    if profile.academic_record:
        academic_resp = AcademicRecordResponse.model_validate(profile.academic_record)

    response_data = StudentProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        email=user.email,
        full_name=profile.full_name or user.full_name,
        dob=profile.dob,
        gender=profile.gender,
        phone_number=profile.phone_number,
        address=profile.address,
        city=profile.city,
        technical_skills=profile.technical_skills or [],
        certifications=profile.certifications or [],
        projects=profile.projects or [],
        resume_link=profile.resume_link,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        academic=academic_resp,
        completion_percentage=completion,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )
    return response_data


def update_student_profile(
    db: Session,
    user: User,
    profile_data: StudentProfileUpdate
) -> StudentProfileResponse:
    """
    Updates personal, professional, and academic records for the authenticated student.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Update personal & professional attributes
    update_dict = profile_data.model_dump(exclude_unset=True, exclude={"academic"})
    for key, value in update_dict.items():
        setattr(profile, key, value)

    # Also sync full_name back to user if provided
    if profile_data.full_name and len(profile_data.full_name.strip()) > 0:
        user.full_name = profile_data.full_name.strip()
        db.add(user)

    # Update academic attributes if provided
    if profile_data.academic is not None:
        if not profile.academic_record:
            academic = AcademicRecord(profile_id=profile.id)
            db.add(academic)
            db.commit()
            db.refresh(profile)

        academic_dict = profile_data.academic.model_dump(exclude_unset=True)
        for key, value in academic_dict.items():
            setattr(profile.academic_record, key, value)

    db.commit()
    db.refresh(profile)

    completion = calculate_profile_completion(profile, profile.academic_record)

    academic_resp = None
    if profile.academic_record:
        academic_resp = AcademicRecordResponse.model_validate(profile.academic_record)

    response_data = StudentProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        email=user.email,
        full_name=profile.full_name or user.full_name,
        dob=profile.dob,
        gender=profile.gender,
        phone_number=profile.phone_number,
        address=profile.address,
        city=profile.city,
        technical_skills=profile.technical_skills or [],
        certifications=profile.certifications or [],
        projects=profile.projects or [],
        resume_link=profile.resume_link,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        academic=academic_resp,
        completion_percentage=completion,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )
    return response_data
