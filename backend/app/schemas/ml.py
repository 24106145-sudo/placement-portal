"""
Pydantic schemas for AIML Placement Probability Prediction and What-If Simulator.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


class PrescriptiveAction(BaseModel):
    """
    Specific high-impact suggestion with expected statistical placement probability gain.
    """
    title: str
    description: str
    probability_gain_pct: float
    simulated_probability: float
    impact_tier: str  # "High", "Medium", "Moderate"
    category: str  # "Academics", "Backlogs", "Skills", "Projects", "Certifications"


class WhatIfScenario(BaseModel):
    """
    A pre-calculated what-if improvement scenario.
    """
    id: str
    title: str
    description: str
    simulated_probability: float
    delta_pct: float
    modifications: dict[str, Any]


class WhatIfCustomRequest(BaseModel):
    """
    Custom dynamic what-if simulation request payload from frontend sliders.
    """
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    active_backlogs: Optional[int] = Field(None, ge=0, le=10)
    skills_count: Optional[int] = Field(None, ge=0, le=25)
    projects_count: Optional[int] = Field(None, ge=0, le=15)
    certifications_count: Optional[int] = Field(None, ge=0, le=10)
    tenth_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    twelfth_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)


class WhatIfCustomResponse(BaseModel):
    """
    Result of a custom what-if simulation.
    """
    simulated_probability: float
    delta_pct: float
    simulated_readiness_tier: str
    simulated_readiness_color: str
    parameters_evaluated: dict[str, Any]


class FeatureSummary(BaseModel):
    """
    Feature snapshot of the evaluated student profile.
    """
    tenth_percentage: float
    twelfth_percentage: float
    cgpa: float
    active_backlogs: int
    sem7_sgpa: float
    sem6_sgpa: float
    skills_count: int
    projects_count: int
    certifications_count: int
    technical_skills: list[str] = Field(default_factory=list)
    project_names: list[str] = Field(default_factory=list)
    certification_names: list[str] = Field(default_factory=list)


class PlacementPredictionResponse(BaseModel):
    """
    Complete placement probability prediction and prescriptive what-if dashboard.
    """
    base_probability: float  # e.g. 74.5%
    readiness_tier: str  # "High Placement Readiness", "Competitive", "Needs Immediate Attention"
    readiness_color: str  # "emerald", "indigo", "amber", "rose"
    readiness_summary: str
    has_academic_profile: bool
    features: FeatureSummary
    prescriptive_actions: list[PrescriptiveAction]
    what_if_scenarios: list[WhatIfScenario]
    model_metrics: dict[str, Any]
