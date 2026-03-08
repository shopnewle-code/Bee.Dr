import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity, Upload, FileText, LogOut, Plus, Clock, Bot, User, History } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Tables<'scan_results'>[]>([]);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [scansRes, profileRes] = await Promise.all([
        supabase.from('scan_results').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      ]);
      if (scansRes.data) setScans(scansRes.data);
      if (profileRes.data) setProfile(profileRes.data);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">Bee.dr</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} title="Profile">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">Hi, {displayName} 👋</h1>
          <p className="text-muted-foreground mb-8">Your health intelligence hub</p>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Plus, label: 'Upload Report', path: '/upload', gradient: true },
              { icon: Bot, label: 'AI Doctor', path: '/chat', gradient: false },
              { icon: History, label: 'History', path: '/history', gradient: false },
              { icon: User, label: 'Profile', path: '/profile', gradient: false },
            ].map(({ icon: Icon, label, path, gradient }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(path)}
                className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all border ${
                  gradient
                    ? 'gradient-primary text-primary-foreground border-transparent shadow-glow'
                    : 'bg-card border-border hover:border-primary/30 hover:shadow-md text-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </motion.button>
            ))}
          </div>

          {/* AI Doctor promo */}
          <motion.div
            whileHover={{ scale: 1.005 }}
            onClick={() => navigate('/chat')}
            className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 mb-8 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-foreground">AI Doctor Chat</h3>
              <p className="text-sm text-muted-foreground">Ask questions about your health, lab results, or medications</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">New</span>
          </motion.div>

          {/* Recent scans */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-foreground">Recent Scans</h2>
            {scans.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="text-primary">
                View All
              </Button>
            )}
          </div>
          {scans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No scans yet. Upload your first report to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan, i) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => scan.status === 'complete' ? navigate(`/results/${scan.id}`) : null}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{scan.file_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    scan.status === 'complete' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {scan.status === 'complete' ? 'Complete' : 'Processing'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
