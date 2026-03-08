import MedicalImaging from '@/components/MedicalImaging';
import { ScanLine } from 'lucide-react';

const CTScanAnalysis = () => (
  <MedicalImaging
    title="CT Scan Analysis"
    subtitle="AI-powered CT scan interpretation"
    modality="ct"
    icon={ScanLine}
    color="bg-primary"
    tips={[
      'Upload clear, high-resolution CT scan images',
      'Include all relevant slices for comprehensive analysis',
      'Specify body region and contrast phase if known',
      'Add patient age, symptoms, and clinical history for better results',
      'Ensure proper windowing (bone, lung, soft tissue) is visible',
    ]}
  />
);

export default CTScanAnalysis;
