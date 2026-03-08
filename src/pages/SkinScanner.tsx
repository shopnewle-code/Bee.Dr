import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/use-language';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Camera, Upload, X, Loader2, ScanEye, AlertTriangle,
  CheckCircle2, Info, GitCompare, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

/* ─── Single Scan Tab ─── */
const ScanTab = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
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
    <div className="space-y-4">
      {!file ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <ScanEye className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-display font-bold text-foreground">Skin Condition Scanner</h2>
            <p className="text-sm text-muted-foreground mt-1">Take a photo of a skin concern for AI analysis</p>
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
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <span className={`inline-block text-sm font-bold px-4 py-1.5 rounded-full ${riskColor(result.riskLevel)}`}>
                  {result.riskLevel?.toUpperCase() || 'UNKNOWN'} RISK
                </span>
              </div>
              {result.condition && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">Possible Condition</h3>
                  <p className="text-sm text-foreground">{result.condition}</p>
                  {result.confidence && <p className="text-xs text-muted-foreground mt-1">Confidence: {result.confidence}</p>}
                </div>
              )}
              {result.description && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">Analysis</h3>
                  <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                    <ReactMarkdown>{result.description}</ReactMarkdown>
                  </div>
                </div>
              )}
              {result.recommendations?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" /> Recommendations
                  </h3>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
    </div>
  );
};

/* ─── Progress Comparison Tab ─── */
interface ProgressResult {
  progressAssessment: string;
  changes: { observation: string; significance: string }[];
  overallStatus: string;
  recommendation: string;
  urgentFlags: string[];
  confidenceLevel: string;
}

