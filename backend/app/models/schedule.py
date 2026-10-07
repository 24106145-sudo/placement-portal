"""
SQLAlchemy database model for Drive Schedules & Interview Rounds.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    func
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class DriveSchedule(Base):
    """
    Drive Schedule / Interview Rounds Table Model.
    Tracks recruitment round dates, venues, meeting links, and instructions per drive.
    """
    __tablename__ = "drive_schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    drive_id = Column(
        Integer,
        ForeignKey("placement_drives.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    round_name = Column(String(150), nullable=False)  # e.g., "Online Aptitude Test", "Technical Interview 1", "HR Round"
    round_type = Column(String(50), default="Technical", nullable=False)  # "Aptitude", "Technical", "HR", "Final Selection"
    scheduled_at = Column(DateTime, nullable=False)
    venue_or_link = Column(String(255), nullable=True)  # e.g., "Google Meet: https://meet.google.com/xyz", "Auditorium - Tech Block 3"
    instructions = Column(Text, nullable=True)  # e.g., "Bring 2 copies of resume, college ID, and laptop."
    is_completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship to PlacementDrive
    drive = relationship("PlacementDrive", backref="schedules")

    def __repr__(self) -> str:
        return f"<DriveSchedule id={self.id} drive_id={self.drive_id} round='{self.round_name}' at='{self.scheduled_at}'>"
