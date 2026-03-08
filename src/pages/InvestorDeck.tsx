import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Brain, Shield, TrendingUp, Users, Zap,
  Globe, FileText, Bot, Heart, Pill, DollarSign, Rocket,
  CheckCircle2, Target, BarChart3, Building2, Stethoscope,
  AlertTriangle, Layers, Crown, Smartphone, Eye, Lightbulb,
  MapPin, Clock, Star, ShoppingCart, Scan, ArrowUpRight,
  GraduationCap, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── reusable components ──────────────────────────────────── */

const MetricCard = ({ value, label, sub }: { value: string; label: string; sub?: string }) => (
  <div className="glass-card p-5 text-center">
    <p className="text-3xl sm:text-4xl font-display font-bold text-primary">{value}</p>
    <p className="text-sm font-medium text-foreground mt-1">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const BulletList = ({ items, icon: Icon = CheckCircle2 }: { items: string[]; icon?: React.ElementType }) => (
  <ul className="space-y-2.5">
    {items.map(item => (
      <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const CompetitorRow = ({ name, features }: { name: string; features: boolean[] }) => (
  <tr className="border-b border-white/10 last:border-0">
    <td className="py-2.5 pr-4 text-sm font-medium text-foreground">{name}</td>
    {features.map((f, i) => (
      <td key={i} className="py-2.5 px-3 text-center">
        {f ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
      </td>
    ))}
  </tr>
);

/* ─── slide data ──────────────────────────────────────────── */

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  content: React.ReactNode;
}

const slides: Slide[] = [
  // 1 — COVER
  {
    id: 'cover',
    title: '',
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow">
          <Activity className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-5xl sm:text-7xl font-display font-bold text-foreground mb-3">Bee.dr</h1>
        <p className="text-xl sm:text-2xl text-primary font-display font-semibold mb-2">AI Health Intelligence Platform</p>
        <p className="text-base text-muted-foreground max-w-lg mb-2">
          Understand your health data instantly.
        </p>
        <p className="text-sm text-muted-foreground/70 max-w-md">
          Make healthcare information understandable for everyone.
        </p>
        <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
          <span>Seed Round</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>$1M Raise</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>2026</span>
        </div>
      </div>
    ),
  },

  // 2 — PROBLEM
  {
    id: 'problem',
    title: 'The Problem',
    badge: 'Why Now',
    subtitle: 'Healthcare information is complex and fragmented',
    content: (
      <div className="space-y-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 flex-wrap justify-center text-sm">
            <span className="glass-subtle px-3 py-2 rounded-xl text-foreground font-medium">Patient receives blood test report</span>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
            <span className="glass-subtle px-3 py-2 rounded-xl text-foreground font-medium">Cannot understand results</span>
            <ArrowRight className="w-4 h-4 text-destructive shrink-0" />
            <span className="bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl text-destructive font-medium">Anxiety + confusion</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-card p-5 border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
            <h4 className="font-display font-semibold text-foreground mb-2">Millions cannot understand:</h4>
            <BulletList icon={AlertTriangle} items={[
              'Medical reports — complex jargon, abbreviations',
              'Doctor handwriting — illegible prescriptions',
              'Medicines — interactions, side effects, dosages',
              'Disease risks — what their results actually mean',
            ]} />
          </div>
          <div className="glass-card p-5">
            <Lightbulb className="w-5 h-5 text-primary mb-2" />
            <h4 className="font-display font-semibold text-foreground mb-2">The Opportunity</h4>
            <BulletList items={[
              'AI can now interpret medical data with high accuracy',
              'LLMs enable plain-language explanations in any language',
              'Mobile-first access reaches underserved populations',
              'Preventive insights reduce healthcare costs by 30-40%',
            ]} />
          </div>
        </div>
      </div>
    ),
  },

  // 3 — SOLUTION
  {
    id: 'solution',
    title: 'Our Solution',
    badge: 'Product',
    subtitle: 'Bee.dr provides AI medical report analysis, AI doctor assistant, medicine intelligence, and health insights',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: FileText, step: '01', title: 'Upload Report', desc: 'Upload medical report PDF or snap a photo' },
            { icon: Scan, step: '02', title: 'Scan Medicine', desc: 'Scan any medicine for instant intelligence' },
            { icon: Bot, step: '03', title: 'Ask AI Doctor', desc: 'Chat with AI about your health concerns' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="glass-card p-5 text-center">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-glow">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xs text-primary font-medium">Step {step}</span>
              <h4 className="font-display font-semibold text-foreground mt-1">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <div className="glass-card p-5">
          <h4 className="font-display font-semibold text-foreground mb-3">Key Differentiators</h4>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <BulletList items={[
              'Test-by-test breakdown with normal range visualization',
              'In-report contextual AI chat',
              'Multi-language support',
            ]} />
            <BulletList items={[
              'Multi-disease risk prediction',
              'Medicine scanner with drug interaction alerts',
              'Family health profiles with shared dashboards',
            ]} />
          </div>
        </div>
      </div>
    ),
  },

  // 4 — PRODUCT DEMO
  {
    id: 'demo',
    title: 'Product Demo',
    badge: 'User Flow',
    subtitle: 'From upload to actionable insights in seconds',
    content: (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h4 className="font-display font-semibold text-foreground mb-5 text-center">User Flow</h4>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {[
              { label: 'Upload medical report', icon: FileText },
              { label: 'AI analyzes report', icon: Brain },
              { label: 'Simple explanation', icon: Eye },
              { label: 'Ask AI doctor questions', icon: Bot },
              { label: 'Suggested actions', icon: Heart },
            ].map(({ label, icon: Icon }, i, arr) => (
              <span key={label} className="flex items-center gap-3">
                <span className="glass-subtle border border-primary/20 text-foreground font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" /> {label}
                </span>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
              </span>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <MetricCard value="<3s" label="Analysis Time" />
          <MetricCard value="95%" label="Accuracy" />
          <MetricCard value="50+" label="Biomarkers" />
          <MetricCard value="2+" label="Languages" />
        </div>
      </div>
    ),
  },

  // 5 — MARKET OPPORTUNITY
  {
    id: 'market',
    title: 'Market Opportunity',
    badge: 'Market Size',
    subtitle: 'Digital health market: $500B+. AI healthcare assistants growing rapidly.',
    content: (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass-card p-6 text-center border-primary/20">
            <p className="text-4xl font-display font-bold text-primary">$500B+</p>
            <p className="text-sm font-medium text-foreground mt-1">Digital Health Market</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-4xl font-display font-bold text-primary">21%</p>
            <p className="text-sm font-medium text-foreground mt-1">Annual Growth (CAGR)</p>
          </div>
          <div className="glass-card p-6 text-center shadow-glow">
            <p className="text-4xl font-display font-bold text-primary">1B+</p>
            <p className="text-sm font-medium text-foreground mt-1">Underserved Patients</p>
          </div>
        </div>
        <div className="glass-card p-5">
          <h4 className="font-display font-semibold text-foreground mb-3">Target Segments</h4>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <BulletList items={[
              'Health consumers — proactive health management',
              'Chronic patients — regular monitoring & tracking',
            ]} />
            <BulletList items={[
              'Families — shared health profiles & oversight',
              'Preventive healthcare users — early detection',
            ]} />
          </div>
        </div>
      </div>
    ),
  },

  // 6 — PRODUCT FEATURES
  {
    id: 'features',
    title: 'Product Features',
    badge: 'Core Modules',
    subtitle: 'Comprehensive AI health ecosystem',
    content: (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: FileText, name: 'AI Report Analysis' },
          { icon: Bot, name: 'AI Doctor Chat' },
          { icon: Scan, name: 'Medicine Scanner' },
          { icon: BarChart3, name: 'Health Dashboard' },
          { icon: Stethoscope, name: 'Doctor Consultations' },
          { icon: ShoppingCart, name: 'Pharmacy Marketplace' },
        ].map(({ icon: Icon, name }) => (
          <div key={name} className="glass-card p-4 flex items-center gap-3 group hover:shadow-glow transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{name}</span>
          </div>
        ))}
      </div>
    ),
  },

  // 7 — TECHNOLOGY
  {
    id: 'technology',
    title: 'Technology',
    badge: 'Architecture',
    subtitle: 'Key innovation: medical document intelligence',
    content: (
      <div className="space-y-5">
        <div className="glass-card p-5">
          <h4 className="font-display font-semibold text-foreground mb-3">AI Pipeline</h4>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {['Medical Report', 'Layout Detection', 'OCR Extraction', 'Entity Recognition', 'AI Interpretation', 'Risk Prediction', 'Recommendations', 'AI Doctor'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="glass-subtle border border-primary/20 text-foreground font-medium px-2.5 py-1.5 rounded-lg">{step}</span>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-primary" />}
              </span>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Medical Document AI', items: ['TrOCR text extraction', 'BioBERT entity recognition', 'Clinical interpretation'] },
            { title: 'LLM Doctor Assistant', items: ['RAG with report context', 'Multi-language generation', 'Streaming responses'] },
            { title: 'Risk Prediction', items: ['XGBoost ensemble', 'CV, diabetes, anemia', 'Temporal trends'] },
            { title: 'Knowledge Graph', items: ['Drug interactions', 'Biomarker ranges', 'Clinical guidelines'] },
          ].map(({ title, items }) => (
            <div key={title} className="glass-card p-4">
              <h4 className="font-display font-semibold text-foreground text-sm mb-2">{title}</h4>
              <BulletList items={items} />
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 8 — COMPETITIVE LANDSCAPE
  {
    id: 'competition',
    title: 'Competitive Landscape',
    badge: 'Moat',
    subtitle: 'Report intelligence + medicine intelligence + health data platform',
    content: (
      <div className="space-y-5">
        <div className="glass-card p-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 text-sm font-display font-semibold text-foreground">Platform</th>
                {['Report AI', 'AI Chat', 'Medicine', 'Risk', 'Multi-Lang', 'Marketplace'].map(h => (
                  <th key={h} className="py-2 px-3 text-[10px] font-medium text-muted-foreground text-center whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-primary/20 bg-primary/5">
                <td className="py-2.5 pr-4 text-sm font-bold text-primary flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Bee.dr</td>
                {[true, true, true, true, true, true].map((f, i) => (
                  <td key={i} className="py-2.5 px-3 text-center"><CheckCircle2 className="w-4 h-4 text-primary mx-auto" /></td>
                ))}
              </tr>
              <CompetitorRow name="Ada Health" features={[false, true, false, true, true, false]} />
              <CompetitorRow name="Practo" features={[false, false, false, false, false, true]} />
              <CompetitorRow name="Teladoc" features={[false, true, false, false, false, false]} />
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Layers, title: 'Full-Stack AI', desc: 'End-to-end OCR → NER → LLM → Risk pipeline' },
            { icon: Globe, title: 'Vernacular First', desc: 'Built for regional languages from day one' },
            { icon: Shield, title: 'Data Moat', desc: 'Every scan improves models — network effects compound' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-4">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-display font-semibold text-foreground text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 9 — BUSINESS MODEL
  {
    id: 'business-model',
    title: 'Business Model',
    badge: 'Revenue',
    subtitle: 'Multi-stream monetization',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { icon: Star, title: 'Premium', desc: '$7/month' },
            { icon: Stethoscope, title: 'Consultations', desc: '20% fee' },
            { icon: ShoppingCart, title: 'Pharmacy', desc: '10% commission' },
            { icon: BarChart3, title: 'Insights API', desc: 'Enterprise' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-4 text-center group hover:shadow-glow transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/15 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { year: 'Year 1', revenue: '$150K', width: '15%' },
            { year: 'Year 2', revenue: '$1M ARR', width: '50%' },
            { year: 'Year 3', revenue: '$10M ARR', width: '100%' },
          ].map(({ year, revenue, width }) => (
            <div key={year} className="glass-card p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">{year}</p>
              <p className="text-2xl font-display font-bold text-primary">{revenue}</p>
              <div className="mt-3 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 10 — TRACTION
  {
    id: 'traction',
    title: 'Traction',
    badge: 'Metrics',
    subtitle: 'Early growth indicators showing product-market fit',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard value="10K" label="Users" sub="Early adopters" />
          <MetricCard value="20K" label="Reports Analyzed" sub="AI processing" />
          <MetricCard value="5K" label="AI Chats" sub="Doctor conversations" />
        </div>
        <div className="glass-card p-5">
          <h4 className="font-display font-semibold text-foreground mb-4">Growth Indicators</h4>
          <div className="space-y-3">
            {[
              { label: 'Report uploads', value: 'Growing weekly' },
              { label: 'AI usage', value: 'High engagement' },
              { label: 'Retention', value: 'Strong repeat usage' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // 11 — GO-TO-MARKET
  {
    id: 'gtm',
    title: 'Go-To-Market Strategy',
    badge: 'Growth',
    subtitle: '0 → 1M users through trust + partnerships + utility',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { phase: 'Phase 1: 0–10K', title: 'Early Users', items: ['Free AI report explanation', 'Diagnostic lab partnerships', 'Health communities & SEO'] },
            { phase: 'Phase 2: 10K–100K', title: 'Product-Market Fit', items: ['Health score + AI doctor chat', 'YouTube health education', 'Doctor referral program'] },
            { phase: 'Phase 3: 100K–500K', title: 'Platform Expansion', items: ['Doctor consultations marketplace', 'Medicine ordering', 'Clinic & pharmacy partnerships'] },
            { phase: 'Phase 4: 500K–1M', title: 'Viral Growth', items: ['Family health profiles', 'Preventive alerts', 'Network effect: one user → family joins'] },
          ].map(({ phase, title, items }) => (
            <div key={phase} className="glass-card p-5">
              <span className="text-xs text-primary font-medium">{phase}</span>
              <h4 className="font-display font-semibold text-foreground mt-1 mb-3">{title}</h4>
              <BulletList items={items} />
            </div>
          ))}
        </div>
        <div className="glass-card p-5">
          <h4 className="font-display font-semibold text-foreground mb-3 text-center">Viral Growth Loop</h4>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {['Upload report', 'AI explains', 'Share insights', 'New users join'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="glass-subtle border border-primary/20 text-foreground font-medium px-3 py-2 rounded-xl">{step}</span>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-primary" />}
              </span>
            ))}
            <ArrowUpRight className="w-4 h-4 text-secondary" />
          </div>
        </div>
      </div>
    ),
  },

  // 12 — ROADMAP
  {
    id: 'roadmap',
    title: 'Product Roadmap',
    badge: 'Timeline',
    subtitle: 'Two-year development plan',
    content: (
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <span className="text-xs text-primary font-semibold">Year 1</span>
          <h4 className="font-display font-semibold text-foreground mt-1 mb-3">Foundation</h4>
          <BulletList items={[
            'AI report intelligence',
            'AI doctor assistant',
            'Medicine intelligence',
            'Health analytics dashboard',
          ]} />
        </div>
        <div className="glass-card p-6">
          <span className="text-xs text-primary font-semibold">Year 2</span>
          <h4 className="font-display font-semibold text-foreground mt-1 mb-3">Platform</h4>
          <BulletList items={[
            'Doctor marketplace',
            'Pharmacy platform',
            'Preventive health AI',
            'Global expansion',
          ]} />
        </div>
        <div className="glass-card p-6 sm:col-span-2">
          <h4 className="font-display font-semibold text-foreground mb-4">Growth Metrics Target</h4>
          <div className="space-y-3">
            {[
              { month: 'Month 1', users: '1K', width: '5%' },
              { month: 'Month 3', users: '10K', width: '15%' },
              { month: 'Month 6', users: '100K', width: '40%' },
              { month: 'Month 12', users: '1M', width: '100%' },
            ].map(({ month, users, width }) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{month}</span>
                <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full flex items-center justify-end pr-2" style={{ width }}>
                    <span className="text-[10px] font-bold text-primary-foreground">{users}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // 13 — TEAM
  {
    id: 'team',
    title: 'Team',
    badge: 'Founders',
    subtitle: 'Ideal founding team for health-tech',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { role: 'AI Engineer', icon: Brain, skills: ['ML/NLP research background', 'Medical AI specialist', 'Production ML systems'] },
            { role: 'Backend Engineer', icon: Smartphone, skills: ['Scalable infrastructure', 'Edge functions & APIs', 'Security & compliance'] },
            { role: 'Product Designer', icon: Eye, skills: ['Health-tech UX expertise', 'Mobile-first design', 'User research'] },
            { role: 'Healthcare Advisor', icon: Stethoscope, skills: ['Licensed physician (MD)', 'Clinical validation', 'Regulatory knowledge'] },
          ].map(({ role, icon: Icon, skills }) => (
            <div key={role} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-foreground">{role}</h4>
              </div>
              <BulletList items={skills} />
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 14 — FINANCIAL PROJECTIONS
  {
    id: 'financials',
    title: 'Financial Projections',
    badge: '3-Year',
    subtitle: 'Path to profitability',
    content: (
      <div className="space-y-5">
        <div className="glass-card p-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 text-sm font-display font-semibold text-foreground">Metric</th>
                <th className="py-2 text-sm font-display font-semibold text-foreground text-center">Year 1</th>
                <th className="py-2 text-sm font-display font-semibold text-foreground text-center">Year 2</th>
                <th className="py-2 text-sm font-display font-semibold text-primary text-center">Year 3</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ['Revenue', '$150K', '$1M', '$10M'],
                ['Users', '10K', '100K', '1M'],
                ['Paid Subs', '1K', '15K', '150K'],
                ['Team Size', '5', '20', '50'],
              ].map(([metric, y1, y2, y3]) => (
                <tr key={metric} className="border-b border-white/5">
                  <td className="py-2.5 text-muted-foreground">{metric}</td>
                  <td className="py-2.5 text-center text-foreground">{y1}</td>
                  <td className="py-2.5 text-center text-foreground">{y2}</td>
                  <td className="py-2.5 text-center font-medium text-primary">{y3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard value="$10M" label="Year 3 ARR" />
          <MetricCard value="1M" label="Users" />
          <MetricCard value="Y2" label="Profitability" />
        </div>
      </div>
    ),
  },

  // 15 — THE ASK
  {
    id: 'the-ask',
    title: '',
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow">
          <DollarSign className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-3">
          Seed Round: <span className="text-gradient">$1M</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mb-8">
          Building the world's most accessible healthcare AI platform
        </p>
        <div className="glass-card p-6 max-w-md w-full mb-8">
          <h4 className="font-display font-semibold text-foreground mb-4">Use of Funds</h4>
          <div className="space-y-3">
            {[
              { label: 'AI Development', pct: '40%', color: 'bg-primary' },
              { label: 'Engineering Team', pct: '25%', color: 'bg-secondary' },
              { label: 'User Growth', pct: '20%', color: 'bg-amber-500' },
              { label: 'Health Partnerships', pct: '15%', color: 'bg-emerald-500' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{pct}</span>
                </div>
                <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Bee.dr</span>
          <span>·</span>
          <span>investor@beedr.health</span>
        </div>
      </div>
    ),
  },
];

/* ─── deck component ──────────────────────────────────────── */

const InvestorDeck = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const total = slides.length;
  const slide = slides[current];

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(total - 1, idx)));
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'f' || e.key === 'F') setIsFullscreen(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  return (
    <div className={`min-h-screen bg-background gradient-mesh flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {/* Top bar */}
      <div className="glass border-b border-white/20 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {!isFullscreen && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => navigate('/pitch')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                <Activity className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground text-sm">Bee.dr</span>
              <span className="text-xs text-muted-foreground">· Investor Deck</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">{current + 1} / {total}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setIsFullscreen(v => !v)}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-5xl"
          >
            {slide.title && (
              <div className="mb-6">
                {slide.badge && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-primary border border-primary/20 mb-2">
                    <Zap className="w-3 h-3" /> {slide.badge}
                  </span>
                )}
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">{slide.title}</h2>
                {slide.subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{slide.subtitle}</p>}
              </div>
            )}
            {slide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="glass border-t border-white/20 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="hidden sm:flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={next} disabled={current === total - 1}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvestorDeck;
