import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLanguageModifier } from "../_shared/language-modifier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, modality, patientContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const modalityPrompts: Record<string, string> = {
      ecg: `You are a senior cardiologist AI analyzing an ECG/EKG strip. Provide:
1. **Rhythm Analysis**: Rate, rhythm regularity, P waves, PR interval, QRS duration, QT/QTc interval, ST segment, T waves
2. **Findings**: List all abnormalities detected (e.g., arrhythmias, axis deviations, bundle branch blocks, ischemic changes, hypertrophy patterns)
3. **Interpretation**: Overall clinical interpretation
4. **Risk Assessment**: Cardiac risk level (low/moderate/high/critical) with reasoning
5. **Recommendations**: Suggested follow-up tests, specialist referrals, lifestyle changes
6. **Emergency Flags**: Any findings requiring immediate medical attention

Format with clear headers and bullet points. Be specific with measurements where visible.`,
      
      xray: `You are a senior radiologist AI analyzing a chest/body X-ray. Provide:
1. **Technical Quality**: Image quality, positioning, exposure adequacy
2. **Systematic Review**: 
   - Bones & soft tissues
   - Cardiac silhouette (size, shape)
   - Mediastinum & hilum
   - Lungs (fields, markings, opacities)
   - Pleura & costophrenic angles
   - Diaphragm
3. **Findings**: All abnormalities with anatomical location and description
4. **Differential Diagnosis**: Most likely diagnoses ranked by probability
5. **Risk Level**: Overall concern level (normal/mild/moderate/severe/critical)
6. **Recommendations**: Follow-up imaging, lab tests, specialist referral

Be precise about locations (e.g., "right lower lobe", "left hilum").`,

      mri: `You are a senior radiologist AI analyzing an MRI scan. Provide:
1. **Scan Details**: Identify body region, sequence type if visible, contrast status
2. **Systematic Analysis**:
   - Signal characteristics (T1/T2 weighted findings)
   - Anatomical structures assessment
   - Tissue characterization
   - Enhancement patterns (if contrast)
3. **Findings**: All abnormalities with precise anatomical location, size measurements, signal characteristics
4. **Differential Diagnosis**: Most likely diagnoses ranked with reasoning
5. **Staging/Grading**: If applicable (tumors, disc herniations, ligament tears)
6. **Risk Level**: Severity assessment (normal/mild/moderate/severe/critical)
7. **Recommendations**: Additional imaging, biopsy, specialist referral, follow-up timeline

Include specific measurements and anatomical landmarks.`,

      ct: `You are a senior radiologist AI analyzing a CT scan. Provide:
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

Use standard radiology reporting terminology (BIRADS, LIRADS, Lung-RADS where applicable).`,
    };

    const systemPrompt = modalityPrompts[modality] || modalityPrompts.xray;
    const userContent: any[] = [
      { type: "text", text: `Analyze this ${modality.toUpperCase()} image.${patientContext ? ` Patient context: ${patientContext}` : ''} Provide a thorough clinical analysis.` },
    ];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      });
    }

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
