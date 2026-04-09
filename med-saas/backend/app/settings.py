from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


def _path_from_env(name: str, default: str) -> Path:
    return Path(os.getenv(name, default))


def _optional_path_from_env(name: str) -> Path | None:
    value = os.getenv(name, "").strip()
    return Path(value) if value else None


def _resolve_model_path(data_root: Path | None) -> Path:
    explicit = _path_from_env("MEDICINE_API_MODEL_PATH", "model/pills-832-260219.pt")
    resolved = explicit if explicit.is_absolute() else BACKEND_DIR / explicit
    if resolved.exists():
        return resolved
    if data_root:
        candidate = data_root / "pills-832-260219.pt"
        if candidate.exists():
            return candidate
    return resolved


def _resolve_mapping_path(data_root: Path | None) -> Path:
    explicit = _path_from_env("MEDICINE_API_MAPPING_PATH", "model/pill_mapping.json")
    resolved = explicit if explicit.is_absolute() else BACKEND_DIR / explicit
    if resolved.exists():
        return resolved
    if data_root:
        candidate = data_root / "pill_mapping.json"
        if candidate.exists():
            return candidate
    return resolved


def _resolve_data_root() -> Path | None:
    root = _optional_path_from_env("MEDICINE_API_DATA_ROOT")
    return root.resolve() if root else None


def _resolve_labels_path(data_root: Path | None) -> Path | None:
    explicit = _optional_path_from_env("MEDICINE_API_LABELS_PATH")
    if explicit:
        return explicit.resolve()
    if data_root:
        candidate = data_root / "aiScope-labels.txt"
        if candidate.exists():
            return candidate
    return None


@dataclass(frozen=True)
class Settings:
    db_name: str = os.getenv("MEDICINE_API_DB_NAME", "med_saas")
    db_user: str = os.getenv("MEDICINE_API_DB_USER", "postgres")
    db_password: str = os.getenv("MEDICINE_API_DB_PASSWORD", "")
    db_host: str = os.getenv("MEDICINE_API_DB_HOST", "localhost")
    db_port: str = os.getenv("MEDICINE_API_DB_PORT", "5432")
    data_root: Path | None = _resolve_data_root()
    model_path: Path = _resolve_model_path(_resolve_data_root())
    mapping_path: Path = _resolve_mapping_path(_resolve_data_root())
    labels_path: Path | None = _resolve_labels_path(_resolve_data_root())
    temp_dir: Path = BACKEND_DIR / os.getenv("MEDICINE_API_TEMP_DIR", "temp")
    device: str = os.getenv("MEDICINE_API_DEVICE", "cpu")
    min_confidence: float = float(os.getenv("MEDICINE_API_MIN_CONFIDENCE", "0.35"))
    enable_ocr: bool = os.getenv("MEDICINE_API_ENABLE_OCR", "true").strip().lower() in {"1", "true", "yes", "on"}
    ocr_max_crops: int = int(os.getenv("MEDICINE_API_OCR_MAX_CROPS", "6"))
    ocr_min_match_score: float = float(os.getenv("MEDICINE_API_OCR_MIN_MATCH_SCORE", "140"))


settings = Settings()
