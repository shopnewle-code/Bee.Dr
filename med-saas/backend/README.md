# med-saas Backend

Standalone FastAPI backend for the core SaaS pill-analysis flow:

1. image upload
2. YOLO inference
3. pill crop OCR
4. class-to-medicine mapping
5. PostgreSQL medicine lookup
6. structured JSON response for app UI

## Structure

```text
backend/
├── app/
│   ├── db.py
│   ├── detect.py
│   ├── main.py
│   ├── ocr.py
│   ├── schemas.py
│   └── settings.py
├── model/
│   ├── .gitkeep
│   └── pill_mapping.example.json
├── temp/
│   └── .gitkeep
├── .env.example
└── requirements.txt
```

## 1. Install

```powershell
cd med-saas\backend
pip install -r requirements.txt
```

## 2. Add Your Model + Mapping

Put your YOLO weights at:

```text
med-saas\backend\model\pills-832-260219.pt
```

Create:

```text
med-saas\backend\model\pill_mapping.json
```

Based on the example file:

```json
{
  "0": "Paracetamol",
  "1": "Ibuprofen"
}
```

The mapped medicine name should match your PostgreSQL medicine names as closely as possible.

If your dataset already lives outside the repo, you can point the backend directly to it:

```powershell
$env:MEDICINE_API_DATA_ROOT = "C:\Users\arceu\OneDrive\Desktop\medical_Data\pill_archi"
```

That lets the backend auto-detect:

- `pills-832-260219.pt`
- `aiScope-labels.txt`

Important: the current `pill_archi` model is a pill detector, not a medicine classifier. It can find pill regions in the image, but medicine identity still needs a class-to-medicine mapping layer or OCR/manual hint.

To use OCR-assisted matching with the current detector-only model, keep these defaults:

```powershell
$env:MEDICINE_API_ENABLE_OCR = "true"
$env:MEDICINE_API_OCR_MAX_CROPS = "6"
$env:MEDICINE_API_OCR_MIN_MATCH_SCORE = "140"
```

## 3. Run

```powershell
$env:MEDICINE_API_DB_NAME = "med_saas"
$env:MEDICINE_API_DB_USER = "postgres"
$env:MEDICINE_API_DB_PASSWORD = "postgres123"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

## Core Endpoints

- `GET /health`
- `POST /api/v1/pills/detect`
- `POST /api/v1/pills/ocr`
- `POST /api/v1/pills/analyze`
- `POST /api/v1/pills/lookup`

## Resolution Order

`/api/v1/pills/analyze` resolves a medicine in this order:

1. class-to-medicine mapping from `pill_mapping.json`
2. OCR text from the full image and top detected pill crops
3. PostgreSQL medicine lookup
4. optional `medicine_hint` fallback

If none of these produce a safe match, the API returns detections and OCR candidates but leaves the medicine unresolved instead of forcing a guess.

## Product Notes

- If the model file is missing, the API still supports manual medicine lookup.
- If the model returns class IDs but mapping is incomplete, `medicine_hint` can keep the UI flow working.
- OCR works best when imprint or brand text is readable; manufacturer-only text may stay unresolved.
- DB lookup prefers exact matches and falls back to fuzzy lookup when the search function exists.
