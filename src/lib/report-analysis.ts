import type { Json, Tables } from "@/integrations/supabase/types";

export type NormalizedStatus = "normal" | "high" | "low" | "critical";
export type RiskLevel = "low" | "medium" | "high";
export type RecommendationPriority = "low" | "medium" | "high";

export interface NormalizedTest {
  name: string;
  value: string;
  numericValue: number | null;
  unit: string;
  normalRange: string;
  normalMin: number | null;
  normalMax: number | null;
  status: NormalizedStatus;
  explanation: string;
  recommendations: string[];
  healthRisks: string[];
}

export interface NormalizedRisk {
  condition: string;
  level: RiskLevel;
  explanation: string;
}

export interface NormalizedRecommendation {
  category: string;
  advice: string;
  priority: RecommendationPriority;
}

export interface NormalizedAnalysis {
  reportType: string;
  summary: string;
  tests: NormalizedTest[];
  abnormalTests: NormalizedTest[];
  overallRisks: NormalizedRisk[];
  lifestyleRecommendations: NormalizedRecommendation[];
  suggestedQuestions: string[];
  healthScore: number;
  extractedData: Record<string, unknown> | null;
}

export interface FollowUpPlan {
  recommendedDoctor: string;
  suggestedTests: string[];
  rationale: string;
}

type ScanLike = Pick<
  Tables<"scan_results">,
  "report_type" | "raw_data" | "insights" | "recommendations" | "risk_scores"
>;

const REPORT_TYPE_LABELS: Record<string, string> = {
  blood_test: "Blood Test",
  ncv_emg: "NCV / EMG",
  ecg: "ECG",
  mri: "MRI",
  ct_scan: "CT Scan",
  xray: "X-ray",
  pathology: "Pathology",
  prescription: "Prescription",
  ultrasound: "Ultrasound",
  urine_stool: "Urine / Stool Test",
  general: "Medical Report",
};

const RANGE_PATTERN = /(-?\d+(?:\.\d+)?)\s*(?:to|-|–|—)\s*(-?\d+(?:\.\d+)?)/i;
const RANGE_MAX_PATTERN = /(?:<=|<|up to|less than)\s*(-?\d+(?:\.\d+)?)/i;
const RANGE_MIN_PATTERN = /(?:>=|>|above|more than)\s*(-?\d+(?:\.\d+)?)/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function cleanString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

export function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = cleanString(value);
  if (!raw) {
    return null;
  }

  const match = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getReportTypeLabel(type: string | null | undefined): string {
  if (!type) {
    return REPORT_TYPE_LABELS.general;
  }

  return REPORT_TYPE_LABELS[type] || type;
}

function parseRangeParts(value: unknown): { min: number | null; max: number | null; label: string } {
  const raw = cleanString(value);
  if (!raw) {
    return { min: null, max: null, label: "" };
  }

  const normalized = raw.replace(/,/g, "");

  const pairMatch = normalized.match(RANGE_PATTERN);
  if (pairMatch) {
    return {
      min: Number(pairMatch[1]),
      max: Number(pairMatch[2]),
      label: raw,
    };
  }

  const maxMatch = normalized.match(RANGE_MAX_PATTERN);
  if (maxMatch) {
    return { min: null, max: Number(maxMatch[1]), label: raw };
  }

  const minMatch = normalized.match(RANGE_MIN_PATTERN);
  if (minMatch) {
    return { min: Number(minMatch[1]), max: null, label: raw };
  }

  return { min: null, max: null, label: raw };
}

function buildRangeLabel(min: number | null, max: number | null, fallback?: string) {
  if (fallback && fallback.trim()) {
    return fallback.trim();
  }

  if (min !== null && max !== null) {
    return `${min}-${max}`;
  }

  if (min !== null) {
    return `>${min}`;
  }

  if (max !== null) {
    return `<${max}`;
  }

  return "Not provided";
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "high") {
    return "high";
  }
  if (normalized === "medium" || normalized === "moderate") {
    return "medium";
  }
  return "low";
}

function normalizePriority(value: unknown): RecommendationPriority {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "high") {
    return "high";
  }
  if (normalized === "medium") {
    return "medium";
  }
  return "low";
}

