import { motion } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, AlertCircle, ArrowUp, ArrowDown, Minus,
  BookOpen, ShieldAlert, Lightbulb, Apple, Dumbbell, Moon, Pill, Stethoscope
} from 'lucide-react';

interface TestResult {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  explanation: string;
  medicalTerms: { term: string; definition: string }[];
  healthRisks: string[];
  recommendations: string[];
}

interface OverallRisk {
  condition: string;
  level: 'low' | 'medium' | 'high';
  explanation: string;
}

interface LifestyleRec {
  category: string;
  advice: string;
  priority: 'high' | 'medium' | 'low';
}

interface ReportAnalysis {
  summary: string;
  tests: TestResult[];
  overallRisks: OverallRisk[];
  lifestyleRecommendations: LifestyleRec[];
  suggestedQuestions: string[];
}

const statusConfig = {
  normal: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Normal', border: 'border-success/20' },
  high: { icon: ArrowUp, color: 'text-warning', bg: 'bg-warning/10', label: 'High', border: 'border-warning/20' },
  low: { icon: ArrowDown, color: 'text-info', bg: 'bg-info/10', label: 'Low', border: 'border-info/20' },
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical', border: 'border-destructive/20' },
};

const riskConfig = {
  low: { color: 'text-success', bg: 'bg-success/10' },
  medium: { color: 'text-warning', bg: 'bg-warning/10' },
  high: { color: 'text-destructive', bg: 'bg-destructive/10' },
};

const categoryIcons: Record<string, typeof Apple> = {
  Diet: Apple,
  Exercise: Dumbbell,
  Sleep: Moon,
  Medication: Pill,
  'Follow-up': Stethoscope,
};

export default function ReportExplanation({ analysis }: { analysis: ReportAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-accent/30 border border-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Report Summary
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
      </motion.div>

      {/* Test Results Breakdown */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" /> Test Results
        </h3>
        <div className="space-y-3">
          {analysis.tests.map((test, i) => {
            const cfg = statusConfig[test.status] || statusConfig.normal;
            const StatusIcon = cfg.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card border ${test.status !== 'normal' ? cfg.border : 'border-border'} rounded-xl p-4`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                    <span className="font-semibold text-foreground text-sm">{test.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Value vs Normal Range */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className={`text-2xl font-display font-bold ${test.status !== 'normal' ? cfg.color : 'text-foreground'}`}>
                    {test.value}
                  </span>
                  <span className="text-xs text-muted-foreground">{test.unit}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Minus className="w-3 h-3" /> Normal: {test.normalRange} {test.unit}
                  </span>
                </div>

                {/* Visual range bar */}
                <div className="w-full h-1.5 rounded-full bg-muted mb-3 relative overflow-hidden">
                  <div className={`h-full rounded-full ${
                    test.status === 'normal' ? 'bg-success' :
                    test.status === 'high' ? 'bg-warning' :
                    test.status === 'critical' ? 'bg-destructive' : 'bg-info'
                  }`} style={{ width: test.status === 'normal' ? '60%' : test.status === 'high' || test.status === 'critical' ? '85%' : '30%' }} />
                </div>

                {/* Explanation */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{test.explanation}</p>

                {/* Medical Terms */}
                {test.medicalTerms?.length > 0 && (
                  <div className="mb-2">
                    {test.medicalTerms.map((mt, j) => (
                      <span key={j} className="inline-flex items-center gap-1 text-[11px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-md mr-1 mb-1">
                        <BookOpen className="w-2.5 h-2.5" /> <strong>{mt.term}:</strong> {mt.definition}
                      </span>
                    ))}
                  </div>
                )}

                {/* Health Risks */}
                {test.healthRisks?.length > 0 && test.status !== 'normal' && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {test.healthRisks.map((risk, j) => (
                      <span key={j} className="text-[11px] bg-destructive/5 text-destructive px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" /> {risk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {test.recommendations?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {test.recommendations.map((rec, j) => (
                      <span key={j} className="text-[11px] bg-primary/5 text-primary px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lightbulb className="w-2.5 h-2.5" /> {rec}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Overall Risks */}
      {analysis.overallRisks?.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" /> Health Risks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.overallRisks.map((risk, i) => {
              const rc = riskConfig[risk.level] || riskConfig.low;
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">{risk.condition}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${rc.bg} ${rc.color}`}>
                      {risk.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{risk.explanation}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lifestyle Recommendations */}
      {analysis.lifestyleRecommendations?.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" /> Personalized Action Plan
          </h3>
          <div className="space-y-2">
            {analysis.lifestyleRecommendations.map((rec, i) => {
              const CatIcon = categoryIcons[rec.category] || Lightbulb;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0`}>
                    <CatIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground text-sm">{rec.category}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        rec.priority === 'high' ? 'bg-destructive' :
                        rec.priority === 'medium' ? 'bg-warning' : 'bg-success'
                      }`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.advice}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
