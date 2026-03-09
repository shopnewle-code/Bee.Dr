import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Keyword-based pre-classification for speed + accuracy
function keywordClassify(text: string): { reportType: string; confidence: number } | null {
  const t = text.toLowerCase();

  // NCV / EMG — very specific terms
  if (/nerve conduction|ncv|emg|electromyograph|conduction velocity|motor latency|sensory latency|f.wave|h.reflex|demyelinat/.test(t)) {
    return { reportType: "ncv_emg", confidence: 0.95 };
  }
  // ECG / EKG
  if (/electrocardiog|ecg|ekg|p.wave|qrs|st.segment|pr interval|qt interval|sinus rhythm|atrial fibrillat|tachycardia|bradycardia|heart rate.*bpm/.test(t)) {
    return { reportType: "ecg", confidence: 0.92 };
  }
  // MRI
  if (/magnetic resonance|mri\b|t1.weighted|t2.weighted|flair|diffusion weighted|sagittal|coronal|axial.*scan|gadolinium/.test(t)) {
    return { reportType: "mri", confidence: 0.93 };
  }
  // CT Scan
  if (/ct\s*scan|computed tomography|hounsfield|contrast enhanced ct|hrct|cect|non.contrast ct/.test(t)) {
    return { reportType: "ct_scan", confidence: 0.92 };
  }
  // X-ray
  if (/x.ray|xray|radiograph|chest pa|ap view|lateral view|radio.?opaque|radio.?lucen/.test(t)) {
    return { reportType: "xray", confidence: 0.90 };
  }
  // Pathology / Biopsy
  if (/biopsy|histopath|cytology|tissue section|malignant|benign|carcinoma|adenoma|microscop.*exam/.test(t)) {
    return { reportType: "pathology", confidence: 0.92 };
  }
  // Blood Test / CBC / Chemistry
  if (/hemoglobin|haemoglobin|hematocrit|wbc|rbc|platelet|cbc|complete blood count|blood sugar|fasting glucose|hba1c|cholesterol|triglyceride|creatinine|bun|sgpt|sgot|alt|ast|bilirubin|albumin|thyroid|tsh|t3|t4|vitamin\s*d|vitamin\s*b12|ferritin|iron\s*stud|lipid\s*profile|liver function|kidney function|renal function|electrolyte|sodium|potassium|calcium|uric acid/.test(t)) {
    return { reportType: "blood_test", confidence: 0.90 };
  }
  // Prescription
  if (/prescription|rx\b|tab\.|cap\.|syrup|ointment|mg\s*(once|twice|thrice|daily|bd|tds|od)|before food|after food/.test(t)) {
    return { reportType: "prescription", confidence: 0.88 };
  }
  // Ultrasound
  if (/ultrasound|sonograph|usg|doppler|echogenic|hypoechoic|anechoic/.test(t)) {
    return { reportType: "ultrasound", confidence: 0.90 };
  }
  // Urine / Stool test
  if (/urinalysis|urine\s*(routine|test|exam)|stool\s*(test|exam|routine)|occult blood/.test(t)) {
    return { reportType: "urine_stool", confidence: 0.88 };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileName, fileType, imageBase64, ocrText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Try keyword classification on OCR text first (fastest, most accurate)
    if (ocrText && ocrText.length > 20) {
      const keywordResult = keywordClassify(ocrText);
      if (keywordResult && keywordResult.confidence >= 0.88) {
        console.log("Keyword classification hit:", keywordResult.reportType, keywordResult.confidence);
        return new Response(JSON.stringify({
          ...keywordResult,
          reasoning: "Keyword-based classification from document content",
          method: "keyword",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Step 2: Try keyword classification on filename
    const filenameResult = keywordClassify(fileName || "");
    if (filenameResult && filenameResult.confidence >= 0.90) {
      console.log("Filename keyword hit:", filenameResult.reportType);
      return new Response(JSON.stringify({
        ...filenameResult,
        reasoning: "Keyword-based classification from filename",
        method: "keyword_filename",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 3: LLM classification (vision for images, text for OCR content)
    let messages;
    const classificationPrompt = `You are a medical report classifier. Your ONLY job is to identify the type of medical document.

Possible categories (return EXACTLY one):
- blood_test: Blood work, CBC, chemistry panels, hematology, lipid profile, liver/kidney function, thyroid
- ncv_emg: Nerve conduction velocity, electromyography, nerve studies
- ecg: Electrocardiogram, heart rhythm analysis
- mri: Magnetic resonance imaging
- ct_scan: Computed tomography
- xray: X-ray / radiograph
- ultrasound: Ultrasound / sonography
- pathology: Biopsy, histopathology, cytology
- prescription: Medication prescription
- urine_stool: Urinalysis, stool examination
- general: Any other medical document

Return JSON: {"reportType": "category", "confidence": 0.95, "reasoning": "brief reason"}
Return ONLY valid JSON.`;

    if (fileType?.startsWith('image/') && imageBase64) {
      messages = [
        { role: "system", content: classificationPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Classify this medical document. Filename: ${fileName}${ocrText ? `\n\nExtracted text:\n${ocrText.slice(0, 2000)}` : ''}` },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ];
    } else {
      messages = [
        { role: "system", content: classificationPrompt },
        {
          role: "user",
          content: `Classify this medical document.\nFilename: "${fileName}"\n\n${ocrText ? `Document content:\n${ocrText.slice(0, 3000)}` : 'No text content available.'}`
        }
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
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
    try {
      parsed = JSON.parse(content);
      parsed.method = "llm";
    } catch {
      // Fallback
      parsed = {
        reportType: filenameResult?.reportType || "general",
        confidence: 0.5,
        reasoning: "Fallback due to AI parsing error",
        method: "fallback",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("detect-report-type error:", e);
    return new Response(JSON.stringify({
      reportType: "general",
      confidence: 0.3,
      reasoning: "Service error fallback",
      method: "error_fallback",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
