import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle, Shield, Stethoscope, TestTube, ChevronDown,
  ChevronUp, Activity, Upload, MessageCircle,
  Brain, Thermometer, ClipboardList, Lightbulb, Eye, EyeOff,
  Bookmark, BookmarkCheck, Download, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ───────────────────────────────────────────────────────

interface MedicalResponseRendererProps {
  content: string;
  isStreaming?: boolean;
  onFollowUp?: (message: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onExportPDF?: () => void;
  messageId?: string;
}

export interface MedicalJSON {
  type: 'medical';
  summary: string;
  risk_level: string;
  risk_reason?: string;
  symptoms_detected?: string[];
  conditions?: { name: string; probability: string; emoji?: string }[];
  specialist?: string | null;
  suggested_tests?: string[];
  recommendations?: string[];
  detailed_analysis?: string;
  confidence?: number;
  disclaimer?: string;
  follow_ups?: FollowUpQuestion[];
}

type FollowUpQuestion =
  | { type: 'yesno'; question: string }
  | { type: 'option'; question: string; options: string[] };

// ─── Parser ──────────────────────────────────────────────────────

export function tryParseStructured(content: string): MedicalJSON | null {
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed.type === 'medical' && parsed.summary) return parsed;
    } catch { /* fall through */ }
  }
  try {
    const parsed = JSON.parse(content.trim());
    if (parsed.type === 'medical' && parsed.summary) return parsed;
  } catch { /* not JSON */ }
  return null;
}

// ─── Sub-components ──────────────────────────────────────────────

function RiskBadge({ level, reason }: { level: string; reason?: string }) {
  const config: Record<string, { color: string; bg: string; icon: typeof Shield; label: string }> = {
    low: { color: 'text-success', bg: 'bg-success/10 border-success/20', icon: Shield, label: 'Low Risk' },
    moderate: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle, label: 'Moderate Risk' },
    high: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'High Risk' },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'Critical' },
  };
  const c = config[level] || config.moderate;
  const Icon = c.icon;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${c.bg} ${c.color}`}
      title={reason}>
      <Icon className="w-3 h-3" />
      {c.label}
    </motion.div>
  );
}

function InsightCard({ icon: Icon, title, children, delay = 0 }: {
  icon: typeof Activity; title: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-3 bg-card/50 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function ConditionPill({ name, probability, emoji }: { name: string; probability: string; emoji?: string }) {
  const probColor = probability === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20'
    : probability === 'medium' ? 'bg-warning/10 text-warning border-warning/20'
    : 'bg-success/10 text-success border-success/20';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${probColor}`}>
      {emoji && <span>{emoji}</span>}
      {name}
    </span>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="flex items-center gap-2">
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

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: Upload, label: 'Upload Report', path: '/upload', color: 'bg-secondary/10 text-secondary hover:bg-secondary/20' },
    { icon: Activity, label: 'Track Symptoms', path: '/checkin', color: 'bg-warning/10 text-warning hover:bg-warning/20' },
  ];
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {actions.map(({ icon: Icon, label, path, color }) => (
        <Button key={label} variant="ghost" size="sm" onClick={() => navigate(path)}
          className={`text-[11px] h-8 rounded-xl gap-1.5 ${color} transition-all`}>
          <Icon className="w-3 h-3" /> {label}
        </Button>
      ))}
    </div>
  );
}