function normalizeStatus(
  rawStatus: unknown,
  numericValue: number | null,
  min: number | null,
  max: number | null,
): NormalizedStatus {
  const normalized = cleanString(rawStatus).toLowerCase();

  if (normalized.includes("critical") || normalized.includes("severe") || normalized.includes("panic")) {
    return "critical";
  }
  if (normalized.includes("high") || normalized.includes("elevated") || normalized.includes("positive")) {
    return "high";
  }
  if (normalized.includes("low") || normalized.includes("deficient") || normalized.includes("decreased")) {
    return "low";
  }
  if (normalized.includes("normal") || normalized.includes("within")) {
    return "normal";
  }

  if (numericValue !== null) {
    if (max !== null && numericValue > max) {
      return "high";
    }
    if (min !== null && numericValue < min) {
      return "low";
    }
  }

  return "normal";
}

function defaultExplanation(name: string, status: NormalizedStatus) {
  if (status === "normal") {
    return `${name} is within the expected range.`;
  }
  if (status === "low") {
    return `${name} is lower than the expected range.`;
  }
  if (status === "high") {
    return `${name} is higher than the expected range.`;
  }
  return `${name} needs urgent clinical review.`;
}

function keywordRecommendations(testName: string, status: NormalizedStatus): string[] {
  const name = testName.toLowerCase();
  const recommendations: string[] = [];

  if (status === "normal") {
    return recommendations;
  }

  if (/(hemoglobin|haemoglobin|ferritin|iron)/.test(name)) {
    recommendations.push("Discuss anemia screening and iron intake with your doctor.");
  }
  if (/(glucose|sugar|hba1c)/.test(name)) {
    recommendations.push("Review sugar intake and follow up for diabetes screening.");
  }
  if (/(cholesterol|ldl|triglyceride|lipid)/.test(name)) {
    recommendations.push("Focus on heart-healthy meals and regular exercise.");
  }
  if (/(vitamin d|vit d|b12|folate)/.test(name)) {
    recommendations.push("Review diet, sunlight exposure, or supplements with a clinician.");
  }
  if (/(creatinine|bun|uric acid|renal|kidney)/.test(name)) {
    recommendations.push("Stay hydrated and review kidney-related medicines with your doctor.");
  }
  if (/(platelet|wbc|rbc|white blood|red blood)/.test(name)) {
    recommendations.push("Repeat the test or consult a physician if symptoms continue.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Review this result with a doctor if symptoms persist.");
  }

  return recommendations;
}

function keywordRisks(testName: string, status: NormalizedStatus): string[] {
  if (status === "normal") {
    return [];
  }

  const name = testName.toLowerCase();
  if (/(hemoglobin|haemoglobin|ferritin|iron)/.test(name)) {
    return ["Possible anemia or iron deficiency"];
  }
  if (/(glucose|hba1c)/.test(name)) {
    return ["Possible blood sugar imbalance"];
  }
  if (/(cholesterol|ldl|triglyceride|lipid)/.test(name)) {
    return ["Possible cardiovascular risk"];
  }
  if (/(creatinine|bun|renal|kidney)/.test(name)) {
    return ["Possible kidney function concern"];
  }
  if (/(vitamin d|b12|folate)/.test(name)) {
    return ["Possible nutrition deficiency"];
  }

  return ["Needs medical follow-up"];
}

function mapStructuredParameter(item: Record<string, unknown>): NormalizedTest | null {
  const name =
    cleanString(item.name) ||
    cleanString(item.test_name) ||
    cleanString(item.parameter) ||
    cleanString(item.nerve_name) ||
    cleanString(item.finding) ||
    cleanString(item.structure) ||
    cleanString(item.organ) ||
    cleanString(item.muscle) ||
    cleanString(item.medication);

  if (!name) {
    return null;
  }

  const value =
    cleanString(item.value) ||
    cleanString(item.result_value) ||
    cleanString(item.observation) ||
    cleanString(item.measurement) ||
    cleanString(item.dosage) ||
    cleanString(item.rhythm) ||
    cleanString(item.description) ||
    cleanString(item.diagnosis) ||
    cleanString(item.impression) ||
    cleanString(item.frequency);

  const unit =
    cleanString(item.unit) ||
    cleanString(item.conduction_velocity_unit) ||
    cleanString(item.distal_latency_unit) ||
    cleanString(item.amplitude_unit) ||
    "";

  const directMin = parseNumericValue(item.normal_range_min ?? item.normalMin ?? item.min);
  const directMax = parseNumericValue(item.normal_range_max ?? item.normalMax ?? item.max);
  const rangeSource =
    cleanString(item.normalRange) ||
    cleanString(item.normal_range) ||
    cleanString(item.reference_range) ||
    cleanString(item.referenceRange);
  const parsedRange = parseRangeParts(rangeSource);
  const normalMin = directMin ?? parsedRange.min;
  const normalMax = directMax ?? parsedRange.max;
  const normalRange = buildRangeLabel(normalMin, normalMax, parsedRange.label);
  const numericValue = parseNumericValue(value);
  const status = normalizeStatus(
    item.status ?? item.flag ?? item.severity ?? item.significance,
    numericValue,
    normalMin,
    normalMax,
  );

  return {
    name,
    value: value || cleanString(item.status) || cleanString(item.significance) || "Observed",
    numericValue,
    unit,
    normalRange,
    normalMin,
    normalMax,
    status,
    explanation: cleanString(item.explanation) || cleanString(item.observation) || defaultExplanation(name, status),
    recommendations: asArray(item.recommendations)
      .map(cleanString)
      .filter(Boolean)
      .concat(keywordRecommendations(name, status))
      .filter((itemValue, index, all) => all.indexOf(itemValue) === index),
    healthRisks: asArray(item.healthRisks)
      .map(cleanString)
      .filter(Boolean)
      .concat(keywordRisks(name, status))
      .filter((itemValue, index, all) => all.indexOf(itemValue) === index),
  };
}

