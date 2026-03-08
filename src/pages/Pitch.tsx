import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Activity, Brain, Shield, TrendingUp, Users, Zap, Globe,
  FileText, Bot, Scan, Heart, Pill, ChevronRight, ArrowRight,
  Smartphone, Cloud, BarChart3, Target,
  DollarSign, Rocket, CheckCircle2, Star, MessageCircle,
  BookOpen, Languages, Lightbulb, Eye, Sparkles
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const PitchPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background gradient-mesh overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50">
        <div className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold text-foreground tracking-tight">Bee.dr</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate('/auth')}>Sign In</Button>
              <Button size="sm" className="gradient-primary text-primary-foreground rounded-xl shadow-glow" onClick={() => navigate('/auth')}>
                Get Started <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 relative">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-subtle text-xs font-semibold text-primary mb-6 border border-primary/20">
              <Zap className="w-3 h-3" /> AI-Powered Medical Intelligence Platform
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-tight">
              Your Health,<br />
              <span className="text-gradient">Decoded by AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Bee.dr transforms complex medical reports into clear, actionable insights — with test-by-test explanations,
              risk predictions, and an AI doctor you can chat with, all in your language.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow rounded-2xl px-8" onClick={() => navigate('/auth')}>
                Try Bee.dr Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl glass-subtle border-white/20 px-8"
                onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}>
                See How It Works
              </Button>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-16 max-w-3xl mx-auto">
            {[
              { value: '95%', label: 'Accuracy Rate', icon: Target },
              { value: '<3s', label: 'Analysis Time', icon: Zap },
              { value: '50+', label: 'Biomarkers', icon: Activity },
              { value: '2+', label: 'Languages', icon: Globe },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="glass-card p-4 text-center group hover:shadow-glow transition-all">
                <Icon className="w-4 h-4 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Product Feature */}
      <section id="product" className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-primary border border-primary/20 mb-4">
              <Star className="w-3 h-3" /> Core Innovation
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Detailed Report Explanation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every test result is broken down into simple language with normal range comparisons,
              abnormal value highlights, and personalized recommendations
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Eye, title: 'Test-by-Test Breakdown', desc: 'Each result is individually explained with what it measures and what your value means for your health' },
              { icon: BarChart3, title: 'Normal Range Comparison', desc: 'Visual bars show where your value falls relative to the normal range — instantly spot what needs attention' },
              { icon: BookOpen, title: 'Medical Terms Simplified', desc: 'Complex medical terminology is translated into plain language anyone can understand' },
              { icon: Shield, title: 'Abnormal Value Alerts', desc: 'High, low, and critical values are highlighted with color-coded severity indicators' },
              { icon: Heart, title: 'Health Risk Analysis', desc: 'AI identifies potential health risks like cardiovascular disease, diabetes, and anemia from your biomarkers' },
              { icon: Lightbulb, title: 'Action Plan', desc: 'Personalized diet, exercise, sleep, and medication recommendations based on your specific results' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="glass-card p-6 group hover:shadow-glow transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* In-Report AI Chat */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-primary border border-primary/20 mb-4">
              <MessageCircle className="w-3 h-3" /> In-Report Chat
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Ask AI About Your Report</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              An AI chat assistant is embedded right inside your report — ask questions, get contextual answers,
              and receive proactive follow-up suggestions
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            <motion.div {...fadeUp} className="glass-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> Contextual Q&A
              </h3>
              <p className="text-sm text-muted-foreground mb-4">The AI reads your specific report data and provides personalized answers:</p>
              <div className="space-y-2">
                {[
                  "Is this result dangerous?",
                  "What should I eat to improve this?",
                  "Do I need to see a doctor?",
                  "What does this test mean?",
                  "How can I improve this value?",
                ].map((q) => (
                  <div key={q} className="text-xs glass-subtle border border-white/10 rounded-xl px-3 py-2.5 text-foreground">
                    💬 {q}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" /> Multi-Language Support
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full report explanations available in English and Hindi, with more regional languages coming:
              </p>
              <div className="space-y-2">
                {[
                  { flag: '🇬🇧', lang: 'English', status: 'Available' },
                  { flag: '🇮🇳', lang: 'हिन्दी (Hindi)', status: 'Available' },
                  { flag: '🇮🇳', lang: 'தமிழ் (Tamil)', status: 'Coming Q3' },
                  { flag: '🇮🇳', lang: 'తెలుగు (Telugu)', status: 'Coming Q3' },
                  { flag: '🇮🇳', lang: 'বাংলা (Bengali)', status: 'Coming Q4' },
                ].map((l) => (
                  <div key={l.lang} className="flex items-center justify-between text-xs glass-subtle border border-white/10 rounded-xl px-3 py-2.5">
                    <span className="text-foreground">{l.flag} {l.lang}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.status === 'Available' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Full Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="flex items-center gap-2 justify-center mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Complete Health Platform</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Eight powerful modules working together</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {[
              { icon: Scan, title: 'Smart OCR', desc: 'TrOCR + handwriting recognition for any medical document' },
              { icon: Brain, title: 'AI Interpretation', desc: 'BioBERT-powered biomarker analysis' },
              { icon: Bot, title: 'AI Doctor Chat', desc: 'Contextual chat embedded in reports' },
              { icon: Heart, title: 'Risk Prediction', desc: 'Multi-disease risk scoring from biomarkers' },
              { icon: Pill, title: 'Rx Analysis', desc: 'Drug interaction & dosage checks' },
              { icon: TrendingUp, title: 'Health Tracking', desc: 'Biomarker trends over time' },
              { icon: FileText, title: 'Report Explanation', desc: 'Test-by-test plain language breakdown' },
              { icon: Globe, title: 'Multi-Language', desc: 'English + Hindi with more coming' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.06 }}
                className="glass-card p-5 hover:shadow-glow transition-all group">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-0.5">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">System Architecture</h2>
            <p className="text-muted-foreground">Production-grade infrastructure built for global scale</p>
          </motion.div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
            {[
              { icon: Smartphone, title: 'Frontend', items: ['React + TypeScript PWA', 'Framer Motion animations', 'Responsive mobile-first', 'Real-time SSE streaming'], color: 'from-primary to-blue-glow' },
              { icon: Cloud, title: 'Backend', items: ['Edge Functions (Deno)', 'PostgreSQL + RLS', 'Secure file storage', 'Multi-region deployment'], color: 'from-secondary to-teal' },
              { icon: Brain, title: 'AI/NLP Pipeline', items: ['TrOCR → text extraction', 'BioBERT → entity recognition', 'Gemini → interpretation', 'XGBoost → risk scoring'], color: 'from-amber-400 to-orange-500' },
              { icon: Shield, title: 'Security & Compliance', items: ['End-to-end encryption', 'HIPAA compliance ready', 'Row-level security', 'SOC2 Type II roadmap'], color: 'from-emerald-400 to-green-600' },
            ].map(({ icon: Icon, title, items, color }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{title}</h3>
                </div>
                <ul className="space-y-2.5 relative z-10">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical NLP Pipeline */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Medical NLP Pipeline</h2>
            <p className="text-muted-foreground">7-stage intelligent processing in under 3 seconds</p>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Document Ingestion', desc: 'PDF/image upload with format detection, EXIF cleaning, and preprocessing' },
              { step: '02', title: 'TrOCR Extraction', desc: 'Transformer-based OCR for printed text + IAM-trained model for doctor handwriting' },
              { step: '03', title: 'BioBERT NER', desc: 'Named entity recognition extracts biomarkers, values, units, and reference ranges' },
              { step: '04', title: 'Clinical Interpretation', desc: 'Reference range comparison, delta analysis vs prior reports, clinical significance scoring' },
              { step: '05', title: 'Risk Modeling', desc: 'XGBoost + neural network ensemble for cardiovascular, diabetes, anemia risk prediction' },
              { step: '06', title: 'LLM Explanation', desc: 'Gemini generates plain-language explanations, medical term definitions, and personalized recommendations in the user\'s language' },
              { step: '07', title: 'Structured Delivery', desc: 'Results with confidence scores, suggested follow-up questions, and actionable next steps' },
            ].map(({ step, title, desc }, i) => (
              <motion.div key={step} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 mb-4 last:mb-0">
                <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0 text-primary-foreground text-sm font-display font-bold shadow-glow">
                  {step}
                </div>
                <div className="flex-1 glass-card p-4">
                  <h4 className="font-display font-semibold text-foreground text-sm">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Business Model</h2>
            <p className="text-muted-foreground">Sustainable growth through value-aligned pricing</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { tier: 'Free', price: '$0', features: ['3 scans/month', 'Basic AI insights', 'English only', 'Limited chat'], highlight: false },
              { tier: 'Pro', price: '$9.99', features: ['Unlimited scans', 'Full report explanation', 'Multi-language', 'Unlimited AI chat', 'Health trends', 'Priority processing'], highlight: true },
              { tier: 'Enterprise', price: 'Custom', features: ['API access', 'Hospital integrations', 'Bulk processing', 'Custom languages', 'Dedicated support', 'HIPAA BAA'], highlight: false },
            ].map(({ tier, price, features, highlight }) => (
              <motion.div key={tier} {...fadeUp}
                className={`rounded-2xl p-6 relative overflow-hidden ${highlight
                  ? 'gradient-hero text-white shadow-glow'
                  : 'glass-card'
                }`}>
                {highlight && (
                  <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                    <span className="text-xs font-semibold text-white/80 mb-2 block">Most Popular</span>
                  </>
                )}
                <h3 className={`font-display font-bold text-lg ${highlight ? 'text-white' : 'text-foreground'}`}>{tier}</h3>
                <p className={`text-3xl font-display font-bold mt-1 mb-5 ${highlight ? 'text-white' : 'text-foreground'}`}>
                  {price}<span className={`text-sm font-normal ${highlight ? 'text-white/60' : 'text-muted-foreground'}`}>/mo</span>
                </p>
                <ul className="space-y-2.5">
                  {features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${highlight ? 'text-white/80' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${highlight ? 'text-white/70' : 'text-primary'}`} /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">MVP Development Roadmap</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              { q: 'Q1 2026', title: 'Foundation', items: ['Auth + upload flow', 'OCR pipeline MVP', 'Basic AI interpretation', 'Report explanation UI'], color: 'from-primary to-blue-glow' },
              { q: 'Q2 2026', title: 'Intelligence', items: ['AI Doctor chat (streaming)', 'In-report contextual chat', 'Hindi language support', 'Risk prediction models'], color: 'from-secondary to-teal' },
              { q: 'Q3 2026', title: 'Scale', items: ['iOS/Android PWA', 'Tamil, Telugu support', 'Health trends dashboard', 'Prescription analysis'], color: 'from-amber-400 to-orange-500' },
              { q: 'Q4 2026', title: 'Enterprise', items: ['B2B API launch', 'Hospital integrations', 'Clinical trial matching', 'Global expansion (10+ languages)'], color: 'from-emerald-400 to-green-600' },
            ].map(({ q, title, items, color }, i) => (
              <motion.div key={q} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-6 translate-x-6`} />
                <span className="text-xs font-semibold text-primary">{q}</span>
                <h4 className="font-display font-semibold text-foreground mt-1 mb-3">{title}</h4>
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Go-to-Market */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Go-to-Market Strategy</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Target, title: 'Target Market', desc: 'Health-conscious individuals 25-55, chronic disease patients, parents managing family health in India & globally. $50B+ TAM in digital health.' },
              { icon: Rocket, title: 'Growth Channels', desc: 'SEO health content, health influencer partnerships, physician referral program, app store optimization, WhatsApp viral sharing.' },
              { icon: Users, title: 'User Acquisition', desc: 'Freemium model drives viral growth. Users share report explanations with family & doctors via WhatsApp, creating organic loops.' },
              { icon: DollarSign, title: 'Revenue Targets', desc: 'Year 1: 100K users, $1.2M ARR. Year 2: 500K users, $8M ARR. Year 3: 2M users, $30M ARR. Path to profitability by Year 2.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 group hover:shadow-glow transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-foreground mb-2">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Pitch Deck */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Investor Pitch Deck</h2>
            <p className="text-muted-foreground">12-slide deck structure</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { slide: '01', title: 'Problem', desc: '80% of patients can\'t understand their medical reports' },
              { slide: '02', title: 'Solution', desc: 'AI-powered report explanation in plain language' },
              { slide: '03', title: 'Demo', desc: 'Live product walkthrough — upload → analysis → chat' },
              { slide: '04', title: 'Market Size', desc: '$50B+ digital health TAM, 1B+ underserved patients globally' },
              { slide: '05', title: 'Product', desc: 'OCR + NLP + LLM pipeline with multi-language support' },
              { slide: '06', title: 'Traction', desc: 'Working prototype, patent-pending ML pipeline' },
              { slide: '07', title: 'Business Model', desc: 'Freemium B2C + Enterprise B2B API licensing' },
              { slide: '08', title: 'Competition', desc: 'First to combine OCR + NLP + LLM + multi-language at consumer scale' },
              { slide: '09', title: 'GTM Strategy', desc: 'India-first → APAC → Global, WhatsApp viral distribution' },
              { slide: '10', title: 'Team', desc: 'AI/ML + Medicine + Product founding team' },
              { slide: '11', title: 'Financials', desc: '3-year projection: $30M ARR, 2M users, path to profitability' },
              { slide: '12', title: 'The Ask', desc: '$2M seed round for product + team + market expansion' },
            ].map(({ slide, title, desc }, i) => (
              <motion.div key={slide} {...fadeUp} transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-start gap-3 group hover:shadow-glow transition-all">
                <span className="text-xs font-display font-bold text-primary-foreground gradient-primary rounded-xl w-9 h-9 flex items-center justify-center shrink-0 shadow-glow">
                  {slide}
                </span>
                <div>
                  <h4 className="font-display font-semibold text-foreground text-sm">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp}
            className="max-w-2xl mx-auto text-center relative overflow-hidden rounded-3xl gradient-hero p-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-16 -translate-x-16" />
            <div className="relative z-10">
              <Star className="w-8 h-8 text-white/80 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Seeking <span className="text-white/90">$2M Seed Round</span>
              </h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                Join us in building the world's most accessible healthcare AI platform. Working prototype live now
                with real AI analysis, multi-language support, and contextual AI doctor chat.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 shadow-lg" onClick={() => navigate('/auth')}>
                  Try the Product <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl px-8" onClick={() => navigate('/investor-deck')}>
                  View Full Deck <FileText className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="glass border-t border-white/20">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Bee.dr</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Bee.dr Health Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PitchPage;
