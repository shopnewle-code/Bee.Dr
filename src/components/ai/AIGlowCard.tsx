import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AIGlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  animated?: boolean;
}

const glowMap = {
  primary: 'hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] border-primary/10 hover:border-primary/25',
  secondary: 'hover:shadow-[0_0_30px_hsl(var(--secondary)/0.15)] border-secondary/10 hover:border-secondary/25',
  success: 'hover:shadow-[0_0_30px_hsl(var(--success)/0.15)] border-success/10 hover:border-success/25',
  warning: 'hover:shadow-[0_0_30px_hsl(var(--warning)/0.15)] border-warning/10 hover:border-warning/25',
  destructive: 'hover:shadow-[0_0_30px_hsl(var(--destructive)/0.15)] border-destructive/10 hover:border-destructive/25',
};

export function AIGlowCard({ children, className, glowColor = 'primary', onClick, animated = true }: AIGlowCardProps) {
  const Component = animated ? motion.div : 'div';
  const animProps = animated ? {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: 0.98 },
  } : {};

  return (
    <Component
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-xl p-5 transition-all duration-300 cursor-pointer',
        glowMap[glowColor],
        className
      )}
      {...animProps}
    >
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(at 20% 30%, hsl(var(--primary)) 0px, transparent 50%), radial-gradient(at 80% 70%, hsl(var(--secondary)) 0px, transparent 50%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

interface AIBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'glow' | 'pulse';
  className?: string;
}

export function AIBadge({ children, variant = 'default', className }: AIBadgeProps) {
  if (variant === 'pulse') {
    return (
      <motion.span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary',
          className
        )}
        animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary) / 0.2)', '0 0 0 6px hsl(var(--primary) / 0)', '0 0 0 0 hsl(var(--primary) / 0)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {children}
      </motion.span>
    );
  }

  if (variant === 'glow') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]',
        className
      )}>
        {children}
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground',
      className
    )}>
      {children}
    </span>
  );
}
