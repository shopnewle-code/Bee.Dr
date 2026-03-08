import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { medicineName, imageDescription, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = language === "hi"
      ? "Respond entirely in Hindi (Devanagari script). Use simple Hindi."
      : "Respond in simple English.";

    const input = medicineName
      ? `Medicine name: ${medicineName}`
      : `Description from medicine image: ${imageDescription}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a pharmaceutical AI for Bee.dr health platform. ${langInstruction}

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

IMPORTANT: Be medically accurate. Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Analyze this medicine and provide comprehensive information:\n\n${input}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { name: medicineName || "Unknown", error: "Could not parse medicine data" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-medicine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
