import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Search, Plus, X, Loader2, AlertTriangle, CheckCircle,
  Stethoscope, TestTube, Heart, ShieldAlert, ChevronRight, Sparkles
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { useSimpleLanguage } from '@/hooks/use-simple-language';
import { useLanguage } from '@/hooks/use-language';

const COMMON_SYMPTOMS = [
  'Headache', 'Fatigue', 'Fever', 'Cough', 'Nausea', 'Dizziness',
  'Chest Pain', 'Shortness of Breath', 'Back Pain', 'Joint Pain',
  'Stomach Pain', 'Sore Throat', 'Skin Rash', 'Weight Loss',
  'Muscle Weakness', 'Blurred Vision', 'Frequent Urination', 'Insomnia',
];

interface Condition {
  name: string;
  likelihood: 'high' | 'moderate' | 'low';
  description: string;
  matching_symptoms: string[];
}

interface RecommendedTest {
  test_name: string;
  reason: string;
  priority: 'essential' | 'recommended' | 'optional';
}

interface AnalysisResult {
  urgency: 'low' | 'moderate' | 'high' | 'emergency';
  urgency_message: string;
  possible_conditions: Condition[];
  recommended_tests: RecommendedTest[];
  self_care_tips: string[];
  see_doctor: boolean;
  specialist_type?: string;
}

const SymptomChecker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const { simpleLanguage } = useSimpleLanguage();
  const { language } = useLanguage();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('health_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    ]).then(([hp, p]) => {
      if (hp.data) setHealthProfile(hp.data);
      if (p.data) setProfile(p.data);
    });
  }, [user]);

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim();
    if (!trimmed || symptoms.includes(trimmed)) return;
    if (symptoms.length >= 10) { toast.error('Maximum 10 symptoms'); return; }
    setSymptoms(prev => [...prev, trimmed]);
    setInputValue('');
    setSearchResults([]);
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.length > 1) {
      const filtered = COMMON_SYMPTOMS.filter(s =>
        s.toLowerCase().includes(val.toLowerCase()) && !symptoms.includes(s)
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) { toast.error('Add at least one symptom'); return; }
    setAnalyzing(true);
    setResult(null);

    try {
      const age = profile?.date_of_birth
        ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000)
        : null;

      const { data, error } = await supabase.functions.invoke('symptom-checker', {
        body: {
          symptoms,
          age,
          gender: profile?.gender || null,
          chronicConditions: healthProfile?.chronic_conditions || [],
          allergies: healthProfile?.allergies || [],
          simpleLanguage,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as AnalysisResult);
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const urgencyColors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-600 border-green-500/20',
    moderate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    emergency: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const urgencyIcons: Record<string, any> = {
    low: CheckCircle,
    moderate: AlertTriangle,
    high: ShieldAlert,
    emergency: ShieldAlert,
  };

  const likelihoodColors: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive',
    moderate: 'bg-yellow-500/10 text-yellow-600',
    low: 'bg-muted text-muted-foreground',
  };

  const priorityColors: Record<string, string> = {
    essential: 'bg-destructive/10 text-destructive',
    recommended: 'bg-primary/10 text-primary',
    optional: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Stethoscope className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">AI Symptom Checker</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {!result ? (
          <>
            {/* Symptom Input */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">What symptoms are you experiencing?</h3>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Type a symptom..."
                  value={inputValue}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSymptom(inputValue); }}
                  className="pl-9"
                  maxLength={50}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 shadow-lg z-10 overflow-hidden">
                    {searchResults.map(s => (
                      <button key={s} onClick={() => addSymptom(s)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected symptoms */}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map(s => (
                    <Badge key={s} variant="secondary" className="flex items-center gap-1 pr-1">
                      {s}
                      <button onClick={() => removeSymptom(s)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Common Symptoms */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Common Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.filter(s => !symptoms.includes(s)).map(s => (
                  <button key={s} onClick={() => addSymptom(s)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                    <Plus className="w-3 h-3" /> {s}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Analyze Button */}
            <Button onClick={analyzeSymptoms} disabled={analyzing || symptoms.length === 0} className="w-full">
              {analyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing symptoms...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Analyze Symptoms ({symptoms.length})</>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              ⚠️ This is not a medical diagnosis. Always consult a healthcare professional for accurate medical advice.
            </p>
          </>
        ) : (
          <AnimatePresence>
            {/* Urgency Banner */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-4 border ${urgencyColors[result.urgency]}`}>
              <div className="flex items-center gap-3">
                {(() => { const Icon = urgencyIcons[result.urgency]; return <Icon className="w-6 h-6 shrink-0" />; })()}
                <div>
                  <p className="font-semibold text-sm capitalize">{result.urgency} Urgency</p>
                  <p className="text-xs mt-0.5">{result.urgency_message}</p>
                </div>
              </div>
            </motion.div>

            {/* Possible Conditions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" /> Possible Conditions
              </h3>
              {result.possible_conditions.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">{c.name}</span>
                    <Badge className={`text-[10px] ${likelihoodColors[c.likelihood]}`}>
                      {c.likelihood} likelihood
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {c.matching_symptoms.map(s => (
                      <span key={s} className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-foreground">{s}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Recommended Tests */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TestTube className="w-4 h-4 text-primary" /> Recommended Tests
              </h3>
              {result.recommended_tests.map((t, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t.test_name}</p>
                    <p className="text-xs text-muted-foreground">{t.reason}</p>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${priorityColors[t.priority]}`}>
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </motion.div>

            {/* Self-Care Tips */}
            {result.self_care_tips.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">💡 Self-Care Tips</h3>
                <ul className="space-y-1.5">
                  {result.self_care_tips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* See Doctor CTA */}
            {result.see_doctor && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Doctor Visit Recommended</p>
                    <p className="text-xs text-muted-foreground">
                      {result.specialist_type
                        ? `Consider consulting a ${result.specialist_type}.`
                        : 'Please consult a healthcare professional.'}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/doctors')} className="shrink-0">
                    Find Doctor <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground text-center px-4">
              ⚠️ This AI analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>

            {/* Reset */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setSymptoms([]); }}>
                Check New Symptoms
              </Button>
              <Button className="flex-1" onClick={() => navigate('/chat')}>
                Ask AI Doctor
              </Button>
            </div>
          </AnimatePresence>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default SymptomChecker;
