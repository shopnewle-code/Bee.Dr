import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { sendPasswordResetEmail, sendPasswordResetOTP } from '@/utils/email-service';
import { generateResetToken, generateOTP } from '@/utils/token-utils';
import { toast } from 'sonner';

type ResetMethod = 'email' | 'phone';
type Stage = 'method' | 'input' | 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('method');
  const [method, setMethod] = useState<ResetMethod>('email');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Handle email/phone input and send reset link
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      if (!input.trim()) {
        setError(method === 'email' ? 'Please enter your email' : 'Please enter your phone number');
        setLoading(false);
        return;
      }

      if (method === 'email') {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }

        // Check if user exists (security: don't reveal if account exists)
        const { data: exists } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', (await supabase.auth.signInWithPassword({ email: input, password: 'dummy' }).catch(() => ({ data: null }))).user?.id || '')
          .single();

        // Always show generic message
        const token = generateResetToken();
        setResetToken(token);

        // Send reset email
        const sent = await sendPasswordResetEmail(input, token, 'User');
        if (!sent) {
          toast.error('Failed to send reset email. Please try again.');
        } else {
          toast.success('If this account exists, a reset link has been sent');
        }
      } else {
        // Phone-based reset (OTP)
        const otp = generateOTP();
        setResetToken(otp);

        // Send OTP
        const sent = await sendPasswordResetOTP(input, otp);
        if (!sent) {
          toast.error('Failed to send OTP. Please try again.');
        } else {
          toast.success('If this account exists, an OTP has been sent');
        }
      }

      setStage('success');
    } catch (err: any) {
      setError('An error occurred. Please try again.');
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
          onClick={() => navigate('/auth')}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {stage === 'method' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Reset Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose how you'd like to reset your password
                </p>
              </div>

              {/* Email Option */}
              <button
                onClick={() => setMethod('email')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  method === 'email'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail className={`w-5 h-5 ${method === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-xs text-muted-foreground">Get a reset link via email</p>
                  </div>
                </div>
              </button>

              {/* Phone Option */}
              <button
                onClick={() => setMethod('phone')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  method === 'phone'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Phone className={`w-5 h-5 ${method === 'phone' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <p className="text-xs text-muted-foreground">Get an OTP via SMS</p>
                  </div>
                </div>
              </button>

              <Button
                onClick={() => setStage('input')}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {stage === 'input' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  {method === 'email' ? 'Enter Your Email' : 'Enter Your Phone'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {method === 'email'
                    ? 'We'll send you a link to reset your password'
                    : 'We'll send you a 6-digit code'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Field */}
                <div>
                  <Input
                    type={method === 'email' ? 'email' : 'tel'}
                    placeholder={method === 'email' ? 'your@email.com' : '+91 98765 43210'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !input}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                {/* Back Link */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStage('method');
                    setError('');
                  }}
                  className="w-full"
                >
                  Back
                </Button>
              </form>

              {/* Security Note */}
              <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground text-center">
                🔒 Your password reset link expires in <strong>15 minutes</strong> for security
              </div>
            </motion.div>
          )}

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
                  Check Your {method === 'email' ? 'Email' : 'Phone'}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {method === 'email'
                    ? `We've sent a reset link to ${input}. Check your email (including spam folder).`
                    : `We've sent a 6-digit code to ${input}. Check your SMS messages.`}
                </p>
                <p className="text-xs text-muted-foreground">
                  The link/code expires in <strong>15 minutes</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90">
                  <a href="/reset-password">Reset Password</a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>

              {/* Resend Option */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStage('input');
                  setInput('');
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Use different {method === 'email' ? 'email' : 'phone'}
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

export default ForgotPassword;
