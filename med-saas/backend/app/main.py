from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .db import database_health, lookup_medicine, lookup_medicine_from_ocr
from .detect import detect_pills, model_status
from .ocr import extract_ocr_candidates, ocr_status
from .schemas import AnalyzeResponse, DetectionResult, HealthResponse, LookupRequest, LookupResponse, MedicineDetails, OcrCandidate
from .settings import settings


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}

app = FastAPI(
    title="med-saas Pill Intelligence API",
    version="1.0.0",
    summary="Image-to-pill detection and medicine intelligence backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_temp_dir() -> None:
    settings.temp_dir.mkdir(parents=True, exist_ok=True)


def save_upload(upload: UploadFile) -> Path:
    ensure_temp_dir()
    suffix = Path(upload.filename or "upload.jpg").suffix or ".jpg"
    target = settings.temp_dir / f"{uuid4().hex}{suffix}"
    with target.open("wb") as handle:
        shutil.copyfileobj(upload.file, handle)
    return target


def validate_upload(upload: UploadFile) -> None:
    content_type = (upload.content_type or "").lower()
    suffix = Path(upload.filename or "").suffix.lower()

    if content_type in ALLOWED_IMAGE_TYPES:
        return

    if content_type in {"", "application/octet-stream"} and suffix in ALLOWED_IMAGE_SUFFIXES:
        return

    raise HTTPException(status_code=415, detail=f"Unsupported content type: {upload.content_type}")


def pick_resolved_name(detections: list[dict], medicine_hint: str | None, warnings: list[str]) -> tuple[str | None, str]:
    for detection in detections:
        medicine_name = detection.get("medicine_name")
        if medicine_name:
            return str(medicine_name), "model"

    if detections and medicine_hint:
        warnings.append("Model returned classes but mapping file did not contain a usable medicine name. Falling back to medicine_hint.")
        return medicine_hint.strip(), "hint"

    if medicine_hint:
        warnings.append("Model path not used or no valid detection found. Falling back to medicine_hint.")
        return medicine_hint.strip(), "hint"

    if detections:
        warnings.append("Detections were found, but class-to-medicine mapping is incomplete.")

    return None, "unresolved"


def to_detection_models(detections: list[dict]) -> list[DetectionResult]:
    return [DetectionResult.model_validate(item) for item in detections]


def to_ocr_models(candidates: list[dict]) -> list[OcrCandidate]:
    return [OcrCandidate.model_validate(item) for item in candidates]


@app.on_event("startup")
def startup() -> None:
    ensure_temp_dir()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    db_info = database_health()
    model_info = model_status()
    ocr_info = ocr_status()
    return HealthResponse(
        status="ok",
        database_connected=db_info["database_connected"],
        medicine_count=db_info["medicine_count"],
        model_file_exists=bool(model_info["model_file_exists"]),
        model_loaded=bool(model_info["model_loaded"]),
        mapping_entries=int(model_info["mapping_entries"]),
        label_entries=int(model_info.get("label_entries", 0)),
        ocr_enabled=bool(ocr_info["ocr_enabled"]),
        ocr_engine_available=bool(ocr_info["ocr_engine_available"]),
        device=str(model_info["device"]),
    )


@app.post("/api/v1/pills/lookup", response_model=LookupResponse)
def pill_lookup(payload: LookupRequest) -> LookupResponse:
    medicine = lookup_medicine(payload.medicine_name)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found in PostgreSQL.")
    return LookupResponse(query=payload.medicine_name, medicine=MedicineDetails.model_validate(medicine))


@app.post("/api/v1/pills/detect", response_model=list[DetectionResult])
async def detect_only(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(settings.min_confidence),
) -> list[DetectionResult]:
    validate_upload(file)
    temp_path = save_upload(file)
    try:
        detections = detect_pills(temp_path, confidence_threshold)
        return to_detection_models(detections)
    finally:
        temp_path.unlink(missing_ok=True)


@app.post("/api/v1/pills/ocr", response_model=list[OcrCandidate])
async def ocr_only(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(settings.min_confidence),
) -> list[OcrCandidate]:
    validate_upload(file)
    temp_path = save_upload(file)
    try:
        detections = detect_pills(temp_path, confidence_threshold) if settings.model_path.exists() else []
        candidates = extract_ocr_candidates(temp_path, detections)
        return to_ocr_models(candidates)
    finally:
        temp_path.unlink(missing_ok=True)


@app.post("/api/v1/pills/analyze", response_model=AnalyzeResponse)
async def analyze_pill(
    file: UploadFile = File(...),
    medicine_hint: str | None = Form(None),
    confidence_threshold: float = Form(settings.min_confidence),
) -> AnalyzeResponse:
    validate_upload(file)
    warnings: list[str] = []
    detections: list[dict] = []
    ocr_candidates: list[dict] = []
    temp_path = save_upload(file)

    try:
        try:
            detections = detect_pills(temp_path, confidence_threshold)
        except FileNotFoundError:
            warnings.append(f"YOLO model file not found at {settings.model_path}.")
        except Exception as exc:  # pragma: no cover - model inference is environment-dependent
            warnings.append(f"Model inference failed: {exc}")

        resolved_name, resolution_source = pick_resolved_name(detections, None, warnings)
        if detections and not any(item.get("medicine_name") for item in detections):
            warnings.append("The current YOLO model detects pill objects, but medicine-specific class mapping is not configured yet.")

        medicine = lookup_medicine(resolved_name) if resolved_name else None

        if not medicine and settings.enable_ocr:
            try:
                ocr_candidates = extract_ocr_candidates(temp_path, detections)
            except Exception as exc:  # pragma: no cover - OCR runtime is environment-dependent
                warnings.append(f"OCR failed: {exc}")
                ocr_candidates = []

            ocr_match, best_ocr_hit = lookup_medicine_from_ocr(ocr_candidates) if ocr_candidates else (None, None)
            if ocr_match and best_ocr_hit:
                medicine = ocr_match
                resolved_name = str(ocr_match["name"])
                resolution_source = "ocr_db_match"

                for candidate in ocr_candidates:
                    if candidate["text"] == best_ocr_hit["ocr_text"]:
                        candidate["matched_query"] = best_ocr_hit["query"]
                        candidate["matched_medicine_name"] = ocr_match["name"]
                        candidate["match_score"] = round(float(best_ocr_hit["match"]["match_score"]), 4)
                        break

        if not medicine and medicine_hint:
            warnings.append("Falling back to medicine_hint after model/OCR resolution did not find a database-backed medicine.")
            resolved_name = medicine_hint.strip()
            resolution_source = "hint"
            medicine = lookup_medicine(resolved_name)

        if resolved_name and not medicine:
            warnings.append(f"No medicine details found in PostgreSQL for '{resolved_name}'.")

        return AnalyzeResponse(
            resolved_medicine_name=resolved_name,
            resolution_source=resolution_source,
            detections=to_detection_models(detections),
            ocr_candidates=to_ocr_models(ocr_candidates),
            medicine=MedicineDetails.model_validate(medicine) if medicine else None,
            warnings=warnings,
        )
    finally:
        temp_path.unlink(missing_ok=True)
