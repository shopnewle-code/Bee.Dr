import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, Bed, Activity, TrendingUp, BarChart3, Settings,
  Bell, ChevronRight, ArrowUpRight, ArrowDownRight, Search,
  Stethoscope, ClipboardList, AlertTriangle, Heart, Thermometer,
  UserPlus, UserMinus, Clock, Zap, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const hospitalStats = [
  { label: 'Total Patients', value: '347', change: '+12', up: true, icon: Users },
  { label: 'Bed Occupancy', value: '78%', change: '+3%', up: true, icon: Bed },
  { label: 'Doctors Active', value: '42', change: '0', up: true, icon: Stethoscope },
  { label: 'Critical Cases', value: '8', change: '-2', up: false, icon: AlertTriangle },
];

const departments = [
  { name: 'Cardiology', doctors: 8, beds: 30, occupied: 24, patients: 52, color: 'from-red-400 to-rose-600' },
  { name: 'Neurology', doctors: 6, beds: 25, occupied: 18, patients: 35, color: 'from-purple-400 to-violet-600' },
  { name: 'Orthopedics', doctors: 7, beds: 28, occupied: 22, patients: 41, color: 'from-blue-400 to-indigo-600' },
  { name: 'Pediatrics', doctors: 5, beds: 20, occupied: 14, patients: 28, color: 'from-amber-400 to-orange-600' },
  { name: 'General Medicine', doctors: 10, beds: 40, occupied: 32, patients: 67, color: 'from-emerald-400 to-green-600' },
  { name: 'ICU', doctors: 4, beds: 15, occupied: 13, patients: 13, color: 'from-red-500 to-red-700' },
];

