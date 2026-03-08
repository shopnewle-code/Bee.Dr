# Bee.dr — Complete Backend Architecture Blueprint
## AI-Powered Healthcare Platform

> **Version**: 2.0 | **Last Updated**: March 2026
> **Status**: Production Architecture Design

---

## 1. SYSTEM OVERVIEW

Bee.dr is a scalable AI healthcare assistant platform. This document covers the complete
backend architecture for production deployment at scale (millions of users).

### Current Stack (Lovable Cloud / MVP)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **AI Gateway**: Lovable AI (Gemini / GPT models)
- **Hosting**: Lovable Cloud

### Production Stack (Scale Migration)
- **API Layer**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL 16 + pgvector
- **Vector DB**: Qdrant (medical knowledge retrieval)
- **Cache**: Redis 7
- **Task Queue**: Celery + Redis
- **File Storage**: AWS S3 / Supabase Storage
- **Auth**: JWT + OAuth 2.0 (Google, Apple)
- **AI Models**: OpenAI GPT-5, Google Gemini, HuggingFace medical models
- **OCR**: Google Cloud Vision API + TrOCR
- **Search**: Elasticsearch (medicine/doctor search)
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions + Docker + Kubernetes

---

## 2. MICROSERVICES ARCHITECTURE

```
                    ┌─────────────────────────────────────────┐
                    │              API GATEWAY                 │
                    │         (Kong / Nginx / Traefik)         │
                    └──────────────┬──────────────────────────┘
                                   │
        ┌──────────┬───────────┬───┴────┬──────────┬──────────┐
        │          │           │        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼────┐
   │  Auth  │ │ Report │ │  AI   │ │ Med  │ │Doctor │ │  Map   │
   │Service │ │Service │ │ Chat  │ │Store │ │Service│ │Service │
   └────┬───┘ └───┬────┘ └───┬───┘ └──┬───┘ └───┬───┘ └───┬────┘
        │         │          │        │         │         │
        └─────────┴──────────┴────────┴─────────┴─────────┘
                              │
                    ┌─────────▼──────────┐
                    │   PostgreSQL 16    │
                    │   + pgvector       │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │  Redis 7  │  │  Qdrant   │  │  AWS S3   │
        │  Cache +  │  │  Vector   │  │  File     │
        │  Queue    │  │  Search   │  │  Storage  │
        └───────────┘  └───────────┘  └───────────┘
```

### Service Registry

| Service           | Port  | Description                          |
|-------------------|-------|--------------------------------------|
| api-gateway       | 8000  | Route + rate limit + auth verify     |
| auth-service      | 8001  | JWT, OAuth, user management          |
| report-service    | 8002  | Upload, OCR, analysis pipeline       |
| ai-chat-service   | 8003  | Context-aware medical chat           |
| medicine-service  | 8004  | Scanner, marketplace, inventory      |
| doctor-service    | 8005  | Consultations, scheduling            |
| map-service       | 8006  | Geolocation, nearby services         |
| notification-svc  | 8007  | Push, email, SMS, reminders          |
| worker-service    | 8010  | Celery workers for async tasks       |

---

## 3. DATABASE SCHEMA (PostgreSQL 16)

### 3.1 Core Tables

