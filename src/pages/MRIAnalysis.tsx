import MedicalImaging from '@/components/MedicalImaging';
import { Brain } from 'lucide-react';

const MRIAnalysis = () => (
  <MedicalImaging
    title="MRI Analysis"
    subtitle="AI-powered magnetic resonance interpretation"
    modality="mri"
    icon={Brain}
    color="gradient-primary"
    tips={[
      'Upload individual MRI slices or key sequences',
      'T1, T2, and FLAIR sequences each provide different information',
      'Mention the body region being scanned (brain, spine, knee, etc.)',
      'Include contrast status (with/without gadolinium)',
      'Provide symptoms and clinical history for better analysis',
    ]}
  />
);

export default MRIAnalysis;
