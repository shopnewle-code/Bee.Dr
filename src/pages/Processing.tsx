import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Check, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const PIPELINE_STEPS = [
  { label: 'Document scanning & noise removal', key: 'scan' },
  { label: 'Vision OCR — reading document image', key: 'ocr' },
  { label: 'AI report type detection', key: 'detect' },
  { label: 'Structured data extraction', key: 'extract' },
  { label: 'Medical AI analysis', key: 'analyze' },
  { label: 'Risk scoring & recommendations', key: 'risk' },
];

const ProcessingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [batchFiles, setBatchFiles] = useState<{ id: string; file_name: string; report_type: string | null; storage_path: string | null }[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  // Fetch batch files
  useEffect(() => {
    if (!user) return;
    if (batchId) {
      (supabase.from('scan_results').select('id, file_name, report_type, storage_path') as any)
        .eq('batch_id', batchId)
        .then(({ data }: any) => { if (data) setBatchFiles(data); });
    } else if (id) {
      (supabase.from('scan_results').select('id, file_name, report_type, storage_path') as any)
        .eq('id', id)
        .then(({ data }: any) => { if (data) setBatchFiles(data); });
    }
  }, [batchId, id, user]);

  // Run the real AI pipeline
  useEffect(() => {
    if (!user || batchFiles.length === 0 || started.current) return;
    started.current = true;

    const runPipeline = async () => {
      try {
        for (let fi = 0; fi < batchFiles.length; fi++) {
          const file = batchFiles[fi];

          // Step 0: Scan
          setCurrentStep(0);
          setProgress(5);
          await delay(500);

          // Step 1: Vision OCR — extract text from the actual image
          setCurrentStep(1);
          setProgress(15);

          let ocrText = '';
          try {
            const ocrBody: Record<string, string> = { fileName: file.file_name };
            if (file.storage_path) {
              ocrBody.storagePath = file.storage_path;
            }
            const { data: ocrData, error: ocrErr } = await supabase.functions.invoke('vision-ocr', {
              body: ocrBody,
            });
            if (!ocrErr && ocrData?.ocrText) {
              ocrText = ocrData.ocrText;
            }
          } catch (e) {
            console.warn('Vision OCR fallback:', e);
          }

          // Step 2: AI report type detection (now with OCR text)
          setCurrentStep(2);
          setProgress(35);

          let reportType = file.report_type || 'general';
          try {
            const detectBody: Record<string, string> = { fileName: file.file_name, fileType: 'image/jpeg' };
            if (ocrText) detectBody.ocrText = ocrText;
            const { data: detectData, error: detectErr } = await supabase.functions.invoke('detect-report-type', {
              body: detectBody,
            });
            if (!detectErr && detectData?.reportType) {
              reportType = detectData.reportType;
              setDetectedType(reportType);
              await supabase.from('scan_results').update({ report_type: reportType }).eq('id', file.id);
            }
          } catch (e) {
            console.warn('Detection fallback:', e);
          }

          // Step 3: Structured data extraction
          setCurrentStep(3);
          setProgress(50);

          let extractedData = null;
          try {
            const { data: extData, error: extErr } = await supabase.functions.invoke('extract-medical-values', {
              body: { reportText: JSON.stringify({ file_name: file.file_name }), reportType, fileName: file.file_name },
            });
            if (!extErr && extData?.extracted) {
              extractedData = extData.extracted;
            }
          } catch (e) {
            console.warn('Extraction fallback:', e);
          }

          // Step 4: Specialized AI analysis (with structured data)
          setCurrentStep(4);
          setProgress(70);

          let analysisResult = null;
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-report`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({
                  scanData: { file_name: file.file_name, report_type: reportType },
                  reportType,
                  extractedData,
                }),
              }
            );
            if (resp.ok) {
              analysisResult = await resp.json();
            } else if (resp.status === 429) {
              toast.error('Rate limit exceeded. Please wait and try again.');
              setError('Rate limit exceeded');
              return;
            } else if (resp.status === 402) {
              toast.error('Usage limit reached.');
              setError('Usage limit reached');
              return;
            }
          } catch (e) {
            console.warn('Analysis error:', e);
          }

          // Step 5: Risk scoring & recommendations
          setCurrentStep(5);
          setProgress(90);
          await delay(400);

          // Save results
          const updateData: Record<string, any> = {
            status: 'complete',
            report_type: reportType,
          };
          if (analysisResult) {
            updateData.raw_data = analysisResult;
            // Extract risk scores from analysis
            if (analysisResult.overallRisks) {
              const riskScores: Record<string, any> = {};
              analysisResult.overallRisks.forEach((r: any) => {
                riskScores[r.condition?.toLowerCase().replace(/\s+/g, '_') || 'unknown'] = {
                  score: r.level === 'high' ? 0.8 : r.level === 'medium' ? 0.5 : 0.2,
                  label: r.level,
                  color: r.level === 'high' ? 'destructive' : r.level === 'medium' ? 'warning' : 'success',
                };
              });
              updateData.risk_scores = riskScores;
            }
            if (analysisResult.tests) {
              updateData.insights = analysisResult.tests.filter((t: any) => t.status !== 'normal').map((t: any) => ({
                title: t.name,
                severity: t.status === 'critical' ? 'high' : t.status,
                detail: t.explanation,
              }));
            }
            if (analysisResult.lifestyleRecommendations) {
              updateData.recommendations = analysisResult.lifestyleRecommendations.map((r: any) => ({
                action: r.advice,
                context: r.category,
                priority: r.priority,
              }));
            }
          }

          await supabase.from('scan_results').update(updateData).eq('id', file.id);
          setProcessedCount(fi + 1);
        }

        setProgress(100);
        await delay(300);

        const firstId = batchFiles[0].id;
        navigate(`/results/${firstId}${batchId ? `?batch=${batchId}` : ''}`);

      } catch (e: any) {
        console.error('Pipeline error:', e);
        setError(e.message || 'Processing failed');
        toast.error('Processing failed. Please try again.');
      }
    };

    runPipeline();
  }, [batchFiles, user, navigate, batchId]);

  if (error) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-12 h-12 text-primary-foreground mb-4" />
        <h2 className="text-xl font-bold text-primary-foreground mb-2">Processing Error</h2>
        <p className="text-primary-foreground/70 text-sm mb-4">{error}</p>
        <button onClick={() => navigate('/upload')} className="text-primary-foreground underline text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 mx-auto mb-4">
            <Activity className="w-16 h-16 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-primary-foreground mb-2">
            Analyzing Your Report{batchFiles.length > 1 ? 's' : ''}
          </h1>
          <p className="text-primary-foreground/70 text-sm">
            {detectedType ? `Detected: ${reportTypeLabel(detectedType)} • ` : ''}
            AI pipeline in progress
          </p>
        </div>

        {/* Batch file list */}
        {batchFiles.length > 1 && (
          <div className="glass rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-primary-foreground/60 mb-2">Batch Processing</p>
            <div className="space-y-1.5">
              {batchFiles.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                  {i < processedCount ? (
                    <Check className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-primary-foreground/40 shrink-0" />
                  )}
                  <span className="truncate">{f.file_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-primary-foreground/10 mb-8 overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary-foreground" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-lg px-4 py-3 flex items-center gap-3">
              {i < currentStep ? (
                <Check className="w-5 h-5 text-primary-foreground shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="w-5 h-5 text-primary-foreground shrink-0 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-primary-foreground/30 shrink-0" />
              )}
              <span className={`text-sm font-medium ${i <= currentStep ? 'text-primary-foreground' : 'text-primary-foreground/40'}`}>
                {step.label}
                {i === 2 && detectedType && i <= currentStep && (
                  <span className="ml-2 text-xs opacity-70">→ {reportTypeLabel(detectedType)}</span>
                )}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

function reportTypeLabel(type: string): string {
  const map: Record<string, string> = {
    blood_test: '🩸 Blood Test',
    ncv_emg: '🧠 NCV/EMG',
    ecg: '❤️ ECG',
    mri: '🧲 MRI',
    ct_scan: '📡 CT Scan',
    xray: '📷 X-ray',
    pathology: '🔬 Pathology',
    prescription: '💊 Prescription',
    ultrasound: '🔊 Ultrasound',
    urine_stool: '🧪 Urine/Stool',
    general: '📄 General',
  };
  return map[type] || '📄 Medical Report';
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default ProcessingPage;
