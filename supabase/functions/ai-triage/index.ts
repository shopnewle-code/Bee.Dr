import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, duration, severity, vitalSigns, age, gender, medicalHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an AI medical triage system. Assess patient symptoms and assign urgency level.

You MUST respond with valid JSON (no markdown, no code blocks) in this exact format:
{
  "triage_level": "emergency|urgent|semi_urgent|non_urgent|self_care",
  "triage_color": "red|orange|yellow|green|blue",
  "urgency_score": 1-10,
  "assessment": "Brief clinical assessment",
  "recommended_action": "What the patient should do immediately",
  "recommended_specialty": "Which type of doctor to see",
  "time_to_care": "How quickly they should seek care",
  "red_flags": ["List of concerning symptoms if any"],
  "differential_diagnosis": [{"condition": "name", "likelihood": "high|moderate|low"}],
  "home_care_advice": ["Immediate self-care steps"],
  "when_to_call_911": "Specific situations requiring emergency services"
}

Triage levels:
- emergency (red): Life-threatening, needs immediate ER
- urgent (orange): Serious, needs care within 1-2 hours
- semi_urgent (yellow): Needs care within 4-24 hours
- non_urgent (green): Can wait 24-72 hours, schedule appointment
- self_care (blue): Can manage at home with guidance`;

    const userMessage = `Triage this patient:
Symptoms: ${symptoms || 'Not specified'}
Duration: ${duration || 'Not specified'}
Severity (1-10): ${severity || 'Not specified'}
${vitalSigns ? `Vital Signs: ${JSON.stringify(vitalSigns)}` : ''}
Age: ${age || 'Not specified'}
Gender: ${gender || 'Not specified'}
${medicalHistory ? `Medical History: ${medicalHistory}` : ''}`;

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
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from content
    let triageResult;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      triageResult = JSON.parse(cleaned);
    } catch {
      triageResult = { triage_level: 'non_urgent', assessment: content, urgency_score: 3 };
    }

    return new Response(JSON.stringify(triageResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
