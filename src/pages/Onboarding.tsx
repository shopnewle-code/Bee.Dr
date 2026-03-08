import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Shield, ChevronRight, Heart, Sparkles, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    icon: Scan,
    title: 'Scan Your Reports',
    description: 'Upload your medical lab reports — blood tests, prescriptions, or any health document in seconds.',
    accent: 'from-primary to-blue-glow',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Our advanced AI pipeline extracts, interprets, and predicts health risks from your results instantly.',
    accent: 'from-blue-glow to-secondary',
  },
  {
    icon: Heart,
    title: 'Personalized Insights',
    description: 'Get actionable health recommendations, risk assessments, and a clear understanding of your wellbeing.',
    accent: 'from-secondary to-teal',
  },
];

const OnboardingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/auth');
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0">
        {/* Decorative orbs */}
        <motion.div animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <motion.div animate={{ y: [0, 15, 0], x: [0, -15, 0] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-32 right-10 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white tracking-tight">Bee.dr</span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon container */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="relative mb-8"
            >
              <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                <slide.icon className="w-14 h-14 text-white" />
              </div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>

            <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">{slide.title}</h1>
            <p className="text-base text-white/70 leading-relaxed max-w-xs">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-2.5 mt-12 mb-8">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/25 hover:bg-white/40'
              }`} />
          ))}
        </div>

        {/* Actions */}
        <Button onClick={handleNext} size="lg"
          className="w-full max-w-xs rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 gap-2 h-13 text-base shadow-xl">
          {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
          <ChevronRight className="w-4 h-4" />
        </Button>

        {currentSlide < slides.length - 1 && (
          <button onClick={() => navigate('/auth')}
            className="mt-4 text-sm text-white/50 hover:text-white/80 transition-colors">
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
