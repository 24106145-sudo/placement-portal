"""
Router for User Notifications API.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read
)

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="Get user notifications and unread alert count"
)
def get_notifications_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns real-time notifications for the authenticated user, sorted newest first.
    """
    return get_user_notifications(db=db, user=current_user)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a specific notification as read"
)
def mark_read_endpoint(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks a single notification as read.
    """
    return mark_notification_read(db=db, notification_id=notification_id, user=current_user)


@router.post(
    "/mark-all-read",
    summary="Mark all notifications as read for current user"
)
def mark_all_read_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks all notifications for the authenticated user as read.
    """
    count = mark_all_notifications_read(db=db, user=current_user)
    return {"message": f"Marked {count} notifications as read", "updated_count": count}
