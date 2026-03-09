import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLanguageModifier } from "../_shared/language-modifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Guardrail rules injected into EVERY prompt ──
const GUARDRAIL_RULES = `
STRICT RULES (MUST FOLLOW):
- ONLY analyze information that is PRESENT in the report.
- NEVER assume, guess, or fabricate any medical values.
- If a parameter is not mentioned in the report, write "Not available in the report".
- Do NOT convert the report into a different test type.
- Do NOT add test results that are not in the original document.
- If the document is unclear or unreadable, say so honestly.
- Every value you report MUST be traceable to the original document text.
`;

// ── Specialized prompt library ──
const SPECIALIZED_PROMPTS: Record<string, string> = {
  ncv_emg: `You are a neurologist AI assistant for the Bee.dr health platform.

Analyze the following NCV (Nerve Conduction Velocity) / EMG (Electromyography) report.

Extract and explain ONLY what is present:
1. Nerves tested (motor and sensory)
2. Conduction velocity values
3. Distal latency values
4. Amplitude values
5. F-wave latency (if present)
6. H-reflex (if present)
7. Any abnormalities or denervation signs

${GUARDRAIL_RULES}

Provide response in this JSON structure:
{
  "reportType": "NCV / EMG",
  "summary": "2-3 sentence overall finding",
  "tests": [
    {
      "name": "Nerve name + type (e.g. Median Motor)",
      "value": "actual value from report",
      "unit": "m/s or ms or mV",
      "normalRange": "normal reference range",
      "status": "normal|high|low|critical",
      "explanation": "What this means in simple language"
    }
  ],
  "overallRisks": [{"condition": "name", "level": "low|medium|high", "explanation": "why"}],
  "lifestyleRecommendations": [{"category": "Follow-up|Medication|Exercise", "advice": "specific", "priority": "high|medium|low"}],
  "suggestedQuestions": ["5 relevant follow-up questions"]
}`,

  ecg: `You are a cardiologist AI assistant for the Bee.dr health platform.

Analyze the following ECG (Electrocardiogram) report.

Extract and explain ONLY what is present:
1. Heart rate
2. Rhythm (sinus, atrial fibrillation, etc.)
3. PR interval
4. QRS duration
5. QT/QTc interval
6. ST segment changes
7. Axis
8. Any abnormalities

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].
Each test: {name, value, unit, normalRange, status, explanation}.`,

  blood_test: `You are a medical lab specialist AI for the Bee.dr health platform.

Analyze the blood test report. Extract ONLY values that are PRESENT in the document.

Common parameters to look for (only if present):
- CBC: Hemoglobin, RBC, WBC, Platelets, MCV, MCH, MCHC
- Metabolic: Glucose, HbA1c, Creatinine, BUN, Uric Acid
- Lipids: Total Cholesterol, LDL, HDL, Triglycerides
- Liver: SGPT/ALT, SGOT/AST, Bilirubin, Albumin, ALP
- Thyroid: TSH, T3, T4
- Vitamins: Vitamin D, Vitamin B12, Folate, Ferritin
- Electrolytes: Sodium, Potassium, Calcium

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].
Each test: {name, value, unit, normalRange, status, explanation, healthRisks[], recommendations[]}.`,

  mri: `You are a radiologist AI assistant for the Bee.dr health platform.

Analyze the following MRI report.

Extract and explain ONLY what is present:
1. Body part scanned
2. Sequences used (T1, T2, FLAIR, DWI, etc.)
3. Key findings
4. Measurements if provided
5. Impression/conclusion from the report

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[] (use for each finding), overallRisks[], lifestyleRecommendations[], suggestedQuestions[].`,

  ct_scan: `You are a radiologist AI assistant for the Bee.dr health platform.

Analyze the following CT Scan report.

Extract and explain ONLY what is present:
1. Body region scanned
2. Contrast used (if mentioned)
3. Key findings and measurements
4. Impression/conclusion

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].`,

  xray: `You are a radiologist AI assistant for the Bee.dr health platform.

Analyze the following X-ray report.

Extract and explain ONLY what is present:
1. Body part and view (PA, AP, lateral)
2. Key findings
3. Impression/conclusion

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].`,

  pathology: `You are a pathologist AI assistant for the Bee.dr health platform.

Analyze the following pathology/biopsy report.

Extract and explain ONLY what is present:
1. Specimen type and source
2. Gross description
3. Microscopic findings
4. Diagnosis
5. Margins (if surgical specimen)
6. Staging (if cancer)

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].`,

  prescription: `You are a pharmacist AI assistant for the Bee.dr health platform.

Analyze the following prescription.

Extract ONLY what is written:
1. Medications prescribed (name, dosage, frequency, duration)
2. Diagnosis mentioned (if any)
3. Special instructions
4. Follow-up date (if mentioned)

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[] (one per medication: name=med name, value=dosage, unit=frequency), lifestyleRecommendations[], suggestedQuestions[].`,

  ultrasound: `You are a radiologist AI assistant for the Bee.dr health platform.

Analyze the following ultrasound/sonography report.

Extract and explain ONLY what is present:
1. Body part examined
2. Organ measurements
3. Echogenicity findings
4. Doppler findings (if present)
5. Impression

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].`,

  urine_stool: `You are a medical lab specialist AI for the Bee.dr health platform.

Analyze the following urine/stool examination report.

Extract ONLY values present:
- Urine: Color, pH, specific gravity, protein, glucose, RBC, WBC, casts, crystals
- Stool: Color, consistency, occult blood, ova/parasites, WBC

${GUARDRAIL_RULES}

Provide response in JSON with: reportType, summary, tests[], overallRisks[], lifestyleRecommendations[], suggestedQuestions[].`,

  general: `You are Bee.dr medical AI assistant.

Before analyzing the document:
Step 1: Identify the type of medical report from the content.
Step 2: Analyze ONLY according to the detected report type.

${GUARDRAIL_RULES}

Provide response in JSON with:
{
  "reportType": "Detected type",
  "summary": "2-3 sentence summary",
  "tests": [{"name", "value", "unit", "normalRange", "status", "explanation"}],
  "overallRisks": [{"condition", "level", "explanation"}],
  "lifestyleRecommendations": [{"category", "advice", "priority"}],
  "suggestedQuestions": ["5 relevant questions"]
}`,
};

