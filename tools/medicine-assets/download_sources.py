from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "data" / "raw"

STATIC_SOURCES = {
    "rxnorm_full_prescribe_current": {
        "url": "https://download.nlm.nih.gov/umls/kss/rxnorm/RxNorm_full_prescribe_current.zip",
        "relative_path": Path("rxnorm") / "RxNorm_full_prescribe_current.zip",
        "description": "RxNorm full current release for building the medicine search corpus.",
    },
    "c3pi_sample_data": {
        "url": "https://data.lhncbc.nlm.nih.gov/public/Pills/sampleData.zip",
        "relative_path": Path("pill-images") / "sampleData.zip",
        "description": "C3PI sample consumer-grade pill images for local iteration.",
    },
    "c3pi_reference_images": {
        "url": "https://data.lhncbc.nlm.nih.gov/public/Pills/rximage.zip",
        "relative_path": Path("pill-images") / "rximage.zip",
        "description": "Full C3PI reference archive from the National Library of Medicine.",
    },
    "openfda_ndc_overview": {
        "url": "https://open.fda.gov/data/ndc/",
        "description": "Official openFDA NDC overview page used for current packaging metadata.",
    },
    "dailymed_all_labels_page": {
        "url": "https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm",
        "description": "Official DailyMed bulk label downloads page.",
    },
    "c3pi_catalog_page": {
        "url": "https://catalog.data.gov/dataset/computational-photography-project-for-pill-identification-c3pi-82201",
        "description": "Official C3PI catalog page describing the archived pill image collections.",
    },
}


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def download_file(url: str, destination: Path, chunk_size: int = 1024 * 1024) -> None:
    ensure_parent(destination)
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with destination.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    handle.write(chunk)


def discover_dailymed_release(release_type: str) -> str:
    response = requests.get(STATIC_SOURCES["dailymed_all_labels_page"]["url"], timeout=60)
    response.raise_for_status()
    pattern = re.compile(
        rf"https://dailymed-data\.nlm\.nih\.gov/public-release-files/dm_spl_{release_type}_[^\"']+?\.zip",
        re.IGNORECASE,
    )
    matches = pattern.findall(response.text)
    if not matches:
        raise RuntimeError(f"Could not find a DailyMed {release_type} release link on the official page.")
    return matches[0]


def add_manifest_entry(manifest: dict[str, Any], key: str, url: str, destination: Path | None, note: str) -> None:
    manifest[key] = {
        "url": url,
        "note": note,
        "downloaded_at": datetime.now(timezone.utc).isoformat(),
        "local_path": str(destination.relative_to(BASE_DIR)) if destination else None,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download official medicine and pill-image source files for the Bee.dr asset pipeline."
    )
    parser.add_argument("--rxnorm", action="store_true", help="Download the current RxNorm full release.")
    parser.add_argument("--c3pi-sample", action="store_true", help="Download the C3PI sample image archive.")
    parser.add_argument("--c3pi-full", action="store_true", help="Download the full C3PI reference archive (~7GB).")
    parser.add_argument("--dailymed-monthly", action="store_true", help="Download the latest DailyMed monthly label ZIP.")
    parser.add_argument("--dailymed-weekly", action="store_true", help="Download the latest DailyMed weekly label ZIP.")
    parser.add_argument("--manifest-only", action="store_true", help="Only refresh the source manifest, download nothing.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sources": {},
    }

    selected_downloads = []
    if args.rxnorm:
        selected_downloads.append("rxnorm_full_prescribe_current")
    if args.c3pi_sample:
        selected_downloads.append("c3pi_sample_data")
    if args.c3pi_full:
        selected_downloads.append("c3pi_reference_images")

    for key in ("openfda_ndc_overview", "dailymed_all_labels_page", "c3pi_catalog_page"):
        add_manifest_entry(
            manifest["sources"],
            key,
            STATIC_SOURCES[key]["url"],
            None,
            STATIC_SOURCES[key]["description"],
        )

    if not args.manifest_only:
        for key in selected_downloads:
            source = STATIC_SOURCES[key]
            destination = RAW_DIR / source["relative_path"]
            print(f"Downloading {key} -> {destination}")
            download_file(source["url"], destination)
            add_manifest_entry(manifest["sources"], key, source["url"], destination, source["description"])

        if args.dailymed_monthly:
            monthly_url = discover_dailymed_release("monthly_update")
            monthly_path = RAW_DIR / "dailymed" / Path(monthly_url).name
            print(f"Downloading latest DailyMed monthly release -> {monthly_path}")
            download_file(monthly_url, monthly_path)
            add_manifest_entry(
                manifest["sources"],
                "dailymed_monthly_release",
                monthly_url,
                monthly_path,
                "Latest DailyMed monthly bulk label archive discovered from the official downloads page.",
            )

        if args.dailymed_weekly:
            weekly_url = discover_dailymed_release("weekly_update")
            weekly_path = RAW_DIR / "dailymed" / Path(weekly_url).name
            print(f"Downloading latest DailyMed weekly release -> {weekly_path}")
            download_file(weekly_url, weekly_path)
            add_manifest_entry(
                manifest["sources"],
                "dailymed_weekly_release",
                weekly_url,
                weekly_path,
                "Latest DailyMed weekly bulk label archive discovered from the official downloads page.",
            )

    manifest_path = RAW_DIR / "source_manifest.json"
    ensure_parent(manifest_path)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote source manifest -> {manifest_path}")

    if not selected_downloads and not args.dailymed_monthly and not args.dailymed_weekly:
        print("No downloads selected. Re-run with --rxnorm, --c3pi-sample, --c3pi-full, --dailymed-monthly, or --dailymed-weekly.")


if __name__ == "__main__":
    main()