```sql
-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT,
    auth_provider   VARCHAR(20) DEFAULT 'email',  -- email, google, apple
    email_verified  BOOLEAN DEFAULT FALSE,
    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================================
-- HEALTH PROFILES
-- ============================================================

CREATE TABLE health_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name            TEXT,
    date_of_birth           DATE,
    gender                  VARCHAR(20),
    blood_group             VARCHAR(10),
    height_cm               NUMERIC(5,2),
    weight_kg               NUMERIC(5,2),
    allergies               TEXT[] DEFAULT '{}',
    chronic_conditions      TEXT[] DEFAULT '{}',
    family_disease_history  TEXT[] DEFAULT '{}',
    smoking                 VARCHAR(20) DEFAULT 'none',
    alcohol                 VARCHAR(20) DEFAULT 'none',
    exercise_frequency      VARCHAR(20) DEFAULT 'moderate',
    diet_type               VARCHAR(20) DEFAULT 'mixed',
    sleep_pattern           VARCHAR(20) DEFAULT 'normal',
    address                 TEXT,
    city                    VARCHAR(100),
    country                 VARCHAR(100),
    latitude                NUMERIC(10,7),
    longitude               NUMERIC(10,7),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_health_profiles_user ON health_profiles(user_id);

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================

CREATE TABLE family_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    relation        VARCHAR(50) NOT NULL,
    age             INTEGER,
    gender          VARCHAR(20),
    blood_group     VARCHAR(10),
    health_score    INTEGER DEFAULT 0,
    risk_summary    JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_owner ON family_members(owner_id);

-- ============================================================
-- MEDICAL REPORTS
-- ============================================================

CREATE TABLE medical_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id),
    file_name       TEXT NOT NULL,
    file_path       TEXT NOT NULL,           -- S3 path: reports/{user_id}/{report_id}.pdf
    file_type       VARCHAR(20) NOT NULL,    -- pdf, image, camera
    file_size_bytes BIGINT,
    status          VARCHAR(20) DEFAULT 'processing',  -- processing, ocr_complete, analyzed, failed
    raw_ocr_text    TEXT,
    structured_data JSONB,                   -- Extracted structured medical data
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON medical_reports(user_id);
CREATE INDEX idx_reports_status ON medical_reports(status);
CREATE INDEX idx_reports_created ON medical_reports(created_at DESC);

-- ============================================================
-- REPORT ANALYSIS (AI-generated insights)
-- ============================================================

CREATE TABLE report_analysis (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id               UUID NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users(id),
    summary                 TEXT,
    health_score            INTEGER,           -- 0-100
    risk_scores             JSONB,             -- {heart: 0.2, diabetes: 0.4, ...}
    insights                JSONB,             -- AI-generated insights array
    recommendations         JSONB,             -- Lifestyle recommendations
    abnormal_values         JSONB,             -- Flagged abnormal test values
    language                VARCHAR(5) DEFAULT 'en',
    ai_model_used           VARCHAR(100),
    processing_time_ms      INTEGER,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_report ON report_analysis(report_id);
CREATE INDEX idx_analysis_user ON report_analysis(user_id);

-- ============================================================
-- INDIVIDUAL TEST RESULTS (parsed from reports)
-- ============================================================

CREATE TABLE test_results (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id         UUID NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id),
    test_name         VARCHAR(200) NOT NULL,
    result_value      NUMERIC NOT NULL,
    unit              VARCHAR(50) DEFAULT '',
    normal_range_min  NUMERIC,
    normal_range_max  NUMERIC,
    status            VARCHAR(20) DEFAULT 'normal',  -- normal, high, low, critical
    category          VARCHAR(100),                   -- hematology, biochemistry, etc.
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_results_report ON test_results(report_id);
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_name ON test_results(test_name);

-- ============================================================
-- MEDICINES DATABASE
-- ============================================================

CREATE TABLE medicines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(300) NOT NULL,
    generic_name        VARCHAR(300),
    category            VARCHAR(100),
    manufacturer        VARCHAR(200),
    description         TEXT,
    uses                TEXT[] DEFAULT '{}',
    side_effects        JSONB,               -- {common: [], serious: [], rare: []}
    dosage_info         JSONB,               -- {adult: "", child: "", frequency: ""}
    warnings            TEXT[] DEFAULT '{}',
    contraindications   TEXT[] DEFAULT '{}',
    interactions        JSONB,               -- [{drug: "", severity: "", desc: ""}]
    requires_prescription BOOLEAN DEFAULT FALSE,
    image_url           TEXT,
    embedding           vector(768),          -- For semantic medicine search
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medicines_name ON medicines USING gin(name gin_trgm_ops);
CREATE INDEX idx_medicines_generic ON medicines USING gin(generic_name gin_trgm_ops);
CREATE INDEX idx_medicines_embedding ON medicines USING ivfflat(embedding vector_cosine_ops);

-- ============================================================
-- MEDICINE SCANS (user scanned medicines)
-- ============================================================

CREATE TABLE medicine_scans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_id     UUID REFERENCES medicines(id),
    input_type      VARCHAR(20) NOT NULL,    -- text, image, camera
    input_data      TEXT,                     -- medicine name or image path
    analysis        JSONB,                    -- AI analysis result
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_med_scans_user ON medicine_scans(user_id);

-- ============================================================
-- PHARMACIES
-- ============================================================

CREATE TABLE pharmacies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(300) NOT NULL,
    owner_user_id   UUID REFERENCES users(id),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    license_number  VARCHAR(100),
    rating          NUMERIC(3,2) DEFAULT 4.0,
    is_verified     BOOLEAN DEFAULT FALSE,
    is_open         BOOLEAN DEFAULT TRUE,
    operating_hours JSONB,                    -- {mon: {open: "8:00", close: "22:00"}, ...}
    delivery_radius_km NUMERIC(5,2) DEFAULT 5.0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_location ON pharmacies USING gist(
    ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);

-- ============================================================
-- PHARMACY PRODUCTS (inventory)
-- ============================================================

CREATE TABLE pharmacy_products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id     UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    medicine_id     UUID NOT NULL REFERENCES medicines(id),
    price           NUMERIC(10,2) NOT NULL,
    mrp             NUMERIC(10,2),
    discount_pct    NUMERIC(5,2) DEFAULT 0,
    stock_quantity  INTEGER DEFAULT 0,
    is_available    BOOLEAN DEFAULT TRUE,
    delivery_time   VARCHAR(50),              -- "30 min", "2 hrs"
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pharmacy_id, medicine_id)
);

CREATE INDEX idx_pharmacy_products_pharmacy ON pharmacy_products(pharmacy_id);
CREATE INDEX idx_pharmacy_products_medicine ON pharmacy_products(medicine_id);
CREATE INDEX idx_pharmacy_products_price ON pharmacy_products(price);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    pharmacy_id     UUID NOT NULL REFERENCES pharmacies(id),
    order_number    VARCHAR(20) UNIQUE NOT NULL,
    status          VARCHAR(30) DEFAULT 'pending',
        -- pending, confirmed, preparing, shipped, delivered, cancelled
    delivery_mode   VARCHAR(20) DEFAULT 'delivery',  -- delivery, pickup
    delivery_address TEXT,
    subtotal        NUMERIC(10,2) NOT NULL,
    delivery_fee    NUMERIC(10,2) DEFAULT 0,
    discount        NUMERIC(10,2) DEFAULT 0,
    total           NUMERIC(10,2) NOT NULL,
    payment_method  VARCHAR(30),
    payment_status  VARCHAR(20) DEFAULT 'pending',
    prescription_url TEXT,                    -- S3 path if Rx required
    notes           TEXT,
    estimated_delivery TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_pharmacy ON orders(pharmacy_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id     UUID NOT NULL REFERENCES medicines(id),
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10,2) NOT NULL,
    total_price     NUMERIC(10,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE doctors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    name                VARCHAR(200) NOT NULL,
    specialization      VARCHAR(100) NOT NULL,
    qualification       VARCHAR(300),
    experience_years    INTEGER DEFAULT 0,
    bio                 TEXT,
    avatar_url          TEXT,
    license_number      VARCHAR(100),
    hospital_affiliation VARCHAR(300),
    rating              NUMERIC(3,2) DEFAULT 4.5,
    total_consultations INTEGER DEFAULT 0,
    consultation_fee    NUMERIC(10,2) DEFAULT 500,
    is_available        BOOLEAN DEFAULT TRUE,
    available_modes     TEXT[] DEFAULT '{chat,video,voice}',
    languages           TEXT[] DEFAULT '{English}',
    location            VARCHAR(200),
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_rating ON doctors(rating DESC);
CREATE INDEX idx_doctors_available ON doctors(is_available);

-- ============================================================
-- CONSULTATIONS
-- ============================================================

CREATE TABLE consultations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    doctor_id           UUID NOT NULL REFERENCES doctors(id),
    consultation_type   VARCHAR(20) DEFAULT 'chat',  -- chat, video, voice
    status              VARCHAR(20) DEFAULT 'pending',
        -- pending, confirmed, in_progress, completed, cancelled
    appointment_time    TIMESTAMPTZ,
    duration_minutes    INTEGER,
    patient_symptoms    TEXT[] DEFAULT '{}',
    patient_notes       TEXT,
    doctor_notes        TEXT,
    prescription        JSONB,
    ai_summary          TEXT,
    report_ids          UUID[] DEFAULT '{}',  -- Linked report IDs
    rating              INTEGER,
    review              TEXT,
    payment_amount      NUMERIC(10,2),
    payment_status      VARCHAR(20) DEFAULT 'pending',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_user ON consultations(user_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_appointment ON consultations(appointment_time);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    conversation_id UUID,                     -- Group messages into conversations
    scan_id         UUID,                     -- Link to specific report
    consultation_id UUID REFERENCES consultations(id),
    sender_type     VARCHAR(20) NOT NULL,     -- user, ai, doctor
    message         TEXT NOT NULL,
    response        TEXT,
    metadata        JSONB,                    -- {model: "", tokens: 0, context_type: ""}
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);

-- ============================================================
-- HEALTH ALERTS & NOTIFICATIONS
-- ============================================================

CREATE TABLE health_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type      VARCHAR(30) DEFAULT 'critical',
        -- critical, warning, info, preventive
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    source_type     VARCHAR(30),              -- report, trend, prediction, reminder
    source_id       UUID,
    severity        INTEGER DEFAULT 5,        -- 1-10
    is_read         BOOLEAN DEFAULT FALSE,
    is_dismissed    BOOLEAN DEFAULT FALSE,
    action_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON health_alerts(user_id);
CREATE INDEX idx_alerts_unread ON health_alerts(user_id, is_read) WHERE NOT is_read;

-- ============================================================
-- MEDICATION REMINDERS
-- ============================================================

CREATE TABLE medications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100),
    frequency       VARCHAR(50) DEFAULT 'daily',
    time_of_day     TEXT[] DEFAULT '{morning}',
    start_date      DATE DEFAULT CURRENT_DATE,
    end_date        DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medications_user ON medications(user_id);
CREATE INDEX idx_medications_active ON medications(user_id, is_active) WHERE is_active;

-- ============================================================
-- DAILY CHECK-INS
-- ============================================================

CREATE TABLE daily_checkins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date            DATE DEFAULT CURRENT_DATE,
    mood            INTEGER,                  -- 1-5
    energy          INTEGER,                  -- 1-5
    sleep_hours     NUMERIC(4,2),
    sleep_quality   INTEGER,                  -- 1-5
    stress_level    INTEGER,                  -- 1-5
    water_glasses   INTEGER DEFAULT 0,
    exercise_minutes INTEGER DEFAULT 0,
    symptoms        TEXT[] DEFAULT '{}',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date DESC);

-- ============================================================
-- WEARABLE DATA
-- ============================================================

CREATE TABLE wearable_data (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type     VARCHAR(50) NOT NULL,     -- heart_rate, steps, sleep, spo2, calories
    value           NUMERIC NOT NULL,
    unit            VARCHAR(20) DEFAULT '',
    source          VARCHAR(50) DEFAULT 'manual',  -- apple_watch, fitbit, google_fit
    recorded_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wearable_user_type ON wearable_data(user_id, metric_type);
CREATE INDEX idx_wearable_recorded ON wearable_data(recorded_at DESC);

-- ============================================================
-- HEALTH INSIGHTS (AI-generated predictions)
-- ============================================================

CREATE TABLE health_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_type       VARCHAR(100) NOT NULL,    -- diabetes, heart_disease, thyroid
    risk_score      NUMERIC DEFAULT 0,        -- 0.0 to 1.0
    details         JSONB,
    data_sources    TEXT[] DEFAULT '{}',       -- Which data was used
    ai_model        VARCHAR(100),
    generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_user ON health_insights(user_id);
CREATE INDEX idx_insights_type ON health_insights(risk_type);

-- ============================================================
-- VACCINATIONS
-- ============================================================

CREATE TABLE vaccinations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vaccine_name        VARCHAR(200) NOT NULL,
    date_administered   DATE,
    next_due_date       DATE,
    provider            VARCHAR(200),
    batch_number        VARCHAR(100),
    is_completed        BOOLEAN DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_user ON vaccinations(user_id);

-- ============================================================
-- AUDIT LOG (HIPAA compliance)
-- ============================================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,    -- view_report, download, share, etc.
    resource_type   VARCHAR(50),
    resource_id     UUID,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TYPE app_role AS ENUM ('user', 'doctor', 'pharmacy_admin', 'admin');

CREATE TABLE user_roles (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    app_role NOT NULL,
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles ON user_roles(user_id);
```

