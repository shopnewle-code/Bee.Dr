from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from typing import Iterator

import ijson
import psycopg2
from psycopg2.extras import Json, execute_batch


BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "sql" / "openfda_postgres_schema.sql"
DEFAULT_DATA_DIR = Path(r"C:\Users\arceu\OneDrive\Desktop\medical_Data\medicines")
DEFAULT_PATTERN = "drug-label-*.json"

MEDICINE_UPSERT_SQL = """
INSERT INTO medicines (
    set_id,
    label_id,
    name,
    generic_name,
    manufacturer,
    product_ndc,
    package_ndc,
    rxcui,
    product_type,
    route,
    indications,
    dosage,
    description,
    warnings,
    contraindications,
    raw_payload,
    updated_at
)
VALUES (
    %(set_id)s,
    %(label_id)s,
    %(name)s,
    %(generic_name)s,
    %(manufacturer)s,
    %(product_ndc)s,
    %(package_ndc)s,
    %(rxcui)s,
    %(product_type)s,
    %(route)s,
    %(indications)s,
    %(dosage)s,
    %(description)s,
    %(warnings)s,
    %(contraindications)s,
    %(raw_payload)s,
    now()
)
ON CONFLICT (set_id) DO UPDATE SET
    label_id = EXCLUDED.label_id,
    name = EXCLUDED.name,
    generic_name = EXCLUDED.generic_name,
    manufacturer = EXCLUDED.manufacturer,
    product_ndc = EXCLUDED.product_ndc,
    package_ndc = EXCLUDED.package_ndc,
    rxcui = EXCLUDED.rxcui,
    product_type = EXCLUDED.product_type,
    route = EXCLUDED.route,
    indications = EXCLUDED.indications,
    dosage = EXCLUDED.dosage,
    description = EXCLUDED.description,
    warnings = EXCLUDED.warnings,
    contraindications = EXCLUDED.contraindications,
    raw_payload = EXCLUDED.raw_payload,
    updated_at = now()
RETURNING id
"""

SIDE_EFFECT_SQL = """
INSERT INTO side_effects (drug_id, effect)
VALUES (%s, %s)
ON CONFLICT (drug_id, effect) DO NOTHING
"""

