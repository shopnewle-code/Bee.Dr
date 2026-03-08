import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Activity, FileText, AlertTriangle, TrendingUp,
  TrendingDown, Loader2, Calendar
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import BottomNav from '@/components/BottomNav';

type Scan = Tables<'scan_results'>;

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'scan' | 'improvement' | 'decline' | 'alert';
  scanId?: string;
}

function buildTimeline(scans: Scan[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const sorted = [...scans].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  sorted.forEach((scan, idx) => {
    events.push({
      id: `scan-${scan.id}`,
      date: scan.created_at,
      title: scan.file_name,
      description: scan.status === 'completed' ? 'Report analyzed successfully' : 'Report uploaded',
      type: 'scan',
      scanId: scan.id,
    });

    const insights = scan.insights as any;
    const riskScores = scan.risk_scores as any;

    if (insights?.abnormal_values && Array.isArray(insights.abnormal_values)) {
      insights.abnormal_values.forEach((v: any) => {
        events.push({
          id: `alert-${scan.id}-${v.name || Math.random()}`,
          date: scan.created_at,
          title: `${v.name || 'Value'} flagged abnormal`,
          description: v.explanation || `Value: ${v.value} ${v.unit || ''}`,
          type: 'alert',
          scanId: scan.id,
        });
      });
    }

    if (riskScores && typeof riskScores === 'object') {
      Object.entries(riskScores).forEach(([key, val]: [string, any]) => {
        const score = typeof val === 'number' ? val : val?.score;
        if (score && score > 60) {
          events.push({
            id: `risk-${scan.id}-${key}`,
            date: scan.created_at,
            title: `High ${key} risk detected`,
            description: `Risk score: ${score}%`,
            type: 'decline',
            scanId: scan.id,
          });
        }
      });
    }

    if (idx > 0) {
      const prev = sorted[idx - 1];
      const prevRisk = prev.risk_scores as any;
      if (riskScores && prevRisk) {
        Object.entries(riskScores).forEach(([key, val]: [string, any]) => {
          const curr = typeof val === 'number' ? val : val?.score;
          const prevVal = prevRisk[key];
          const prevScore = typeof prevVal === 'number' ? prevVal : prevVal?.score;
          if (curr && prevScore && prevScore - curr > 10) {
            events.push({
              id: `improve-${scan.id}-${key}`,
              date: scan.created_at,
              title: `${key} risk improved`,
              description: `Decreased from ${prevScore}% to ${curr}%`,
              type: 'improvement',
            });
          }
        });
      }
    }
  });

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const demoEvents: TimelineEvent[] = [
  { id: '1', date: '2026-03-01', title: 'Blood Test Report', description: 'Complete blood count analyzed', type: 'scan' },
  { id: '2', date: '2026-03-01', title: 'Hemoglobin improved', description: 'Increased from 10.2 to 12.5 g/dL — now in normal range', type: 'improvement' },
  { id: '3', date: '2026-03-01', title: 'Cholesterol normalized', description: 'Decreased from 220 to 185 mg/dL', type: 'improvement' },
  { id: '4', date: '2026-02-15', title: 'Vitamin D still low', description: 'Level at 18 ng/mL, below normal range of 30-100', type: 'alert' },
  { id: '5', date: '2026-02-01', title: 'Lab Report Uploaded', description: 'Lipid panel + CBC analysis completed', type: 'scan' },
  { id: '6', date: '2026-02-01', title: 'High cholesterol detected', description: 'Total cholesterol 220 mg/dL, above 200 threshold', type: 'decline' },
  { id: '7', date: '2026-01-15', title: 'First Blood Test', description: 'Baseline health assessment uploaded', type: 'scan' },
  { id: '8', date: '2026-01-15', title: 'Iron deficiency flagged', description: 'Hemoglobin at 10.2 g/dL, below normal 12-16 range', type: 'alert' },
];

const typeConfig = {
  scan: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10', line: 'border-primary/30' },
  improvement: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', line: 'border-success/30' },
  decline: { icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', line: 'border-destructive/30' },
  alert: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', line: 'border-warning/30' },
};

const MedicalTimeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('scan_results').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const scans = data || [];
        if (scans.length < 2) {
          setEvents(demoEvents);
          setUseDemo(true);
        } else {
          const built = buildTimeline(scans);
          setEvents(built.length > 0 ? built : demoEvents);
          setUseDemo(built.length === 0);
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Group events by month
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach((e) => {
    const key = new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Calendar className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Health Timeline</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {useDemo && (
          <div className="bg-accent/40 border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground text-center">
              📅 Showing demo timeline — upload 2+ reports to see your personal health journey.
            </p>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Events', count: events.length, color: 'text-primary' },
            { label: 'Improved', count: events.filter(e => e.type === 'improvement').length, color: 'text-success' },
            { label: 'Alerts', count: events.filter(e => e.type === 'alert').length, color: 'text-warning' },
            { label: 'Declined', count: events.filter(e => e.type === 'decline').length, color: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <span className={`text-lg font-bold font-display ${s.color}`}>{s.count}</span>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {month}
            </h3>
            <div className="relative pl-6 space-y-3">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

              {items.map((event, i) => {
                const config = typeConfig[event.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                  >
                    {/* Dot */}
                    <div className={`absolute -left-6 top-3 w-[22px] h-[22px] rounded-full ${config.bg} flex items-center justify-center border-2 border-background`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </div>

                    <div
                      className={`bg-card border rounded-xl p-3 ${config.line} cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={() => event.scanId ? navigate(`/results/${event.scanId}`) : null}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
};

export default MedicalTimeline;