---

## 4. API DESIGN (REST)

### 4.1 Authentication APIs

```
POST   /api/v1/auth/signup              Register new user
POST   /api/v1/auth/login               Email + password login
POST   /api/v1/auth/google              Google OAuth login
POST   /api/v1/auth/apple               Apple OAuth login
POST   /api/v1/auth/refresh             Refresh JWT token
POST   /api/v1/auth/forgot-password     Send reset email
POST   /api/v1/auth/reset-password      Reset with token
POST   /api/v1/auth/verify-email        Verify email address
DELETE /api/v1/auth/logout              Invalidate session
```

### 4.2 User & Health Profile APIs

```
GET    /api/v1/users/me                 Get current user
PUT    /api/v1/users/me                 Update profile
DELETE /api/v1/users/me                 Delete account (GDPR)
GET    /api/v1/users/me/health-profile  Get health profile
PUT    /api/v1/users/me/health-profile  Update health profile
GET    /api/v1/users/me/health-score    Get AI health score
```

### 4.3 Medical Report APIs

```
POST   /api/v1/reports/upload           Upload report (multipart)
GET    /api/v1/reports                  List user reports
GET    /api/v1/reports/{id}             Get report detail
GET    /api/v1/reports/{id}/analysis    Get AI analysis
POST   /api/v1/reports/{id}/analyze     Trigger re-analysis
GET    /api/v1/reports/{id}/tests       Get individual test results
POST   /api/v1/reports/compare          Compare two reports
DELETE /api/v1/reports/{id}             Delete report
```

