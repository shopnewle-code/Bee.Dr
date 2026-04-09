import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
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
import {
  buildFollowUpPlan,
  getReportTypeLabel,
  normalizeScanAnalysis,
} from '@/lib/report-analysis';

type Scan = Tables<'scan_results'>;
type HealthInsightRow = Tables<'health_insights'>;
type TestResultRow = Tables<'test_results'>;

function asRecord(value: Json | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getInsightSeverity(score: number) {
  if (score >= 0.75) return 'High attention';
  if (score >= 0.45) return 'Moderate attention';
  return 'Low attention';
}

function getTestStatusColor(status: string) {
  if (status === 'critical') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (status === 'high') return 'bg-warning/10 text-warning border-warning/20';
  if (status === 'low') return 'bg-info/10 text-info border-info/20';
  return 'bg-success/10 text-success border-success/20';
}

function buildRecentInsightFeed(insights: HealthInsightRow[]) {
  return insights.slice(0, 4).map((row) => {
    const details = asRecord(row.details);
    return {
      id: row.id,
      title: String(details?.summary || row.risk_type.replace(/_/g, ' ')),
      summary: String(details?.summary || 'AI generated a new health insight from your report history.'),
      abnormalValues: Array.isArray(details?.abnormal_values) ? details?.abnormal_values.length : 0,
      recommendationCount: Array.isArray(details?.recommendations) ? details?.recommendations.length : 0,
      severity: getInsightSeverity(row.risk_score),
      generatedAt: row.generated_at,
    };
  });
}

const HealthInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<Scan[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsightRow[]>([]);
  const [testResults, setTestResults] = useState<TestResultRow[]>([]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
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
    ]).then(([scanResponse, insightResponse, testsResponse]) => {
      setScans(scanResponse.data || []);
      setHealthInsights(insightResponse.data || []);
      setTestResults(testsResponse.data || []);
      setLoading(false);
    });
  }, [user]);

  const latestScan = scans[0] || null;
  const latestAnalysis = latestScan ? normalizeScanAnalysis(latestScan) : null;
  const followUpPlan = latestAnalysis ? buildFollowUpPlan(latestAnalysis) : null;
  const recentInsightFeed = useMemo(() => buildRecentInsightFeed(healthInsights), [healthInsights]);
  const uniqueTrackedTests = new Set(testResults.map((row) => row.test_name.toLowerCase())).size;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!latestScan || !latestAnalysis) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Health Insights</span>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <HeartPulse className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">No health insights yet</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Upload your first medical report and Bee.dr will extract values, explain abnormalities, and build a clean AI health dashboard for you.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button className="gradient-primary text-primary-foreground" onClick={() => navigate('/upload')}>
                Upload Report <Upload className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/symptom-checker')}>
                Try Symptom Checker
              </Button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const topAbnormalValues = latestAnalysis.abnormalTests.slice(0, 4);
  const topRecommendations = latestAnalysis.lifestyleRecommendations.slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Health Insights</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary/80 font-semibold">AI Health Overview</p>
              <h1 className="text-2xl font-display font-bold text-foreground mt-1">{latestAnalysis.summary}</h1>
              <p className="text-xs text-muted-foreground mt-2">
                Based on your latest {getReportTypeLabel(latestAnalysis.reportType).toLowerCase()} uploaded on{' '}
                {new Date(latestScan.created_at).toLocaleDateString()}.
              </p>
            </div>
            <div className="rounded-2xl bg-background/80 border border-border px-4 py-3 text-center min-w-[96px]">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Health Score</p>
              <p className="text-3xl font-display font-bold text-foreground">{latestAnalysis.healthScore}</p>
              <p className="text-[10px] text-muted-foreground">out of 100</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-2xl bg-background/75 border border-border p-3">
              <p className="text-lg font-display font-bold text-foreground">{topAbnormalValues.length}</p>
              <p className="text-[11px] text-muted-foreground">Abnormal values</p>
            </div>
            <div className="rounded-2xl bg-background/75 border border-border p-3">
              <p className="text-lg font-display font-bold text-foreground">{healthInsights.length}</p>
              <p className="text-[11px] text-muted-foreground">AI insights saved</p>
            </div>
            <div className="rounded-2xl bg-background/75 border border-border p-3">
              <p className="text-lg font-display font-bold text-foreground">{uniqueTrackedTests}</p>
              <p className="text-[11px] text-muted-foreground">Tests tracked</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">What Needs Attention</h2>
          </div>
          {topAbnormalValues.length > 0 ? (
            <div className="space-y-2">
              {topAbnormalValues.map((test) => (
                <div
                  key={`${test.name}-${test.value}`}
                  className={`rounded-xl border px-3 py-3 ${getTestStatusColor(test.status)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{test.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{test.explanation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-display font-bold text-foreground">{test.value} {test.unit}</p>
                      <p className="text-[10px] text-muted-foreground">Normal {test.normalRange}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No strong abnormalities were highlighted in the latest report. Keep tracking future reports for trends.
            </p>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Recommended Next Steps</h2>
          </div>
          {topRecommendations.length > 0 ? (
            <div className="space-y-2">
              {topRecommendations.map((recommendation) => (
                <div key={`${recommendation.category}-${recommendation.advice}`} className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">{recommendation.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">{recommendation.advice}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bee.dr has not generated lifestyle actions yet. Upload another report or ask the symptom checker for more context.
            </p>
          )}
        </motion.section>

        {followUpPlan && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-display font-semibold text-foreground">Doctor and Test Suggestions</h2>
            </div>

            <div className="rounded-xl bg-accent/40 border border-border px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Suggested doctor</p>
              <p className="text-sm font-semibold text-foreground mt-1">{followUpPlan.recommendedDoctor}</p>
              <p className="text-xs text-muted-foreground mt-1">{followUpPlan.rationale}</p>
            </div>

            <div className="space-y-2">
              {followUpPlan.suggestedTests.map((testName) => (
                <div key={testName} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <TestTube className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{testName}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Recent AI Insight History</h2>
          </div>

          {recentInsightFeed.length > 0 ? (
            <div className="space-y-2">
              {recentInsightFeed.map((item) => (
                <div key={item.id} className="rounded-xl border border-border px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      {item.severity}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-muted-foreground">
                    <span className="px-2 py-1 rounded-full bg-accent">{item.abnormalValues} abnormalities</span>
                    <span className="px-2 py-1 rounded-full bg-accent">{item.recommendationCount} recommendations</span>
                    <span className="px-2 py-1 rounded-full bg-accent">{new Date(item.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              AI insights will appear here automatically as you upload more reports and Bee.dr learns your health history.
            </p>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <Button className="gradient-primary text-primary-foreground" onClick={() => navigate(`/results/${latestScan.id}`)}>
            View Full Report <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/trends')}>
            Trends
          </Button>
          <Button variant="outline" onClick={() => navigate('/symptom-checker')}>
            Symptom Checker
          </Button>
        </motion.section>

        <div className="rounded-2xl bg-accent/30 border border-border p-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Bee.dr insights are informational only. Always confirm abnormal values, medicines, and treatment decisions with a qualified clinician.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default HealthInsights;
