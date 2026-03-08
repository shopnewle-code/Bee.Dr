import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { checkins, scans, healthProfile } = await req.json();
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
            content: `You are a predictive health AI for the Bee.dr platform. Analyze the user's health data patterns to predict future health risks, mental health status, and provide preventive recommendations.

Return a JSON object with this EXACT structure:
{
  "overallForecast": "2-3 paragraph overall health forecast based on trends",
  "risks": [
    {
      "condition": "Condition name",
      "level": "low/medium/high",
      "explanation": "Why this is a risk based on the data",
      "prevention": "What the user can do to prevent it"
    }
  ],
  "mentalHealth": "Analysis of mental health based on mood, stress, and sleep patterns",
  "sleepInsights": "Analysis of sleep patterns and recommendations",
  "preventiveActions": [
    {
      "action": "Specific action to take",
      "reason": "Why this is important",
      "priority": "high/medium/low"
    }
  ]
}

IMPORTANT:
- Base predictions on actual data patterns, not generic advice
- If sleep data shows poor quality, flag it
- If stress levels are consistently high, address mental health
- If mood trends downward, suggest interventions
- Return ONLY valid JSON, no markdown`
          },
          {
            role: "user",
            content: `Analyze this health data and provide predictive insights:

Daily Check-ins (last 14 days): ${JSON.stringify(checkins).slice(0, 3000)}

Medical Scan Results: ${JSON.stringify(scans).slice(0, 2000)}

Health Profile: ${JSON.stringify(healthProfile).slice(0, 500)}`
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
    catch { parsed = { overallForecast: content, risks: [], mentalHealth: null, sleepInsights: null, preventiveActions: [] }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predictive-health error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
