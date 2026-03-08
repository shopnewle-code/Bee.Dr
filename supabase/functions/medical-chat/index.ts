import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLanguageModifier } from "../_shared/language-modifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIMPLE_LANGUAGE_MODIFIER = `
SIMPLIFICATION RULES (Simple Language Mode is ON):
- Use only the 1000 most common English words
- Maximum 8 words per sentence
- No medical terms — replace ALL of them:
  - "Hemoglobin" → "blood health number"
  - "Cholesterol" → "fat in blood"
  - "Glucose" → "sugar in blood"
  - "Creatinine" → "kidney health number"
  - "Thyroid" → "neck gland"
- Use traffic light system: 🟢 Good | 🟡 Okay | 🔴 Needs help
- Include simple emojis for visual understanding
- After each finding, add: "This means: [one simple sentence]"

Example:
"Your blood health number is low. 🔴
This means: Your body needs more iron.
Eat green leafy vegetables. 🥬"

`;

const BASE_SYSTEM_PROMPT = `You are Bee.dr AI — a medical AI assistant built into the Bee.dr health platform. You help users understand their medical reports, lab results, prescriptions, and health conditions.

Your capabilities:
- Interpret blood test results, CBC, metabolic panels, lipid profiles, etc.
- Explain medical terminology in simple language
- Identify abnormal values and what they might indicate
- Provide general health recommendations based on results
- Answer questions about medications, dosages, and interactions
- Discuss disease risk factors and prevention strategies

Important guidelines:
- Always remind users that your analysis is informational only and not a substitute for professional medical advice
- Be empathetic, clear, and thorough in explanations
- Use bullet points and structured formatting for readability
- When discussing abnormal values, explain the normal range and what deviations mean
- If asked about something outside your scope, recommend consulting a healthcare provider
- Use markdown formatting for better readability`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, simpleLanguage, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langModifier = getLanguageModifier(language);
    const systemContent = (simpleLanguage ? SIMPLE_LANGUAGE_MODIFIER : "") + langModifier + BASE_SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("medical-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
