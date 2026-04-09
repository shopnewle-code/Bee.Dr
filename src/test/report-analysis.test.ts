import { describe, expect, it } from "vitest";

import {
  buildFollowUpPlan,
  buildFallbackReportAnalysis,
  normalizeScanAnalysis,
  parseNumericValue,
} from "@/lib/report-analysis";

describe("report-analysis helpers", () => {
  it("parses numeric strings with commas and units", () => {
    expect(parseNumericValue("210,000 /uL")).toBe(210000);
    expect(parseNumericValue("11.2 g/dL")).toBe(11.2);
  });

  it("normalizes extracted lab parameters into report tests", () => {
    const normalized = normalizeScanAnalysis({
      report_type: "blood_test",
      raw_data: {
        extractedData: {
          parameters: [
            {
              name: "Hemoglobin",
              value: "11.2",
              unit: "g/dL",
              normal_range_min: "13",
              normal_range_max: "17",
              flag: "low",
            },
          ],
        },
      },
      insights: null,
      recommendations: null,
      risk_scores: null,
    });

    expect(normalized.tests).toHaveLength(1);
    expect(normalized.tests[0].name).toBe("Hemoglobin");
    expect(normalized.tests[0].status).toBe("low");
    expect(normalized.abnormalTests).toHaveLength(1);
  });

  it("builds a deterministic fallback analysis when AI explanation is unavailable", () => {
    const fallback = buildFallbackReportAnalysis({
      reportType: "blood_test",
      fileName: "cbc.pdf",
      extractedData: {
        parameters: [
          {
            name: "Platelets",
            value: "210000",
            unit: "/uL",
            normal_range_min: "150000",
            normal_range_max: "450000",
            flag: "normal",
          },
        ],
      },
    });

    expect(fallback.reportType).toBe("Blood Test");
    expect(fallback.tests[0].name).toBe("Platelets");
    expect(fallback.summary.length).toBeGreaterThan(10);
  });

  it("suggests a relevant doctor and follow-up tests for abnormal blood markers", () => {
    const normalized = normalizeScanAnalysis({
      report_type: "blood_test",
      raw_data: {
        extractedData: {
          parameters: [
            {
              name: "Hemoglobin",
              value: "10.8",
              unit: "g/dL",
              normal_range_min: "13",
              normal_range_max: "17",
              flag: "low",
            },
          ],
        },
      },
      insights: null,
      recommendations: null,
      risk_scores: null,
    });

    const plan = buildFollowUpPlan(normalized);

    expect(plan.recommendedDoctor).toContain("hematology");
    expect(plan.suggestedTests).toContain("CBC repeat");
    expect(plan.suggestedTests).toContain("Ferritin and iron studies");
  });
});
