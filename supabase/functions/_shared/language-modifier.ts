/**
 * Returns a language instruction string to prepend to system prompts.
 * Pass `language` from the request body (defaults to "en").
 */
export function getLanguageModifier(language?: string): string {
  if (!language || language === "en") return "";

  const LANGUAGE_MAP: Record<string, { name: string; script: string; example: string }> = {
    hi: {
      name: "Hindi",
      script: "Devanagari",
      example: 'आपका हीमोग्लोबिन (Hemoglobin) 10.2 g/dL है, जो सामान्य से कम है। इसका मतलब है कि आपके शरीर में खून की कमी हो सकती है।',
    },
    ta: {
      name: "Tamil",
      script: "Tamil",
      example: 'உங்கள் Hemoglobin (ஹீமோகுளோபின்) அளவு 10.2 g/dL, இது சாதாரணத்தை விட குறைவு.',
    },
    te: {
      name: "Telugu",
      script: "Telugu",
      example: 'మీ Hemoglobin (హీమోగ్లోబిన్) స్థాయి 10.2 g/dL, ఇది సాధారణ కంటే తక్కువ.',
    },
    bn: {
      name: "Bengali",
      script: "Bengali",
      example: 'আপনার Hemoglobin (হিমোগ্লোবিন) মাত্রা 10.2 g/dL, যা স্বাভাবিকের চেয়ে কম।',
    },
    mr: {
      name: "Marathi",
      script: "Devanagari",
      example: 'तुमचे Hemoglobin (हिमोग्लोबिन) पातळी 10.2 g/dL आहे, जे सामान्यपेक्षा कमी आहे.',
    },
    kn: {
      name: "Kannada",
      script: "Kannada",
      example: 'ನಿಮ್ಮ Hemoglobin (ಹಿಮೋಗ್ಲೋಬಿನ್) ಮಟ್ಟ 10.2 g/dL, ಇದು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಕಡಿಮೆ.',
    },
    ml: {
      name: "Malayalam",
      script: "Malayalam",
      example: 'നിങ്ങളുടെ Hemoglobin (ഹീമോഗ്ലോബിൻ) അളവ് 10.2 g/dL ആണ്, ഇത് സാധാരണയെക്കാൾ കുറവാണ്.',
    },
    gu: {
      name: "Gujarati",
      script: "Gujarati",
      example: 'તમારું Hemoglobin (હીમોગ્લોબિન) સ્તર 10.2 g/dL છે, જે સામાન્ય કરતાં ઓછું છે.',
    },
    pa: {
      name: "Punjabi",
      script: "Gurmukhi",
      example: 'ਤੁਹਾਡਾ Hemoglobin (ਹੀਮੋਗਲੋਬਿਨ) ਪੱਧਰ 10.2 g/dL ਹੈ, ਜੋ ਆਮ ਨਾਲੋਂ ਘੱਟ ਹੈ।',
    },
    es: {
      name: "Spanish",
      script: "Latin",
      example: 'Su nivel de Hemoglobina es de 10.2 g/dL, lo cual es inferior al rango normal.',
    },
    fr: {
      name: "French",
      script: "Latin",
      example: 'Votre taux d\'Hémoglobine est de 10.2 g/dL, ce qui est inférieur à la normale.',
    },
    de: {
      name: "German",
      script: "Latin",
      example: 'Ihr Hämoglobin-Wert beträgt 10.2 g/dL, was unter dem Normalbereich liegt.',
    },
    ar: {
      name: "Arabic",
      script: "Arabic",
      example: 'مستوى الهيموجلوبين (Hemoglobin) لديك هو 10.2 g/dL، وهو أقل من المعدل الطبيعي.',
    },
    pt: {
      name: "Portuguese",
      script: "Latin",
      example: 'Seu nível de Hemoglobina é de 10.2 g/dL, o que está abaixo do normal.',
    },
    zh: {
      name: "Chinese (Simplified)",
      script: "Simplified Chinese",
      example: '您的血红蛋白 (Hemoglobin) 水平为 10.2 g/dL，低于正常范围。',
    },
  };

  const lang = LANGUAGE_MAP[language];
  if (!lang) return "";

  return `
LANGUAGE INSTRUCTION: Respond entirely in ${lang.name} using ${lang.script} script.

Rules:
- Use the ${lang.script} script for all text
- Keep medical test names in English with ${lang.name} transliteration in parentheses: e.g. "${lang.example}"
- Keep medicine names in English
- Use conversational ${lang.name}, not formal/literary ${lang.name}
- Numbers can be in English/Arabic digits
- Units stay in English (mg/dL, g/dL, etc.)
- Adapt food and lifestyle recommendations to local cuisine and culture
- Use locally understood health metaphors where appropriate

`;
}
