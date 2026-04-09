import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ArrowRight, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getQuestionsByIds } from '@/utils/security-questions';
import { toast } from 'sonner';

export interface SecurityQuestion {
  id: string;
  question: string;
}

interface SecurityAnswersVerificationProps {
  questions: SecurityQuestion[];
  onVerificationComplete: (answers: string[]) => void;
  isLoading?: boolean;
  attemptCount?: number;
  maxAttempts?: number;
}

const SecurityAnswersVerification = ({
  questions,
  onVerificationComplete,
  isLoading = false,
  attemptCount = 0,
  maxAttempts = 5,
}: SecurityAnswersVerificationProps) => {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [showAnswers, setShowAnswers] = useState<boolean[]>(Array(questions.length).fill(false));
  const [error, setError] = useState('');
  const [delay, setDelay] = useState(0);

  // Show delay after failed attempt
  useEffect(() => {
    if (attemptCount > 0 && attemptCount < maxAttempts) {
      const delaySeconds = Math.min(2 ** (attemptCount - 1), 10);
      setDelay(delaySeconds);

      const timer = setInterval(() => {
        setDelay((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [attemptCount, maxAttempts]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    setError('');
  };

  const handleSubmit = () => {
    // Validate all answers filled
    if (answers.some((a) => !a.trim())) {
      setError('Please answer all questions');
      return;
    }

    onVerificationComplete(answers);
  };

  const remainingAttempts = maxAttempts - attemptCount;
  const allAnswersFilled = answers.every((a) => a.trim().length > 0);
  const canSubmit = allAnswersFilled && !isLoading && delay === 0;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Verify Your Identity
        </h2>
        <p className="text-sm text-muted-foreground">
          Answer the security questions you set during signup
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-foreground">
              Q{index + 1}: {question.question}
            </label>
            <Input
              type="text"
              placeholder="Your answer..."
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              disabled={isLoading || delay > 0}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              💡 Case insensitive - enter exactly as you remember
            </p>
          </motion.div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
      >
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          ⚠️ <strong>Important:</strong> Generic error message for security. We won't reveal which
          answer is wrong.
        </p>
      </motion.div>

      {/* Delay Warning */}
      {delay > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
        >
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⏱️ Please wait {delay} seconds before trying again...
          </p>
        </motion.div>
      )}

      {/* Attempts Remaining */}
      {attemptCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground"
        >
          {remainingAttempts > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 inline mr-1 text-amber-500" />
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 inline mr-1 text-destructive" />
              <span className="text-destructive font-semibold">
                Maximum attempts exceeded. Please try again later.
              </span>
            </>
          )}
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 h-12"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : delay > 0 ? (
          <>
            <AlertCircle className="w-4 h-4 mr-2" />
            Wait {delay}s
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default SecurityAnswersVerification;
