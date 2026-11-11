from typing import Any

from pydantic import BaseModel


class BatchCreate(BaseModel):
    name: str | None = None
    commodity: str


class BatchResponse(BaseModel):
    batch_id: str
    name: str
    commodity: str
    created_at: str
    sample_count: int = 0
    average_score: float | None = None


class InspectionResponse(BaseModel):
    inspection_id: str
    timestamp: str
    batch_id: str | None = None
    batch_name: str | None = None
    commodity: str
    cielab_features: dict[str, float]
    glcm_features: dict[str, float]
    biomarkers: dict[str, Any]
    scores: dict[str, float]
    classification: str
    status_label: str
    shelf_life: dict[str, str]
    triggered_rules: list[str]
    recommendation: str
