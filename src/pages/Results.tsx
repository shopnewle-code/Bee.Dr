import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileText,
  Globe,
  Loader2,
  MessageCircle,
  Radar,
  Shield,
  Sparkles,
  Stethoscope,
  TestTube,
} from 'lucide-react';
import type { Json, Tables } from '@/integrations/supabase/types';
import ReportExplanation from '@/components/report/ReportExplanation';
import ReportChat from '@/components/report/ReportChat';
import RiskRadarChart from '@/components/report/RiskRadarChart';
import { useSimpleLanguage } from '@/hooks/use-simple-language';
import OCRHighlightedText from '@/components/report/OCRHighlightedText';
import { useLanguage } from '@/hooks/use-language';
import { toast } from 'sonner';
import {
  buildFallbackReportAnalysis,
  buildFollowUpPlan,
  getReportTypeLabel,
  normalizeScanAnalysis,
} from '@/lib/report-analysis';

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Tables<'scan_results'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const { language, languageInfo } = useLanguage();
  const { simpleLanguage } = useSimpleLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyOCR = async () => {
    if (!scan?.ocr_text) return;
    await navigator.clipboard.writeText(scan.ocr_text);
    setCopied(true);
    toast.success('OCR text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!id || !user) return;

    supabase
      .from('scan_results')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setScan(data);
        setLoading(false);
      });
  }, [id, user]);

  useEffect(() => {
    if (!scan) return;

    const cachedRawData = asRecord(scan.raw_data) || {};
    if (cachedRawData.summary) {
      setAnalysis(cachedRawData);
      return;
    }

    const fetchAnalysis = async () => {
      setAnalysisLoading(true);
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-report`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              scanData: {
                file_name: scan.file_name,
                report_type: scan.report_type,
                risk_scores: scan.risk_scores,
                insights: scan.insights,
                recommendations: scan.recommendations,
                raw_data: scan.raw_data,
              },
              reportType: scan.report_type || 'general',
              extractedData: cachedRawData.extractedData ?? cachedRawData.structuredExtraction ?? undefined,
              ocrText: scan.ocr_text ?? cachedRawData.ocrText ?? undefined,
              language,
              simpleLanguage,
            }),
          },
        );

        if (!resp.ok) throw new Error('Failed to analyze');

        const data = await resp.json();
        const freshAnalysis = asRecord(data) || {};
        const mergedAnalysis = {
          ...cachedRawData,
          ...freshAnalysis,
          extractedData:
            cachedRawData.extractedData ??
            cachedRawData.structuredExtraction ??
            freshAnalysis.extractedData ??
            null,
          ocrText: scan.ocr_text ?? cachedRawData.ocrText ?? freshAnalysis.ocrText ?? '',
          processedAt: cachedRawData.processedAt ?? new Date().toISOString(),
          reportType: cachedRawData.reportType ?? scan.report_type ?? 'general',
        };

        setAnalysis(mergedAnalysis);
        await supabase.from('scan_results').update({ raw_data: mergedAnalysis }).eq('id', scan.id);
      } catch (error: any) {
        const fallback = {
          ...buildFallbackReportAnalysis({
            reportType: scan.report_type || 'general',
            extractedData: cachedRawData.extractedData ?? cachedRawData.structuredExtraction ?? null,
            ocrText: scan.ocr_text ?? '',
            fileName: scan.file_name,
          }),
          reportType: scan.report_type || 'general',
        };
        setAnalysis(fallback);
        toast.error(error.message || 'Failed to load analysis');
      } finally {
        setAnalysisLoading(false);
      }
    };

    fetchAnalysis();
  }, [scan, language, simpleLanguage]);

  const displayAnalysis = useMemo(() => {
    if (!scan) return null;
    if (analysis) return analysis;

    const cachedRawData = asRecord(scan.raw_data) || {};
    if (Object.keys(cachedRawData).length > 0) {
      return cachedRawData;
    }

    return {
      ...buildFallbackReportAnalysis({
        reportType: scan.report_type || 'general',
        extractedData: null,
        ocrText: scan.ocr_text ?? '',
        fileName: scan.file_name,
      }),
      reportType: scan.report_type || 'general',
    };
  }, [analysis, scan]);

  const normalizedAnalysis = useMemo(() => {
    if (!scan || !displayAnalysis) return null;

    return normalizeScanAnalysis({
      report_type: scan.report_type,
      raw_data: displayAnalysis as Json,
      insights: scan.insights,
      recommendations: scan.recommendations,
      risk_scores: scan.risk_scores,
    });
  }, [displayAnalysis, scan]);

  const followUpPlan = normalizedAnalysis ? buildFollowUpPlan(normalizedAnalysis) : null;
  const topAbnormalValues = normalizedAnalysis?.abnormalTests.slice(0, 3) || [];
  const topRecommendations = normalizedAnalysis?.lifestyleRecommendations.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!scan || !displayAnalysis || !normalizedAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Scan not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Activity className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-display font-bold text-foreground block truncate">{scan.file_name}</span>
            <span className="text-[11px] text-muted-foreground">
              {getReportTypeLabel(normalizedAnalysis.reportType)} • {new Date(scan.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => navigate('/language')}
              className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 bg-card text-foreground shadow-sm"
            >
              <Globe className="w-3 h-3" />
              {languageInfo.flag} {languageInfo.native}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary/80 font-semibold">AI Report Analysis</p>
              <h1 className="text-2xl font-display font-bold text-foreground mt-1">{normalizedAnalysis.summary}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Bee.dr extracted {normalizedAnalysis.tests.length} value{normalizedAnalysis.tests.length === 1 ? '' : 's'} from this report and highlighted the most important follow-up items.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-center shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Health Score</p>
              <p className="text-3xl font-display font-bold text-foreground">{normalizedAnalysis.healthScore}</p>
              <p className="text-[10px] text-muted-foreground">/100</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-accent/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Top Abnormal Values</p>
              </div>
              {topAbnormalValues.length > 0 ? (
                <div className="space-y-2">
                  {topAbnormalValues.map((test) => (
                    <div key={`${test.name}-${test.value}`} className="rounded-xl bg-card px-3 py-2 border border-border">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-foreground">{test.name}</span>
                        <span className="text-sm font-display font-bold text-foreground">{test.value} {test.unit}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Normal {test.normalRange}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No strong abnormalities were highlighted in this report.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-accent/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Doctor and Tests</p>
              </div>
              {followUpPlan ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{followUpPlan.recommendedDoctor}</p>
                    <p className="text-xs text-muted-foreground mt-1">{followUpPlan.rationale}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {followUpPlan.suggestedTests.slice(0, 3).map((testName) => (
                      <span key={testName} className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-[11px] text-foreground">
                        <TestTube className="w-3 h-3 text-primary" /> {testName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Bee.dr will suggest relevant doctor follow-up as soon as report insights are available.</p>
              )}
            </div>
          </div>

          {topRecommendations.length > 0 && (
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Immediate Recommendations</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {topRecommendations.map((recommendation) => (
                  <span
                    key={`${recommendation.category}-${recommendation.advice}`}
                    className="inline-flex items-center rounded-full bg-card border border-border px-3 py-1 text-[11px] text-foreground"
                  >
                    {recommendation.category}: {recommendation.advice}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button className="gradient-primary text-primary-foreground" onClick={() => navigate('/health-insights')}>
              Insights Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/symptom-checker')}>
              Symptom Checker
            </Button>
            <Button variant="ghost" onClick={() => navigate('/upload')}>
              Upload Another Report
            </Button>
          </div>
        </motion.section>

        <Tabs defaultValue="explanation" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="explanation" className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Report
            </TabsTrigger>
            <TabsTrigger value="radar" className="flex items-center gap-1.5 text-xs">
              <Radar className="w-3.5 h-3.5" /> Radar
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" /> Risks
            </TabsTrigger>
            <TabsTrigger value="ocr" className="flex items-center gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" /> OCR
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs">
              <MessageCircle className="w-3.5 h-3.5" /> Ask AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explanation">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing your report with AI...</p>
              </div>
            ) : (
              <ReportExplanation analysis={displayAnalysis as any} />
            )}
          </TabsContent>

          <TabsContent value="radar">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Generating health radar...</p>
              </div>
            ) : (
              <RiskRadarChart analysis={displayAnalysis as any} />
            )}
          </TabsContent>

          <TabsContent value="risks">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Evaluating health risks...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {normalizedAnalysis.overallRisks.length > 0 && (
                  <div className="space-y-3">
                    {normalizedAnalysis.overallRisks.map((risk, index) => (
                      <motion.div
                        key={`${risk.condition}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground text-sm">{risk.condition}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              risk.level === 'high'
                                ? 'bg-destructive/10 text-destructive'
                                : risk.level === 'medium'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-success/10 text-success'
                            }`}
                          >
                            {risk.level} risk
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{risk.explanation}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {normalizedAnalysis.abnormalTests.length > 0 && (
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Abnormal Values</h3>
                    <div className="space-y-2">
                      {normalizedAnalysis.abnormalTests.map((test, index) => (
                        <div
                          key={`${test.name}-${index}`}
                          className={`bg-card border rounded-xl p-3 ${
                            test.status === 'critical'
                              ? 'border-destructive/30'
                              : test.status === 'high'
                                ? 'border-warning/30'
                                : 'border-info/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-sm">{test.name}</span>
                            <span className="text-sm font-display font-bold text-foreground">{test.value} {test.unit}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Normal: {test.normalRange} {test.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {normalizedAnalysis.lifestyleRecommendations.length > 0 && (
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Action Plan</h3>
                    <div className="space-y-2">
                      {normalizedAnalysis.lifestyleRecommendations.map((recommendation, index) => (
                        <div key={`${recommendation.category}-${index}`} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              recommendation.priority === 'high'
                                ? 'bg-destructive'
                                : recommendation.priority === 'medium'
                                  ? 'bg-warning'
                                  : 'bg-success'
                            }`}
                          />
                          <div>
                            <span className="font-medium text-foreground text-xs">{recommendation.category}</span>
                            <p className="text-xs text-muted-foreground">{recommendation.advice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ocr">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground text-sm">Extracted OCR Text</h3>
                <div className="flex items-center gap-2">
                  {scan.ocr_text && (() => {
                    const pageCount = (scan.ocr_text.match(/---\s*Page\s+\d+\s*---/gi) || []).length;
                    return pageCount > 0 ? (
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">
                        📄 {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    ) : null;
                  })()}
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    AI Vision
                  </span>
                  {scan.ocr_text && (
                    <Button variant="ghost" size="sm" onClick={handleCopyOCR} className="h-7 px-2 text-xs gap-1">
                      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the raw text extracted from your report
                {scan.ocr_text && (scan.ocr_text.match(/---\s*Page\s+\d+\s*---/gi) || []).length > 1 ? ' (multi-page PDF)' : ''}. Verify that AI read your report correctly.
              </p>
              {scan.ocr_text ? (
                <div className="bg-card border border-border rounded-xl p-4 max-h-[400px] overflow-auto">
                  <OCRHighlightedText text={scan.ocr_text} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Eye className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No OCR text available</p>
                  <p className="text-[10px] text-muted-foreground text-center max-w-xs">
                    This report was processed before vision OCR was enabled.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <ReportChat
              scanData={{
                file_name: scan.file_name,
                risk_scores: scan.risk_scores,
                insights: scan.insights,
                recommendations: scan.recommendations,
                raw_data: displayAnalysis as Json,
              }}
              suggestedQuestions={normalizedAnalysis.suggestedQuestions}
            />
          </TabsContent>
        </Tabs>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-accent/30 border border-border rounded-xl p-4 mt-6">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            ⚕️ <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment. Bee.dr does not replace your doctor.
          </p>
        </motion.div>

        <div className="flex gap-3 pb-8 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate('/upload')}>
            Scan Another Report
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
