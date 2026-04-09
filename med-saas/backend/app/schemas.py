from __future__ import annotations

from pydantic import BaseModel, Field


class DetectionBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResult(BaseModel):
    class_id: int
    confidence: float
    label_name: str | None = None
    medicine_name: str | None = None
    source: str
    bounding_box: DetectionBox | None = None


class OcrCandidate(BaseModel):
    text: str
    confidence: float
    source: str
    crop_index: int | None = None
    matched_query: str | None = None
    matched_medicine_name: str | None = None
    match_score: float | None = None


class InteractionInfo(BaseModel):
    interacting_drug: str | None = None
    description: str
    severity: str


class MedicineDetails(BaseModel):
    id: int
    name: str
    generic_name: str | None = None
    manufacturer: str | None = None
    product_type: str | None = None
    route: str | None = None
    indications: str | None = None
    dosage: str | None = None
    description: str | None = None
    warnings: str | None = None
    contraindications: str | None = None
    side_effect_count: int = 0
    side_effects: list[str] = Field(default_factory=list)
    interaction_count: int = 0
    interactions: list[InteractionInfo] = Field(default_factory=list)
    match_strategy: str | None = None
    match_score: float | None = None


class LookupRequest(BaseModel):
    medicine_name: str = Field(min_length=2, max_length=120)


class LookupResponse(BaseModel):
    query: str
    medicine: MedicineDetails | None = None


class AnalyzeResponse(BaseModel):
    resolved_medicine_name: str | None = None
    resolution_source: str
    detections: list[DetectionResult] = Field(default_factory=list)
    ocr_candidates: list[OcrCandidate] = Field(default_factory=list)
    medicine: MedicineDetails | None = None
    warnings: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    medicine_count: int
    model_file_exists: bool
    model_loaded: bool
    mapping_entries: int
    label_entries: int = 0
    ocr_enabled: bool = False
    ocr_engine_available: bool = False
    device: str
