import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pill, Plus, Trash2, Clock, X } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const FREQUENCIES = ['daily', 'twice daily', 'three times daily', 'weekly', 'as needed'];
const TIMES = ['morning', 'afternoon', 'evening', 'bedtime'];

const MedicationRemindersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meds, setMeds] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [times, setTimes] = useState<string[]>(['morning']);
  const [saving, setSaving] = useState(false);

  const fetchMeds = async () => {
    if (!user) return;
    const { data } = await supabase.from('medications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setMeds(data || []);
  };

  useEffect(() => { fetchMeds(); }, [user]);

  const addMed = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('medications').insert({
      user_id: user.id, name: name.trim(), dosage: dosage.trim() || null,
      frequency, time_of_day: times,
    });
    if (error) toast.error('Failed to add medication');
    else { toast.success('Medication added!'); setShowAdd(false); setName(''); setDosage(''); fetchMeds(); }
    setSaving(false);
  };

  const deleteMed = async (id: string) => {
    await supabase.from('medications').delete().eq('id', id);
    toast.success('Medication removed');
    fetchMeds();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('medications').update({ is_active: !current }).eq('id', id);
    fetchMeds();
  };

  const toggleTime = (t: string) => setTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <Pill className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground flex-1">Medication Reminders</span>
          <Button size="sm" className="gradient-primary text-primary-foreground text-xs gap-1" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-3">
        {meds.length === 0 && !showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No medications added yet</p>
            <Button className="mt-4 gradient-primary text-primary-foreground" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Medication
            </Button>
          </motion.div>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">New Medication</span>
                <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></Button>
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Medicine name *"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
              <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Dosage (e.g. 500mg)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Frequency</p>
                <div className="flex flex-wrap gap-1.5">
                  {FREQUENCIES.map(f => (
                    <button key={f} onClick={() => setFrequency(f)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${frequency === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Time of day</p>
                <div className="flex flex-wrap gap-1.5">
                  {TIMES.map(t => (
                    <button key={t} onClick={() => toggleTime(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${times.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={addMed} disabled={!name.trim() || saving} className="w-full gradient-primary text-primary-foreground" size="sm">
                {saving ? 'Adding...' : 'Add Medication'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Medication List */}
        {meds.map((med, i) => (
          <motion.div key={med.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-card border rounded-xl p-4 ${med.is_active ? 'border-border' : 'border-border opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">{med.name}</span>
                  {!med.is_active && <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">paused</span>}
                </div>
                {med.dosage && <p className="text-xs text-muted-foreground mt-1">{med.dosage}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{med.frequency} · {(med.time_of_day as string[])?.join(', ')}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(med.id, med.is_active)}>
                  <span className={`w-3 h-3 rounded-full ${med.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMed(med.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
};

export default MedicationRemindersPage;
