import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Camera, Search, Pill, AlertTriangle, Shield,
  ChevronDown, ChevronUp, Loader2, Send, Bot, User,
  Heart, Zap, Clock, Globe, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

type MedicineData = {
  name: string;
  genericName?: string;
  category?: string;
  uses?: string[];
  dosage?: { adult?: string; child?: string; frequency?: string; timing?: string };
  sideEffects?: { common?: string[]; serious?: string[]; rare?: string[] };
  warnings?: string[];
  interactions?: { drug: string; severity: string; description: string }[];
  contraindications?: string[];
  storage?: string;
  price_range?: string;
  alternatives?: { name: string; genericName?: string; priceComparison?: string }[];
  suggestedQuestions?: string[];
};

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const MedicineScanner = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [medicineName, setMedicineName] = useState('');
  const [loading, setLoading] = useState(false);
  const [medicine, setMedicine] = useState<MedicineData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('uses');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const analyzeMedicine = async () => {
    if (!medicineName.trim()) { toast.error('Enter a medicine name'); return; }
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-medicine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ medicineName: medicineName.trim(), language }),
        }
      );
      if (!resp.ok) throw new Error('Failed to analyze');
      const data = await resp.json();
      setMedicine(data);
      setStep('result');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async (msg?: string) => {
    const text = msg || chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg: ChatMsg = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              ...chatMessages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: text },
            ],
            context: `Medicine context: ${JSON.stringify(medicine)}`,
          }),
        }
      );
      if (!resp.ok) throw new Error('Chat failed');
      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content || data.response || 'No response';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not respond. Please try again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const toggleSection = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  const severityColor = (s: string) =>
    s === 'high' ? 'text-destructive bg-destructive/10' :
    s === 'medium' ? 'text-warning bg-warning/10' : 'text-success bg-success/10';

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Pill className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Medicine Scanner</span>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Pill className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Medicine Scanner</h1>
              <p className="text-sm text-muted-foreground">Enter a medicine name to get complete information — uses, dosage, side effects, interactions & alternatives.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Medicine Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Paracetamol, Metformin, Amoxicillin..."
                    value={medicineName}
                    onChange={e => setMedicineName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && analyzeMedicine()}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div className="flex bg-muted rounded-lg p-0.5">
                  {(['en', 'hi'] as const).map(l => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${language === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                      {l === 'en' ? 'English' : 'हिन्दी'}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={analyzeMedicine} disabled={loading || !medicineName.trim()} className="w-full gradient-primary text-primary-foreground">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</> : <><Search className="w-4 h-4 mr-2" /> Analyze Medicine</>}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['Paracetamol', 'Metformin', 'Amoxicillin', 'Omeprazole', 'Cetirizine', 'Aspirin'].map(name => (
                <button key={name} onClick={() => { setMedicineName(name); }}
                  className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/30 transition-all">
                  <Pill className="w-4 h-4 text-primary mx-auto mb-1" />
                  <span className="text-xs font-medium text-foreground">{name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep('input'); setMedicine(null); setChatMessages([]); setShowChat(false); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Pill className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground flex-1 truncate">{medicine?.name || 'Medicine Info'}</span>
          <Button variant={showChat ? 'default' : 'outline'} size="sm" onClick={() => setShowChat(!showChat)} className="text-xs">
            <MessageCircle className="w-3.5 h-3.5 mr-1" /> Ask AI
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <AnimatePresence mode="wait">
          {showChat ? (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Ask anything about <strong>{medicine?.name}</strong></p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {(medicine?.suggestedQuestions || ['Can I take this with food?', 'What if I miss a dose?']).slice(0, 4).map((q, i) => (
                        <button key={i} onClick={() => sendChatMessage(q)}
                          className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full hover:bg-accent/80 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && <Bot className="w-5 h-5 text-primary shrink-0 mt-1" />}
                    <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>{msg.content}</div>
                    {msg.role === 'user' && <User className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <Bot className="w-5 h-5 text-primary shrink-0" />
                    <div className="bg-muted rounded-xl px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about this medicine..." className="flex-1" />
                <Button size="icon" onClick={() => sendChatMessage()} disabled={chatLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {/* Header Card */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <Pill className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-display font-bold text-foreground">{medicine?.name}</h1>
                    {medicine?.genericName && <p className="text-sm text-muted-foreground">{medicine.genericName}</p>}
                    {medicine?.category && (
                      <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{medicine.category}</span>
                    )}
                  </div>
                </div>
                {medicine?.price_range && (
                  <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">💰 Price Range: <strong className="text-foreground">{medicine.price_range}</strong></p>
                )}
              </div>

              {/* Uses */}
              {medicine?.uses && medicine.uses.length > 0 && (
                <Section title="What it's used for" icon={<Heart className="w-4 h-4 text-primary" />} expanded={expandedSection === 'uses'} onToggle={() => toggleSection('uses')}>
                  <ul className="space-y-1.5">
                    {medicine.uses.map((u, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />{u}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Dosage */}
              {medicine?.dosage && (
                <Section title="Dosage Instructions" icon={<Clock className="w-4 h-4 text-primary" />} expanded={expandedSection === 'dosage'} onToggle={() => toggleSection('dosage')}>
                  <div className="space-y-2 text-sm">
                    {medicine.dosage.adult && <p><strong className="text-foreground">Adult:</strong> <span className="text-muted-foreground">{medicine.dosage.adult}</span></p>}
                    {medicine.dosage.child && <p><strong className="text-foreground">Child:</strong> <span className="text-muted-foreground">{medicine.dosage.child}</span></p>}
                    {medicine.dosage.frequency && <p><strong className="text-foreground">Frequency:</strong> <span className="text-muted-foreground">{medicine.dosage.frequency}</span></p>}
                    {medicine.dosage.timing && <p><strong className="text-foreground">Timing:</strong> <span className="text-muted-foreground">{medicine.dosage.timing}</span></p>}
                  </div>
                </Section>
              )}

              {/* Side Effects */}
              {medicine?.sideEffects && (
                <Section title="Side Effects" icon={<Zap className="w-4 h-4 text-warning" />} expanded={expandedSection === 'sideEffects'} onToggle={() => toggleSection('sideEffects')}>
                  <div className="space-y-3">
                    {medicine.sideEffects.common && medicine.sideEffects.common.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Common</p>
                        <div className="flex flex-wrap gap-1.5">
                          {medicine.sideEffects.common.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {medicine.sideEffects.serious && medicine.sideEffects.serious.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Serious</p>
                        <div className="flex flex-wrap gap-1.5">
                          {medicine.sideEffects.serious.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Warnings */}
              {medicine?.warnings && medicine.warnings.length > 0 && (
                <Section title="Warnings" icon={<AlertTriangle className="w-4 h-4 text-destructive" />} expanded={expandedSection === 'warnings'} onToggle={() => toggleSection('warnings')}>
                  <ul className="space-y-1.5">
                    {medicine.warnings.map((w, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />{w}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Drug Interactions */}
              {medicine?.interactions && medicine.interactions.length > 0 && (
                <Section title="Drug Interactions" icon={<Shield className="w-4 h-4 text-destructive" />} expanded={expandedSection === 'interactions'} onToggle={() => toggleSection('interactions')}>
                  <div className="space-y-2">
                    {medicine.interactions.map((int, i) => (
                      <div key={i} className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{int.drug}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${severityColor(int.severity)}`}>{int.severity}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{int.description}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Alternatives */}
              {medicine?.alternatives && medicine.alternatives.length > 0 && (
                <Section title="Alternatives" icon={<Pill className="w-4 h-4 text-primary" />} expanded={expandedSection === 'alternatives'} onToggle={() => toggleSection('alternatives')}>
                  <div className="space-y-2">
                    {medicine.alternatives.map((alt, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <div>
                          <span className="text-sm font-medium text-foreground">{alt.name}</span>
                          {alt.genericName && <p className="text-xs text-muted-foreground">{alt.genericName}</p>}
                        </div>
                        {alt.priceComparison && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            alt.priceComparison === 'cheaper' ? 'bg-success/10 text-success' :
                            alt.priceComparison === 'expensive' ? 'bg-destructive/10 text-destructive' :
                            'bg-muted-foreground/10 text-muted-foreground'
                          }`}>{alt.priceComparison}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Disclaimer */}
              <div className="bg-accent/30 border border-border rounded-xl p-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ⚕️ <strong>Disclaimer:</strong> This information is AI-generated for educational purposes only. Always consult your doctor or pharmacist before taking any medicine.
                </p>
              </div>

              <Button variant="outline" className="w-full" onClick={() => { setStep('input'); setMedicine(null); }}>
                Scan Another Medicine
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const Section = ({ title, icon, expanded, onToggle, children }: {
  title: string; icon: React.ReactNode; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors">
      {icon}
      <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="border-t border-border">
          <div className="p-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default MedicineScanner;
