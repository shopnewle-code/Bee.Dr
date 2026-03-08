# Bee.dr — AI Tech Stack & Developer Specification
## Complete Engineering Guide for Developers & DevOps

> **Version**: 1.0 | **Date**: March 2026  
> **Audience**: Backend Engineers, ML Engineers, DevOps, Mobile Developers  
> **Status**: Ready for Implementation

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current MVP Status (What's Already Built)](#2-current-mvp-status)
3. [AI Model Stack — Complete Breakdown](#3-ai-model-stack)
4. [Medical Datasets for Training](#4-medical-datasets)
5. [AI Pipeline Architecture](#5-ai-pipeline-architecture)
6. [Infrastructure & DevOps Specifications](#6-infrastructure-devops)
7. [30-Day MVP Roadmap](#7-30-day-mvp-roadmap)
8. [API Contract Specifications](#8-api-contracts)
9. [Security & Compliance](#9-security-compliance)
10. [Cost Estimation](#10-cost-estimation)
11. [Scaling Strategy](#11-scaling-strategy)

---

## 1. EXECUTIVE SUMMARY

Bee.dr is an AI-powered healthcare platform that combines **computer vision + NLP + LLM + predictive ML** to deliver:

- Medical report OCR & AI interpretation
- AI doctor chat with medical knowledge retrieval
- Disease risk prediction
- Medicine recognition & information
- Symptom checker & triage
- Doctor consultation & booking
- Pharmacy marketplace

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  React Web App (PWA) ──── Flutter Mobile App (future)            │
└──────────────────────────────┬────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                            │
│  Kong / Nginx / Traefik — Rate Limiting, Auth, Load Balancing     │
└──────────────────────────────┬────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                   MICROSERVICES LAYER                              │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌───────┐ ┌────────┐     │
│  │ Auth │ │ Report │ │  AI  │ │ Med  │ │Doctor │ │Pharmacy│     │
│  │  Svc │ │  Svc   │ │ Chat │ │  Svc │ │  Svc  │ │  Svc   │     │
│  └──┬───┘ └───┬────┘ └──┬───┘ └──┬───┘ └───┬───┘ └───┬────┘     │
└─────┴─────────┴─────────┴────────┴─────────┴─────────┴───────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                      AI / ML LAYER                                │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐  │
│  │  OCR    │ │ Medical  │ │   LLM   │ │ Disease  │ │Medicine │  │
│  │ Engine  │ │   NLP    │ │ Engine  │ │ Risk ML  │ │Vision AI│  │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘ └─────────┘  │
└──────────────────────────────┬────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                      DATA LAYER                                   │
│  PostgreSQL 16   │  Qdrant (Vector)  │  Redis 7  │  AWS S3       │
│  + pgvector      │  Medical KB       │  Cache    │  File Store   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. CURRENT MVP STATUS (What's Already Built)

### ✅ 28 Features Live on Lovable Cloud

| #  | Feature                    | Status  | Edge Function          | Notes                              |
|----|----------------------------|---------|------------------------|------------------------------------|
| 1  | User Authentication        | ✅ Live | Supabase Auth          | Email + password                   |
| 2  | Health Profile             | ✅ Live | —                      | Complete health data form          |
| 3  | Report Upload + OCR        | ✅ Live | —                      | PDF/image upload to storage        |
| 4  | AI Report Analysis         | ✅ Live | `analyze-report`       | Gemini 3 Flash — structured JSON   |
| 5  | AI Doctor Chat             | ✅ Live | `medical-chat`         | Streaming SSE, context-aware       |
| 6  | Medicine Scanner           | ✅ Live | `analyze-medicine`     | Text/image → drug info JSON        |
| 7  | Prescription Scanner       | ✅ Live | `analyze-prescription` | Handwriting OCR + AI parsing       |
| 8  | Symptom Checker            | ✅ Live | `symptom-checker`      | Tool-calling for structured output |
| 9  | Predictive Health          | ✅ Live | `predictive-health`    | Risk scoring engine                |
| 10 | Skin Scanner               | ✅ Live | `analyze-skin`         | Dermatology AI                     |
| 11 | ECG Interpreter            | ✅ Live | `analyze-imaging`      | Cardiac rhythm analysis            |
| 12 | X-ray AI                   | ✅ Live | `analyze-imaging`      | Radiological review                |
| 13 | MRI Analysis               | ✅ Live | `analyze-imaging`      | Tissue signal interpretation       |
| 14 | Treatment Plans            | ✅ Live | `treatment-plan`       | Evidence-based care plans          |
| 15 | AI Triage                  | ✅ Live | `ai-triage`            | Urgency scoring (4 levels)         |
| 16 | Appointment Booking        | ✅ Live | —                      | Calendar + doctor selection        |
| 17 | Telemedicine Chat          | ✅ Live | —                      | Realtime Supabase channels         |
| 18 | Voice Doctor               | ✅ Live | `elevenlabs-tts/stt`   | ElevenLabs voice AI                |
| 19 | Daily Check-in             | ✅ Live | —                      | Mood, sleep, exercise tracking     |
| 20 | Medication Tracker         | ✅ Live | —                      | Reminders + schedule               |
| 21 | Family Dashboard           | ✅ Live | —                      | Multi-member health tracking       |
| 22 | Health Trends              | ✅ Live | —                      | Recharts visualizations            |
| 23 | Report Comparison          | ✅ Live | —                      | Side-by-side report diff           |
| 24 | Emergency Alerts           | ✅ Live | —                      | Critical value detection           |
| 25 | Health Map                 | ✅ Live | —                      | Nearby hospitals/pharmacies        |
| 26 | Vaccination Tracker        | ✅ Live | —                      | Immunization records               |
| 27 | Wearable Integration       | ✅ Live | —                      | Manual + device sync               |
| 28 | Pharmacy Marketplace       | ✅ Live | —                      | B2B pharmacy panel + orders        |

### Current Tech Stack (MVP)

| Layer        | Technology                     | Purpose                    |
|--------------|--------------------------------|----------------------------|
| Frontend     | React 18 + TypeScript + Vite   | SPA with PWA support       |
| UI           | Tailwind CSS + shadcn/ui       | Design system              |
| Animation    | Framer Motion                  | UI animations              |
| Backend      | Supabase (Lovable Cloud)       | Auth, DB, Storage, Funcs   |
| Database     | PostgreSQL 16                  | 22 tables with RLS         |
| AI Gateway   | Lovable AI Gateway             | Gemini + GPT model access  |
| AI Model     | google/gemini-3-flash-preview  | Primary AI model           |
| Voice        | ElevenLabs API                 | TTS + STT                  |
| Charts       | Recharts                       | Health data visualization  |
| Realtime     | Supabase Realtime              | Telemedicine chat          |

### Database Tables (22 Production Tables)

```
profiles              — User display info, avatar, DOB
health_profiles       — Medical history, allergies, conditions
family_members        — Dependent health tracking
scan_results          — Uploaded report metadata
test_results          — Individual lab test values
chat_messages         — AI doctor conversation history
medications           — Active medication schedules
daily_checkins        — Daily mood/sleep/exercise logs
health_insights       — AI-generated risk predictions
emergency_alerts      — Critical health notifications
vaccinations          — Immunization records
wearable_data         — Device health metrics
skin_scans            — Dermatology scan results
doctors               — Doctor profiles & ratings
doctor_availability   — Scheduling slots
appointments          — Booked consultations
consultations         — Consultation records
telemedicine_sessions — Video/chat session tracking
telemedicine_messages — Realtime chat messages
pharmacies            — Pharmacy partner profiles
pharmacy_products     — Medicine inventory
pharmacy_orders       — Customer orders
```

---

## 3. AI MODEL STACK — Complete Breakdown

### A. Medical Report OCR & Document Understanding

**Purpose**: Extract structured text from medical reports (PDFs, images, camera scans)

| Model / API              | Type          | Use Case                     | Accuracy | Latency  | Cost         |
|--------------------------|---------------|------------------------------|----------|----------|--------------|
| Google Cloud Vision API  | Cloud API     | Printed text OCR             | 98%+     | 200ms    | $1.50/1K     |
| AWS Textract             | Cloud API     | Table extraction from PDFs   | 97%+     | 500ms    | $1.50/1K     |
| Tesseract OCR            | Open Source   | Fallback / offline           | 90%+     | 300ms    | Free         |
| LayoutLMv3               | Self-hosted   | Document layout understanding| 95%+     | 400ms    | GPU cost     |

**Current Implementation**: Using Lovable AI (Gemini vision) for OCR in edge functions  
**Production Migration**: Google Cloud Vision API as primary, Tesseract as fallback

**Pipeline**:
```
PDF / Image / Camera
    ↓
┌─────────────────────────┐
│ Pre-processing           │
│ • Deskew & crop          │
│ • Contrast enhancement   │
│ • Resolution upscaling   │
│ • Multi-page splitting   │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ OCR Engine               │
│ • GCV for printed text   │
│ • TrOCR for handwriting  │
│ • Confidence scoring     │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ Table Extraction         │
│ • AWS Textract           │
│ • Row-column mapping     │
│ • Header detection       │
└────────┬────────────────┘
         ↓
Structured Medical Text (JSON)
```

### B. Doctor Handwriting Recognition (Prescription Decoding)

**Purpose**: Read handwritten prescriptions that patients photograph

| Model          | Type        | Architecture         | Training Data      | Accuracy |
|----------------|-------------|----------------------|--------------------|----------|
| TrOCR          | HuggingFace | Transformer-based    | IAM + custom       | 92%+     |
| Donut OCR      | HuggingFace | Vision Transformer   | Document images    | 90%+     |
| PaddleOCR      | Open Source  | CNN + LSTM + CTC     | Multi-language     | 88%+     |

**Example Pipeline**:
```
Input: Handwritten prescription photo
    ↓
Pre-process: Binarize → Deskew → Segment lines
    ↓
TrOCR Model: "Tab Amoxicillin 500 mg TDS"
    ↓
NLP Parser:
    {
      "medicine": "Amoxicillin",
      "form": "Tablet",
      "dose": "500 mg",
      "frequency": "Three times daily (TDS)",
      "duration": null
    }
```

**Medical Abbreviation Dictionary** (must be embedded):
```
TDS  → Three times daily
BD   → Twice daily
OD   → Once daily
QID  → Four times daily
PRN  → As needed
SOS  → If needed
AC   → Before meals
PC   → After meals
HS   → At bedtime
STAT → Immediately
```

### C. Medical NLP Models (Entity Extraction)

**Purpose**: Extract structured medical entities from OCR output

| Model          | Source      | Parameters | Best For                    | Fine-tuning Data     |
|----------------|-------------|------------|-----------------------------|----------------------|
| BioBERT        | HuggingFace | 110M       | Biomedical text mining      | PubMed + PMC         |
| ClinicalBERT   | HuggingFace | 110M       | Clinical notes understanding| MIMIC-III clinical   |
| PubMedBERT     | Microsoft   | 110M       | Medical literature NLP      | PubMed abstracts     |
| SciBERT        | AllenAI     | 110M       | Scientific text processing  | Semantic Scholar     |

**NER (Named Entity Recognition) Tasks**:

```python
# Input text from OCR
text = "Hemoglobin: 10.2 g/dL (Ref: 12.0-16.0) | WBC: 11,500 /µL (Ref: 4,500-11,000)"

# Expected output entities:
entities = [
    {"entity": "TEST_NAME",  "value": "Hemoglobin",  "start": 0,  "end": 10},
    {"entity": "VALUE",      "value": "10.2",         "start": 12, "end": 16},
    {"entity": "UNIT",       "value": "g/dL",         "start": 17, "end": 21},
    {"entity": "REF_RANGE",  "value": "12.0-16.0",    "start": 28, "end": 37},
    {"entity": "STATUS",     "value": "LOW",           "derived": True},
    {"entity": "TEST_NAME",  "value": "WBC",           "start": 41, "end": 44},
    {"entity": "VALUE",      "value": "11500",         "start": 46, "end": 52},
    {"entity": "UNIT",       "value": "/µL",           "start": 53, "end": 56},
    {"entity": "REF_RANGE",  "value": "4500-11000",    "start": 63, "end": 75},
    {"entity": "STATUS",     "value": "HIGH",          "derived": True}
]
```

**Custom Medical NER Fine-tuning Steps**:
```
1. Prepare training data (BIO/IOB2 format)
2. Fine-tune PubMedBERT on medical report corpus
3. Add custom entity types: TEST_NAME, VALUE, UNIT, REF_RANGE, MEDICINE, DOSE
4. Validate on held-out test set (target F1 > 0.92)
5. Export ONNX model for production inference
```

### D. AI Medical Explanation Engine (LLM Layer)

**Purpose**: Generate human-readable explanations of medical data

| Model                       | Provider  | Context Window | Speed    | Cost/1M tokens | Best For           |
|-----------------------------|-----------|----------------|----------|----------------|--------------------|
| GPT-5                       | OpenAI    | 256K           | Medium   | $15 input      | Complex reasoning  |
| GPT-5-mini                  | OpenAI    | 256K           | Fast     | $3 input       | General use        |
| Gemini 2.5 Pro              | Google    | 1M             | Medium   | $7 input       | Large context      |
| Gemini 3 Flash              | Google    | 1M             | Fast     | $1.5 input     | Speed + quality    |
| Gemini 2.5 Flash Lite       | Google    | 128K           | Fastest  | $0.5 input     | Simple tasks       |
| Llama 3.1 405B (self-host)  | Meta      | 128K           | Variable | GPU cost       | Full control       |

**Current Implementation**: `google/gemini-3-flash-preview` via Lovable AI Gateway  
**Production Recommendation**: Gemini 3 Flash (primary) + GPT-5-mini (fallback)

**System Prompt Architecture**:
```
┌─────────────────────────────────────────────────┐
│              SYSTEM PROMPT LAYERS                │
├─────────────────────────────────────────────────┤
│ Layer 1: Base Medical AI Identity                │
│   "You are Bee.dr AI..."                         │
├─────────────────────────────────────────────────┤
│ Layer 2: User Health Context                     │
│   Age, gender, conditions, medications           │
├─────────────────────────────────────────────────┤
│ Layer 3: Report-Specific Context                 │
│   Current report data, abnormal values           │
├─────────────────────────────────────────────────┤
│ Layer 4: Historical Context                      │
│   Previous reports, trends, predictions          │
├─────────────────────────────────────────────────┤
│ Layer 5: Safety Guardrails                       │
│   Disclaimers, scope limitations, referrals      │
└─────────────────────────────────────────────────┘
```

### E. AI Doctor Chat System (RAG Architecture)

**Purpose**: Context-aware medical Q&A with knowledge retrieval

```
┌────────────────────────────────────────────────────────┐
│                  AI DOCTOR CHAT FLOW                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  User Question: "Why is my hemoglobin low?"            │
│       │                                                │
│       ▼                                                │
│  ┌──────────────────────────────────┐                  │
│  │ 1. INTENT CLASSIFICATION         │                  │
│  │    • Report question             │                  │
│  │    • General medical Q&A         │                  │
│  │    • Medication inquiry          │                  │
│  │    • Emergency assessment        │                  │
│  └──────────┬───────────────────────┘                  │
│             ▼                                          │
│  ┌──────────────────────────────────┐                  │
│  │ 2. CONTEXT RETRIEVAL             │                  │
│  │    a. User's latest reports      │  ← PostgreSQL    │
│  │    b. User health profile        │  ← PostgreSQL    │
│  │    c. Medical knowledge search   │  ← Qdrant        │
│  │    d. Conversation history       │  ← PostgreSQL    │
│  └──────────┬───────────────────────┘                  │
│             ▼                                          │
│  ┌──────────────────────────────────┐                  │
│  │ 3. PROMPT ASSEMBLY               │                  │
│  │    System prompt                  │                  │
│  │    + User context                 │                  │
│  │    + Retrieved knowledge          │                  │
│  │    + Conversation history         │                  │
│  │    + Current question             │                  │
│  └──────────┬───────────────────────┘                  │
│             ▼                                          │
│  ┌──────────────────────────────────┐                  │
│  │ 4. LLM GENERATION (Streaming)    │                  │
│  │    Model: Gemini 3 Flash          │                  │
│  │    Output: SSE token stream       │                  │
│  └──────────┬───────────────────────┘                  │
│             ▼                                          │
│  ┌──────────────────────────────────┐                  │
│  │ 5. POST-PROCESSING               │                  │
│  │    • Safety filter                │                  │
│  │    • Citation attachment          │                  │
│  │    • Suggested follow-up Qs       │                  │
│  └──────────────────────────────────┘                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Vector Database Setup (Qdrant)**:
```yaml
# Qdrant collection configuration
collection: medical_knowledge
vectors:
  size: 3072  # OpenAI text-embedding-3-large
  distance: Cosine

# Data categories to embed:
categories:
  - lab_test_references:    ~10,000 entries
  - drug_information:       ~50,000 medicines  
  - disease_symptoms:       ~5,000 conditions
  - treatment_protocols:    ~2,000 guidelines
  - medical_faq:            ~20,000 Q&A pairs

# Embedding pipeline:
embedding_model: text-embedding-3-large (OpenAI)
chunk_size: 512 tokens
chunk_overlap: 50 tokens
```

### F. Disease Risk Prediction Models

**Purpose**: Predict probability of diseases based on lab results + lifestyle

| Disease           | Model Type    | Input Features                        | Target Accuracy |
|-------------------|---------------|---------------------------------------|-----------------|
| Type 2 Diabetes   | XGBoost       | Glucose, HbA1c, BMI, age, family hx   | 87%+            |
| Heart Disease     | Random Forest | Cholesterol, BP, ECG, age, smoking     | 85%+            |
| Thyroid Disorder  | LightGBM      | TSH, T3, T4, age, gender              | 90%+            |
| Anemia            | XGBoost       | Hemoglobin, MCV, MCH, iron, ferritin  | 92%+            |
| Kidney Disease    | Random Forest | Creatinine, BUN, eGFR, uric acid      | 88%+            |
| Liver Disease     | LightGBM      | ALT, AST, bilirubin, albumin          | 86%+            |

**Model Training Pipeline**:
```python
# Example: Heart Disease Risk Model
import xgboost as xgb
from sklearn.model_selection import cross_val_score

features = [
    'age', 'gender', 'total_cholesterol', 'hdl_cholesterol',
    'ldl_cholesterol', 'triglycerides', 'systolic_bp', 'diastolic_bp',
    'fasting_glucose', 'bmi', 'smoking_status', 'exercise_frequency',
    'family_history_heart', 'diabetes_status'
]

model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective='binary:logistic',
    eval_metric='auc'
)

# Train on MIMIC-IV derived features
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=20)

# Export for production
model.save_model('models/heart_disease_v1.json')
```

**Production Inference API**:
```python
@app.post("/api/v1/ai/predict-risk")
async def predict_risk(data: RiskPredictionInput):
    features = extract_features(data)
    predictions = {
        "diabetes": diabetes_model.predict_proba(features)[0][1],
        "heart_disease": heart_model.predict_proba(features)[0][1],
        "thyroid": thyroid_model.predict_proba(features)[0][1],
    }
    return {"risks": predictions, "timestamp": datetime.utcnow()}
```

### G. Medicine Recognition AI

**Purpose**: Identify medicines from photos and provide information

| Component        | Model/API          | Purpose                      |
|------------------|--------------------|------------------------------|
| Object Detection | YOLOv8             | Detect medicine in image     |
| Text Recognition | Google Cloud Vision | Read medicine label text     |
| Classification   | Vision Transformer | Classify medicine type       |
| Database Match   | Fuzzy search       | Match to DrugBank database   |

**Pipeline**:
```
Medicine Photo
    ↓
┌──────────────────┐
│ YOLOv8 Detection │ → Crop medicine region
└────────┬─────────┘
         ↓
┌──────────────────┐
│ OCR on Label     │ → Extract text: "DOLO 650", "Paracetamol"
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Fuzzy DB Match   │ → Match to DrugBank: drug_id = "DB00316"
└────────┬─────────┘
         ↓
┌──────────────────┐
│ LLM Enrichment   │ → Generate uses, side effects, interactions
└──────────────────┘
```

### H. Multilingual Translation

**Purpose**: Explain reports in local languages (Hindi, Tamil, Telugu, etc.)

| Tool                       | Supported Languages | Accuracy | Cost          |
|----------------------------|---------------------|----------|---------------|
| Google Translate API       | 130+                | Good     | $20/1M chars  |
| Multilingual LLM (Gemini) | 40+                 | Better   | Token-based   |
| IndicTrans2 (AI4Bharat)   | 22 Indian languages | Best     | Self-hosted   |

**Implementation Strategy**:
```
English AI output
    ↓
Language detection (user preference)
    ↓
If Hindi/Indian language → IndicTrans2 (higher accuracy)
If other → Google Translate API
    ↓
Post-process medical terms (keep English originals in parentheses)
    ↓
"आपका हीमोग्लोबिन (Hemoglobin) स्तर कम है — 10.2 g/dL"
```

---

## 4. MEDICAL DATASETS FOR TRAINING

### ⚠️ Legal & Licensing Notes

All datasets below are **open research datasets** available for commercial use with proper attribution. Always verify the latest license terms.

### 4.1 Clinical & Lab Data

| Dataset     | Source            | Contains                        | Size        | License      | Use Case                |
|-------------|-------------------|---------------------------------|-------------|--------------|-------------------------|
| MIMIC-IV    | PhysioNet/MIT     | ICU records, labs, diagnoses    | 40K+ patients| PhysioNet   | Disease prediction models|
| eICU        | PhysioNet         | Multi-center ICU data           | 200K+ stays | PhysioNet   | Critical care prediction |
| NHANES      | CDC               | US national health survey       | 10K+/year   | Public Domain| Population health stats  |

**MIMIC-IV Access Steps**:
```
1. Create account at physionet.org
2. Complete CITI training (human subjects research)
3. Sign data use agreement
4. Download via: wget -r -N -c https://physionet.org/files/mimiciv/2.2/
5. Load into PostgreSQL for feature engineering
```

### 4.2 Biomedical Knowledge

| Dataset        | Source         | Contains                  | Size          | Use Case                |
|----------------|---------------|---------------------------|---------------|-------------------------|
| PubMed         | NIH/NLM       | Medical research papers   | 35M+ articles | AI knowledge base       |
| PubMed Central | NIH/NLM       | Full-text articles        | 8M+ articles  | RAG context retrieval   |
| UMLS           | NLM           | Medical terminology       | 4M+ concepts  | Entity normalization    |
| SNOMED CT      | IHTSDO        | Clinical terms            | 350K+ concepts| Standardized coding     |

### 4.3 Medical Q&A

| Dataset     | Source          | Contains                    | Size       | Use Case                |
|-------------|----------------|-----------------------------|------------|-------------------------|
| MedQuAD     | NIH/NLM        | Medical Q&A pairs           | 47K+ pairs | AI doctor chat training |
| HealthQA    | Microsoft      | Consumer health questions   | 1.5K pairs | FAQ training            |
| MedMCQA     | Research paper  | Medical MCQ + explanations  | 194K       | Knowledge validation    |
| PubMedQA    | Research paper  | Research-based Q&A          | 1K expert  | Evidence-based answers  |

### 4.4 Medical Imaging

| Dataset              | Source         | Contains               | Size       | Use Case           |
|----------------------|---------------|------------------------|------------|--------------------|
| CheXpert             | Stanford      | Chest X-rays + labels  | 224K images| X-ray AI           |
| NIH Chest X-ray14    | NIH           | Chest X-rays           | 112K images| X-ray classification|
| ISIC Archive         | ISIC          | Skin lesion images     | 70K+ images| Skin scanner AI    |
| PTB-XL               | PhysioNet     | ECG recordings         | 21K ECGs   | ECG interpreter    |
| BraTS                | MICCAI        | Brain MRI scans        | 2K+ scans  | MRI analysis       |

### 4.5 Drug & Medicine Data

| Dataset        | Source         | Contains                    | Size         | Use Case              |
|----------------|---------------|-----------------------------|--------------|-----------------------|
| DrugBank       | DrugBank.ca   | Drug info + interactions    | 14K+ drugs   | Medicine scanner      |
| OpenFDA        | FDA           | Adverse events, labels      | Millions     | Side effect data      |
| RxNorm         | NLM           | Drug naming standards       | 100K+ drugs  | Medicine normalization|
| DailyMed       | NLM           | FDA drug labels             | 140K+ labels | Dosage information    |

### 4.6 Indian-Specific Data

| Dataset                  | Source           | Contains                 | Use Case              |
|--------------------------|------------------|--------------------------|-----------------------|
| Indian Pharmacopoeia     | IPC              | Indian drug standards    | India medicine DB     |
| CDSCO Drug Database      | Govt. of India   | Approved drugs in India  | Regulatory compliance |
| NPPA Price List          | NPPA             | Drug price controls      | Price comparison      |

---

## 5. AI PIPELINE ARCHITECTURE

### 5.1 Complete Report Analysis Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                 REPORT ANALYSIS PIPELINE                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  STAGE 1: INTAKE (< 500ms)                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Validate file format (PDF/JPG/PNG/HEIC)              │  │
│  │ • Virus scan (ClamAV)                                  │  │
│  │ • Resize if > 10MB                                     │  │
│  │ • Store to S3: reports/{user_id}/{report_id}.pdf       │  │
│  │ • Create DB record: status = "processing"              │  │
│  │ • Queue Celery task                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  STAGE 2: OCR (1-3s)                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ IF printed text → Google Cloud Vision API               │  │
│  │ IF handwritten → TrOCR (HuggingFace)                   │  │
│  │ IF mixed → Both + merge results                        │  │
│  │ • Confidence score per text block                      │  │
│  │ • Detect tables → AWS Textract                         │  │
│  │ • Output: raw_ocr_text + structured tables             │  │
│  │ • Update DB: status = "ocr_complete"                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  STAGE 3: NLP ENTITY EXTRACTION (500ms-1s)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Run PubMedBERT NER on OCR text                       │  │
│  │ • Extract: test_name, value, unit, reference_range     │  │
│  │ • Classify status: normal / high / low / critical      │  │
│  │ • Detect: patient name, date, hospital, doctor         │  │
│  │ • Map to LOINC codes for standardization               │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  STAGE 4: AI ANALYSIS (2-5s)                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Load user health profile from DB                     │  │
│  │ • Load previous report data for trends                 │  │
│  │ • Retrieve relevant medical knowledge from Qdrant      │  │
│  │ • Send to LLM (Gemini 3 Flash):                       │  │
│  │   - Summary (2-3 sentences)                            │  │
│  │   - Test-by-test explanation                           │  │
│  │   - Overall risk assessment                            │  │
│  │   - Lifestyle recommendations                          │  │
│  │   - Suggested follow-up questions                      │  │
│  │ • Output: structured JSON                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  STAGE 5: RISK ENGINE (500ms)                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Feed extracted values to ML models:                  │  │
│  │   - Diabetes risk (XGBoost)                            │  │
│  │   - Heart disease risk (Random Forest)                 │  │
│  │   - Thyroid risk (LightGBM)                            │  │
│  │ • Compare with historical values for trend detection   │  │
│  │ • Generate health_insights records                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  STAGE 6: ALERT ENGINE (100ms)                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Check for critical values:                           │  │
│  │   - Glucose > 400 mg/dL → EMERGENCY                   │  │
│  │   - Hemoglobin < 7 g/dL → CRITICAL                    │  │
│  │   - Potassium > 6.0 mEq/L → EMERGENCY                │  │
│  │ • Check for worsening trends                           │  │
│  │ • Generate emergency_alerts if needed                  │  │
│  │ • Send push notification for critical alerts           │  │
│  │ • Update DB: status = "analyzed"                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  TOTAL PIPELINE TIME: 4-10 seconds                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Symptom Checker & Triage Pipeline

```
Patient Input:
  symptoms: ["chest pain", "shortness of breath"]
  severity: 8/10
  duration: "2 hours"
  age: 55, gender: male
  conditions: ["hypertension"]
      ↓
┌──────────────────────┐
│ Pre-screening        │ → Check for emergency red flags
│ (Rule-based)         │   chest pain + SOB + age > 50 → HIGH ALERT
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ AI Triage Engine     │ → LLM with structured tool calling
│ (Gemini 3 Flash)     │   Returns: urgency, conditions, tests, advice
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Routing Decision     │
│ EMERGENCY  → "Call 112 now" + nearest ER
│ HIGH       → "See doctor within 2 hours"
│ MODERATE   → "Book appointment today"
│ LOW        → "Self-care + monitor"
└──────────────────────┘
```

---

## 6. INFRASTRUCTURE & DEVOPS SPECIFICATIONS

### 6.1 Production Infrastructure (AWS)

```yaml
# AWS Infrastructure Stack
compute:
  api_servers:
    type: EC2 c6i.xlarge (4 vCPU, 8GB)
    count: 2 (auto-scaling 2-8)
    os: Ubuntu 22.04 LTS
    
  ml_inference:
    type: EC2 g5.xlarge (1 GPU, 16GB VRAM)
    count: 1 (auto-scaling 1-3)
    purpose: Self-hosted ML models (NER, OCR, risk models)
    
  celery_workers:
    type: EC2 c6i.large (2 vCPU, 4GB)
    count: 2 (auto-scaling 2-6)
    purpose: Async report processing

database:
  postgres:
    type: RDS db.r6g.large (2 vCPU, 16GB)
    storage: 100GB gp3
    multi_az: true
    backup: 7-day retention
    extensions: [pgvector, pg_trgm, earthdistance]
    
  redis:
    type: ElastiCache r6g.large
    purpose: Cache + Celery broker + session store
    
  qdrant:
    type: EC2 r6i.large (or Qdrant Cloud)
    storage: 50GB SSD
    purpose: Medical knowledge vector search

storage:
  s3:
    bucket: beedr-reports-prod
    lifecycle: Standard → IA after 90 days → Glacier after 365 days
    encryption: AES-256 server-side
    versioning: enabled

networking:
  vpc: 10.0.0.0/16
  subnets:
    public: 10.0.1.0/24, 10.0.2.0/24 (ALB, NAT)
    private: 10.0.10.0/24, 10.0.11.0/24 (API, workers)
    data: 10.0.20.0/24, 10.0.21.0/24 (RDS, Redis, Qdrant)
  
  load_balancer:
    type: ALB
    ssl: ACM certificate (*.beedr.in)
    health_check: /health every 30s
```

### 6.2 Docker Setup

```dockerfile
# Dockerfile — API Server
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-hin \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLP models at build time
RUN python -c "from transformers import AutoModel; AutoModel.from_pretrained('microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract')"

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```yaml
# docker-compose.yml — Development
version: '3.9'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://beedr:secret@db:5432/beedr
      - REDIS_URL=redis://redis:6379/0
      - QDRANT_URL=http://qdrant:6333
      - GOOGLE_CLOUD_VISION_KEY=${GCV_KEY}
      - OPENAI_API_KEY=${OPENAI_KEY}
      - LOVABLE_API_KEY=${LOVABLE_KEY}
    depends_on:
      - db
      - redis
      - qdrant

  celery_worker:
    build: .
    command: celery -A app.tasks worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=postgresql://beedr:secret@db:5432/beedr
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  celery_beat:
    build: .
    command: celery -A app.tasks beat --loglevel=info
    depends_on:
      - redis

  db:
    image: pgvector/pgvector:pg16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: beedr
      POSTGRES_USER: beedr
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  pgdata:
  qdrant_data:
```

### 6.3 Kubernetes Deployment

```yaml
# k8s/deployment-api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: beedr-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: beedr-api
  template:
    metadata:
      labels:
        app: beedr-api
    spec:
      containers:
      - name: api
        image: beedr/api:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "2000m"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: beedr-secrets
              key: database-url
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: beedr-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: beedr-api
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 6.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Bee.dr

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_DB: beedr_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt -r requirements-test.txt
      - run: pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v4

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ${{ secrets.ECR_REGISTRY }}/beedr-api:${{ github.sha }}
            ${{ secrets.ECR_REGISTRY }}/beedr-api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      - run: |
          aws eks update-kubeconfig --name beedr-prod
          kubectl set image deployment/beedr-api api=${{ secrets.ECR_REGISTRY }}/beedr-api:${{ github.sha }}
          kubectl rollout status deployment/beedr-api
```

### 6.5 Monitoring Stack

```yaml
# Prometheus metrics to track
metrics:
  - api_request_duration_seconds     # API latency
  - api_requests_total               # Request count by endpoint
  - ocr_processing_duration_seconds  # OCR pipeline time
  - ai_inference_duration_seconds    # LLM response time
  - report_analysis_total            # Reports analyzed
  - active_users_total               # DAU/MAU
  - error_rate                       # 5xx errors
  - celery_task_duration_seconds     # Worker task time
  - db_query_duration_seconds        # Database query time
  - qdrant_search_duration_seconds   # Vector search time

# Grafana dashboards
dashboards:
  - API Performance (latency, throughput, errors)
  - AI Pipeline (OCR time, LLM time, success rate)
  - User Activity (signups, reports uploaded, chats)
  - Infrastructure (CPU, memory, disk, network)
  - Cost Tracking (API calls, storage, compute)

# Alerting rules
alerts:
  - api_error_rate > 5% for 5min → PagerDuty
  - api_latency_p99 > 5s for 10min → Slack
  - celery_queue_depth > 100 for 5min → Slack
  - disk_usage > 80% → Slack
  - ai_api_cost_daily > $50 → Email
```

---

## 7. 30-DAY MVP ROADMAP (Production Migration)

### Overview

This assumes the **Lovable Cloud MVP is already live** (28 features). This roadmap covers migrating to production infrastructure.

```
Week 1: Core Backend + Auth + Storage
Week 2: OCR Pipeline + Report Analysis
Week 3: AI Chat (RAG) + Explanation Engine
Week 4: Medicine Scanner + Dashboard + Launch
```

### Week 1 — Core Infrastructure (Days 1-7)

| Day | Task                                        | Owner         | Deliverable                    |
|-----|---------------------------------------------|---------------|--------------------------------|
| 1   | Set up AWS VPC, subnets, security groups    | DevOps        | Network architecture           |
| 1   | Provision RDS PostgreSQL 16 + pgvector      | DevOps        | Database ready                 |
| 2   | Set up Redis ElastiCache                    | DevOps        | Cache + queue ready            |
| 2   | Create S3 bucket with lifecycle policies    | DevOps        | File storage ready             |
| 3   | FastAPI project scaffold + Docker setup     | Backend Dev   | API skeleton running           |
| 3   | Auth service: JWT + email signup/login      | Backend Dev   | User authentication            |
| 4   | Health profile CRUD APIs                    | Backend Dev   | Profile management             |
| 4   | File upload API + S3 integration            | Backend Dev   | Report upload working          |
| 5   | Database migration system (Alembic)         | Backend Dev   | Schema management              |
| 5   | CI/CD pipeline (GitHub Actions)             | DevOps        | Auto-deploy on merge           |
| 6   | API rate limiting + CORS                    | Backend Dev   | Security basics                |
| 6   | Prometheus + Grafana setup                  | DevOps        | Monitoring dashboard           |
| 7   | Integration testing + load testing          | QA            | Performance baseline           |

**Week 1 Milestone**: Backend API running with auth, profiles, file upload ✅

### Week 2 — OCR & Report Analysis (Days 8-14)

| Day | Task                                        | Owner         | Deliverable                    |
|-----|---------------------------------------------|---------------|--------------------------------|
| 8   | Google Cloud Vision API integration         | ML Engineer   | Printed text OCR               |
| 8   | TrOCR model setup (HuggingFace)             | ML Engineer   | Handwriting OCR                |
| 9   | Table extraction with AWS Textract          | ML Engineer   | Structured table data          |
| 9   | OCR post-processing & confidence scoring    | ML Engineer   | Clean OCR output               |
| 10  | PubMedBERT NER model fine-tuning setup      | ML Engineer   | Entity extraction pipeline     |
| 10  | Medical entity extraction pipeline          | ML Engineer   | Test names, values, units      |
| 11  | LLM analysis integration (Gemini/GPT)       | Backend Dev   | AI report interpretation       |
| 11  | Celery async pipeline for report processing | Backend Dev   | Non-blocking analysis          |
| 12  | Critical value detection engine             | ML Engineer   | Emergency alert system         |
| 12  | Report comparison API                       | Backend Dev   | Compare two reports            |
| 13  | Results UI API (test-by-test breakdown)     | Backend Dev   | Frontend-ready JSON            |
| 13  | Multi-language support (Hindi)              | ML Engineer   | Hindi explanations             |
| 14  | End-to-end pipeline testing                 | QA            | Upload → Analysis → Results    |

**Week 2 Milestone**: Full OCR → Analysis pipeline working ✅

### Week 3 — AI Chat + Prediction (Days 15-21)

| Day | Task                                        | Owner         | Deliverable                    |
|-----|---------------------------------------------|---------------|--------------------------------|
| 15  | Qdrant vector database setup                | ML Engineer   | Medical knowledge store        |
| 15  | Embed medical knowledge (PubMed, DrugBank)  | ML Engineer   | 50K+ vectors indexed           |
| 16  | RAG pipeline: retrieval + context assembly  | ML Engineer   | Context-aware chat             |
| 16  | Streaming SSE chat API                      | Backend Dev   | Real-time token streaming      |
| 17  | Conversation memory + history               | Backend Dev   | Multi-turn conversations       |
| 17  | Symptom checker API (structured output)     | ML Engineer   | Triage system                  |
| 18  | Disease risk prediction models (XGBoost)    | ML Engineer   | Diabetes/heart/thyroid risk    |
| 18  | Risk model training on MIMIC-IV features    | ML Engineer   | Validated accuracy > 85%       |
| 19  | Treatment plan generator                    | Backend Dev   | Evidence-based care plans      |
| 19  | AI triage urgency scoring                   | ML Engineer   | Emergency routing              |
| 20  | Voice-to-text integration (Whisper)         | Backend Dev   | Voice doctor input             |
| 20  | Suggested questions generator               | ML Engineer   | Context-aware follow-ups       |
| 21  | Chat safety filters + guardrails            | ML Engineer   | No harmful advice              |

**Week 3 Milestone**: AI chat with RAG + risk prediction working ✅

### Week 4 — Medicine + Launch (Days 22-30)

| Day | Task                                        | Owner         | Deliverable                    |
|-----|---------------------------------------------|---------------|--------------------------------|
| 22  | Medicine OCR + database matching            | ML Engineer   | Medicine identification        |
| 22  | DrugBank data import + search index         | Backend Dev   | 50K+ medicines searchable      |
| 23  | Drug interaction checker API                | ML Engineer   | Safety alerts                  |
| 23  | Price comparison API                        | Backend Dev   | Generic alternatives           |
| 24  | Doctor listing + search API                 | Backend Dev   | Doctor discovery               |
| 24  | Appointment booking system                  | Backend Dev   | Calendar + slots               |
| 25  | Push notification service (FCM)             | Backend Dev   | Alerts + reminders             |
| 25  | Medication reminder system                  | Backend Dev   | Scheduled notifications        |
| 26  | Health dashboard aggregation API            | Backend Dev   | All health data in one view    |
| 26  | Data export API (FHIR/PDF)                  | Backend Dev   | Report download                |
| 27  | Security audit + penetration testing        | DevOps        | Security hardened              |
| 27  | HIPAA compliance checklist                  | Legal         | Compliance documented          |
| 28  | Load testing (1000 concurrent users)        | DevOps/QA     | Performance validated          |
| 28  | API documentation (Swagger/Redoc)           | Backend Dev   | Developer docs                 |
| 29  | Staging deployment + UAT                    | DevOps        | Pre-production testing         |
| 30  | Production deployment + DNS                 | DevOps        | 🚀 LIVE                       |

**Week 4 Milestone**: Production-ready Bee.dr platform LAUNCHED ✅

---

## 8. API CONTRACT SPECIFICATIONS

### 8.1 Authentication

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "full_name": "Ravi Kumar"
}

Response 201:
{
  "user_id": "uuid",
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600
}
```

### 8.2 Report Upload & Analysis

```http
POST /api/v1/reports/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: report.pdf
language: "en" | "hi"

Response 202:
{
  "report_id": "uuid",
  "status": "processing",
  "estimated_time_seconds": 8,
  "poll_url": "/api/v1/reports/{report_id}"
}
```

```http
GET /api/v1/reports/{report_id}/analysis
Authorization: Bearer {token}

Response 200:
{
  "report_id": "uuid",
  "status": "analyzed",
  "summary": "Your blood report shows...",
  "health_score": 72,
  "tests": [
    {
      "name": "Hemoglobin",
      "value": 10.2,
      "unit": "g/dL",
      "normal_range": {"min": 12.0, "max": 16.0},
      "status": "low",
      "explanation": "Your hemoglobin is below normal...",
      "recommendations": ["Include iron-rich foods..."]
    }
  ],
  "risks": [
    {"condition": "Anemia", "level": "high", "score": 0.78}
  ],
  "lifestyle_recommendations": [
    {"category": "Diet", "advice": "Eat spinach, lentils...", "priority": "high"}
  ]
}
```

### 8.3 AI Chat (Streaming)

```http
POST /api/v1/ai/chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "messages": [
    {"role": "user", "content": "Why is my hemoglobin low?"}
  ],
  "report_id": "uuid"  // optional context
}

Response 200 (SSE stream):
data: {"choices":[{"delta":{"content":"Your"}}]}
data: {"choices":[{"delta":{"content":" hemoglobin"}}]}
data: {"choices":[{"delta":{"content":" level"}}]}
...
data: [DONE]
```

### 8.4 Symptom Checker

```http
POST /api/v1/ai/symptom-check
Content-Type: application/json
Authorization: Bearer {token}

{
  "symptoms": ["chest pain", "shortness of breath"],
  "severity": 8,
  "duration": "2 hours",
  "age": 55,
  "gender": "male",
  "chronic_conditions": ["hypertension"]
}

Response 200:
{
  "urgency": "high",
  "urgency_message": "Seek immediate medical attention",
  "possible_conditions": [
    {
      "name": "Acute Coronary Syndrome",
      "likelihood": "high",
      "description": "Possible heart-related emergency",
      "matching_symptoms": ["chest pain", "shortness of breath"]
    }
  ],
  "recommended_tests": [
    {"test_name": "ECG", "reason": "Check heart rhythm", "priority": "essential"},
    {"test_name": "Troponin", "reason": "Cardiac damage marker", "priority": "essential"}
  ],
  "see_doctor": true,
  "specialist_type": "Cardiologist"
}
```

---

## 9. SECURITY & COMPLIANCE

### 9.1 Data Security

```
┌──────────────────────────────────────────────┐
│           SECURITY LAYERS                     │
├──────────────────────────────────────────────┤
│ Transport:  TLS 1.3 everywhere               │
│ Auth:       JWT (RS256) + refresh tokens      │
│ API:        Rate limiting (100 req/min/user)  │
│ Storage:    AES-256 encryption at rest        │
│ Database:   Row Level Security (RLS)          │
│ Secrets:    AWS Secrets Manager               │
│ Network:    VPC + security groups             │
│ Logging:    Full audit trail (HIPAA)          │
│ Backup:     Daily automated + 30-day retain   │
└──────────────────────────────────────────────┘
```

### 9.2 HIPAA Compliance Checklist

| Requirement                    | Implementation                           | Status    |
|--------------------------------|------------------------------------------|-----------|
| Data encryption at rest        | AES-256 (RDS, S3)                        | Required  |
| Data encryption in transit     | TLS 1.3                                  | Required  |
| Access controls                | RLS + JWT + role-based                   | Required  |
| Audit logging                  | All data access logged                   | Required  |
| Data backup & recovery         | Daily backups, 30-day retention          | Required  |
| Business Associate Agreements  | With all cloud providers                 | Required  |
| Employee training              | HIPAA training for all team members      | Required  |
| Incident response plan         | Documented breach notification process   | Required  |
| Data minimization              | Collect only necessary health data       | Required  |
| Patient consent                | Explicit consent before data processing  | Required  |

### 9.3 AI Safety Guardrails

```python
# Safety rules embedded in all AI prompts
SAFETY_RULES = """
NEVER DO:
- Diagnose diseases definitively
- Prescribe medications
- Recommend stopping prescribed medications
- Provide dosage changes
- Make emergency decisions for the user
- Store or repeat sensitive personal information

ALWAYS DO:
- Include disclaimer: "This is AI-generated, not medical advice"
- Recommend professional consultation for abnormal results
- Flag emergency values immediately
- Refer to specialists when appropriate
- Use evidence-based medical information only
"""
```

---

## 10. COST ESTIMATION

### 10.1 MVP Phase (0-1K users)

| Component              | Service          | Monthly Cost  |
|------------------------|------------------|---------------|
| API Server             | EC2 t3.medium    | $30           |
| Database               | RDS db.t3.medium | $35           |
| Redis                  | ElastiCache t3   | $15           |
| S3 Storage             | Standard         | $5            |
| Google Cloud Vision    | ~5K calls        | $8            |
| AI LLM API             | Gemini/GPT       | $50           |
| Qdrant                 | Self-hosted      | $0 (on EC2)   |
| Domain + SSL           | Route53 + ACM    | $2            |
| **Total**              |                  | **~$145/mo**  |

### 10.2 Growth Phase (1K-10K users)

| Component              | Service              | Monthly Cost  |
|------------------------|----------------------|---------------|
| API Servers (2x)       | EC2 c6i.large        | $120          |
| ML Server (GPU)        | EC2 g5.xlarge        | $160          |
| Database               | RDS db.r6g.large     | $180          |
| Redis                  | ElastiCache r6g      | $80           |
| S3 Storage             | ~500GB               | $12           |
| Google Cloud Vision    | ~50K calls           | $75           |
| AI LLM API             | Gemini/GPT           | $300          |
| Qdrant Cloud           | Managed              | $50           |
| CloudFront CDN         | Standard             | $30           |
| Monitoring             | Prometheus + Grafana  | $20           |
| **Total**              |                      | **~$1,027/mo**|

### 10.3 Scale Phase (10K-100K users)

| Component              | Service              | Monthly Cost   |
|------------------------|----------------------|----------------|
| EKS Cluster            | Kubernetes           | $500           |
| API Pods (4-8x)        | Auto-scaling         | $400           |
| ML Pods (2-3x)         | GPU instances         | $500           |
| Database               | RDS db.r6g.xlarge    | $500           |
| Redis Cluster          | ElastiCache          | $200           |
| S3 Storage             | ~5TB                 | $115           |
| AI APIs                | High volume          | $1,500         |
| Qdrant Cloud           | Production           | $200           |
| CDN + WAF              | CloudFront + Shield  | $150           |
| Monitoring + Logging   | Full stack           | $100           |
| **Total**              |                      | **~$4,165/mo** |

---

## 11. SCALING STRATEGY

### 11.1 Horizontal Scaling Plan

```
Phase 1 (MVP):          Single server, managed DB
                        ↓
Phase 2 (1K users):     2 API servers, dedicated ML server
                        ↓  
Phase 3 (10K users):    Kubernetes, auto-scaling, read replicas
                        ↓
Phase 4 (100K users):   Multi-region, CDN, sharded DB
                        ↓
Phase 5 (1M+ users):    Microservices, event-driven, ML platform
```

### 11.2 Database Scaling Strategy

```
Stage 1: Single PostgreSQL instance
Stage 2: Read replicas (separate read/write)
Stage 3: Connection pooling (PgBouncer)
Stage 4: Table partitioning (by user_id range)
Stage 5: Citus for distributed PostgreSQL
```

### 11.3 AI Model Scaling

```
Stage 1: API calls (Gemini/GPT via gateway)
Stage 2: Self-hosted smaller models (NER, risk prediction)
Stage 3: Model serving platform (TorchServe / Triton)
Stage 4: Model distillation (smaller, faster custom models)
Stage 5: Edge deployment (on-device for basic features)
```

---

## 12. TEAM REQUIREMENTS

### Minimum Team for 30-Day MVP

| Role              | Count | Key Skills                                  |
|-------------------|-------|---------------------------------------------|
| Backend Engineer  | 1-2   | FastAPI, PostgreSQL, AWS, Docker             |
| ML Engineer       | 1     | PyTorch, HuggingFace, NLP, XGBoost          |
| Frontend Engineer | 1     | React/Flutter, TypeScript, API integration   |
| DevOps Engineer   | 1     | AWS, K8s, Docker, CI/CD, monitoring          |
| Product Manager   | 1     | Healthcare domain, user research             |
| **Total**         | **5-6**|                                             |

### Key Hiring Priorities
1. **ML Engineer** with medical NLP experience — critical for accuracy
2. **Backend Engineer** with healthcare/fintech experience — HIPAA compliance
3. **DevOps** with AWS production experience — reliability

---

## 13. QUICK-START COMMANDS

### For Developers — Local Setup

```bash
# Clone and setup
git clone https://github.com/beedr/backend.git
cd backend

# Start infrastructure
docker-compose up -d db redis qdrant

# Install Python dependencies
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed test data
python scripts/seed_data.py

# Start API server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks worker --loglevel=info

# Run tests
pytest --cov=app
```

### For DevOps — Production Deployment

```bash
# Build and push Docker image
docker build -t beedr/api:latest .
docker push $ECR_REGISTRY/beedr-api:latest

# Deploy to EKS
kubectl apply -f k8s/
kubectl rollout status deployment/beedr-api

# Verify health
curl https://api.beedr.in/health

# Check logs
kubectl logs -f deployment/beedr-api

# Scale
kubectl scale deployment/beedr-api --replicas=4
```

---

## 14. APPENDIX

### A. Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/beedr
REDIS_URL=redis://host:6379/0

# AI APIs
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
LOVABLE_API_KEY=...  # Auto-provisioned in Lovable Cloud
ELEVENLABS_API_KEY=...

# Cloud Services
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET=beedr-reports-prod

# Google Cloud Vision
GOOGLE_CLOUD_VISION_KEY=...

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...

# Push Notifications
FCM_SERVER_KEY=...

# Security
JWT_SECRET_KEY=...
JWT_ALGORITHM=RS256
ENCRYPTION_KEY=...
```

### B. Critical Success Metrics

| Metric                    | Target       | Measurement             |
|---------------------------|-------------|-------------------------|
| OCR Accuracy              | > 95%        | Character error rate     |
| Report Analysis Time      | < 10 seconds | End-to-end pipeline      |
| AI Chat Response Time     | < 3 seconds  | First token latency      |
| Risk Prediction Accuracy  | > 85%        | AUC-ROC on test set      |
| API Uptime                | > 99.5%      | Monthly availability     |
| API Latency (p99)         | < 2 seconds  | 99th percentile          |
| User Retention (D7)       | > 40%        | Weekly active users      |

### C. References & Resources

- [MIMIC-IV Dataset](https://physionet.org/content/mimiciv/)
- [PubMedBERT](https://huggingface.co/microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract)
- [BioBERT](https://github.com/dmis-lab/biobert)
- [TrOCR](https://huggingface.co/microsoft/trocr-large-handwritten)
- [DrugBank](https://go.drugbank.com/)
- [MedQuAD](https://github.com/abachaa/MedQuAD)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

---

> **Document maintained by**: Bee.dr Engineering Team  
> **Next review**: April 2026  
> **Questions**: engineering@beedr.in
