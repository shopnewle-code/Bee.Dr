import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SideEffects = {
  common?: string[];
  serious?: string[];
  rare?: string[];
};

type DosageInfo = {
  adult?: string;
  child?: string;
  frequency?: string;
  timing?: string;
};

type Interaction = {
  drug: string;
  severity: "high" | "medium" | "low";
  description: string;
};

type Alternative = {
  name: string;
  genericName?: string;
  priceComparison?: "cheaper" | "similar" | "expensive";
};

type MedicineData = {
  name: string;
  genericName?: string;
  category?: string;
  uses?: string[];
  dosage?: DosageInfo;
  sideEffects?: SideEffects;
  warnings?: string[];
  interactions?: Interaction[];
  contraindications?: string[];
  storage?: string;
  price_range?: string;
  alternatives?: Alternative[];
  suggestedQuestions?: string[];
  source?: string;
};

type CatalogRow = {
  brand_name: string;
  generic_name?: string | null;
  synonyms?: string[] | null;
  product_ndc?: string | null;
  rxcui?: string | null;
  spl_set_id?: string | null;
  dosage_form?: string | null;
  route?: string | null;
  strength?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  uses?: string[] | null;
  warnings?: string[] | null;
  contraindications?: string[] | null;
  side_effects?: SideEffects | null;
  dosage_info?: DosageInfo | null;
  interactions?: Interaction[] | null;
  storage?: string | null;
  price_range?: string | null;
  image_urls?: string[] | null;
  metadata?: Record<string, unknown> | null;
  search_score?: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const DEFAULT_QUESTIONS = [
  "Can I take this with food?",
  "What if I miss a dose?",
  "Is this safe during pregnancy?",
  "Can I drink alcohol with this?",
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSideEffects(value: unknown): value is SideEffects {
  return typeof value === "object" && value !== null;
}

function normalizeSideEffects(value: unknown): SideEffects {
  if (!isSideEffects(value)) {
    return { common: [], serious: [], rare: [] };
  }

  return {
    common: toStringArray((value as SideEffects).common),
    serious: toStringArray((value as SideEffects).serious),
    rare: toStringArray((value as SideEffects).rare),
  };
}

function normalizeDosage(value: unknown): DosageInfo | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const dosage = value as DosageInfo;
  const normalized: DosageInfo = {};

  for (const key of ["adult", "child", "frequency", "timing"] as const) {
    const entry = dosage[key];
    if (typeof entry === "string" && entry.trim()) {
      normalized[key] = entry.trim();
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeInteractions(value: unknown): Interaction[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const severity =
        item.severity === "high" || item.severity === "medium" || item.severity === "low"
          ? item.severity
          : "medium";

      return {
        drug: typeof item.drug === "string" ? item.drug.trim() : "",
        severity,
        description: typeof item.description === "string" ? item.description.trim() : "",
      };
    })
    .filter((item) => item.drug && item.description);
}

function buildSuggestedQuestions(record: MedicineData): string[] {
  const questions = [...DEFAULT_QUESTIONS];
  if (record.genericName && record.genericName !== record.name) {
    questions.unshift(`Is ${record.name} the same as ${record.genericName}?`);
  }
  return questions.slice(0, 4);
}

function buildAlternatives(row: CatalogRow): Alternative[] {
  return toStringArray(row.synonyms)
    .filter((name) => name.toLowerCase() !== row.brand_name.toLowerCase())
    .slice(0, 3)
    .map((name) => ({
      name,
      genericName: row.generic_name ?? undefined,
      priceComparison: "similar",
    }));
}

function buildCategory(row: CatalogRow): string | undefined {
  const parts = [row.dosage_form, row.route].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : undefined;
}

function mapCatalogRow(row: CatalogRow): MedicineData {
  const record: MedicineData = {
    name: row.brand_name,
    genericName: row.generic_name ?? undefined,
    category: buildCategory(row),
    uses: toStringArray(row.uses),
    dosage: normalizeDosage(row.dosage_info),
    sideEffects: normalizeSideEffects(row.side_effects),
    warnings: toStringArray(row.warnings),
    interactions: normalizeInteractions(row.interactions),
    contraindications: toStringArray(row.contraindications),
    storage: row.storage ?? undefined,
    price_range: row.price_range ?? undefined,
    alternatives: buildAlternatives(row),
    source: "medicine_catalog",
  };

  record.suggestedQuestions = buildSuggestedQuestions(record);
  return record;
}

function stripCodeFences(content: string): string {
  return content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

async function callLovableForJson(LOVABLE_API_KEY: string, systemPrompt: string, userPrompt: string): Promise<MedicineData> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again.");
    if (response.status === 402) throw new Error("Usage limit reached.");
    const details = await response.text();
    console.error("AI error:", response.status, details);
    throw new Error("AI service unavailable");
  }

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content || "";
  const content = stripCodeFences(rawContent);
  return JSON.parse(content) as MedicineData;
}

async function searchCatalog(medicineName: string): Promise<CatalogRow | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_medicine_catalog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query_text: medicineName,
      match_limit: 3,
    }),
  });

  if (!response.ok) {
    console.error("Catalog lookup failed:", response.status, await response.text());
    return null;
  }

  const matches = (await response.json()) as CatalogRow[];
  if (!Array.isArray(matches) || matches.length === 0) return null;

  const [bestMatch] = matches;
  return (bestMatch.search_score ?? 0) >= 820 ? bestMatch : null;
}

