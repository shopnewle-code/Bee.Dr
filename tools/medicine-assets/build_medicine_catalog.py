from __future__ import annotations

import argparse
import csv
import io
import json
import re
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_RXNORM_ZIP = BASE_DIR / "data" / "raw" / "rxnorm" / "RxNorm_full_prescribe_current.zip"
DEFAULT_OUTPUT_DIR = BASE_DIR / "data" / "processed"

SUPPORTED_TTYS = {
    "BN",
    "BPCK",
    "DF",
    "GPCK",
    "IN",
    "MIN",
    "PIN",
    "SBD",
    "SBDC",
    "SCD",
    "SCDC",
    "SCDF",
}
BRAND_TTYS = {"BN", "BPCK", "SBD"}
INGREDIENT_TTYS = {"IN", "MIN", "PIN"}
ROUTE_KEYWORDS = {
    "oral": "oral",
    "topical": "topical",
    "ophthalmic": "ophthalmic",
    "otic": "otic",
    "nasal": "nasal",
    "inhalation": "inhalation",
    "intravenous": "intravenous",
    "intramuscular": "intramuscular",
    "subcutaneous": "subcutaneous",
    "rectal": "rectal",
    "vaginal": "vaginal",
}
DOSAGE_FORMS = [
    "tablet",
    "capsule",
    "film coated tablet",
    "solution",
    "suspension",
    "cream",
    "ointment",
    "gel",
    "powder",
    "patch",
    "spray",
    "drops",
    "lozenge",
    "suppository",
    "syrup",
    "injection",
    "kit",
]
STRENGTH_PATTERN = re.compile(
    r"\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units|meq|%)(?:/\d+(?:\.\d+)?\s?(?:ml|g|actuation|hour))?\b",
    re.IGNORECASE,
)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def to_pg_text_array(values: Iterable[str]) -> str:
    cleaned = []
    for value in values:
        escaped = value.replace("\\", "\\\\").replace('"', '\\"').strip()
        if escaped:
            cleaned.append(f'"{escaped}"')
    return "{" + ",".join(cleaned) + "}"


def find_member(archive: zipfile.ZipFile, suffix: str) -> str:
    for name in archive.namelist():
        if name.endswith(suffix):
            return name
    raise FileNotFoundError(f"Could not find {suffix} inside {archive.filename}")


def open_text_member(archive: zipfile.ZipFile, suffix: str) -> io.TextIOWrapper:
    return io.TextIOWrapper(archive.open(find_member(archive, suffix)), encoding="utf-8", errors="ignore")


def extract_route(name: str) -> str:
    lowered = name.lower()
    for keyword, route in ROUTE_KEYWORDS.items():
        if keyword in lowered:
            return route
    return ""


def extract_dosage_form(name: str) -> str:
    lowered = name.lower()
    for dosage_form in DOSAGE_FORMS:
        if dosage_form in lowered:
            return dosage_form
    return ""


def extract_strength(name: str) -> str:
    match = STRENGTH_PATTERN.search(name)
    return match.group(0) if match else ""


def load_rxnorm_atoms(archive: zipfile.ZipFile) -> tuple[dict[str, dict], list[dict[str, str]]]:
    concepts: dict[str, dict] = {}
    search_terms: list[dict[str, str]] = []

    with open_text_member(archive, "RXNCONSO.RRF") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("|")
            if len(parts) < 17:
                continue

            rxcui = parts[0]
            lat = parts[1]
            ispref = parts[6]
            sab = parts[11]
            tty = parts[12]
            name = parts[14].strip()
            suppress = parts[16]

            if lat != "ENG" or sab != "RXNORM" or suppress != "N":
                continue
            if tty not in SUPPORTED_TTYS or not name:
                continue

            concept = concepts.setdefault(
                rxcui,
                {
                    "preferred_name": name,
                    "preferred_tty": tty,
                    "names": set(),
                    "ttys": set(),
                },
            )
            concept["names"].add(name)
            concept["ttys"].add(tty)

            if ispref == "Y" or concept["preferred_name"] == "":
                concept["preferred_name"] = name
                concept["preferred_tty"] = tty

            search_terms.append(
                {
                    "source_key": f"rxnorm:{rxcui}",
                    "rxcui": rxcui,
                    "term": name,
                    "term_type": tty,
                    "is_preferred": "true" if ispref == "Y" else "false",
                    "normalized_term": normalize_text(name),
                }
            )

    return concepts, search_terms


