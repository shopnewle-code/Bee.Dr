from __future__ import annotations

import argparse
import csv
import json
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import requests


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = BASE_DIR / "data" / "processed" / "medicine_catalog.csv"
DAILYMED_BASE = "https://dailymed.nlm.nih.gov/dailymed/services/v2"
XML_NAMESPACE = {"hl7": "urn:hl7-org:v3"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Enrich the Bee.dr medicine catalog CSV with DailyMed label sections.")
    parser.add_argument("--input-csv", type=Path, default=DEFAULT_INPUT, help="Path to medicine_catalog.csv")
    parser.add_argument("--output-csv", type=Path, help="Where to write the enriched CSV. Defaults to *_dailymed.csv")
    parser.add_argument("--limit", type=int, default=200, help="Maximum rows to enrich. Use 0 for all rows.")
    parser.add_argument("--sleep-seconds", type=float, default=0.15, help="Delay between DailyMed requests.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing label-derived fields if already populated.")
    return parser.parse_args()


def load_json_field(value: str, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def dump_json_field(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True)


def split_points(text: str, limit: int) -> list[str]:
    chunks = re.split(r"[\n\r]+|(?<=[.;])\s+", text)
    cleaned = []
    for chunk in chunks:
        candidate = re.sub(r"\s+", " ", chunk).strip(" -:;,.")
        if 18 <= len(candidate) <= 260 and candidate not in cleaned:
            cleaned.append(candidate)
        if len(cleaned) >= limit:
            break
    return cleaned


def joined_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return " ".join(piece.strip() for piece in element.itertext() if piece and piece.strip())


def search_spl(session: requests.Session, rxcui: str, brand_name: str) -> dict[str, Any] | None:
    params = {"pagesize": 1}
    if rxcui:
        params["rxcui"] = rxcui
    elif brand_name:
        params["drug_name"] = brand_name
        params["name_type"] = "both"
    else:
        return None

    response = session.get(f"{DAILYMED_BASE}/spls.json", params=params, timeout=45)
    response.raise_for_status()
    payload = response.json()
    records = payload.get("data") or []
    return records[0] if records else None


def fetch_media(session: requests.Session, setid: str) -> list[str]:
    response = session.get(f"{DAILYMED_BASE}/spls/{setid}/media.json", timeout=45)
    response.raise_for_status()
    payload = response.json()
    media = payload.get("data", {}).get("media") or []
    return [entry.get("url", "").strip() for entry in media if entry.get("url")]


def fetch_label_xml(session: requests.Session, setid: str) -> ET.Element:
    response = session.get(f"{DAILYMED_BASE}/spls/{setid}.xml", timeout=45)
    response.raise_for_status()
    return ET.fromstring(response.content)


def extract_sections(root: ET.Element) -> dict[str, str]:
    sections = {
        "uses": "",
        "warnings": "",
        "contraindications": "",
        "adverse_reactions": "",
        "dosage": "",
        "storage": "",
    }

    for section in root.findall(".//hl7:section", XML_NAMESPACE):
        title = joined_text(section.find("hl7:title", XML_NAMESPACE)).upper()
        text = joined_text(section.find("hl7:text", XML_NAMESPACE))
        if not title or not text:
            continue

        if not sections["uses"] and "INDICATIONS" in title:
            sections["uses"] = text
        elif not sections["warnings"] and ("WARNINGS" in title or "PRECAUTIONS" in title):
            sections["warnings"] = text
        elif not sections["contraindications"] and "CONTRAINDICATIONS" in title:
            sections["contraindications"] = text
        elif not sections["adverse_reactions"] and "ADVERSE REACTIONS" in title:
            sections["adverse_reactions"] = text
        elif not sections["dosage"] and "DOSAGE AND ADMINISTRATION" in title:
            sections["dosage"] = text
        elif not sections["storage"] and "STORAGE" in title:
            sections["storage"] = text

    return sections


def title_to_manufacturer(title: str) -> str:
    match = re.search(r"\[(.+?)\]\s*$", title)
    return match.group(1).strip() if match else ""


def title_to_brand_name(title: str) -> str:
    return re.sub(r"\s*\[.+?\]\s*$", "", title).strip()


def merge_side_effects(existing: dict[str, Any], adverse_reactions: str) -> dict[str, Any]:
    current = {
        "common": existing.get("common", []) if isinstance(existing, dict) else [],
        "serious": existing.get("serious", []) if isinstance(existing, dict) else [],
        "rare": existing.get("rare", []) if isinstance(existing, dict) else [],
    }

    if not current["common"]:
        current["common"] = split_points(adverse_reactions, 5)

    if not current["serious"]:
        serious_candidates = [
            point
            for point in split_points(adverse_reactions, 8)
            if re.search(r"\b(serious|severe|fatal|anaphylaxis|hepatotoxicity|arrhythmia)\b", point, re.IGNORECASE)
        ]
        current["serious"] = serious_candidates[:3]

    return current


def maybe_update(current: Any, new_value: Any, overwrite: bool) -> Any:
    if overwrite:
        return new_value
    if current in ("", None, [], {}, "[]", "{}"):
        return new_value
    return current


def main() -> None:
    args = parse_args()
    output_csv = args.output_csv or args.input_csv.with_name(args.input_csv.stem + "_dailymed.csv")

    if not args.input_csv.exists():
        raise FileNotFoundError(f"Input catalog not found: {args.input_csv}")

    with args.input_csv.open("r", newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    if not rows:
        raise RuntimeError("The input CSV has no rows to enrich.")

    session = requests.Session()
    updated = 0

    for index, row in enumerate(rows):
        if args.limit and updated >= args.limit:
            break

        rxcui = row.get("rxcui", "").strip()
        brand_name = row.get("brand_name", "").strip()

        try:
            spl = search_spl(session, rxcui, brand_name)
            if not spl:
                continue

            setid = spl.get("setid", "").strip()
            if not setid:
                continue

            title = spl.get("title", "").strip()
            label_root = fetch_label_xml(session, setid)
            sections = extract_sections(label_root)
            media_urls = fetch_media(session, setid)

            uses = load_json_field(row.get("uses", ""), [])
            warnings = load_json_field(row.get("warnings", ""), [])
            contraindications = load_json_field(row.get("contraindications", ""), [])
            side_effects = load_json_field(row.get("side_effects", ""), {"common": [], "serious": [], "rare": []})
            dosage_info = load_json_field(row.get("dosage_info", ""), {})
            metadata = load_json_field(row.get("metadata", ""), {})

            if sections["uses"]:
                uses = maybe_update(uses, split_points(sections["uses"], 5), args.overwrite)
            if sections["warnings"]:
                warnings = maybe_update(warnings, split_points(sections["warnings"], 6), args.overwrite)
            if sections["contraindications"]:
                contraindications = maybe_update(
                    contraindications,
                    split_points(sections["contraindications"], 4),
                    args.overwrite,
                )
            if sections["adverse_reactions"]:
                side_effects = merge_side_effects(side_effects, sections["adverse_reactions"])
            if sections["dosage"]:
                dosage_lines = split_points(sections["dosage"], 1)
                if dosage_lines:
                    dosage_info = maybe_update(dosage_info, {"adult": dosage_lines[0]}, args.overwrite)
            if sections["storage"]:
                storage_lines = split_points(sections["storage"], 1)
                if storage_lines:
                    row["storage"] = maybe_update(row.get("storage", ""), storage_lines[0], args.overwrite)

            if title:
                row["brand_name"] = maybe_update(row.get("brand_name", ""), title_to_brand_name(title), False)
                row["manufacturer"] = maybe_update(
                    row.get("manufacturer", ""),
                    title_to_manufacturer(title),
                    args.overwrite,
                )

            row["spl_set_id"] = setid
            row["uses"] = dump_json_field(uses)
            row["warnings"] = dump_json_field(warnings)
            row["contraindications"] = dump_json_field(contraindications)
            row["side_effects"] = dump_json_field(side_effects)
            row["dosage_info"] = dump_json_field(dosage_info)
            row["image_urls"] = dump_json_field(media_urls)

            metadata["dailymed"] = {
                "title": title,
                "published_date": spl.get("published_date"),
            }
            row["metadata"] = dump_json_field(metadata)

            updated += 1
            print(f"[{updated}] Enriched {row.get('brand_name', row.get('source_key', 'unknown'))}")
            time.sleep(args.sleep_seconds)
        except Exception as exc:  # noqa: BLE001
            print(f"Skipping row {index + 1} ({brand_name or rxcui}): {exc}")

    with output_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote DailyMed-enriched catalog -> {output_csv}")
    print(f"Rows enriched -> {updated}")


if __name__ == "__main__":
    main()