### 4.4 AI Chat APIs

```
POST   /api/v1/ai/chat                 Send message (streaming SSE)
POST   /api/v1/ai/chat/report          Chat about specific report
GET    /api/v1/ai/conversations         List conversations
GET    /api/v1/ai/conversations/{id}    Get conversation messages
POST   /api/v1/ai/symptom-check        Symptom checker
POST   /api/v1/ai/predictive           Predictive health analysis
```

### 4.5 Medicine APIs

```
POST   /api/v1/medicines/scan           Scan medicine (text/image)
GET    /api/v1/medicines/search          Search medicines
GET    /api/v1/medicines/{id}            Get medicine info
GET    /api/v1/medicines/{id}/prices     Price comparison
GET    /api/v1/medicines/{id}/alternatives  Generic alternatives
```

### 4.6 Pharmacy Marketplace APIs

```
GET    /api/v1/pharmacies/nearby         Nearby pharmacies (lat/lng)
GET    /api/v1/pharmacies/{id}           Pharmacy detail
GET    /api/v1/pharmacies/{id}/products  Pharmacy inventory
POST   /api/v1/orders                    Create order
GET    /api/v1/orders                    List user orders
GET    /api/v1/orders/{id}               Order detail
PUT    /api/v1/orders/{id}/cancel        Cancel order
GET    /api/v1/orders/{id}/track         Track delivery
```

