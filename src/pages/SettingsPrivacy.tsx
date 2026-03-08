import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Shield, Lock, Download, Trash2, Eye, ToggleLeft, ChevronRight
} from 'lucide-react';

const settings = [
  { icon: Lock, title: 'Data Encryption', desc: 'All data encrypted with AES-256', toggle: true, enabled: true },
  { icon: Eye, title: 'Biometric Lock', desc: 'Require fingerprint to open app', toggle: true, enabled: false },
  { icon: Shield, title: 'Two-Factor Auth', desc: 'Add extra security to your account', toggle: true, enabled: false },
];

const actions = [
  { icon: Download, title: 'Download My Data', desc: 'Export all reports and health data', destructive: false },
  { icon: Trash2, title: 'Delete All History', desc: 'Permanently remove all scan history', destructive: true },
  { icon: Trash2, title: 'Delete Account', desc: 'Remove account and all associated data', destructive: true },
];

const SettingsPrivacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Privacy & Security</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Security Settings */}
        <div>
          <h2 className="text-sm font-display font-semibold text-foreground mb-3">Security</h2>
          <div className="space-y-2">
            {settings.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                    s.enabled ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
                      s.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Data Actions */}
        <div>
          <h2 className="text-sm font-display font-semibold text-foreground mb-3">Data Management</h2>
          <div className="space-y-2">
            {actions.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.button key={a.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.15 }}
                  className={`w-full text-left bg-card border rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-sm ${
                    a.destructive ? 'border-destructive/20 hover:border-destructive/40' : 'border-border hover:border-primary/30'
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    a.destructive ? 'bg-destructive/10' : 'bg-accent'
                  }`}>
                    <Icon className={`w-4 h-4 ${a.destructive ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${a.destructive ? 'text-destructive' : 'text-foreground'}`}>{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Privacy Info */}
        <div className="bg-accent/30 border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            🔒 <strong>Your data is secure.</strong> All medical reports are encrypted end-to-end. 
            We never share your health data with third parties. Bee.dr is designed to be HIPAA-compliant. 
            You own your data and can delete it at any time.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPrivacy;
