import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Ruler, Weight, Droplets, AlertTriangle, Plus, X, Save, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const HealthProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [bloodGroup, setBloodGroup] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('health_profiles').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setBloodGroup(data.blood_group || '');
          setHeightCm(data.height_cm?.toString() || '');
          setWeightKg(data.weight_kg?.toString() || '');
          setAllergies(data.allergies || []);
          setConditions(data.chronic_conditions || []);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      blood_group: bloodGroup || null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      allergies,
      chronic_conditions: conditions,
    };

    const { error } = profileId
      ? await supabase.from('health_profiles').update(payload).eq('id', profileId)
      : await supabase.from('health_profiles').insert(payload).select().single().then(res => {
          if (res.data) setProfileId(res.data.id);
          return res;
        });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Health profile saved');
  };

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
    setInput('');
  };

  const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const bmi = heightCm && weightKg
    ? (parseFloat(weightKg) / Math.pow(parseFloat(heightCm) / 100, 2)).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Health Profile</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {/* Blood Group */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-primary" />
            <Label className="text-sm font-semibold text-foreground">Blood Group</Label>
          </div>
          <Select value={bloodGroup} onValueChange={setBloodGroup}>
            <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Height & Weight */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Height (cm)</Label>
              </div>
              <Input type="number" placeholder="170" value={heightCm}
                onChange={e => setHeightCm(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Weight (kg)</Label>
              </div>
              <Input type="number" placeholder="70" value={weightKg}
                onChange={e => setWeightKg(e.target.value)} />
            </div>
          </div>
          {bmi && (
            <div className="bg-accent/50 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground">BMI</span>
              <p className="text-lg font-bold text-foreground">{bmi}</p>
              <span className="text-xs text-muted-foreground">
                {parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Allergies */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <Label className="text-sm font-semibold text-foreground">Allergies</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergies.map((a, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {a}
                <button onClick={() => removeItem(allergies, setAllergies, i)}
                  className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="e.g. Penicillin" value={newAllergy}
              onChange={e => setNewAllergy(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(allergies, setAllergies, newAllergy, setNewAllergy)} />
            <Button size="icon" variant="outline"
              onClick={() => addItem(allergies, setAllergies, newAllergy, setNewAllergy)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Chronic Conditions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-primary" />
            <Label className="text-sm font-semibold text-foreground">Chronic Conditions</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {conditions.map((c, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {c}
                <button onClick={() => removeItem(conditions, setConditions, i)}
                  className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="e.g. Diabetes" value={newCondition}
              onChange={e => setNewCondition(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(conditions, setConditions, newCondition, setNewCondition)} />
            <Button size="icon" variant="outline"
              onClick={() => addItem(conditions, setConditions, newCondition, setNewCondition)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Health Profile
        </Button>
      </main>
      <BottomNav />
    </div>
  );
};

export default HealthProfilePage;
