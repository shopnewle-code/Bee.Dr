import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Bot,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Zap,
  Activity,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import BottomNav from '@/components/BottomNav';
import { ActionCard, HealthCard, AdminCard } from '@/components/ui/cards';
import { CardGridSkeleton, EmptyReportsState } from '@/components/ui/loading-states';
import { useTheme } from '@/contexts/ThemeContext';
import { featureFlags } from '@/utils/feature-flags';

interface HealthMetrics {
  healthScore: number;
  alerts: Array<{ title: string; severity: 'warning' | 'alert' }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, isDeveloper } = useRole();
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [recentReports, setRecentReports] = useState<Tables<'scan_results'>[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single() as { 
            data: Tables<'profiles'> | null; 
            error: any 
          };

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profileData && 'display_name' in profileData && profileData.display_name) {
          const firstName = (profileData.display_name as string).split(' ')[0];
          setUserName(firstName);
        }

        // Fetch recent reports
        const { data: scansData, error: scansError } = await supabase
          .from('scan_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (scansError) {
          console.error('Error fetching reports:', scansError);
        }

        if (scansData) {
          setRecentReports(scansData as Tables<'scan_results'>[]);
        }

        // Mock health metrics - replace with actual data
        setHealthMetrics({
          healthScore: 78,
          alerts: [
            { title: 'Vitamin D Low', severity: 'warning' },
            { title: 'Check Blood Pressure', severity: 'warning' },
          ],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const quickActions = [
    {
      icon: Upload,
      label: 'Upload Report',
      description: 'Upload medical documents',
      onClick: () => navigate('/upload'),
      gradient: 'from-blue-600 to-blue-700',
    },
    {
      icon: Bot,
      label: 'AI Doctor',
      description: 'Ask health questions',
      onClick: () => navigate('/chat'),
      gradient: 'from-purple-600 to-purple-700',
    },
  ];

  const adminTools = [
    {
      icon: Activity,
      label: 'Doctor Dashboard',
      description: 'Manage patient records',
      onClick: () => navigate('/doctor-dashboard'),
      gradient: 'from-emerald-600/20 to-emerald-700/20',
    },
    {
      icon: Zap,
      label: 'Hospital Admin',
      description: 'Operations & staff',
      onClick: () => navigate('/hospital-dashboard'),
      gradient: 'from-cyan-600/20 to-cyan-700/20',
    },
    {
      icon: Heart,
      label: 'Pharmacy Panel',
      description: 'Inventory management',
      onClick: () => navigate('/pharmacy-dashboard'),
      gradient: 'from-pink-600/20 to-pink-700/20',
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-primary/10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Good Morning{userName ? `, ${userName}` : ''}</h1>
            <p className="text-xs text-muted-foreground">Your health at a glance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-primary/10"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="hover:bg-primary/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Health Score Section */}
        {loading ? (
          <CardGridSkeleton count={1} />
        ) : (
          <>
            {/* Health Status Card */}
            {healthMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Health Score</p>
                    <h2 className="text-4xl font-bold text-primary">
                      {healthMetrics.healthScore}%
                    </h2>
                  </div>
                  <div className="relative w-24 h-24">
                    <motion.svg
                      viewBox="0 0 100 100"
                      className="w-full h-full transform -rotate-90"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="8"
                        opacity="0.2"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * healthMetrics.healthScore) / 100 }}
                        transition={{ duration: 1 }}
                        strokeDasharray="283"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-primary)" />
                          <stop offset="100%" stopColor="var(--color-blue)" />
                        </linearGradient>
                      </defs>
                    </motion.svg>
                  </div>
                </div>

                {/* Alerts */}
                {healthMetrics.alerts.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-primary/20">
                    {healthMetrics.alerts.map((alert, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{alert.title}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {quickActions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <ActionCard {...action} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Recent Reports</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/upload')}
                  className="text-primary"
                >
                  View All →
                </Button>
              </div>

              {recentReports.length === 0 ? (
                <EmptyReportsState />
              ) : (
                <div className="space-y-2">
                  {recentReports.map((report, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/results?id=${report.id}`)}
                      className="w-full p-3 rounded-lg border border-primary/20 hover:border-primary/40 bg-background/50 hover:bg-background transition-all text-left"
                    >
                      <p className="font-semibold text-sm">{report.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Insights & Services Shortcuts */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/insights')}
                className="p-4 rounded-xl border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <Sparkles className="w-6 h-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm mb-1">Health Insights</h4>
                <p className="text-xs text-muted-foreground">AI analysis</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/services')}
                className="p-4 rounded-xl border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <Zap className="w-6 h-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm mb-1">Services</h4>
                <p className="text-xs text-muted-foreground">All features</p>
              </motion.button>
            </div>

            {/* Admin Tools Section (Only for Admin/Developer) */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                    Admin & Internal Tools
                  </h3>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-4">
                  {isDeveloper ? 'Developer Mode' : 'Admin Access'} - Testing & Development
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {adminTools.map((tool, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={tool.onClick}
                      className={`p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-100/30 dark:bg-amber-900/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-all`}
                    >
                      <tool.icon className="w-5 h-5 text-amber-700 dark:text-amber-300 mb-1" />
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-tight">
                        {tool.label}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
