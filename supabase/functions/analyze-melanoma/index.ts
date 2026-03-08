import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Perform an ABCDE assessment on this skin lesion image for melanoma screening.

ABCDE criteria:
- A (Asymmetry): Is one half unlike the other?
- B (Border): Are borders irregular, ragged, or blurred?
- C (Color): Is the color uneven? Multiple shades?
- D (Diameter): Is it larger than 6mm (pencil eraser)?
- E (Evolving): Has it changed? (Cannot determine from single image — mark as null)

Return ONLY valid JSON with this EXACT structure:
{
  "abcdeScore": {
    "asymmetry": { "present": true/false, "detail": "Description" },
    "border": { "present": true/false, "detail": "Description" },
    "color": { "present": true/false, "detail": "Description" },
    "diameter": { "present": true/false, "detail": "Estimated size" },
    "evolving": { "present": null, "detail": "Cannot determine from single image — ask patient about changes over time" }
  },
  "totalFlags": 3,
  "riskLevel": "low" | "moderate" | "high",
  "recommendation": "Summary recommendation",
  "urgency": "routine" | "soon" | "urgent"
}

CRITICAL RULES:
- If 3+ ABCDE criteria are positive, always set riskLevel to "high" and urgency to "urgent"
- If 2 criteria are positive, set riskLevel to "moderate" and urgency to "soon"  
- If 0-1 criteria are positive, set riskLevel to "low" and urgency to "routine"
- Always recommend dermatologist visit for 2+ flags
- Use cautious language — "appears to", "consistent with", never definitive diagnoses
- Return ONLY valid JSON, no markdown wrapping`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this skin lesion using the ABCDE melanoma screening criteria. Provide a thorough assessment." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        abcdeScore: {
          asymmetry: { present: null, detail: "Unable to analyze" },
          border: { present: null, detail: "Unable to analyze" },
          color: { present: null, detail: "Unable to analyze" },
          diameter: { present: null, detail: "Unable to analyze" },
          evolving: { present: null, detail: "Ask patient" },
        },
        totalFlags: 0,
        riskLevel: "unknown",
        recommendation: "Unable to analyze image. Please try again with a clearer photo.",
        urgency: "routine",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-melanoma error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
