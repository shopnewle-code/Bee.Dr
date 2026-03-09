import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, GitCompareArrows, Loader2, MessageCircle,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Brain,
  Stethoscope, TestTube, Lightbulb, Calendar
} from 'lucide-react';
import { tryParseStructured, type MedicalJSON } from '@/components/chat/MedicalResponseRenderer';
import BottomNav from '@/components/BottomNav';

interface ChatMessage {
  id: string;
  message: string;
  response: string | null;
  created_at: string;
  conversation_id: string | null;
  is_bookmarked: boolean | null;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

// ─── Comparison helpers ──────────────────────────────────────────

const RISK_ORDER: Record<string, number> = { low: 1, moderate: 2, high: 3, critical: 4 };

function riskDelta(oldLevel: string, newLevel: string): 'improved' | 'declined' | 'same' {
  const o = RISK_ORDER[oldLevel] ?? 2;
  const n = RISK_ORDER[newLevel] ?? 2;
  if (n < o) return 'improved';
  if (n > o) return 'declined';
  return 'same';
}

function conditionsDiff(old: MedicalJSON, curr: MedicalJSON) {
  const oldNames = new Set((old.conditions || []).map(c => c.name.toLowerCase()));
  const newNames = new Set((curr.conditions || []).map(c => c.name.toLowerCase()));
  const resolved = [...oldNames].filter(n => !newNames.has(n));
  const added = [...newNames].filter(n => !oldNames.has(n));
  const persistent = [...oldNames].filter(n => newNames.has(n));
  return { resolved, added, persistent };
}

// ─── Demo data ───────────────────────────────────────────────────

const demoOldResponse: MedicalJSON = {
  type: 'medical',
  summary: 'Your symptoms suggest a moderate respiratory infection with elevated inflammation markers.',
  risk_level: 'moderate',
  risk_reason: 'Persistent cough and mild fever for 5 days',
  symptoms_detected: ['Persistent cough', 'Mild fever', 'Fatigue', 'Body aches'],
  conditions: [
    { name: 'Upper Respiratory Infection', probability: 'high', emoji: '🫁' },
    { name: 'Bronchitis', probability: 'medium', emoji: '🫁' },
    { name: 'Allergic Rhinitis', probability: 'low', emoji: '🤧' },
  ],
  specialist: 'General Physician',
  suggested_tests: ['CBC Blood Test', 'Chest X-ray', 'CRP levels'],
  recommendations: ['Rest and stay hydrated', 'Take prescribed antibiotics', 'Monitor temperature twice daily'],
  detailed_analysis: 'Based on your symptoms of persistent cough, mild fever, and fatigue lasting 5 days, the most likely diagnosis is an upper respiratory tract infection.',
  confidence: 72,
};

const demoNewResponse: MedicalJSON = {
  type: 'medical',
  summary: 'Symptoms have improved significantly. Infection appears to be resolving well with treatment.',
  risk_level: 'low',
  risk_reason: 'Most symptoms resolved, slight residual cough',
  symptoms_detected: ['Mild residual cough'],
  conditions: [
    { name: 'Resolving URI', probability: 'high', emoji: '✅' },
    { name: 'Post-nasal drip', probability: 'low', emoji: '💧' },
  ],
  specialist: null,
  suggested_tests: ['Follow-up CBC if cough persists beyond 2 weeks'],
  recommendations: ['Continue hydration', 'Gradually resume normal activity', 'Honey + warm water for residual cough'],
  detailed_analysis: 'Your follow-up indicates significant improvement. The persistent cough has reduced to a mild residual cough, fever has resolved, and energy levels are returning to normal.',
  confidence: 88,
};

// ─── Component ───────────────────────────────────────────────────

const ChatComparison = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [oldConvId, setOldConvId] = useState<string>('');
  const [newConvId, setNewConvId] = useState<string>('');
  const [oldMsgId, setOldMsgId] = useState<string>('');
  const [newMsgId, setNewMsgId] = useState<string>('');

