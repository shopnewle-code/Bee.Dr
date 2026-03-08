import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ─── Stat Card ─── */
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  up?: boolean;
  index?: number;
  invertColors?: boolean;
}

export function StatCard({ icon: Icon, label, value, change, up = true, index = 0, invertColors }: StatCardProps) {
  const isGood = invertColors ? !up : up;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 + index * 0.05 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {change && (
          <span className={cn('text-[10px] font-medium flex items-center gap-0.5', isGood ? 'text-success' : 'text-destructive')}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

/* ─── Doctor Card ─── */
interface DoctorCardProps {
  name: string;
  specialization: string;
  experience?: number;
  rating?: number;
  fee?: number;
  available?: boolean;
  avatarUrl?: string | null;
  languages?: string[];
  onClick?: () => void;
}

export function DoctorCard({ name, specialization, experience, rating, fee, available, avatarUrl, onClick }: DoctorCardProps) {
  return (
    <div onClick={onClick} className="glass-card p-4 cursor-pointer group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-primary">{name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{specialization}</p>
        </div>
        {available !== undefined && (
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', available ? 'bg-success animate-pulse' : 'bg-muted-foreground/30')} />
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {experience && <span>{experience}y exp</span>}
        {rating && <span className="flex items-center gap-0.5">⭐ {rating.toFixed(1)}</span>}
        {fee && <span className="ml-auto font-semibold text-foreground">₹{fee}</span>}
      </div>
    </div>
  );
}

/* ─── Appointment Card ─── */
interface AppointmentCardProps {
  patient: string;
  time: string;
  type: string;
  status: 'scheduled' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  avatar?: string;
  age?: number;
  actions?: React.ReactNode;
  onClick?: () => void;
}

const statusStyles: Record<string, { dot: string; label: string }> = {
  'scheduled': { dot: 'bg-muted-foreground/30', label: 'Scheduled' },
  'waiting': { dot: 'bg-warning animate-pulse', label: 'Waiting' },
  'in-progress': { dot: 'bg-success animate-pulse', label: 'In Progress' },
  'completed': { dot: 'bg-primary', label: 'Completed' },
  'cancelled': { dot: 'bg-destructive', label: 'Cancelled' },
};

export function AppointmentCard({ patient, time, type, status, avatar, age, actions, onClick }: AppointmentCardProps) {
  const st = statusStyles[status] || statusStyles['scheduled'];
  return (
    <div onClick={onClick} className="glass-card p-4 flex items-center gap-4 group cursor-pointer">
      <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center text-xl shrink-0">
        {avatar || patient.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground text-sm truncate">{patient}</p>
          {age && <span className="text-[10px] text-muted-foreground shrink-0">Age {age}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{time}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{type}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full shrink-0', st.dot)} />
        <span className="text-[10px] text-muted-foreground">{st.label}</span>
        {actions && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>}
      </div>
    </div>
  );
}

/* ─── Medical Report Card ─── */
interface ReportCardProps {
  fileName: string;
  date: string;
  status: 'complete' | 'processing' | 'pending';
  healthScore?: number;
  abnormalCount?: number;
  onClick?: () => void;
}

export function ReportCard({ fileName, date, status, healthScore, abnormalCount, onClick }: ReportCardProps) {
  return (
    <div onClick={onClick} className="glass-card p-4 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold',
          status === 'complete' ? 'bg-success/10 text-success' :
          status === 'processing' ? 'bg-warning/10 text-warning' :
          'bg-muted text-muted-foreground'
        )}>
          {status === 'complete' ? '✓' : status === 'processing' ? '⏳' : '📄'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{fileName}</p>
          <p className="text-[10px] text-muted-foreground">{date}</p>
        </div>
        <div className="text-right">
          {healthScore !== undefined && (
            <p className={cn(
              'text-lg font-display font-bold',
              healthScore >= 80 ? 'text-success' : healthScore >= 60 ? 'text-warning' : 'text-destructive'
            )}>{healthScore}</p>
          )}
          {abnormalCount !== undefined && abnormalCount > 0 && (
            <p className="text-[10px] text-destructive">{abnormalCount} abnormal</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Patient Card ─── */
interface PatientCardProps {
  name: string;
  condition?: string;
  lastVisit?: string;
  risk?: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

const riskStyles = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function PatientCard({ name, condition, lastVisit, risk, onClick }: PatientCardProps) {
  return (
    <div onClick={onClick} className="glass-card p-4 flex items-center gap-4 cursor-pointer">
      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{name}</p>
        {(condition || lastVisit) && (
          <p className="text-xs text-muted-foreground truncate">{[condition, lastVisit].filter(Boolean).join(' · ')}</p>
        )}
      </div>
      {risk && (
        <span className={cn('text-[9px] px-2 py-0.5 rounded-full border font-medium', riskStyles[risk])}>
          {risk} risk
        </span>
      )}
    </div>
  );
}

/* ─── Section Header ─── */
interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-display font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}
