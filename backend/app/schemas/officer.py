"""
Pydantic schemas for Placement Officer Dashboard metrics.
"""

from typing import List
from pydantic import BaseModel, Field


class OfficerDashboardMetricsResponse(BaseModel):
    total_students: int = Field(..., description="Total count of registered students")
    placed_students: int = Field(..., description="Count of unique students with Selected status")
    placement_rate_pct: float = Field(..., description="Calculated overall placement percentage")
    total_companies: int = Field(..., description="Total count of registered recruiting companies")
    top_company_names: List[str] = Field(default_factory=list, description="Names of active visiting companies")
    total_drives: int = Field(..., description="Total campus placement drives posted")
    active_openings: int = Field(..., description="Total active job drives / openings")
    highest_ctc: float = Field(..., description="Highest CTC in LPA")
    average_ctc: float = Field(..., description="Average CTC in LPA")
