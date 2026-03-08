import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Crown, Check, Star, Zap, Shield, Bot, TrendingUp, Globe
} from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '/month',
    highlight: false,
    features: [
      '3 report scans/month',
      'Basic AI insights',
      'English only',
      'Limited AI chat (5 msgs/day)',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Premium',
    price: '₹499',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Unlimited report scans',
      'Advanced AI analysis',
      'Hindi + English',
      'Unlimited AI Doctor chat',
      'Health trends & tracking',
      'Priority processing',
      'Medication reminders',
    ],
    cta: 'Upgrade to Premium',
    disabled: false,
  },
  {
    name: 'Family',
    price: '₹999',
    period: '/month',
    highlight: false,
    features: [
      'Everything in Premium',
      'Up to 5 family members',
      'Family health dashboard',
      'All languages',
      'Doctor recommendations',
      'Priority support',
    ],
    cta: 'Choose Family',
    disabled: false,
  },
];

const SubscriptionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Crown className="w-5 h-5 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">Subscription</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg space-y-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Upgrade Your Health</h1>
          <p className="text-sm text-muted-foreground">Unlock unlimited AI analysis & features</p>
        </motion.div>

        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl p-5 border ${
              plan.highlight ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-card'
            }`}>
            {plan.badge && (
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide flex items-center gap-1 mb-2">
                <Star className="w-3 h-3" /> {plan.badge}
              </span>
            )}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button disabled={plan.disabled}
              className={`w-full ${plan.highlight ? 'gradient-primary text-primary-foreground' : ''}`}
              variant={plan.highlight ? 'default' : 'outline'} size="sm">
              {plan.cta}
            </Button>
          </motion.div>
        ))}

        {/* Payment Methods */}
        <div className="pt-4">
          <p className="text-xs text-muted-foreground text-center mb-3">Payment Methods</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {['UPI', 'Credit Card', 'Google Pay', 'Apple Pay'].map(m => (
              <span key={m} className="text-[10px] px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                {m}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;
