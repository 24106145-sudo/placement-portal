"""
System Administrator API Router.
Handles User Management, Role Access Control, Institutional Analytics, and System Health.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserUpdate,
    PlacementAnalyticsResponse,
    SystemHealthResponse
)
from app.services.admin_service import (
    list_all_users,
    update_user_role,
    delete_user,
    get_placement_analytics,
    get_system_health_audit
)

router = APIRouter(prefix="/admin", tags=["System Administration & Analytics"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current authenticated user has the Administrator role.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to System Administrators only."
        )
    return current_user


@router.get(
    "/users",
    response_model=list[AdminUserResponse],
    summary="List all registered users with account and profile details"
)
def get_all_users_endpoint(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves all user accounts in the database along with academic metadata.
    """
    return list_all_users(db=db)


@router.put(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Update a user's system role (Student / Placement Officer / Admin)"
)
def update_user_role_endpoint(
    user_id: int,
    user_in: AdminUserUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Promotes or updates a user's role.
    """
    return update_user_role(db=db, user_id=user_id, user_in=user_in, current_admin=current_admin)


@router.delete(
    "/users/{user_id}",
    summary="Delete a user account and associated records"
)
def delete_user_endpoint(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Deletes a user account from MySQL database.
    """
    return delete_user(db=db, user_id=user_id, current_admin=current_admin)


@router.get(
    "/analytics",
    response_model=PlacementAnalyticsResponse,
    summary="Get institutional placement metrics and department breakdown"
)
def get_analytics_endpoint(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns macro-level placement stats, overall placement %, branch-wise breakdowns,
    average CTC, and top recruiting companies.
    """
    return get_placement_analytics(db=db)


@router.get(
    "/system-health",
    response_model=SystemHealthResponse,
    summary="Get database operational health, table counters, and audit trail"
)
def get_system_health_endpoint(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns database connection status, total table row counts, and recent system activity logs.
    """
    return get_system_health_audit(db=db)
