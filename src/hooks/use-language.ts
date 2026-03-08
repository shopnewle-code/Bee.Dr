import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'beedr-language';

export type AppLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'kn' | 'ml' | 'gu' | 'pa' | 'es' | 'fr' | 'de' | 'ar' | 'pt' | 'zh';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  native: string;
  flag: string;
  sample: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', sample: 'Your hemoglobin level is low' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', sample: 'आपका हीमोग्लोबिन स्तर कम है' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', sample: 'உங்கள் ஹீமோகுளோபின் அளவு குறைவாக உள்ளது' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', sample: 'మీ హీమోగ్లోబిన్ స్థాయి తక్కువగా ఉంది' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', sample: 'আপনার হিমোগ্লোবিনের মাত্রা কম' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', sample: 'तुमचे हिमोग्लोबिन पातळी कमी आहे' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', sample: 'ನಿಮ್ಮ ಹಿಮೋಗ್ಲೋಬಿನ್ ಮಟ್ಟ ಕಡಿಮೆ ಇದೆ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', sample: 'നിങ്ങളുടെ ഹീമോഗ്ലോബിൻ അളവ് കുറവാണ്' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', sample: 'તમારું હીમોગ્લોબિન સ્તર ઓછું છે' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', sample: 'ਤੁਹਾਡਾ ਹੀਮੋਗਲੋਬਿਨ ਪੱਧਰ ਘੱਟ ਹੈ' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', sample: 'Su nivel de hemoglobina es bajo' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', sample: 'Votre taux d\'hémoglobine est bas' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', sample: 'Ihr Hämoglobinwert ist niedrig' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', sample: 'مستوى الهيموجلوبين لديك منخفض' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', sample: 'Seu nível de hemoglobina está baixo' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', sample: '您的血红蛋白水平偏低' },
];

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored as AppLanguage) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch { /* noop */ }
  }, [language]);

  const setLanguage = useCallback((lang: AppLanguage) => setLanguageState(lang), []);
  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return { language, setLanguage, languageInfo, isEnglish: language === 'en' };
}
