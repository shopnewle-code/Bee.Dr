import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ArrowRight, Activity, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import BottomNav from '@/components/BottomNav';

type Scan = Tables<'scan_results'>;

interface BiomarkerValue {
  name: string;
  value: number;
  unit: string;
  normalMin: number;
  normalMax: number;
}

const demoBiomarkers: Record<string, BiomarkerValue[]> = {
  demo_old: [
    { name: 'Hemoglobin', value: 10.2, unit: 'g/dL', normalMin: 12, normalMax: 16 },
    { name: 'Cholesterol', value: 220, unit: 'mg/dL', normalMin: 0, normalMax: 200 },
    { name: 'Vitamin D', value: 18, unit: 'ng/mL', normalMin: 30, normalMax: 100 },
    { name: 'Fasting Glucose', value: 110, unit: 'mg/dL', normalMin: 70, normalMax: 100 },
    { name: 'Iron', value: 45, unit: 'µg/dL', normalMin: 60, normalMax: 170 },
    { name: 'Creatinine', value: 1.1, unit: 'mg/dL', normalMin: 0.7, normalMax: 1.3 },
  ],
  demo_new: [
    { name: 'Hemoglobin', value: 12.5, unit: 'g/dL', normalMin: 12, normalMax: 16 },
    { name: 'Cholesterol', value: 185, unit: 'mg/dL', normalMin: 0, normalMax: 200 },
    { name: 'Vitamin D', value: 32, unit: 'ng/mL', normalMin: 30, normalMax: 100 },
    { name: 'Fasting Glucose', value: 92, unit: 'mg/dL', normalMin: 70, normalMax: 100 },
    { name: 'Iron', value: 72, unit: 'µg/dL', normalMin: 60, normalMax: 170 },
    { name: 'Creatinine', value: 1.0, unit: 'mg/dL', normalMin: 0.7, normalMax: 1.3 },
  ],
};

function extractBiomarkers(scan: Scan): BiomarkerValue[] {
  const raw = scan.raw_data as any;
  const insights = scan.insights as any;
  if (Array.isArray(raw?.tests)) {
    return raw.tests.map((t: any) => ({
      name: t.name || t.test_name || 'Unknown',
      value: parseFloat(t.value) || 0,
      unit: t.unit || '',
      normalMin: parseFloat(t.normalMin ?? t.normal_min ?? 0),
      normalMax: parseFloat(t.normalMax ?? t.normal_max ?? 999),
    }));
  }
  if (Array.isArray(insights?.biomarkers)) {
    return insights.biomarkers.map((b: any) => ({
      name: b.name || 'Unknown',
      value: parseFloat(b.value) || 0,
      unit: b.unit || '',
      normalMin: parseFloat(b.normalMin ?? 0),
      normalMax: parseFloat(b.normalMax ?? 999),
    }));
  }
  return [];
}

function isNormal(v: number, min: number, max: number) {
  return v >= min && v <= max;
}

const ReportComparison = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [oldId, setOldId] = useState<string>('');
  const [newId, setNewId] = useState<string>('');
  const useDemo = scans.length < 2;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('scan_results')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const results = data || [];
        setScans(results);
        if (results.length >= 2) {
          setOldId(results[0].id);
          setNewId(results[results.length - 1].id);
        }
        setLoading(false);
      });
  }, [user]);

  const oldBiomarkers = useDemo
    ? demoBiomarkers.demo_old
    : extractBiomarkers(scans.find((s) => s.id === oldId)!);
  const newBiomarkers = useDemo
    ? demoBiomarkers.demo_new
    : extractBiomarkers(scans.find((s) => s.id === newId)!);

  // Match by name
  const paired = oldBiomarkers.map((old) => {
    const match = newBiomarkers.find((n) => n.name === old.name);
    return { old, new: match || null };
  });

  const improved = paired.filter((p) => {
    if (!p.new) return false;
    const wasAbnormal = !isNormal(p.old.value, p.old.normalMin, p.old.normalMax);
    const nowNormal = isNormal(p.new.value, p.new.normalMin, p.new.normalMax);
    return wasAbnormal && nowNormal;
  }).length;

  const declined = paired.filter((p) => {
    if (!p.new) return false;
    const wasNormal = isNormal(p.old.value, p.old.normalMin, p.old.normalMax);
    const nowAbnormal = !isNormal(p.new.value, p.new.normalMin, p.new.normalMax);
    return wasNormal && nowAbnormal;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Compare Reports</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {useDemo && (
          <div className="bg-accent/40 border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground text-center">
              📊 Showing demo data — upload 2+ reports to compare your own results.
            </p>
          </div>
        )}

        {/* Report selectors */}
        {!useDemo && (
          <div className="flex items-center gap-2">
            <Select value={oldId} onValueChange={setOldId}>
              <SelectTrigger className="flex-1 text-xs h-9">
                <SelectValue placeholder="Old report" />
              </SelectTrigger>
              <SelectContent>
                {scans.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.file_name} — {new Date(s.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={newId} onValueChange={setNewId}>
              <SelectTrigger className="flex-1 text-xs h-9">
                <SelectValue placeholder="New report" />
              </SelectTrigger>
              <SelectContent>
                {scans.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.file_name} — {new Date(s.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Summary badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Improved', count: improved, color: 'text-success', bg: 'bg-success/10', icon: TrendingUp },
            { label: 'Declined', count: declined, color: 'text-destructive', bg: 'bg-destructive/10', icon: TrendingDown },
            { label: 'Total', count: paired.length, color: 'text-primary', bg: 'bg-primary/10', icon: Activity },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <span className={`text-lg font-bold font-display ${s.color}`}>{s.count}</span>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Side-by-side comparison */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>{useDemo ? 'Feb 2025' : 'Old'}</span>
            <span className="text-center">Test</span>
            <span className="text-right">{useDemo ? 'Mar 2026' : 'New'}</span>
          </div>
          {paired.map((p, i) => {
            const delta = p.new ? p.new.value - p.old.value : 0;
            const oldNormal = isNormal(p.old.value, p.old.normalMin, p.old.normalMax);
            const newNormal = p.new ? isNormal(p.new.value, p.new.normalMin, p.new.normalMax) : false;
            const gotBetter = !oldNormal && newNormal;
            const gotWorse = oldNormal && !newNormal;

            return (
              <motion.div
                key={p.old.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card border rounded-xl p-3 ${
                  gotBetter ? 'border-success/40' : gotWorse ? 'border-destructive/40' : 'border-border'
                }`}
              >
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  {/* Old value */}
                  <div className="text-left">
                    <span className={`text-sm font-bold font-display ${oldNormal ? 'text-foreground' : 'text-destructive'}`}>
                      {p.old.value}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">{p.old.unit}</span>
                  </div>

                  {/* Center: name + delta */}
                  <div className="text-center min-w-[90px]">
                    <span className="text-xs font-semibold text-foreground block">{p.old.name}</span>
                    {p.new && (
                      <span className={`text-[10px] font-medium flex items-center justify-center gap-0.5 mt-0.5 ${
                        gotBetter ? 'text-success' : gotWorse ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* New value */}
                  <div className="text-right">
                    {p.new ? (
                      <>
                        <span className={`text-sm font-bold font-display ${newNormal ? 'text-success' : 'text-destructive'}`}>
                          {p.new.value}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">{p.new.unit}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {/* Normal range */}
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  Normal: {p.old.normalMin}–{p.old.normalMax} {p.old.unit}
                </p>
              </motion.div>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ReportComparison;
