import { motion } from 'framer-motion';

export function ECGLine({ className = '', color = 'hsl(var(--primary))' }: { className?: string; color?: string }) {
  const path = "M0,25 L10,25 L15,25 L18,10 L22,40 L26,5 L30,35 L34,25 L45,25 L55,25 L58,10 L62,40 L66,5 L70,35 L74,25 L85,25 L95,25 L98,10 L102,40 L106,5 L110,35 L114,25 L125,25 L135,25 L138,10 L142,40 L146,5 L150,35 L154,25 L165,25 L175,25 L178,10 L182,40 L186,5 L190,35 L194,25 L200,25";

  return (
    <div className={`overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.2}
        />
      </svg>
    </div>
  );
}

export function PulseRing({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-destructive/40"
        animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-destructive/40"
        animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute inset-2 rounded-full bg-destructive/10 flex items-center justify-center"
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-destructive">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />
        </svg>
      </motion.div>
    </div>
  );
}
