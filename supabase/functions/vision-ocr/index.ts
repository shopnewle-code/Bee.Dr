import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { storagePath, imageBase64, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let base64Data = imageBase64;

    // If storagePath provided, download from Supabase storage
    if (storagePath && !base64Data) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from("reports")
        .download(storagePath);

      if (downloadError || !fileData) {
        console.error("Storage download error:", downloadError);
        return new Response(JSON.stringify({ ocrText: "", error: "Failed to download file from storage" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);

      // Detect mime type from extension or default
      const ext = (storagePath.split(".").pop() || "").toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        webp: "image/webp", gif: "image/gif", pdf: "application/pdf",
      };
      const mime = mimeMap[ext] || "image/jpeg";
      base64Data = `data:${mime};base64,${b64}`;
    }

    if (!base64Data) {
      return new Response(JSON.stringify({ ocrText: "", error: "No image data provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPdf = base64Data.startsWith("data:application/pdf");

    // Use Gemini multimodal for vision-based OCR
    const systemPrompt = `You are a medical document OCR engine for the Bee.dr health platform.

Your job is to extract ALL text visible in this medical report with maximum accuracy.

RULES:
- Extract every piece of text you can see: headers, values, units, patient info, dates, doctor names, lab names.
- Preserve the layout structure as much as possible (use newlines, tabs, or spacing).
- For tables, reproduce them in a readable text format (e.g. "Parameter | Value | Unit | Reference Range").
- Include ALL numeric values exactly as they appear.
- If text is partially obscured or blurry, mark it as [unclear].
- Do NOT interpret or analyze — just extract the raw text.
- Do NOT fabricate any text not visible in the document.
- If the document is not a medical document, state that clearly.
${isPdf ? `
MULTI-PAGE PDF INSTRUCTIONS:
- This is a PDF document that may contain MULTIPLE pages.
- Extract text from EVERY page in the document.
- Clearly mark page boundaries with "--- Page X ---" headers.
- Do not skip any pages. Process all pages from first to last.
- Tables that span across pages should be extracted page by page.
` : ""}`; 

    const userPrompt = isPdf
      ? `Extract ALL text from EVERY page of this multi-page PDF medical document. Process all pages from beginning to end. Filename: ${fileName || "unknown"}`
      : `Extract all text from this medical document image. Filename: ${fileName || "unknown"}`;

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
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: base64Data } },
            ],
          },
        ],
        max_tokens: isPdf ? 16000 : 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Vision OCR gateway error:", response.status, errText);
      throw new Error("Vision OCR service unavailable");
    }

    const result = await response.json();
    const ocrText = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ ocrText, fileName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vision-ocr error:", e);
    return new Response(JSON.stringify({ ocrText: "", error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
