import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SecurityAnswersVerification from '@/components/SecurityAnswersVerification';
import { toast } from 'sonner';

type Stage = 'email' | 'questions' | 'reset' | 'success';

interface SecurityQuestion {
  id: string;
  question: string;
}

const ForgotPasswordSecurityQuestions = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userQuestions, setUserQuestions] = useState<SecurityQuestion[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Step 1: Get user's security questions
  const handleGetQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // In production, call backend:
      // POST /api/auth/forgot-password
      // { email: "user@example.com" }
      // Response: { questions: [...] }

      // Mock: simulate getting questions
      console.log('📧 Fetching security questions for:', email);

      // Simulated response
      const mockQuestions: SecurityQuestion[] = [
        { id: '1', question: "What is your mother's first name?" },
        { id: '3', question: 'What was the name of your first school?' },
        { id: '5', question: "What is your pet's name?" },
      ];

      setUserQuestions(mockQuestions);
      setStage('questions');
      toast.success('Security questions loaded. Please answer them.');
    } catch (err: any) {
      setError(err.message || 'Failed to load security questions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify security answers
  const handleVerifyAnswers = async (answers: string[]) => {
    setError('');
    setLoading(true);

    try {
      // In production, call backend:
      // POST /api/auth/verify-security-answers
      // { email, answers: [...] }
      // Response: { valid: true } or { valid: false }

      console.log('🔐 Verifying security answers for:', email);
      console.log('Answers:', answers);

      // Simulated verification - in production this is done on backend with bcrypt
      const mockValid = Math.random() > 0.3; // 70% pass rate for demo

      if (!mockValid) {
        setAttemptCount((prev) => prev + 1);
        setError('Invalid answers. Please try again.');

        // Check if max attempts reached
        if (attemptCount + 1 >= 5) {
          setError(
            'Maximum attempts exceeded. Please try resetting via email or contact support.'
          );
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }

        setLoading(false);
        return;
      }

      // Answers verified - move to password reset
      setStage('reset');
      toast.success('Identity verified! Now set a new password.');
    } catch (err: any) {
      setError(err.message || 'Failed to verify answers');
      console.error('Error:', err);
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      // In production, call backend:
      // POST /api/auth/reset-password
      // { email, new_password: "..." }
      // Response: { success: true }

      console.log('🔑 Resetting password for:', email);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setStage('success');
      toast.success('Password reset successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            stage === 'email' ? navigate('/auth') : setStage(stage === 'questions' ? 'email' : 'questions')
          }
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Stage 1: Email Input */}
          {stage === 'email' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Reset Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email to recover your account
                </p>
              </div>

              <form onSubmit={handleGetQuestions} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                </div>

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

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !email}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground text-center">
                🔒 We'll show your security questions to verify your identity
              </div>
            </motion.div>
          )}

          {/* Stage 2: Security Questions */}
          {stage === 'questions' && userQuestions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SecurityAnswersVerification
                questions={userQuestions}
                onVerificationComplete={handleVerifyAnswers}
                isLoading={loading}
                attemptCount={attemptCount}
                maxAttempts={5}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Stage 3: New Password */}
          {stage === 'reset' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  Set New Password
                </h2>
                <p className="text-sm text-muted-foreground">Identity verified! Create a strong password</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Stage 4: Success */}
          {stage === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>

              <div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">
                  Password Reset Successfully
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. Sign in with your new password.
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 h-12"
              >
                Sign In Now
              </Button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>
            Remember your password?{' '}
            <button
              onClick={() => navigate('/auth')}
              className="text-primary hover:underline font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordSecurityQuestions;
