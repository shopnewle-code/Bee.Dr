import { motion } from 'framer-motion';
import { ReactNode, Suspense } from 'react';
import { Loader } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <Loader className="w-8 h-8 text-primary" />
    </motion.div>
  </div>
);

const PageTransition = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  </Suspense>
);

export default PageTransition;
