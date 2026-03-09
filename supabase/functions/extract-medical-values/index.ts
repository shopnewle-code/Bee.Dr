import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Extraction schemas per report type ──
const EXTRACTION_SCHEMAS: Record<string, object> = {
  blood_test: {
    type: "object",
    properties: {
      parameters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Parameter name e.g. Hemoglobin" },
            value: { type: "string", description: "Numeric value as string" },
            unit: { type: "string", description: "Unit e.g. g/dL, cells/mcL" },
            normal_range_min: { type: "string" },
            normal_range_max: { type: "string" },
            flag: { type: "string", enum: ["normal", "high", "low", "critical"] },
          },
          required: ["name", "value", "unit", "flag"],
        },
      },
      patient_info: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "string" },
          gender: { type: "string" },
          date: { type: "string" },
          lab_name: { type: "string" },
        },
      },
    },
    required: ["parameters"],
  },
  ncv_emg: {
    type: "object",
    properties: {
      nerves: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nerve_name: { type: "string" },
            type: { type: "string", enum: ["motor", "sensory", "mixed"] },
            conduction_velocity: { type: "string" },
            conduction_velocity_unit: { type: "string" },
            distal_latency: { type: "string" },
            distal_latency_unit: { type: "string" },
            amplitude: { type: "string" },
            amplitude_unit: { type: "string" },
            f_wave_latency: { type: "string" },
            flag: { type: "string", enum: ["normal", "abnormal", "borderline"] },
          },
          required: ["nerve_name", "type", "flag"],
        },
      },
      emg_findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            muscle: { type: "string" },
            insertional_activity: { type: "string" },
            spontaneous_activity: { type: "string" },
            motor_unit_morphology: { type: "string" },
            recruitment: { type: "string" },
            flag: { type: "string", enum: ["normal", "abnormal"] },
          },
        },
      },
      patient_info: {
        type: "object",
        properties: { name: { type: "string" }, age: { type: "string" }, date: { type: "string" } },
      },
    },
    required: ["nerves"],
  },
  ecg: {
    type: "object",
    properties: {
      measurements: {
        type: "object",
        properties: {
          heart_rate: { type: "string" },
          rhythm: { type: "string" },
          pr_interval: { type: "string" },
          qrs_duration: { type: "string" },
          qt_interval: { type: "string" },
          qtc_interval: { type: "string" },
          axis: { type: "string" },
          st_segment: { type: "string" },
        },
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            finding: { type: "string" },
            severity: { type: "string", enum: ["normal", "mild", "moderate", "severe"] },
          },
        },
      },
    },
    required: ["measurements"],
  },
  mri: {
    type: "object",
    properties: {
      body_part: { type: "string" },
      sequences_used: { type: "array", items: { type: "string" } },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            structure: { type: "string" },
            observation: { type: "string" },
            measurement: { type: "string" },
            significance: { type: "string", enum: ["normal", "incidental", "abnormal", "critical"] },
          },
          required: ["structure", "observation", "significance"],
        },
      },
      impression: { type: "string" },
    },
    required: ["findings"],
  },
  ct_scan: {
    type: "object",
    properties: {
      body_region: { type: "string" },
      contrast: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            structure: { type: "string" },
            observation: { type: "string" },
            measurement: { type: "string" },
            significance: { type: "string", enum: ["normal", "incidental", "abnormal", "critical"] },
          },
          required: ["structure", "observation", "significance"],
        },
      },
      impression: { type: "string" },
    },
    required: ["findings"],
  },
  xray: {
    type: "object",
    properties: {
      body_part: { type: "string" },
      view: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            finding: { type: "string" },
            location: { type: "string" },
            significance: { type: "string", enum: ["normal", "incidental", "abnormal", "critical"] },
          },
          required: ["finding", "significance"],
        },
      },
      impression: { type: "string" },
    },
    required: ["findings"],
  },
  pathology: {
    type: "object",
    properties: {
      specimen_type: { type: "string" },
      specimen_source: { type: "string" },
      gross_description: { type: "string" },
      microscopic_findings: { type: "string" },
      diagnosis: { type: "string" },
      margins: { type: "string" },
      staging: { type: "string" },
      immunohistochemistry: { type: "array", items: { type: "object", properties: { marker: { type: "string" }, result: { type: "string" } } } },
    },
    required: ["diagnosis"],
  },
  prescription: {
    type: "object",
    properties: {
      medications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            dosage: { type: "string" },
            frequency: { type: "string" },
            duration: { type: "string" },
            route: { type: "string" },
            instructions: { type: "string" },
          },
          required: ["name"],
        },
      },
      diagnosis: { type: "string" },
      follow_up: { type: "string" },
    },
    required: ["medications"],
  },
  ultrasound: {
    type: "object",
    properties: {
      body_part: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            organ: { type: "string" },
            measurement: { type: "string" },
            echogenicity: { type: "string" },
            observation: { type: "string" },
            significance: { type: "string", enum: ["normal", "incidental", "abnormal", "critical"] },
          },
          required: ["organ", "observation", "significance"],
        },
      },
      impression: { type: "string" },
    },
    required: ["findings"],
  },
  urine_stool: {
    type: "object",
    properties: {
      parameters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            unit: { type: "string" },
            normal_range: { type: "string" },
            flag: { type: "string", enum: ["normal", "abnormal"] },
          },
          required: ["name", "value", "flag"],
        },
      },
    },
    required: ["parameters"],
  },
};

// Fallback generic schema
const GENERIC_SCHEMA = {
  type: "object",
  properties: {
    report_type_detected: { type: "string" },
    key_values: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "string" },
          unit: { type: "string" },
          flag: { type: "string" },
        },
        required: ["name", "value"],
      },
    },
    text_findings: { type: "array", items: { type: "string" } },
    impression: { type: "string" },
  },
  required: ["key_values"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reportText, reportType = "general", fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const schema = EXTRACTION_SCHEMAS[reportType] || GENERIC_SCHEMA;
    const functionName = `extract_${reportType}_values`;

    const systemPrompt = `You are a medical document data extraction engine for the Bee.dr health platform.

STRICT RULES:
- Extract ONLY values that are EXPLICITLY present in the document text.
- NEVER fabricate, assume, or infer values not in the text.
- If a field is not found in the document, omit it entirely from the output.
- Do NOT convert the document into a different report type.
- Preserve exact numeric values as they appear in the document.
- Include units exactly as written in the document.

Your job is to parse the medical document and return structured data using the provided function schema.`;

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
            content: `Extract structured medical data from this ${reportType} report.\n\nFile: ${fileName || "unknown"}\n\nDocument text:\n${reportText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: functionName,
              description: `Extract structured medical values from a ${reportType} report. Only include values explicitly present in the document.`,
              parameters: schema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: functionName } },
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();

    // Extract tool call arguments
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let extracted: any = null;

    if (toolCall?.function?.arguments) {
      try {
        extracted = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try parsing content directly
    if (!extracted) {
      const content = result.choices?.[0]?.message?.content || "";
      try {
        extracted = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        extracted = { key_values: [], text_findings: [content], raw_parse_failed: true };
      }
    }

    return new Response(JSON.stringify({ reportType, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-medical-values error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
