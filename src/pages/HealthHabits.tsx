import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Droplets, Dumbbell, Apple, Moon, Target, TrendingUp } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const HABITS = [
  { type: 'water', label: 'Water', icon: Droplets, unit: 'glasses', target: 8, color: 'text-info', step: 1 },
  { type: 'exercise', label: 'Exercise', icon: Dumbbell, unit: 'min', target: 30, color: 'text-success', step: 10 },
  { type: 'fruits', label: 'Fruits & Vegs', icon: Apple, unit: 'servings', target: 5, color: 'text-warning', step: 1 },
  { type: 'sleep', label: 'Sleep', icon: Moon, unit: 'hours', target: 8, color: 'text-primary', step: 0.5 },
];

const HealthHabitsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Record<string, number>>({});
  const [weekData, setWeekData] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    // Load today
    supabase.from('health_habits').select('*').eq('user_id', user.id).eq('date', today)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        data?.forEach(h => { map[h.habit_type] = Number(h.value); });
        setHabits(map);
      });
    // Load week
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    supabase.from('health_habits').select('*').eq('user_id', user.id).gte('date', weekAgo).order('date')
      .then(({ data }) => setWeekData(data || []));
  }, [user]);

  const updateHabit = async (type: string, value: number) => {
    if (!user) return;
    setHabits(prev => ({ ...prev, [type]: value }));
    const habit = HABITS.find(h => h.type === type)!;
    await supabase.from('health_habits').upsert({
      user_id: user.id, date: today, habit_type: type, value, unit: habit.unit, target: habit.target,
    }, { onConflict: 'user_id,date,habit_type' });
  };

  const getWeekAvg = (type: string) => {
    const vals = weekData.filter(d => d.habit_type === type).map(d => Number(d.value));
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Health Habits</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {HABITS.map((habit, i) => {
          const Icon = habit.icon;
          const val = habits[habit.type] || 0;
          const pct = Math.min(100, (val / habit.target) * 100);
          const avg = getWeekAvg(habit.type);

          return (
            <motion.div key={habit.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${habit.color}`} />
                  <span className="font-semibold text-foreground text-sm">{habit.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>Avg: {avg} {habit.unit}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${pct >= 100 ? 'bg-success' : 'bg-primary'}`} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateHabit(habit.type, Math.max(0, val - habit.step))}
                    className="w-9 h-9 rounded-lg bg-muted text-foreground text-sm font-bold flex items-center justify-center">-</button>
                  <span className="text-xl font-display font-bold text-foreground min-w-[3rem] text-center">
                    {val}
                  </span>
                  <button onClick={() => updateHabit(habit.type, val + habit.step)}
                    className="w-9 h-9 rounded-lg gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center">+</button>
                </div>
                <span className="text-xs text-muted-foreground">
                  / {habit.target} {habit.unit}
                  {pct >= 100 && ' ✅'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
};

export default HealthHabitsPage;
