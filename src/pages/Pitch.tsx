import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Activity, Brain, Shield, TrendingUp, Users, Zap, Globe,
  FileText, Bot, Scan, Heart, Pill, ChevronRight, ArrowRight,
  Target, DollarSign, Rocket, CheckCircle2, Star, MessageCircle,
  Sparkles, Stethoscope, ShoppingCart, BarChart3, Layers,
  ArrowUpRight, Play, ArrowDown, Database, Server, HardDrive,
  Cloud, Container, RefreshCw, Building2, Code, Cpu, AlertTriangle,
  Terminal, Table2, Eye, Microscope
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
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-subtle text-xs font-semibold text-primary mb-6 border border-primary/20">
              <Zap className="w-3 h-3" /> AI Health Intelligence Platform
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-tight">
              Understand your health<br />
              <span className="text-gradient">data instantly.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              Make healthcare information understandable for everyone. Bee.dr transforms complex medical reports
              into clear insights with AI analysis, doctor chat, and medicine intelligence.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="flex gap-3 justify-center flex-wrap mb-16">
            <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow rounded-2xl px-8" onClick={() => navigate('/auth')}>
              Try Bee.dr Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl glass-subtle border-white/20 px-8"
              onClick={() => navigate('/investor-deck')}>
              <Play className="w-4 h-4 mr-2" /> View Pitch Deck
            </Button>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { value: '$500B+', label: 'Digital Health Market', icon: TrendingUp },
              { value: '<3s', label: 'Analysis Time', icon: Zap },
              { value: '50+', label: 'Biomarkers', icon: Activity },
              { value: '15', label: 'AI Modules', icon: Brain },
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

      {/* Problem */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-destructive/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-destructive border border-destructive/20 mb-4">
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Healthcare information is broken</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Millions of people cannot understand medical reports, doctor handwriting, medicines, or disease risks
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp} className="glass-card p-6 mb-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                  <span className="glass-subtle px-3 py-2 rounded-xl text-foreground font-medium">Patient receives blood test report</span>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <span className="glass-subtle px-3 py-2 rounded-xl text-foreground font-medium">Cannot understand results</span>
                  <ArrowRight className="w-4 h-4 text-destructive shrink-0" />
                  <span className="bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl text-destructive font-medium">Anxiety + confusion</span>
                </div>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: FileText, text: 'Medical reports written in jargon only doctors understand' },
                { icon: Stethoscope, text: 'Long waits (2-4 weeks) to discuss results with a doctor' },
                { icon: Globe, text: 'Language barriers — reports always in English' },
                { icon: TrendingUp, text: 'No way to track health trends across reports over time' },
              ].map(({ icon: Icon, text }, i) => (
                <motion.div key={text} {...fadeUp} transition={{ delay: i * 0.08 }}
                  className="glass-card p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-primary border border-primary/20 mb-4">
              <Star className="w-3 h-3" /> The Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Three steps to clarity</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            {[
              { icon: FileText, step: '01', title: 'Upload Report', desc: 'Upload medical report PDF or photo', color: 'from-primary to-blue-glow' },
              { icon: Scan, step: '02', title: 'Scan Medicine', desc: 'Scan any medicine for instant info', color: 'from-secondary to-teal' },
              { icon: Bot, step: '03', title: 'Ask AI Doctor', desc: 'Chat with AI about your health', color: 'from-amber-400 to-orange-500' },
            ].map(({ icon: Icon, step, title, desc, color }, i) => (
              <motion.div key={step} {...fadeUp} transition={{ delay: i * 0.1 }}
                className={`relative overflow-hidden rounded-2xl p-6 text-center bg-gradient-to-br ${color} text-white shadow-lg`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-xs text-white/60 font-medium">Step {step}</span>
                <h3 className="font-display font-bold text-lg mt-1">{title}</h3>
                <p className="text-sm text-white/70 mt-1">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* User Flow */}
          <motion.div {...fadeUp} className="glass-card p-6 max-w-3xl mx-auto">
            <h4 className="font-display font-semibold text-foreground mb-4 text-center">Product Demo Flow</h4>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              {['Upload medical report', 'AI analyzes report', 'Simple explanation', 'Ask AI doctor questions', 'Suggested actions'].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="glass-subtle border border-white/10 text-foreground font-medium px-3 py-2 rounded-xl">{step}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-primary shrink-0" />}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="flex items-center gap-2 justify-center mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Core Modules</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {[
              { icon: FileText, title: 'AI Report Analysis', desc: 'Upload any medical report for instant AI-powered interpretation' },
              { icon: Bot, title: 'AI Doctor Chat', desc: 'Ask health questions and get contextual AI answers' },
              { icon: Scan, title: 'Medicine Scanner', desc: 'Scan any medicine for interactions, dosage, and alternatives' },
              { icon: BarChart3, title: 'Health Dashboard', desc: 'Track biomarkers, trends, and health scores over time' },
              { icon: Stethoscope, title: 'Doctor Consultations', desc: 'Book appointments with verified specialists' },
              { icon: ShoppingCart, title: 'Pharmacy Marketplace', desc: 'Order medicines with prescription verification' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.06 }}
                className="glass-card p-5 group hover:shadow-glow transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology / Architecture */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Technology</h2>
            <p className="text-muted-foreground">Key innovation: <span className="text-primary font-semibold">medical document intelligence</span></p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* AI Pipeline */}
            <motion.div {...fadeUp} className="glass-card p-6">
              <h4 className="font-display font-semibold text-foreground mb-4">AI Pipeline</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {['Medical Report', 'Document Layout Detection', 'OCR Extraction', 'Medical Entity Recognition', 'AI Interpretation', 'Risk Prediction', 'Recommendation Engine', 'AI Doctor Assistant'].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="glass-subtle border border-primary/20 text-foreground font-medium px-3 py-2 rounded-xl">{step}</span>
                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-primary shrink-0" />}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* RAG Pipeline */}
            <motion.div {...fadeUp} className="glass-card p-6">
              <h4 className="font-display font-semibold text-foreground mb-4">RAG AI Chat Pipeline</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {['User Question', 'Retrieve Report Data', 'Retrieve Medical Knowledge', 'LLM Reasoning', 'AI Answer'].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="glass-subtle border border-secondary/20 text-foreground font-medium px-3 py-2 rounded-xl">{step}</span>
                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-secondary shrink-0" />}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Architecture Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Medical Document AI', items: ['TrOCR text extraction', 'BioBERT entity recognition', 'Clinical interpretation engine'] },
                { title: 'LLM Doctor Assistant', items: ['RAG with report context', 'Multi-language generation', 'Streaming responses'] },
                { title: 'Risk Prediction Models', items: ['XGBoost ensemble scoring', 'Cardiovascular, diabetes, anemia', 'Temporal trend analysis'] },
                { title: 'Health Knowledge Graph', items: ['Drug interaction database', 'Biomarker reference ranges', 'Clinical guideline mapping'] },
              ].map(({ title, items }, i) => (
                <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.08 }}
                  className="glass-card p-5">
                  <h4 className="font-display font-semibold text-foreground text-sm mb-3">{title}</h4>
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Landscape */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Competitive Landscape</h2>
          </motion.div>

          <motion.div {...fadeUp} className="glass-card p-6 max-w-3xl mx-auto mb-6">
            <p className="text-center text-sm text-muted-foreground mb-6">Differentiation:</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['Report Intelligence', 'Medicine Intelligence', 'Health Data Platform'].map((item, i, arr) => (
                <span key={item} className="flex items-center gap-3">
                  <span className="gradient-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm shadow-glow">{item}</span>
                  {i < arr.length - 1 && <span className="text-primary font-bold text-lg">+</span>}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {[
              { name: 'Ada Health', focus: 'Symptom checker' },
              { name: 'Practo', focus: 'Doctor booking' },
              { name: 'Teladoc', focus: 'Telehealth' },
            ].map(({ name, focus }, i) => (
              <motion.div key={name} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="glass-card p-4 text-center">
                <p className="font-display font-semibold text-foreground text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{focus}</p>
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
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Revenue Streams */}
            <motion.div {...fadeUp} className="grid sm:grid-cols-4 gap-3">
              {[
                { icon: Star, title: 'Premium Subscription', desc: '$7/month' },
                { icon: Stethoscope, title: 'Doctor Consultations', desc: '20% fee' },
                { icon: ShoppingCart, title: 'Pharmacy Marketplace', desc: '10% commission' },
                { icon: BarChart3, title: 'Health Insights API', desc: 'Enterprise pricing' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card p-4 text-center group hover:shadow-glow transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Financial Projections */}
            <motion.div {...fadeUp} className="grid sm:grid-cols-3 gap-4">
              {[
                { year: 'Year 1', revenue: '$150K', color: 'from-primary to-blue-glow' },
                { year: 'Year 2', revenue: '$1M ARR', color: 'from-secondary to-teal' },
                { year: 'Year 3', revenue: '$10M ARR', color: 'from-amber-400 to-orange-500' },
              ].map(({ year, revenue, color }) => (
                <div key={year} className={`relative overflow-hidden rounded-2xl p-6 text-center bg-gradient-to-br ${color} text-white shadow-lg`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4" />
                  <p className="text-xs text-white/60 font-medium">{year}</p>
                  <p className="text-3xl font-display font-bold mt-1">{revenue}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Growth Strategy */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-primary border border-primary/20 mb-4">
              <Rocket className="w-3 h-3" /> 0 → 1M Users
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Growth Strategy</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              { phase: 'Phase 1', range: '0–10K users', title: 'Early Users', items: ['Free AI report explanation', 'Diagnostic lab partnerships', 'Reddit / health communities', 'SEO for lab reports'], color: 'from-primary to-blue-glow' },
              { phase: 'Phase 2', range: '10K–100K users', title: 'Product-Market Fit', items: ['Health score + AI doctor chat', 'YouTube health education', 'Doctor referrals', 'Medicine reminders'], color: 'from-secondary to-teal' },
              { phase: 'Phase 3', range: '100K–500K users', title: 'Platform Expansion', items: ['Doctor consultations marketplace', 'Medicine ordering', 'Clinic & pharmacy partnerships'], color: 'from-amber-400 to-orange-500' },
              { phase: 'Phase 4', range: '500K–1M users', title: 'Viral Growth', items: ['Family health profiles', 'Preventive alerts', 'Health sharing — network effect', 'One user → family joins'], color: 'from-emerald-400 to-green-600' },
            ].map(({ phase, range, title, items, color }, i) => (
              <motion.div key={phase} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                <span className="text-xs font-semibold text-primary">{phase} · {range}</span>
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

          {/* Growth Loop */}
          <motion.div {...fadeUp} className="glass-card p-6 max-w-3xl mx-auto mt-6">
            <h4 className="font-display font-semibold text-foreground mb-4 text-center">Viral Growth Loop</h4>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              {['User uploads report', 'AI explains results', 'User shares insights', 'New users join'].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="glass-subtle border border-primary/20 text-foreground font-medium px-3 py-2 rounded-xl">{step}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-primary shrink-0" />}
                </span>
              ))}
              <ArrowUpRight className="w-4 h-4 text-secondary" />
              <span className="text-[10px] text-secondary font-semibold">Repeat</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Ecosystem Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-xs font-semibold text-primary border border-primary/20 mb-4">
              <Layers className="w-3 h-3" /> Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Product Ecosystem</h2>
            <p className="text-muted-foreground">Bee.dr becomes a healthcare platform, not just an app</p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {/* Top: Patients */}
            <motion.div {...fadeUp} className="glass-card p-5 text-center max-w-xs mx-auto">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display font-semibold text-foreground text-sm">Patients</p>
              <p className="text-[10px] text-muted-foreground">Upload reports / AI chat</p>
            </motion.div>

            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>

            {/* Middle: Stakeholders */}
            <motion.div {...fadeUp} className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              {[
                { icon: Stethoscope, title: 'Doctors', desc: 'Consultations' },
                { icon: ShoppingCart, title: 'Pharmacies', desc: 'Medicine Sales' },
                { icon: Building2, title: 'Hospitals', desc: 'Lab Reports' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card p-4 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </motion.div>

            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>

            {/* Bottom: Bee.dr Hub */}
            <motion.div {...fadeUp} className="relative overflow-hidden rounded-2xl gradient-hero p-6 text-center max-w-sm mx-auto">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
              <Activity className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="font-display font-bold text-white text-lg">Bee.dr</p>
              <p className="text-xs text-white/70">AI Health Hub</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">System Architecture</h2>
            <p className="text-muted-foreground">15 microservices + AI pipelines</p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Application Architecture Flow */}
            <motion.div {...fadeUp} className="glass-card p-6 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                <span className="gradient-primary text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-glow">Mobile App / Web</span>
                <ArrowDown className="w-4 h-4 text-primary" />
                <span className="glass-subtle border border-primary/20 text-foreground font-semibold px-4 py-2 rounded-xl">API Gateway</span>
                <ArrowDown className="w-4 h-4 text-primary" />
                <span className="glass-subtle border border-secondary/20 text-foreground font-semibold px-4 py-2 rounded-xl">Microservices Layer</span>
              </div>
            </motion.div>

            {/* Microservices Grid */}
            <motion.div {...fadeUp} className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                'Auth', 'User Profile', 'Medical Report', 'OCR Processing', 'AI Analysis',
                'AI Doctor Chat', 'Medicine Intelligence', 'Doctor Consultation', 'Pharmacy Marketplace', 'Marketplace',
                'Notification', 'Analytics', 'Map', 'Billing', 'Admin',
              ].map((service) => (
                <div key={service} className="glass-card p-3 text-center hover:shadow-glow transition-all">
                  <p className="text-[10px] font-semibold text-foreground">{service}</p>
                  <p className="text-[9px] text-muted-foreground">Service</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Data Architecture */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Data Architecture</h2>
            <p className="text-muted-foreground">All health data stored securely</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Database, title: 'PostgreSQL', desc: 'Users / Reports / Medicines', color: 'from-primary to-blue-glow' },
              { icon: Brain, title: 'Vector Database', desc: 'Medical Knowledge Embeddings', color: 'from-secondary to-teal' },
              { icon: Zap, title: 'Redis Cache', desc: 'Sessions / AI caching', color: 'from-amber-400 to-orange-500' },
              { icon: HardDrive, title: 'Object Storage', desc: 'Medical Reports / Images', color: 'from-emerald-400 to-green-600' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="glass-card p-5 relative overflow-hidden group hover:shadow-glow transition-all">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-6 translate-x-6`} />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Architecture */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Infrastructure</h2>
            <p className="text-muted-foreground">Production deployment for scaling</p>
          </motion.div>

          <div className="max-w-md mx-auto space-y-3">
            {[
              { icon: Users, label: 'Users', gradient: true },
              { icon: Globe, label: 'CDN / Edge' },
              { icon: Shield, label: 'Load Balancer' },
              { icon: Server, label: 'API Gateway' },
              { icon: Container, label: 'Kubernetes Cluster' },
              { icon: Cloud, label: 'Microservices Containers' },
              { icon: Database, label: 'Databases' },
            ].map(({ icon: Icon, label, gradient }, i) => (
              <motion.div key={label} {...fadeUp} transition={{ delay: i * 0.06 }}>
                <div className={`${gradient ? 'gradient-primary text-primary-foreground shadow-glow' : 'glass-card'} p-3 text-center rounded-xl flex items-center justify-center gap-2`}>
                  <Icon className={`w-4 h-4 ${gradient ? '' : 'text-primary'}`} />
                  <span className={`text-xs font-semibold ${gradient ? '' : 'text-foreground'}`}>{label}</span>
                </div>
                {i < 6 && <div className="flex justify-center mt-2"><ArrowDown className="w-4 h-4 text-primary/50" /></div>}
              </motion.div>
            ))}
          </div>

          {/* Tech Stack */}
          <motion.div {...fadeUp} className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {['Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Vector DB', 'Cloud Storage'].map((tech) => (
              <span key={tech} className="glass-subtle border border-primary/10 text-foreground text-[10px] font-medium px-3 py-1.5 rounded-lg">{tech}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product Growth Loop */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Engagement Loop</h2>
            <p className="text-muted-foreground">Drives engagement, retention, and revenue</p>
          </motion.div>

          <motion.div {...fadeUp} className="glass-card p-6 max-w-md mx-auto mb-8">
            <div className="space-y-2">
              {[
                { step: 'Upload Report', icon: FileText },
                { step: 'AI Explanation', icon: Brain },
                { step: 'User Trust', icon: Heart },
                { step: 'Daily AI Doctor Chat', icon: Bot },
                { step: 'Health Insights', icon: BarChart3 },
                { step: 'Doctor Consultation', icon: Stethoscope },
                { step: 'Medicine Purchase', icon: ShoppingCart },
              ].map(({ step, icon: Icon }, i, arr) => (
                <div key={step}>
                  <div className="glass-subtle border border-primary/10 p-3 rounded-xl flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{step}</span>
                  </div>
                  {i < arr.length - 1 && <div className="flex justify-center py-1"><ArrowDown className="w-3 h-3 text-primary/40" /></div>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <RefreshCw className="w-4 h-4 text-secondary" />
              <span className="text-[10px] text-secondary font-semibold">Cycle repeats</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analytics Dashboard */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Analytics Overview</h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Key Metrics */}
            <motion.div {...fadeUp} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Daily Active Users', icon: Users },
                { label: 'Reports Analyzed', icon: FileText },
                { label: 'AI Chat Sessions', icon: Bot },
                { label: 'Consultations', icon: Stethoscope },
                { label: 'Medicine Orders', icon: ShoppingCart },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="glass-card p-3 text-center hover:shadow-glow transition-all">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-foreground leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* AI Usage Growth */}
            <motion.div {...fadeUp} className="glass-card p-6">
              <h4 className="font-display font-semibold text-foreground mb-4 text-center">AI Usage Growth</h4>
              <div className="space-y-3">
                {[
                  { month: 'Month 1', reports: '500', width: '3%' },
                  { month: 'Month 3', reports: '5,000', width: '10%' },
                  { month: 'Month 6', reports: '40,000', width: '40%' },
                  { month: 'Month 12', reports: '200,000', width: '100%' },
                ].map(({ month, reports, width }) => (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{month}</span>
                    <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-secondary to-teal rounded-full flex items-center justify-end pr-2" style={{ width }}>
                        <span className="text-[10px] font-bold text-white">{reports}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pitch Deck Architecture Slide */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Platform Evolution</h2>
            <p className="text-muted-foreground">Bee.dr evolving into a digital health ecosystem</p>
          </motion.div>

          <motion.div {...fadeUp} className="max-w-md mx-auto space-y-3">
            {[
              { label: 'Patient App', color: true },
              { label: 'API Platform' },
              { label: 'AI Health Engine' },
              { label: 'Health Data Platform' },
              { label: 'Healthcare Marketplace' },
            ].map(({ label, color }, i, arr) => (
              <div key={label}>
                <div className={`${color ? 'gradient-primary text-primary-foreground shadow-glow' : 'glass-card text-foreground'} p-4 text-center rounded-xl`}>
                  <span className="text-sm font-display font-semibold">{label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex justify-center py-1"><ArrowDown className="w-4 h-4 text-primary/50" /></div>}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Traction */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Early Traction</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            {[
              { value: '10K+', label: 'Users' },
              { value: '20K+', label: 'Reports Analyzed' },
              { value: '5K+', label: 'AI Chats' },
            ].map(({ value, label }) => (
              <motion.div key={label} {...fadeUp} className="glass-card p-6 text-center hover:shadow-glow transition-all">
                <p className="text-3xl font-display font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Growth Curve */}
          <motion.div {...fadeUp} className="glass-card p-6 max-w-2xl mx-auto">
            <h4 className="font-display font-semibold text-foreground mb-4 text-center">Growth Trajectory</h4>
            <div className="space-y-3">
              {[
                { month: 'Month 1', users: '1K', width: '5%' },
                { month: 'Month 3', users: '10K', width: '15%' },
                { month: 'Month 6', users: '100K', width: '40%' },
                { month: 'Month 12', users: '1M', width: '100%' },
              ].map(({ month, users, width }) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{month}</span>
                  <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full flex items-center justify-end pr-2 transition-all" style={{ width }}>
                      <span className="text-[10px] font-bold text-primary-foreground">{users}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Product Roadmap</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              { q: 'Year 1', title: 'Foundation', items: ['AI report intelligence', 'AI doctor assistant', 'Medicine intelligence', 'Health analytics'], color: 'from-primary to-blue-glow' },
              { q: 'Year 2', title: 'Platform', items: ['Doctor marketplace', 'Pharmacy platform', 'Preventive health AI', 'Global expansion'], color: 'from-secondary to-teal' },
            ].map(({ q, title, items, color }, i) => (
              <motion.div key={q} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-6 translate-x-6`} />
                <span className="text-xs font-semibold text-primary">{q}</span>
                <h4 className="font-display font-semibold text-foreground mt-1 mb-3">{title}</h4>
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Insight */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-primary/[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeUp} className="glass-card p-8 max-w-3xl mx-auto text-center">
            <Layers className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-foreground mb-4">The Health Ecosystem</h3>
            <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
              {['Medical Data Platform', 'AI Health Assistant', 'Healthcare Marketplace'].map((item, i, arr) => (
                <span key={item} className="flex items-center gap-3">
                  <span className="glass-subtle border border-primary/20 text-foreground font-semibold px-4 py-2 rounded-xl text-sm">{item}</span>
                  {i < arr.length - 1 && <span className="text-primary font-bold text-lg">+</span>}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">That combination is how companies like Ada Health scaled globally.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp}
            className="max-w-2xl mx-auto text-center relative overflow-hidden rounded-3xl gradient-hero p-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-16 -translate-x-16" />
            <div className="relative z-10">
              <DollarSign className="w-8 h-8 text-white/80 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Seeking <span className="text-white/90">$1M Seed Round</span>
              </h2>
              <p className="text-white/70 mb-4 text-sm">AI development · Engineering team · User growth · Health partnerships</p>
              <p className="text-white/60 mb-8 leading-relaxed text-sm">
                Working prototype live now with real AI analysis, multi-language support, and contextual AI doctor chat.
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
