import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, ArrowLeft, Shield, FileText, MessageCircle,
  Globe, Loader2, Radar, Eye
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import ReportExplanation from '@/components/report/ReportExplanation';
import ReportChat from '@/components/report/ReportChat';
import RiskRadarChart from '@/components/report/RiskRadarChart';
import { useSimpleLanguage } from '@/hooks/use-simple-language';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/hooks/use-language';
import { toast } from 'sonner';

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Tables<'scan_results'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const { language, setLanguage, languageInfo } = useLanguage();
  const { simpleLanguage } = useSimpleLanguage();

  const [showOCR, setShowOCR] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    supabase.from('scan_results').select('*').eq('id', id).single()
      .then(({ data }) => { setScan(data); setLoading(false); });
  }, [id, user]);

  useEffect(() => {
    if (!scan) return;

    // If we already have cached AI analysis in raw_data, use it
    if (scan.raw_data && typeof scan.raw_data === 'object' && (scan.raw_data as any).summary) {
      setAnalysis(scan.raw_data);
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
              language,
              simpleLanguage,
            }),
          }
        );
        if (!resp.ok) throw new Error('Failed to analyze');
        const data = await resp.json();
        setAnalysis(data);
        // Cache for future visits
        await supabase.from('scan_results').update({ raw_data: data }).eq('id', scan.id);
      } catch (e: any) {
        toast.error(e.message || 'Failed to load analysis');
      } finally {
        setAnalysisLoading(false);
      }
    };
    fetchAnalysis();
  }, [scan, language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!scan) {
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
              {new Date(scan.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button onClick={() => navigate('/language')}
              className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 bg-card text-foreground shadow-sm">
              <Globe className="w-3 h-3" />
              {languageInfo.flag} {languageInfo.native}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
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
            ) : analysis ? (
              <ReportExplanation analysis={analysis} />
            ) : (
              <p className="text-center text-muted-foreground py-12">Unable to load analysis</p>
            )}
          </TabsContent>

          <TabsContent value="radar">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Generating health radar...</p>
              </div>
            ) : analysis ? (
              <RiskRadarChart analysis={analysis} />
            ) : (
              <p className="text-center text-muted-foreground py-12">Unable to load radar</p>
            )}
          </TabsContent>

          <TabsContent value="risks">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Evaluating health risks...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {analysis.overallRisks?.length > 0 && (
                  <div className="space-y-3">
                    {analysis.overallRisks.map((risk: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground text-sm">{risk.condition}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            risk.level === 'high' ? 'bg-destructive/10 text-destructive' :
                            risk.level === 'medium' ? 'bg-warning/10 text-warning' :
                            'bg-success/10 text-success'
                          }`}>{risk.level} risk</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{risk.explanation}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {analysis.tests?.filter((t: any) => t.status !== 'normal').length > 0 && (
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Abnormal Values</h3>
                    <div className="space-y-2">
                      {analysis.tests.filter((t: any) => t.status !== 'normal').map((t: any, i: number) => (
                        <div key={i} className={`bg-card border rounded-xl p-3 ${
                          t.status === 'critical' ? 'border-destructive/30' :
                          t.status === 'high' ? 'border-warning/30' : 'border-info/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-sm">{t.name}</span>
                            <span className="text-sm font-display font-bold text-foreground">{t.value} {t.unit}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Normal: {t.normalRange} {t.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.lifestyleRecommendations?.length > 0 && (
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Action Plan</h3>
                    <div className="space-y-2">
                      {analysis.lifestyleRecommendations.map((rec: any, i: number) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            rec.priority === 'high' ? 'bg-destructive' :
                            rec.priority === 'medium' ? 'bg-warning' : 'bg-success'
                          }`} />
                          <div>
                            <span className="font-medium text-foreground text-xs">{rec.category}</span>
                            <p className="text-xs text-muted-foreground">{rec.advice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Unable to load risk assessment</p>
            )}
          </TabsContent>

          <TabsContent value="ocr">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground text-sm">Extracted OCR Text</h3>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  AI Vision
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the raw text extracted from your report image. Verify that AI read your report correctly.
              </p>
              {scan.ocr_text ? (
                <div className="bg-card border border-border rounded-xl p-4 max-h-[400px] overflow-auto">
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {scan.ocr_text}
                  </pre>
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
                raw_data: scan.raw_data,
              }}
              suggestedQuestions={analysis?.suggestedQuestions || []}
            />
          </TabsContent>
        </Tabs>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-accent/30 border border-border rounded-xl p-4 mt-6">
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
