import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  User, ArrowLeft, Camera, Crown, Shield, HelpCircle,
  ChevronRight, Globe, LogOut, HeartPulse, Stethoscope, CalendarCheck
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', date_of_birth: '', gender: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            display_name: data.display_name || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(form).eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated');
    setEditing(false);
    setProfile(prev => prev ? { ...prev, ...form } : prev);
  };

  const menuItems = [
    { icon: HeartPulse, label: 'Health Profile', path: '/health-profile', desc: 'Blood group, allergies' },
    { icon: Crown, label: 'Subscription', path: '/subscription', desc: 'Free Plan' },
    { icon: Globe, label: 'Language', path: '/language', desc: 'English' },
    { icon: Shield, label: 'Privacy & Security', path: '/settings', desc: 'Data protection' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help', desc: 'FAQs, contact' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-display font-bold text-foreground">Profile</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <h2 className="text-lg font-display font-bold text-foreground">{profile?.display_name || 'User'}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-foreground">Personal Info</span>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary"
              onClick={() => editing ? handleSave() : setEditing(true)}>
              {editing ? 'Save' : 'Edit'}
            </Button>
          </div>
          {[
            { label: 'Name', key: 'display_name' as const, type: 'text' },
            { label: 'Date of Birth', key: 'date_of_birth' as const, type: 'date' },
            { label: 'Gender', key: 'gender' as const, type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-xs text-muted-foreground">{label}</span>
              {editing ? (
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="text-right text-sm text-foreground bg-transparent border-none outline-none w-40 focus:ring-0" />
              ) : (
                <span className="text-sm text-foreground">{form[key] || '—'}</span>
              )}
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-2">
          {menuItems.map(({ icon: Icon, label, path, desc }) => (
            <button key={label} onClick={() => navigate(path)}
              className="w-full bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 text-left hover:border-primary/30 transition-all">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        <Button variant="outline" onClick={async () => { await signOut(); navigate('/'); }}
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/5">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </main>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
