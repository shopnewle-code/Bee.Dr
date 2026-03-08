import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Watch, Heart, Footprints, Moon, Flame, Activity,
  Plus, Loader2, Bluetooth, Smartphone, RefreshCw, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';

type MetricType = 'heart_rate' | 'steps' | 'sleep_hours' | 'calories' | 'spo2';

interface WearableEntry {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  source: string;
}

const METRICS: { type: MetricType; label: string; icon: any; unit: string; color: string; normal: string }[] = [
  { type: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'bpm', color: 'hsl(0, 84%, 60%)', normal: '60–100 bpm' },
  { type: 'steps', label: 'Steps', icon: Footprints, unit: 'steps', color: 'hsl(142, 71%, 45%)', normal: '8,000–10,000' },
  { type: 'sleep_hours', label: 'Sleep', icon: Moon, unit: 'hrs', color: 'hsl(221, 83%, 53%)', normal: '7–9 hrs' },
  { type: 'calories', label: 'Calories', icon: Flame, unit: 'kcal', color: 'hsl(25, 95%, 53%)', normal: '1,800–2,500' },
  { type: 'spo2', label: 'SpO₂', icon: Activity, unit: '%', color: 'hsl(262, 83%, 58%)', normal: '95–100%' },
];

const DEVICES = [
  { name: 'Apple Watch', id: 'apple_watch', icon: '⌚', connected: false },
  { name: 'Fitbit', id: 'fitbit', icon: '📟', connected: false },
  { name: 'Google Fit', id: 'google_fit', icon: '🏃', connected: false },
  { name: 'Samsung Health', id: 'samsung_health', icon: '📱', connected: false },
];

