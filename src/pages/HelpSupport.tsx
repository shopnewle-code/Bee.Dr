import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, HelpCircle, MessageCircle, FileText, ChevronRight, AlertCircle,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const faqs = [
  { q: 'Is Bee.dr a replacement for my doctor?', a: 'No. Bee.dr provides AI-powered informational analysis only. Always consult a qualified healthcare professional for diagnosis and treatment.' },
  { q: 'How accurate is the AI analysis?', a: 'Our AI achieves ~95% accuracy on standard blood test interpretation. However, results should always be verified by a medical professional.' },
  { q: 'Is my medical data safe?', a: 'Yes. All data is encrypted end-to-end with AES-256. We never share your data with third parties and are designed for HIPAA compliance.' },
  { q: 'What types of reports can I upload?', a: 'Blood tests, metabolic panels, lipid profiles, CBC, prescriptions, and most standard lab reports in PDF or image format.' },
  { q: 'Can I use Bee.dr in Hindi?', a: 'Yes! We currently support English and Hindi, with Tamil, Telugu, and Bengali coming soon.' },
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Help & Support</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/chat')}
            className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-all">
            <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">Chat Support</span>
          </motion.button>
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-all">
            <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">User Guide</span>
          </motion.button>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-sm font-display font-semibold text-foreground mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="px-4 pb-4 pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-accent/30 border border-border rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Medical Disclaimer</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Bee.dr is an AI-powered health information tool. It does not provide medical diagnoses, 
                treatment plans, or prescriptions. All analysis is for informational purposes only. 
                Always consult a qualified healthcare provider for medical decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-sm font-medium text-foreground mb-3">Was this helpful?</p>
          <div className="flex justify-center gap-3">
            <Button variant={feedback === 'up' ? 'default' : 'outline'} size="sm"
              className={feedback === 'up' ? 'gradient-primary text-primary-foreground' : ''}
              onClick={() => { setFeedback('up'); toast.success('Thanks for your feedback!'); }}>
              <ThumbsUp className="w-4 h-4 mr-1" /> Yes
            </Button>
            <Button variant={feedback === 'down' ? 'default' : 'outline'} size="sm"
              onClick={() => { setFeedback('down'); toast.success('Thanks, we\'ll improve!'); }}>
              <ThumbsDown className="w-4 h-4 mr-1" /> No
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpSupport;
