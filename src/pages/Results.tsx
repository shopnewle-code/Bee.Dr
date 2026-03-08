import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Activity, ArrowLeft, Heart, Droplets, Pill, AlertTriangle,
  CheckCircle2, AlertCircle, Info, ChevronRight, Shield
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const severityConfig = {
  low: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Low Risk' },
  medium: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Medium Risk' },
  high: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'High Risk' },
};

const riskIcons: Record<string, typeof Heart> = {
  cardiovascular: Heart,
  anemia: Droplets,
  diabetes: Pill,
  abnormal_findings: AlertTriangle,
};

const riskLabels: Record<string, string> = {
  cardiovascular: 'Cardiovascular',
  anemia: 'Anemia',
  diabetes: 'Diabetes',
  abnormal_findings: 'Abnormal Findings',
};

const barColors: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Tables<'scan_results'> | null>(null);
  const [loading, setLoading] = useState(true);

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

  const riskScores = (scan.risk_scores as any) || {};
  const insights = (scan.insights as any[]) || [];
  const recommendations = (scan.recommendations as any[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-lg font-display font-bold text-foreground">Analysis Results</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {/* Report header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">{scan.file_name}</h1>
          <p className="text-sm text-muted-foreground">Analyzed on {new Date(scan.created_at).toLocaleDateString()}</p>
        </motion.div>

        {/* Risk Assessment */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Health Risk Assessment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(riskScores).map(([key, value]: [string, any], i) => {
              const Icon = riskIcons[key] || AlertTriangle;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground text-sm">{riskLabels[key] || key}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      value.color === 'success' ? 'bg-success/10 text-success' :
                      value.color === 'warning' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {value.label}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColors[value.color] || 'bg-primary'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value.score * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(value.score * 100)}% risk score</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* AI Insights */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            AI Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight: any, i: number) => {
              const config = severityConfig[insight.severity as keyof typeof severityConfig] || severityConfig.low;
              const SevIcon = config.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <SevIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{insight.title}</h3>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{insight.detail}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Recommendations */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Personalized Action Plan
          </h2>
          <div className="space-y-2">
            {recommendations.map((rec: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  rec.priority === 'high' ? 'bg-destructive' :
                  rec.priority === 'medium' ? 'bg-warning' : 'bg-success'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{rec.action}</p>
                  <p className="text-xs text-muted-foreground">{rec.context}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-accent/30 border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚕️ <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and does not constitute medical advice. Results are generated using machine learning models and may not be 100% accurate. Always consult a qualified healthcare professional for diagnosis and treatment decisions. Bee.dr does not replace your doctor.
          </p>
        </motion.div>

        <div className="flex gap-3 pb-8">
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
