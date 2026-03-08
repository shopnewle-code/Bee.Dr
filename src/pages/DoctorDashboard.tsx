import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Calendar, Users, Brain, Video, FileText, Clock, ChevronRight,
  Search, Bell, Settings, TrendingUp, Activity, Stethoscope,
  ClipboardList, MessageSquare, Pill, Phone, Sun, Moon,
  ArrowLeft, Plus, Printer, Save, Send, CheckCircle2,
  BarChart3, Heart, Thermometer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, AppointmentCard, PatientCard, SectionHeader } from '@/components/medical/Cards';

const todayAppointments = [
  { id: '1', patient: 'Arjun Mehta', age: 34, time: '9:00 AM', type: 'Follow-up', status: 'in-progress' as const, avatar: '🧑' },
  { id: '2', patient: 'Priya Sharma', age: 28, time: '9:30 AM', type: 'New Patient', status: 'waiting' as const, avatar: '👩' },
  { id: '3', patient: 'Ravi Kumar', age: 52, time: '10:00 AM', type: 'Lab Review', status: 'scheduled' as const, avatar: '👨' },
  { id: '4', patient: 'Anita Patel', age: 45, time: '10:30 AM', type: 'Telemedicine', status: 'scheduled' as const, avatar: '👩‍🦱' },
  { id: '5', patient: 'Suresh Reddy', age: 60, time: '11:00 AM', type: 'Chronic Care', status: 'scheduled' as const, avatar: '👴' },
];

const recentPatients = [
  { name: 'Arjun Mehta', condition: 'Type 2 Diabetes', lastVisit: '2 days ago', risk: 'medium' as const },
  { name: 'Priya Sharma', condition: 'Hypertension', lastVisit: '1 week ago', risk: 'low' as const },
  { name: 'Ravi Kumar', condition: 'Cardiac Monitoring', lastVisit: '3 days ago', risk: 'high' as const },
  { name: 'Sunita Devi', condition: 'Thyroid', lastVisit: '5 days ago', risk: 'low' as const },
];

const stats = [
  { label: "Today's Patients", value: '12', change: '+3', up: true, icon: Users },
  { label: 'Pending Reports', value: '5', change: '-2', up: false, icon: FileText },
  { label: 'Telemedicine', value: '4', change: '+1', up: true, icon: Video },
  { label: 'AI Assists', value: '23', change: '+8', up: true, icon: Brain },
];

