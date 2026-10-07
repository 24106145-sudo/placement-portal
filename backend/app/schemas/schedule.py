"""
Pydantic schemas for Drive Schedules, Interview Rounds, and Final Offer recording.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class DriveScheduleBase(BaseModel):
    round_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Name of the interview round or selection phase",
        examples=["Online Technical Assessment", "System Design Interview", "HR Discussion"]
    )
    round_type: str = Field(
        default="Technical",
        description="Type of round: 'Aptitude', 'Technical', 'HR', 'Final Selection'",
        examples=["Technical"]
    )
    scheduled_at: datetime = Field(
        ...,
        description="Date and time when the round will take place",
        examples=["2026-09-15T10:00:00"]
    )
    venue_or_link: str | None = Field(
        None,
        description="Physical location or online meeting URL",
        examples=["Google Meet: https://meet.google.com/abc-defg-hij"]
    )
    instructions: str | None = Field(
        None,
        description="Candidate guidelines or requirements",
        examples=["Bring valid ID, 2 copies of resume, and laptop."]
    )
    is_completed: bool = Field(
        default=False,
        description="Whether this round has finished"
    )


class DriveScheduleCreate(DriveScheduleBase):
    """
    Schema for creating a new recruitment round.
    """
    pass


class DriveScheduleUpdate(BaseModel):
    """
    Schema for updating an existing recruitment round.
    """
    round_name: str | None = None
    round_type: str | None = None
    scheduled_at: datetime | None = None
    venue_or_link: str | None = None
    instructions: str | None = None
    is_completed: bool | None = None


class DriveScheduleResponse(DriveScheduleBase):
    """
    Response schema for scheduled drive rounds.
    """
    id: int
    drive_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OfferRecordRequest(BaseModel):
    """
    Schema for recording final job offer details for placed candidates.
    """
    offered_ctc_lpa: float = Field(
        ...,
        gt=0.0,
        description="Final confirmed offered CTC in LPA (e.g. 14.5)",
        examples=[14.5]
    )
    notes: str | None = Field(
        None,
        description="Offer letter reference or joining instructions",
        examples=["Offer letter released via email. Joining Date: July 2027."]
    )