const WearableIntegration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<WearableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('heart_rate');
  const [showAdd, setShowAdd] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [devices, setDevices] = useState(DEVICES);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('wearable_data').select('*').eq('user_id', user.id)
      .order('recorded_at', { ascending: false }).limit(500)
      .then(({ data: d }) => { setData((d as WearableEntry[]) || []); setLoading(false); });
  }, [user]);

  const metricData = data.filter(d => d.metric_type === selectedMetric);
  const currentMetric = METRICS.find(m => m.type === selectedMetric)!;

  const latestValue = metricData[0]?.value;
  const prevValue = metricData[1]?.value;
  const trend = latestValue && prevValue
    ? latestValue > prevValue ? 'up' : latestValue < prevValue ? 'down' : 'flat'
    : null;

  // Chart data — last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const entries = metricData.filter(d => d.recorded_at.startsWith(dayStr));
    const avg = entries.length > 0 ? entries.reduce((s, e) => s + e.value, 0) / entries.length : null;
    return { day: format(day, 'EEE'), value: avg };
  });

  const handleAddEntry = async () => {
    if (!user || !addValue) return;
    setSaving(true);
    const { error } = await supabase.from('wearable_data').insert({
      user_id: user.id,
      metric_type: selectedMetric,
      value: parseFloat(addValue),
      unit: currentMetric.unit,
      source: 'manual',
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${currentMetric.label} logged`);
    setAddValue('');
    setShowAdd(false);
    // Refresh
    const { data: d } = await supabase.from('wearable_data').select('*').eq('user_id', user.id)
      .order('recorded_at', { ascending: false }).limit(500);
    setData((d as WearableEntry[]) || []);
  };

  const simulateSync = (deviceId: string) => {
    setSyncing(deviceId);
    // Simulate syncing data from a wearable
    setTimeout(async () => {
      if (!user) return;
      const now = new Date();
      const entries = [
        { metric_type: 'heart_rate', value: 68 + Math.round(Math.random() * 20), unit: 'bpm' },
        { metric_type: 'steps', value: 3000 + Math.round(Math.random() * 8000), unit: 'steps' },
        { metric_type: 'sleep_hours', value: +(6 + Math.random() * 3).toFixed(1), unit: 'hrs' },
        { metric_type: 'calories', value: 1500 + Math.round(Math.random() * 1000), unit: 'kcal' },
        { metric_type: 'spo2', value: 95 + Math.round(Math.random() * 5), unit: '%' },
      ];

      for (const entry of entries) {
        await supabase.from('wearable_data').insert({
          user_id: user.id,
          ...entry,
          source: deviceId,
        } as any);
      }

      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, connected: true } : d));
      setSyncing(null);
      toast.success('Wearable data synced!');

      const { data: d } = await supabase.from('wearable_data').select('*').eq('user_id', user.id)
        .order('recorded_at', { ascending: false }).limit(500);
      setData((d as WearableEntry[]) || []);
    }, 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Watch className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Wearable Integration</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {/* Connected Devices */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-primary" /> Connect Devices
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {devices.map(device => (
              <button key={device.id}
                onClick={() => !device.connected && simulateSync(device.id)}
                disabled={syncing === device.id}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                  device.connected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}>
                <span className="text-xl">{device.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{device.name}</p>
                  {syncing === device.id ? (
                    <p className="text-[10px] text-primary flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Syncing…</p>
                  ) : device.connected ? (
                    <p className="text-[10px] text-primary">Connected</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Tap to sync</p>
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Tap a device to simulate syncing health data. Real integrations coming soon.
          </p>
        </motion.div>

        {/* Metric Selector */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {METRICS.map(m => {
            const Icon = m.icon;
            const isActive = selectedMetric === m.type;
            return (
              <button key={m.type} onClick={() => setSelectedMetric(m.type)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap transition-all shrink-0 ${
                  isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Current Value Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">{currentMetric.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-foreground">{latestValue ?? '—'}</span>
                <span className="text-sm text-muted-foreground">{currentMetric.unit}</span>
                {trend && (
                  <span className={`flex items-center text-xs ${trend === 'up' ? 'text-orange-500' : trend === 'down' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <Minus className="w-3 h-3 mr-0.5" />}
                    {Math.abs(((latestValue! - prevValue!) / prevValue!) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Normal: {currentMetric.normal}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-3 h-3 mr-1" /> Log
            </Button>
          </div>

          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="border-t border-border pt-3 mt-3 flex gap-2">
              <Input type="number" placeholder={`Enter ${currentMetric.unit}`} value={addValue}
                onChange={e => setAddValue(e.target.value)} className="flex-1" />
              <Button onClick={handleAddEntry} disabled={saving || !addValue} size="sm">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* 7-Day Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">7-Day Trend</h3>
          {chartData.some(d => d.value !== null) ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} ${currentMetric.unit}`, currentMetric.label]}
                />
                <Line type="monotone" dataKey="value" stroke={currentMetric.color} strokeWidth={2}
                  dot={{ fill: currentMetric.color, r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet. Log entries or sync a device.
            </div>
          )}
        </motion.div>

        {/* Recent Entries */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent {currentMetric.label} Entries</h3>
          {metricData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No entries yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metricData.slice(0, 10).map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{entry.value} {entry.unit}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(entry.recorded_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {entry.source === 'manual' ? '✏️ Manual' : `📱 ${entry.source.replace('_', ' ')}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Health Insight from Wearable + Reports */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-accent/50 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" /> AI Health Insight
          </h3>
          <p className="text-xs text-muted-foreground">
            {latestValue && selectedMetric === 'heart_rate' && latestValue > 100
              ? '⚠️ Your resting heart rate is elevated. Combined with your report data, consider consulting a cardiologist.'
              : latestValue && selectedMetric === 'steps' && latestValue < 5000
              ? '🚶 Your step count is below the recommended 8,000 steps. Increasing activity can improve your cholesterol levels shown in your reports.'
              : latestValue && selectedMetric === 'sleep_hours' && latestValue < 6
              ? '😴 You are getting less than 6 hours of sleep. Poor sleep can worsen the vitamin D deficiency noted in your reports.'
              : latestValue && selectedMetric === 'spo2' && latestValue < 95
              ? '🫁 Your SpO₂ is below normal. Combined with low hemoglobin from your reports, please seek medical attention.'
              : '📊 Your wearable data combined with lab reports helps AI provide more accurate health predictions. Keep logging daily!'}
          </p>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default WearableIntegration;
