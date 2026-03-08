import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/use-language';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Activity, Upload, FileText, LogOut, Plus, Clock, Bot, User,
  Heart, Bell, Scan, TrendingUp, Pill, Shield, ChevronRight, GitCompare,
  Calendar, ShieldAlert, Users, Droplets, HeartPulse, SmilePlus, Target,
  Syringe, AlertTriangle, ScanEye, Mic, Brain, Watch, Stethoscope,
  MapPin, ShoppingCart, Search, FileImage, ClipboardList, Building2,
  CalendarDays, Zap, Video, ScanLine
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import BottomNav from '@/components/BottomNav';

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { languageInfo } = useLanguage();
  const [scans, setScans] = useState<Tables<'scan_results'>[]>([]);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [healthProfile, setHealthProfile] = useState<Tables<'health_profiles'> | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [scansRes, profileRes, hpRes] = await Promise.all([
        supabase.from('scan_results').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('health_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      if (scansRes.data) setScans(scansRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      if (hpRes.data) setHealthProfile(hpRes.data);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  // Dynamic health score from latest scan risk_scores
  const healthScore = (() => {
    const latestScan = scans.find(s => s.status === 'complete' && s.risk_scores);
    if (!latestScan?.risk_scores) return 78;
    const scores = latestScan.risk_scores as Record<string, { score?: number }>;
    const values = Object.values(scores).map(s => s.score ?? 0.3);
    if (values.length === 0) return 78;
    const avgRisk = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round((1 - avgRisk) * 100);
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <span className="text-lg font-display font-bold text-foreground">Bee.dr</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Greeting + Health Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-0.5">
            Hello, {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mb-4">How is your health today?</p>

          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray={`${healthScore * 1.76} 176`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-display font-bold text-foreground">
                {healthScore}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-foreground">Health Score</p>
              <p className="text-xs text-muted-foreground">Based on your latest reports</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5" /> Heart: Low Risk
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> Vitamin D: Low
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Health Profile Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          onClick={() => navigate('/health-profile')}
          className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
          {healthProfile ? (() => {
            const bmi = healthProfile.height_cm && healthProfile.weight_kg
              ? (Number(healthProfile.weight_kg) / Math.pow(Number(healthProfile.height_cm) / 100, 2)).toFixed(1)
              : null;
            const allergyCount = healthProfile.allergies?.length || 0;
            return (
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <div className="text-center">
                    <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{healthProfile.blood_group || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">Blood Group</p>
                  </div>
                  <div className="text-center">
                    <HeartPulse className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{bmi || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">BMI</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-4 h-4 text-destructive mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{allergyCount}</p>
                    <p className="text-[10px] text-muted-foreground">Allergies</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            );
          })() : (
            <div className="flex items-center gap-3">
              <HeartPulse className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Set up Health Profile</p>
                <p className="text-xs text-muted-foreground">Add blood group, height, weight & allergies</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </motion.div>

        {/* Main Actions */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Upload, label: 'Upload Report', desc: 'PDF or Photo', path: '/upload', gradient: true },
              { icon: Bot, label: 'AI Doctor Chat', desc: 'Ask anything', path: '/chat', gradient: false },
              { icon: SmilePlus, label: 'Daily Check-in', desc: 'Track daily', path: '/checkin', gradient: false },
              { icon: Target, label: 'Health Habits', desc: 'Water, exercise', path: '/habits', gradient: false },
              { icon: TrendingUp, label: 'Health Trends', desc: 'Track biomarkers', path: '/trends', gradient: false },
              { icon: Brain, label: 'Predictive Health', desc: 'AI forecasts', path: '/predictive', gradient: false },
              { icon: Scan, label: 'Scan Prescription', desc: 'Camera OCR', path: '/prescription', gradient: false },
              { icon: ScanEye, label: 'Skin Scanner', desc: 'AI dermatology', path: '/skin-scanner', gradient: false },
              { icon: ShieldAlert, label: 'Melanoma Screen', desc: 'ABCDE check', path: '/melanoma-screener', gradient: false },
              { icon: Mic, label: 'Voice Doctor', desc: 'Speak to AI', path: '/voice-doctor', gradient: false },
              { icon: GitCompare, label: 'Compare Reports', desc: 'Old vs New', path: '/compare', gradient: false },
              { icon: Calendar, label: 'Health Timeline', desc: 'Medical history', path: '/timeline', gradient: false },
              { icon: AlertTriangle, label: 'Emergency Card', desc: 'Quick health info', path: '/emergency-card', gradient: false },
              { icon: ShieldAlert, label: 'Emergency Alerts', desc: 'Critical values', path: '/alerts', gradient: false },
              { icon: Users, label: 'Family Health', desc: 'Track family', path: '/family', gradient: false },
              { icon: Watch, label: 'Wearables', desc: 'Sync devices', path: '/wearables', gradient: false },
              { icon: Stethoscope, label: 'Symptom Checker', desc: 'AI diagnosis', path: '/symptom-checker', gradient: false },
              { icon: Search, label: 'Medicine Scanner', desc: 'Drug info & AI', path: '/medicine-scanner', gradient: false },
              { icon: MapPin, label: 'Health Map', desc: 'Nearby services', path: '/health-map', gradient: false },
              { icon: ShoppingCart, label: 'Medicine Store', desc: 'Buy medicines', path: '/medicine-store', gradient: false },
              { icon: Heart, label: 'ECG Interpreter', desc: 'AI ECG analysis', path: '/ecg', gradient: false },
              { icon: FileImage, label: 'X-ray AI', desc: 'Radiology AI', path: '/xray', gradient: false },
              { icon: Brain, label: 'MRI Analysis', desc: 'MRI AI reader', path: '/mri', gradient: false },
              { icon: ScanLine, label: 'CT Scan AI', desc: 'CT scan analysis', path: '/ct-scan', gradient: false },
              { icon: ClipboardList, label: 'Treatment Plan', desc: 'AI care plan', path: '/treatment-plan', gradient: false },
              { icon: Building2, label: 'Pharmacy Panel', desc: 'Partner dashboard', path: '/pharmacy-dashboard', gradient: false },
              { icon: CalendarDays, label: 'Book Appointment', desc: 'AI scheduling', path: '/book-appointment', gradient: false },
              { icon: Zap, label: 'AI Triage', desc: 'Urgency check', path: '/triage', gradient: false },
              { icon: Video, label: 'Telemedicine', desc: 'Virtual consult', path: '/telemedicine', gradient: false },
            ].map(({ icon: Icon, label, desc, path, gradient }, i) => (
              <motion.button key={label}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(path)}
                className={`rounded-xl p-4 text-left transition-all border ${
                  gradient
                    ? 'gradient-primary text-primary-foreground border-transparent shadow-glow'
                    : 'bg-card border-border hover:border-primary/30 hover:shadow-md text-foreground'
                }`}>
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-semibold block">{label}</span>
                <span className={`text-[11px] ${gradient ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{desc}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1">
          {[
            { icon: Pill, label: 'Med Reminders', path: '/med-reminders' },
            { icon: Syringe, label: 'Vaccinations', path: '/vaccinations' },
            { icon: Shield, label: 'Privacy', path: '/settings' },
            { icon: Bell, label: 'Alerts', path: '/notifications' },
          ].map(({ icon: Icon, label, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground whitespace-nowrap hover:border-primary/30 transition-all shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" /> {label}
            </button>
          ))}
        </motion.div>

        {/* AI Doctor Promo */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          onClick={() => navigate('/chat')}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground text-sm">AI Doctor Chat</h3>
            <p className="text-xs text-muted-foreground">Ask about your health, lab results, medications</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>

        {/* Recent Scans */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display font-semibold text-foreground">Recent Reports</h2>
            {scans.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="text-primary text-xs h-7">
                View All
              </Button>
            )}
          </div>
          {scans.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reports yet. Upload your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scans.map((scan, i) => (
                <motion.div key={scan.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  onClick={() => scan.status === 'complete' ? navigate(`/results/${scan.id}`) : null}
                  className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{scan.file_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    scan.status === 'complete' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {scan.status === 'complete' ? 'Complete' : 'Processing'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