  const useDemo = conversations.length < 2;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: convs } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id, message, response, created_at, conversation_id, is_bookmarked')
        .eq('user_id', user.id)
        .not('response', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (convs) setConversations(convs);
      if (msgs) setMessages(msgs as ChatMessage[]);

      // Auto-select last two conversations with responses
      if (convs && convs.length >= 2 && msgs && msgs.length >= 2) {
        const uniqueConvIds = [...new Set(msgs.map(m => m.conversation_id).filter(Boolean))] as string[];
        if (uniqueConvIds.length >= 2) {
          setOldConvId(uniqueConvIds[1]);
          setNewConvId(uniqueConvIds[0]);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  // Messages per conversation
  const oldMsgs = useMemo(() => messages.filter(m => m.conversation_id === oldConvId), [messages, oldConvId]);
  const newMsgs = useMemo(() => messages.filter(m => m.conversation_id === newConvId), [messages, newConvId]);

  // Auto-select first message with structured response
  useEffect(() => {
    if (oldMsgs.length && !oldMsgId) {
      const structured = oldMsgs.find(m => m.response && tryParseStructured(m.response));
      setOldMsgId(structured?.id || oldMsgs[0].id);
    }
  }, [oldMsgs]);

  useEffect(() => {
    if (newMsgs.length && !newMsgId) {
      const structured = newMsgs.find(m => m.response && tryParseStructured(m.response));
      setNewMsgId(structured?.id || newMsgs[0].id);
    }
  }, [newMsgs]);

  // Parse responses
  const oldMsg = oldMsgs.find(m => m.id === oldMsgId);
  const newMsg = newMsgs.find(m => m.id === newMsgId);

  const oldParsed: MedicalJSON | null = useDemo ? demoOldResponse : (oldMsg?.response ? tryParseStructured(oldMsg.response) : null);
  const newParsed: MedicalJSON | null = useDemo ? demoNewResponse : (newMsg?.response ? tryParseStructured(newMsg.response) : null);

  const diff = useMemo(() => {
    if (!oldParsed || !newParsed) return null;
    const risk = riskDelta(oldParsed.risk_level, newParsed.risk_level);
    const conditions = conditionsDiff(oldParsed, newParsed);
    const symptomsBefore = oldParsed.symptoms_detected?.length || 0;
    const symptomsAfter = newParsed.symptoms_detected?.length || 0;
    const confidenceDelta = (newParsed.confidence || 0) - (oldParsed.confidence || 0);
    return { risk, conditions, symptomsBefore, symptomsAfter, confidenceDelta };
  }, [oldParsed, newParsed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <GitCompareArrows className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Compare AI Responses</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
        {useDemo && (
          <div className="bg-accent/40 border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground text-center">
              🔬 Showing demo comparison — chat with the AI 2+ times to compare your own responses.
            </p>
          </div>
        )}

        {/* Selectors */}
        {!useDemo && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Older Chat</label>
                <Select value={oldConvId} onValueChange={(v) => { setOldConvId(v); setOldMsgId(''); }}>
                  <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select conversation" /></SelectTrigger>
                  <SelectContent>
                    {conversations.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.title || 'Untitled'} — {new Date(c.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {oldMsgs.length > 1 && (
                  <Select value={oldMsgId} onValueChange={setOldMsgId}>
                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select message" /></SelectTrigger>
                    <SelectContent>
                      {oldMsgs.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.message.slice(0, 40)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Newer Chat</label>
                <Select value={newConvId} onValueChange={(v) => { setNewConvId(v); setNewMsgId(''); }}>
                  <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select conversation" /></SelectTrigger>
                  <SelectContent>
                    {conversations.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.title || 'Untitled'} — {new Date(c.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newMsgs.length > 1 && (
                  <Select value={newMsgId} onValueChange={setNewMsgId}>
                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select message" /></SelectTrigger>
                    <SelectContent>
                      {newMsgs.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.message.slice(0, 40)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Change Summary Cards */}
        {diff && (
          <div className="grid grid-cols-3 gap-2">
            <Card className={`p-3 text-center border ${
              diff.risk === 'improved' ? 'border-success/40 bg-success/5' :
              diff.risk === 'declined' ? 'border-destructive/40 bg-destructive/5' : 'border-border'
            }`}>
              {diff.risk === 'improved' ? <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" /> :
               diff.risk === 'declined' ? <TrendingDown className="w-4 h-4 text-destructive mx-auto mb-1" /> :
               <Minus className="w-4 h-4 text-muted-foreground mx-auto mb-1" />}
              <p className={`text-sm font-bold font-display ${
                diff.risk === 'improved' ? 'text-success' : diff.risk === 'declined' ? 'text-destructive' : 'text-foreground'
              }`}>
                {diff.risk === 'improved' ? 'Improved' : diff.risk === 'declined' ? 'Worsened' : 'Stable'}
              </p>
              <p className="text-[10px] text-muted-foreground">Risk Level</p>
            </Card>
            <Card className="p-3 text-center">
              <AlertTriangle className="w-4 h-4 text-warning mx-auto mb-1" />
              <p className="text-sm font-bold font-display text-foreground">{diff.symptomsBefore} → {diff.symptomsAfter}</p>
              <p className="text-[10px] text-muted-foreground">Symptoms</p>
            </Card>
            <Card className="p-3 text-center">
              <Brain className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className={`text-sm font-bold font-display ${diff.confidenceDelta > 0 ? 'text-success' : diff.confidenceDelta < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {diff.confidenceDelta > 0 ? '+' : ''}{diff.confidenceDelta}%
              </p>
              <p className="text-[10px] text-muted-foreground">Confidence</p>
            </Card>
          </div>
        )}

        {/* Condition Changes */}
        {diff && (diff.conditions.resolved.length > 0 || diff.conditions.added.length > 0) && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Condition Changes</span>
            </div>
            {diff.conditions.resolved.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1">✅ Resolved</p>
                <div className="flex flex-wrap gap-1.5">
                  {diff.conditions.resolved.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-lg text-[11px] font-medium capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {diff.conditions.added.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-1">🆕 New</p>
                <div className="flex flex-wrap gap-1.5">
                  {diff.conditions.added.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded-lg text-[11px] font-medium capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {diff.conditions.persistent.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ongoing</p>
                <div className="flex flex-wrap gap-1.5">
                  {diff.conditions.persistent.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-lg text-[11px] font-medium capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Side-by-Side Response Panels */}
        {oldParsed && newParsed && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" /> Side-by-Side Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Old */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="p-3 space-y-2 h-full">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {useDemo ? 'Mar 1, 2026' : oldMsg ? new Date(oldMsg.created_at).toLocaleDateString() : 'Earlier'}
                    </span>
                  </div>
                  <RiskPill level={oldParsed.risk_level} />
                  <p className="text-xs text-foreground/80 leading-relaxed">{oldParsed.summary}</p>
                  {oldParsed.symptoms_detected && (
                    <div className="flex flex-wrap gap-1">
                      {oldParsed.symptoms_detected.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* New */}
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="p-3 space-y-2 h-full border-primary/20">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">
                      {useDemo ? 'Mar 9, 2026' : newMsg ? new Date(newMsg.created_at).toLocaleDateString() : 'Latest'}
                    </span>
                  </div>
                  <RiskPill level={newParsed.risk_level} />
                  <p className="text-xs text-foreground/80 leading-relaxed">{newParsed.summary}</p>
                  {newParsed.symptoms_detected && (
                    <div className="flex flex-wrap gap-1">
                      {newParsed.symptoms_detected.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {/* Recommendation Diff */}
        {oldParsed && newParsed && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold text-foreground">Recommendation Changes</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Before</p>
                <ul className="space-y-1">
                  {(oldParsed.recommendations || []).map(r => (
                    <li key={r} className="text-[11px] text-foreground/70 flex items-start gap-1">
                      <span className="text-muted-foreground mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">After</p>
                <ul className="space-y-1">
                  {(newParsed.recommendations || []).map(r => (
                    <li key={r} className="text-[11px] text-foreground/70 flex items-start gap-1">
                      <span className="text-success mt-0.5">✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Tests Comparison */}
        {oldParsed && newParsed && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-secondary" />
              <span className="text-xs font-semibold text-foreground">Suggested Tests</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Before</p>
                <ul className="space-y-1">
                  {(oldParsed.suggested_tests || []).map(t => (
                    <li key={t} className="text-[11px] text-foreground/70 flex items-start gap-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">After</p>
                <ul className="space-y-1">
                  {(newParsed.suggested_tests || []).map(t => (
                    <li key={t} className="text-[11px] text-foreground/70 flex items-start gap-1">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {!oldParsed && !newParsed && !useDemo && (
          <div className="text-center py-16 text-muted-foreground">
            <GitCompareArrows className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select two conversations with AI responses to compare them.</p>
            <p className="text-xs mt-1">Structured medical responses work best for comparison.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

function RiskPill({ level }: { level: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    low: { color: 'text-success', bg: 'bg-success/10 border-success/20', label: 'Low Risk' },
    moderate: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', label: 'Moderate' },
    high: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', label: 'High Risk' },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', label: 'Critical' },
  };
  const c = config[level] || config.moderate;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${c.bg} ${c.color}`}>
      <Shield className="w-2.5 h-2.5" /> {c.label}
    </span>
  );
}

export default ChatComparison;
