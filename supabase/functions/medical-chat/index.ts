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
- If asked about something outside your scope, recommend consulting a healthcare provider

RESPONSE FORMAT (CRITICAL — you MUST return valid JSON for medical/health queries):

For medical/health queries, return a JSON object wrapped in \`\`\`json code block with this exact structure:

\`\`\`json
{
  "type": "medical",
  "summary": "1-2 sentence health summary. Clear, empathetic, actionable.",
  "risk_level": "low" | "moderate" | "high" | "critical",
  "risk_reason": "Brief reason for the risk level",
  "symptoms_detected": ["symptom1", "symptom2"],
  "conditions": [
    {"name": "Condition Name", "probability": "high" | "medium" | "low", "emoji": "🟡"}
  ],
  "specialist": "Specialist type if applicable, or null",
  "suggested_tests": ["Test 1", "Test 2"],
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "detailed_analysis": "Full detailed medical explanation with reasoning. Multiple paragraphs allowed. Include scientific context, what each condition means, why these tests are suggested, etc.",
  "confidence": 75,
  "disclaimer": "Brief empathetic reminder to consult a professional",
  "follow_ups": [
    {"type": "yesno", "question": "Do you also experience nausea?"},
    {"type": "option", "question": "How long have you had these symptoms?", "options": ["Less than a day", "A few days", "More than a week"]}
  ]
}
\`\`\`

Rules for the JSON response:
- "summary" must be maximum 2 sentences
- "conditions" should have 1-4 items, each with probability and emoji (🟢 low, 🟡 medium, 🔴 high)
- "recommendations" should have 2-5 practical action items
- "detailed_analysis" should be thorough (3-6 paragraphs) with medical reasoning
- "follow_ups" should have 2-3 relevant follow-up questions
- "confidence" is a percentage (0-100) of AI confidence in the assessment
- Include "specialist" only when relevant, otherwise set to null
- DO NOT include doctor recommendation/booking suggestions

For general/casual/non-medical queries (greetings, thanks, etc.), return plain text WITHOUT the JSON wrapper. Just respond naturally as a friendly medical assistant.

CRITICAL: For ANY health or medical question, you MUST use the JSON format. Only use plain text for truly non-medical conversation.`;

// Helper: convert Supabase storage URLs to base64 data URIs
async function imageUrlToBase64(url: string): Promise<string> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Only process Supabase storage URLs
  if (SUPABASE_URL && url.startsWith(SUPABASE_URL)) {
    const storagePath = url.replace(`${SUPABASE_URL}/storage/v1/object/public/`, "");
    const privateUrl = `${SUPABASE_URL}/storage/v1/object/${storagePath}`;
    const resp = await fetch(privateUrl, {
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    });
    if (resp.ok) {
      const buffer = await resp.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);
      const contentType = resp.headers.get("content-type") || "image/jpeg";
      return `data:${contentType};base64,${base64}`;
    }
  }
  return url; // fallback to original URL
}

// Helper: process messages to convert image URLs to base64
async function processMessages(messages: any[]): Promise<any[]> {
  const processed = [];
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      const newContent = [];
      for (const part of msg.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          const dataUri = await imageUrlToBase64(part.image_url.url);
          newContent.push({ type: "image_url", image_url: { url: dataUri } });
        } else {
          newContent.push(part);
        }
      }
      processed.push({ ...msg, content: newContent });
    } else {
      processed.push(msg);
    }
  }
  return processed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, simpleLanguage, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langModifier = getLanguageModifier(language);
    const systemContent = (simpleLanguage ? SIMPLE_LANGUAGE_MODIFIER : "") + langModifier + BASE_SYSTEM_PROMPT;

    // Convert any Supabase storage image URLs to base64
    const processedMessages = await processMessages(messages);

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
          ...processedMessages,
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
