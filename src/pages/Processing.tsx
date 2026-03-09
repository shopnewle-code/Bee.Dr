import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Check, Loader2, FileText } from 'lucide-react';

const PIPELINE_STEPS = [
  { label: 'Document scanning & noise removal', duration: 1500 },
  { label: 'OCR + handwriting recognition (TrOCR)', duration: 2000 },
  { label: 'Medical entity extraction (BioBERT)', duration: 2500 },
  { label: 'Clinical interpretation', duration: 2000 },
  { label: 'Risk prediction analysis', duration: 2500 },
  { label: 'AI insight generation', duration: 1500 },
  { label: 'Recommendation creation', duration: 1000 },
];

const mockResults = {
  risk_scores: {
    cardiovascular: { score: 0.23, label: 'Low', color: 'success' },
    anemia: { score: 0.67, label: 'Medium', color: 'warning' },
    diabetes: { score: 0.12, label: 'Low', color: 'success' },
    abnormal_findings: { score: 0.45, label: 'Medium', color: 'warning' },
  },
  insights: [
    { title: 'Hemoglobin Below Normal', severity: 'medium', detail: 'Your hemoglobin (11.2 g/dL) is below the standard range (12-16 g/dL). This may indicate early-stage iron deficiency anemia.' },
    { title: 'Cholesterol Within Range', severity: 'low', detail: 'Total cholesterol (185 mg/dL) is within the healthy range. HDL (52 mg/dL) is adequate but could be improved with exercise.' },
    { title: 'Vitamin D Deficiency', severity: 'high', detail: 'Vitamin D level (18 ng/mL) is significantly below the recommended range (30-100 ng/mL). Supplementation is recommended.' },
    { title: 'Fasting Glucose Normal', severity: 'low', detail: 'Fasting glucose (92 mg/dL) is within normal range, indicating healthy blood sugar regulation.' },
  ],
  recommendations: [
    { action: 'Start iron-rich diet', context: 'Linked to low hemoglobin finding', priority: 'high' },
    { action: 'Vitamin D3 supplement (2000 IU daily)', context: 'Address severe Vitamin D deficiency', priority: 'high' },
    { action: 'Increase cardiovascular exercise', context: 'Improve HDL cholesterol levels', priority: 'medium' },
    { action: 'Follow-up blood test in 3 months', context: 'Monitor hemoglobin and Vitamin D improvement', priority: 'medium' },
    { action: 'Annual comprehensive metabolic panel', context: 'Maintain ongoing health monitoring', priority: 'low' },
  ],
};

const ProcessingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [batchFiles, setBatchFiles] = useState<{ id: string; file_name: string }[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  // Fetch batch files
  useEffect(() => {
    if (!batchId || !user) return;
    supabase
      .from('scan_results')
      .select('id, file_name')
      .eq('batch_id', batchId)
      .then(({ data }) => {
        if (data) setBatchFiles(data);
      });
  }, [batchId, user]);

  useEffect(() => {
    let stepIndex = 0;

    const runPipeline = () => {
      if (stepIndex >= PIPELINE_STEPS.length) {
        // Update all batch files with mock results
        const updateIds = batchId && batchFiles.length > 0
          ? batchFiles.map(f => f.id)
          : id ? [id] : [];

        if (updateIds.length > 0 && user) {
          const updateAll = updateIds.map(scanId =>
            supabase
              .from('scan_results')
              .update({
                status: 'complete',
                risk_scores: mockResults.risk_scores,
                insights: mockResults.insights,
                recommendations: mockResults.recommendations,
              })
              .eq('id', scanId)
          );

          Promise.all(updateAll).then(() => {
            navigate(`/results/${updateIds[0]}${batchId ? `?batch=${batchId}` : ''}`);
          });
        }
        return;
      }

      setCurrentStep(stepIndex);
      setProgress(((stepIndex + 1) / PIPELINE_STEPS.length) * 100);

      setTimeout(() => {
        stepIndex++;
        if (batchFiles.length > 0) {
          setProcessedCount(Math.min(Math.floor((stepIndex / PIPELINE_STEPS.length) * batchFiles.length), batchFiles.length));
        }
        runPipeline();
      }, PIPELINE_STEPS[stepIndex].duration);
    };

    const timer = setTimeout(runPipeline, 500);
    return () => clearTimeout(timer);
  }, [id, user, navigate, batchId, batchFiles]);

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Activity className="w-16 h-16 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-primary-foreground mb-2">
            Analyzing Your Report{batchFiles.length > 1 ? 's' : ''}
          </h1>
          <p className="text-primary-foreground/70 text-sm">
            {batchFiles.length > 1
              ? `Processing ${batchFiles.length} reports • 7-step AI pipeline`
              : '7-step AI pipeline in progress'}
          </p>
        </div>

        {/* Batch file list */}
        {batchFiles.length > 1 && (
          <div className="glass rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-primary-foreground/60 mb-2">Batch Upload</p>
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
          <motion.div
            className="h-full rounded-full bg-primary-foreground"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-lg px-4 py-3 flex items-center gap-3"
            >
              {i < currentStep ? (
                <Check className="w-5 h-5 text-primary-foreground shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="w-5 h-5 text-primary-foreground shrink-0 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-primary-foreground/30 shrink-0" />
              )}
              <span className={`text-sm font-medium ${
                i <= currentStep ? 'text-primary-foreground' : 'text-primary-foreground/40'
              }`}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingPage;
