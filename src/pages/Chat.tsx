import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Activity, ArrowLeft, Send, Bot, User, Sparkles, AlertCircle,
  Mic, Stethoscope, BookOpen, Pill, HeartPulse, Type
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { useSimpleLanguage } from '@/hooks/use-simple-language';
import { useLanguage } from '@/hooks/use-language';

type Msg = { role: 'user' | 'assistant'; content: string };

type ChatMode = 'general' | 'symptoms' | 'treatment' | 'education' | 'medication';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`;

const MODES: { id: ChatMode; icon: typeof Bot; label: string; description: string; prompts: string[] }[] = [
  {
    id: 'general',
    icon: Bot,
    label: 'AI Doctor',
    description: 'Ask anything about your health',
    prompts: [
      "What does a high cholesterol level mean?",
      "Explain my CBC blood test results",
      "What are normal blood sugar levels?",
      "Do I need to see a doctor for this?",
    ],
  },
  {
    id: 'symptoms',
    icon: Stethoscope,
    label: 'Symptom Checker',
    description: 'Describe symptoms for AI assessment',
    prompts: [
      "I have a headache and fatigue for 3 days",
      "I feel dizzy when I stand up quickly",
      "I have chest tightness after exercise",
      "My joints hurt in the morning",
    ],
  },
  {
    id: 'treatment',
    icon: HeartPulse,
    label: 'Treatment Info',
    description: 'Learn about treatments & when to see a doctor',
    prompts: [
      "What are treatments for iron deficiency?",
      "When should I go to the ER vs urgent care?",
      "How is high blood pressure treated?",
      "What happens in a thyroid function test?",
    ],
  },
  {
    id: 'medication',
    icon: Pill,
    label: 'Medicine Guide',
    description: 'Understand medications, dosages & interactions',
    prompts: [
      "What is metformin used for?",
      "Can I take ibuprofen with blood thinners?",
      "What are side effects of statins?",
      "How should I take antibiotics correctly?",
    ],
  },
  {
    id: 'education',
    icon: BookOpen,
    label: 'Health Learn',
    description: 'Interactive learning about conditions',
    prompts: [
      "Explain diabetes in simple terms",
      "What is the immune system and how does it work?",
      "Teach me about heart health basics",
      "What happens during a kidney function test?",
    ],
  },
];

const MODE_CONTEXT: Record<ChatMode, string> = {
  general: '',
  symptoms: '[MODE: SYMPTOM CHECKER] The user wants help understanding their symptoms. Ask diagnostic follow-up questions one at a time: duration, severity (1-10), location, triggers, associated symptoms. After gathering 3-4 details, provide a preliminary assessment with possible conditions ranked by likelihood and urgency level (urgent/soon/routine). Always recommend professional consultation.\n\n',
  treatment: '[MODE: TREATMENT GUIDE] Focus on explaining treatment options, medical procedures, and when to seek medical attention. Include what to expect during visits, preparation steps, and recovery information. Clearly distinguish between emergency (call 911), urgent care, and routine doctor visits.\n\n',
  medication: '[MODE: MEDICATION EXPERT] Focus on explaining medications in detail: purpose, mechanism of action, proper dosage timing, common side effects, serious side effects to watch for, food/drug interactions. Always include a reminder to follow prescriber instructions.\n\n',
  education: '[MODE: HEALTH EDUCATION] Explain medical concepts like a friendly teacher. Use analogies, bullet points, and simple language. Break complex topics into digestible sections. Include practical takeaways the user can apply. Use the format: What is it → Why it matters → What you can do.\n\n',
};

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('general');
  const { simpleLanguage, toggleSimpleLanguage } = useSimpleLanguage();
  const { language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = MODES.find(m => m.id === mode)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const contextPrefix = MODE_CONTEXT[mode];
    const userMsg: Msg = { role: 'user', content: messageText };
    const apiMsg: Msg = { role: 'user', content: messages.length === 0 ? contextPrefix + messageText : messageText };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, apiMsg], simpleLanguage, language }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get response');
      }
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to send message');
      if (!assistantSoFar) setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const switchMode = (newMode: ChatMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setMessages([]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            {(() => { const Icon = currentMode.icon; return <Icon className="w-4 h-4 text-primary-foreground" />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-display font-bold text-foreground">{currentMode.label}</span>
            <p className="text-xs text-muted-foreground truncate">{currentMode.description}</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate('/voice-doctor')}>
            <Mic className="w-3 h-3" /> Voice
          </Button>
          <Button variant={simpleLanguage ? "default" : "outline"} size="sm"
            className={`text-xs gap-1.5 ${simpleLanguage ? 'gradient-primary text-primary-foreground' : ''}`}
            onClick={toggleSimpleLanguage} title={simpleLanguage ? 'Simple Language ON' : 'Simple Language OFF'}>
            <Type className="w-3 h-3" /> {simpleLanguage ? 'Simple' : 'Aₐ'}
          </Button>
        </div>
      </header>

      {/* Mode Selector */}
      <div className="border-b border-border bg-card/50 px-4 py-2 shrink-0 overflow-x-auto">
        <div className="flex gap-1.5 max-w-2xl mx-auto">
          {MODES.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => switchMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  mode === m.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                <Icon className="w-3 h-3" />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
                {(() => { const Icon = currentMode.icon; return <Icon className="w-7 h-7 text-primary-foreground" />; })()}
              </div>
              <h2 className="text-lg font-display font-bold text-foreground mb-1">{currentMode.label}</h2>
              <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">{currentMode.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {currentMode.prompts.map((prompt) => (
                  <button key={prompt} onClick={() => sendMessage(prompt)}
                    className="text-left text-sm p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-foreground">
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                <span>For informational purposes only — always consult your doctor</span>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-emerald max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'symptoms' ? 'Describe your symptoms...' : 'Ask about your health...'}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
            size="icon" className="gradient-primary text-primary-foreground rounded-xl h-11 w-11 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
