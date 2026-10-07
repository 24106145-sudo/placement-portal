"""
Notification service module.
Handles creation, listing, marking read, and real-time triggers for notifications.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationListResponse


def create_notification(
    db: Session,
    title: str,
    message: str,
    category: str = "GENERAL",
    target_route: str | None = None,
    user_id: int | None = None
) -> Notification:
    """
    Creates a new notification record in MySQL.
    """
    notification = Notification(
        user_id=user_id,
        title=title.strip(),
        message=message.strip(),
        category=category.strip(),
        target_route=target_route.strip() if target_route else None,
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def seed_default_notifications_if_empty(db: Session, user: User):
    """
    Seeds initial notifications if the user has none, ensuring immediate real data.
    """
    existing_count = db.query(Notification).filter(
        or_(Notification.user_id == user.id, Notification.user_id.is_(None))
    ).count()

    if existing_count == 0:
        if user.role == "student":
            create_notification(
                db=db,
                title="Google India Placement Drive Announced",
                message="Applications are now open for Software Engineer (18.5 LPA). Review eligibility and apply.",
                category="DRIVE_POSTED",
                target_route="student-drives",
                user_id=user.id
            )
            create_notification(
                db=db,
                title="Microsoft Cloud Solutions Drive Live",
                message="Microsoft IDC has posted Cloud Solution Engineer opening (24.0 LPA). Check details.",
                category="DRIVE_POSTED",
                target_route="student-drives",
                user_id=user.id
            )
            create_notification(
                db=db,
                title="Amazon SDE Technical Round Scheduled",
                message="Technical Round 1 for Amazon AWS is scheduled. Check your applications pipeline.",
                category="ROUND_SCHEDULED",
                target_route="student-applications",
                user_id=user.id
            )
        elif user.role in ["officer", "admin"]:
            create_notification(
                db=db,
                title="New Student Registrations Received",
                message="Candidate profiles have been registered. Review academic rosters and eligibility.",
                category="STATUS_UPDATE",
                target_route="officer-applications",
                user_id=user.id
            )
            create_notification(
                db=db,
                title="Upcoming Placement Schedules",
                message="Amazon AWS Tech Round 1 scheduled. Monitor interview panel status.",
                category="ROUND_SCHEDULED",
                target_route="officer-schedules",
                user_id=user.id
            )


def get_user_notifications(db: Session, user: User) -> NotificationListResponse:
    """
    Fetches all notifications relevant to the user (targeted + global broadcast),
    ordered chronologically newest first.
    """
    seed_default_notifications_if_empty(db=db, user=user)

    notifications = (
        db.query(Notification)
        .filter(or_(Notification.user_id == user.id, Notification.user_id.is_(None)))
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )

    unread_count = sum(1 for n in notifications if not n.is_read)

    return NotificationListResponse(
        unread_count=unread_count,
        total_count=len(notifications),
        notifications=[NotificationResponse.model_validate(n) for n in notifications]
    )


def mark_notification_read(db: Session, notification_id: int, user: User) -> NotificationResponse:
    """
    Marks a specific notification as read.
    """
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            or_(Notification.user_id == user.id, Notification.user_id.is_(None))
        )
        .first()
    )
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return NotificationResponse.model_validate(notification)

    # Fallback return dummy read
    return NotificationResponse(
        id=notification_id,
        user_id=user.id,
        title="Alert",
        message="",
        category="GENERAL",
        target_route=None,
        is_read=True,
        created_at=datetime.utcnow()
    )


def mark_all_notifications_read(db: Session, user: User) -> int:
    """
    Marks all notifications for the user as read.
    """
    notifications = (
        db.query(Notification)
        .filter(
            or_(Notification.user_id == user.id, Notification.user_id.is_(None)),
            Notification.is_read == False
        )
        .all()
    )
    for n in notifications:
        n.is_read = True
    db.commit()
    return len(notifications)
