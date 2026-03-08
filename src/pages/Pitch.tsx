import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Activity, Brain, Shield, TrendingUp, Users, Zap, Globe,
  FileText, Bot, Scan, Heart, Pill, ChevronRight, ArrowRight,
  Layers, Database, Cloud, Smartphone, BarChart3, Target,
  DollarSign, Rocket, CheckCircle2, Star
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const PitchPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">Bee.dr</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate('/auth')}>
              Get Started <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 text-center relative">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
              <Zap className="w-3 h-3" /> AI-Powered Medical Intelligence
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-tight">
              Your Health,<br />
              <span className="text-gradient">Decoded by AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Bee.dr transforms complex medical reports into clear, actionable insights using advanced AI — 
              making healthcare understanding accessible to everyone.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow" onClick={() => navigate('/auth')}>
                Try Bee.dr Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}>
                View Architecture
              </Button>
            </div>
          </motion.div>

          {/* Metrics */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {[
              { value: '95%', label: 'Accuracy Rate' },
              { value: '<3s', label: 'Analysis Time' },
              { value: '50+', label: 'Biomarkers' },
              { value: 'HIPAA', label: 'Compliant' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-2xl font-display font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Complete Health Platform</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Six powerful modules working together to revolutionize personal healthcare</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Scan, title: 'Smart OCR', desc: 'TrOCR + handwriting recognition extracts data from any medical document — printed or handwritten' },
              { icon: Brain, title: 'AI Interpretation', desc: 'BioBERT-powered analysis interprets biomarkers with clinical-grade understanding' },
              { icon: Bot, title: 'AI Doctor Chat', desc: 'Conversational AI assistant explains results, answers questions, and provides health guidance' },
              { icon: Heart, title: 'Risk Prediction', desc: 'ML models predict cardiovascular, diabetes, and anemia risk from your biomarker patterns' },
              { icon: Pill, title: 'Rx Analysis', desc: 'Prescription scanning with drug interaction checks and dosage verification' },
              { icon: TrendingUp, title: 'Health Tracking', desc: 'Track biomarkers over time, visualize trends, and get proactive health alerts' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">System Architecture</h2>
            <p className="text-muted-foreground">Production-grade infrastructure built for scale</p>
          </motion.div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
            {[
              { icon: Smartphone, title: 'Frontend', items: ['React + TypeScript', 'Framer Motion animations', 'Responsive mobile-first', 'Real-time streaming UI'] },
              { icon: Cloud, title: 'Backend', items: ['Edge Functions (Deno)', 'PostgreSQL + RLS', 'Secure file storage', 'WebSocket real-time'] },
              { icon: Brain, title: 'AI Pipeline', items: ['TrOCR → text extraction', 'BioBERT → entity recognition', 'Gemini → interpretation', 'XGBoost → risk scoring'] },
              { icon: Shield, title: 'Security', items: ['End-to-end encryption', 'HIPAA compliance ready', 'Row-level security', 'Zero-knowledge storage'] },
            ].map(({ icon: Icon, title, items }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{title}</h3>
                </div>
                <ul className="space-y-2">
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

      {/* ML Pipeline */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">AI/ML Pipeline</h2>
            <p className="text-muted-foreground">7-stage intelligent processing in under 3 seconds</p>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Document Ingestion', desc: 'PDF/image upload with format detection and preprocessing' },
              { step: '02', title: 'TrOCR Extraction', desc: 'Transformer-based OCR for printed and handwritten text recognition' },
              { step: '03', title: 'BioBERT NER', desc: 'Named entity recognition to extract biomarkers, values, and units' },
              { step: '04', title: 'Clinical Interpretation', desc: 'Reference range comparison and clinical significance analysis' },
              { step: '05', title: 'Risk Modeling', desc: 'XGBoost + neural network ensemble for multi-disease risk scoring' },
              { step: '06', title: 'Insight Generation', desc: 'LLM-powered natural language explanations and recommendations' },
              { step: '07', title: 'Delivery', desc: 'Structured results with confidence scores and actionable next steps' },
            ].map(({ step, title, desc }, i) => (
              <motion.div key={step} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 mb-4 last:mb-0">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 text-primary-foreground text-sm font-display font-bold">
                  {step}
                </div>
                <div className="flex-1 bg-card border border-border rounded-xl p-4">
                  <h4 className="font-display font-semibold text-foreground text-sm">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
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
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Business Model</h2>
            <p className="text-muted-foreground">Sustainable growth through value-aligned pricing</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { tier: 'Free', price: '$0', features: ['3 scans/month', 'Basic AI insights', 'Health dashboard', 'Limited chat'], highlight: false },
              { tier: 'Pro', price: '$9.99', features: ['Unlimited scans', 'Advanced risk scoring', 'AI Doctor chat', 'Health trends', 'Priority processing'], highlight: true },
              { tier: 'Enterprise', price: 'Custom', features: ['API access', 'Custom integrations', 'Bulk processing', 'Dedicated support', 'HIPAA BAA'], highlight: false },
            ].map(({ tier, price, features, highlight }) => (
              <motion.div key={tier} {...fadeUp}
                className={`rounded-xl p-6 border ${highlight ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card'}`}>
                {highlight && <span className="text-xs font-medium text-primary mb-2 block">Most Popular</span>}
                <h3 className="font-display font-bold text-foreground text-lg">{tier}</h3>
                <p className="text-3xl font-display font-bold text-foreground mt-1 mb-4">{price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                <ul className="space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">MVP Roadmap</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              { q: 'Q1 2026', title: 'Foundation', items: ['Auth + upload flow', 'OCR pipeline MVP', 'Basic AI interpretation', 'Health dashboard'] },
              { q: 'Q2 2026', title: 'Intelligence', items: ['AI Doctor chat', 'Risk prediction models', 'Prescription analysis', 'Trend tracking'] },
              { q: 'Q3 2026', title: 'Scale', items: ['iOS/Android apps', 'Doctor referral network', 'Insurance integrations', 'Multi-language'] },
              { q: 'Q4 2026', title: 'Enterprise', items: ['B2B API', 'Hospital integrations', 'Clinical trial matching', 'Global expansion'] },
            ].map(({ q, title, items }, i) => (
              <motion.div key={q} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6">
                <span className="text-xs font-medium text-primary">{q}</span>
                <h4 className="font-display font-semibold text-foreground mt-1 mb-3">{title}</h4>
                <ul className="space-y-1.5">
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
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Go-to-Market Strategy</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Target, title: 'Target Market', desc: 'Health-conscious individuals 25-55, chronic disease patients, parents managing family health. $50B+ TAM.' },
              { icon: Rocket, title: 'Growth Channels', desc: 'SEO content marketing, health influencer partnerships, physician referral program, app store optimization.' },
              { icon: Users, title: 'User Acquisition', desc: 'Freemium model drives viral growth. Users share insights with family & doctors, creating organic loops.' },
              { icon: DollarSign, title: 'Revenue Targets', desc: 'Year 1: 100K users, $1.2M ARR. Year 2: 500K users, $8M ARR. Year 3: 2M users, $30M ARR.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <h4 className="font-display font-semibold text-foreground mb-2">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center bg-card border border-border rounded-2xl p-10">
            <Star className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">
              Seeking <span className="text-gradient">$2M Seed Round</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Join us in building the future of accessible healthcare AI. Pre-seed traction: working prototype, 
              patent-pending ML pipeline, and strong founding team from Stanford Medicine & Google Health.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow" onClick={() => navigate('/auth')}>
                Try the Product <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Request Deck <FileText className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Bee.dr</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Bee.dr Health Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PitchPage;
