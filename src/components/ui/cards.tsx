import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * HealthCard: Premium health metric card
 * Used for displaying key health metrics with icons and descriptions
 */
export interface HealthCardProps {
  title: string;
  value: string | ReactNode;
  description?: string;
  icon: LucideIcon;
  type?: 'normal' | 'warning' | 'critical' | 'success';
  onClick?: () => void;
  className?: string;
}

export const HealthCard = ({
  title,
  value,
  description,
  icon: Icon,
  type = 'normal',
  onClick,
  className,
}: HealthCardProps) => {
  const typeStyles = {
    normal: 'border-primary/20 hover:border-primary/40 bg-primary/5',
    warning: 'border-amber-400/20 hover:border-amber-400/40 bg-amber-400/5',
    critical: 'border-red-500/20 hover:border-red-500/40 bg-red-500/5',
    success: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5',
  };

  const iconStyles = {
    normal: 'text-primary',
    warning: 'text-amber-400',
    critical: 'text-red-500',
    success: 'text-emerald-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border transition-all duration-300 cursor-pointer',
        typeStyles[type],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
        </div>
        <Icon className={cn('w-6 h-6 flex-shrink-0', iconStyles[type])} />
      </div>
    </motion.div>
  );
};

/**
 * ActionCard: Large clickable action card
 * Used for quick actions and primary CTAs
 */
export interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  gradient?: string;
  disabled?: boolean;
  className?: string;
}

export const ActionCard = ({
  icon: Icon,
  label,
  description,
  onClick,
  gradient = 'from-primary to-blue-600',
  disabled = false,
  className,
}: ActionCardProps) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative p-6 rounded-2xl overflow-hidden text-left group transition-all duration-300',
        `bg-gradient-to-br ${gradient}`,
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        <Icon className="w-8 h-8 text-white mb-3" />
        <h3 className="font-semibold text-white text-lg">{label}</h3>
        {description && <p className="text-white/80 text-sm mt-1">{description}</p>}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 group-hover:h-1.5 transition-all duration-300" />
    </motion.button>
  );
};

/**
 * InsightCard: Card for displaying health insights/analysis
 * Used in the Insights dashboard
 */
export interface InsightCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  severity?: 'info' | 'warning' | 'alert';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const InsightCard = ({
  title,
  description,
  icon: Icon,
  severity = 'info',
  actionLabel,
  onAction,
  className,
}: InsightCardProps) => {
  const severityStyles = {
    info: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
    warning: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20',
    alert: 'border-red-200 bg-red-50 dark:bg-red-950/20',
  };

  const iconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-amber-600 dark:text-amber-400',
    alert: 'text-red-600 dark:text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-lg border',
        severityStyles[severity],
        className,
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyles[severity])} />
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * ReportCard: Card for displaying report data
 */
export interface ReportCardProps {
  title: string;
  date: string;
  type: string;
  status?: 'pending' | 'approved' | 'flagged';
  onClick?: () => void;
  className?: string;
}

export const ReportCard = ({
  title,
  date,
  type,
  status = 'pending',
  onClick,
  className,
}: ReportCardProps) => {
  const statusStyles = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    flagged: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border border-primary/20 hover:border-primary/40 bg-background/50 hover:bg-background transition-all duration-300 text-left',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{date}</p>
        </div>
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-md', statusStyles[status])}>
          {status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{type}</p>
    </motion.button>
  );
};

/**
 * AdminCard: Restricted admin tool card
 */
export interface AdminCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  gradient?: string;
}

export const AdminCard = ({
  icon: Icon,
  label,
  description,
  onClick,
  gradient = 'from-primary/20 to-primary/10',
}: AdminCardProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 rounded-lg border border-primary/30 bg-gradient-to-br ${gradient} group overflow-hidden`}
    >
      <div className="relative z-10">
        <Icon className="w-6 h-6 text-primary mb-2" />
        <h4 className="font-semibold text-sm">{label}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      {/* Hover accent */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
};
