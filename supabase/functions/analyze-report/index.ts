import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scanData, language = "en", simpleLanguage = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = language === "hi"
      ? "Respond entirely in Hindi (Devanagari script). Use simple Hindi that a common person can understand."
      : "Respond in simple English that a non-medical person can easily understand.";

    const simpleLanguageModifier = simpleLanguage ? `
SIMPLIFICATION RULES (Simple Language Mode is ON):
- Use only the 1000 most common English words in all text fields
- Maximum 8 words per sentence in explanations
- No medical terms — replace ALL of them:
  - "Hemoglobin" → "blood health number"
  - "Cholesterol" → "fat in blood"
  - "Glucose" → "sugar in blood"
  - "Creatinine" → "kidney health number"
  - "Thyroid" → "neck gland"
- Use traffic light indicators in status: 🟢 Good | 🟡 Okay | 🔴 Needs help
- Include simple emojis in explanations
- After each explanation, add: "This means: [one simple sentence]"
` : "";

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
            content: `You are a medical report analysis AI for the Bee.dr health platform. ${langInstruction}

Given medical report data, generate a detailed JSON response with this EXACT structure:
{
  "summary": "A 2-3 sentence overall summary of the report",
  "tests": [
    {
      "name": "Test Name (e.g. Hemoglobin)",
      "value": "13.5",
      "unit": "g/dL",
      "normalRange": "12.0 - 16.0",
      "status": "normal" | "high" | "low" | "critical",
      "explanation": "Simple explanation of what this test measures and what the result means",
      "medicalTerms": [
        { "term": "Hemoglobin", "definition": "Simple definition" }
      ],
      "healthRisks": ["Risk if abnormal"],
      "recommendations": ["What to do about this result"]
    }
  ],
  "overallRisks": [
    { "condition": "Condition name", "level": "low" | "medium" | "high", "explanation": "Why" }
  ],
  "lifestyleRecommendations": [
    { "category": "Diet" | "Exercise" | "Sleep" | "Medication" | "Follow-up", "advice": "Specific advice", "priority": "high" | "medium" | "low" }
  ],
  "suggestedQuestions": [
    "Is this result dangerous?",
    "What should I eat to improve this?",
    "Do I need to see a doctor?",
    "What does this test mean?",
    "How can I improve this value?"
  ]
}

IMPORTANT:
- Generate realistic, medically accurate test breakdowns based on the report data
- If the raw data is limited, infer common blood test values and generate a comprehensive analysis
- Always include at least 5-8 test results
- Mark abnormal values clearly
- Provide actionable, specific recommendations
- Include 5-8 suggested follow-up questions relevant to the specific results
- Return ONLY valid JSON, no markdown`
          },
          {
            role: "user",
            content: `Analyze this medical report data and provide detailed explanation:\n\n${JSON.stringify(scanData)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, tests: [], overallRisks: [], lifestyleRecommendations: [], suggestedQuestions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
