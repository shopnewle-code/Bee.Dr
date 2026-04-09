CREATE TABLE IF NOT EXISTS medicines (
    id BIGSERIAL PRIMARY KEY,
    set_id TEXT NOT NULL UNIQUE,
    label_id TEXT,
    name TEXT NOT NULL,
    generic_name TEXT,
    manufacturer TEXT,
    product_ndc TEXT,
    package_ndc TEXT,
    rxcui TEXT,
    product_type TEXT,
    route TEXT,
    indications TEXT,
    dosage TEXT,
    description TEXT,
    warnings TEXT,
    contraindications TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS side_effects (
    id BIGSERIAL PRIMARY KEY,
    drug_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    effect TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (drug_id, effect)
);

CREATE TABLE IF NOT EXISTS interactions (
    id BIGSERIAL PRIMARY KEY,
    drug_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    interacting_drug TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (drug_id, description)
);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines (name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines (generic_name);
CREATE INDEX IF NOT EXISTS idx_side_effects_drug_id ON side_effects (drug_id);
CREATE INDEX IF NOT EXISTS idx_interactions_drug_id ON interactions (drug_id);