### 4.7 Pharmacy Partner APIs (B2B)

```
POST   /api/v1/partner/register          Register pharmacy
GET    /api/v1/partner/dashboard          Dashboard stats
POST   /api/v1/partner/products           Add product
PUT    /api/v1/partner/products/{id}      Update product
DELETE /api/v1/partner/products/{id}      Remove product
GET    /api/v1/partner/orders             View orders
PUT    /api/v1/partner/orders/{id}        Update order status
GET    /api/v1/partner/analytics          Sales analytics
```

### 4.8 Doctor Consultation APIs

```
GET    /api/v1/doctors                    List/search doctors
GET    /api/v1/doctors/{id}               Doctor profile
GET    /api/v1/doctors/{id}/availability  Available slots
POST   /api/v1/consultations/book         Book consultation
GET    /api/v1/consultations              User's consultations
GET    /api/v1/consultations/{id}         Consultation detail
PUT    /api/v1/consultations/{id}         Update (rating, notes)
POST   /api/v1/consultations/{id}/join    Join video/voice call
```

### 4.9 Health Map APIs

```
GET    /api/v1/map/nearby                 All nearby health services
GET    /api/v1/map/pharmacies             Nearby pharmacies
GET    /api/v1/map/hospitals              Nearby hospitals
GET    /api/v1/map/clinics                Nearby clinics
GET    /api/v1/map/labs                   Nearby diagnostic labs
GET    /api/v1/map/{place_id}             Place detail
```

Query parameters: `lat`, `lng`, `radius_km`, `type`, `is_open`, `min_rating`

### 4.10 Health Tracking APIs

```
POST   /api/v1/checkins                   Daily check-in
GET    /api/v1/checkins                   Check-in history
GET    /api/v1/trends                     Health trends
POST   /api/v1/medications                Add medication
GET    /api/v1/medications                List medications
PUT    /api/v1/medications/{id}           Update medication
DELETE /api/v1/medications/{id}           Delete medication
POST   /api/v1/wearables/sync             Sync wearable data
GET    /api/v1/wearables/data             Get wearable data
GET    /api/v1/alerts                     Health alerts
PUT    /api/v1/alerts/{id}/dismiss        Dismiss alert
```

---

## 5. AI PIPELINE ARCHITECTURE

### 5.1 Report Analysis Pipeline

```
User Upload
    │
    ▼
┌──────────────────┐
│ 1. FILE INTAKE   │  Validate format, virus scan, store in S3
│    (FastAPI)      │  reports/{user_id}/{report_id}.pdf
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. OCR ENGINE    │  Google Cloud Vision API (printed text)
│    (Celery)      │  Microsoft TrOCR (handwritten text)
│                  │  Tesseract (fallback)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. ENTITY        │  BioBERT / PubMedBERT
│    EXTRACTION    │  Extract: test names, values, units, ranges
│    (NLP)         │  Medical NER (Named Entity Recognition)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. STRUCTURED    │  Map to standard medical ontologies
│    MAPPING       │  LOINC codes for lab tests
│                  │  ICD-10 codes for conditions
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. AI ANALYSIS   │  GPT-5 / Gemini Pro
│    (LLM)         │  Generate: summary, risks, recommendations
│                  │  Context: user health profile + history
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. RISK ENGINE   │  Custom ML models (scikit-learn / PyTorch)
│                  │  Predict: diabetes, heart, thyroid risk
│                  │  Input: all historical test results
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 7. ALERT CHECK   │  Critical value detection
│                  │  Trend analysis (worsening values)
│                  │  Generate emergency alerts if needed
└──────────────────┘
```

### 5.2 AI Models Used

| Model                  | Purpose                        | Provider    |
|------------------------|--------------------------------|-------------|
| Google Cloud Vision    | Printed text OCR               | GCP         |
| TrOCR (HuggingFace)   | Handwritten prescription OCR   | Self-hosted |
| BioBERT                | Medical entity extraction      | Self-hosted |
| PubMedBERT             | Medical NLP understanding      | Self-hosted |
| GPT-5 / Gemini Pro     | Report interpretation & chat   | API         |
| Custom XGBoost         | Disease risk prediction        | Self-hosted |
| CLIP (OpenAI)          | Medicine image recognition     | Self-hosted |
| Whisper                | Voice-to-text (voice doctor)   | API         |

### 5.3 Vector Database (Medical Knowledge)

```
Qdrant Collection: medical_knowledge
├── Lab test reference ranges (10K+ entries)
├── Drug information database (50K+ medicines)
├── Disease symptom mappings (5K+ conditions)
├── Treatment protocols (medical guidelines)
└── FAQ medical knowledge base

Embedding Model: text-embedding-3-large (OpenAI)
Dimension: 3072
Distance: Cosine similarity
```

