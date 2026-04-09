CREATE OR REPLACE FUNCTION public.normalize_medicine_search(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    regexp_replace(
      regexp_replace(lower(coalesce(input_text, '')), '[^a-z0-9]+', ' ', 'g'),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;

CREATE TABLE public.medicine_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  generic_name TEXT,
  synonyms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  normalized_brand_name TEXT NOT NULL DEFAULT '',
  normalized_generic_name TEXT,
  normalized_synonyms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  product_ndc TEXT,
  rxcui TEXT,
  spl_set_id TEXT,
  dosage_form TEXT,
  route TEXT,
  strength TEXT,
  manufacturer TEXT,
  description TEXT,
  uses JSONB NOT NULL DEFAULT '[]'::JSONB,
  warnings JSONB NOT NULL DEFAULT '[]'::JSONB,
  contraindications JSONB NOT NULL DEFAULT '[]'::JSONB,
  side_effects JSONB NOT NULL DEFAULT '{"common":[],"serious":[],"rare":[]}'::JSONB,
  dosage_info JSONB NOT NULL DEFAULT '{}'::JSONB,
  interactions JSONB NOT NULL DEFAULT '[]'::JSONB,
  storage TEXT,
  price_range TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.medicine_catalog IS 'Reference medicine catalog sourced from RxNorm, DailyMed, and related public drug references.';

CREATE INDEX idx_medicine_catalog_normalized_brand_name
  ON public.medicine_catalog (normalized_brand_name);
CREATE INDEX idx_medicine_catalog_normalized_generic_name
  ON public.medicine_catalog (normalized_generic_name);
CREATE INDEX idx_medicine_catalog_rxcui
  ON public.medicine_catalog (rxcui);
CREATE INDEX idx_medicine_catalog_product_ndc
  ON public.medicine_catalog (product_ndc);

CREATE OR REPLACE FUNCTION public.set_medicine_catalog_normalized_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.synonyms := COALESCE(NEW.synonyms, ARRAY[]::TEXT[]);
  NEW.normalized_brand_name := public.normalize_medicine_search(NEW.brand_name);
  NEW.normalized_generic_name := NULLIF(public.normalize_medicine_search(NEW.generic_name), '');
  NEW.normalized_synonyms := COALESCE(
    ARRAY(
      SELECT DISTINCT normalized_value
      FROM (
        SELECT NULLIF(public.normalize_medicine_search(alias_value), '') AS normalized_value
        FROM unnest(NEW.synonyms) AS alias_value
      ) AS aliases
      WHERE normalized_value IS NOT NULL
    ),
    ARRAY[]::TEXT[]
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_medicine_catalog_normalized_fields
  BEFORE INSERT OR UPDATE ON public.medicine_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.set_medicine_catalog_normalized_fields();

CREATE TRIGGER update_medicine_catalog_updated_at
  BEFORE UPDATE ON public.medicine_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.medicine_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medicine catalog"
  ON public.medicine_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.search_medicine_catalog(
  query_text text,
  match_limit integer DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_key TEXT,
  brand_name TEXT,
  generic_name TEXT,
  synonyms TEXT[],
  product_ndc TEXT,
  rxcui TEXT,
  spl_set_id TEXT,
  dosage_form TEXT,
  route TEXT,
  strength TEXT,
  manufacturer TEXT,
  description TEXT,
  uses JSONB,
  warnings JSONB,
  contraindications JSONB,
  side_effects JSONB,
  dosage_info JSONB,
  interactions JSONB,
  storage TEXT,
  price_range TEXT,
  image_urls JSONB,
  metadata JSONB,
  search_score INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH needle AS (
    SELECT public.normalize_medicine_search(query_text) AS q
  ),
  ranked AS (
    SELECT
      mc.*,
      (
        CASE
          WHEN n.q = '' THEN 0
          WHEN mc.normalized_brand_name = n.q THEN 1000
          WHEN mc.normalized_generic_name = n.q THEN 980
          WHEN n.q = ANY(mc.normalized_synonyms) THEN 960
          WHEN mc.normalized_brand_name LIKE n.q || '%' THEN 920
          WHEN mc.normalized_generic_name LIKE n.q || '%' THEN 900
          WHEN EXISTS (
            SELECT 1
            FROM unnest(mc.normalized_synonyms) AS synonym
            WHERE synonym LIKE n.q || '%'
          ) THEN 880
          WHEN mc.normalized_brand_name LIKE '%' || n.q || '%' THEN 840
          WHEN mc.normalized_generic_name LIKE '%' || n.q || '%' THEN 820
          WHEN EXISTS (
            SELECT 1
            FROM unnest(mc.normalized_synonyms) AS synonym
            WHERE synonym LIKE '%' || n.q || '%'
          ) THEN 800
          ELSE 0
        END
        + CASE WHEN mc.rxcui IS NOT NULL THEN 10 ELSE 0 END
        + CASE WHEN mc.spl_set_id IS NOT NULL THEN 5 ELSE 0 END
        + CASE WHEN jsonb_array_length(mc.uses) > 0 THEN 5 ELSE 0 END
      )::INTEGER AS search_score
    FROM public.medicine_catalog AS mc
    CROSS JOIN needle AS n
  )
  SELECT
    id,
    source_key,
    brand_name,
    generic_name,
    synonyms,
    product_ndc,
    rxcui,
    spl_set_id,
    dosage_form,
    route,
    strength,
    manufacturer,
    description,
    uses,
    warnings,
    contraindications,
    side_effects,
    dosage_info,
    interactions,
    storage,
    price_range,
    image_urls,
    metadata,
    search_score
  FROM ranked
  WHERE search_score > 0
  ORDER BY search_score DESC, brand_name ASC
  LIMIT GREATEST(COALESCE(match_limit, 5), 1);
$$;

GRANT EXECUTE ON FUNCTION public.search_medicine_catalog(text, integer) TO anon, authenticated;
