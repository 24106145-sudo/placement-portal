"""
Schemas package for Pydantic request and response models.
"""

from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    UserRole
)
from app.schemas.student_profile import (
    AcademicRecordBase,
    AcademicRecordUpdate,
    AcademicRecordResponse,
    StudentProfileUpdate,
    StudentProfileResponse
)
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    PlacementDriveCreate,
    PlacementDriveResponse,
    StudentPlacementDriveResponse
)
from app.schemas.application import (
    ApplicationStatusUpdate,
    StudentApplicationResponse,
    OfficerApplicationResponse
)
from app.schemas.schedule import (
    DriveScheduleCreate,
    DriveScheduleUpdate,
    DriveScheduleResponse,
    OfferRecordRequest
)
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserUpdate,
    BranchPlacementMetric,
    TopRecruiterMetric,
    PlacementAnalyticsResponse,
    SystemActivityLog,
    SystemHealthResponse
)
from app.schemas.ml import (
    PrescriptiveAction,
    WhatIfScenario,
    WhatIfCustomRequest,
    WhatIfCustomResponse,
    FeatureSummary,
    PlacementPredictionResponse
)

__all__ = [
    "UserRegisterRequest",
    "UserLoginRequest",
    "UserResponse",
    "TokenResponse",
    "UserRole",
    "AcademicRecordBase",
    "AcademicRecordUpdate",
    "AcademicRecordResponse",
    "StudentProfileUpdate",
    "StudentProfileResponse",
    "CompanyCreate",
    "CompanyResponse",
    "PlacementDriveCreate",
    "PlacementDriveResponse",
    "StudentPlacementDriveResponse",
    "ApplicationStatusUpdate",
    "StudentApplicationResponse",
    "OfficerApplicationResponse",
    "DriveScheduleCreate",
    "DriveScheduleUpdate",
    "DriveScheduleResponse",
    "OfferRecordRequest",
    "AdminUserResponse",
    "AdminUserUpdate",
    "BranchPlacementMetric",
    "TopRecruiterMetric",
    "PlacementAnalyticsResponse",
    "SystemActivityLog",
    "SystemHealthResponse",
    "PrescriptiveAction",
    "WhatIfScenario",
    "WhatIfCustomRequest",
    "WhatIfCustomResponse",
    "FeatureSummary",
    "PlacementPredictionResponse"
]
