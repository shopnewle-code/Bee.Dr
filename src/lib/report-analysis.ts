import type { Json, Tables } from '@/integrations/supabase/types';

type Scan = Tables<'scan_results'>;

export type NormalizedTestStatus = 'normal' | 'high' | 'low' | 'critical';
export type RecommendationPriority = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface NormalizedAnalysisTest {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: NormalizedTestStatus;
  explanation: string;
  score: number;
}

export interface NormalizedRisk {
  condition: string;
  level: RiskLevel;
  explanation: string;
  score: number;
}

export interface NormalizedLifestyleRecommendation {
  category: string;
  advice: string;
  priority: RecommendationPriority;
}

export interface FollowUpPlanStep {
  title: string;
  detail: string;
  timeframe: string;
  category: string;
  priority: RecommendationPriority;
}

export interface FollowUpPlan {
  doctorSpecialty: string;
  rationale: string;
  suggestedTests: string[];
  actions: FollowUpPlanStep[];
}

export interface NormalizedScanAnalysis {
  reportType: string;
  summary: string;
  tests: NormalizedAnalysisTest[];
  abnormalValues: NormalizedAnalysisTest[];
  lifestyleRecommendations: NormalizedLifestyleRecommendation[];
  overallRisks: NormalizedRisk[];
  suggestedQuestions: string[];
  healthScore: number;
  attentionScore: number;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  blood_test: 'Blood Test',
  ncv_emg: 'NCV / EMG',
  ecg: 'ECG',
  mri: 'MRI Scan',
  ct_scan: 'CT Scan',
  xray: 'X-ray',
  pathology: 'Pathology / Biopsy',
  prescription: 'Prescription',
  ultrasound: 'Ultrasound',
  urine_stool: 'Urine / Stool Test',
  general: 'Medical Report',
};

const STATUS_SCORE: Record<NormalizedTestStatus, number> = {
  normal: 0.18,
  low: 0.42,
  high: 0.6,
  critical: 0.85,
};

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function asArray(value: Json | null | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

export function asRecord(value: Json | null | undefined): Record<string, Json | undefined> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Json | undefined>;
  }

  return {};
}

function asString(value: Json | undefined, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return fallback;
}

