from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import cv2
from rapidocr_onnxruntime import RapidOCR

from .settings import settings


_engine: RapidOCR | None = None
_engine_error: str | None = None

TEXT_NORMALIZE_RE = re.compile(r"[^A-Za-z0-9+\-/. ]+")


def get_ocr_engine() -> RapidOCR:
    global _engine
    global _engine_error

    if _engine is not None:
        return _engine

    try:
        _engine = RapidOCR()
        _engine_error = None
        return _engine
    except Exception as exc:  # pragma: no cover - engine load is environment-dependent
        _engine_error = str(exc)
        raise


def ocr_status() -> dict[str, Any]:
    return {
        "ocr_enabled": settings.enable_ocr,
        "ocr_engine_available": _engine is not None or _engine_error is None,
        "ocr_engine_error": _engine_error,
    }


def _safe_confidence(value: Any) -> float:
    try:
        return round(float(value), 6)
    except Exception:
        return 0.0


def _normalize_text(text: str) -> str:
    cleaned = TEXT_NORMALIZE_RE.sub(" ", text.upper())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_ocr_lines(raw_result: list | None, source: str, crop_index: int | None = None) -> list[dict]:
    if not raw_result:
        return []

    candidates: list[dict] = []
    seen: set[str] = set()
    for item in raw_result:
        if not isinstance(item, (list, tuple)) or len(item) < 3:
            continue

        text = _normalize_text(str(item[1]))
        confidence = _safe_confidence(item[2])

        if len(text) < 2 or confidence <= 0:
            continue
        if text in seen:
            continue

        seen.add(text)
        candidates.append(
            {
                "text": text,
                "confidence": confidence,
                "source": source,
                "crop_index": crop_index,
            }
        )
    return candidates


def _ocr_image(image: Any, source: str, crop_index: int | None = None) -> list[dict]:
    engine = get_ocr_engine()
    raw_result, _ = engine(image)
    return _extract_ocr_lines(raw_result, source=source, crop_index=crop_index)


def _crop_image(image: Any, box: dict, padding_ratio: float = 0.2) -> Any | None:
    height, width = image.shape[:2]
    coords = box.get("bounding_box")
    if not coords:
        return None

    x1 = max(0, int(coords["x1"]))
    y1 = max(0, int(coords["y1"]))
    x2 = min(width, int(coords["x2"]))
    y2 = min(height, int(coords["y2"]))

    if x2 <= x1 or y2 <= y1:
        return None

    pad_x = int((x2 - x1) * padding_ratio)
    pad_y = int((y2 - y1) * padding_ratio)
    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(width, x2 + pad_x)
    y2 = min(height, y2 + pad_y)
    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return None
    return crop


def _preprocess_variants(image: Any) -> list[tuple[str, Any]]:
    variants: list[tuple[str, Any]] = [("original", image)]

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variants.append(("gray", gray))

    scaled = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    variants.append(("gray_x3", scaled))

    _, thresholded = cv2.threshold(scaled, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(("gray_x3_otsu", thresholded))
    return variants


def extract_ocr_candidates(image_path: Path, detections: list[dict]) -> list[dict]:
    if not settings.enable_ocr:
        return []

    image = cv2.imread(str(image_path))
    if image is None:
        return []

    candidates: list[dict] = []
    candidates.extend(_ocr_image(image, source="full_image"))

    for index, detection in enumerate(detections[: max(1, settings.ocr_max_crops)]):
        crop = _crop_image(image, detection)
        if crop is None:
            continue

        for variant_name, variant in _preprocess_variants(crop):
            candidates.extend(_ocr_image(variant, source=f"crop_{variant_name}", crop_index=index))

    deduped: dict[str, dict] = {}
    for candidate in candidates:
        key = candidate["text"]
        current = deduped.get(key)
        if current is None or candidate["confidence"] > current["confidence"]:
            deduped[key] = candidate

    return sorted(deduped.values(), key=lambda item: item["confidence"], reverse=True)
