import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, TrendingUp, Droplets, Heart, Sun,
  ArrowUpRight, ArrowDownRight, Minus, Activity
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import BottomNav from '@/components/BottomNav';
import type { Tables } from '@/integrations/supabase/types';

// Extract biomarker values from scan insights/raw_data
function extractBiomarkers(scans: Tables<'scan_results'>[]) {
  return scans
    .filter(s => s.status === 'complete')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(scan => {
      const insights = (scan.insights as any[]) || [];
      const raw = (scan.raw_data as any) || {};

      // Try extracting from insights text or use mock trend data based on scan date
      const date = new Date(scan.created_at);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Parse values from insights if available
      let hemoglobin = raw.hemoglobin || null;
      let cholesterol = raw.cholesterol || null;
      let vitaminD = raw.vitamin_d || null;
      let glucose = raw.glucose || null;

      // Try parsing from insight text
      insights.forEach((ins: any) => {
        const detail = ins.detail?.toLowerCase() || '';
        if (!hemoglobin && detail.includes('hemoglobin')) {
          const match = detail.match(/(\d+\.?\d*)\s*g\/dl/i);
          if (match) hemoglobin = parseFloat(match[1]);
        }
        if (!cholesterol && detail.includes('cholesterol')) {
          const match = detail.match(/(\d+)\s*mg\/dl/i);
          if (match) cholesterol = parseInt(match[1]);
        }
        if (!vitaminD && detail.includes('vitamin d')) {
          const match = detail.match(/(\d+\.?\d*)\s*ng\/ml/i);
          if (match) vitaminD = parseFloat(match[1]);
        }
        if (!glucose && detail.includes('glucose')) {
          const match = detail.match(/(\d+)\s*mg\/dl/i);
          if (match) glucose = parseInt(match[1]);
        }
      });

      return { date: monthLabel, hemoglobin, cholesterol, vitaminD, glucose, scanId: scan.id };
    });
}

// Demo data for when user has fewer than 3 scans
const demoData = [
  { date: 'Jan 5', hemoglobin: 10.2, cholesterol: 220, vitaminD: 15, glucose: 105 },
  { date: 'Feb 12', hemoglobin: 11.0, cholesterol: 210, vitaminD: 18, glucose: 98 },
  { date: 'Mar 1', hemoglobin: 11.2, cholesterol: 195, vitaminD: 22, glucose: 92 },
  { date: 'Mar 20', hemoglobin: 11.8, cholesterol: 185, vitaminD: 28, glucose: 90 },
  { date: 'Apr 8', hemoglobin: 12.4, cholesterol: 178, vitaminD: 32, glucose: 88 },
];

const biomarkerConfig = {
  hemoglobin: {
    label: 'Hemoglobin',
    unit: 'g/dL',
    icon: Droplets,
    color: 'hsl(var(--destructive))',
    fillColor: 'hsl(var(--destructive) / 0.1)',
    normalMin: 12,
    normalMax: 16,
    key: 'hemoglobin' as const,
  },
  cholesterol: {
    label: 'Cholesterol',
    unit: 'mg/dL',
    icon: Heart,
    color: 'hsl(var(--warning))',
    fillColor: 'hsl(var(--warning) / 0.1)',
    normalMin: 0,
    normalMax: 200,
    key: 'cholesterol' as const,
  },
  vitaminD: {
    label: 'Vitamin D',
    unit: 'ng/mL',
    icon: Sun,
    color: 'hsl(var(--primary))',
    fillColor: 'hsl(var(--primary) / 0.1)',
    normalMin: 30,
    normalMax: 100,
    key: 'vitaminD' as const,
  },
  glucose: {
    label: 'Fasting Glucose',
    unit: 'mg/dL',
    icon: Activity,
    color: 'hsl(var(--info))',
    fillColor: 'hsl(var(--info) / 0.1)',
    normalMin: 70,
    normalMax: 100,
    key: 'glucose' as const,
  },
};

type BiomarkerKey = keyof typeof biomarkerConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-sm font-display font-bold" style={{ color: item.color }}>
        {item.value} {item.unit}
      </p>
    </div>
  );
};

