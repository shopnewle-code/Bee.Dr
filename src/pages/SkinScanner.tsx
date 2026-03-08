import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, X, Loader2, ScanEye, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const SkinScannerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64, fileName: file.name }),
        }
      );
      if (!resp.ok) throw new Error('Analysis failed');
      const data = await resp.json();
      setResult(data);

      // Save to DB
      const filePath = `${user.id}/skin_${Date.now()}_${file.name}`;
      await supabase.storage.from('reports').upload(filePath, file);
      await supabase.from('skin_scans').insert({
        user_id: user.id, image_path: filePath, analysis: data, risk_level: data.riskLevel || 'unknown',
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const riskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success bg-success/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'high': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <ScanEye className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Skin Condition Scanner</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {!file ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
                <ScanEye className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-display font-bold text-foreground">Skin Condition Scanner</h1>
              <p className="text-sm text-muted-foreground mt-1">Take a photo of a skin concern for AI-powered analysis</p>
            </div>

            <button onClick={() => cameraRef.current?.click()}
              className="w-full bg-card border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-all">
              <Camera className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground">Take Photo</p>
              <p className="text-xs text-muted-foreground">Capture the affected area</p>
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

            <div className="bg-accent/30 border border-border rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                This AI scanner provides preliminary assessment only. Always consult a dermatologist for proper diagnosis.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {preview && <img src={preview} alt="Skin" className="w-full rounded-lg max-h-48 object-contain bg-muted" />}
            </div>

            {!result && (
              <Button onClick={analyze} disabled={analyzing} className="w-full gradient-primary text-primary-foreground" size="lg">
                {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><ScanEye className="w-4 h-4 mr-2" /> Analyze Skin Condition</>}
              </Button>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Risk Level */}
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <span className={`inline-block text-sm font-bold px-4 py-1.5 rounded-full ${riskColor(result.riskLevel)}`}>
                    {result.riskLevel?.toUpperCase() || 'UNKNOWN'} RISK
                  </span>
                </div>

                {/* Condition */}
                {result.condition && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Possible Condition</h3>
                    <p className="text-sm text-foreground">{result.condition}</p>
                    {result.confidence && <p className="text-xs text-muted-foreground mt-1">Confidence: {result.confidence}</p>}
                  </div>
                )}

                {/* Description */}
                {result.description && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Analysis</h3>
                    <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                      <ReactMarkdown>{result.description}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" /> Recommendations
                    </h3>
                    <ul className="space-y-1.5">
                      {result.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warning */}
                {result.seeDoctor && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">See a Dermatologist</p>
                      <p className="text-xs text-muted-foreground">{result.doctorReason || 'Professional evaluation recommended.'}</p>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  Scan Another Area
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

export default SkinScannerPage;
