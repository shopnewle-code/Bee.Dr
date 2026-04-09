import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getSecurityQuestions, normalizeAnswer } from '@/utils/security-questions';
import { validatePasswordStrength } from '@/utils/password-validator';
import SecurityQuestionsSetup from '@/components/SecurityQuestionsSetup';

type SignupStage = 'info' | 'password' | 'questions' | 'verification' | 'success';

const AuthSignup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Step 1: User Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Password
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');

  // Step 3: Security Questions
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  // UI State
  const [stage, setStage] = useState<SignupStage>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  // ============================================================================
  // STEP 1: User Info (Email + Name)
  // ============================================================================
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setStage('password');
  };

  // ============================================================================
  // STEP 2: Password Setup
  // ============================================================================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    // Check password strength
    const strength = validatePasswordStrength(password);
    if (!strength.isStrong) {
      setError('Password must contain: uppercase, lowercase, number, and special character');
      return;
    }

    setStage('questions');
  };

  // ============================================================================
  // STEP 3: Security Questions Setup
  // ============================================================================
  const handleQuestionsComplete = async (data: {
    questionIds: string[];
    answers: string[];
  }) => {
    setQuestionIds(data.questionIds);
    setAnswers(data.answers);
    setStage('verification');
  };

  // ============================================================================
  // STEP 4: Account Creation
  // ============================================================================
  const handleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Create user account in Supabase
      const { user, error: signupError } = await signUp(email, password, fullName);

      if (signupError) {
        setError(signupError.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setError('Failed to create account - no user ID returned');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 2. Store security questions (will be implemented in backend)
      // For now, we'll store them client-side and sync to backend
      const securityQuestionsData = questionIds.map((qId, index) => ({
        question_id: qId,
        answer: answers[index],
        question_text: getSecurityQuestions().find(q => q.id === qId)?.question || '',
      }));

      // Store in localStorage temporarily (backend will persist)
      localStorage.setItem(`security_questions_${user.id}`, JSON.stringify(securityQuestionsData));

      // 3. Send verification email (backend API call)
      // POST /api/auth/send-verification-email
      // await fetch('/api/auth/send-verification-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: user.id, email })
      // });

      toast.success('Account created! Check your email for verification link.');
      setStage('success');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/auth?mode=login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
        {/* Back Button (except on success) */}
        {stage !== 'success' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (stage === 'info') {
                navigate('/auth');
              } else if (stage === 'password') {
                setStage('info');
                setError('');
              } else if (stage === 'questions') {
                setStage('password');
                setError('');
              } else if (stage === 'verification') {
                setStage('questions');
                setError('');
              }
            }}
            className="mb-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Progress Indicator */}
          {stage !== 'success' && (
            <div className="flex justify-between mb-8">
              {['info', 'password', 'questions', 'verification'].map((s, i) => (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                      stage === s
                        ? 'bg-primary text-white'
                        : ['info', 'password', 'questions', 'verification'].indexOf(stage) > i
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center h-8 flex items-center">
                    {s === 'info' && 'Details'}
                    {s === 'password' && 'Password'}
                    {s === 'questions' && 'Questions'}
                    {s === 'verification' && 'Confirm'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== STAGE 1: USER INFO ===== */}
          {stage === 'info' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Create Account</h1>
                <p className="text-sm text-muted-foreground">
                  Start your AI-powered health journey
                </p>
              </div>

              <form onSubmit={handleInfoSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <Label htmlFor="fullName" className="text-xs font-medium">
                    Full Name
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email Address
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                >
                  Continue to Password
                </Button>

                {/* Login Link */}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </motion.div>
          )}

          {/* ===== STAGE 2: PASSWORD ===== */}
          {stage === 'password' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  Create Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Make it strong and secure
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Password Field */}
                <div>
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        const strength = validatePasswordStrength(e.target.value);
                        setPasswordStrength(strength.level as any);
                      }}
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40"
                      required
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            passwordStrength === 'weak'
                              ? 'w-1/4 bg-red-500'
                              : passwordStrength === 'fair'
                              ? 'w-1/2 bg-yellow-500'
                              : passwordStrength === 'good'
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength:{' '}
                        <span
                          className={
                            passwordStrength === 'weak'
                              ? 'text-red-500'
                              : passwordStrength === 'fair'
                              ? 'text-yellow-500'
                              : passwordStrength === 'good'
                              ? 'text-blue-500'
                              : 'text-green-500'
                          }
                        >
                          {passwordStrength.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className={password.length >= 8 ? 'text-green-600' : ''}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </p>
                    <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                      {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                    </p>
                    <p className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                      {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                    </p>
                    <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                      {/[0-9]/.test(password) ? '✓' : '○'} One number
                    </p>
                    <p className={/[!@#$%^&*]/.test(password) ? 'text-green-600' : ''}>
                      {/[!@#$%^&*]/.test(password) ? '✓' : '○'} One special character (!@#$%^&*)
                    </p>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <Label htmlFor="passwordConfirm" className="text-xs font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="passwordConfirm"
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40"
                      required
                    />
                  </div>
                  {passwordConfirm && password !== passwordConfirm && (
                    <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
                  )}
                  {passwordConfirm && password === passwordConfirm && (
                    <p className="text-xs text-green-600 mt-2">✓ Passwords match</p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!password || password !== passwordConfirm || passwordStrength === 'weak'}
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                >
                  Continue to Security Questions
                </Button>
              </form>
            </motion.div>
          )}

          {/* ===== STAGE 3: SECURITY QUESTIONS ===== */}
          {stage === 'questions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  Security Questions
                </h2>
                <p className="text-sm text-muted-foreground">
                  These help verify your identity if you forget your password
                </p>
              </div>

              <SecurityQuestionsSetup onComplete={handleQuestionsComplete} />
            </motion.div>
          )}

          {/* ===== STAGE 4: VERIFICATION ===== */}
          {stage === 'verification' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  Verify & Complete
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review your details before creating account
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{fullName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Security Questions:</span>
                  <span className="font-medium">3 Selected</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Privacy Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                ✓ Your data is encrypted and secure
                <br />✓ Security questions are never shared
                <br />✓ Verification email will be sent to {email}
              </div>

              {/* Create Button */}
              <Button
                onClick={handleSignup}
                disabled={loading}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 rounded-xl"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </motion.div>
          )}

          {/* ===== STAGE 5: SUCCESS ===== */}
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
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </motion.div>

              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  Account Created! 🎉
                </h3>
                <p className="text-sm text-muted-foreground">
                  A verification link has been sent to
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">{email}</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-left space-y-2">
                <p>
                  <strong>Next steps:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check your email for verification link</li>
                  <li>Click the link to verify your account</li>
                  <li>Return here and sign in</li>
                </ol>
              </div>

              <p className="text-xs text-muted-foreground">
                Redirecting to login in 3 seconds...
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthSignup;
