import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, AlertTriangle, ShieldAlert, X, Loader2, Activity,
  Phone, HeartPulse
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface Alert {
  id: string;
  title: string;
  description: string;
  alert_type: string;
  test_name?: string;
  test_value?: number;
  is_dismissed: boolean;
  created_at: string;
  scan_id?: string;
}

const demoAlerts: Alert[] = [
  {
    id: 'demo-1', title: '🚨 Critical Blood Sugar Level', alert_type: 'critical',
    description: 'Fasting glucose at 185 mg/dL — significantly above the 100 mg/dL threshold. Seek medical attention.',
    test_name: 'Fasting Glucose', test_value: 185, is_dismissed: false, created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2', title: '⚠️ Very Low Hemoglobin', alert_type: 'critical',
    description: 'Hemoglobin at 7.5 g/dL — severely below normal range (12-16). This may indicate severe anemia.',
    test_name: 'Hemoglobin', test_value: 7.5, is_dismissed: false, created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-3', title: '⚠️ High Creatinine Detected', alert_type: 'warning',
    description: 'Creatinine at 2.1 mg/dL — above normal max of 1.3 mg/dL. May indicate kidney function issues.',
    test_name: 'Creatinine', test_value: 2.1, is_dismissed: false, created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const EmergencyAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('emergency_alerts').select('*').eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAlerts(data as Alert[]);
        } else {
          setAlerts(demoAlerts);
          setUseDemo(true);
        }
        setLoading(false);
      });
  }, [user]);

  const dismissAlert = async (alertId: string) => {
    if (useDemo) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alert dismissed');
      return;
    }
    const { error } = await supabase.from('emergency_alerts')
      .update({ is_dismissed: true }).eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alert dismissed');
    }
  };

  const criticalAlerts = alerts.filter(a => a.alert_type === 'critical');
  const warningAlerts = alerts.filter(a => a.alert_type !== 'critical');

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
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <span className="font-display font-bold text-foreground">Emergency Alerts</span>
          {alerts.length > 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
              {alerts.length} active
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {useDemo && (
          <div className="bg-accent/40 border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground text-center">
              🚨 Showing demo alerts — real alerts are auto-generated when critical values are detected in your reports.
            </p>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <HeartPulse className="w-12 h-12 mx-auto mb-3 text-success opacity-60" />
            <p className="font-display font-semibold text-foreground">All Clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No emergency alerts detected</p>
          </div>
        ) : (
          <>
            {/* Critical Section */}
            {criticalAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-display font-semibold text-destructive mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Critical — Immediate Attention
                </h3>
                <div className="space-y-3">
                  {criticalAlerts.map((alert, i) => (
                    <motion.div key={alert.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-destructive/5 border-2 border-destructive/30 rounded-xl p-4 relative"
                    >
                      <button onClick={() => dismissAlert(alert.id)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                      <h4 className="font-semibold text-foreground text-sm pr-6">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{alert.description}</p>
                      {alert.test_name && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-lg font-medium">
                            {alert.test_name}: {alert.test_value}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="destructive" className="text-xs h-8 gap-1"
                          onClick={() => navigate(alert.scan_id ? `/results/${alert.scan_id}` : '/chat')}>
                          <Activity className="w-3 h-3" /> View Report
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                          <Phone className="w-3 h-3" /> Call Doctor
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Section */}
            {warningAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-display font-semibold text-warning mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Warnings
                </h3>
                <div className="space-y-3">
                  {warningAlerts.map((alert, i) => (
                    <motion.div key={alert.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-warning/5 border border-warning/30 rounded-xl p-4 relative"
                    >
                      <button onClick={() => dismissAlert(alert.id)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                      <h4 className="font-semibold text-foreground text-sm pr-6">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{alert.description}</p>
                      {alert.test_name && (
                        <span className="mt-2 inline-block text-xs bg-warning/10 text-warning px-2 py-1 rounded-lg font-medium">
                          {alert.test_name}: {alert.test_value}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default EmergencyAlerts;