**RAG Pipeline for AI Chat:**
```
User Question
    │
    ▼
Embed question → Search Qdrant (top-k=5)
    │
    ▼
Retrieve relevant medical context
    │
    ▼
Combine: user profile + report data + retrieved context
    │
    ▼
Send to LLM with medical system prompt
    │
    ▼
Stream response to user
```

---

## 6. FASTAPI PROJECT STRUCTURE

```
bee-dr-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry
│   ├── config.py                  # Settings (Pydantic BaseSettings)
│   ├── database.py                # SQLAlchemy + async sessions
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── health_profile.py
│   │   ├── medical_report.py
│   │   ├── test_result.py
│   │   ├── medicine.py
│   │   ├── pharmacy.py
│   │   ├── order.py
│   │   ├── doctor.py
│   │   ├── consultation.py
│   │   ├── chat_message.py
│   │   ├── health_alert.py
│   │   └── medication.py
│   │
│   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── report.py
│   │   ├── medicine.py
│   │   ├── pharmacy.py
│   │   ├── doctor.py
│   │   └── chat.py
│   │
│   ├── api/                       # API route handlers
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── reports.py
│   │   │   ├── ai_chat.py
│   │   │   ├── medicines.py
│   │   │   ├── pharmacies.py
│   │   │   ├── orders.py
│   │   │   ├── doctors.py
│   │   │   ├── consultations.py
│   │   │   ├── health_map.py
│   │   │   ├── health_tracking.py
│   │   │   └── partner.py
│   │   └── deps.py               # Dependency injection (auth, db)
│   │
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── report_service.py
│   │   ├── ocr_service.py
│   │   ├── ai_analysis_service.py
│   │   ├── chat_service.py
│   │   ├── medicine_service.py
│   │   ├── pharmacy_service.py
│   │   ├── order_service.py
│   │   ├── doctor_service.py
│   │   ├── map_service.py
│   │   ├── notification_service.py
│   │   ├── risk_prediction_service.py
│   │   └── wearable_service.py
│   │
│   ├── workers/                   # Celery background tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── report_worker.py      # OCR + analysis pipeline
│   │   ├── notification_worker.py
│   │   ├── alert_worker.py
│   │   └── prediction_worker.py
│   │
│   ├── ai/                        # AI/ML pipeline modules
│   │   ├── __init__.py
│   │   ├── ocr_engine.py         # OCR processing
│   │   ├── medical_ner.py        # Named entity recognition
│   │   ├── report_analyzer.py    # LLM-based analysis
│   │   ├── risk_predictor.py     # ML risk models
│   │   ├── medicine_identifier.py # Medicine image recognition
│   │   ├── symptom_checker.py    # Symptom → condition mapping
│   │   ├── embeddings.py         # Text embedding generation
│   │   └── rag_pipeline.py       # RAG for medical Q&A
│   │
│   ├── core/                      # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py           # JWT, password hashing
│   │   ├── storage.py            # S3 file operations
│   │   ├── email.py              # Email sending
│   │   ├── sms.py                # SMS notifications
│   │   └── cache.py              # Redis cache helpers
│   │
│   └── middleware/
│       ├── __init__.py
│       ├── auth_middleware.py
│       ├── rate_limiter.py
│       └── audit_logger.py
│
├── migrations/                    # Alembic migrations
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── test_auth.py
│   ├── test_reports.py
│   ├── test_ai_chat.py
│   └── test_medicines.py
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── docker-compose.yml
│
├── k8s/                           # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── hpa.yaml                  # Horizontal Pod Autoscaler
│
├── .env.example
├── requirements.txt
├── pyproject.toml
├── alembic.ini
└── README.md
```

---

## 7. EXAMPLE FASTAPI IMPLEMENTATIONS

### 7.1 Main Application Entry

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import (
    auth, users, reports, ai_chat, medicines,
    pharmacies, orders, doctors, consultations,
    health_map, health_tracking, partner
)
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.audit_logger import AuditLoggerMiddleware

