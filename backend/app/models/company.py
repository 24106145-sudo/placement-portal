"""
SQLAlchemy database models for Companies and Placement Drives.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    JSON,
    ForeignKey,
    DateTime,
    func
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class Company(Base):
    """
    Company Model.
    Stores registered recruiting organizations and companies.
    """
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=True)  # e.g., "Software & IT", "Finance", "Automobile"
    website = Column(String(255), nullable=True)
    location = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    drives = relationship(
        "PlacementDrive",
        back_populates="company",
        cascade="all, delete-orphan",
        order_by="desc(PlacementDrive.created_at)"
    )

    def __repr__(self) -> str:
        return f"<Company id={self.id} name='{self.name}'>"


class PlacementDrive(Base):
    """
    Placement Drive Model.
    Represents a campus recruitment drive posted by a Placement Officer with specific eligibility criteria.
    """
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Job & Role Details
    job_title = Column(String(150), nullable=False)
    role_type = Column(String(50), default="Full-time", nullable=False)  # "Full-time", "Internship", "Intern + Full-time"
    package_lpa = Column(Float, nullable=False)  # e.g. 14.5 LPA
    job_location = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False)
    status = Column(String(30), default="active", nullable=False)  # "active", "closed"

    # Eligibility Criteria
    min_cgpa = Column(Float, default=0.0, nullable=False)
    min_tenth_pct = Column(Float, default=0.0, nullable=False)
    min_twelfth_pct = Column(Float, default=0.0, nullable=False)
    max_active_backlogs = Column(Integer, default=0, nullable=False)
    allowed_departments = Column(JSON, default=list, nullable=False)  # List of eligible department names

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationship
    company = relationship("Company", back_populates="drives")

    def __repr__(self) -> str:
        return f"<PlacementDrive id={self.id} title='{self.job_title}' package={self.package_lpa}LPA>"
