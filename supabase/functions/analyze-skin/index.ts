import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLanguageModifier } from "../_shared/language-modifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are a dermatological AI assistant for the Bee.dr health platform. Analyze skin condition images and provide preliminary assessments.

Return a JSON object with this EXACT structure:
{
  "condition": "Most likely condition name",
  "confidence": "High/Medium/Low",
  "riskLevel": "low/medium/high",
  "description": "Detailed description of what you observe and the condition",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "seeDoctor": true/false,
  "doctorReason": "Reason to see a doctor (if seeDoctor is true)",
  "differentialDiagnosis": ["Other possible condition 1", "Other possible condition 2"]
}

IMPORTANT:
- Be cautious and always recommend professional consultation for anything suspicious
- Never definitively diagnose — use language like "appears to be" or "consistent with"
- Flag anything that could be melanoma or skin cancer as high risk
- Return ONLY valid JSON, no markdown`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this skin condition image (${fileName}). Provide a preliminary assessment.` },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service unavailable");
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(content); }
    catch { parsed = { condition: "Unable to analyze", riskLevel: "unknown", description: content, recommendations: [], seeDoctor: true }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-skin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