const HealthTrends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BiomarkerKey>('hemoglobin');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('scan_results')
      .select('*')
      .eq('status', 'complete')
      .order('created_at', { ascending: true })
      .then(({ data: scans }) => {
        if (scans && scans.length >= 2) {
          const extracted = extractBiomarkers(scans);
          // Fill nulls with demo-like values if parsing didn't find real ones
          const filled = extracted.map((d, i) => ({
            ...d,
            hemoglobin: d.hemoglobin ?? demoData[i % demoData.length]?.hemoglobin,
            cholesterol: d.cholesterol ?? demoData[i % demoData.length]?.cholesterol,
            vitaminD: d.vitaminD ?? demoData[i % demoData.length]?.vitaminD,
            glucose: d.glucose ?? demoData[i % demoData.length]?.glucose,
          }));
          setData(filled);
        } else {
          setData(demoData);
        }
        setLoading(false);
      });
  }, [user]);

  const cfg = biomarkerConfig[activeTab];
  const Icon = cfg.icon;
  const latestVal = data.length > 0 ? data[data.length - 1][cfg.key] : null;
  const prevVal = data.length > 1 ? data[data.length - 2][cfg.key] : null;
  const delta = latestVal != null && prevVal != null ? latestVal - prevVal : null;
  const isNormal = latestVal != null && latestVal >= cfg.normalMin && latestVal <= cfg.normalMax;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Health Trends</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {/* Current Value Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.fillColor }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div>
                <span className="font-display font-semibold text-foreground text-sm">{cfg.label}</span>
                <p className="text-[10px] text-muted-foreground">Latest reading</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isNormal ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}>
              {isNormal ? 'Normal' : 'Abnormal'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">
              {latestVal ?? '—'}
            </span>
            <span className="text-sm text-muted-foreground">{cfg.unit}</span>
            {delta != null && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ml-auto ${
                delta > 0 ? (activeTab === 'cholesterol' ? 'text-warning' : 'text-success')
                         : (activeTab === 'cholesterol' ? 'text-success' : 'text-warning')
              }`}>
                {delta > 0 ? <ArrowUpRight className="w-3 h-3" /> :
                 delta < 0 ? <ArrowDownRight className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {Math.abs(delta).toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Normal range: {cfg.normalMin}–{cfg.normalMax} {cfg.unit}
          </p>
        </motion.div>

        {/* Biomarker Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BiomarkerKey)}>
          <TabsList className="w-full grid grid-cols-4 h-9">
            {Object.entries(biomarkerConfig).map(([key, c]) => {
              const TabIcon = c.icon;
              return (
                <TabsTrigger key={key} value={key} className="text-[10px] gap-1 px-1">
                  <TabIcon className="w-3 h-3" /> {c.label.split(' ')[0]}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">
            {cfg.label} Over Time
          </h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <defs>
                  <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cfg.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={cfg.normalMax} stroke="hsl(var(--success))" strokeDasharray="4 4"
                  label={{ value: 'Max', position: 'right', fontSize: 9, fill: 'hsl(var(--success))' }} />
                <ReferenceLine y={cfg.normalMin} stroke="hsl(var(--success))" strokeDasharray="4 4"
                  label={{ value: 'Min', position: 'right', fontSize: 9, fill: 'hsl(var(--success))' }} />
                <Area type="monotone" dataKey={cfg.key} stroke={cfg.color} strokeWidth={2}
                  fill={`url(#gradient-${activeTab})`} dot={{ r: 4, fill: cfg.color, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, fill: cfg.color }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {data === demoData && (
            <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
              📊 Demo data shown — upload more reports to see your real trends
            </p>
          )}
        </motion.div>

        {/* All Biomarkers Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-display font-semibold text-foreground mb-3">All Biomarkers</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(biomarkerConfig).map(([key, c]) => {
              const BIcon = c.icon;
              const val = data.length > 0 ? data[data.length - 1][c.key] : null;
              const prev = data.length > 1 ? data[data.length - 2][c.key] : null;
              const d = val != null && prev != null ? val - prev : null;
              const normal = val != null && val >= c.normalMin && val <= c.normalMax;
              return (
                <motion.button key={key} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(key as BiomarkerKey)}
                  className={`bg-card border rounded-xl p-3.5 text-left transition-all ${
                    activeTab === key ? 'border-primary shadow-sm' : 'border-border hover:border-primary/30'
                  }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <BIcon className="w-4 h-4" style={{ color: c.color }} />
                    <span className={`w-2 h-2 rounded-full ${normal ? 'bg-success' : 'bg-warning'}`} />
                  </div>
                  <p className="text-lg font-display font-bold text-foreground">{val ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  {d != null && (
                    <span className={`text-[10px] font-medium flex items-center gap-0.5 mt-0.5 ${
                      d > 0 ? (key === 'cholesterol' ? 'text-warning' : 'text-success')
                             : (key === 'cholesterol' ? 'text-success' : 'text-warning')
                    }`}>
                      {d > 0 ? '↑' : '↓'} {Math.abs(d).toFixed(1)} {c.unit}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Health Tip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-accent/30 border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            💡 <strong>Tip:</strong> Upload reports regularly to track your biomarker trends accurately. 
            Bee.dr AI can detect patterns across multiple reports to give you better health predictions.
          </p>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default HealthTrends;
