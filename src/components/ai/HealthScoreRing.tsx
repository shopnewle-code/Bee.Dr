import { motion } from 'framer-motion';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function HealthScoreRing({ score, size = 140, strokeWidth = 8, className = '' }: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const getScoreColor = () => {
    if (score >= 80) return { main: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.1)', label: 'Excellent' };
    if (score >= 60) return { main: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)', label: 'Good' };
    if (score >= 40) return { main: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.1)', label: 'Fair' };
    return { main: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.1)', label: 'Needs Attention' };
  };

  const { main, label } = getScoreColor();

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 30px ${main}33, 0 0 60px ${main}11` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="url(#healthGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-display font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <motion.span
          className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {label}
        </motion.span>
      </div>
    </div>
  );
}
