import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Upload, Camera, Loader2, AlertTriangle, FileImage,
  RefreshCw, X
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface MedicalImagingProps {
  title: string;
  subtitle: string;
  modality: 'ecg' | 'xray' | 'mri' | 'ct';
  icon: React.ElementType;
  color: string;
  tips: string[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const MedicalImaging = ({ title, subtitle, modality, icon: Icon, color, tips }: MedicalImagingProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState('');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult('');
  };

  const analyze = async () => {
    if (!imageFile) { toast.error('Upload an image first'); return; }
    setAnalyzing(true);
    setResult('');

    try {
      // Convert to base64
      const buffer = await imageFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      const base64 = btoa(binary);

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-imaging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          imageBase64: base64,
          modality,
          patientContext: context || undefined,
          language,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Analysis failed' }));
        toast.error(err.error || 'Analysis failed');
        setAnalyzing(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let buffer2 = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer2 += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer2.indexOf('\n')) !== -1) {
          let line = buffer2.slice(0, newlineIdx);
          buffer2 = buffer2.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      toast.error('Analysis failed. Please try again.');
    }
    setAnalyzing(false);
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setResult('');
    setContext('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Upload area */}
        {!image ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-border rounded-2xl p-8 text-center"
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4`}>
              <Icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">Upload {title.split(' ')[0]} Image</h3>
            <p className="text-sm text-muted-foreground mb-4">Take a photo or upload from gallery</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                <Camera className="w-3 h-3 mr-1" /> Camera
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                <Upload className="w-3 h-3 mr-1" /> Upload
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <img src={image} alt="Medical image" className="w-full rounded-xl border border-border" />
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={reset}>
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}

        {/* Patient context */}
        {image && !result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Textarea placeholder="Optional: Add patient context (age, symptoms, medical history...)"
              value={context} onChange={e => setContext(e.target.value)} rows={2} />
            <Button className="w-full gradient-primary text-primary-foreground" onClick={analyze} disabled={analyzing}>
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : 
                <><Icon className="w-4 h-4 mr-2" /> Analyze {title.split(' ')[0]}</>}
            </Button>
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground">AI Analysis</h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="w-3 h-3 mr-1" /> New Scan
              </Button>
            </div>
            <div className="prose prose-sm max-w-none text-foreground
              prose-headings:text-foreground prose-headings:font-display
              prose-strong:text-foreground prose-li:text-muted-foreground
              prose-p:text-muted-foreground">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <div className="mt-4 bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-xs text-warning flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                This AI analysis is for informational purposes only and should not replace professional medical diagnosis. Always consult a qualified healthcare provider.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tips */}
        {!result && (
          <div className="bg-accent/30 border border-border rounded-xl p-4">
            <h4 className="font-display font-semibold text-foreground text-sm mb-2">📋 Tips for Best Results</h4>
            <ul className="space-y-1.5">
              {tips.map(tip => (
                <li key={tip} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0 mt-1.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        {analyzing && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              AI is analyzing your {modality.toUpperCase()} image...
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MedicalImaging;
