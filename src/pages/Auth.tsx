import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Mail, Lock, User, ChevronRight, Sparkles, Heart, Shield, Brain } from 'lucide-react';
import { toast } from 'sonner';

const features = [
  { icon: Brain, label: 'AI Report Analysis' },
  { icon: Heart, label: 'Health Tracking' },
  { icon: Shield, label: 'Data Privacy' },
];

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast.success('Account created! Check your email to confirm.');
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error(error.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        {/* Decorative orbs */}
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 mx-auto shadow-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-display font-bold text-white text-center mb-3 tracking-tight">Bee.dr</h2>
            <p className="text-lg text-white/60 text-center max-w-sm mb-10">
              AI-powered healthcare platform for smarter health decisions
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-3">
              {features.map(({ icon: Icon, label }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background gradient-mesh relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground tracking-tight">Bee.dr</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignUp ? 'Start your AI-powered health journey' : 'Sign in to your health dashboard'}
          </p>

          {/* Google Sign-In */}
          <Button variant="outline" className="w-full mb-4 gap-2.5 h-12 rounded-xl border-border/80 hover:bg-accent/50 transition-all" onClick={handleGoogleSignIn}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith" className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40" required />
                </div>
              </motion.div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40" required />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password-security-questions')}
                    className="text-xs font-semibold text-primary hover:underline transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="pl-10 h-11 rounded-xl bg-white/50 border-border/60 focus:border-primary/40" required minLength={6} />
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading}
              className="w-full h-12 rounded-xl gradient-primary text-white shadow-glow hover:shadow-xl transition-all text-sm font-semibold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait...
                </div>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