function FollowUpButtons({ followUps, onFollowUp }: { followUps: FollowUpQuestion[]; onFollowUp?: (msg: string) => void }) {
  if (!followUps?.length || !onFollowUp) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <MessageCircle className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Follow-up</span>
      </div>
      {followUps.map((fq, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-xs text-foreground/80">{fq.question}</p>
          <div className="flex flex-wrap gap-1.5">
            {fq.type === 'yesno' ? (
              <>
                <Button variant="outline" size="sm"
                  onClick={() => onFollowUp(`Yes, ${fq.question.toLowerCase().replace(/\?$/, '')}`)}
                  className="text-[11px] h-7 rounded-xl px-3 bg-success/5 border-success/20 text-success hover:bg-success/15">
                  Yes
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => onFollowUp(`No, I don't ${fq.question.toLowerCase().replace(/\?$/, '').replace(/^do you (also )?/i, '')}`)}
                  className="text-[11px] h-7 rounded-xl px-3 bg-muted/50 border-border text-muted-foreground hover:bg-muted">
                  No
                </Button>
              </>
            ) : (
              'options' in fq && fq.options?.map(opt => (
                <Button key={opt} variant="outline" size="sm"
                  onClick={() => onFollowUp(opt)}
                  className="text-[11px] h-7 rounded-xl px-3 bg-primary/5 border-primary/15 text-primary hover:bg-primary/15">
                  {opt}
                </Button>
              ))
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Action Bar (Bookmark + PDF Export) ──────────────────────────

function ActionBar({ isBookmarked, onToggleBookmark, onExportPDF }: {
  isBookmarked?: boolean; onToggleBookmark?: () => void; onExportPDF?: () => void;
}) {
  if (!onToggleBookmark && !onExportPDF) return null;
  return (
    <div className="flex items-center gap-1 pt-1">
      {onToggleBookmark && (
        <Button variant="ghost" size="sm" onClick={onToggleBookmark}
          className={`text-[11px] h-7 rounded-lg gap-1 px-2 ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {isBookmarked ? 'Saved' : 'Save'}
        </Button>
      )}
      {onExportPDF && (
        <Button variant="ghost" size="sm" onClick={onExportPDF}
          className="text-[11px] h-7 rounded-lg gap-1 px-2 text-muted-foreground hover:text-foreground">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      )}
    </div>
  );
}

// ─── Structured Medical Response with Tabs ───────────────────────

function StructuredMedicalResponse({ data, onFollowUp, isBookmarked, onToggleBookmark, onExportPDF }: {
  data: MedicalJSON; onFollowUp?: (msg: string) => void;
  isBookmarked?: boolean; onToggleBookmark?: () => void; onExportPDF?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Header: Summary + Risk */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
              <Brain className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">AI Health Summary</span>
          </div>
          <ActionBar isBookmarked={isBookmarked} onToggleBookmark={onToggleBookmark} onExportPDF={onExportPDF} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <RiskBadge level={data.risk_level} reason={data.risk_reason} />
          {data.confidence != null && <ConfidenceMeter confidence={data.confidence} />}
        </div>
      </div>

      {/* Tabs: Summary Cards | Detailed | Recommendations */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/50 rounded-xl p-0.5">
          <TabsTrigger value="overview" className="text-[11px] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="detailed" className="text-[11px] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Detailed
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-[11px] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Actions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab: Insight Cards */}
        <TabsContent value="overview" className="mt-2 space-y-2">
          {data.symptoms_detected && data.symptoms_detected.length > 0 && (
            <InsightCard icon={Thermometer} title="Symptoms Detected" delay={0.05}>
              <div className="flex flex-wrap gap-1.5">
                {data.symptoms_detected.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-muted rounded-md text-[11px] text-foreground/80">{s}</span>
                ))}
              </div>
            </InsightCard>
          )}
          {data.conditions && data.conditions.length > 0 && (
            <InsightCard icon={ClipboardList} title="Possible Conditions" delay={0.1}>
              <div className="flex flex-wrap gap-1.5">
                {data.conditions.map(c => (
                  <ConditionPill key={c.name} name={c.name} probability={c.probability} emoji={c.emoji} />
                ))}
              </div>
            </InsightCard>
          )}
          {data.specialist && (
            <InsightCard icon={Stethoscope} title="Recommended Specialist" delay={0.15}>
              <p className="text-xs text-foreground/80">{data.specialist}</p>
            </InsightCard>
          )}
          {data.suggested_tests && data.suggested_tests.length > 0 && (
            <InsightCard icon={TestTube} title="Suggested Tests" delay={0.2}>
              <ul className="space-y-1">
                {data.suggested_tests.map(t => (
                  <li key={t} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </InsightCard>
          )}
        </TabsContent>

        {/* Detailed Tab: Full Analysis */}
        <TabsContent value="detailed" className="mt-2">
          {data.detailed_analysis ? (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Detailed Medical Analysis</span>
              </div>
              <div className="prose prose-sm max-w-none text-foreground/85 [&>p]:text-xs [&>p]:leading-relaxed [&>p]:mb-2 [&>*:last-child]:mb-0 [&>h1]:text-sm [&>h1]:font-bold [&>h1]:mt-3 [&>h1]:mb-1 [&>h2]:text-xs [&>h2]:font-semibold [&>h2]:mt-2 [&>h2]:mb-1 [&>ul]:space-y-0.5 [&>ul]:pl-4 [&>ul]:text-xs [&>ol]:space-y-0.5 [&>ol]:pl-4 [&>ol]:text-xs [&>strong]:text-foreground">
                <ReactMarkdown>{data.detailed_analysis}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <FileText className="w-5 h-5 mx-auto mb-2 opacity-50" />
              No detailed analysis available for this response.
            </div>
          )}
          {data.disclaimer && (
            <p className="text-[10px] text-muted-foreground italic mt-2">{data.disclaimer}</p>
          )}
        </TabsContent>

        {/* Actions Tab: Recommendations + Follow-ups + Quick Actions */}
        <TabsContent value="actions" className="mt-2 space-y-3">
          {data.recommendations && data.recommendations.length > 0 && (
            <InsightCard icon={Lightbulb} title="Recommendations">
              <ul className="space-y-1.5">
                {data.recommendations.map(r => (
                  <li key={r} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="text-success mt-0.5">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </InsightCard>
          )}
          <FollowUpButtons followUps={data.follow_ups || []} onFollowUp={onFollowUp} />
          <QuickActions />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ─── Fallback markdown classes ───────────────────────────────────

const markdownClasses = `prose prose-sm max-w-none text-foreground
  [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2
  [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-3 [&>h2]:mb-1.5
  [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:mt-2.5 [&>h3]:mb-1
  [&>p]:text-sm [&>p]:text-foreground/90 [&>p]:leading-relaxed [&>p]:mb-2
  [&>ul]:space-y-1 [&>ul]:mb-2.5 [&>ul]:pl-4
  [&>ol]:space-y-1 [&>ol]:mb-2.5
  [&>blockquote]:border-l-2 [&>blockquote]:border-primary/30 [&>blockquote]:pl-3 [&>blockquote]:italic
  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`;

// ─── Legacy parser for old-format responses ──────────────────────

function parseLegacyFollowUps(content: string): { cleanContent: string; followUps: FollowUpQuestion[] } {
  const followUps: FollowUpQuestion[] = [];
  const followUpRegex = /#{1,3}\s*follow[\s-]*up\s*questions?\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n*$)/i;
  const match = content.match(followUpRegex);
  if (match) {
    const lines = match[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      const yesNoMatch = cleaned.match(/^\[yes\s*\/\s*no\]\s*(.+)/i);
      if (yesNoMatch) { followUps.push({ type: 'yesno', question: yesNoMatch[1].trim() }); continue; }
      const optionMatch = cleaned.match(/^\[option\]\s*(.+?\?)\s*\|(.+)/i);
      if (optionMatch) {
        const options = optionMatch[2].split('|').map(o => o.trim()).filter(Boolean);
        followUps.push({ type: 'option', question: optionMatch[1].trim(), options });
      }
    }
    const cleanContent = content.replace(followUpRegex, '').replace(/#{1,3}\s*follow[\s-]*up\s*questions?\s*$/im, '').trim();
    return { cleanContent, followUps };
  }
  return { cleanContent: content, followUps };
}

// ─── Main Export ─────────────────────────────────────────────────

export function MedicalResponseRenderer({ content, isStreaming, onFollowUp, isBookmarked, onToggleBookmark, onExportPDF }: MedicalResponseRendererProps) {
  const parsed = useMemo(() => isStreaming ? null : tryParseStructured(content), [content, isStreaming]);

  if (parsed && !isStreaming) {
    return <StructuredMedicalResponse data={parsed} onFollowUp={onFollowUp}
      isBookmarked={isBookmarked} onToggleBookmark={onToggleBookmark} onExportPDF={onExportPDF} />;
  }

  const { cleanContent, followUps } = isStreaming ? { cleanContent: content, followUps: [] as FollowUpQuestion[] } : parseLegacyFollowUps(content);
  const displayContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

  return (
    <div className="space-y-1">
      <div className={markdownClasses}>
        <ReactMarkdown>{displayContent}</ReactMarkdown>
      </div>
      {!isStreaming && followUps.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <FollowUpButtons followUps={followUps} onFollowUp={onFollowUp} />
        </div>
      )}
    </div>
  );
}
