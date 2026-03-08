import MedicalImaging from '@/components/MedicalImaging';
import { FileImage } from 'lucide-react';

const XrayAnalysis = () => (
  <MedicalImaging
    title="X-ray AI Analysis"
    subtitle="AI-powered radiological interpretation"
    modality="xray"
    icon={FileImage}
    color="gradient-primary"
    tips={[
      'Upload a clear, high-resolution X-ray image',
      'PA (posteroanterior) chest views provide the best analysis',
      'Include the full X-ray without cropping important areas',
      'Mention body region if not obvious (chest, spine, extremity)',
      'Provide clinical context for more relevant interpretation',
    ]}
  />
);

export default XrayAnalysis;
