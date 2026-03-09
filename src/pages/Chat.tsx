import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Activity, ArrowLeft, Send, Bot, User, Sparkles, AlertCircle,
  Mic, Stethoscope, BookOpen, Pill, HeartPulse, Type,
  Image, X, History, Plus, Trash2, Bookmark, GitCompareArrows
} from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleLanguage } from '@/hooks/use-simple-language';
import { useLanguage } from '@/hooks/use-language';
import { MedicalResponseRenderer } from '@/components/chat/MedicalResponseRenderer';
import { exportMedicalPDF } from '@/components/chat/ChatPDFExport';
import { AIBrainWave } from '@/components/ai/AIThinkingAnimation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

type Msg = { role: 'user' | 'assistant'; content: string; image_url?: string; id?: string; is_bookmarked?: boolean; created_at?: string };
type ChatMode = 'general' | 'symptoms' | 'treatment' | 'education' | 'medication';

interface Conversation {
  id: string;
  title: string | null;
  mode: string | null;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`;

const MODES: { id: ChatMode; icon: typeof Bot; label: string; description: string; prompts: string[] }[] = [
  {
    id: 'general', icon: Bot, label: 'AI Doctor',
    description: 'Ask anything about your health',
    prompts: [
      "What does a high cholesterol level mean?",
      "Explain my CBC blood test results",
      "What are normal blood sugar levels?",
      "Do I need to see a doctor for this?",
    ],
  },
  {
    id: 'symptoms', icon: Stethoscope, label: 'Symptom Checker',
    description: 'Describe symptoms for AI assessment',
    prompts: [
      "I have a headache and fatigue for 3 days",
      "I feel dizzy when I stand up quickly",
      "I have chest tightness after exercise",
      "My joints hurt in the morning",
    ],
  },
  {
    id: 'treatment', icon: HeartPulse, label: 'Treatment Info',
    description: 'Learn about treatments & when to see a doctor',
    prompts: [
      "What are treatments for iron deficiency?",
      "When should I go to the ER vs urgent care?",
      "How is high blood pressure treated?",
      "What happens in a thyroid function test?",
    ],
  },
  {
    id: 'medication', icon: Pill, label: 'Medicine Guide',
    description: 'Understand medications, dosages & interactions',
    prompts: [
      "What is metformin used for?",
      "Can I take ibuprofen with blood thinners?",
      "What are side effects of statins?",
      "How should I take antibiotics correctly?",
    ],
  },
  {
    id: 'education', icon: BookOpen, label: 'Health Learn',
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat history state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Image upload state
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const currentMode = MODES.find(m => m.id === mode)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  };

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) {
      const msgs: Msg[] = [];
      for (const row of data) {
        msgs.push({ role: 'user', content: row.message, image_url: row.image_url || undefined, id: row.id, is_bookmarked: row.is_bookmarked || false, created_at: row.created_at });
        if (row.response) {
          msgs.push({ role: 'assistant', content: row.response, id: row.id, is_bookmarked: row.is_bookmarked || false, created_at: row.created_at });
        }
      }
      setMessages(msgs);
      setCurrentConversationId(convId);
      const conv = conversations.find(c => c.id === convId);
      if (conv?.mode) setMode(conv.mode as ChatMode);
      setShowHistory(false);
    }
  };

  const createNewConversation = async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, mode, title: 'New Conversation' })
      .select()
      .single();
    if (error || !data) { console.error('Failed to create conversation', error); return null; }
    setCurrentConversationId(data.id);
    loadConversations();
    return data.id;
  };

  const saveMessagePair = async (convId: string, userMsg: string, aiResponse: string, imageUrl?: string) => {
    if (!user) return null;
    const { data } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        conversation_id: convId,
        message: userMsg,
        response: aiResponse,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    // Update conversation title from first message
    const msgCount = messages.filter(m => m.role === 'user').length;
    if (msgCount === 0) {
      const title = userMsg.slice(0, 60) + (userMsg.length > 60 ? '...' : '');
      await supabase.from('chat_conversations').update({ title }).eq('id', convId);
      loadConversations();
    }
    return data;
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('chat_conversations').delete().eq('id', convId);
    if (currentConversationId === convId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    loadConversations();
    toast.success('Conversation deleted');
  };

  const toggleBookmark = async (messageId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_bookmarked: !currentState })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, is_bookmarked: !currentState } : m
      ));
      toast.success(!currentState ? 'Response saved' : 'Bookmark removed');
    }
  };

  // Image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploadingImage(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-images').upload(path, file);
    setUploadingImage(false);
    if (error) { toast.error('Failed to upload image'); return null; }

    const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path);
    return urlData?.publicUrl || null;
  };

  const clearPendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.preview);
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if ((!messageText && !pendingImage) || isLoading) return;

    let imageUrl: string | undefined;
    if (pendingImage) {
      imageUrl = (await uploadImage(pendingImage.file)) || undefined;
      clearPendingImage();
    }

    // Ensure conversation exists
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) { toast.error('Failed to start conversation'); return; }
    }

    const contextPrefix = MODE_CONTEXT[mode];
    const userMsg: Msg = { role: 'user', content: messageText || 'Analyze this image', image_url: imageUrl };

    // Build API message with optional image
    let apiContent: any = messages.length === 0 ? contextPrefix + (messageText || 'Please analyze this medical image') : (messageText || 'Please analyze this medical image');
    if (imageUrl) {
      apiContent = [
        { type: 'text', text: typeof apiContent === 'string' ? apiContent : messageText || 'Analyze this image' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ];
    }
    const apiMsg = { role: 'user' as const, content: apiContent };

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
      const apiMessages = [...messages.map(m => {
        if (m.image_url) {
          return { role: m.role, content: [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: m.image_url } },
          ]};
        }
        return { role: m.role, content: m.content };
      }), apiMsg];

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, simpleLanguage, language }),
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

      // Save to DB after stream completes
      if (convId && assistantSoFar) {
        const saved = await saveMessagePair(convId, messageText || 'Analyze this image', assistantSoFar, imageUrl);
        if (saved) {
          // Update message IDs for bookmark functionality
          setMessages(prev => {
          const updated = [...prev];
            let lastUser = -1;
            let lastAssistant = -1;
            for (let j = updated.length - 1; j >= 0; j--) {
              if (lastUser < 0 && updated[j].role === 'user') lastUser = j;
              if (lastAssistant < 0 && updated[j].role === 'assistant') lastAssistant = j;
              if (lastUser >= 0 && lastAssistant >= 0) break;
            }
            if (lastUser >= 0) updated[lastUser] = { ...updated[lastUser], id: saved.id };
            if (lastAssistant >= 0) updated[lastAssistant] = { ...updated[lastAssistant], id: saved.id, is_bookmarked: false };
            return updated;
          });
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
      setCurrentConversationId(null);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
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

          {/* History Sheet */}
          <Sheet open={showHistory} onOpenChange={setShowHistory}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <History className="w-3 h-3" /> History
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-sm font-display">Chat History</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <Button variant="outline" size="sm" onClick={startNewChat} className="w-full text-xs gap-1.5 mb-3">
                  <Plus className="w-3 h-3" /> New Conversation
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="px-3 pb-3 space-y-1.5">
                  {conversations.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
                  )}
                  {conversations.map(conv => (
                    <div key={conv.id}
                      className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-xs ${
                        currentConversationId === conv.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                      }`}
                      onClick={() => loadConversation(conv.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.title || 'Untitled'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon"
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate('/chat-compare')}>
            <GitCompareArrows className="w-3 h-3" /> Compare
          </Button>
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
                  mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
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
                  {/* Show image if present */}
                  {msg.role === 'user' && msg.image_url && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <img src={msg.image_url} alt="Uploaded" className="max-w-full max-h-48 rounded-lg" />
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <MedicalResponseRenderer
                      content={msg.content}
                      isStreaming={isLoading && i === messages.length - 1}
                      onFollowUp={(text) => sendMessage(text)}
                      isBookmarked={msg.is_bookmarked}
                      onToggleBookmark={msg.id ? () => toggleBookmark(msg.id!, msg.is_bookmarked || false) : undefined}
                      onExportPDF={() => exportMedicalPDF(msg.content, msg.created_at)}
                      messageId={msg.id}
                    />
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
              <div className="bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AIBrainWave />
                  <span className="text-[11px] text-muted-foreground font-medium animate-pulse">Analyzing...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Pending Image Preview */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-card px-4 pt-3 shrink-0">
            <div className="max-w-2xl mx-auto flex items-start gap-2">
              <div className="relative">
                <img src={pendingImage.preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border" />
                <button onClick={clearPendingImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground mt-1">{pendingImage.file.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploadingImage}
            className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-foreground">
            <Image className="w-4 h-4" />
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'symptoms' ? 'Describe your symptoms...' : 'Ask about your health...'}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={() => sendMessage()} disabled={(!input.trim() && !pendingImage) || isLoading}
            size="icon" className="gradient-primary text-primary-foreground rounded-xl h-11 w-11 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
