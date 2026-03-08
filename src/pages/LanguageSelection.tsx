import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe, Check, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', available: true, sample: 'Your hemoglobin level is low' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', available: true, sample: 'आपका हीमोग्लोबिन स्तर कम है' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', available: false, sample: 'உங்கள் ஹீமோகுளோபின் அளவு குறைவாக உள்ளது' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', available: false, sample: 'మీ హీమోగ్లోబిన్ స్థాయి తక్కువగా ఉంది' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', available: false, sample: 'আপনার হিমোগ্লোবিনের মাত্রা কম' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', available: false, sample: 'तुमचे हिमोग्लोबिन पातळी कमी आहे' },
];

const LanguageSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');
  const activeLang = languages.find(l => l.code === selected);

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
            <p className="text-sm text-muted-foreground">Reports will be explained in your chosen language</p>
          </div>

          <div className="space-y-2 mb-6">
            {languages.map((lang, i) => (
              <motion.button key={lang.code}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => lang.available && setSelected(lang.code)}
                disabled={!lang.available}
                className={`w-full text-left rounded-xl p-4 border transition-all flex items-center gap-3 ${
                  selected === lang.code
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : lang.available
                    ? 'border-border bg-card hover:border-primary/30'
                    : 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                }`}>
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{lang.name}</span>
                    <span className="text-xs text-muted-foreground">{lang.native}</span>
                  </div>
                  {!lang.available && (
                    <span className="text-[10px] text-muted-foreground">Coming Soon</span>
                  )}
                </div>
                {selected === lang.code && <Check className="w-5 h-5 text-primary" />}
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