function fallbackPrompt(language: string) {
  const langInstruction = language === "hi"
    ? "Respond entirely in Hindi (Devanagari script). Use simple Hindi."
    : "Respond in simple English.";

  return `You are a pharmaceutical AI for Bee.dr health platform. ${langInstruction}

Given medicine information, return a JSON object with this EXACT structure:
{
  "name": "Brand name",
  "genericName": "Generic/chemical name",
  "category": "Drug category (e.g. Analgesic, Antibiotic)",
  "uses": ["Use 1", "Use 2"],
  "dosage": {
    "adult": "Adult dosage info",
    "child": "Child dosage info",
    "frequency": "How often to take",
    "timing": "Before/after meals"
  },
  "sideEffects": {
    "common": ["Side effect 1", "Side effect 2"],
    "serious": ["Serious side effect 1"],
    "rare": ["Rare side effect 1"]
  },
  "warnings": ["Warning 1", "Warning 2"],
  "interactions": [
    { "drug": "Drug name", "severity": "high" | "medium" | "low", "description": "What happens" }
  ],
  "contraindications": ["Condition where this drug should not be used"],
  "storage": "How to store",
  "price_range": "Approximate price range",
  "alternatives": [
    { "name": "Alternative medicine", "genericName": "Generic name", "priceComparison": "cheaper" | "similar" | "expensive" }
  ],
  "suggestedQuestions": [
    "Can I take this with food?",
    "What if I miss a dose?",
    "Is this safe during pregnancy?",
    "Can I drink alcohol with this?"
  ]
}

IMPORTANT: Be medically accurate. Return ONLY valid JSON.`;
}

function translationPrompt(language: string) {
  const langInstruction = language === "hi"
    ? "Translate descriptive values into simple Hindi in Devanagari script. Keep all medicine names, generic names, dosage units, and drug names in English."
    : "Return the same medicine JSON in simple English.";

  return `You are a pharmaceutical localization assistant for Bee.dr. ${langInstruction}

Return a JSON object with the exact same structure and keys as the input JSON.
Do not add new clinical facts, warnings, or interactions.
Do not remove existing facts.
Return ONLY valid JSON.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { medicineName, imageDescription, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

    if (typeof medicineName === "string" && medicineName.trim()) {
      const catalogMatch = await searchCatalog(medicineName.trim());
      if (catalogMatch) {
        const sourceBackedRecord = mapCatalogRow(catalogMatch);

        if (language === "hi" && LOVABLE_API_KEY) {
          try {
            const translated = await callLovableForJson(
              LOVABLE_API_KEY,
              translationPrompt(language),
              JSON.stringify(sourceBackedRecord),
            );

            return jsonResponse({
              ...translated,
              source: "medicine_catalog_translated",
            });
          } catch (translationError) {
            console.error("Catalog translation failed:", translationError);
          }
        }

        return jsonResponse(sourceBackedRecord);
      }
    }

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const input = medicineName
      ? `Medicine name: ${medicineName}`
      : `Description from medicine image: ${imageDescription}`;

    let parsed: MedicineData;
    try {
      parsed = await callLovableForJson(
        LOVABLE_API_KEY,
        fallbackPrompt(language),
        `Analyze this medicine and provide comprehensive information:\n\n${input}`,
      );
    } catch {
      parsed = {
        name: medicineName || "Unknown",
        warnings: ["Could not parse medicine data from the AI response."],
        suggestedQuestions: DEFAULT_QUESTIONS,
        source: "ai_fallback",
      };
    }

    return jsonResponse(parsed);
  } catch (e) {
    console.error("analyze-medicine error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
