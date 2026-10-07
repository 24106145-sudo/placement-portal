"""
SQLAlchemy database models for Student Profiles and Academic Records.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    JSON,
    ForeignKey,
    DateTime,
    func
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class StudentProfile(Base):
    """
    Student Profile Model.
    Stores personal, contact, and professional details linked to a User.
    """
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # Personal & Contact Information
    full_name = Column(String(150), nullable=True)
    dob = Column(String(30), nullable=True)  # YYYY-MM-DD
    gender = Column(String(20), nullable=True)
    phone_number = Column(String(25), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)

    # Professional Details
    technical_skills = Column(JSON, nullable=True, default=list)  # List of skill strings
    certifications = Column(JSON, nullable=True, default=list)  # List of certification strings/dicts
    projects = Column(JSON, nullable=True, default=list)  # List of project objects or strings
    resume_link = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    user = relationship("User", backref="student_profile")
    academic_record = relationship(
        "AcademicRecord",
        back_populates="student_profile",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<StudentProfile id={self.id} user_id={self.user_id}>"


class AcademicRecord(Base):
    """
    Academic Record Model.
    Stores Schooling (10th, 12th/Diploma), College Details, and Semester Breakdown (Sem 1-8 SGPA).
    """
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    profile_id = Column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # 10th Standard Schooling
    tenth_school_name = Column(String(150), nullable=True)
    tenth_board = Column(String(100), nullable=True)
    tenth_year = Column(Integer, nullable=True)
    tenth_percentage = Column(Float, nullable=True)

    # 12th Standard / Diploma Schooling
    twelfth_college_name = Column(String(150), nullable=True)
    twelfth_board = Column(String(100), nullable=True)
    twelfth_year = Column(Integer, nullable=True)
    twelfth_percentage = Column(Float, nullable=True)
    is_diploma = Column(Boolean, default=False, nullable=False)

    # College Details
    college_name = Column(String(200), nullable=True)
    university = Column(String(200), nullable=True)
    degree = Column(String(100), nullable=True)  # e.g., B.Tech, B.E., MCA, B.Sc
    department = Column(String(100), nullable=True)  # e.g., Computer Science, Mechanical
    current_year = Column(Integer, nullable=True)  # 1, 2, 3, 4
    current_sem = Column(Integer, nullable=True)  # 1 to 8
    roll_no = Column(String(50), nullable=True)
    cgpa = Column(Float, nullable=True)
    active_backlogs = Column(Integer, default=0, nullable=False)

    # Semester Breakdown (SGPA Sem 1 to 8)
    sgpa_sem1 = Column(Float, nullable=True)
    sgpa_sem2 = Column(Float, nullable=True)
    sgpa_sem3 = Column(Float, nullable=True)
    sgpa_sem4 = Column(Float, nullable=True)
    sgpa_sem5 = Column(Float, nullable=True)
    sgpa_sem6 = Column(Float, nullable=True)
    sgpa_sem7 = Column(Float, nullable=True)
    sgpa_sem8 = Column(Float, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship back to StudentProfile
    student_profile = relationship("StudentProfile", back_populates="academic_record")

    def __repr__(self) -> str:
        return f"<AcademicRecord id={self.id} profile_id={self.profile_id} cgpa={self.cgpa}>"
