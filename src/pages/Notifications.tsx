import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Bell, Heart, AlertTriangle, Pill, CheckCircle2, X
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'critical' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'critical', title: 'High Cholesterol Alert', message: 'Your cholesterol level is above 200 mg/dL. Consider consulting a doctor.', time: '2 hours ago', read: false },
  { id: '2', type: 'reminder', title: 'Medicine Reminder', message: 'Time to take your Vitamin D3 supplement (2000 IU).', time: '4 hours ago', read: false },
  { id: '3', type: 'info', title: 'Report Analysis Complete', message: 'Your blood test report from Feb 12 has been analyzed.', time: '1 day ago', read: true },
  { id: '4', type: 'warning', title: 'Low Hemoglobin', message: 'Your hemoglobin has been trending down. Eat iron-rich foods.', time: '2 days ago', read: true },
  { id: '5', type: 'info', title: 'Health Score Updated', message: 'Your health score improved to 78/100 this week!', time: '3 days ago', read: true },
];

const typeConfig = {
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: Heart, color: 'text-warning', bg: 'bg-warning/10' },
  reminder: { icon: Pill, color: 'text-primary', bg: 'bg-primary/10' },
  info: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(mockAlerts);

  const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));
  const markRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Bell className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Notifications</span>
          <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {alerts.filter(a => !a.read).length} new
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-2">
        {alerts.map((alert, i) => {
          const cfg = typeConfig[alert.type];
          const Icon = cfg.icon;
          return (
            <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => markRead(alert.id)}
              className={`bg-card border rounded-xl p-4 flex gap-3 cursor-pointer transition-all ${
                alert.read ? 'border-border opacity-70' : 'border-primary/20 shadow-sm'
              }`}>
              <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm">{alert.title}</h3>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(alert.id); }}
                    className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
              </div>
              {!alert.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
            </motion.div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">All caught up!</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default NotificationsPage;
