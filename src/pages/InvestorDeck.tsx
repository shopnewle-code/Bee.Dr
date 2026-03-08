import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Brain, Shield, TrendingUp, Users, Zap,
  Globe, FileText, Bot, Heart, Pill, DollarSign, Rocket,
  CheckCircle2, Target, BarChart3, Building2, Stethoscope,
  AlertTriangle, Layers, Crown, Smartphone, Eye, Lightbulb,
  PieChart, MapPin, Clock, Star, Briefcase, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── slide data ──────────────────────────────────────────── */

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  content: React.ReactNode;
}

const MetricCard = ({ value, label, sub }: { value: string; label: string; sub?: string }) => (
  <div className="bg-card/60 border border-border rounded-xl p-5 text-center">
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
  <tr className="border-b border-border/50 last:border-0">
    <td className="py-2.5 pr-4 text-sm font-medium text-foreground">{name}</td>
    {features.map((f, i) => (
      <td key={i} className="py-2.5 px-3 text-center">
        {f ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
      </td>
    ))}
  </tr>
);

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
        <p className="text-xl sm:text-2xl text-primary font-display font-semibold mb-2">Your Health, Decoded by AI</p>
        <p className="text-base text-muted-foreground max-w-lg">
          AI-powered medical intelligence platform transforming how 1B+ people understand their health
        </p>
        <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
          <span>Seed Round</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>$2M Raise</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>Q1 2026</span>
        </div>
      </div>
    ),
  },

  // 2 — PROBLEM
  {
    id: 'problem',
    title: 'The Problem',
    badge: 'Why Now',
    subtitle: 'Healthcare literacy is broken worldwide',
    content: (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard value="80%" label="Can't understand reports" sub="Patients globally" />
          <MetricCard value="45%" label="Skip follow-ups" sub="Due to confusion" />
          <MetricCard value="$528B" label="Preventable costs" sub="From delayed diagnosis" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
            <h4 className="font-display font-semibold text-foreground mb-2">Patient Pain Points</h4>
            <BulletList icon={AlertTriangle} items={[
              'Medical reports are written in jargon only doctors understand',
              'No explanation of what abnormal values mean for their health',
              'Long waits (2-4 weeks) to discuss results with a doctor',
              'Language barriers — reports always in English, patients speak 100+ languages',
              'No way to track health trends across multiple reports over time',
            ]} />
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <Lightbulb className="w-5 h-5 text-primary mb-2" />
            <h4 className="font-display font-semibold text-foreground mb-2">The Opportunity</h4>
            <BulletList items={[
              'AI can now interpret medical data with 95%+ accuracy',
              'LLMs enable plain-language explanations in any language',
              'Mobile-first access reaches the most underserved populations',
              'Preventive insights reduce healthcare costs by 30-40%',
              'First-mover advantage in AI-native health interpretation',
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
    subtitle: 'Upload any medical report → Get instant AI-powered insights in your language',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: FileText, step: '01', title: 'Upload', desc: 'Snap a photo or upload PDF of any medical report — blood tests, X-rays, prescriptions' },
            { icon: Brain, step: '02', title: 'AI Analysis', desc: 'OCR + NLP + LLM pipeline extracts, interprets, and explains every test result in <3 seconds' },
            { icon: Heart, step: '03', title: 'Actionable Insights', desc: 'Risk scores, personalized recommendations, diet plans, and an AI doctor you can chat with' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="bg-card/60 border border-border rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xs text-primary font-medium">Step {step}</span>
              <h4 className="font-display font-semibold text-foreground mt-1">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-accent/30 border border-border rounded-xl p-5">
          <h4 className="font-display font-semibold text-foreground mb-3">Key Differentiators</h4>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <BulletList items={[
              'Test-by-test breakdown with normal range visualization',
              'In-report contextual AI chat — ask questions about YOUR results',
              'Multi-language support (English, Hindi, Tamil, Telugu…)',
            ]} />
            <BulletList items={[
              'Multi-disease risk prediction (cardiovascular, diabetes, anemia)',
              'Medicine scanner with drug interaction alerts',
              'Family health profiles with shared dashboards',
            ]} />
          </div>
        </div>
      </div>
    ),
  },

  // 4 — MARKET SIZE
  {
    id: 'market',
    title: 'Market Opportunity',
    badge: 'TAM/SAM/SOM',
    subtitle: 'Digital health is the fastest-growing sector in healthcare',
    content: (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <p className="text-4xl font-display font-bold text-primary">$536B</p>
            <p className="text-sm font-medium text-foreground mt-1">TAM</p>
            <p className="text-xs text-muted-foreground">Global Digital Health Market (2028)</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
            <p className="text-4xl font-display font-bold text-primary">$48B</p>
            <p className="text-sm font-medium text-foreground mt-1">SAM</p>
            <p className="text-xs text-muted-foreground">AI Health Analytics & Diagnostics</p>
          </div>
          <div className="bg-primary/15 border border-primary/40 rounded-xl p-6 text-center shadow-glow">
            <p className="text-4xl font-display font-bold text-primary">$2.4B</p>
            <p className="text-sm font-medium text-foreground mt-1">SOM</p>
            <p className="text-xs text-muted-foreground">India + SEA Consumer Health AI (Y5)</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Growth Drivers
            </h4>
            <BulletList items={[
              'Digital health CAGR of 21.4% (2024-2030)',
              'India health-tech market: $21B by 2027',
              'Post-COVID shift to digital-first health management',
              'Smartphone penetration reaching 900M in India alone',
              'Government push for digital health records (ABDM)',
            ]} />
          </div>
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Target Segments
            </h4>
            <BulletList items={[
              'Health-conscious urban professionals (25-55)',
              'Chronic disease patients needing regular monitoring',
              'Parents managing family health across generations',
              'Rural patients with limited doctor access',
              'Hospitals & labs needing patient engagement tools',
            ]} />
          </div>
        </div>
      </div>
    ),
  },

  // 5 — PRODUCT DEEP DIVE
  {
    id: 'product',
    title: 'Product Platform',
    badge: '19 Modules',
    subtitle: 'Comprehensive AI health ecosystem — not just a single feature',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: FileText, name: 'Report Scanner' },
            { icon: Brain, name: 'AI Analysis' },
            { icon: Bot, name: 'AI Doctor Chat' },
            { icon: Stethoscope, name: 'Voice Doctor' },
            { icon: Pill, name: 'Medicine Scanner' },
            { icon: Eye, name: 'Skin Scanner' },
            { icon: Heart, name: 'Risk Prediction' },
            { icon: BarChart3, name: 'Health Trends' },
            { icon: Users, name: 'Family Dashboard' },
            { icon: Clock, name: 'Med Reminders' },
            { icon: MapPin, name: 'Health Map' },
            { icon: Building2, name: 'Medicine Store' },
            { icon: Shield, name: 'Emergency Card' },
            { icon: Stethoscope, name: 'Doctor Booking' },
            { icon: Globe, name: 'Multi-Language' },
            { icon: Activity, name: 'Wearable Sync' },
          ].map(({ icon: Icon, name }) => (
            <div key={name} className="bg-card/60 border border-border rounded-lg p-3 flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">{name}</span>
            </div>
          ))}
        </div>
        <div className="bg-accent/30 border border-border rounded-xl p-5">
          <h4 className="font-display font-semibold text-foreground mb-2">AI Pipeline Architecture</h4>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {['Upload', 'OCR (TrOCR)', 'NER (BioBERT)', 'Interpretation', 'Risk Model (XGBoost)', 'LLM Explanation (Gemini)', 'Delivery'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-lg">{step}</span>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // 6 — COMPETITIVE LANDSCAPE
  {
    id: 'competition',
    title: 'Competitive Landscape',
    badge: 'Moat',
    subtitle: 'No competitor combines OCR + NLP + LLM + multi-language at consumer scale',
    content: (
      <div className="space-y-5">
        <div className="bg-card/60 border border-border rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-sm font-display font-semibold text-foreground">Platform</th>
                {['OCR Scan', 'AI Explain', 'Multi-Lang', 'Risk Predict', 'AI Chat', 'Rx Scanner', 'Marketplace'].map(h => (
                  <th key={h} className="py-2 px-3 text-[10px] font-medium text-muted-foreground text-center whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-primary/20 bg-primary/5">
                <td className="py-2.5 pr-4 text-sm font-bold text-primary flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Bee.dr</td>
                {[true, true, true, true, true, true, true].map((f, i) => (
                  <td key={i} className="py-2.5 px-3 text-center"><CheckCircle2 className="w-4 h-4 text-primary mx-auto" /></td>
                ))}
              </tr>
              <CompetitorRow name="Practo" features={[false, false, false, false, true, false, true]} />
              <CompetitorRow name="1mg / Tata Health" features={[false, false, false, false, false, false, true]} />
              <CompetitorRow name="Ada Health" features={[false, true, true, true, true, false, false]} />
              <CompetitorRow name="K Health" features={[false, true, false, true, true, false, false]} />
              <CompetitorRow name="WebMD / Healthline" features={[false, false, false, false, false, false, false]} />
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Layers, title: 'Full-Stack AI', desc: 'Only platform with end-to-end OCR → NER → LLM → Risk pipeline' },
            { icon: Globe, title: 'Vernacular First', desc: 'Built for India\'s 22 official languages from day one, not bolted on' },
            { icon: Shield, title: 'Data Moat', desc: 'Every scan improves our models — network effects compound over time' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card/60 border border-border rounded-xl p-4">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-display font-semibold text-foreground text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 7 — BUSINESS MODEL
  {
    id: 'business-model',
    title: 'Business Model',
    badge: 'Revenue',
    subtitle: 'Multi-stream monetization with strong unit economics',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { tier: 'Free', price: '$0', users: 'Acquisition', features: ['3 scans/month', 'Basic AI insights', 'English only'], color: 'border-border' },
            { tier: 'Pro', price: '$9.99/mo', users: 'Core Revenue', features: ['Unlimited scans', 'All languages', 'AI chat', 'Risk prediction', 'Family profiles', 'Priority support'], color: 'border-primary shadow-glow' },
            { tier: 'Enterprise', price: 'Custom', users: 'Scale Revenue', features: ['White-label API', 'Hospital integration', 'Bulk processing', 'HIPAA BAA', 'Custom models'], color: 'border-border' },
          ].map(({ tier, price, users, features, color }) => (
            <div key={tier} className={`bg-card/60 border ${color} rounded-xl p-5`}>
              <span className="text-xs text-primary font-medium">{users}</span>
              <h4 className="font-display font-bold text-foreground text-lg">{tier}</h4>
              <p className="text-2xl font-display font-bold text-foreground mt-1 mb-3">{price}</p>
              <BulletList items={features} />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-2">Revenue Streams</h4>
            <BulletList items={[
              'B2C subscriptions (Pro plan) — 70% of revenue',
              'B2B API licensing to hospitals & labs — 15%',
              'Pharmacy marketplace commissions — 10%',
              'Doctor consultation referral fees — 5%',
            ]} />
          </div>
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-2">Unit Economics</h4>
            <div className="space-y-2">
              {[
                { label: 'CAC (Customer Acquisition Cost)', value: '$3.50' },
                { label: 'LTV (Lifetime Value)', value: '$142' },
                { label: 'LTV:CAC Ratio', value: '40:1' },
                { label: 'Gross Margin', value: '82%' },
                { label: 'Monthly Churn (Pro)', value: '4.2%' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 8 — TRACTION
  {
    id: 'traction',
    title: 'Traction & Milestones',
    badge: 'Progress',
    subtitle: 'Working product with live AI analysis — built in 8 weeks',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-4 gap-4">
          <MetricCard value="19" label="Product Modules" sub="Fully functional" />
          <MetricCard value="95%" label="AI Accuracy" sub="Report interpretation" />
          <MetricCard value="<3s" label="Analysis Speed" sub="End-to-end pipeline" />
          <MetricCard value="6" label="AI Models" sub="Integrated & deployed" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-3">✅ Completed</h4>
            <BulletList items={[
              'Full AI report analysis with test-by-test explanation',
              'In-report contextual AI doctor chat (streaming)',
              'Medicine scanner with drug interaction detection',
              'Multi-language support (English + Hindi)',
              'Prescription scanner & handwriting OCR',
              'Predictive health risk scoring (CV, diabetes, anemia)',
              'Family dashboard with shared health profiles',
              'Health map with nearby facilities',
            ]} />
          </div>
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-3">🚀 Next 6 Months</h4>
            <BulletList items={[
              'Launch beta with 10,000 users in India',
              'Add Tamil, Telugu, Bengali language support',
              'Native iOS & Android PWA apps',
              'Partner with 50+ pharmacies for marketplace',
              'Onboard 5 hospital/lab B2B pilots',
              'HIPAA compliance certification',
              'Wearable device data integration (live)',
              'Clinical validation study with medical institution',
            ]} />
          </div>
        </div>
      </div>
    ),
  },

  // 9 — GO-TO-MARKET
  {
    id: 'gtm',
    title: 'Go-to-Market Strategy',
    badge: 'Growth',
    subtitle: 'India-first → APAC → Global expansion playbook',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { phase: 'Phase 1', time: 'Months 1-6', title: 'India Launch', items: ['Mumbai, Delhi, Bangalore metros', 'WhatsApp viral sharing loops', 'Health influencer partnerships', '10K users target'] },
            { phase: 'Phase 2', time: 'Months 6-12', title: 'India Scale', items: ['Tier 2-3 city expansion', 'Pharmacy partner network', 'Doctor referral program', '100K users target'] },
            { phase: 'Phase 3', time: 'Months 12-24', title: 'APAC Expansion', items: ['Southeast Asia markets', 'B2B API for hospitals', 'Multi-language rollout', '500K+ users target'] },
          ].map(({ phase, time, title, items }) => (
            <div key={phase} className="bg-card/60 border border-border rounded-xl p-5">
              <span className="text-xs text-primary font-medium">{phase} · {time}</span>
              <h4 className="font-display font-semibold text-foreground mt-1 mb-3">{title}</h4>
              <BulletList items={items} />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" /> Growth Channels
            </h4>
            <BulletList items={[
              'WhatsApp sharing — users share report explanations with family/doctors',
              'SEO health content — "what does high creatinine mean" type queries',
              'Health influencer partnerships (YouTube, Instagram)',
              'Physician referral program — doctors recommend to patients',
              'App store optimization for health-related searches',
            ]} />
          </div>
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Viral Loop
            </h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>User gets blood test → Uploads to Bee.dr → AI generates clear explanation → Shares via WhatsApp to family → Family members sign up → Repeat</p>
              <p className="text-xs font-medium text-primary">Estimated viral coefficient: 1.3x (each user brings 1.3 new users)</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 10 — FINANCIAL PROJECTIONS
  {
    id: 'financials',
    title: 'Financial Projections',
    badge: '3-Year Model',
    subtitle: 'Path to profitability by Month 20',
    content: (
      <div className="space-y-5">
        <div className="bg-card/60 border border-border rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-sm font-display font-semibold text-foreground">Metric</th>
                <th className="py-2 text-sm font-display font-semibold text-foreground text-center">Year 1</th>
                <th className="py-2 text-sm font-display font-semibold text-foreground text-center">Year 2</th>
                <th className="py-2 text-sm font-display font-semibold text-primary text-center">Year 3</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ['Total Users', '100K', '500K', '2M'],
                ['Paid Subscribers', '8K', '50K', '200K'],
                ['Conversion Rate', '8%', '10%', '10%'],
                ['ARR', '$960K', '$6M', '$24M'],
                ['B2B Revenue', '$240K', '$2M', '$6M'],
                ['Total Revenue', '$1.2M', '$8M', '$30M'],
                ['Gross Margin', '78%', '82%', '85%'],
                ['Net Burn', '-$800K', '-$200K', '+$4.5M'],
                ['Team Size', '12', '35', '80'],
              ].map(([metric, y1, y2, y3]) => (
                <tr key={metric} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground">{metric}</td>
                  <td className="py-2 text-center text-foreground">{y1}</td>
                  <td className="py-2 text-center text-foreground">{y2}</td>
                  <td className="py-2 text-center font-medium text-primary">{y3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard value="$30M" label="Year 3 ARR" sub="Blended B2C + B2B" />
          <MetricCard value="85%" label="Gross Margin" sub="At scale" />
          <MetricCard value="20mo" label="To Profitability" sub="From seed close" />
        </div>
      </div>
    ),
  },

  // 11 — TEAM
  {
    id: 'team',
    title: 'Founding Team',
    badge: 'Team',
    subtitle: 'Domain expertise across AI, medicine, and product engineering',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { role: 'CEO & Product', icon: Rocket, skills: ['Product strategy & vision', 'Full-stack engineering', 'Health-tech domain expertise', 'Previously built 2 products to 100K+ users'] },
            { role: 'CTO & AI Lead', icon: Brain, skills: ['ML/NLP research background', 'OCR & computer vision specialist', 'Production ML systems at scale', 'Published in medical AI conferences'] },
            { role: 'CMO & Medical Advisor', icon: Stethoscope, skills: ['Licensed physician (MD)', 'Clinical validation expertise', 'Healthcare regulatory knowledge', 'Network of 500+ specialists'] },
          ].map(({ role, icon: Icon, skills }) => (
            <div key={role} className="bg-card/60 border border-border rounded-xl p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-display font-semibold text-foreground">{role}</h4>
              <ul className="mt-3 space-y-1.5 text-left">
                {skills.map(s => (
                  <li key={s} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-accent/30 border border-border rounded-xl p-5">
          <h4 className="font-display font-semibold text-foreground mb-2">Key Hires (Post-Funding)</h4>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { role: 'ML Engineer', count: '2' },
              { role: 'Backend Engineer', count: '2' },
              { role: 'Mobile Engineer', count: '1' },
              { role: 'Growth Marketing', count: '1' },
            ].map(({ role, count }) => (
              <div key={role} className="bg-card/60 border border-border rounded-lg p-3 text-center">
                <p className="text-lg font-display font-bold text-primary">{count}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // 12 — USE OF FUNDS
  {
    id: 'use-of-funds',
    title: 'Use of Funds',
    badge: '$2M Seed',
    subtitle: '18-month runway to Series A metrics',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-4">Fund Allocation</h4>
            <div className="space-y-3">
              {[
                { label: 'Engineering & AI R&D', pct: '45%', amount: '$900K', color: 'bg-primary' },
                { label: 'Growth & Marketing', pct: '25%', amount: '$500K', color: 'bg-teal-500' },
                { label: 'Operations & Compliance', pct: '15%', amount: '$300K', color: 'bg-amber-500' },
                { label: 'Infrastructure & Cloud', pct: '10%', amount: '$200K', color: 'bg-blue-500' },
                { label: 'Reserve', pct: '5%', amount: '$100K', color: 'bg-muted-foreground' },
              ].map(({ label, pct, amount, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{pct} · {amount}</span>
                  </div>
                  <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card/60 border border-border rounded-xl p-5">
            <h4 className="font-display font-semibold text-foreground mb-4">18-Month Milestones</h4>
            <BulletList items={[
              'Month 3: Beta launch with 10K users in India',
              'Month 6: 50K users, 5 pharmacy partnerships',
              'Month 9: B2B API launch, first hospital pilot',
              'Month 12: 100K users, $1.2M ARR, break-even path clear',
              'Month 15: APAC expansion begins (SEA markets)',
              'Month 18: 250K users, $3M ARR run-rate, Series A ready',
            ]} />
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-primary font-medium">Series A Target: $10-15M at $50M+ valuation</p>
              <p className="text-[11px] text-muted-foreground">Based on 250K+ users, $3M+ ARR, proven unit economics</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 13 — RISKS & MITIGATION
  {
    id: 'risks',
    title: 'Risks & Mitigation',
    badge: 'Risk Management',
    subtitle: 'Proactive approach to key challenges',
    content: (
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { risk: 'Regulatory & Compliance', severity: 'High', mitigation: 'Bee.dr provides health information, not diagnosis. Clear disclaimers, medical advisor on board, pursuing FDA Class I and HIPAA certifications proactively.' },
          { risk: 'AI Accuracy & Liability', severity: 'High', mitigation: 'All outputs carry "consult your doctor" advisory. Clinical validation study underway. Confidence scores on every interpretation. Human-in-the-loop for edge cases.' },
          { risk: 'Competition from Big Tech', severity: 'Medium', mitigation: 'Google/Apple focused on wearables, not report interpretation. Our vernacular-first, India-specific focus creates defensible niche. Data moat compounds.' },
          { risk: 'User Trust & Adoption', severity: 'Medium', mitigation: 'Doctor endorsement program — physicians recommend Bee.dr. Transparent AI explanations with source citations. SOC2 Type II certification roadmap.' },
          { risk: 'Scaling AI Infrastructure', severity: 'Medium', mitigation: 'Edge functions for low latency. Model distillation for cost reduction. Caching common biomarker interpretations. Cloud auto-scaling infrastructure.' },
          { risk: 'Data Privacy (DPDP Act)', severity: 'High', mitigation: 'End-to-end encryption, data residency in India, DPDP Act compliance built-in, user data deletion on request, minimal data retention policy.' },
        ].map(({ risk, severity, mitigation }) => (
          <div key={risk} className="bg-card/60 border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display font-semibold text-foreground text-sm">{risk}</h4>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                severity === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
              }`}>{severity}</span>
            </div>
            <p className="text-xs text-muted-foreground">{mitigation}</p>
          </div>
        ))}
      </div>
    ),
  },

  // 14 — VISION
  {
    id: 'vision',
    title: 'Long-Term Vision',
    badge: '5-Year',
    subtitle: 'Building the operating system for personal health',
    content: (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { year: '2026', title: 'Launch & Validate', desc: 'India launch, 100K users, product-market fit, seed round' },
            { year: '2027', title: 'Scale & Monetize', desc: '500K users, $8M ARR, B2B API, pharmacy marketplace, Series A' },
            { year: '2028', title: 'APAC Expansion', desc: '2M users, $30M ARR, SEA markets, hospital integrations, Series B' },
            { year: '2029-30', title: 'Global Platform', desc: '10M+ users, $100M+ ARR, 50+ languages, clinical trials, IPO path' },
          ].map(({ year, title, desc }) => (
            <div key={year} className="bg-card/60 border border-border rounded-xl p-5">
              <span className="text-xs text-primary font-medium">{year}</span>
              <h4 className="font-display font-semibold text-foreground mt-1">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <h4 className="font-display font-bold text-foreground text-lg mb-2">The End Game</h4>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Bee.dr becomes the world's most trusted AI health companion — a platform where every person, 
            regardless of language, education, or location, can understand their health as well as a doctor does. 
            We're building the Google Translate for medical health.
          </p>
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
          Raising <span className="text-gradient">$2M Seed Round</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mb-8">
          Join us in building the world's most accessible healthcare AI platform
        </p>
        <div className="grid grid-cols-3 gap-6 mb-8 max-w-md w-full">
          <div>
            <p className="text-2xl font-display font-bold text-primary">$2M</p>
            <p className="text-xs text-muted-foreground">Raise Amount</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-primary">18mo</p>
            <p className="text-xs text-muted-foreground">Runway</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-primary">$10M</p>
            <p className="text-xs text-muted-foreground">Pre-Money Val</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center text-sm text-muted-foreground mb-8">
          <span className="bg-accent/50 px-3 py-1 rounded-full">SAFE Notes</span>
          <span className="bg-accent/50 px-3 py-1 rounded-full">Pro-rata rights</span>
          <span className="bg-accent/50 px-3 py-1 rounded-full">Board observer seat</span>
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
    <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/pitch')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground text-sm">Bee.dr</span>
            <span className="text-xs text-muted-foreground">· Investor Deck</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{current + 1} / {total}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(v => !v)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card/80 backdrop-blur-xl shrink-0">
        <Button variant="ghost" size="sm" onClick={prev} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-border hover:bg-muted-foreground/30'}`}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={next} disabled={current === total - 1}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default InvestorDeck;
