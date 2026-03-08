import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, TrendingUp, Brain, Moon, Heart, Shield,
  AlertTriangle, Loader2, RefreshCw, Activity
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const PredictiveHealthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    // Fetch recent check-ins and scan data for analysis
    Promise.all([
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
      supabase.from('scan_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('health_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]).then(([c, s, h]) => {
      setCheckins(c.data || []);
      // Auto-generate if we have data
      if ((c.data?.length || 0) > 0 || (s.data?.length || 0) > 0) {
        generatePredictions(c.data || [], s.data || [], h.data);
      }
    });
  }, [user]);

  const generatePredictions = async (checkinsData: any[], scansData: any[], healthProfile: any) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predictive-health`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            checkins: checkinsData.slice(0, 14),
            scans: scansData.slice(0, 5).map(s => ({
              risk_scores: s.risk_scores, insights: s.insights, created_at: s.created_at,
            })),
            healthProfile,
          }),
        }
      );
      if (!resp.ok) throw new Error('Analysis failed');
      const data = await resp.json();
      setPredictions(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  const riskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-warning" />;
      default: return <Shield className="w-4 h-4 text-success" />;
    }
  };

  const riskBadge = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-destructive/10 text-destructive', medium: 'bg-warning/10 text-warning', low: 'bg-success/10 text-success',
    };
    return colors[level] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground flex-1">Predictive Health</span>
          {predictions && (
            <Button variant="ghost" size="icon" onClick={() => generatePredictions(checkins, [], null)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing your health data...</p>
          </div>
        )}

        {!loading && !predictions && checkins.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-semibold text-foreground mb-2">Not Enough Data</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              Complete daily check-ins and upload reports to enable AI health predictions.
            </p>
            <Button className="gradient-primary text-primary-foreground" onClick={() => navigate('/checkin')}>
              Start Daily Check-in
            </Button>
          </motion.div>
        )}

        {predictions && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Overall Health Forecast */}
            {predictions.overallForecast && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Health Forecast
                </h3>
                <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                  <ReactMarkdown>{predictions.overallForecast}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Risk Predictions */}
            {predictions.risks?.map((risk: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {riskIcon(risk.level)}
                    <span className="font-semibold text-foreground text-sm">{risk.condition}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${riskBadge(risk.level)}`}>
                    {risk.level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{risk.explanation}</p>
                {risk.prevention && (
                  <p className="text-xs text-foreground mt-2 bg-accent/30 rounded-lg p-2">💡 {risk.prevention}</p>
                )}
              </motion.div>
            ))}

            {/* Mental Health */}
            {predictions.mentalHealth && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" /> Mental Health Insights
                </h3>
                <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                  <ReactMarkdown>{predictions.mentalHealth}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Sleep Insights */}
            {predictions.sleepInsights && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-primary" /> Sleep Analysis
                </h3>
                <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                  <ReactMarkdown>{predictions.sleepInsights}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Preventive Recommendations */}
            {predictions.preventiveActions?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-destructive" /> Preventive Actions
                </h3>
                <div className="space-y-2">
                  {predictions.preventiveActions.map((action: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        action.priority === 'high' ? 'bg-destructive' : action.priority === 'medium' ? 'bg-warning' : 'bg-success'
                      }`} />
                      <div>
                        <span className="font-medium text-foreground">{action.action}</span>
                        <p className="text-muted-foreground">{action.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PredictiveHealthPage;
