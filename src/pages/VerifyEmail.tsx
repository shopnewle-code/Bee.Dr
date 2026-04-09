import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyEmailToken } from '@/utils/email-verification';
import { toast } from 'sonner';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [error, setError] = useState('');

  const userId = searchParams.get('user_id');
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      // Validate parameters
      if (!userId || !token) {
        setStatus('error');
        setError('Invalid verification link - missing parameters');
        return;
      }

      try {
        // Call backend to verify token
        const success = await verifyEmailToken(userId, token);

        if (success) {
          setStatus('success');
          toast.success('Email verified successfully!');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        } else {
          setStatus('error');
          setError('Verification token is invalid or has expired');
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Failed to verify email');
      }
    };

    verify();
  }, [userId, token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Loading State */}
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center mx-auto">
                  <Loader className="w-8 h-8 text-primary animate-spin" />
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Verifying Email
                </h1>
                <p className="text-sm text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-12"
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
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Email Verified! ✓
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified successfully. You can now sign in to your account.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                >
                  Go to Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground">
                  Redirecting automatically in 3 seconds...
                </p>
              </div>

              {/* What's Next */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-left">
                <p className="text-xs text-green-800 mb-2 font-semibold">
                  ✓ What's next?
                </p>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>→ Sign in with your email and password</li>
                  <li>→ Complete your health profile</li>
                  <li>→ Start using Bee.Dr</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-12"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Verification Failed
                </h1>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/auth')}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Back to Sign In
                </Button>

                <Button
                  onClick={() => navigate('/auth?mode=signup&resend-email=true')}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                >
                  Resend Verification Email
                </Button>
              </div>

              {/* Troubleshooting */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p className="text-xs text-yellow-800 mb-2 font-semibold">
                  ⚠️ Troubleshooting
                </p>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Check if the link is complete and not cut off</li>
                  <li>• Verification links expire after 24 hours</li>
                  <li>• Try requesting a new verification email</li>
                  <li>• Check your spam/junk folder</li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Need help? Contact support@bee.dr
              </p>
            </motion.div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-12"
            >
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>

              <div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Link Expired
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your verification link has expired. Please request a new one.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/auth?mode=signup&resend-email=true')}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                >
                  Send New Verification Email
                </Button>

                <Button
                  onClick={() => navigate('/auth')}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Back to Sign In
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
