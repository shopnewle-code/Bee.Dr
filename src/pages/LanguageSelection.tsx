import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe, Check, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/hooks/use-language';

const LanguageSelection = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const activeLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-lg font-display font-bold text-foreground">Choose Language</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <Globe className="w-12 h-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">Select Your Language</h1>
            <p className="text-sm text-muted-foreground">AI responses will be in your chosen language</p>
          </div>

          {/* Indian Languages */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-4">Indian Languages</p>
          <div className="space-y-2 mb-4">
            {SUPPORTED_LANGUAGES.filter(l => ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'ml', 'gu', 'pa'].includes(l.code)).map((lang, i) => (
              <motion.button key={lang.code}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setLanguage(lang.code)}
                className={`w-full text-left rounded-xl p-3.5 border transition-all flex items-center gap-3 ${
                  language === lang.code
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}>
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{lang.name}</span>
                    <span className="text-xs text-muted-foreground">{lang.native}</span>
                  </div>
                </div>
                {language === lang.code && <Check className="w-4 h-4 text-primary" />}
              </motion.button>
            ))}
          </div>

          {/* International Languages */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">International Languages</p>
          <div className="space-y-2 mb-6">
            {SUPPORTED_LANGUAGES.filter(l => ['es', 'fr', 'de', 'ar', 'pt', 'zh'].includes(l.code)).map((lang, i) => (
              <motion.button key={lang.code}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                onClick={() => setLanguage(lang.code)}
                className={`w-full text-left rounded-xl p-3.5 border transition-all flex items-center gap-3 ${
                  language === lang.code
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}>
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{lang.name}</span>
                    <span className="text-xs text-muted-foreground">{lang.native}</span>
                  </div>
                </div>
                {language === lang.code && <Check className="w-4 h-4 text-primary" />}
              </motion.button>
            ))}
          </div>

          {/* Translation Preview */}
          {activeLang && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-accent/30 border border-border rounded-xl p-4 mb-6">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Translation Preview</p>
              <p className="text-sm text-foreground font-medium">{activeLang.sample}</p>
            </motion.div>
          )}

          <Button onClick={() => navigate('/dashboard')}
            className="w-full gradient-primary text-primary-foreground" size="lg">
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default LanguageSelection;
