import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, SmilePlus, Moon, Zap, Brain, Droplets, Dumbbell, Save, CheckCircle2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const SYMPTOMS = ['Headache', 'Fatigue', 'Nausea', 'Cough', 'Body ache', 'Fever', 'Dizziness', 'Anxiety'];

const DailyCheckinPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleepHours, setSleepHours] = useState('7');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(2);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMood(data.mood || 3);
          setEnergy(data.energy || 3);
          setSleepHours(String(data.sleep_hours || 7));
          setSleepQuality(data.sleep_quality || 3);
          setStressLevel(data.stress_level || 2);
          setSelectedSymptoms((data.symptoms as string[]) || []);
          setWaterGlasses(data.water_glasses || 0);
          setExerciseMinutes(data.exercise_minutes || 0);
          setNotes(data.notes || '');
          setSaved(true);
        }
      });
  }, [user]);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const saveCheckin = async () => {
    if (!user) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      user_id: user.id, date: today, mood, energy, sleep_hours: parseFloat(sleepHours),
      sleep_quality: sleepQuality, stress_level: stressLevel, symptoms: selectedSymptoms,
      water_glasses: waterGlasses, exercise_minutes: exerciseMinutes, notes: notes || null,
    };
    const { error } = await supabase.from('daily_checkins').upsert(payload, { onConflict: 'user_id,date' });
    if (error) toast.error('Failed to save check-in');
    else { toast.success('Daily check-in saved!'); setSaved(true); }
    setSaving(false);
  };

  const RatingRow = ({ label, icon: Icon, value, onChange, max = 5 }: any) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => (
          <button key={i} onClick={() => onChange(i + 1)}
            className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
              i + 1 <= value ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>{i + 1}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <SmilePlus className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Daily Health Check-in</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Mood */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <SmilePlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">How are you feeling?</span>
            </div>
            <div className="flex gap-3 justify-center">
              {MOODS.map((emoji, i) => (
                <button key={i} onClick={() => setMood(i + 1)}
                  className={`text-2xl p-2 rounded-xl transition-all ${mood === i + 1 ? 'bg-primary/10 scale-110 ring-2 ring-primary' : 'hover:scale-105'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <RatingRow label="Energy Level" icon={Zap} value={energy} onChange={setEnergy} />

          {/* Sleep */}
          <div className="bg-card border border-border rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Sleep</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <input type="number" value={sleepHours} onChange={e => setSleepHours(e.target.value)}
                className="w-16 text-center rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground" min="0" max="24" step="0.5" />
              <span className="text-xs text-muted-foreground">hours</span>
            </div>
            <RatingRow label="Sleep Quality" icon={Moon} value={sleepQuality} onChange={setSleepQuality} />
          </div>

          <div className="mt-4">
            <RatingRow label="Stress Level" icon={Brain} value={stressLevel} onChange={setStressLevel} />
          </div>

          {/* Water & Exercise */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Droplets className="w-5 h-5 text-info mx-auto mb-1" />
              <p className="text-xs text-muted-foreground mb-2">Water (glasses)</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="w-8 h-8 rounded-lg bg-muted text-foreground text-sm font-bold">-</button>
                <span className="text-lg font-bold text-foreground w-8 text-center">{waterGlasses}</span>
                <button onClick={() => setWaterGlasses(waterGlasses + 1)}
                  className="w-8 h-8 rounded-lg gradient-primary text-primary-foreground text-sm font-bold">+</button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Dumbbell className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-xs text-muted-foreground mb-2">Exercise (min)</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setExerciseMinutes(Math.max(0, exerciseMinutes - 10))}
                  className="w-8 h-8 rounded-lg bg-muted text-foreground text-sm font-bold">-</button>
                <span className="text-lg font-bold text-foreground w-8 text-center">{exerciseMinutes}</span>
                <button onClick={() => setExerciseMinutes(exerciseMinutes + 10)}
                  className="w-8 h-8 rounded-lg gradient-primary text-primary-foreground text-sm font-bold">+</button>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-card border border-border rounded-xl p-4 mt-4">
            <p className="text-sm font-medium text-foreground mb-3">Any symptoms today?</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedSymptoms.includes(s) ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..."
              rows={2} className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <Button onClick={saveCheckin} disabled={saving} className="w-full mt-4 gradient-primary text-primary-foreground" size="lg">
            {saving ? 'Saving...' : saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Update Check-in</> : <><Save className="w-4 h-4 mr-2" /> Save Check-in</>}
          </Button>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default DailyCheckinPage;
