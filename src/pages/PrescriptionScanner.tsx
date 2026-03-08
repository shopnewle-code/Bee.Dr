import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Camera, Upload, FileImage, X, Loader2, Pill,
  AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const PrescriptionScannerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setFile(f);
    setResult(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  }, []);

  const analyzeRx = async () => {
    if (!file || !user) return;
    setAnalyzing(true);
    try {
      // Upload to storage
      const filePath = `${user.id}/rx_${Date.now()}_${file.name}`;
      await supabase.storage.from('reports').upload(filePath, file);

      // Get base64 for AI analysis
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-prescription`,
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
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze prescription');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Pill className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Prescription Scanner</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {!file ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
                <Pill className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-display font-bold text-foreground">Scan Prescription</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Take a photo or upload an image of your prescription for AI-powered medicine explanation
              </p>
            </div>

            {/* Camera capture */}
            <button onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-card border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-all">
              <Camera className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground">Take Photo</p>
              <p className="text-xs text-muted-foreground">Use your camera to capture the prescription</p>
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {/* File upload */}
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full bg-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-all">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">Upload Image</p>
              <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <div className="bg-accent/30 border border-border rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Our AI can read both printed and handwritten prescriptions. For best results, ensure the image is well-lit and focused.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Preview */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {preview && (
                <img src={preview} alt="Prescription" className="w-full rounded-lg max-h-48 object-contain bg-muted" />
              )}
            </div>

            {!result && (
              <Button onClick={analyzeRx} disabled={analyzing} className="w-full gradient-primary text-primary-foreground" size="lg">
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing prescription...
                  </>
                ) : (
                  <>
                    <Pill className="w-4 h-4 mr-2" />
                    Analyze Prescription
                  </>
                )}
              </Button>
            )}

            {/* Results */}
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Extracted Text */}
                {result.extractedText && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-2">📝 Extracted Text</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.extractedText}</p>
                  </div>
                )}

                {/* Medicines */}
                {result.medicines?.map((med: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{med.name}</span>
                    </div>
                    {med.dosage && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Dosage:</strong> {med.dosage}
                      </p>
                    )}
                    {med.purpose && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Purpose:</strong> {med.purpose}
                      </p>
                    )}
                    {med.sideEffects?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {med.sideEffects.map((se: string, j: number) => (
                          <span key={j} className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> {se}
                          </span>
                        ))}
                      </div>
                    )}
                    {med.instructions && (
                      <p className="text-xs text-foreground bg-accent/30 rounded-lg p-2">
                        💡 {med.instructions}
                      </p>
                    )}
                  </motion.div>
                ))}

                {/* Interactions warning */}
                {result.interactions && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                    <h3 className="font-display font-semibold text-destructive text-sm mb-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Drug Interactions
                    </h3>
                    <p className="text-xs text-muted-foreground">{result.interactions}</p>
                  </div>
                )}

                {/* General advice */}
                {result.generalAdvice && (
                  <div className="bg-accent/30 border border-border rounded-xl p-4">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" /> General Advice
                    </h3>
                    <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                      <ReactMarkdown>{result.generalAdvice}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  Scan Another Prescription
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

export default PrescriptionScannerPage;