def load_relationships(archive: zipfile.ZipFile) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    ingredients: dict[str, set[str]] = defaultdict(set)
    tradenames: dict[str, set[str]] = defaultdict(set)

    with open_text_member(archive, "RXNREL.RRF") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("|")
            if len(parts) < 15:
                continue

            rxcui1 = parts[0]
            rxcui2 = parts[4]
            rela = parts[7]
            sab = parts[10]
            suppress = parts[14]

            if sab != "RXNORM" or suppress != "N":
                continue

            if rela == "has_ingredient":
                ingredients[rxcui1].add(rxcui2)
            elif rela in {"has_tradename", "tradename_of"}:
                tradenames[rxcui1].add(rxcui2)
                tradenames[rxcui2].add(rxcui1)

    return ingredients, tradenames


def load_ndcs(archive: zipfile.ZipFile) -> dict[str, set[str]]:
    ndcs: dict[str, set[str]] = defaultdict(set)

    with open_text_member(archive, "RXNSAT.RRF") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("|")
            if len(parts) < 12:
                continue

            rxcui = parts[0]
            value = parts[8].strip()
            sab = parts[9]
            attribute_name = parts[10]
            suppress = parts[11]

            if sab == "RXNORM" and attribute_name == "NDC" and suppress == "N" and value:
                ndcs[rxcui].add(value)

    return ndcs


def build_catalog_rows(
    concepts: dict[str, dict],
    ingredients: dict[str, set[str]],
    tradenames: dict[str, set[str]],
    ndcs: dict[str, set[str]],
) -> list[dict[str, str]]:
    preferred_names = {rxcui: concept["preferred_name"] for rxcui, concept in concepts.items()}
    rows = []

    for rxcui, concept in concepts.items():
        preferred_name = concept["preferred_name"]
        preferred_tty = concept["preferred_tty"]
        all_names = sorted(concept["names"])
        ingredient_names = sorted(
            {
                preferred_names[related_rxcui]
                for related_rxcui in ingredients.get(rxcui, set())
                if related_rxcui in preferred_names
            }
        )
        tradename_candidates = sorted(
            {
                preferred_names[related_rxcui]
                for related_rxcui in tradenames.get(rxcui, set())
                if related_rxcui in preferred_names
            }
        )

        if preferred_tty in BRAND_TTYS:
            brand_name = preferred_name
        elif tradename_candidates:
            brand_name = tradename_candidates[0]
        else:
            brand_name = preferred_name

        if ingredient_names:
            generic_name = "; ".join(ingredient_names)
        elif preferred_tty in INGREDIENT_TTYS:
            generic_name = preferred_name
        else:
            generic_name = ""

        metadata = {
            "rxnorm_ttys": sorted(concept["ttys"]),
            "ndc_count": len(ndcs.get(rxcui, set())),
            "name_variants": len(all_names),
        }

        rows.append(
            {
                "source_key": f"rxnorm:{rxcui}",
                "brand_name": brand_name,
                "generic_name": generic_name,
                "synonyms": to_pg_text_array(name for name in all_names if name != preferred_name),
                "product_ndc": sorted(ndcs.get(rxcui, set()))[0] if ndcs.get(rxcui) else "",
                "rxcui": rxcui,
                "spl_set_id": "",
                "dosage_form": extract_dosage_form(preferred_name),
                "route": extract_route(preferred_name),
                "strength": extract_strength(preferred_name),
                "manufacturer": "",
                "description": preferred_name,
                "uses": json.dumps([], ensure_ascii=True),
                "warnings": json.dumps([], ensure_ascii=True),
                "contraindications": json.dumps([], ensure_ascii=True),
                "side_effects": json.dumps({"common": [], "serious": [], "rare": []}, ensure_ascii=True),
                "dosage_info": json.dumps({}, ensure_ascii=True),
                "interactions": json.dumps([], ensure_ascii=True),
                "storage": "",
                "price_range": "",
                "image_urls": json.dumps([], ensure_ascii=True),
                "metadata": json.dumps(metadata, ensure_ascii=True),
            }
        )

    rows.sort(key=lambda row: (row["brand_name"].lower(), row["rxcui"]))
    return rows


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_catalog_import_sql(csv_path: Path, sql_path: Path) -> None:
    sql_path.write_text(
        "\n".join(
            [
                "-- Apply the repo migration before importing this file.",
                "\\copy public.medicine_catalog (",
                "  source_key, brand_name, generic_name, synonyms, product_ndc, rxcui, spl_set_id,",
                "  dosage_form, route, strength, manufacturer, description, uses, warnings,",
                "  contraindications, side_effects, dosage_info, interactions, storage, price_range,",
                "  image_urls, metadata",
                f") FROM '{csv_path.resolve().as_posix()}' WITH (FORMAT csv, HEADER true);",
            ]
        ),
        encoding="utf-8",
    )