function asNumber(value: Json | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalized = item.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function normalizeRange(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min} - ${max}`;
  if (min !== null) return `>${min}`;
  if (max !== null) return `<${max}`;
  return 'Not provided';
}

function normalizeTestStatus(status: string | null | undefined): NormalizedTestStatus {
  const normalized = (status || 'normal').trim().toLowerCase();

  if (['critical', 'severe', 'urgent', 'danger'].includes(normalized)) return 'critical';
  if (['high', 'elevated', 'positive', 'above_range'].includes(normalized)) return 'high';
  if (['low', 'below_range', 'deficient'].includes(normalized)) return 'low';
  return 'normal';
}

function normalizeRiskLevel(level: string | null | undefined): RiskLevel {
  const normalized = (level || 'low').trim().toLowerCase();

  if (normalized === 'high') return 'high';
  if (['medium', 'moderate'].includes(normalized)) return 'medium';
  return 'low';
}

function normalizePriority(priority: string | null | undefined): RecommendationPriority {
  const normalized = (priority || 'medium').trim().toLowerCase();

  if (normalized === 'high') return 'high';
  if (normalized === 'low') return 'low';
  return 'medium';
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function inferLifestyleRecommendations(
  abnormalValues: NormalizedAnalysisTest[],
  reportType: string,
): NormalizedLifestyleRecommendation[] {
  const seeded: NormalizedLifestyleRecommendation[] = [];

  for (const item of abnormalValues) {
    const name = item.name.toLowerCase();

    if (name.includes('glucose') || name.includes('hba1c')) {
      seeded.push({
        category: 'Diet',
        advice: 'Reduce refined sugars, pair carbs with protein, and monitor post-meal spikes.',
        priority: 'high',
      });
    }

    if (name.includes('cholesterol') || name.includes('ldl') || name.includes('triglyceride')) {
      seeded.push({
        category: 'Exercise',
        advice: 'Aim for 150 minutes of brisk activity weekly and reduce saturated fat intake.',
        priority: 'medium',
      });
    }

    if (name.includes('vitamin d') || name.includes('b12') || name.includes('folate')) {
      seeded.push({
        category: 'Supplement',
        advice: 'Discuss targeted supplementation and repeat levels after a clinically appropriate interval.',
        priority: 'medium',
      });
    }

    if (
      name.includes('hemoglobin') ||
      name.includes('rbc') ||
      name.includes('ferritin') ||
      name.includes('platelet')
    ) {
      seeded.push({
        category: 'Nutrition',
        advice: 'Support recovery with iron-rich meals, hydration, and clinician-guided follow-up labs.',
        priority: 'high',
      });
    }

    if (name.includes('creatinine') || name.includes('bun') || name.includes('egfr')) {
      seeded.push({
        category: 'Hydration',
        advice: 'Review hydration habits and avoid unnecessary over-the-counter medicines until reviewed.',
        priority: 'high',
      });
    }

    if (name.includes('tsh') || name.includes('t3') || name.includes('t4')) {
      seeded.push({
        category: 'Follow-up',
        advice: 'Keep sleep and meal timing consistent and arrange endocrine follow-up if symptoms persist.',
        priority: 'medium',
      });
    }
  }

  if (seeded.length === 0) {
    seeded.push(
      {
        category: 'Follow-up',
        advice: 'Review the report with a clinician and track symptoms alongside your next tests.',
        priority: 'medium',
      },
      {
        category: 'Lifestyle',
        advice: 'Prioritize sleep, hydration, and steady daily movement while you monitor progress.',
        priority: 'low',
      },
    );
  }

  if (reportType.toLowerCase().includes('ecg') || reportType.toLowerCase().includes('ct')) {
    seeded.push({
      category: 'Follow-up',
      advice: 'Share any chest pain, breathlessness, or exercise intolerance promptly with your care team.',
      priority: 'high',
    });
  }

  return uniqueStrings(seeded.map((item) => `${item.category}::${item.advice}`))
    .map((token) => {
      const [category, advice] = token.split('::');
      const match = seeded.find((item) => item.category === category && item.advice === advice);
      return match!;
    })
    .sort((left, right) => PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]);
}

function inferSuggestedTests(abnormalValues: NormalizedAnalysisTest[], reportType: string): string[] {
  const tests: string[] = [];

  for (const item of abnormalValues) {
    const name = item.name.toLowerCase();

    if (name.includes('glucose') || name.includes('hba1c')) {
      tests.push('Repeat fasting glucose or HbA1c');
    }
    if (name.includes('cholesterol') || name.includes('ldl') || name.includes('triglyceride')) {
      tests.push('Repeat lipid profile');
    }
    if (name.includes('vitamin d')) {
      tests.push('25-OH Vitamin D follow-up');
    }
    if (name.includes('hemoglobin') || name.includes('rbc') || name.includes('wbc') || name.includes('platelet')) {
      tests.push('Repeat complete blood count (CBC)');
    }
    if (name.includes('ferritin') || name.includes('iron')) {
      tests.push('Iron studies / ferritin panel');
    }
    if (name.includes('creatinine') || name.includes('bun') || name.includes('egfr')) {
      tests.push('Renal function panel');
    }
    if (name.includes('tsh') || name.includes('t3') || name.includes('t4')) {
      tests.push('Thyroid function panel');
    }
    if (name.includes('alt') || name.includes('ast') || name.includes('bilirubin')) {
      tests.push('Liver function tests');
    }
  }

  const normalizedReportType = reportType.toLowerCase();
  if (normalizedReportType.includes('ecg')) {
    tests.push('Repeat ECG or cardiology review');
  }
  if (normalizedReportType.includes('mri') || normalizedReportType.includes('ct') || normalizedReportType.includes('x-ray')) {
    tests.push('Specialist review of imaging findings');
  }

  return uniqueStrings(tests).slice(0, 6);
}

function inferDoctorSpecialty(analysis: NormalizedScanAnalysis): { doctorSpecialty: string; rationale: string } {
  const combined = [
    ...analysis.abnormalValues.map((item) => item.name.toLowerCase()),
    ...analysis.overallRisks.map((item) => item.condition.toLowerCase()),
    analysis.reportType.toLowerCase(),
  ].join(' ');

  if (combined.match(/cholesterol|ldl|triglyceride|ecg|heart|cardiac|hypertension/)) {
    return {
      doctorSpecialty: 'Cardiologist',
      rationale: 'Your latest findings point to cardiovascular markers that benefit from specialist review.',
    };
  }

  if (combined.match(/glucose|hba1c|thyroid|tsh|endocrine|diabetes/)) {
    return {
      doctorSpecialty: 'Endocrinologist',
      rationale: 'Several of the current markers are hormone or metabolic related and are best reviewed together.',
    };
  }

  if (combined.match(/creatinine|bun|egfr|renal|kidney/)) {
    return {
      doctorSpecialty: 'Nephrologist',
      rationale: 'Kidney-function-related markers are the strongest signal in the latest report.',
    };
  }

  if (combined.match(/hemoglobin|ferritin|cbc|rbc|wbc|platelet|anemia/)) {
    return {
      doctorSpecialty: 'Hematologist',
      rationale: 'Blood-count related abnormalities appear to be the main area needing follow-up.',
    };
  }

  if (combined.match(/mri|ct|x-ray|ultrasound|pathology/)) {
    return {
      doctorSpecialty: 'Relevant Organ Specialist',
      rationale: 'The report is imaging or pathology based, so follow-up should align to the organ system involved.',
    };
  }

  return {
    doctorSpecialty: 'Internal Medicine',
    rationale: 'A general physician can review the full pattern, confirm priorities, and coordinate any specialist referral.',
  };
}

function deriveSummary(scan: Scan, tests: NormalizedAnalysisTest[], overallRisks: NormalizedRisk[]): string {
  const firstAbnormal = tests.find((item) => item.status !== 'normal');
  const topRisk = overallRisks[0];

  if (firstAbnormal && topRisk) {
    return `${firstAbnormal.name} needs attention and the overall risk picture highlights ${topRisk.condition.toLowerCase()}. Review the report with a clinician to confirm next steps and timing.`;
  }

  if (firstAbnormal) {
    return `${firstAbnormal.name} is the main out-of-range value from the latest report. A clinician can help connect it with symptoms and decide if retesting is needed.`;
  }

  if (topRisk) {
    return `The latest report is largely summarized around ${topRisk.condition.toLowerCase()}. Use the saved insights and trends to guide your next follow-up.`;
  }

  return `Your latest ${getReportTypeLabel(scan.report_type)} is available. Review the summary, saved insights, and suggested follow-up steps below.`;
}

export function getReportTypeLabel(type: string | null | undefined): string {
  if (!type) return REPORT_TYPE_LABELS.general;

  const normalized = type
    .trim()
    .toLowerCase()
    .replace(/[^\w\s/-]+/g, '')
    .replace(/\s*\/\s*/g, '_')
    .replace(/[\s-]+/g, '_');

  return REPORT_TYPE_LABELS[normalized] || titleCase(type);
}

export function normalizeScanAnalysis(scan: Scan | null | undefined): NormalizedScanAnalysis {
  if (!scan) {
    return {
      reportType: REPORT_TYPE_LABELS.general,
      summary: 'No report data is available yet.',
      tests: [],
      abnormalValues: [],
      lifestyleRecommendations: [],
      overallRisks: [],
      suggestedQuestions: [],
      healthScore: 0,
      attentionScore: 0,
    };
  }

  const raw = asRecord(scan.raw_data);
  const reportType = getReportTypeLabel(asString(raw.reportType) || scan.report_type);

  const testsFromRaw = asArray(raw.tests).map((entry) => {
    const record = asRecord(entry);
    const status = normalizeTestStatus(asString(record.status));
    const value = asString(record.value) || 'Not provided';
    const unit = asString(record.unit);
    const normalRange = asString(record.normalRange) || 'Not provided';

    return {
      name: asString(record.name) || 'Clinical finding',
      value,
      unit,
      normalRange,
      status,
      explanation:
        asString(record.explanation) ||
        `${asString(record.name) || 'This finding'} needs clinical interpretation in the context of the full report.`,
      score: STATUS_SCORE[status],
    } satisfies NormalizedAnalysisTest;
  });

  const testsFromInsights = asArray(scan.insights).map((entry) => {
    const record = asRecord(entry);
    const status = normalizeTestStatus(asString(record.severity));

    return {
      name: asString(record.title) || 'Clinical finding',
      value: asString(record.value) || 'See report',
      unit: asString(record.unit),
      normalRange: asString(record.normalRange) || 'Not provided',
      status,
      explanation:
        asString(record.detail) ||
        `${asString(record.title) || 'This finding'} was flagged during report analysis.`,
      score: STATUS_SCORE[status],
    } satisfies NormalizedAnalysisTest;
  });

  const tests = (testsFromRaw.length > 0 ? testsFromRaw : testsFromInsights).sort((left, right) => right.score - left.score);

  const overallRisksFromRaw = asArray(raw.overallRisks).map((entry) => {
    const record = asRecord(entry);
    const level = normalizeRiskLevel(asString(record.level));

    return {
      condition: asString(record.condition) || 'General risk',
      level,
      explanation:
        asString(record.explanation) ||
        `This risk area was highlighted in your ${reportType.toLowerCase()} analysis.`,
      score: level === 'high' ? 0.82 : level === 'medium' ? 0.58 : 0.28,
    } satisfies NormalizedRisk;
  });

  const overallRisksFromScores = Object.entries(asRecord(scan.risk_scores)).map(([key, entry]) => {
    const record = asRecord(entry);
    const score = asNumber(record.score) ?? 0.3;

    return {
      condition: titleCase(asString(record.label) || key),
      level: score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low',
      explanation: `${titleCase(key)} is part of the saved risk summary for this report.`,
      score,
    } satisfies NormalizedRisk;
  });

  const overallRisks = (overallRisksFromRaw.length > 0 ? overallRisksFromRaw : overallRisksFromScores)
    .sort((left, right) => right.score - left.score);

  const abnormalValues = tests.filter((item) => item.status !== 'normal');

  const lifestyleRecommendationsFromRaw = [
    ...asArray(raw.lifestyleRecommendations).map((entry) => {
      const record = asRecord(entry);
      return {
        category: asString(record.category) || 'Follow-up',
        advice: asString(record.advice) || 'Review this recommendation with your clinician.',
        priority: normalizePriority(asString(record.priority)),
      } satisfies NormalizedLifestyleRecommendation;
    }),
    ...asArray(scan.recommendations).map((entry) => {
      const record = asRecord(entry);
      return {
        category: asString(record.context) || asString(record.category) || 'Follow-up',
        advice: asString(record.action) || asString(record.advice) || 'Review this recommendation with your clinician.',
        priority: normalizePriority(asString(record.priority)),
      } satisfies NormalizedLifestyleRecommendation;
    }),
  ];

  const lifestyleRecommendations = (
    lifestyleRecommendationsFromRaw.length > 0
      ? lifestyleRecommendationsFromRaw
      : inferLifestyleRecommendations(abnormalValues, reportType)
  ).sort((left, right) => PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]);

  const riskScores = [
    ...overallRisks.map((item) => item.score),
    ...abnormalValues.map((item) => item.score),
  ];

  const attentionScore = riskScores.length > 0
    ? Math.max(...riskScores)
    : 0.22;
  const averageRisk = riskScores.length > 0
    ? riskScores.reduce((total, score) => total + score, 0) / riskScores.length
    : 0.22;
  const healthScore = Math.max(0, Math.min(100, Math.round((1 - averageRisk) * 100)));

  const suggestedQuestions = uniqueStrings(asArray(raw.suggestedQuestions).map((entry) => asString(entry))).slice(0, 5);
  const summary = asString(raw.summary) || deriveSummary(scan, abnormalValues, overallRisks);

  return {
    reportType,
    summary,
    tests,
    abnormalValues,
    lifestyleRecommendations,
    overallRisks,
    suggestedQuestions,
    healthScore,
    attentionScore,
  };
}

export function buildFollowUpPlan(analysis: NormalizedScanAnalysis): FollowUpPlan {
  const { doctorSpecialty, rationale } = inferDoctorSpecialty(analysis);
  const suggestedTests = inferSuggestedTests(analysis.abnormalValues, analysis.reportType);
  const timeframe = analysis.attentionScore >= 0.75
    ? 'Within 7 days'
    : analysis.attentionScore >= 0.45
      ? 'Within 2-3 weeks'
      : 'At the next routine review';

  const actions: FollowUpPlanStep[] = [
    {
      title: `Book a ${doctorSpecialty} review`,
      detail: rationale,
      timeframe,
      category: 'Doctor',
      priority: analysis.attentionScore >= 0.75 ? 'high' : 'medium',
    },
    ...(suggestedTests.length > 0
      ? [{
          title: 'Plan follow-up testing',
          detail: `Prioritize ${suggestedTests.slice(0, 3).join(', ')} based on your clinician’s advice.`,
          timeframe: analysis.attentionScore >= 0.75 ? 'Within 1-2 weeks' : 'Within 4-6 weeks',
          category: 'Tests',
          priority: analysis.attentionScore >= 0.45 ? 'high' : 'medium',
        } satisfies FollowUpPlanStep]
      : []),
    ...analysis.lifestyleRecommendations.slice(0, 3).map((item) => ({
      title: item.category,
      detail: item.advice,
      timeframe: item.priority === 'high' ? 'Start this week' : 'Build over the next month',
      category: item.category,
      priority: item.priority,
    })),
  ];

  return {
    doctorSpecialty,
    rationale,
    suggestedTests,
    actions,
  };
}
