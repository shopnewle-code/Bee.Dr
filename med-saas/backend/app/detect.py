from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ultralytics import YOLO

from .settings import settings


_model: YOLO | None = None
_model_error: str | None = None
_mapping_cache: dict[int, str] | None = None
_label_cache: dict[int, str] | None = None


def load_mapping() -> dict[int, str]:
    global _mapping_cache
    if _mapping_cache is not None:
        return _mapping_cache

    if not settings.mapping_path.exists():
        _mapping_cache = {}
        return _mapping_cache

    raw = json.loads(settings.mapping_path.read_text(encoding="utf-8"))
    _mapping_cache = {int(key): str(value).strip() for key, value in raw.items() if str(value).strip()}
    return _mapping_cache


def load_class_labels() -> dict[int, str]:
    global _label_cache
    if _label_cache is not None:
        return _label_cache

    if settings.labels_path is None or not settings.labels_path.exists():
        _label_cache = {}
        return _label_cache

    labels: dict[int, str] = {}
    for index, line in enumerate(settings.labels_path.read_text(encoding="utf-8").splitlines()):
        value = line.strip()
        if value:
            labels[index] = value

    _label_cache = labels
    return _label_cache


def get_model() -> YOLO:
    global _model
    global _model_error

    if _model is not None:
        return _model

    if not settings.model_path.exists():
        raise FileNotFoundError(f"Model file not found: {settings.model_path}")

    try:
        _model = YOLO(str(settings.model_path))
        _model_error = None
        return _model
    except Exception as exc:  # pragma: no cover - model loading is environment-dependent
        _model_error = str(exc)
        raise


def model_status() -> dict[str, Any]:
    mapping = load_mapping()
    labels = load_class_labels()
    return {
        "model_file_exists": settings.model_path.exists(),
        "model_loaded": _model is not None,
        "mapping_entries": len(mapping),
        "label_entries": len(labels),
        "model_error": _model_error,
        "device": settings.device,
    }


def _mapped_name(class_id: int) -> str | None:
    return load_mapping().get(class_id)


def _label_name(class_id: int) -> str | None:
    return load_class_labels().get(class_id)


def _parse_detection_results(result: Any, min_confidence: float) -> list[dict]:
    detections: list[dict] = []
    boxes = getattr(result, "boxes", None)
    if boxes is None:
        return detections

    for box in boxes:
        class_id = int(box.cls[0].item() if hasattr(box.cls, "__len__") else box.cls)
        confidence = float(box.conf[0].item() if hasattr(box.conf, "__len__") else box.conf)
        if confidence < min_confidence:
            continue

        xyxy = box.xyxy[0].tolist()
        detections.append(
            {
                "class_id": class_id,
                "confidence": round(confidence, 6),
                "label_name": _label_name(class_id),
                "medicine_name": _mapped_name(class_id),
                "source": "detection",
                "bounding_box": {
                    "x1": round(float(xyxy[0]), 2),
                    "y1": round(float(xyxy[1]), 2),
                    "x2": round(float(xyxy[2]), 2),
                    "y2": round(float(xyxy[3]), 2),
                },
            }
        )
    return detections


def _parse_classification_results(result: Any, min_confidence: float) -> list[dict]:
    detections: list[dict] = []
    probs = getattr(result, "probs", None)
    if probs is None:
        return detections

    top_ids = list(getattr(probs, "top5", []))
    top_confs = list(getattr(probs, "top5conf", []))
    if not top_ids:
        top_ids = [int(getattr(probs, "top1", -1))]
        top_confs = [float(getattr(probs, "top1conf", 0))]

    for class_id, conf in zip(top_ids, top_confs):
        confidence = float(conf.item() if hasattr(conf, "item") else conf)
        if int(class_id) < 0 or confidence < min_confidence:
            continue

        detections.append(
            {
                "class_id": int(class_id),
                "confidence": round(confidence, 6),
                "label_name": _label_name(int(class_id)),
                "medicine_name": _mapped_name(int(class_id)),
                "source": "classification",
                "bounding_box": None,
            }
        )
    return detections


def detect_pills(image_path: Path, min_confidence: float | None = None) -> list[dict]:
    model = get_model()
    threshold = settings.min_confidence if min_confidence is None else min_confidence
    results = model.predict(source=str(image_path), device=settings.device, verbose=False)

    detections: list[dict] = []
    for result in results:
        detections.extend(_parse_detection_results(result, threshold))
        if not detections:
            detections.extend(_parse_classification_results(result, threshold))

    detections.sort(key=lambda item: item["confidence"], reverse=True)
    return detections