INTERACTION_SQL = """
INSERT INTO interactions (drug_id, interacting_drug, description)
VALUES (%s, %s, %s)
ON CONFLICT (drug_id, description) DO NOTHING
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Stream openFDA drug-label JSON files into a local PostgreSQL database.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR, help="Folder containing drug-label-*.json files.")
    parser.add_argument("--pattern", default=DEFAULT_PATTERN, help="File glob inside --data-dir.")
    parser.add_argument("--dbname", default=os.getenv("PGDATABASE", "postgres"))
    parser.add_argument("--user", default=os.getenv("PGUSER", "postgres"))
    parser.add_argument("--password", default=os.getenv("PGPASSWORD"))
    parser.add_argument("--host", default=os.getenv("PGHOST", "localhost"))
    parser.add_argument("--port", default=os.getenv("PGPORT", "5432"))
    parser.add_argument("--create-schema", action="store_true", help="Create medicines, side_effects, and interactions tables first.")
    parser.add_argument("--limit", type=int, default=0, help="Stop after N labels. 0 means no limit.")
    parser.add_argument("--commit-every", type=int, default=250, help="Commit every N processed labels.")
    return parser.parse_args()


def require_password(password: str | None) -> str:
    if password:
        return password
    raise ValueError("Postgres password missing. Pass --password or set PGPASSWORD.")


def first_value(mapping: dict, key: str) -> str:
    value = mapping.get(key)
    if isinstance(value, list) and value:
        return str(value[0]).strip()
    if isinstance(value, str):
        return value.strip()
    return ""


def read_blocks(record: dict, key: str) -> list[str]:
    value = record.get(key)
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def join_blocks(record: dict, *keys: str) -> str:
    blocks: list[str] = []
    for key in keys:
        blocks.extend(read_blocks(record, key))
    return "\n\n".join(blocks)


def clean_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"^\d+(?:\.\d+)*\s+", "", text)
    return text.strip(" -:;,.")


def split_points(blocks: list[str], min_length: int = 8, max_length: int = 400) -> list[str]:
    points: list[str] = []
    seen: set[str] = set()
    for block in blocks:
        for piece in re.split(r"(?<=[.;])\s+|\n+", block):
            candidate = clean_text(piece)
            if not candidate or len(candidate) < min_length or len(candidate) > max_length:
                continue
            if candidate not in seen:
                seen.add(candidate)
                points.append(candidate)
    return points


def infer_interacting_drug(description: str) -> str | None:
    patterns = [
        r"(?:with|coadministered with|combined with)\s+([A-Za-z0-9][A-Za-z0-9\-\s]{2,80})",
        r"([A-Za-z0-9][A-Za-z0-9\-\s]{2,80})\s+(?:may increase|may decrease|can increase|can decrease)",
    ]
    for pattern in patterns:
        match = re.search(pattern, description, flags=re.IGNORECASE)
        if match:
            value = clean_text(match.group(1))
            return value[:120] if value else None
    return None


def iter_label_records(file_path: Path) -> Iterator[dict]:
    with file_path.open("rb") as handle:
        yield from ijson.items(handle, "results.item")


def extract_medicine_row(record: dict) -> tuple[dict, list[str], list[str]]:
    openfda = record.get("openfda") or {}

    name = (
        first_value(openfda, "brand_name")
        or first_value(openfda, "substance_name")
        or first_value(openfda, "generic_name")
    )
    if not name:
        raise ValueError("No medicine name found in record.")

    set_id = (
        str(record.get("set_id") or "").strip()
        or first_value(openfda, "spl_set_id")
        or str(record.get("id") or "").strip()
        or f"fallback:{name}:{first_value(openfda, 'product_ndc')}"
    )

    row = {
        "set_id": set_id,
        "label_id": str(record.get("id") or "").strip() or first_value(openfda, "spl_id"),
        "name": name,
        "generic_name": first_value(openfda, "generic_name") or first_value(openfda, "substance_name"),
        "manufacturer": first_value(openfda, "manufacturer_name"),
        "product_ndc": first_value(openfda, "product_ndc"),
        "package_ndc": first_value(openfda, "package_ndc"),
        "rxcui": first_value(openfda, "rxcui"),
        "product_type": first_value(openfda, "product_type"),
        "route": first_value(openfda, "route"),
        "indications": join_blocks(record, "indications_and_usage"),
        "dosage": join_blocks(record, "dosage_and_administration", "dosage_forms_and_strengths"),
        "description": join_blocks(record, "description"),
        "warnings": join_blocks(record, "warnings", "warnings_and_cautions"),
        "contraindications": join_blocks(record, "contraindications"),
        "raw_payload": Json(record),
    }

    side_effects = split_points(read_blocks(record, "adverse_reactions"))
    interactions = split_points(read_blocks(record, "drug_interactions"))
    return row, side_effects, interactions


def ensure_schema(cursor) -> None:
    cursor.execute(SCHEMA_PATH.read_text(encoding="utf-8"))


def main() -> None:
    args = parse_args()
    password = require_password(args.password)
    files = sorted(args.data_dir.glob(args.pattern))

    if not files:
        raise FileNotFoundError(f"No files matched {args.pattern} in {args.data_dir}")

    connection = psycopg2.connect(
        dbname=args.dbname,
        user=args.user,
        password=password,
        host=args.host,
        port=args.port,
    )
    cursor = connection.cursor()

    if args.create_schema:
        ensure_schema(cursor)
        connection.commit()

    processed = 0
    inserted_side_effects = 0
    inserted_interactions = 0

    try:
        for file_path in files:
            print(f"Processing {file_path.name}")
            for record in iter_label_records(file_path):
                if args.limit and processed >= args.limit:
                    break

                try:
                    medicine_row, side_effects, interactions = extract_medicine_row(record)
                except ValueError:
                    continue

                cursor.execute(MEDICINE_UPSERT_SQL, medicine_row)
                drug_id = cursor.fetchone()[0]

                if side_effects:
                    execute_batch(cursor, SIDE_EFFECT_SQL, [(drug_id, effect) for effect in side_effects], page_size=100)
                    inserted_side_effects += len(side_effects)

                if interactions:
                    execute_batch(
                        cursor,
                        INTERACTION_SQL,
                        [(drug_id, infer_interacting_drug(description), description) for description in interactions],
                        page_size=100,
                    )
                    inserted_interactions += len(interactions)

                processed += 1

                if processed % args.commit_every == 0:
                    connection.commit()
                    print(
                        f"Committed {processed} medicines | side_effect rows: {inserted_side_effects} | interaction rows: {inserted_interactions}"
                    )

            if args.limit and processed >= args.limit:
                break

        connection.commit()
        print(
            f"Done. Medicines: {processed} | side_effect rows attempted: {inserted_side_effects} | interaction rows attempted: {inserted_interactions}"
        )
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
