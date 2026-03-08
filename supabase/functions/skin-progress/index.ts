import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { beforeImageBase64, afterImageBase64, beforeDate, afterDate, conditionName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!beforeImageBase64 || !afterImageBase64) {
      return new Response(JSON.stringify({ error: "Two images required (before and after)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Compare two skin condition images taken at different dates and assess progress.

Return a JSON object with this EXACT structure:
{
  "progressAssessment": "improving" | "stable" | "worsening" | "changed",
  "changes": [
    { "observation": "Size appears reduced by ~20%", "significance": "positive" },
    { "observation": "Color has darkened slightly", "significance": "monitor" }
  ],
  "overallStatus": "The condition appears to be responding to treatment",
  "recommendation": "Continue current treatment and reassess in 2 weeks",
  "urgentFlags": ["See a doctor immediately if..."],
  "confidenceLevel": "high" | "medium" | "low"
}

IMPORTANT:
- Be cautious and always recommend professional consultation for worsening conditions
- Never definitively diagnose — use language like "appears to" or "consistent with"
- Flag any signs of malignancy or rapid progression as urgent
- Return ONLY valid JSON, no markdown

⚠️ DISCLAIMER: This is an AI-assisted comparison for educational purposes only. It is NOT a substitute for professional dermatological evaluation.`;

    const userPrompt = `Compare these two skin condition images and assess the progress.${conditionName ? ` Known condition: ${conditionName}.` : ""}${beforeDate ? ` First image date: ${beforeDate}.` : ""}${afterDate ? ` Second image date: ${afterDate}.` : ""} The first image is the BEFORE and the second is the AFTER.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${beforeImageBase64}` } },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${afterImageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        progressAssessment: "changed",
        changes: [{ observation: content, significance: "monitor" }],
        overallStatus: "Unable to parse structured analysis",
        recommendation: "Please consult a dermatologist for proper evaluation",
        urgentFlags: [],
        confidenceLevel: "low",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("skin-progress error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
