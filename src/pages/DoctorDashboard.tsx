import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Brain, Video, FileText, Clock, ChevronRight,
  Search, Bell, Settings, TrendingUp, Activity, Stethoscope,
  ClipboardList, MessageSquare, Pill, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Star, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for the doctor dashboard
const todayAppointments = [
  { id: '1', patient: 'Arjun Mehta', age: 34, time: '9:00 AM', type: 'Follow-up', status: 'in-progress', avatar: '🧑' },
  { id: '2', patient: 'Priya Sharma', age: 28, time: '9:30 AM', type: 'New Patient', status: 'waiting', avatar: '👩' },
  { id: '3', patient: 'Ravi Kumar', age: 52, time: '10:00 AM', type: 'Lab Review', status: 'scheduled', avatar: '👨' },
  { id: '4', patient: 'Anita Patel', age: 45, time: '10:30 AM', type: 'Telemedicine', status: 'scheduled', avatar: '👩‍🦱' },
  { id: '5', patient: 'Suresh Reddy', age: 60, time: '11:00 AM', type: 'Chronic Care', status: 'scheduled', avatar: '👴' },
];

const recentPatients = [
  { name: 'Arjun Mehta', condition: 'Type 2 Diabetes', lastVisit: '2 days ago', risk: 'medium' },
  { name: 'Priya Sharma', condition: 'Hypertension', lastVisit: '1 week ago', risk: 'low' },
  { name: 'Ravi Kumar', condition: 'Cardiac Monitoring', lastVisit: '3 days ago', risk: 'high' },
];

const stats = [
  { label: 'Today\'s Patients', value: '12', change: '+3', up: true, icon: Users },
  { label: 'Pending Reports', value: '5', change: '-2', up: false, icon: FileText },
  { label: 'Telemedicine', value: '4', change: '+1', up: true, icon: Video },
  { label: 'AI Assists', value: '23', change: '+8', up: true, icon: Brain },
];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients' | 'ai'>('appointments');

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Top Bar */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Stethoscope className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="text-base font-display font-bold text-foreground block leading-tight">Dr. Dashboard</span>
                <span className="text-[10px] text-muted-foreground">Bee.dr SaaS</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
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
            {stats.map(({ label, value, change, up, icon: Icon }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${up ? 'text-success' : 'text-destructive'}`}>
                    {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 glass-subtle rounded-2xl">
          {[
            { key: 'appointments' as const, label: 'Appointments', icon: Calendar },
            { key: 'patients' as const, label: 'Patients', icon: Users },
            { key: 'ai' as const, label: 'AI Assistant', icon: Brain },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === key ? 'glass-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-foreground">Today's Schedule</h2>
              <Button variant="outline" size="sm" className="rounded-xl text-xs h-8">
                <Calendar className="w-3 h-3 mr-1" /> View Calendar
              </Button>
            </div>
            {todayAppointments.map((apt, i) => (
              <motion.div key={apt.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-4 group cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center text-xl shrink-0">
                  {apt.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{apt.patient}</p>
                    <span className="text-[10px] text-muted-foreground">Age {apt.age}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {apt.time}
                    </span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 rounded-full">{apt.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    apt.status === 'in-progress' ? 'bg-success animate-pulse' :
                    apt.status === 'waiting' ? 'bg-warning animate-pulse' : 'bg-muted-foreground/30'
                  }`} />
                  <span className="text-[10px] text-muted-foreground capitalize">{apt.status.replace('-', ' ')}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg">
                      <Video className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg">
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
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
                <input placeholder="Search patients..." className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            {recentPatients.map((p, i) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.condition} · {p.lastVisit}</p>
                </div>
                <Badge className={`text-[9px] rounded-full ${
                  p.risk === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                  p.risk === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-success/10 text-success border-success/20'
                }`} variant="outline">{p.risk} risk</Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            ))}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { icon: ClipboardList, label: 'Prescription Generator', desc: 'AI-assisted Rx' },
                { icon: FileText, label: 'Patient Records', desc: 'View history' },
                { icon: MessageSquare, label: 'Messages', desc: 'Patient queries' },
                { icon: Pill, label: 'Drug Interactions', desc: 'AI checker' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass-card p-3.5 cursor-pointer">
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              ))}
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
                    Get AI-powered differential diagnoses, drug interaction checks, and treatment recommendations based on patient data.
                  </p>
                  <Button size="sm" className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs backdrop-blur-sm">
                    Start Consultation <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Activity, label: 'Lab Result Analysis', desc: 'Upload patient labs for AI interpretation and anomaly detection', action: 'Analyze' },
                { icon: Brain, label: 'Differential Diagnosis', desc: 'Input symptoms for AI-generated differential diagnosis ranking', action: 'Diagnose' },
                { icon: Pill, label: 'Drug Interaction Check', desc: 'Check prescribed medications for potential interactions', action: 'Check' },
                { icon: TrendingUp, label: 'Patient Risk Assessment', desc: 'AI-powered risk scoring across cardiac, diabetic, and renal markers', action: 'Assess' },
              ].map(({ icon: Icon, label, desc, action }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
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
      </main>

      {/* Back to patient dashboard */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={() => navigate('/dashboard')} size="sm" className="rounded-full shadow-glow gradient-primary text-white">
          <Activity className="w-4 h-4 mr-1" /> Patient App
        </Button>
      </div>
    </div>
  );
};

export default DoctorDashboard;
