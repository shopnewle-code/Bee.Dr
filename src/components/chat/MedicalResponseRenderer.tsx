import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle, Shield, Heart, Stethoscope, TestTube, ArrowRight,
  ChevronDown, ChevronUp, Activity, Zap, Upload, CalendarDays, Droplets,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MedicalResponseRendererProps {
  content: string;
  isStreaming?: boolean;
  onFollowUp?: (message: string) => void;
}

type FollowUpQuestion = 
  | { type: 'yesno'; question: string }
  | { type: 'option'; question: string; options: string[] };

function parseFollowUps(content: string): { cleanContent: string; followUps: FollowUpQuestion[] } {
  const followUps: FollowUpQuestion[] = [];

  // Find follow-up section and extract questions
  const followUpRegex = /#{1,3}\s*follow[\s-]*up\s*questions?\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n*$)/i;
  const match = content.match(followUpRegex);

  if (match) {
    const section = match[1];
    const lines = section.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();

      // [Yes/No] question
      const yesNoMatch = cleaned.match(/^\[yes\s*\/\s*no\]\s*(.+)/i);
      if (yesNoMatch) {
        followUps.push({ type: 'yesno', question: yesNoMatch[1].trim() });
        continue;
      }

      // [Option] question | opt1 | opt2 | opt3
      const optionMatch = cleaned.match(/^\[option\]\s*(.+?\?)\s*\|(.+)/i);
      if (optionMatch) {
        const options = optionMatch[2].split('|').map(o => o.trim()).filter(Boolean);
        followUps.push({ type: 'option', question: optionMatch[1].trim(), options });
        continue;
      }
    }

    // Remove the follow-up section from displayed content
    const cleanContent = content.replace(followUpRegex, '').replace(/#{1,3}\s*follow[\s-]*up\s*questions?\s*$/im, '').trim();
    return { cleanContent, followUps };
  }

  return { cleanContent: content, followUps };
}

