import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Activity, ArrowLeft, Plus, Clock, Pill, Bell, Check, Trash2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
}

const MedicationTracker = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: 'Vitamin D3', dose: '2000 IU', time: '08:00 AM', taken: false },
    { id: '2', name: 'Iron Supplement', dose: '65 mg', time: '09:00 AM', taken: true },
    { id: '3', name: 'Metformin', dose: '500 mg', time: '08:00 PM', taken: false },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '08:00' });

  const toggleTaken = (id: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
    toast.success('Medication status updated');
  };

  const addMedication = () => {
    if (!newMed.name.trim()) return;
    setMedications(prev => [...prev, {
      id: Date.now().toString(),
      name: newMed.name,
      dose: newMed.dose,
      time: newMed.time,
      taken: false,
    }]);
    setNewMed({ name: '', dose: '', time: '08:00' });
    setShowAdd(false);
    toast.success('Medication added');
  };

  const removeMed = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    toast.success('Medication removed');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Pill className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Medication Tracker</span>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {/* Today's Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-accent/30 border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Today's Progress</p>
            <p className="text-xs text-muted-foreground">
              {medications.filter(m => m.taken).length} of {medications.length} medications taken
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center">
            <span className="text-sm font-display font-bold text-primary">
              {medications.length > 0 ? Math.round((medications.filter(m => m.taken).length / medications.length) * 100) : 0}%
            </span>
          </div>
        </motion.div>

        {/* Add Form */}
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="bg-card border border-border rounded-xl p-4 space-y-3">
            <input type="text" placeholder="Medicine name" value={newMed.name}
              onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="flex gap-2">
              <input type="text" placeholder="Dose (e.g. 500mg)" value={newMed.dose}
                onChange={e => setNewMed(p => ({ ...p, dose: e.target.value }))}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="time" value={newMed.time}
                onChange={e => setNewMed(p => ({ ...p, time: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button onClick={addMedication} className="w-full gradient-primary text-primary-foreground" size="sm">
              Add Medication
            </Button>
          </motion.div>
        )}

        {/* Medication List */}
        <div className="space-y-2">
          {medications.map((med, i) => (
            <motion.div key={med.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-xl p-4 flex items-center gap-3 ${
                med.taken ? 'border-success/30 opacity-70' : 'border-border'
              }`}>
              <button onClick={() => toggleTaken(med.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  med.taken ? 'border-success bg-success' : 'border-border hover:border-primary'
                }`}>
                {med.taken && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${med.taken ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {med.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{med.dose}</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {med.time}</span>
                </p>
              </div>
              <button onClick={() => removeMed(med.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {medications.length === 0 && (
          <div className="text-center py-12">
            <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No medications added yet</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default MedicationTracker;
