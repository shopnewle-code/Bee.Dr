import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileName, fileType, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use AI vision for images, filename analysis for other files
    let messages;
    
    if (fileType?.startsWith('image/') && imageBase64) {
      // Vision-based analysis for image files
      messages = [
        {
          role: "system",
          content: `You are a medical report classifier. Analyze the medical document image and classify it into one of these categories:

CATEGORIES:
- blood_test: Blood work, CBC, chemistry panels, hematology reports
- radiology: X-rays, MRI, CT scans, ultrasounds, mammograms  
- pathology: Biopsy reports, tissue analysis, cytology
- cardiology: ECG, stress tests, echocardiograms, cardiac catheterization
- prescription: Medication prescriptions, pharmacy labels
- general: Any other medical document

Return JSON with this EXACT structure:
{
  "reportType": "category_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification decision"
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Classify this medical document: ${fileName}` },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ];
    } else {
      // Filename-based analysis for non-images or when no image data
      messages = [
        {
          role: "system", 
          content: `You are a medical report classifier. Based on the filename, classify it into one of these categories:

CATEGORIES:
- blood_test: Blood work, CBC, chemistry panels, hematology reports
- radiology: X-rays, MRI, CT scans, ultrasounds, mammograms
- pathology: Biopsy reports, tissue analysis, cytology  
- cardiology: ECG, stress tests, echocardiograms, cardiac catheterization
- prescription: Medication prescriptions, pharmacy labels
- general: Any other medical document

Return JSON with this EXACT structure:
{
  "reportType": "category_name", 
  "confidence": 0.85,
  "reasoning": "Brief explanation based on filename analysis"
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`
        },
        {
          role: "user",
          content: `Classify this medical document filename: "${fileName}"`
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
        model: "google/gemini-2.5-flash",
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service unavailable");
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback to simple filename-based detection if AI parsing fails
      const fileName_lower = fileName.toLowerCase();
      let fallbackType = "general";
      
      if (/blood|cbc|hemoglobin|hematology|wbc|rbc|platelet|chemistry/.test(fileName_lower)) {
        fallbackType = "blood_test";
      } else if (/mri|xray|x-ray|ct|scan|radiology|ultrasound|mammogram/.test(fileName_lower)) {
        fallbackType = "radiology";
      } else if (/prescription|rx|presc|medication/.test(fileName_lower)) {
        fallbackType = "prescription";
      } else if (/biopsy|pathology|cytology|tissue/.test(fileName_lower)) {
        fallbackType = "pathology";
      } else if (/ecg|ekg|echo|cardiac|heart|stress/.test(fileName_lower)) {
        fallbackType = "cardiology";
      }
      
      parsed = {
        reportType: fallbackType,
        confidence: 0.7,
        reasoning: "Fallback filename analysis due to AI parsing error"
      };
    }

    // Validate the response structure
    if (!parsed.reportType || typeof parsed.confidence !== "number") {
      throw new Error("Invalid AI response format");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("detect-report-type error:", e);
    
    // Return fallback detection on error
    const { fileName } = await req.json().catch(() => ({ fileName: "unknown" }));
    const fileName_lower = fileName.toLowerCase();
    let fallbackType = "general";
    
    if (/blood|cbc|hemoglobin/.test(fileName_lower)) {
      fallbackType = "blood_test";
    } else if (/mri|xray|ct|scan/.test(fileName_lower)) {
      fallbackType = "radiology";  
    } else if (/prescription|rx/.test(fileName_lower)) {
      fallbackType = "prescription";
    }
    
    return new Response(JSON.stringify({
      reportType: fallbackType,
      confidence: 0.5,
      reasoning: "Fallback detection due to service error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});