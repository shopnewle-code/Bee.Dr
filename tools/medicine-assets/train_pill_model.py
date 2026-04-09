from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET_DIR = BASE_DIR / "datasets" / "pill-classification"
DEFAULT_PROJECT_DIR = BASE_DIR / "runs"
DEFAULT_OUTPUT = BASE_DIR / "models" / "best.pt"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a pill recognition model and export best.pt.")
    parser.add_argument("--dataset-dir", type=Path, default=DEFAULT_DATASET_DIR, help="Classification dataset root with train/val/test folders.")
    parser.add_argument("--model", default="yolov8n-cls.pt", help="Ultralytics base checkpoint to fine-tune.")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs.")
    parser.add_argument("--imgsz", type=int, default=224, help="Training image size.")
    parser.add_argument("--batch", type=int, default=64, help="Batch size.")
    parser.add_argument("--workers", type=int, default=4, help="Data loader workers.")
    parser.add_argument("--project-dir", type=Path, default=DEFAULT_PROJECT_DIR, help="Ultralytics run directory.")
    parser.add_argument("--run-name", default="pill-classifier", help="Training run name.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Where to copy the final best.pt.")
    parser.add_argument("--device", default=None, help="Optional CUDA device string, e.g. 0 or cpu.")
    return parser.parse_args()


def validate_dataset(dataset_dir: Path) -> None:
    for split in ("train", "val"):
        if not (dataset_dir / split).exists():
            raise FileNotFoundError(f"Expected split directory missing: {dataset_dir / split}")


def main() -> None:
    args = parse_args()
    validate_dataset(args.dataset_dir)

    model = YOLO(args.model)
    train_kwargs = {
        "data": str(args.dataset_dir),
        "epochs": args.epochs,
        "imgsz": args.imgsz,
        "batch": args.batch,
        "workers": args.workers,
        "project": str(args.project_dir),
        "name": args.run_name,
    }
    if args.device is not None:
        train_kwargs["device"] = args.device

    model.train(**train_kwargs)

    trainer = getattr(model, "trainer", None)
    if trainer is None or getattr(trainer, "save_dir", None) is None:
        raise RuntimeError("Ultralytics training finished but save_dir could not be located.")

    save_dir = Path(trainer.save_dir)
    best_weights = save_dir / "weights" / "best.pt"
    if not best_weights.exists():
        raise FileNotFoundError(f"Training completed but best.pt was not found at {best_weights}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best_weights, args.output)

    print(f"Training run saved to -> {save_dir}")
    print(f"Copied final weights -> {args.output}")


if __name__ == "__main__":
    main()
