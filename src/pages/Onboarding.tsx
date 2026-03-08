import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    icon: Activity,
    title: 'Scan Your Reports',
    description: 'Simply upload your medical lab reports — blood tests, prescriptions, or any health document.',
    color: 'from-primary to-teal',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Our 7-step AI pipeline extracts, interprets, and predicts health risks from your results.',
    color: 'from-teal to-info',
  },
  {
    icon: Shield,
    title: 'Personalized Insights',
    description: 'Get actionable recommendations, risk assessments, and a clear understanding of your health.',
    color: 'from-info to-primary',
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
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6 text-primary-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 rounded-3xl glass flex items-center justify-center mb-8"
          >
            <slide.icon className="w-12 h-12" />
          </motion.div>

          <h1 className="text-3xl font-display font-bold mb-4">{slide.title}</h1>
          <p className="text-lg opacity-80 leading-relaxed">{slide.description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 mt-12 mb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'w-8 bg-primary-foreground' : 'w-2 bg-primary-foreground/30'
            }`}
          />
        ))}
      </div>

      <Button
        onClick={handleNext}
        size="lg"
        className="glass border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground gap-2 px-8"
      >
        {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
        <ChevronRight className="w-4 h-4" />
      </Button>

      {currentSlide < slides.length - 1 && (
        <button
          onClick={() => navigate('/auth')}
          className="mt-4 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          Skip
        </button>
      )}
    </div>
  );
};

export default OnboardingPage;