def write_search_terms_sql(csv_path: Path, sql_path: Path) -> None:
    sql_path.write_text(
        "\n".join(
            [
                "CREATE TABLE IF NOT EXISTS public.medicine_search_terms (",
                "  source_key TEXT NOT NULL,",
                "  rxcui TEXT,",
                "  term TEXT NOT NULL,",
                "  term_type TEXT,",
                "  is_preferred BOOLEAN NOT NULL DEFAULT false,",
                "  normalized_term TEXT NOT NULL",
                ");",
                f"\\copy public.medicine_search_terms (source_key, rxcui, term, term_type, is_preferred, normalized_term) FROM '{csv_path.resolve().as_posix()}' WITH (FORMAT csv, HEADER true);",
            ]
        ),
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Bee.dr medicine CSV/SQL assets from the official RxNorm release.")
    parser.add_argument("--rxnorm-zip", type=Path, default=DEFAULT_RXNORM_ZIP, help="Path to RxNorm_full_prescribe_current.zip")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory for generated CSV, SQL, and stats files.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.rxnorm_zip.exists():
        raise FileNotFoundError(f"RxNorm ZIP not found: {args.rxnorm_zip}")

    with zipfile.ZipFile(args.rxnorm_zip) as archive:
        concepts, search_terms = load_rxnorm_atoms(archive)
        ingredients, tradenames = load_relationships(archive)
        ndcs = load_ndcs(archive)

    catalog_rows = build_catalog_rows(concepts, ingredients, tradenames, ndcs)

    output_dir = args.output_dir
    catalog_csv = output_dir / "medicine_catalog.csv"
    search_terms_csv = output_dir / "medicine_search_terms.csv"
    catalog_sql = output_dir / "medicine_catalog_import.sql"
    search_terms_sql = output_dir / "medicine_search_terms.sql"
    stats_json = output_dir / "medicine_catalog_stats.json"

    catalog_fieldnames = [
        "source_key",
        "brand_name",
        "generic_name",
        "synonyms",
        "product_ndc",
        "rxcui",
        "spl_set_id",
        "dosage_form",
        "route",
        "strength",
        "manufacturer",
        "description",
        "uses",
        "warnings",
        "contraindications",
        "side_effects",
        "dosage_info",
        "interactions",
        "storage",
        "price_range",
        "image_urls",
        "metadata",
    ]
    search_term_fieldnames = ["source_key", "rxcui", "term", "term_type", "is_preferred", "normalized_term"]

    write_csv(catalog_csv, catalog_fieldnames, catalog_rows)
    write_csv(search_terms_csv, search_term_fieldnames, search_terms)
    write_catalog_import_sql(catalog_csv, catalog_sql)
    write_search_terms_sql(search_terms_csv, search_terms_sql)

    stats = {
        "catalog_rows": len(catalog_rows),
        "search_terms_rows": len(search_terms),
        "top_term_types": Counter(row["term_type"] for row in search_terms).most_common(10),
    }
    stats_json.write_text(json.dumps(stats, indent=2), encoding="utf-8")

    print(f"Wrote catalog CSV -> {catalog_csv}")
    print(f"Wrote search terms CSV -> {search_terms_csv}")
    print(f"Wrote catalog import SQL -> {catalog_sql}")
    print(f"Wrote search terms SQL -> {search_terms_sql}")
    print(f"Wrote stats JSON -> {stats_json}")


if __name__ == "__main__":
    main()
