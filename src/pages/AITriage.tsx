import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  ArrowLeft, AlertTriangle, ShieldAlert, Loader2, Plus, X,
  Phone, Clock, Activity, Heart, Thermometer, Stethoscope,
  CheckCircle2, ArrowRight, Zap
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SYMPTOM_PRESETS = [
  'Chest Pain', 'Shortness of Breath', 'Severe Headache', 'High Fever',
  'Dizziness', 'Abdominal Pain', 'Nausea/Vomiting', 'Back Pain',
  'Cough', 'Fatigue', 'Joint Pain', 'Rash', 'Numbness/Tingling',
  'Blurred Vision', 'Palpitations', 'Swelling',
];

const triageBgColor: Record<string, string> = {
  emergency: 'bg-destructive/10 border-destructive/30',
  urgent: 'bg-orange-500/10 border-orange-500/30',
  semi_urgent: 'bg-warning/10 border-warning/30',
  non_urgent: 'bg-success/10 border-success/30',
  self_care: 'bg-info/10 border-info/30',
};

const triageTextColor: Record<string, string> = {
  emergency: 'text-destructive',
  urgent: 'text-orange-600',
  semi_urgent: 'text-warning',
  non_urgent: 'text-success',
  self_care: 'text-info',
};

const triageLabel: Record<string, string> = {
  emergency: '🚨 EMERGENCY',
  urgent: '🟠 URGENT',
  semi_urgent: '🟡 SEMI-URGENT',
  non_urgent: '🟢 NON-URGENT',
  self_care: '🔵 SELF-CARE',
};

interface TriageResult {
  triage_level: string;
  urgency_score: number;
  assessment: string;
  recommended_action: string;
  recommended_specialty: string;
  time_to_care: string;
  red_flags: string[];
  differential_diagnosis: { condition: string; likelihood: string }[];
  home_care_advice: string[];
  when_to_call_911: string;
}

const AITriage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [severity, setSeverity] = useState([5]);
  const [duration, setDuration] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medHistory, setMedHistory] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const addSymptom = (s: string) => {
    if (s.trim() && !symptoms.includes(s.trim())) {
      setSymptoms(prev => [...prev, s.trim()]);
    }
    setSymptomInput('');
  };

  const analyze = async () => {
    if (symptoms.length === 0) { toast.error('Add at least one symptom'); return; }
    setAnalyzing(true);
    setResult(null);

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          symptoms: symptoms.join(', '),
          severity: severity[0],
          duration: duration || undefined,
          age: age || undefined,
          gender: gender || undefined,
          medicalHistory: medHistory || undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Triage failed' }));
        toast.error(err.error || 'Triage failed');
        setAnalyzing(false);
        return;
      }

      const data = await resp.json();
      setResult(data);
    } catch {
      toast.error('Triage failed');
    }
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-foreground">AI Triage</h1>
            <p className="text-xs text-muted-foreground">Urgency assessment & routing</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {!result ? (
          <>
            {/* Emergency banner */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
              <Phone className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">If you're experiencing a life-threatening emergency, call <strong>112</strong> or go to the nearest ER immediately.</p>
            </div>

            {/* Symptoms */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> What are your symptoms?
              </h3>
              <div className="flex gap-2">
                <Input placeholder="Type a symptom..." value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSymptom(symptomInput)} />
                <Button size="icon" variant="outline" onClick={() => addSymptom(symptomInput)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOM_PRESETS.map(s => (
                  <button key={s}
                    onClick={() => addSymptom(s)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                      symptoms.includes(s) ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-primary/20'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {symptoms.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs gap-1">
                      {s} <X className="w-3 h-3 cursor-pointer" onClick={() => setSymptoms(prev => prev.filter(x => x !== s))} />
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Severity */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary" /> Pain/Severity Level
              </h3>
              <Slider value={severity} onValueChange={setSeverity} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 — Mild</span>
                <span className={`font-bold ${severity[0] >= 8 ? 'text-destructive' : severity[0] >= 5 ? 'text-warning' : 'text-success'}`}>
                  {severity[0]}/10
                </span>
                <span>10 — Severe</span>
              </div>
            </motion.div>

            {/* Duration & Patient Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-display font-semibold text-foreground text-sm">Additional Info</h3>
              <Input placeholder="Duration (e.g., 2 days, 3 hours)" value={duration} onChange={e => setDuration(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Age" type="number" value={age} onChange={e => setAge(e.target.value)} />
                <Input placeholder="Gender" value={gender} onChange={e => setGender(e.target.value)} />
              </div>
              <Input placeholder="Medical history (optional)" value={medHistory} onChange={e => setMedHistory(e.target.value)} />
            </motion.div>

            <Button className="w-full gradient-primary text-primary-foreground" onClick={analyze} disabled={analyzing || symptoms.length === 0}>
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> :
                <><Zap className="w-4 h-4 mr-2" /> Run AI Triage</>}
            </Button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Triage level banner */}
              <div className={`border rounded-xl p-5 text-center ${triageBgColor[result.triage_level] || 'bg-muted'}`}>
                <p className={`text-2xl font-display font-bold ${triageTextColor[result.triage_level]}`}>
                  {triageLabel[result.triage_level] || result.triage_level}
                </p>
                <p className="text-sm text-foreground mt-1">Urgency Score: <strong>{result.urgency_score}/10</strong></p>
                <p className="text-sm text-muted-foreground mt-1">{result.time_to_care}</p>
              </div>

              {/* Assessment */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="font-display font-semibold text-foreground text-sm mb-2">Assessment</h4>
                <p className="text-sm text-muted-foreground">{result.assessment}</p>
              </div>

              {/* Recommended Action */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h4 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" /> Recommended Action
                </h4>
                <p className="text-sm text-foreground">{result.recommended_action}</p>
                {result.recommended_specialty && (
                  <p className="text-xs text-primary mt-2">Suggested specialist: <strong>{result.recommended_specialty}</strong></p>
                )}
              </div>

              {/* Red Flags */}
              {result.red_flags && result.red_flags.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-destructive text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Red Flags
                  </h4>
                  <ul className="space-y-1">
                    {result.red_flags.map((f, i) => (
                      <li key={i} className="text-xs text-destructive flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-destructive shrink-0 mt-1.5" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Differential Diagnosis */}
              {result.differential_diagnosis && result.differential_diagnosis.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="font-display font-semibold text-foreground text-sm mb-2">Possible Conditions</h4>
                  <div className="space-y-1.5">
                    {result.differential_diagnosis.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{d.condition}</span>
                        <Badge variant="outline" className={`text-[10px] ${
                          d.likelihood === 'high' ? 'border-destructive/30 text-destructive' :
                          d.likelihood === 'moderate' ? 'border-warning/30 text-warning' :
                          'border-border text-muted-foreground'
                        }`}>{d.likelihood}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Home Care */}
              {result.home_care_advice && result.home_care_advice.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="font-display font-semibold text-foreground text-sm mb-2">Home Care Advice</h4>
                  <ul className="space-y-1.5">
                    {result.home_care_advice.map((a, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* When to call 911 */}
              {result.when_to_call_911 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-destructive text-sm mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> When to Call Emergency Services
                  </h4>
                  <p className="text-xs text-destructive">{result.when_to_call_911}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setSymptoms([]); }}>
                  New Assessment
                </Button>
                {(result.triage_level === 'non_urgent' || result.triage_level === 'semi_urgent') && (
                  <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate('/book-appointment')}>
                    Book Appointment
                  </Button>
                )}
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-xs text-warning flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  This AI triage is for guidance only and does not replace professional medical judgment. If in doubt, seek medical attention.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default AITriage;