const prescriptionTemplates = [
  { name: 'Hypertension Standard', meds: ['Amlodipine 5mg', 'Losartan 50mg'], diagnosis: 'Essential Hypertension' },
  { name: 'Diabetes Type 2', meds: ['Metformin 500mg', 'Glimepiride 1mg'], diagnosis: 'Type 2 DM' },
  { name: 'Viral Fever', meds: ['Paracetamol 650mg', 'Cetirizine 10mg'], diagnosis: 'Acute Viral Fever' },
];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients' | 'ai' | 'prescriptions' | 'analytics'>('appointments');

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Top Bar */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Stethoscope className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-base font-display font-bold text-foreground block leading-tight">Dr. Dashboard</span>
                <span className="text-[10px] text-muted-foreground">Bee.dr SaaS</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button onClick={toggleTheme} whileTap={{ scale: 0.85 }}
                className="w-8 h-8 rounded-xl glass-subtle flex items-center justify-center transition-all overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={theme} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.15 }}>
                    {theme === 'light' ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              <Button variant="ghost" size="icon" className="rounded-xl relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 max-w-4xl space-y-5">
        {/* Welcome + Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-display font-bold text-foreground mb-1">Good Morning, Dr. Sharma 👨‍⚕️</h1>
          <p className="text-sm text-muted-foreground mb-4">You have 12 appointments today</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 glass-subtle rounded-2xl overflow-x-auto">
          {[
            { key: 'appointments' as const, label: 'Schedule', icon: Calendar },
            { key: 'patients' as const, label: 'Patients', icon: Users },
            { key: 'prescriptions' as const, label: 'Prescriptions', icon: ClipboardList },
            { key: 'ai' as const, label: 'AI Assistant', icon: Brain },
            { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap px-3 ${
                activeTab === key ? 'glass-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <SectionHeader title="Today's Schedule" action={
              <Button variant="outline" size="sm" className="rounded-xl text-xs h-8">
                <Calendar className="w-3 h-3 mr-1" /> View Calendar
              </Button>
            } />
            {todayAppointments.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <AppointmentCard
                  patient={apt.patient} time={apt.time} type={apt.type}
                  status={apt.status} avatar={apt.avatar} age={apt.age}
                  actions={
                    <>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg"><Video className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg"><Phone className="w-3 h-3" /></Button>
                    </>
                  }
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search patients..." className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            {recentPatients.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <PatientCard {...p} />
              </motion.div>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { icon: ClipboardList, label: 'Prescription Generator', desc: 'AI-assisted Rx' },
                { icon: FileText, label: 'Patient Records', desc: 'View history' },
                { icon: MessageSquare, label: 'Messages', desc: 'Patient queries' },
                { icon: Pill, label: 'Drug Interactions', desc: 'AI checker' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass-card p-3.5 cursor-pointer" onClick={() => label.includes('Prescription') && setActiveTab('prescriptions')}>
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Prescriptions Tab (NEW) */}
        {activeTab === 'prescriptions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <SectionHeader title="Prescription Generator" action={
              <Button size="sm" className="rounded-xl text-xs h-8 gradient-primary text-primary-foreground shadow-glow">
                <Plus className="w-3 h-3 mr-1" /> New Prescription
              </Button>
            } />

            {/* Quick Templates */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick Templates</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {prescriptionTemplates.map((tpl, i) => (
                  <motion.div key={tpl.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 cursor-pointer">
                    <p className="text-xs font-semibold text-foreground mb-1">{tpl.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{tpl.diagnosis}</p>
                    <div className="space-y-1">
                      {tpl.meds.map(med => (
                        <span key={med} className="flex items-center gap-1 text-[10px] text-primary">
                          <Pill className="w-2.5 h-2.5" /> {med}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Prescription Form */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground text-sm">Write Prescription</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Patient Name</label>
                  <input placeholder="Select patient..." className="w-full px-3 py-2 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Diagnosis</label>
                  <input placeholder="Enter diagnosis..." className="w-full px-3 py-2 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Medications</label>
                <div className="space-y-2">
                  {['Medicine 1'].map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <input placeholder="Medicine name" className="flex-1 px-3 py-2 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input placeholder="Dosage" className="w-24 px-3 py-2 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input placeholder="Duration" className="w-24 px-3 py-2 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="rounded-xl text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add Medicine
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Instructions</label>
                <textarea placeholder="Additional instructions..." className="w-full px-3 py-2 rounded-xl glass-subtle text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl gradient-primary text-primary-foreground shadow-glow">
                  <Send className="w-3 h-3 mr-1" /> Send to Patient
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Printer className="w-3 h-3 mr-1" /> Print
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Save className="w-3 h-3 mr-1" /> Save Draft
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl gradient-hero p-5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">AI Diagnosis Assistant</h3>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    Get AI-powered differential diagnoses, drug interaction checks, and treatment recommendations.
                  </p>
                  <Button size="sm" className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs backdrop-blur-sm">
                    Start Consultation <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Activity, label: 'Lab Result Analysis', desc: 'Upload patient labs for AI interpretation', action: 'Analyze' },
                { icon: Brain, label: 'Differential Diagnosis', desc: 'Input symptoms for AI diagnosis ranking', action: 'Diagnose' },
                { icon: Pill, label: 'Drug Interaction Check', desc: 'Check medications for interactions', action: 'Check' },
                { icon: TrendingUp, label: 'Patient Risk Assessment', desc: 'AI risk scoring across markers', action: 'Assess' },
              ].map(({ icon: Icon, label, desc, action }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs shrink-0">{action}</Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab (NEW) */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <SectionHeader title="Patient Analytics" />

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Patients', value: '248', icon: Users, change: '+18 this month' },
                { label: 'Avg. Consultation', value: '22m', icon: Clock, change: '-3m vs last month' },
                { label: 'Patient Rating', value: '4.8', icon: Heart, change: '⭐ 132 reviews' },
              ].map(({ label, value, icon: Icon, change }) => (
                <div key={label} className="glass-card p-4 text-center">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-2" />
                  <p className="text-xl font-display font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-[9px] text-primary mt-1">{change}</p>
                </div>
              ))}
            </div>

            {/* Consultation Breakdown */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4">Consultation Types — This Month</h3>
              <div className="space-y-3">
                {[
                  { type: 'In-Person', count: 45, pct: '38%', width: '100%', color: 'bg-primary' },
                  { type: 'Telemedicine', count: 32, pct: '27%', width: '71%', color: 'bg-secondary' },
                  { type: 'Follow-up', count: 28, pct: '23%', width: '62%', color: 'bg-amber-500' },
                  { type: 'Emergency', count: 14, pct: '12%', width: '31%', color: 'bg-destructive' },
                ].map(({ type, count, pct, width, color }) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{type}</span>
                      <span className="text-muted-foreground">{count} ({pct})</span>
                    </div>
                    <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width }} transition={{ delay: 0.3, duration: 0.6 }}
                        className={`h-full ${color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Diagnoses */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground text-sm mb-3">Top Diagnoses</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Hypertension', count: 34, icon: Heart },
                  { name: 'Type 2 Diabetes', count: 28, icon: Activity },
                  { name: 'Viral Fever', count: 22, icon: Thermometer },
                  { name: 'Thyroid Disorder', count: 18, icon: Brain },
                ].map(({ name, count, icon: Icon }) => (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-xl bg-primary/5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-foreground font-medium flex-1">{name}</span>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
