import MedicalImaging from '@/components/MedicalImaging';
import { Heart } from 'lucide-react';

const ECGInterpreter = () => (
  <MedicalImaging
    title="ECG Interpretation"
    subtitle="AI-powered electrocardiogram analysis"
    modality="ecg"
    icon={Heart}
    color="gradient-primary"
    tips={[
      'Ensure the ECG strip is flat and well-lit when photographing',
      'Include all 12 leads if available for comprehensive analysis',
      'Capture the full rhythm strip without cutting off any part',
      'Add patient age and symptoms for more accurate interpretation',
      'Avoid shadows and glare on the ECG paper',
    ]}
  />
);

export default ECGInterpreter;
