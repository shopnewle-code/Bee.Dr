import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Video, Send, Phone, PhoneOff, Loader2,
  User, Bot, Star, Clock, MessageSquare, Sparkles, FileText
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Message {
  id: string;
  sender_role: 'patient' | 'doctor' | 'ai';
  message: string;
  created_at: string;
}

const TelemedicineConsultation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [rating, setRating] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDoctors(); }, []);

  useEffect(() => {
    if (!session) return;
    // Subscribe to realtime messages
    const channel = supabase
      .channel(`tele-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemedicine_messages', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const msg = payload.new as any;
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').eq('is_available', true).order('rating', { ascending: false });
    if (data) setDoctors(data);
  };

  const startSession = async (doctor: any) => {
    setSelectedDoctor(doctor);
    const { data, error } = await supabase.from('telemedicine_sessions').insert({
      patient_id: user!.id,
      doctor_id: doctor.id,
      status: 'active',
      started_at: new Date().toISOString(),
    }).select().single();

    if (error) { toast.error('Failed to start session'); return; }
    setSession(data);

    // AI welcome message
    const welcomeMsg = {
      id: 'ai-welcome',
      sender_role: 'ai' as const,
      message: `Welcome to your telemedicine consultation with **${doctor.name}** (${doctor.specialization}). I'm the AI assistant here to help facilitate your consultation.\n\nPlease describe your symptoms or concerns, and I'll help prepare a summary for the doctor. The doctor will join shortly.`,
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !session) return;
    setSending(true);
    const messageText = input.trim();
    setInput('');

    // Insert patient message
    await supabase.from('telemedicine_messages').insert({
      session_id: session.id,
      sender_id: user!.id,
      sender_role: 'patient',
      message: messageText,
    });

    // Optimistic add
    const patientMsg: Message = {
      id: `p-${Date.now()}`,
      sender_role: 'patient',
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, patientMsg]);
    setSending(false);

    // Get AI response
    setAiThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('medical-chat', {
        body: {
          message: messageText,
          context: `Telemedicine consultation with ${selectedDoctor.name} (${selectedDoctor.specialization}). Patient messages so far: ${messages.filter(m => m.sender_role === 'patient').map(m => m.message).join('. ')}`,
          language: 'en',
        },
      });

      if (!error && data?.response) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender_role: 'ai',
          message: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch {} 
    setAiThinking(false);
  };

  const endSession = async () => {
    if (!session) return;
    // Generate AI summary
    setAiThinking(true);
    try {
      const patientMessages = messages.filter(m => m.sender_role === 'patient').map(m => m.message).join('\n');
      const { data } = await supabase.functions.invoke('medical-chat', {
        body: {
          message: `Summarize this patient consultation for the doctor's records. Patient described: ${patientMessages}. Provide a structured summary with: Chief Complaint, Symptoms, Assessment, and Recommended Next Steps.`,
          language: 'en',
        },
      });
      if (data?.response) {
        setAiSummary(data.response);
        await supabase.from('telemedicine_sessions').update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          ai_summary: data.response,
        }).eq('id', session.id);
      }
    } catch {}
    setAiThinking(false);
    setSessionEnded(true);
  };

  const submitRating = async () => {
    if (rating > 0 && session) {
      await supabase.from('telemedicine_sessions').update({ patient_rating: rating }).eq('id', session.id);
      toast.success('Thank you for your feedback!');
      navigate('/dashboard');
    }
  };

  // Session ended view
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-display font-bold text-foreground">Consultation Summary</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{selectedDoctor?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedDoctor?.specialization}</p>
              </div>
            </div>
            {aiSummary && (
              <div className="bg-accent/30 rounded-lg p-4">
                <h4 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> AI Summary
                </h4>
                <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-sm text-foreground mb-3">Rate your consultation</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 ${s <= rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
            <Button className="gradient-primary text-primary-foreground" onClick={submitRating} disabled={rating === 0}>
              Submit & Close
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Doctor selection
  if (!session) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-foreground">Telemedicine</h1>
              <p className="text-xs text-muted-foreground">Start a virtual consultation</p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 max-w-lg space-y-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Virtual Consultation</p>
              <p className="text-xs text-muted-foreground">Chat with a doctor online. An AI assistant will help facilitate your consultation and generate a summary.</p>
            </div>
          </div>
          {doctors.map(doc => (
            <motion.button key={doc.id} whileTap={{ scale: 0.98 }}
              onClick={() => startSession(doc)}
              className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-foreground text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.specialization} · ⭐ {doc.rating}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">₹{doc.consultation_fee} · Available Now</p>
                </div>
                <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Online</Badge>
              </div>
            </motion.button>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  // Active chat
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-sm">{selectedDoctor?.name}</p>
              <p className="text-[10px] text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> In Session
              </p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={endSession}>
            <PhoneOff className="w-3 h-3 mr-1" /> End
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender_role === 'patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.sender_role === 'patient'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : msg.sender_role === 'ai'
                ? 'bg-accent/50 border border-border text-foreground rounded-bl-md'
                : 'bg-card border border-border text-foreground rounded-bl-md'
            }`}>
              {msg.sender_role !== 'patient' && (
                <p className="text-[10px] font-medium mb-1 flex items-center gap-1">
                  {msg.sender_role === 'ai' ? <><Sparkles className="w-3 h-3" /> AI Assistant</> : <><User className="w-3 h-3" /> Doctor</>}
                </p>
              )}
              <div className={`text-sm ${msg.sender_role === 'patient' ? '' : 'prose prose-sm max-w-none prose-p:my-1'}`}>
                {msg.sender_role === 'patient' ? msg.message : <ReactMarkdown>{msg.message}</ReactMarkdown>}
              </div>
              <p className={`text-[9px] mt-1 ${msg.sender_role === 'patient' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        {aiThinking && (
          <div className="flex justify-start">
            <div className="bg-accent/50 border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3 shrink-0">
        <div className="flex gap-2">
          <Input placeholder="Describe your symptoms..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={sending} />
          <Button size="icon" className="gradient-primary text-primary-foreground shrink-0"
            onClick={sendMessage} disabled={!input.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineConsultation;
