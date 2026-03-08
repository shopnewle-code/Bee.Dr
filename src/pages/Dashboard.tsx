import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/hooks/use-language';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Activity, Upload, FileText, LogOut, Clock, Bot, User,
  Heart, Bell, Scan, TrendingUp, Pill, Shield, ChevronRight, GitCompare,
  Calendar, ShieldAlert, Users, Droplets, HeartPulse, SmilePlus, Target,
  Syringe, AlertTriangle, ScanEye, Mic, Brain, Watch, Stethoscope,
  MapPin, ShoppingCart, Search, FileImage, ClipboardList, Building2,
  CalendarDays, Zap, Video, ScanLine, Sparkles, ArrowRight, Sun, Moon
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import BottomNav from '@/components/BottomNav';
import { HealthScoreRing } from '@/components/ai/HealthScoreRing';
import { AIThinkingPulse, AIBrainWave } from '@/components/ai/AIThinkingAnimation';
import { ECGLine } from '@/components/ai/ECGLine';
import { AIGlowCard, AIBadge } from '@/components/ai/AIGlowCard';

// Feature categories
const quickActions = [
  { icon: Upload, label: 'Upload Report', desc: 'PDF or Photo', path: '/upload', color: 'from-primary to-blue-glow' },
  { icon: Bot, label: 'AI Doctor', desc: 'Ask anything', path: '/chat', color: 'from-secondary to-teal' },
  { icon: SmilePlus, label: 'Check-in', desc: 'Daily tracker', path: '/checkin', color: 'from-amber-400 to-orange-500' },
  { icon: Target, label: 'Habits', desc: 'Track goals', path: '/habits', color: 'from-emerald-400 to-green-600' },
];

const aiFeatures = [
  { icon: Brain, label: 'Predictive Health', desc: 'AI forecasts', path: '/predictive' },
  { icon: ScanEye, label: 'Skin Scanner', desc: 'AI dermatology', path: '/skin-scanner' },
  { icon: ShieldAlert, label: 'Melanoma Screen', desc: 'ABCDE check', path: '/melanoma-screener' },
  { icon: Stethoscope, label: 'Symptom Checker', desc: 'AI diagnosis', path: '/symptom-checker' },
  { icon: Mic, label: 'Voice Doctor', desc: 'Speak to AI', path: '/voice-doctor' },
  { icon: ClipboardList, label: 'Treatment Plan', desc: 'AI care plan', path: '/treatment-plan' },
  { icon: Zap, label: 'AI Triage', desc: 'Urgency check', path: '/triage' },
];

const medicalTools = [
  { icon: TrendingUp, label: 'Health Trends', path: '/trends' },
  { icon: GitCompare, label: 'Compare Reports', path: '/compare' },
  { icon: Calendar, label: 'Timeline', path: '/timeline' },
  { icon: Scan, label: 'Prescription Scan', path: '/prescription' },
  { icon: Heart, label: 'ECG Interpreter', path: '/ecg' },
  { icon: FileImage, label: 'X-ray AI', path: '/xray' },
  { icon: Brain, label: 'MRI Analysis', path: '/mri' },
  { icon: ScanLine, label: 'CT Scan AI', path: '/ct-scan' },
  { icon: Search, label: 'Medicine Scanner', path: '/medicine-scanner' },
];

const adminDashboards = [
  { icon: Stethoscope, label: 'Doctor Dashboard', desc: 'Manage patients & appointments', path: '/doctor-dashboard', color: 'from-primary to-blue-glow' },
  { icon: Building2, label: 'Hospital Admin', desc: 'Operations & analytics', path: '/hospital-dashboard', color: 'from-secondary to-teal' },
  { icon: ShoppingCart, label: 'Pharmacy Panel', desc: 'Inventory & orders', path: '/pharmacy-dashboard', color: 'from-amber-400 to-orange-500' },
];