const ProgressTab = () => {
  const { user } = useAuth();
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [conditionName, setConditionName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ProgressResult | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const loadFile = (f: File, setF: (f: File) => void, setPrev: (s: string) => void) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setF(f); setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPrev(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const fileToBase64Raw = (f: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer);
        let binary = '';
        arr.forEach(b => binary += String.fromCharCode(b));
        resolve(btoa(binary));
      };
      reader.readAsArrayBuffer(f);
    });

  const analyze = async () => {
    if (!beforeFile || !afterFile || !user) {
      toast.error('Please upload both before and after images');
      return;
    }
    setAnalyzing(true);
    try {
      const [beforeB64, afterB64] = await Promise.all([
        fileToBase64Raw(beforeFile),
        fileToBase64Raw(afterFile),
      ]);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skin-progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            beforeImageBase64: beforeB64,
            afterImageBase64: afterB64,
            conditionName: conditionName || undefined,
          }),
        }
      );

      if (resp.status === 429) { toast.error('Rate limited. Try again shortly.'); return; }
      if (resp.status === 402) { toast.error('Credits exhausted.'); return; }
      if (!resp.ok) throw new Error('Comparison failed');

      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to compare');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setBeforeFile(null); setAfterFile(null);
    setBeforePreview(null); setAfterPreview(null);
    setConditionName(''); setResult(null);
  };

  const progressIcon = (assessment: string) => {
    switch (assessment) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-success" />;
      case 'worsening': return <TrendingDown className="w-5 h-5 text-destructive" />;
      default: return <Minus className="w-5 h-5 text-warning" />;
    }
  };

  const progressStyle = (assessment: string) => {
    switch (assessment) {
      case 'improving': return 'bg-success/10 border-success/20 text-success';
      case 'worsening': return 'bg-destructive/10 border-destructive/20 text-destructive';
      default: return 'bg-warning/10 border-warning/20 text-warning';
    }
  };

  const significanceStyle = (sig: string) => {
    switch (sig) {
      case 'positive': return 'bg-success/10 text-success';
      case 'negative': return 'bg-destructive/10 text-destructive';
      default: return 'bg-warning/10 text-warning';
    }
  };

  const ImageUploadSlot = ({
    label, file: f, preview: prev, inputRef, onClear,
  }: {
    label: string; file: File | null; preview: string | null;
    inputRef: React.RefObject<HTMLInputElement>; onClear: () => void;
  }) => (
    <div className="flex-1">
      <p className="text-xs font-medium text-muted-foreground mb-2 text-center">{label}</p>
      {!f ? (
        <button onClick={() => inputRef.current?.click()}
          className="w-full aspect-square bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:border-primary/40 transition-all">
          <Camera className="w-6 h-6 text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">Tap to add</span>
        </button>
      ) : (
        <div className="relative">
          <img src={prev!} alt={label} className="w-full aspect-square object-cover rounded-xl border border-border" />
          <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={onClear}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-3">
            <GitCompare className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground">Track Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload before & after photos to compare</p>
        </div>

        {/* Image slots */}
        <div className="flex gap-3">
          <ImageUploadSlot label="Before" file={beforeFile} preview={beforePreview}
            inputRef={beforeRef as React.RefObject<HTMLInputElement>}
            onClear={() => { setBeforeFile(null); setBeforePreview(null); setResult(null); }} />
          <ImageUploadSlot label="After" file={afterFile} preview={afterPreview}
            inputRef={afterRef as React.RefObject<HTMLInputElement>}
            onClear={() => { setAfterFile(null); setAfterPreview(null); setResult(null); }} />
        </div>

        <input ref={beforeRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && loadFile(e.target.files[0], setBeforeFile, setBeforePreview)} />
        <input ref={afterRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && loadFile(e.target.files[0], setAfterFile, setAfterPreview)} />

        {/* Condition name (optional) */}
        <Input placeholder="Condition name (optional, e.g. Eczema)"
          value={conditionName} onChange={e => setConditionName(e.target.value)} />

        {!result && (
          <Button onClick={analyze} disabled={analyzing || !beforeFile || !afterFile}
            className="w-full gradient-primary text-primary-foreground" size="lg">
            {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Comparing...</> :
              <><GitCompare className="w-4 h-4 mr-2" /> Compare Progress</>}
          </Button>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Assessment banner */}
            <div className={`border rounded-xl p-4 text-center ${progressStyle(result.progressAssessment)}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {progressIcon(result.progressAssessment)}
                <span className="text-lg font-display font-bold capitalize">
                  {result.progressAssessment}
                </span>
              </div>
              <p className="text-xs opacity-80">
                Confidence: {result.confidenceLevel?.charAt(0).toUpperCase() + result.confidenceLevel?.slice(1)}
              </p>
            </div>

            {/* Overall status */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground text-sm mb-2">Overall Status</h3>
              <p className="text-sm text-muted-foreground">{result.overallStatus}</p>
            </div>

            {/* Changes */}
            {result.changes?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground text-sm mb-3">Observed Changes</h3>
                <div className="space-y-2">
                  {result.changes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${significanceStyle(c.significance)}`}>
                        {c.significance}
                      </span>
                      <p className="text-xs text-muted-foreground">{c.observation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Recommendation
              </h3>
              <p className="text-sm text-muted-foreground">{result.recommendation}</p>
            </div>

            {/* Urgent flags */}
            {result.urgentFlags?.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <h3 className="font-semibold text-destructive text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Urgent Flags
                </h3>
                <ul className="space-y-1">
                  {result.urgentFlags.map((f, i) => (
                    <li key={i} className="text-xs text-destructive/80 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                AI comparison is for informational purposes only. Always consult a dermatologist for proper evaluation of changing skin conditions.
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={reset}>
              Compare Another Set
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

/* ─── Main Page ─── */
const SkinScannerPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <ScanEye className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Skin Scanner</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="scan" className="text-xs"><ScanEye className="w-3.5 h-3.5 mr-1.5" />Scan</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs"><GitCompare className="w-3.5 h-3.5 mr-1.5" />Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="scan"><ScanTab /></TabsContent>
          <TabsContent value="progress"><ProgressTab /></TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default SkinScannerPage;
