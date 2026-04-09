from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = BASE_DIR / "datasets" / "pill-classification"
SUPPORTED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a YOLO classification dataset from the official C3PI archive.")
    parser.add_argument("--source-zip", type=Path, help="Path to sampleData.zip or rximage.zip.")
    parser.add_argument("--dataset-root", type=Path, help="Path to an extracted C3PI directory root.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Where to build the train/val/test folders.")
    parser.add_argument("--max-classes", type=int, default=250, help="Keep the most frequent N pill classes.")
    parser.add_argument("--min-images-per-class", type=int, default=8, help="Only keep classes with at least N supported images.")
    parser.add_argument("--max-images-per-class", type=int, default=120, help="Cap per-class image count for balanced training.")
    return parser.parse_args()


def require_source(args: argparse.Namespace) -> None:
    if bool(args.source_zip) == bool(args.dataset_root):
        raise ValueError("Pass exactly one of --source-zip or --dataset-root.")


def parse_directory_rows(text: str) -> list[dict[str, str]]:
    rows = []
    for line in text.splitlines():
        parts = line.strip().split("|")
        if len(parts) != 5:
            continue
        ndc, part, image_path, image_type, name = parts
        if Path(image_path).suffix.lower() not in SUPPORTED_IMAGE_SUFFIXES:
            continue
        rows.append(
            {
                "ndc": ndc.strip(),
                "part": part.strip(),
                "image_path": image_path.strip().replace("\\", "/"),
                "image_type": image_type.strip(),
                "name": name.strip(),
            }
        )
    return rows


def sanitize_class_name(name: str, ndc: str, part: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    slug = slug[:48] if slug else "pill"
    return f"{slug}--{ndc}-{part}"


def split_name(record: dict[str, str]) -> str:
    bucket = int(hashlib.md5(record["image_path"].encode("utf-8")).hexdigest()[:8], 16) % 100
    if bucket < 12:
        return "test"
    if bucket < 24:
        return "val"
    return "train"


def copy_from_directory(root: Path, relative_path: str, destination: Path) -> None:
    source = root / Path(relative_path)
    if not source.exists():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def copy_from_zip(archive: zipfile.ZipFile, archive_names: list[str], relative_path: str, destination: Path) -> None:
    normalized = relative_path.lower()
    match = None
    for name in archive_names:
        if name.lower().endswith(normalized):
            match = name
            break
    if match is None:
        raise FileNotFoundError(relative_path)

    destination.parent.mkdir(parents=True, exist_ok=True)
    with archive.open(match) as source, destination.open("wb") as output:
        shutil.copyfileobj(source, output)


def load_rows_from_zip(zip_path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(zip_path) as archive:
        member_name = next(
            (name for name in archive.namelist() if name.endswith("directory_consumer_grade_images.txt")),
            None,
        )
        if not member_name:
            raise FileNotFoundError("directory_consumer_grade_images.txt not found inside the ZIP archive.")
        with archive.open(member_name) as handle:
            text = io.TextIOWrapper(handle, encoding="utf-8", errors="ignore").read()
    return parse_directory_rows(text)


def load_rows_from_directory(dataset_root: Path) -> list[dict[str, str]]:
    index_path = dataset_root / "directory_consumer_grade_images.txt"
    if not index_path.exists():
        raise FileNotFoundError(index_path)
    return parse_directory_rows(index_path.read_text(encoding="utf-8", errors="ignore"))


def build_dataset(args: argparse.Namespace) -> None:
    rows = load_rows_from_zip(args.source_zip) if args.source_zip else load_rows_from_directory(args.dataset_root)

    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        key = f"{row['ndc']}|{row['part']}"
        grouped[key].append(row)

    selected_items = sorted(grouped.items(), key=lambda item: len(item[1]), reverse=True)
    selected_items = [item for item in selected_items if len(item[1]) >= args.min_images_per_class][: args.max_classes]

    output_dir = args.output_dir
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    class_map_rows = []
    copied_images = 0

    archive = zipfile.ZipFile(args.source_zip) if args.source_zip else None
    archive_names = archive.namelist() if archive else []
    try:
        for class_id, (key, class_rows) in enumerate(selected_items):
            ndc, part = key.split("|")
            label = sanitize_class_name(class_rows[0]["name"], ndc, part)
            class_rows = sorted(class_rows, key=lambda row: row["image_path"])[: args.max_images_per_class]

            class_map_rows.append(
                {
                    "class_id": class_id,
                    "label": label,
                    "ndc": ndc,
                    "part": part,
                    "display_name": class_rows[0]["name"],
                    "image_count": len(class_rows),
                }
            )

            for record in class_rows:
                split = split_name(record)
                destination = output_dir / split / label / Path(record["image_path"]).name
                if archive:
                    copy_from_zip(archive, archive_names, record["image_path"], destination)
                else:
                    copy_from_directory(args.dataset_root, record["image_path"], destination)
                copied_images += 1
    finally:
        if archive:
            archive.close()

    class_map_path = output_dir / "class_map.csv"
    with class_map_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["class_id", "label", "ndc", "part", "display_name", "image_count"])
        writer.writeheader()
        writer.writerows(class_map_rows)

    summary = {
        "selected_classes": len(class_map_rows),
        "copied_images": copied_images,
        "output_dir": str(output_dir.resolve()),
        "note": "This builder creates a YOLO classification dataset. Full C3PI consumer imagery is extremely large; start with sampleData.zip or a filtered subset.",
    }
    (output_dir / "dataset_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Wrote dataset -> {output_dir}")
    print(f"Classes -> {len(class_map_rows)} | Images -> {copied_images}")


def main() -> None:
    args = parse_args()
    require_source(args)
    build_dataset(args)


if __name__ == "__main__":
    main()
