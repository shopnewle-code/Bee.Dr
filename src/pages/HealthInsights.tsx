import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  HeartPulse,
  Loader2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TestTube,
  TrendingUp,
  Upload,
} from 'lucide-react';

import BottomNav from '@/components/BottomNav';
import { HealthScoreRing } from '@/components/ai/HealthScoreRing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  asRecord,
  buildFollowUpPlan,
  getReportTypeLabel,
  normalizeScanAnalysis,
  type NormalizedAnalysisTest,
} from '@/lib/report-analysis';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';

type Scan = Tables<'scan_results'>;
type HealthInsightRow = Tables<'health_insights'>;
type TestResultRow = Tables<'test_results'>;

type SeverityTone = 'destructive' | 'warning' | 'info' | 'success';
type TestStatus = 'normal' | 'high' | 'low' | 'critical';

interface InsightFeedItem {
  id: string;
  title: string;
  summary: string;
  score: number;
  abnormalityCount: number;
  recommendationCount: number;
  generatedAt: string;
  reportLabel: string;
}

const STATUS_SCORE: Record<TestStatus, number> = {
  normal: 0.2,
  low: 0.4,
  high: 0.62,
  critical: 0.86,
};

const priorityStyles = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-success/10 text-success border-success/20',
} as const;

function motionProps(index: number) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, ease: 'easeOut' as const, delay: index * 0.05 },
  };
}

function readString(value: Json | undefined, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return fallback;
}

