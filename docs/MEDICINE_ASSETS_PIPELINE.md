# Medicine Assets Pipeline

This repo now includes a practical pipeline for the two hardest medicine assets:

1. An import-ready medicine dataset for the app.
2. A pill-image training path that produces `best.pt`.

## What It Adds

- [`tools/medicine-assets/download_sources.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/download_sources.py)
  Downloads or records the official source files.
- [`tools/medicine-assets/build_medicine_catalog.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/build_medicine_catalog.py)
  Builds:
  - `medicine_catalog.csv` for app import
  - `medicine_search_terms.csv` for the 100k+ search corpus
  - matching SQL import files
- [`tools/medicine-assets/enrich_dailymed.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/enrich_dailymed.py)
  Pulls indications, warnings, storage, images, and label metadata from DailyMed.
- [`tools/medicine-assets/ingest_openfda_to_postgres.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/ingest_openfda_to_postgres.py)
  Streams the huge openFDA drug-label JSON files into local PostgreSQL tables.
- [`tools/medicine-assets/serve_medicine_api.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/serve_medicine_api.py)
  Exposes a local FastAPI service for medicine search, detail lookup, and interaction checks on top of the imported PostgreSQL data.
- [`tools/medicine-assets/prepare_c3pi_classification.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/prepare_c3pi_classification.py)
  Converts C3PI pill images into a YOLO classification dataset.
- [`tools/medicine-assets/train_pill_model.py`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/train_pill_model.py)
  Fine-tunes YOLO and copies the final weights to `tools/medicine-assets/models/best.pt`.

## Official Source Pages

Verified on March 27, 2026:

- openFDA NDC overview:
  `https://open.fda.gov/data/ndc/`
- RxNorm current files:
  `https://download.nlm.nih.gov/umls/kss/rxnorm/RxNorm_full_prescribe_current.zip`
- DailyMed bulk label downloads:
  `https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm`
- DailyMed REST API docs:
  `https://dailymed.nlm.nih.gov/dailymed/webservices-help/v2/spls_api.cfm`
- DailyMed media API docs:
  `https://dailymed.nlm.nih.gov/dailymed/webservices-help/v2/spls_setid_media_api.cfm`
- C3PI pill-image catalog:
  `https://catalog.data.gov/dataset/computational-photography-project-for-pill-identification-c3pi-82201`

## 1. Install Python Dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r tools\medicine-assets\requirements.txt
```

## 2. Download the Public Source Files

Start with RxNorm plus the smaller pill-image sample:

```powershell
python tools\medicine-assets\download_sources.py --rxnorm --c3pi-sample
```

If you want the current DailyMed bulk ZIP too:

```powershell
python tools\medicine-assets\download_sources.py --dailymed-monthly
```

The script also writes:

- `tools/medicine-assets/data/raw/source_manifest.json`

## 3. Build the Clean Medicine Dataset

```powershell
python tools\medicine-assets\build_medicine_catalog.py
```

Outputs:

- `tools/medicine-assets/data/processed/medicine_catalog.csv`
- `tools/medicine-assets/data/processed/medicine_catalog_import.sql`
- `tools/medicine-assets/data/processed/medicine_search_terms.csv`
- `tools/medicine-assets/data/processed/medicine_search_terms.sql`
- `tools/medicine-assets/data/processed/medicine_catalog_stats.json`

Recommended interpretation:

- `medicine_catalog.csv`
  The smaller import-ready table used by Bee.dr scanner lookups.
- `medicine_search_terms.csv`
  The 100k+ vocabulary-style dataset for matching, OCR recovery, and fuzzy search.

## 4. Enrich With DailyMed Labels

This step fills label-derived fields like uses, warnings, storage, and label images.

```powershell
python tools\medicine-assets\enrich_dailymed.py --limit 1000
```

That writes:

- `tools/medicine-assets/data/processed/medicine_catalog_dailymed.csv`

Use `--limit 0` if you want to enrich the full catalog.

## 5. Import Into Supabase/Postgres

Apply the new migration first:

- [`supabase/migrations/20260327195000_medicine_catalog.sql`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/supabase/migrations/20260327195000_medicine_catalog.sql)

Then run the generated import SQL:

```powershell
psql "$env:SUPABASE_DB_URL" -f tools\medicine-assets\data\processed\medicine_catalog_import.sql
```

After import, the `analyze-medicine` edge function will search the catalog before using the LLM.

## 6. Prepare the Pill Training Dataset

Using the official sample archive:

```powershell
python tools\medicine-assets\prepare_c3pi_classification.py --source-zip tools\medicine-assets\data\raw\pill-images\sampleData.zip
```

Notes:

- The public C3PI consumer archive is classification-friendly out of the box.
- The full consumer-grade archive is massive, so this prep tool lets you cap classes and images.
- Raw `.CR2` files are skipped. JPEG/PNG/WebP files are used.

## 7. Train and Export `best.pt`

```powershell
python tools\medicine-assets\train_pill_model.py --epochs 30 --model yolov8n-cls.pt
```

Outputs:

- Ultralytics run artifacts in `tools/medicine-assets/runs`
- Final checkpoint in `tools/medicine-assets/models/best.pt`

## Current App Behavior

The medicine scanner now works in this order:

1. Search `public.medicine_catalog` via `search_medicine_catalog`.
2. Return source-backed medicine data when a match is strong enough.
3. Use the LLM only as a fallback, or for Hindi translation when needed.

That reduces hallucinated drug details and lets you graduate the feature into a real medicine knowledge layer instead of a prompt-only demo.

## 8. Local Medicine API on `med_saas`

If you have already imported the large openFDA label files into your local PostgreSQL database, you can expose that data as a usable product backend:

```powershell
$env:MEDICINE_DB_NAME = "med_saas"
$env:MEDICINE_DB_USER = "postgres"
$env:MEDICINE_DB_PASSWORD = "your_password"
uvicorn --app-dir tools/medicine-assets serve_medicine_api:app --host 0.0.0.0 --port 8010
```

What it does on startup:

- applies [`tools/medicine-assets/sql/openfda_search_optimizations.sql`](/c:/Users/arceu/OneDrive/Desktop/Bee.Dr_Bot/Bee.Dr/tools/medicine-assets/sql/openfda_search_optimizations.sql)
- enables trigram search indexes
- creates `search_medicines(query_text, match_limit)` in local Postgres

Useful endpoints:

- `GET /health`
- `GET /api/v1/medicines/search?q=paracetamol`
- `GET /api/v1/medicines/{id}`
- `GET /api/v1/medicines/resolve/by-name?name=metformin`
- `POST /api/v1/interactions/check`

Example interaction request:

```json
{
  "medicines": ["warfarin", "aspirin"]
}
```
