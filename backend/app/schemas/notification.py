"""
Pydantic schemas for Notifications.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    category: str
    target_route: Optional[str] = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    unread_count: int
    total_count: int
    notifications: list[NotificationResponse]
