import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PREDEFINED_QUESTIONS,
  getQuestionById,
  normalizeAnswer,
  validateQuestionsUnique,
  validateQuestionExists,
} from '@/utils/security-questions';
import {
  validateAnswerFormat,
  validateAnswerComplexity,
  getAnswerQuality,
  ANSWER_SECURITY_TIPS,
} from '@/utils/answer-verification';

interface SecurityQuestionsProps {
  onComplete: (data: {
    questionIds: string[];
    answers: string[];
  }) => void;
  isLoading?: boolean;
}

const SecurityQuestionsSetup = ({ onComplete, isLoading = false }: SecurityQuestionsProps) => {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(['', '', '']);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [errors, setErrors] = useState<string[]>(['', '', '']);

  const handleQuestionChange = (index: number, questionId: string) => {
    const newIds = [...selectedQuestionIds];
    newIds[index] = questionId;
    setSelectedQuestionIds(newIds);
    
    // Clear error for this question
    const newErrors = [...errors];
    newErrors[index] = '';
    setErrors(newErrors);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);

    // Validate answer
    const newErrors = [...errors];
    if (answer.trim().length === 0) {
      newErrors[index] = '';
    } else if (!validateAnswerFormat(answer)) {
      newErrors[index] = 'Answer must be 2-200 characters';
    } else if (!validateAnswerComplexity(answer)) {
      newErrors[index] = 'Answer is too short';
    } else {
      newErrors[index] = '';
    }
    setErrors(newErrors);
  };

  const handleSubmit = () => {
    // Validate all questions selected
    if (selectedQuestionIds.some((id) => !id)) {
      setErrors(['Please select 3 different questions']);
      return;
    }

    // Validate unique
    if (!validateQuestionsUnique(selectedQuestionIds)) {
      setErrors(['Please select 3 different questions']);
      return;
    }

    // Validate all answers filled
    if (answers.some((answer) => !answer.trim())) {
      setErrors(['Please answer all questions']);
      return;
    }

    // Validate answer formats
    const answerErrors: string[] = [];
    answers.forEach((answer, index) => {
      if (!validateAnswerFormat(answer)) {
        answerErrors[index] = 'Invalid answer format';
      }
    });

    if (answerErrors.some((err) => err)) {
      setErrors(answerErrors);
      return;
    }

    onComplete({
      questionIds: selectedQuestionIds,
      answers: answers.map(normalizeAnswer),
    });
  };

  const getAvailableQuestions = (currentIndex: number) => {
    return PREDEFINED_QUESTIONS.filter(
      (q) =>
        !selectedQuestionIds.includes(q.id) ||
        selectedQuestionIds[currentIndex] === q.id
    );
  };

  const allAnswersFilled = answers.every((a) => a.trim().length > 0);
  const canSubmit =
    allAnswersFilled &&
    selectedQuestionIds.every((id) => id) &&
    validateQuestionsUnique(selectedQuestionIds) &&
    errors.every((err) => !err);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Security Questions
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose 3 questions and provide answers to recover your account if needed
        </p>
      </div>

      {/* Security Tips */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
      >
        <p className="text-xs font-semibold text-foreground mb-2">💡 Tips:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {ANSWER_SECURITY_TIPS.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </motion.div>

      {/* Questions */}
      <div className="space-y-6">
        {[0, 1, 2].map((index) => {
          const selectedId = selectedQuestionIds[index];
          const selectedQuestion = selectedId ? getQuestionById(selectedId) : null;
          const answer = answers[index];
          const error = errors[index];
          const quality = answer ? getAnswerQuality(answer) : null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-3"
            >
              {/* Question Dropdown */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Question {index + 1} *
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Select a question...</option>
                  {getAvailableQuestions(index).map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.question}
                    </option>
                  ))}
                </select>
              </div>

              {/* Answer Input */}
              {selectedQuestion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-foreground">
                    Your Answer *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your answer..."
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                  />

                  {/* Answer Quality Indicator */}
                  {answer && quality && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`flex-1 h-2 rounded-full ${
                          quality.quality === 'weak'
                            ? 'bg-red-500'
                            : quality.quality === 'fair'
                              ? 'bg-yellow-500'
                              : quality.quality === 'good'
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {quality.feedback}
                      </span>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-destructive text-xs"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </motion.div>
                  )}

                  {/* Success Indicator */}
                  {answer && !error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-green-500 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Answer saved
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isLoading}
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 h-12"
      >
        {isLoading ? 'Setting up...' : 'Continue'}
      </Button>

      {/* General Error */}
      {errors[0] && errors[0].includes('different') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errors[0]}
        </motion.div>
      )}
    </div>
  );
};

export default SecurityQuestionsSetup;
