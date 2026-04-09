CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm
    ON medicines
    USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name_trgm
    ON medicines
    USING gin (lower(coalesce(generic_name, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer_trgm
    ON medicines
    USING gin (lower(coalesce(manufacturer, '')) gin_trgm_ops);

CREATE OR REPLACE FUNCTION search_medicines(query_text TEXT, match_limit INT DEFAULT 20)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    generic_name TEXT,
    manufacturer TEXT,
    product_type TEXT,
    route TEXT,
    score REAL
)
LANGUAGE sql
STABLE
AS $$
WITH normalized AS (
    SELECT lower(trim(coalesce(query_text, ''))) AS q
),
ranked AS (
    SELECT
        m.id,
        m.name,
        m.generic_name,
        m.manufacturer,
        m.product_type,
        m.route,
        GREATEST(
            similarity(lower(m.name), n.q),
            similarity(lower(coalesce(m.generic_name, '')), n.q),
            CASE
                WHEN n.q = '' THEN 0
                ELSE similarity(lower(coalesce(m.manufacturer, '')), n.q) * 0.35
            END
        ) AS similarity_score,
        CASE
            WHEN lower(m.name) = n.q THEN 100
            WHEN lower(coalesce(m.generic_name, '')) = n.q THEN 96
            WHEN lower(m.name) LIKE n.q || '%' THEN 92
            WHEN lower(coalesce(m.generic_name, '')) LIKE n.q || '%' THEN 88
            WHEN lower(m.name) LIKE '%' || n.q || '%' THEN 84
            WHEN lower(coalesce(m.generic_name, '')) LIKE '%' || n.q || '%' THEN 80
            ELSE 0
        END AS lexical_boost
    FROM medicines AS m
    CROSS JOIN normalized AS n
    WHERE n.q <> ''
      AND (
          lower(m.name) % n.q
          OR lower(coalesce(m.generic_name, '')) % n.q
          OR lower(m.name) LIKE '%' || n.q || '%'
          OR lower(coalesce(m.generic_name, '')) LIKE '%' || n.q || '%'
      )
)
SELECT
    id,
    name,
    generic_name,
    manufacturer,
    product_type,
    route,
    (lexical_boost + (similarity_score * 100))::REAL AS score
FROM ranked
ORDER BY lexical_boost DESC, similarity_score DESC, length(name) ASC, id ASC
LIMIT GREATEST(1, LEAST(coalesce(match_limit, 20), 50));
$$;