const services = [
  { icon: CalendarDays, label: 'Book Appointment', path: '/book-appointment' },
  { icon: Video, label: 'Telemedicine', path: '/telemedicine' },
  { icon: MapPin, label: 'Health Map', path: '/health-map' },
  { icon: ShoppingCart, label: 'Medicine Store', path: '/medicine-store' },
  { icon: Users, label: 'Family Health', path: '/family' },
  { icon: Watch, label: 'Wearables', path: '/wearables' },
  { icon: AlertTriangle, label: 'Emergency Card', path: '/emergency-card' },
  { icon: ShieldAlert, label: 'Emergency Alerts', path: '/alerts' },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } },
};

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-background pb-24">
      {/* Ambient background mesh */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-lg">
            <div className="flex items-center gap-2.5">
              <motion.div
                className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' }}
              >
                <Activity className="w-4.5 h-4.5 text-primary-foreground" />
              </motion.div>
              <span className="text-lg font-display font-bold text-foreground tracking-tight">Bee.dr</span>
              <AIBadge variant="pulse" className="ml-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </AIBadge>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/language')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-subtle text-xs font-medium text-foreground hover:bg-white/60 transition-all"
                title={`Language: ${languageInfo.name}`}
              >
                <span className="text-sm">{languageInfo.flag}</span>
                <span className="hidden sm:inline text-muted-foreground">{languageInfo.native}</span>
              </button>
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.85 }}
                className="relative w-8 h-8 rounded-xl glass-subtle flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-all overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="relative rounded-xl">
                <Bell className="w-4 h-4" />
                <motion.span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="rounded-xl">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 max-w-lg space-y-6 relative z-10">
        {/* Greeting + AI Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
          <h1 className="text-2xl font-display font-bold text-foreground mb-5 tracking-tight">
            Hello, {displayName} 👋
          </h1>

          <AIGlowCard glowColor="primary" className="relative" animated={false}>
            <div className="absolute top-0 right-0 w-40 h-20 opacity-30 pointer-events-none">
              <ECGLine />
            </div>

            <div className="flex items-center gap-5 relative z-10">
              <HealthScoreRing score={healthScore} size={130} />
              <div className="flex-1 space-y-2.5">
                <p className="font-display font-semibold text-foreground text-lg">Your Health Score</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Based on your latest reports and daily check-ins</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <AIBadge variant="glow" className="bg-success/10 text-success">
                    <Heart className="w-2.5 h-2.5" /> Heart: OK
                  </AIBadge>
                  <AIBadge variant="pulse" className="bg-warning/10 text-warning">
                    <Shield className="w-2.5 h-2.5" /> Vit D: Low
                  </AIBadge>
                </div>
              </div>
            </div>
          </AIGlowCard>
        </motion.div>

        {/* AI Copilot Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.button
            onClick={() => navigate('/chat')}
            className="w-full relative overflow-hidden rounded-2xl gradient-hero p-5 text-left group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.2)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute top-3 right-3 opacity-40">
              <AIBrainWave />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-white text-base">Ask Bee.dr AI</h3>
                <p className="text-xs text-white/60 mt-0.5">Symptoms, reports, medications — I'm here 24/7</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </motion.div>

        {/* Health Profile Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AIGlowCard onClick={() => navigate('/health-profile')} glowColor="secondary">
            {healthProfile ? (() => {
              const bmi = healthProfile.height_cm && healthProfile.weight_kg
                ? (Number(healthProfile.weight_kg) / Math.pow(Number(healthProfile.height_cm) / 100, 2)).toFixed(1)
                : null;
              return (
                <div className="flex items-center gap-4">
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    {[
                      { icon: Droplets, value: healthProfile.blood_group || '—', label: 'Blood', color: 'text-primary' },
                      { icon: HeartPulse, value: bmi || '—', label: 'BMI', color: 'text-secondary' },
                      { icon: Shield, value: String(healthProfile.allergies?.length || 0), label: 'Allergies', color: 'text-destructive' },
                    ].map(({ icon: Icon, value, label, color }) => (
                      <div key={label} className="text-center">
                        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                        <p className="text-base font-bold text-foreground">{value}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })() : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Set up Health Profile</p>
                  <p className="text-xs text-muted-foreground">Add blood group, height, weight & allergies</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </AIGlowCard>
        </motion.div>

        {/* Quick Actions — 2x2 gradient cards */}
        <motion.div variants={stagger.container} initial="hidden" animate="show">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, desc, path, color }) => (
              <motion.button key={label}
                variants={stagger.item}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -3 }}
                onClick={() => navigate(path)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${color} text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                <div className="absolute bottom-0 left-0 w-14 h-14 bg-white/5 rounded-full translate-y-4 -translate-x-4" />
                <Icon className="w-7 h-7 mb-3 relative z-10" />
                <span className="text-sm font-semibold block relative z-10">{label}</span>
                <span className="text-[11px] text-white/70 relative z-10">{desc}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* AI-Powered Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <h2 className="text-sm font-display font-semibold text-foreground">AI-Powered</h2>
            <AIBadge variant="glow">
              <Zap className="w-2 h-2" /> Smart
            </AIBadge>
          </div>
          <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5">
            {aiFeatures.map(({ icon: Icon, label, desc, path }) => (
              <motion.button key={label}
                variants={stagger.item}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(path)}
                className="glass-card p-3.5 text-left group">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center mb-2 group-hover:bg-primary/15 transition-colors group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-xs font-semibold block text-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Medical Tools Horizontal Scroll */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h2 className="text-sm font-display font-semibold text-foreground mb-3">Medical Tools</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
            {medicalTools.map(({ icon: Icon, label, path }) => (
              <motion.button key={label} onClick={() => navigate(path)}
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 min-w-[72px] p-3 rounded-2xl glass-subtle hover:glass-card transition-all shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Admin Dashboards */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-sm font-display font-semibold text-foreground mb-3">Admin Panels</h2>
          <div className="space-y-2.5">
            {adminDashboards.map(({ icon: Icon, label, desc, path, color }, i) => (
              <motion.button key={label}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 + i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate(path)}
                className={`w-full relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-r ${color} text-white shadow-lg hover:shadow-xl transition-shadow flex items-center gap-4`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 relative z-10">
                  <span className="text-sm font-semibold block">{label}</span>
                  <span className="text-[11px] text-white/70">{desc}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/60" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Services Grid */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h2 className="text-sm font-display font-semibold text-foreground mb-3">Services</h2>
          <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-3 gap-2.5">
            {services.map(({ icon: Icon, label, path }) => (
              <motion.button key={label}
                variants={stagger.item}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass-subtle hover:glass-card hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)] transition-all text-center">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-medium text-foreground leading-tight">{label}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {[
            { icon: Pill, label: 'Med Reminders', path: '/med-reminders' },
            { icon: Syringe, label: 'Vaccinations', path: '/vaccinations' },
            { icon: Shield, label: 'Privacy', path: '/settings' },
            { icon: Bell, label: 'Alerts', path: '/notifications' },
          ].map(({ icon: Icon, label, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-subtle text-xs font-medium text-foreground whitespace-nowrap hover:glass-card transition-all shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" /> {label}
            </button>
          ))}
        </motion.div>

        {/* Recent Reports */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-semibold text-foreground">Recent Reports</h2>
            {scans.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="text-primary text-xs h-7 rounded-lg">
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
          {scans.length === 0 ? (
            <AIGlowCard className="text-center py-10" animated={false}>
              <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No reports yet</p>
              <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => navigate('/upload')}>
                Upload your first report
              </Button>
            </AIGlowCard>
          ) : (
            <div className="space-y-2">
              {scans.map((scan, i) => (
                <motion.div key={scan.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  whileHover={{ x: 4 }}
                  onClick={() => scan.status === 'complete' ? navigate(`/results/${scan.id}`) : null}
                  className="glass-card p-3.5 flex items-center gap-3 cursor-pointer hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{scan.file_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
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