function collectStructuredTests(source: unknown): NormalizedTest[] {
  const record = asRecord(source);
  if (!record) {
    return [];
  }

  const directTests = asArray(record.tests).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const parameters = asArray(record.parameters).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const keyValues = asArray(record.key_values).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const medications = asArray(record.medications).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const nerves = asArray(record.nerves).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const findings = asArray(record.findings).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const emgFindings = asArray(record.emg_findings).map(asRecord).filter(Boolean) as Record<string, unknown>[];
  const measurements = asRecord(record.measurements);

  const measurementTests = measurements
    ? Object.entries(measurements)
        .map(([key, value]) =>
          mapStructuredParameter({
            name: key.replace(/_/g, " "),
            value,
          }),
        )
        .filter(Boolean)
    : [];

  const rawTests = [
    ...directTests,
    ...parameters,
    ...keyValues,
    ...medications,
    ...nerves,
    ...findings,
    ...emgFindings,
  ];

  const mapped = rawTests.map(mapStructuredParameter).filter(Boolean) as NormalizedTest[];
  const deduped = new Map<string, NormalizedTest>();

  [...mapped, ...(measurementTests as NormalizedTest[])].forEach((test) => {
    const key = `${test.name.toLowerCase()}::${test.value.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, test);
    }
  });

  return Array.from(deduped.values());
}

function normalizeRisksFromSource(source: unknown): NormalizedRisk[] {
  const asRiskArray = asArray(source)
    .map(asRecord)
    .filter(Boolean)
    .map((risk) => ({
      condition: cleanString(risk.condition) || cleanString(risk.name) || "Health risk",
      level: normalizeRiskLevel(risk.level ?? risk.severity),
      explanation: cleanString(risk.explanation) || cleanString(risk.description) || "Follow up with a clinician.",
    }))
    .filter((risk) => risk.condition);

  if (asRiskArray.length > 0) {
    return asRiskArray;
  }

  const riskObject = asRecord(source);
  if (!riskObject) {
    return [];
  }

  return Object.entries(riskObject).map(([key, value]) => {
    const details = asRecord(value);
    const score = parseNumericValue(details?.score ?? value);
    const level: RiskLevel = score !== null && score >= 0.75
      ? "high"
      : score !== null && score >= 0.45
        ? "medium"
        : "low";

    return {
      condition: key.replace(/_/g, " "),
      level,
      explanation: cleanString(details?.label) || `Risk score recorded for ${key.replace(/_/g, " ")}.`,
    };
  });
}

function normalizeRecommendationsFromSource(source: unknown): NormalizedRecommendation[] {
  const recommendations = asArray(source)
    .map(asRecord)
    .filter(Boolean)
    .map((recommendation) => ({
      category: cleanString(recommendation.category) || cleanString(recommendation.context) || "Follow-up",
      advice: cleanString(recommendation.advice) || cleanString(recommendation.action),
      priority: normalizePriority(recommendation.priority),
    }))
    .filter((recommendation) => recommendation.advice);

  return recommendations;
}

function buildSummary(reportType: string, tests: NormalizedTest[], risks: NormalizedRisk[]) {
  const abnormalCount = tests.filter((test) => test.status !== "normal").length;
  if (abnormalCount === 0 && tests.length > 0) {
    return `${getReportTypeLabel(reportType)} reviewed. ${tests.length} result${tests.length === 1 ? "" : "s"} extracted, and no obvious abnormalities were flagged.`;
  }

  if (abnormalCount > 0) {
    return `${getReportTypeLabel(reportType)} reviewed. ${abnormalCount} value${abnormalCount === 1 ? "" : "s"} need attention${risks.length > 0 ? `, with ${risks.length} highlighted health risk${risks.length === 1 ? "" : "s"}` : ""}.`;
  }

  return `${getReportTypeLabel(reportType)} uploaded and processed.`;
}

function calculateHealthScore(tests: NormalizedTest[], risks: NormalizedRisk[]) {
  const riskPenalty = risks.reduce((sum, risk) => {
    if (risk.level === "high") return sum + 18;
    if (risk.level === "medium") return sum + 10;
    return sum + 4;
  }, 0);

  const abnormalPenalty = tests.reduce((sum, test) => {
    if (test.status === "critical") return sum + 22;
    if (test.status === "high" || test.status === "low") return sum + 10;
    return sum;
  }, 0);

  return Math.max(20, Math.min(96, 100 - riskPenalty - abnormalPenalty));
}

export function normalizeScanAnalysis(scan: ScanLike | null | undefined): NormalizedAnalysis {
  const raw = asRecord(scan?.raw_data) || {};
  const extractedData = asRecord(raw.extractedData) || asRecord(raw.structuredExtraction) || null;
  const reportType = cleanString(raw.reportType) || cleanString(scan?.report_type) || "general";
  const tests = collectStructuredTests(raw).length > 0
    ? collectStructuredTests(raw)
    : collectStructuredTests(extractedData);
  const overallRisks = normalizeRisksFromSource(raw.overallRisks).length > 0
    ? normalizeRisksFromSource(raw.overallRisks)
    : normalizeRisksFromSource(scan?.risk_scores);
  const lifestyleRecommendations = normalizeRecommendationsFromSource(raw.lifestyleRecommendations).length > 0
    ? normalizeRecommendationsFromSource(raw.lifestyleRecommendations)
    : normalizeRecommendationsFromSource(scan?.recommendations);
  const suggestedQuestions = asArray(raw.suggestedQuestions).map(cleanString).filter(Boolean);
  const summary = cleanString(raw.summary) || buildSummary(reportType, tests, overallRisks);
  const abnormalTests = tests.filter((test) => test.status !== "normal");
  const healthScore = calculateHealthScore(abnormalTests, overallRisks);

  return {
    reportType,
    summary,
    tests,
    abnormalTests,
    overallRisks,
    lifestyleRecommendations,
    suggestedQuestions,
    healthScore,
    extractedData,
  };
}

export function buildRiskScores(analysis: NormalizedAnalysis) {
  if (analysis.overallRisks.length === 0) {
    return null;
  }

  return analysis.overallRisks.reduce<Record<string, { score: number; label: string; color: string }>>((scores, risk) => {
    const key = risk.condition.toLowerCase().replace(/\s+/g, "_");
    scores[key] = {
      score: risk.level === "high" ? 0.82 : risk.level === "medium" ? 0.56 : 0.24,
      label: risk.level,
      color: risk.level === "high" ? "destructive" : risk.level === "medium" ? "warning" : "success",
    };
    return scores;
  }, {});
}

export function buildInsightCards(analysis: NormalizedAnalysis) {
  return analysis.abnormalTests.map((test) => ({
    title: test.name,
    severity: test.status === "critical" ? "high" : test.status,
    detail: test.explanation,
    value: test.value,
    unit: test.unit,
    normalRange: test.normalRange,
  }));
}

export function buildRecommendationCards(analysis: NormalizedAnalysis) {
  return analysis.lifestyleRecommendations.map((recommendation) => ({
    action: recommendation.advice,
    context: recommendation.category,
    priority: recommendation.priority,
  }));
}

export function buildFollowUpPlan(analysis: NormalizedAnalysis): FollowUpPlan {
  const abnormalNames = analysis.abnormalTests.map((test) => test.name.toLowerCase());
  const hasMatch = (pattern: RegExp) => abnormalNames.some((name) => pattern.test(name));
  const suggestedTests = new Set<string>();
  let recommendedDoctor = "General physician";
  let rationale = analysis.abnormalTests.length > 0
    ? `The latest report flagged ${analysis.abnormalTests.length} value${analysis.abnormalTests.length === 1 ? "" : "s"} that deserve clinical review.`
    : "No major abnormal values were highlighted. Routine follow-up is still recommended if symptoms continue.";

  if (hasMatch(/hemoglobin|haemoglobin|ferritin|iron|b12|folate/)) {
    recommendedDoctor = "General physician or hematology specialist";
    suggestedTests.add("CBC repeat");
    suggestedTests.add("Ferritin and iron studies");
    rationale = "Low blood-count or nutrition markers can point to anemia or deficiency patterns that should be confirmed clinically.";
  } else if (hasMatch(/glucose|hba1c|sugar|insulin/)) {
    recommendedDoctor = "General physician or endocrinologist";
    suggestedTests.add("HbA1c");
    suggestedTests.add("Fasting glucose repeat");
    suggestedTests.add("Lifestyle review");
    rationale = "Blood sugar markers outside range should be checked again and reviewed for diabetes or prediabetes risk.";
  } else if (hasMatch(/cholesterol|ldl|hdl|triglyceride|lipid/)) {
    recommendedDoctor = "Internal medicine doctor or cardiologist";
    suggestedTests.add("Fasting lipid profile");
    suggestedTests.add("Blood pressure check");
    rationale = "Lipid abnormalities are often managed with risk-factor review and follow-up cardiovascular screening.";
  } else if (hasMatch(/creatinine|bun|renal|kidney|uric acid/)) {
    recommendedDoctor = "General physician or nephrologist";
    suggestedTests.add("Kidney function test repeat");
    suggestedTests.add("Urine routine");
    rationale = "Kidney-related values should be correlated with hydration, medicines, and repeat renal testing.";
  } else if (hasMatch(/thyroid|tsh|t3|t4/)) {
    recommendedDoctor = "General physician or endocrinologist";
    suggestedTests.add("TSH / T3 / T4 repeat");
    rationale = "Thyroid markers often need repeat hormone testing and symptom review.";
  } else if (hasMatch(/platelet|wbc|rbc|white blood|red blood/)) {
    recommendedDoctor = "General physician";
    suggestedTests.add("CBC repeat");
    suggestedTests.add("Peripheral smear if advised");
    rationale = "Blood-cell abnormalities are usually reviewed with repeat counts and, if needed, a peripheral smear.";
  }

  if (analysis.abnormalTests.length === 0) {
    suggestedTests.add("Repeat routine screening as advised");
  }

  if (analysis.lifestyleRecommendations.length > 0) {
    suggestedTests.add("Doctor review of current lifestyle and medicines");
  }

  return {
    recommendedDoctor,
    suggestedTests: Array.from(suggestedTests),
    rationale,
  };
}

export function buildFallbackReportAnalysis(params: {
  reportType: string;
  extractedData?: unknown;
  ocrText?: string;
  fileName?: string;
}) {
  const scan = {
    report_type: params.reportType,
    raw_data: {
      reportType: params.reportType,
      extractedData: params.extractedData ?? null,
    } as Json,
    insights: null,
    recommendations: null,
    risk_scores: null,
  } as ScanLike;

  const normalized = normalizeScanAnalysis(scan);
  const recommendations = normalized.lifestyleRecommendations.length > 0
    ? normalized.lifestyleRecommendations
    : [
        {
          category: "Follow-up",
          advice: "Share this report with your doctor for a full interpretation.",
          priority: "medium" as RecommendationPriority,
        },
      ];

  return {
    reportType: getReportTypeLabel(params.reportType),
    summary:
      normalized.summary ||
      `${params.fileName || "Report"} uploaded. Structured values were extracted, but full AI explanation is pending.`,
    tests: normalized.tests.map((test) => ({
      name: test.name,
      value: test.value,
      unit: test.unit,
      normalRange: test.normalRange,
      status: test.status,
      explanation: test.explanation,
      recommendations: test.recommendations,
      healthRisks: test.healthRisks,
      medicalTerms: [],
    })),
    overallRisks: normalized.overallRisks,
    lifestyleRecommendations: recommendations,
    suggestedQuestions: [
      "Which values need the most attention?",
      "Should I repeat any test soon?",
      "What doctor should review this report?",
    ],
    extractedData: params.extractedData ?? null,
    ocrText: params.ocrText ?? "",
  };
}
