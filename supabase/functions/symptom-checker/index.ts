import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLanguageModifier } from "../_shared/language-modifier.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, age, gender, chronicConditions, allergies, simpleLanguage = false } = await req.json();

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(JSON.stringify({ error: "Please provide at least one symptom" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const simpleLanguageModifier = simpleLanguage ? `
SIMPLIFICATION RULES (Simple Language Mode is ON):
- Use only the 1000 most common English words
- Maximum 8 words per sentence in descriptions
- No medical terms — replace ALL: "Hemoglobin" → "blood health number", "Cholesterol" → "fat in blood", "Glucose" → "sugar in blood"
- Use traffic light system: 🟢 Good | 🟡 Okay | 🔴 Needs help
- Include simple emojis
- After each description, add: "This means: [one simple sentence]"
` : "";

    const systemPrompt = `${simpleLanguageModifier}You are an AI medical symptom analyzer. You are NOT a doctor and must always include a disclaimer.

Given the user's symptoms and profile, analyze and respond using the following tool.

Consider the user's age, gender, chronic conditions, and allergies when analyzing.
Be thorough but express appropriate uncertainty. Rank conditions by likelihood.${simpleLanguage ? ' Use very simple, easy-to-understand language in all text fields.' : ''}`;

    const userPrompt = `Patient Profile:
- Age: ${age || 'Unknown'}
- Gender: ${gender || 'Unknown'}
- Chronic Conditions: ${chronicConditions?.length ? chronicConditions.join(', ') : 'None reported'}
- Known Allergies: ${allergies?.length ? allergies.join(', ') : 'None reported'}

Symptoms reported: ${symptoms.join(', ')}

Analyze these symptoms and provide possible conditions, urgency level, and recommended tests.`;

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
        tools: [{
          type: "function",
          function: {
            name: "symptom_analysis",
            description: "Return structured symptom analysis with possible conditions, urgency, and recommended tests.",
            parameters: {
              type: "object",
              properties: {
                urgency: {
                  type: "string",
                  enum: ["low", "moderate", "high", "emergency"],
                  description: "Overall urgency level"
                },
                urgency_message: {
                  type: "string",
                  description: "Brief message explaining urgency level"
                },
                possible_conditions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Condition name" },
                      likelihood: { type: "string", enum: ["high", "moderate", "low"] },
                      description: { type: "string", description: "Brief explanation in simple language" },
                      matching_symptoms: { type: "array", items: { type: "string" } },
                    },
                    required: ["name", "likelihood", "description", "matching_symptoms"],
                    additionalProperties: false,
                  },
                },
                recommended_tests: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      test_name: { type: "string" },
                      reason: { type: "string" },
                      priority: { type: "string", enum: ["essential", "recommended", "optional"] },
                    },
                    required: ["test_name", "reason", "priority"],
                    additionalProperties: false,
                  },
                },
                self_care_tips: {
                  type: "array",
                  items: { type: "string" },
                  description: "Home remedies or self-care suggestions"
                },
                see_doctor: {
                  type: "boolean",
                  description: "Whether the patient should see a doctor"
                },
                specialist_type: {
                  type: "string",
                  description: "Type of specialist to consult if applicable"
                },
              },
              required: ["urgency", "urgency_message", "possible_conditions", "recommended_tests", "self_care_tips", "see_doctor"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "symptom_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis returned");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("symptom-checker error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
