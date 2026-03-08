import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Camera, Upload, X, Loader2, ShieldAlert, AlertTriangle,
  CheckCircle2, Info, Circle
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface ABCDEItem {
  present: boolean | null;
  detail: string;
}

interface MelanomaResult {
  abcdeScore: {
    asymmetry: ABCDEItem;
    border: ABCDEItem;
    color: ABCDEItem;
    diameter: ABCDEItem;
    evolving: ABCDEItem;
  };
  totalFlags: number;
  riskLevel: string;
  recommendation: string;
  urgency: string;
}

const CRITERIA_LABELS: Record<string, { letter: string; name: string; icon: string }> = {
  asymmetry: { letter: 'A', name: 'Asymmetry', icon: '◐' },
  border: { letter: 'B', name: 'Border', icon: '◯' },
  color: { letter: 'C', name: 'Color', icon: '🎨' },
  diameter: { letter: 'D', name: 'Diameter', icon: '📏' },
  evolving: { letter: 'E', name: 'Evolving', icon: '🔄' },
};

const MelanomaScreenerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MelanomaResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setFile(f); setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const analyze = async () => {
    if (!file || !user) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-melanoma`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
        }
      );

      if (resp.status === 429) { toast.error('Rate limited. Please try again shortly.'); return; }
      if (resp.status === 402) { toast.error('Credits exhausted.'); return; }
      if (!resp.ok) throw new Error('Analysis failed');

      const data = await resp.json();
      setResult(data);

      // Save scan
      const filePath = `${user.id}/melanoma_${Date.now()}_${file.name}`;
      await supabase.storage.from('reports').upload(filePath, file);
      await supabase.from('skin_scans').insert({
        user_id: user.id,
        image_path: filePath,
        analysis: data,
        risk_level: data.riskLevel || 'unknown',
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); };

  const riskStyles = (level: string) => {
    switch (level) {
      case 'low': return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
      case 'moderate': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' };
      case 'high': return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
    }
  };

  const flagStyle = (present: boolean | null) => {
    if (present === null) return 'bg-muted/50 border-border text-muted-foreground';
    if (present) return 'bg-destructive/10 border-destructive/30 text-destructive';
    return 'bg-success/10 border-success/30 text-success';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <ShieldAlert className="w-4 h-4 text-destructive" />
          <span className="text-sm font-display font-bold text-foreground">ABCDE Melanoma Screener</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {!file ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-xl font-display font-bold text-foreground">Melanoma Screener</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a photo of a mole or lesion for ABCDE analysis
              </p>
            </div>

            {/* ABCDE Info */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-display font-semibold text-foreground mb-3">The ABCDE Rule</h3>
              <div className="space-y-2">
                {Object.entries(CRITERIA_LABELS).map(([key, { letter, name, icon }]) => (
                  <div key={key} className="flex items-center gap-3 text-xs">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {letter}
                    </span>
                    <span className="text-foreground font-medium">{name}</span>
                    <span className="text-muted-foreground">— {
                      key === 'asymmetry' ? 'One half unlike the other' :
                      key === 'border' ? 'Irregular, ragged edges' :
                      key === 'color' ? 'Uneven color, multiple shades' :
                      key === 'diameter' ? 'Larger than 6mm' :
                      'Changed over time'
                    }</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => cameraRef.current?.click()}
              className="w-full bg-card border-2 border-dashed border-destructive/30 rounded-xl p-8 text-center hover:border-destructive/60 transition-all">
              <Camera className="w-10 h-10 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">Take Photo of Lesion</p>
              <p className="text-xs text-muted-foreground">Close-up with good lighting</p>
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <button onClick={() => fileRef.current?.click()}
              className="w-full bg-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-all">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Upload Image</p>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
              <p className="text-[11px] text-warning leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                This is a screening tool only. It does NOT replace a dermatologist examination. Always consult a doctor for suspicious lesions.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Image preview */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                <Button variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
              </div>
              {preview && <img src={preview} alt="Lesion" className="w-full rounded-lg max-h-48 object-contain bg-muted" />}
            </div>

            {!result && (
              <Button onClick={analyze} disabled={analyzing} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90" size="lg">
                {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Screening...</> :
                  <><ShieldAlert className="w-4 h-4 mr-2" /> Run ABCDE Screening</>}
              </Button>
            )}

            {/* Results */}
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Risk banner */}
                {(() => {
                  const rs = riskStyles(result.riskLevel);
                  return (
                    <div className={`${rs.bg} border ${rs.border} rounded-xl p-4 text-center`}>
                      <span className={`text-lg font-display font-bold ${rs.text}`}>
                        {result.riskLevel?.toUpperCase()} RISK
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.totalFlags} of 5 ABCDE criteria flagged
                      </p>
                    </div>
                  );
                })()}

                {/* ABCDE Cards */}
                <div className="space-y-2">
                  {Object.entries(result.abcdeScore).map(([key, item]) => {
                    const label = CRITERIA_LABELS[key];
                    if (!label) return null;
                    return (
                      <div key={key} className={`border rounded-xl p-3 ${flagStyle(item.present)}`}>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center font-bold text-sm">
                            {label.letter}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{label.name}</span>
                              {item.present === true && <AlertTriangle className="w-3.5 h-3.5" />}
                              {item.present === false && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {item.present === null && <Info className="w-3.5 h-3.5" />}
                            </div>
                            <p className="text-xs mt-0.5 opacity-80">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendation */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">Recommendation</h3>
                  <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                  {result.urgency && (
                    <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
                      result.urgency === 'urgent' ? 'bg-destructive/10 text-destructive' :
                      result.urgency === 'soon' ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      Urgency: {result.urgency.charAt(0).toUpperCase() + result.urgency.slice(1)}
                    </span>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    This AI screening is for informational purposes only. It does NOT constitute a medical diagnosis. Always consult a board-certified dermatologist for any suspicious skin lesion.
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={reset}>
                  Screen Another Lesion
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default MelanomaScreenerPage;
