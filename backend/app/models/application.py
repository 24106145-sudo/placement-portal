"""
SQLAlchemy database model for Student Job Applications.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class Application(Base):
    """
    Application Table Model.
    Tracks a student's submission to a specific campus placement drive.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    drive_id = Column(
        Integer,
        ForeignKey("placement_drives.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    student_id = Column(
        Integer,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    applied_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    status = Column(
        String(50),
        default="Applied",
        nullable=False
    )  # 'Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'
    notes = Column(Text, nullable=True)
    offered_ctc_lpa = Column(Float, nullable=True)  # Populated when status is 'Selected' (e.g. 14.5 LPA)

    # Prevent a student from applying multiple times to the exact same drive
    __table_args__ = (
        UniqueConstraint("drive_id", "student_id", name="uq_drive_student_application"),
    )

    # Relationships
    drive = relationship("PlacementDrive", backref="applications")
    student = relationship("StudentProfile", backref="applications")

    def __repr__(self) -> str:
        return f"<Application id={self.id} drive_id={self.drive_id} student_id={self.student_id} status='{self.status}'>"
