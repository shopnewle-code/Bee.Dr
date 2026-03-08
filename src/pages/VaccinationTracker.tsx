import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Syringe, Plus, CheckCircle2, Clock, X, Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const COMMON_VACCINES = ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'MMR', 'Typhoid', 'HPV', 'Rabies'];

const VaccinationTrackerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dateAdmin, setDateAdmin] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchVaccines = async () => {
    if (!user) return;
    const { data } = await supabase.from('vaccinations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setVaccines(data || []);
  };

  useEffect(() => { fetchVaccines(); }, [user]);

  const addVaccine = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    await supabase.from('vaccinations').insert({
      user_id: user.id, vaccine_name: name.trim(),
      date_administered: dateAdmin || null, next_due_date: nextDue || null,
      is_completed: !!dateAdmin,
    });
    toast.success('Vaccination added!');
    setShowAdd(false); setName(''); setDateAdmin(''); setNextDue('');
    fetchVaccines(); setSaving(false);
  };

  const deleteVac = async (id: string) => {
    await supabase.from('vaccinations').delete().eq('id', id);
    toast.success('Removed'); fetchVaccines();
  };

  const upcoming = vaccines.filter(v => v.next_due_date && !v.is_completed);
  const completed = vaccines.filter(v => v.is_completed);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <Syringe className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground flex-1">Vaccination Tracker</span>
          <Button size="sm" className="gradient-primary text-primary-foreground text-xs gap-1" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Add Vaccination</span>
                <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Quick select</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_VACCINES.map(v => (
                    <button key={v} onClick={() => setName(v)}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-all ${name === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>{v}</button>
                  ))}
                </div>
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Vaccine name *"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date administered</p>
                  <input type="date" value={dateAdmin} onChange={e => setDateAdmin(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next due date</p>
                  <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                </div>
              </div>
              <Button onClick={addVaccine} disabled={!name.trim() || saving} className="w-full gradient-primary text-primary-foreground" size="sm">
                {saving ? 'Adding...' : 'Add Vaccination'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {upcoming.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Upcoming</h3>
            {upcoming.map(v => (
              <div key={v.id} className="bg-card border border-warning/20 rounded-xl p-3 mb-2 flex items-center gap-3">
                <Syringe className="w-4 h-4 text-warning" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{v.vaccine_name}</span>
                  <p className="text-[11px] text-muted-foreground">Due: {new Date(v.next_due_date).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteVac(v.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Completed</h3>
            {completed.map(v => (
              <div key={v.id} className="bg-card border border-border rounded-xl p-3 mb-2 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{v.vaccine_name}</span>
                  {v.date_administered && <p className="text-[11px] text-muted-foreground">{new Date(v.date_administered).toLocaleDateString()}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteVac(v.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {vaccines.length === 0 && !showAdd && (
          <div className="text-center py-12">
            <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No vaccinations tracked yet</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default VaccinationTrackerPage;
