import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Heart,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { HealthCard, InsightCard } from '@/components/ui/cards';
import { CardGridSkeleton } from '@/components/ui/loading-states';
import BottomNav from '@/components/BottomNav';
import { motion as framerMotion } from 'framer-motion';

interface HealthInsight {
  title: string;
  severity: 'info' | 'warning' | 'alert';
  description: string;
  recommendation?: string;
}

interface HealthAnalysis {
  overallStatus: 'excellent' | 'good' | 'moderate' | 'poor';
  confidenceScore: number;
  keyIssues: HealthInsight[];
  recommendations: string[];
  summary: string;
}

const defaultAnalysis: HealthAnalysis = {
  overallStatus: 'moderate',
  confidenceScore: 82,
  keyIssues: [
    {
      title: 'Vitamin D Deficiency',
      severity: 'warning',
      description: 'Your Vitamin D levels are lower than recommended',
      recommendation: 'Increase sun exposure or consider supplements',
    },
    {
      title: 'Low Hemoglobin',
      severity: 'warning',
      description: 'Hemoglobin levels indicate mild anemia',
      recommendation: 'Consult a doctor for iron-rich diet recommendations',
    },
  ],
  recommendations: [
    'Increase daily water intake to 8-10 glasses',
    'Include more leafy greens in your diet',
    'Aim for 30 minutes of daily exercise',
    'Schedule a follow-up blood work in 4 weeks',
  ],
  summary:
    'Based on your recent reports and health data, your overall health status is moderate. While there are a few areas that need attention, most key indicators are within acceptable ranges. The recommendations below will help you improve your health metrics over the next few weeks.',
};

const InsightsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<HealthAnalysis>(defaultAnalysis);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalysis = async () => {
      try {
        // TODO: Fetch actual analysis from your backend/Supabase
        // For now using mock data
        setAnalysis(defaultAnalysis);
      } catch (error) {
        console.error('Error fetching health analysis:', error);
        setAnalysis(defaultAnalysis);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [user]);

  const statusConfig = {
    excellent: { label: 'Excellent', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    good: { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    moderate: { label: 'Moderate', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    poor: { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  const config = statusConfig[analysis.overallStatus];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-primary/10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Health Insights</h1>
            <p className="text-xs text-muted-foreground">AI-powered health analysis</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Health Status</p>
                  <h2 className={`text-2xl font-bold ${config.color}`}>{config.label}</h2>
                </div>
                <div className={`px-3 py-1.5 rounded-lg ${config.bgColor}`}>
                  <p className={`text-sm font-semibold ${config.color}`}>
                    {analysis.confidenceScore}% Confidence
                  </p>
                </div>
              </div>

              {/* Confidence Score Visual */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">AI Confidence Score</p>
                  <p className="text-xs font-semibold">{analysis.confidenceScore}%</p>
                </div>
                <div className="w-full h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.confidenceScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-blue-600"
                  />
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {analysis.summary}
              </p>
            </motion.div>

            {/* Key Issues */}
            {analysis.keyIssues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Key Issues Found
                </h3>
                <div className="space-y-3">
                  {analysis.keyIssues.map((issue, idx) => (
                    <InsightCard
                      key={idx}
                      title={issue.title}
                      description={issue.description}
                      icon={Heart}
                      severity={issue.severity}
                      actionLabel={issue.recommendation ? 'Learn More' : undefined}
                      onAction={() => {
                        // Navigate to detailed view or show modal
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <h4 className="font-semibold mb-2">Next Steps</h4>
              <p className="text-sm text-muted-foreground mb-4">
                To get a more detailed analysis, upload additional medical reports or consult with our AI Doctor.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
                  Upload Report
                </Button>
                <Button size="sm" onClick={() => navigate('/chat')}>
                  Chat with AI Doctor
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default InsightsPage;
