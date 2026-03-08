import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, patientContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a senior radiologist AI analyzing a CT scan. Provide:
1. **Scan Details**: Body region, contrast phase (non-contrast/arterial/venous/delayed), slice orientation
2. **Systematic Review by Region**:
   - HEAD: Brain parenchyma, ventricles, midline shift, hemorrhage, mass lesions
   - CHEST: Lungs (nodules, consolidation), mediastinum, pleura, aorta
   - ABDOMEN: Liver, spleen, kidneys, pancreas, bowel, lymph nodes
   - PELVIS: Bladder, reproductive organs, bones
3. **Findings**: Precise descriptions with HU (Hounsfield Unit) estimates where applicable
4. **Measurements**: Size of any lesions in three dimensions
5. **Differential Diagnosis**: Ranked by likelihood with reasoning
6. **Urgency**: normal/routine follow-up/urgent/emergent
7. **Recommendations**: Additional imaging, biopsy, intervention, follow-up

Use standard radiology reporting terminology (BIRADS, LIRADS, Lung-RADS where applicable).

⚠️ DISCLAIMER: This is an AI-assisted preliminary analysis for educational purposes only. It is NOT a substitute for professional radiological interpretation. Always consult a qualified radiologist for definitive diagnosis.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this CT scan image.${patientContext ? ` Patient context: ${patientContext}` : ""} Provide a thorough clinical analysis.`,
      },
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
    ];

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
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-ct error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
