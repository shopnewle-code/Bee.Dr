import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Loader2, AlertTriangle, ClipboardList, Plus, X,
  Heart, RefreshCw, Sparkles, User, Activity
} from 'lucide-react';
import { useSimpleLanguage } from '@/hooks/use-simple-language';
import { useLanguage } from '@/hooks/use-language';
import BottomNav from '@/components/BottomNav';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const COMMON_CONDITIONS = [
  'Type 2 Diabetes', 'Hypertension', 'High Cholesterol', 'Anemia',
  'Thyroid Disorder', 'Vitamin D Deficiency', 'PCOS', 'Asthma',
  'Migraine', 'Arthritis', 'Fatty Liver', 'Kidney Stones',
  'Anxiety', 'Depression', 'GERD', 'UTI',
];

const TreatmentPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [existingConditions, setExistingConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState('');
  const { simpleLanguage } = useSimpleLanguage();

  const addSymptom = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms(prev => [...prev, trimmed]);
    }
    setSymptomInput('');
  };

  const generate = async () => {
    if (!diagnosis.trim() && symptoms.length === 0) {
      toast.error('Enter a diagnosis or symptoms');
      return;
    }
    setGenerating(true);
    setPlan('');

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/treatment-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          diagnosis: diagnosis.trim() || undefined,
          symptoms: symptoms.length > 0 ? symptoms.join(', ') : undefined,
          healthProfile: {
            age: age || undefined,
            gender: gender || undefined,
            existing_conditions: existingConditions || undefined,
            current_medications: medications || undefined,
          },
          simpleLanguage,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed' }));
        toast.error(err.error || 'Generation failed');
        setGenerating(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setPlan(fullText);
            }
          } catch {}
        }
      }
    } catch {
      toast.error('Generation failed');
    }
    setGenerating(false);
  };

  const reset = () => {
    setDiagnosis('');
    setSymptoms([]);
    setAge('');
    setGender('');
    setExistingConditions('');
    setMedications('');
    setPlan('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-foreground">Treatment Plan</h1>
            <p className="text-xs text-muted-foreground">AI-powered personalized care plan</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {!plan ? (
          <>
            {/* Diagnosis */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> Diagnosis / Condition
              </h3>
              <Input placeholder="e.g., Type 2 Diabetes, Hypertension..."
                value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CONDITIONS.map(c => (
                  <button key={c}
                    onClick={() => setDiagnosis(c)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                      diagnosis === c ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-primary/20'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Symptoms */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Symptoms
              </h3>
              <div className="flex gap-2">
                <Input placeholder="Add symptom..." value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSymptom(symptomInput)} />
                <Button size="icon" variant="outline" onClick={() => addSymptom(symptomInput)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {symptoms.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs gap-1">
                      {s}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSymptoms(prev => prev.filter(x => x !== s))} />
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Patient info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Patient Info (Optional)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Age" type="number" value={age} onChange={e => setAge(e.target.value)} />
                <Input placeholder="Gender" value={gender} onChange={e => setGender(e.target.value)} />
              </div>
              <Textarea placeholder="Existing conditions (e.g., diabetes, hypertension...)" rows={2}
                value={existingConditions} onChange={e => setExistingConditions(e.target.value)} />
              <Textarea placeholder="Current medications (e.g., Metformin 500mg, Losartan 50mg...)" rows={2}
                value={medications} onChange={e => setMedications(e.target.value)} />
            </motion.div>

            {/* Generate */}
            <Button className="w-full gradient-primary text-primary-foreground" onClick={generate} disabled={generating}>
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Plan...</> :
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Treatment Plan</>}
            </Button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" /> Your Treatment Plan
              </h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="w-3 h-3 mr-1" /> New Plan
              </Button>
            </div>
            {diagnosis && (
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">{diagnosis}</Badge>
            )}
            <div className="prose prose-sm max-w-none text-foreground
              prose-headings:text-foreground prose-headings:font-display
              prose-strong:text-foreground prose-li:text-muted-foreground
              prose-p:text-muted-foreground">
              <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
            <div className="mt-4 bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-xs text-warning flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                This AI-generated treatment plan is for informational purposes only. Always consult your healthcare provider before making changes to your treatment.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default TreatmentPlan;