function parseMedicalSections(content: string) {
  const riskMatch = content.match(/(?:risk\s*level|urgency)[:\s]*(?:🔴|🟡|🟢)?\s*(high|moderate|low|critical|mild|severe)/i);
  const riskLevel = riskMatch?.[1]?.toLowerCase() || null;

  const sectionPatterns = [
    { regex: /(?:#{1,3}\s*)?(?:🔍?\s*)?symptoms?\s*(?:detected|identified|reported|analysis)[:\s]*/i, type: 'symptoms' },
    { regex: /(?:#{1,3}\s*)?(?:🧠?\s*)?(?:possible|potential|likely)\s*(?:conditions?|diagnos[ie]s|causes?)[:\s]*/i, type: 'conditions' },
    { regex: /(?:#{1,3}\s*)?(?:⚠️?\s*)?risk\s*(?:level|assessment|analysis)[:\s]*/i, type: 'risk' },
    { regex: /(?:#{1,3}\s*)?(?:👨‍⚕️?\s*)?(?:recommended|suggested)\s*(?:specialist|doctor|physician)[:\s]*/i, type: 'doctor' },
    { regex: /(?:#{1,3}\s*)?(?:🧪?\s*)?(?:suggested|recommended)\s*tests?[:\s]*/i, type: 'tests' },
    { regex: /(?:#{1,3}\s*)?(?:✅?\s*)?(?:next\s*steps?|action\s*(?:items?|plan)|what\s*(?:to\s*do|you\s*(?:can|should)))[:\s]*/i, type: 'actions' },
  ];

  const hasStructuredSections = sectionPatterns.some(p => p.regex.test(content));
  return { hasStructuredSections, riskLevel };
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const config: Record<string, { color: string; bg: string; icon: typeof Shield; label: string }> = {
    low: { color: 'text-success', bg: 'bg-success/10 border-success/20', icon: Shield, label: 'Low Risk' },
    mild: { color: 'text-success', bg: 'bg-success/10 border-success/20', icon: Shield, label: 'Mild' },
    moderate: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle, label: 'Moderate Risk' },
    high: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'High Risk' },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'Critical' },
    severe: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'Severe' },
  };
  const c = config[level] || config.moderate;
  const Icon = c.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${c.bg} ${c.color}`}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </motion.div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: CalendarDays, label: 'Book Doctor', path: '/book-appointment', color: 'bg-primary/10 text-primary hover:bg-primary/20' },
    { icon: Upload, label: 'Upload Report', path: '/upload', color: 'bg-secondary/10 text-secondary hover:bg-secondary/20' },
    { icon: Activity, label: 'Track Symptoms', path: '/checkin', color: 'bg-warning/10 text-warning hover:bg-warning/20' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
      {actions.map(({ icon: Icon, label, path, color }) => (
        <Button key={label} variant="ghost" size="sm" onClick={() => navigate(path)}
          className={`text-[11px] h-8 rounded-xl gap-1.5 ${color} transition-all`}>
          <Icon className="w-3 h-3" /> {label}
        </Button>
      ))}
    </div>
  );
}

function ConfidenceMeter({ content }: { content: string }) {
  const confidenceMatch = content.match(/confidence[:\s]*(\d{1,3})%/i);
  if (!confidenceMatch) return null;
  const confidence = parseInt(confidenceMatch[1]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      className="flex items-center gap-2 mt-2">
      <span className="text-[10px] text-muted-foreground font-medium">AI Confidence</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[100px]">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }} animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }} />
      </div>
      <span className="text-[10px] font-semibold text-foreground">{confidence}%</span>
    </motion.div>
  );
}

function FollowUpButtons({ followUps, onFollowUp }: { followUps: FollowUpQuestion[]; onFollowUp?: (msg: string) => void }) {
  if (!followUps.length || !onFollowUp) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-3 pt-3 border-t border-border/50 space-y-2.5"
    >
      <div className="flex items-center gap-1.5">
        <MessageCircle className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Follow-up</span>
      </div>
      {followUps.map((fq, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="space-y-1.5"
        >
          <p className="text-xs text-foreground/80">{fq.question}</p>
          <div className="flex flex-wrap gap-1.5">
            {fq.type === 'yesno' ? (
              <>
                <Button variant="outline" size="sm"
                  onClick={() => onFollowUp(`Yes, ${fq.question.toLowerCase().replace(/\?$/, '').replace(/^do you (also )?/i, 'I ').replace(/^is the/i, 'the').replace(/^are you/i, 'I am')}`)}
                  className="text-[11px] h-7 rounded-xl px-3 bg-success/5 border-success/20 text-success hover:bg-success/15 hover:text-success">
                  Yes
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => onFollowUp(`No, ${fq.question.toLowerCase().replace(/\?$/, '').replace(/^do you (also )?/i, 'I don\'t ').replace(/^is the/i, 'the').replace(/^are you/i, 'I\'m not')}`)}
                  className="text-[11px] h-7 rounded-xl px-3 bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                  No
                </Button>
              </>
            ) : (
              fq.options.map(opt => (
                <Button key={opt} variant="outline" size="sm"
                  onClick={() => onFollowUp(opt)}
                  className="text-[11px] h-7 rounded-xl px-3 bg-primary/5 border-primary/15 text-primary hover:bg-primary/15">
                  {opt}
                </Button>
              ))
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

const markdownClasses = `prose prose-sm max-w-none text-foreground
  [&>h1]:text-base [&>h1]:font-display [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mt-4 [&>h1]:mb-2
  [&>h2]:text-sm [&>h2]:font-display [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mt-3 [&>h2]:mb-1.5
  [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-2.5 [&>h3]:mb-1
  [&>p]:text-sm [&>p]:text-foreground/90 [&>p]:leading-relaxed [&>p]:mb-2
  [&>ul]:space-y-1 [&>ul]:mb-2.5 [&>ul]:pl-0 [&>ul]:list-none
  [&>ul>li]:text-sm [&>ul>li]:text-foreground/90 [&>ul>li]:pl-4 [&>ul>li]:relative
  [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[9px] [&>ul>li]:before:w-1.5 [&>ul>li]:before:h-1.5 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-primary/40
  [&>ol]:space-y-1 [&>ol]:mb-2.5
  [&>ol>li]:text-sm [&>ol>li]:text-foreground/90
  [&>blockquote]:border-l-2 [&>blockquote]:border-primary/30 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-muted-foreground
  [&>strong]:text-foreground [&>strong]:font-semibold
  [&>em]:text-muted-foreground
  [&>hr]:border-border/50 [&>hr]:my-3
  [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`;

export function MedicalResponseRenderer({ content, isStreaming, onFollowUp }: MedicalResponseRendererProps) {
  const { hasStructuredSections, riskLevel } = parseMedicalSections(content);
  const { cleanContent, followUps } = isStreaming ? { cleanContent: content, followUps: [] } : parseFollowUps(content);

  if (hasStructuredSections && !isStreaming) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">AI Health Analysis</span>
          {riskLevel && <RiskBadge level={riskLevel} />}
        </div>

        <div className={markdownClasses}>
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>

        <ConfidenceMeter content={cleanContent} />
        <FollowUpButtons followUps={followUps} onFollowUp={onFollowUp} />
        <QuickActions />
      </motion.div>
    );
  }

  return (
    <div className="space-y-1">
      <div className={markdownClasses}>
        <ReactMarkdown>{cleanContent}</ReactMarkdown>
      </div>
      {!isStreaming && <FollowUpButtons followUps={followUps} onFollowUp={onFollowUp} />}
    </div>
  );
}