const recentAdmissions = [
  { name: 'Rahul Verma', dept: 'Cardiology', time: '2h ago', status: 'critical', bed: 'C-204' },
  { name: 'Meera Joshi', dept: 'Pediatrics', time: '3h ago', status: 'stable', bed: 'P-112' },
  { name: 'Anil Kapoor', dept: 'Orthopedics', time: '5h ago', status: 'recovering', bed: 'O-308' },
  { name: 'Sunita Devi', dept: 'ICU', time: '1h ago', status: 'critical', bed: 'ICU-07' },
];

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'overview' | 'departments' | 'flow'>('overview');

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="text-base font-display font-bold text-foreground block leading-tight">Hospital Admin</span>
                <span className="text-[10px] text-muted-foreground">Bee.dr Cloud</span>
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

      <main className="container mx-auto px-4 py-5 max-w-5xl space-y-5">
        {/* Header Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-display font-bold text-foreground mb-1">City General Hospital</h1>
          <p className="text-sm text-muted-foreground mb-4">Real-time operational overview</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {hospitalStats.map(({ label, value, change, up, icon: Icon }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    label === 'Critical Cases' ? (up ? 'text-destructive' : 'text-success') :
                    (up ? 'text-success' : 'text-destructive')
                  }`}>
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

        {/* Section Tabs */}
        <div className="flex gap-1 p-1 glass-subtle rounded-2xl">
          {[
            { key: 'overview' as const, label: 'Overview', icon: Activity },
            { key: 'departments' as const, label: 'Departments', icon: Building2 },
            { key: 'flow' as const, label: 'Patient Flow', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setActiveSection(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeSection === key ? 'glass-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Bed Availability */}
            <div>
              <h2 className="text-sm font-display font-semibold text-foreground mb-3">Bed Availability by Department</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept, i) => (
                  <motion.div key={dept.name}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${dept.color} flex items-center justify-center`}>
                          <Bed className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{dept.name}</p>
                          <p className="text-[10px] text-muted-foreground">{dept.doctors} doctors</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {dept.beds - dept.occupied} <span className="text-muted-foreground">/ {dept.beds} free</span>
                      </span>
                    </div>
                    <Progress value={(dept.occupied / dept.beds) * 100} className="h-2 rounded-full" />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {Math.round((dept.occupied / dept.beds) * 100)}% occupancy · {dept.patients} total patients
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Admissions */}
            <div>
              <h2 className="text-sm font-display font-semibold text-foreground mb-3">Recent Admissions</h2>
              <div className="space-y-2">
                {recentAdmissions.map((adm, i) => (
                  <motion.div key={adm.name}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-3.5 flex items-center gap-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {adm.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{adm.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{adm.dept}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {adm.time}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 rounded-full">{adm.bed}</Badge>
                      </div>
                    </div>
                    <Badge className={`text-[9px] rounded-full ${
                      adm.status === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      adm.status === 'stable' ? 'bg-success/10 text-success border-success/20' :
                      'bg-info/10 text-info border-info/20'
                    }`} variant="outline">{adm.status}</Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Departments Tab */}
        {activeSection === 'departments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search departments..." className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <Button variant="outline" size="sm" className="rounded-xl text-xs h-10">
                <UserPlus className="w-3 h-3 mr-1" /> Add Doctor
              </Button>
            </div>

            {departments.map((dept, i) => (
              <motion.div key={dept.name}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center`}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-foreground">{dept.name}</h3>
                    <p className="text-xs text-muted-foreground">{dept.doctors} doctors · {dept.patients} active patients</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-xl bg-primary/5">
                    <p className="text-lg font-bold text-foreground">{dept.doctors}</p>
                    <p className="text-[10px] text-muted-foreground">Doctors</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-secondary/10">
                    <p className="text-lg font-bold text-foreground">{dept.beds - dept.occupied}</p>
                    <p className="text-[10px] text-muted-foreground">Beds Free</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-warning/10">
                    <p className="text-lg font-bold text-foreground">{dept.patients}</p>
                    <p className="text-[10px] text-muted-foreground">Patients</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Patient Flow Tab */}
        {activeSection === 'flow' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Flow Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: UserPlus, label: 'Admissions Today', value: '14', color: 'text-success' },
                { icon: UserMinus, label: 'Discharges Today', value: '9', color: 'text-primary' },
                { icon: Zap, label: 'ER Visits', value: '23', color: 'text-warning' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="glass-card p-4 text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                  <p className="text-xl font-display font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Patient Flow Timeline */}
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Today's Patient Flow</h3>
              <div className="space-y-4">
                {[
                  { time: '6:00 AM', admissions: 2, discharges: 0, er: 3 },
                  { time: '8:00 AM', admissions: 4, discharges: 1, er: 5 },
                  { time: '10:00 AM', admissions: 3, discharges: 3, er: 7 },
                  { time: '12:00 PM', admissions: 2, discharges: 2, er: 4 },
                  { time: '2:00 PM', admissions: 3, discharges: 3, er: 4 },
                ].map((slot) => (
                  <div key={slot.time} className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 font-mono">{slot.time}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-5 rounded-full bg-success/20" style={{ width: `${slot.admissions * 15}%`, minWidth: '8px' }}>
                        <div className="h-full rounded-full bg-success" style={{ width: '100%' }} />
                      </div>
                      <div className="h-5 rounded-full bg-primary/20" style={{ width: `${slot.discharges * 15}%`, minWidth: '8px' }}>
                        <div className="h-full rounded-full bg-primary" style={{ width: '100%' }} />
                      </div>
                      <div className="h-5 rounded-full bg-warning/20" style={{ width: `${slot.er * 10}%`, minWidth: '8px' }}>
                        <div className="h-full rounded-full bg-warning" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Admissions</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Discharges</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> ER Visits</span>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card p-4 border-l-4 border-l-destructive">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-sm">ICU Near Capacity</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ICU occupancy at 87% — only 2 beds remaining. Consider diverting non-critical admissions.</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="destructive" className="rounded-xl text-xs h-7">Take Action</Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-7">Dismiss</Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={() => navigate('/dashboard')} size="sm" className="rounded-full shadow-glow gradient-primary text-white">
          <Activity className="w-4 h-4 mr-1" /> Patient App
        </Button>
      </div>
    </div>
  );
};

export default HospitalDashboard;
