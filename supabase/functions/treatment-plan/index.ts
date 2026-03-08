import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLanguageModifier } from "../_shared/language-modifier.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, diagnosis, healthProfile, labResults, simpleLanguage = false, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const simpleLanguageModifier = simpleLanguage ? `
SIMPLIFICATION RULES (Simple Language Mode is ON):
- Use only the 1000 most common English words
- Maximum 8 words per sentence
- No medical terms — replace ALL: "Hemoglobin" → "blood health number", "Cholesterol" → "fat in blood", "Glucose" → "sugar in blood", "Creatinine" → "kidney health number"
- Use traffic light system: 🟢 Good | 🟡 Okay | 🔴 Needs help
- Include simple emojis for visual understanding
- After each finding, add: "This means: [one simple sentence]"
` : "";

    const systemPrompt = `${simpleLanguageModifier}You are an AI clinical advisor creating personalized treatment plans. You are NOT replacing a doctor — always include disclaimers. Generate a comprehensive, evidence-based treatment plan.${simpleLanguage ? ' Use very simple, easy-to-understand language throughout.' : ''}

Return a structured plan with these sections:
1. **Condition Summary**: Brief overview of the diagnosed/suspected condition
2. **Treatment Goals**: Short-term and long-term objectives
3. **Medication Plan**: 
   - Recommended medications (generic names, dosages, frequency, duration)
   - Potential side effects to watch for
   - Drug interactions to avoid
4. **Lifestyle Modifications**:
   - Diet recommendations (specific foods to include/avoid)
   - Exercise plan (type, frequency, duration, intensity)
   - Sleep hygiene recommendations
   - Stress management techniques
5. **Monitoring Plan**:
   - Lab tests to track (with frequency)
   - Symptoms to monitor
   - Warning signs requiring immediate medical attention
6. **Follow-up Schedule**: When to see a doctor next
7. **Preventive Measures**: Steps to prevent worsening or recurrence
8. **Alternative/Complementary Therapies**: Evidence-based complementary approaches

Personalize based on patient profile (age, gender, existing conditions, medications).
Always end with: "⚠️ This is an AI-generated plan for informational purposes. Always consult your healthcare provider before making any changes to your treatment."`;

    const userMessage = `Create a personalized treatment plan based on:
${symptoms ? `**Symptoms**: ${symptoms}` : ''}
${diagnosis ? `**Diagnosis/Condition**: ${diagnosis}` : ''}
${healthProfile ? `**Patient Profile**: ${JSON.stringify(healthProfile)}` : ''}
${labResults ? `**Lab Results**: ${JSON.stringify(labResults)}` : ''}

Generate a comprehensive, actionable treatment plan.`;

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
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