app = FastAPI(
    title="Bee.dr API",
    description="AI-Powered Healthcare Platform",
    version="2.0.0",
    docs_url="/api/docs",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(AuditLoggerMiddleware)

# API Routes
app.include_router(auth.router,            prefix="/api/v1/auth",          tags=["Auth"])
app.include_router(users.router,           prefix="/api/v1/users",         tags=["Users"])
app.include_router(reports.router,         prefix="/api/v1/reports",       tags=["Reports"])
app.include_router(ai_chat.router,         prefix="/api/v1/ai",            tags=["AI Chat"])
app.include_router(medicines.router,       prefix="/api/v1/medicines",     tags=["Medicines"])
app.include_router(pharmacies.router,      prefix="/api/v1/pharmacies",    tags=["Pharmacies"])
app.include_router(orders.router,          prefix="/api/v1/orders",        tags=["Orders"])
app.include_router(doctors.router,         prefix="/api/v1/doctors",       tags=["Doctors"])
app.include_router(consultations.router,   prefix="/api/v1/consultations", tags=["Consultations"])
app.include_router(health_map.router,      prefix="/api/v1/map",           tags=["Health Map"])
app.include_router(health_tracking.router, prefix="/api/v1",               tags=["Health Tracking"])
app.include_router(partner.router,         prefix="/api/v1/partner",       tags=["Partner"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
```

### 7.2 Report Upload & Analysis Endpoint

```python
# app/api/v1/reports.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.api.deps import get_current_user, get_db
from app.services.report_service import ReportService
from app.workers.report_worker import process_report_task

router = APIRouter()

@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    db = Depends(get_db),
    user = Depends(get_current_user),
):
    # Validate file
    allowed = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Unsupported file type")
    if file.size > 20 * 1024 * 1024:  # 20MB
        raise HTTPException(400, "File too large (max 20MB)")

    # Store file and create record
    service = ReportService(db)
    report = await service.create_report(user.id, file)

    # Queue async processing (OCR → NER → Analysis)
    process_report_task.delay(str(report.id))

    return {
        "id": str(report.id),
        "file_name": report.file_name,
        "status": "processing",
        "message": "Report uploaded. AI analysis will be ready shortly."
    }

@router.get("/{report_id}/analysis")
async def get_analysis(
    report_id: str,
    language: str = "en",
    db = Depends(get_db),
    user = Depends(get_current_user),
):
    service = ReportService(db)
    analysis = await service.get_analysis(report_id, user.id, language)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    return analysis
```

### 7.3 AI Chat with Streaming

```python
# app/api/v1/ai_chat.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user, get_db
from app.services.chat_service import ChatService

router = APIRouter()

@router.post("/chat")
async def chat(
    request: ChatRequest,
    db = Depends(get_db),
    user = Depends(get_current_user),
):
    service = ChatService(db)

    # Build context: user profile + report data + medical knowledge (RAG)
    context = await service.build_context(
        user_id=user.id,
        report_id=request.report_id,
        conversation_id=request.conversation_id,
    )

    # Stream response
    async def generate():
        async for chunk in service.stream_response(
            messages=request.messages,
            context=context,
            model=request.model or "gpt-5",
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 7.4 Health Map with Geolocation

```python
# app/api/v1/health_map.py
from fastapi import APIRouter, Query, Depends
from app.services.map_service import MapService

router = APIRouter()

@router.get("/nearby")
async def get_nearby(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(5.0, le=50),
    type: str = Query(None, regex="^(pharmacy|hospital|clinic|lab)$"),
    is_open: bool = Query(None),
    min_rating: float = Query(None, ge=0, le=5),
    db = Depends(get_db),
):
    service = MapService(db)
    places = await service.find_nearby(
        lat=lat, lng=lng, radius_km=radius_km,
        place_type=type, is_open=is_open, min_rating=min_rating,
    )
    return {"results": places, "count": len(places)}
```

### 7.5 Celery Worker for Report Processing

```python
# app/workers/report_worker.py
from app.workers.celery_app import celery
from app.ai.ocr_engine import OCREngine
from app.ai.medical_ner import MedicalNER
from app.ai.report_analyzer import ReportAnalyzer
from app.ai.risk_predictor import RiskPredictor

@celery.task(bind=True, max_retries=3)
def process_report_task(self, report_id: str):
    try:
        # Step 1: OCR
        ocr = OCREngine()
        raw_text = ocr.extract_text(report_id)

        # Step 2: Medical Entity Extraction
        ner = MedicalNER()
        entities = ner.extract(raw_text)
        # → {test_name, value, unit, normal_range}

        # Step 3: AI Analysis (LLM)
        analyzer = ReportAnalyzer()
        analysis = analyzer.analyze(
            entities=entities,
            user_profile=get_user_profile(report_id),
            language="en",
        )

        # Step 4: Risk Prediction (ML)
        predictor = RiskPredictor()
        risks = predictor.predict(
            test_results=entities,
            user_history=get_user_history(report_id),
        )

        # Step 5: Save results
        save_analysis(report_id, analysis, risks)

        # Step 6: Check for critical values → alerts
        check_critical_values(report_id, entities)

    except Exception as exc:
        self.retry(exc=exc, countdown=60)
```

---

## 8. DEPLOYMENT ARCHITECTURE

```
                    ┌─────────────────────┐
                    │   CloudFlare CDN    │
                    │   + WAF + DDoS      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Load Balancer     │
                    │   (AWS ALB / Nginx) │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐
     │  API Server   │ │  API Server  │ │  API Server │
     │  (FastAPI)    │ │  (FastAPI)   │ │  (FastAPI)  │
     │  k8s Pod x3+  │ │  k8s Pod    │ │  k8s Pod   │
     └────────┬──────┘ └──────┬───────┘ └──────┬──────┘
              │               │                │
              └───────────────┼────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
  ┌──────▼──────┐   ┌────────▼───────┐   ┌────────▼──────┐
  │ PostgreSQL  │   │   Redis 7      │   │   AWS S3      │
  │ RDS (Multi-AZ)│ │   ElastiCache  │   │   File Store  │
  │ Read Replicas│  │   Cache+Queue  │   │   Reports/    │
  └─────────────┘   └────────────────┘   └───────────────┘
         │
  ┌──────▼──────┐   ┌────────────────┐
  │  Qdrant     │   │ Celery Workers │
  │  Vector DB  │   │ k8s Pod x5+   │
  │  Medical KB │   │ GPU instances  │
  └─────────────┘   └────────────────┘
```

### Kubernetes HPA (Auto-scaling)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: beedr-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: beedr-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## 9. SECURITY ARCHITECTURE

### 9.1 Authentication Flow

```
User Login Request
    │
    ▼
Validate credentials (bcrypt hash check)
    │
    ▼
Generate JWT (access_token: 15min, refresh_token: 7 days)
    │
    ▼
Store refresh token in Redis (revocable)
    │
    ▼
Return tokens to client
```

### 9.2 Security Measures

| Layer          | Implementation                              |
|----------------|---------------------------------------------|
| Transport      | TLS 1.3 everywhere                         |
| Authentication | JWT RS256 + refresh tokens                  |
| Authorization  | RBAC (user, doctor, pharmacy_admin, admin)  |
| Data at rest   | AES-256 encryption for medical files        |
| Data in transit| TLS + field-level encryption for PHI        |
| API Security   | Rate limiting, input validation, CORS       |
| File Storage   | Signed S3 URLs (15-min expiry)              |
| Audit          | Complete audit log (HIPAA compliance)       |
| Secrets        | AWS Secrets Manager / Vault                 |
| DDoS           | CloudFlare WAF + rate limiting              |

### 9.3 HIPAA Compliance Checklist

- [x] Encrypted data at rest and in transit
- [x] Role-based access control
- [x] Complete audit logging
- [x] Automatic session timeout
- [x] Data retention policies
- [x] User data deletion (GDPR right to erasure)
- [x] BAA with cloud providers
- [x] Incident response plan

---

## 10. BUSINESS MODEL IMPLEMENTATION

### Revenue Streams

| Stream                      | Model                    | Est. Revenue  |
|-----------------------------|--------------------------|---------------|
| AI Report Analysis          | Freemium (3 free/month)  | $2/analysis   |
| Doctor Consultations        | 15% platform commission  | $3-15/consult |
| Medicine Marketplace        | 8-12% commission         | $1-5/order    |
| Premium Subscription        | Monthly/Annual           | $5-15/month   |
| Pharmacy Partner Fees       | Monthly listing fee      | $50-200/month |
| Health Insurance Data       | B2B API (anonymized)     | Enterprise    |

### Subscription Tiers

```
FREE TIER
├── 3 report scans/month
├── Basic AI chat (10 messages/day)
├── Medicine scanner
├── Health map
└── Emergency card

PRO TIER ($9.99/month)
├── Unlimited report scans
├── Unlimited AI chat
├── Predictive health insights
├── Family profiles (up to 5)
├── Priority doctor matching
├── Health trends & comparisons
└── Wearable integration

ENTERPRISE TIER ($29.99/month)
├── Everything in Pro
├── API access
├── Dedicated AI models
├── White-label options
├── Priority support
└── Compliance reports
```

---

## 11. SCALING STRATEGY

### Phase 1: MVP (Current — 0-10K users)
- Lovable Cloud + Supabase
- Edge Functions for AI
- Single region deployment

### Phase 2: Growth (10K-100K users)
- Migrate to FastAPI + managed PostgreSQL
- Add Redis caching layer
- Celery workers for async processing
- Multi-region CDN

### Phase 3: Scale (100K-1M users)
- Kubernetes deployment (EKS/GKE)
- Read replicas for database
- Qdrant vector DB for medical knowledge
- Elasticsearch for search
- GPU instances for ML inference

### Phase 4: Global (1M+ users)
- Multi-region database (CockroachDB or Aurora Global)
- Edge computing for AI inference
- Custom fine-tuned medical models
- Real-time data pipelines (Kafka)
- ML model serving (TensorFlow Serving / Triton)

---

## 12. MONITORING & OBSERVABILITY

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Prometheus  │───▶│   Grafana    │    │  PagerDuty  │
│ (Metrics)   │    │ (Dashboards) │───▶│  (Alerts)   │
└─────────────┘    └──────────────┘    └─────────────┘
       │
┌──────▼──────┐    ┌──────────────┐
│   Jaeger    │    │   Sentry     │
│ (Tracing)   │    │  (Errors)    │
└─────────────┘    └──────────────┘
```

### Key Metrics to Monitor
- API response time (p50, p95, p99)
- AI inference latency
- OCR processing time
- Database query performance
- Cache hit rate
- Error rates by endpoint
- Active users (DAU/MAU)
- Report processing queue depth

---

*This architecture is designed to evolve from the current Lovable Cloud MVP
to a production-grade system serving millions of users globally.*
