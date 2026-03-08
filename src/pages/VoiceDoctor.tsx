import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Mic, MicOff, Volume2, VolumeX, Bot, User,
  Loader2, Sparkles, AlertCircle, Square
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useScribe, CommitStrategy } from '@elevenlabs/react';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

const VoiceDoctorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: 'vad',
    onPartialTranscript: (data) => {
      setCurrentTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        setCurrentTranscript('');
        sendMessage(data.text.trim());
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-stt-token');
      if (error || !data?.token) {
        toast.error('Failed to start voice recognition');
        return;
      }
      await scribe.connect({
        token: data.token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
      setIsListening(true);
    } catch (e: any) {
      toast.error(e.message || 'Microphone access required');
    }
  }, [scribe]);

  const stopListening = useCallback(() => {
    scribe.disconnect();
    setIsListening(false);
    setCurrentTranscript('');
  }, [scribe]);

  const speakText = async (text: string) => {
    if (!ttsEnabled) return;
    // Strip markdown for cleaner speech
    const cleanText = text.replace(/[#*_`\[\]()>]/g, '').replace(/\n+/g, '. ').slice(0, 1000);
    try {
      setIsSpeaking(true);
      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });
      if (!response.ok) throw new Error('TTS failed');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const sendMessage = async (text: string) => {
    if (!text || isProcessing) return;
    const userMsg: Msg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

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
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) throw new Error('Failed to get response');
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

      // Speak the response
      if (assistantSoFar) {
        speakText(assistantSoFar);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to get response');
      if (!assistantSoFar) setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Mic className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-display font-bold text-foreground">Voice AI Doctor</span>
            <p className="text-xs text-muted-foreground">Speak naturally, get medical insights</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTtsEnabled(!ttsEnabled)}>
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Voice Medical Assistant</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Tap the microphone and ask any health question. Bee.dr will listen, understand, and respond with voice.
            </p>
            <div className="grid gap-2 max-w-xs mx-auto text-left">
              {[
                "What does low hemoglobin mean?",
                "Explain my vitamin D levels",
                "What foods help cholesterol?",
              ].map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-foreground">
                  🎙️ "{q}"
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>For informational purposes only</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-emerald max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm flex items-center gap-2">
                      <Mic className="w-3 h-3 shrink-0" />
                      {msg.content}
                    </p>
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

          {isProcessing && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
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

          {/* Live transcript */}
          {currentTranscript && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground italic py-2">
              🎙️ "{currentTranscript}"
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Voice Control Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center justify-center gap-4">
            {isSpeaking && (
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12" onClick={stopSpeaking}>
                <Square className="w-4 h-4" />
              </Button>
            )}

            <motion.button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              whileTap={{ scale: 0.9 }}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-destructive text-destructive-foreground shadow-lg'
                  : 'gradient-primary text-primary-foreground shadow-md hover:shadow-lg'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}

              {isListening && (
                <>
                  <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full border-2 border-destructive" />
                  <motion.span animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                    className="absolute inset-0 rounded-full border border-destructive" />
                </>
              )}
            </motion.button>

            <p className="text-xs text-muted-foreground">
              {isProcessing ? 'Thinking...' : isListening ? 'Listening...' : 'Tap to speak'}
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default VoiceDoctorPage;