function readNumber(value: Json | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatNumericValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatRange(min: number | null, max: number | null) {
  if (min !== null && max !== null) return `${formatNumericValue(min)} - ${formatNumericValue(max)}`;
  if (min !== null) return `>${formatNumericValue(min)}`;
  if (max !== null) return `<${formatNumericValue(max)}`;
  return 'Not provided';
}

function normalizeTestStatus(status: string | null | undefined): TestStatus {
  const normalized = (status || 'normal').trim().toLowerCase();

  if (['critical', 'urgent', 'severe', 'danger'].includes(normalized)) return 'critical';
  if (['high', 'elevated', 'positive', 'above_range'].includes(normalized)) return 'high';
  if (['low', 'below_range', 'deficient'].includes(normalized)) return 'low';
  return 'normal';
}

function getSeverityState(score: number) {
  if (score >= 0.75) {
    return {
      label: 'High attention',
      tone: 'destructive' as SeverityTone,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      accent: 'text-destructive',
    };
  }

  if (score >= 0.45) {
    return {
      label: 'Moderate attention',
      tone: 'warning' as SeverityTone,
      className: 'bg-warning/10 text-warning border-warning/20',
      accent: 'text-warning',
    };
  }

  return {
    label: 'Low attention',
    tone: 'success' as SeverityTone,
    className: 'bg-success/10 text-success border-success/20',
    accent: 'text-success',
  };
}

function getStatusState(status: string) {
  const normalized = normalizeTestStatus(status);

  if (normalized === 'critical') {
    return {
      label: 'Critical',
      tone: 'destructive' as SeverityTone,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      borderClass: 'border-destructive/25',
      valueClass: 'text-destructive',
    };
  }

  if (normalized === 'high') {
    return {
      label: 'High',
      tone: 'warning' as SeverityTone,
      className: 'bg-warning/10 text-warning border-warning/20',
      borderClass: 'border-warning/25',
      valueClass: 'text-warning',
    };
  }

  if (normalized === 'low') {
    return {
      label: 'Low',
      tone: 'info' as SeverityTone,
      className: 'bg-info/10 text-info border-info/20',
      borderClass: 'border-info/25',
      valueClass: 'text-info',
    };
  }

  return {
    label: 'Normal',
    tone: 'success' as SeverityTone,
    className: 'bg-success/10 text-success border-success/20',
    borderClass: 'border-border',
    valueClass: 'text-success',
  };
}

function normalizeTrackedResult(result: TestResultRow): NormalizedAnalysisTest {
  const status = normalizeTestStatus(result.status);

  return {
    name: result.test_name,
    value: formatNumericValue(result.result_value),
    unit: result.unit || '',
    normalRange: formatRange(result.normal_range_min, result.normal_range_max),
    status,
    explanation:
      status === 'critical'
        ? 'This result is marked as critical and deserves timely medical follow-up.'
        : status === 'high'
          ? 'This result is above the recorded reference range and should be reviewed in context.'
          : status === 'low'
            ? 'This result is below the recorded reference range and may need follow-up.'
            : 'This result is within the recorded reference range.',
    score: STATUS_SCORE[status],
  };
}

function mapInsightRow(item: HealthInsightRow): InsightFeedItem {
  const details = asRecord(item.details);
  const title = readString(details.title) || readString(details.headline) || readString(details.summary) || getReportTypeLabel(item.risk_type);
  const summary =
    readString(details.summary) ||
    readString(details.explanation) ||
    readString(details.detail) ||
    `${getReportTypeLabel(item.risk_type)} insight saved from your recent report analysis.`;
  const abnormalityCount =
    readNumber(details.abnormalCount) ??
    readNumber(details.abnormal_count) ??
    readArray(details.abnormalValues).length ??
    readArray(details.abnormal_values).length ??
    readArray(details.tests).length ??
    0;
  const recommendationCount =
    readNumber(details.recommendationCount) ??
    readNumber(details.recommendation_count) ??
    readArray(details.recommendations).length ??
    readArray(details.lifestyleRecommendations).length ??
    0;
  const reportLabel = getReportTypeLabel(
    readString(details.reportType) || readString(details.report_type) || item.risk_type,
  );

  return {
    id: item.id,
    title,
    summary,
    score: item.risk_score,
    abnormalityCount,
    recommendationCount,
    generatedAt: item.generated_at,
    reportLabel,
  };
}

const HealthInsightsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsightRow[]>([]);
  const [testResults, setTestResults] = useState<TestResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthInsights = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const [scanResponse, insightResponse, testResponse] = await Promise.all([
      supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('health_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(12),
      supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(150),
    ]);

    if (scanResponse.error) console.error('Failed to load scans:', scanResponse.error);
    if (insightResponse.error) console.error('Failed to load health insights:', insightResponse.error);
    if (testResponse.error) console.error('Failed to load test results:', testResponse.error);

    setScans(scanResponse.data || []);
    setHealthInsights(insightResponse.data || []);
    setTestResults(testResponse.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchHealthInsights();
  }, [fetchHealthInsights, user]);

  const latestScan = scans[0] ?? null;
  const latestAnalysis = useMemo(() => normalizeScanAnalysis(latestScan), [latestScan]);
  const followUpPlan = useMemo(() => buildFollowUpPlan(latestAnalysis), [latestAnalysis]);

  const normalizedTrackedResults = useMemo(
    () => testResults.map(normalizeTrackedResult),
    [testResults],
  );

  const trackedTestCount = useMemo(() => {
    return new Set(testResults.map((item) => item.test_name.trim().toLowerCase())).size;
  }, [testResults]);

  const abnormalTrackedResults = useMemo(
    () => normalizedTrackedResults.filter((item) => item.status !== 'normal').sort((left, right) => right.score - left.score),
    [normalizedTrackedResults],
  );

  const topAbnormalValues = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...latestAnalysis.abnormalValues, ...abnormalTrackedResults].filter((item) => {
      const key = item.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return merged.slice(0, 4);
  }, [abnormalTrackedResults, latestAnalysis.abnormalValues]);

  const topLifestyleRecommendations = useMemo(
    () => latestAnalysis.lifestyleRecommendations.slice(0, 4),
    [latestAnalysis.lifestyleRecommendations],
  );

  const recentInsightFeed = useMemo(() => {
    if (healthInsights.length > 0) {
      return healthInsights.slice(0, 4).map(mapInsightRow);
    }

    return scans.slice(0, 4).map((scan) => {
      const normalized = normalizeScanAnalysis(scan);

      return {
        id: scan.id,
        title: getReportTypeLabel(scan.report_type),
        summary: normalized.summary,
        score: normalized.attentionScore,
        abnormalityCount: normalized.abnormalValues.length,
        recommendationCount: normalized.lifestyleRecommendations.length,
        generatedAt: scan.created_at,
        reportLabel: normalized.reportType,
      } satisfies InsightFeedItem;
    });
  }, [healthInsights, scans]);

  const highestSignalScore = useMemo(() => {
    return Math.max(
      latestAnalysis.attentionScore,
      recentInsightFeed[0]?.score ?? 0,
      topAbnormalValues[0]?.score ?? 0,
    );
  }, [latestAnalysis.attentionScore, recentInsightFeed, topAbnormalValues]);

  const severityState = useMemo(() => getSeverityState(highestSignalScore), [highestSignalScore]);
  const abnormalValuesCount = latestAnalysis.abnormalValues.length || abnormalTrackedResults.length;

  const metrics = useMemo(
    () => [
      { label: 'Abnormal values', value: abnormalValuesCount, tone: 'text-destructive' },
      { label: 'Saved insights', value: healthInsights.length, tone: 'text-primary' },
      { label: 'Tracked tests', value: trackedTestCount, tone: 'text-secondary' },
    ],
    [abnormalValuesCount, healthInsights.length, trackedTestCount],
  );

  const openDashboard = useCallback(() => navigate('/dashboard'), [navigate]);
  const openUpload = useCallback(() => navigate('/upload'), [navigate]);
  const openTrends = useCallback(() => navigate('/trends'), [navigate]);
  const openSymptomChecker = useCallback(() => navigate('/symptom-checker'), [navigate]);
  const openLatestReport = useCallback(() => {
    if (!latestScan) return;
    navigate(`/results/${latestScan.id}`);
  }, [latestScan, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold text-foreground">Loading health insights</p>
            <p className="text-sm text-muted-foreground">Pulling your latest scans, tracked tests, and saved AI summaries.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!latestScan) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={openDashboard} aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-display text-sm font-bold text-foreground">Health Insights</p>
                <p className="text-xs text-muted-foreground">AI health analytics hub</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-180px)] max-w-3xl items-center px-4 py-10">
          <motion.section
            {...motionProps(0)}
            className="w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 text-center shadow-lg"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <HeartPulse className="h-10 w-10" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">No scans available yet</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Upload your first medical report to unlock AI summaries, attention flags, tracked biomarker counts, and next-step recommendations.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={openUpload} className="rounded-2xl px-5">
                <Upload className="h-4 w-4" />
                Upload report
              </Button>
              <Button variant="outline" onClick={openDashboard} className="rounded-2xl px-5">
                Back to dashboard
              </Button>
            </div>
          </motion.section>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="pointer-events-none fixed inset-0 gradient-mesh opacity-80" />

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={openDashboard} aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold text-foreground">Health Insights</h1>
              <p className="truncate text-xs text-muted-foreground">
                Unified AI report summary, risk signals, and follow-up planning
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-6">
        <motion.section
          {...motionProps(0)}
          className="overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/10 via-card to-secondary/10 shadow-lg"
        >
          <div className="grid gap-6 p-6 lg:grid-cols-[220px,1fr] lg:p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm">
                <HealthScoreRing score={latestAnalysis.healthScore} size={170} />
              </div>
              <Badge className={cn('rounded-full border px-3 py-1 text-xs font-semibold', severityState.className)}>
                {severityState.label}
              </Badge>
            </div>

            <div className="min-w-0 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {latestAnalysis.reportType}
                </Badge>
                <Badge className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  Uploaded {formatDateLabel(latestScan.created_at)}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AI Health Overview</p>
                <h2 className="font-display text-3xl font-bold leading-tight text-foreground">
                  {latestScan.file_name}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {latestAnalysis.summary}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
                  >
                    <p className={cn('font-display text-3xl font-bold', metric.tone)}>{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...motionProps(1)} className="grid gap-3 sm:grid-cols-3">
          <Button onClick={openLatestReport} className="h-12 rounded-2xl">
            View Full Report
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={openTrends} className="h-12 rounded-2xl border-border bg-card/80">
            <TrendingUp className="h-4 w-4" />
            Trends
          </Button>
          <Button variant="secondary" onClick={openSymptomChecker} className="h-12 rounded-2xl">
            <Stethoscope className="h-4 w-4" />
            Symptom Checker
          </Button>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <motion.section
            {...motionProps(2)}
            className="rounded-3xl border border-border bg-card/85 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-xl font-bold text-foreground">Risk & Severity Assessment</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Severity badges are driven by saved AI scores: 0.75+ high attention, 0.45-0.74 moderate attention, and below 0.45 low attention.
                </p>
              </div>
              <Badge className={cn('rounded-full border px-3 py-1 text-xs font-semibold', severityState.className)}>
                {severityState.label}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {latestAnalysis.overallRisks.slice(0, 3).map((risk, index) => {
                const state = getSeverityState(risk.score);
                return (
                  <article
                    key={`${risk.condition}-${index}`}
                    className="rounded-2xl border border-border/70 bg-accent/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-sm font-semibold text-foreground">{risk.condition}</p>
                      <Badge className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', state.className)}>
                        {state.label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{risk.explanation}</p>
                  </article>
                );
              })}
            </div>

            {latestAnalysis.overallRisks.length === 0 && (
              <div className="mt-5 rounded-2xl border border-border/70 bg-accent/30 p-4 text-sm text-muted-foreground">
                No explicit risk clusters were stored for the latest scan, so the dashboard is leaning on abnormal tests and recent insight scores instead.
              </div>
            )}
          </motion.section>

          <motion.section
            {...motionProps(3)}
            className="rounded-3xl border border-border bg-card/85 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Latest 8 scans</p>
                <h3 className="mt-1 font-display text-xl font-bold text-foreground">Recent reports</h3>
              </div>
              <Badge className="rounded-full border border-border bg-accent/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                {scans.length} report{scans.length === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {scans.map((scan, index) => (
                <button
                  key={scan.id}
                  type="button"
                  onClick={() => navigate(`/results/${scan.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{scan.file_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getReportTypeLabel(scan.report_type)} • {formatDateLabel(scan.created_at)}
                    </p>
                  </div>
                  <ArrowRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition', index === 0 && 'text-primary')} />
                </button>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.section
            {...motionProps(4)}
            className="rounded-3xl border border-border bg-card/85 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">What Needs Attention</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The most important out-of-range findings from your saved report analysis and structured test results.
            </p>

            <div className="mt-5 space-y-3">
              {topAbnormalValues.map((item, index) => {
                const state = getStatusState(item.status);
                return (
                  <motion.article
                    key={`${item.name}-${index}`}
                    {...motionProps(index)}
                    className={cn('rounded-2xl border bg-background/90 p-4', state.borderClass)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-bold text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Normal range: {item.normalRange} {item.unit}</p>
                      </div>
                      <Badge className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', state.className)}>
                        {state.label}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <p className={cn('font-display text-3xl font-bold', state.valueClass)}>{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.unit}</p>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.explanation}</p>
                  </motion.article>
                );
              })}

              {topAbnormalValues.length === 0 && (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm text-success">
                  No abnormal values were surfaced from the latest scan or tracked test results.
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            {...motionProps(5)}
            className="rounded-3xl border border-border bg-card/85 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">Recommended Next Steps</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Lifestyle recommendations are grouped by category so you can act on the clearest improvements first.
            </p>

            <div className="mt-5 space-y-3">
              {topLifestyleRecommendations.map((item, index) => (
                <article
                  key={`${item.category}-${index}`}
                  className="rounded-2xl border border-border/70 bg-background/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-base font-semibold text-foreground">{item.category}</p>
                    <Badge className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', priorityStyles[item.priority])}>
                      {item.priority} priority
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.advice}</p>
                </article>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <motion.section
            {...motionProps(6)}
            className="rounded-3xl border border-border bg-card/85 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">Doctor & Test Suggestions</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These suggestions are AI-generated for planning purposes and should be confirmed by a licensed clinician.
            </p>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recommended specialty</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{followUpPlan.doctorSpecialty}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{followUpPlan.rationale}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-primary" />
                <p className="font-display text-base font-semibold text-foreground">Suggested tests</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {followUpPlan.suggestedTests.length > 0 ? (
                  followUpPlan.suggestedTests.map((item) => (
                    <Badge
                      key={item}
                      className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary"
                    >
                      {item}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No additional tests were inferred from the saved analysis.</p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {followUpPlan.actions.map((action, index) => (
                <article key={`${action.title}-${index}`} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-base font-semibold text-foreground">{action.title}</p>
                    <Badge className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', priorityStyles[action.priority])}>
                      {action.timeframe}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.detail}</p>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section
            {...motionProps(7)}
            className="rounded-3xl border border-border bg-card/85 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">Recent AI Insight History</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your latest saved insights with their severity badge, abnormal finding count, and recommendation count.
            </p>

            <div className="mt-5 space-y-3">
              {recentInsightFeed.map((item) => {
                const state = getSeverityState(item.score);
                return (
                  <article key={item.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-bold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.reportLabel} • {formatDateLabel(item.generatedAt)}
                        </p>
                      </div>
                      <Badge className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', state.className)}>
                        {state.label}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-card px-3 py-2">
                        <p className="font-display text-2xl font-bold text-foreground">{item.abnormalityCount}</p>
                        <p className="text-xs text-muted-foreground">Abnormalities</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-card px-3 py-2">
                        <p className="font-display text-2xl font-bold text-foreground">{item.recommendationCount}</p>
                        <p className="text-xs text-muted-foreground">Recommendations</p>
                      </div>
                    </div>
                  </article>
                );
              })}

              {recentInsightFeed.length === 0 && (
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                  No saved health insights yet. Upload more reports to build a stronger insight history.
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <motion.footer
          {...motionProps(8)}
          className="rounded-3xl border border-border bg-accent/40 p-5 text-sm leading-6 text-muted-foreground shadow-sm"
        >
          This dashboard is informational only and does not replace medical advice, diagnosis, or treatment. Always confirm urgent findings and treatment decisions with a qualified healthcare professional.
        </motion.footer>
      </main>

      <BottomNav />
    </div>
  );
};

export default HealthInsightsPage;