// Report type display names
const REPORT_TYPE_NAMES: Record<string, string> = {
  ncv_emg: "NCV / EMG Nerve Study",
  ecg: "ECG / Electrocardiogram",
  blood_test: "Blood Test",
  mri: "MRI Scan",
  ct_scan: "CT Scan",
  xray: "X-ray",
  pathology: "Pathology / Biopsy",
  prescription: "Prescription",
  ultrasound: "Ultrasound",
  urine_stool: "Urine / Stool Test",
  general: "Medical Report",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scanData, reportType = "general", language = "en", simpleLanguage = false, extractedData = null } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langModifier = getLanguageModifier(language);
    const effectiveType = reportType && SPECIALIZED_PROMPTS[reportType] ? reportType : "general";
    const specializedPrompt = SPECIALIZED_PROMPTS[effectiveType];
    const reportTypeName = REPORT_TYPE_NAMES[effectiveType] || "Medical Report";

    const simpleLanguageModifier = simpleLanguage ? `
SIMPLIFICATION RULES (Simple Language Mode is ON):
- Use only the 1000 most common English words
- Maximum 8 words per sentence
- No medical jargon — replace ALL terms with simple words
- Use traffic light indicators: 🟢 Good | 🟡 Okay | 🔴 Needs help
- After each explanation, add: "This means: [one simple sentence]"
` : "";

    const systemPrompt = `${simpleLanguageModifier}${langModifier}${specializedPrompt}

The detected report type is: ${reportTypeName}

IMPORTANT OUTPUT RULES:
- Generate ONLY findings that exist in the provided data
- Include the "reportType" field as "${reportTypeName}" in your response
- Return ONLY valid JSON, no markdown formatting`;

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
          {
            role: "user",
            content: `Analyze this ${reportTypeName} and provide detailed structured findings.\n\nReport data:\n${JSON.stringify(scanData)}`
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
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { reportType: reportTypeName, summary: content, tests: [], overallRisks: [], lifestyleRecommendations: [], suggestedQuestions: [] };
    }

    // Ensure reportType is always set
    if (!parsed.reportType) parsed.reportType = reportTypeName;

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
