import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`;

interface ReportChatProps {
  scanData: any;
  suggestedQuestions: string[];
}

export default function ReportChat({ scanData, suggestedQuestions }: ReportChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    // Prepend report context to first message
    const contextPrefix = messages.length === 0
      ? `[CONTEXT: The user is viewing a medical report with the following data: ${JSON.stringify(scanData).slice(0, 2000)}]\n\nUser question: `
      : '';

    const userMsg: Msg = { role: 'user', content: messageText };
    const apiMsg: Msg = { role: 'user', content: contextPrefix + messageText };
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
      const allMessages = [...messages.map((m, i) => i === 0 && messages.length > 0 ? m : m), apiMsg];
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
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

  const defaultQuestions = suggestedQuestions?.length > 0 ? suggestedQuestions : [
    "Is this result dangerous?",
    "What should I eat to improve this?",
    "Do I need to see a doctor?",
    "What does this test mean?",
    "How can I improve this value?",
  ];

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h4 className="font-display font-semibold text-foreground mb-1 text-sm">Ask About Your Report</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Get instant AI-powered answers about your specific test results
            </p>
            <div className="space-y-1.5 max-w-sm mx-auto">
              {defaultQuestions.slice(0, 5).map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-foreground">
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 justify-center text-[10px] text-muted-foreground">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>For informational purposes only</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                msg.role === 'user' ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-emerald max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested follow-ups after first response */}
      {messages.length > 0 && messages.length <= 3 && !isLoading && (
        <div className="px-1 pb-2 flex flex-wrap gap-1">
          {defaultQuestions.filter(q => !messages.some(m => m.content === q)).slice(0, 3).map((q) => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-[10px] px-2 py-1 rounded-full border border-border bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-3 flex gap-2">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask about your results..." rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
          size="icon" className="gradient-primary text-primary-foreground rounded-lg h-9 w-9 shrink-0">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
