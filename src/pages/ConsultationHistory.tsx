import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, MessageCircle, Phone, Calendar, Clock, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { format } from 'date-fns';

const ConsultationHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('consultations').select('*, doctors(*)').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setConsultations(data || []); setLoading(false); });
  }, [user]);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    confirmed: 'bg-green-500/10 text-green-600',
    completed: 'bg-primary/10 text-primary',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const typeIcons: Record<string, any> = { video: Video, chat: MessageCircle, audio: Phone };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-display font-bold text-foreground">My Consultations</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground text-sm">No consultations yet</p>
            <Button onClick={() => navigate('/doctors')}>Find a Doctor</Button>
          </div>
        ) : (
          consultations.map((c, i) => {
            const Icon = typeIcons[c.consultation_type] || Video;
            const doc = c.doctors;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{doc?.name || 'Doctor'}</h3>
                      <p className="text-xs text-muted-foreground">{doc?.specialization}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${statusColors[c.status] || ''}`}>{c.status}</Badge>
                </div>
                {c.appointment_time && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(c.appointment_time), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(c.appointment_time), 'h:mm a')}</span>
                  </div>
                )}
                {c.notes && <p className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">{c.notes}</p>}
              </motion.div>
            );
          })
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default ConsultationHistory;
