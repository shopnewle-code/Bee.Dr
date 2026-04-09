import { motion } from 'framer-motion';

/**
 * Loading skeleton for cards
 */
export const CardSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 2, repeat: Infinity }}
    className="p-4 rounded-lg border border-primary/10 bg-primary/5"
  >
    <div className="space-y-3">
      <div className="h-4 bg-primary/20 rounded w-2/3" />
      <div className="h-3 bg-primary/20 rounded w-full" />
      <div className="h-3 bg-primary/20 rounded w-1/2" />
    </div>
  </motion.div>
);

/**
 * Loading skeletal for health score ring
 */
export const HealthScoreSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 2, repeat: Infinity }}
    className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary/20"
  />
);

/**
 * Empty state when no reports exist
 */
export const EmptyReportsState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="py-12 text-center"
  >
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-8 h-8 text-primary/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <h3 className="font-semibold mb-2">No Reports Yet</h3>
    <p className="text-sm text-muted-foreground mb-6">
      Start by uploading your first medical report
    </p>
    <button className="px-6 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary font-semibold transition-colors">
      Upload Report
    </button>
  </motion.div>
);

/**
 * Empty state for services
 */
export const EmptyServicesState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="py-12 text-center"
  >
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
      <svg
        className="w-8 h-8 text-primary/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    </div>
    <h3 className="font-semibold mb-2">Services Coming Soon</h3>
    <p className="text-sm text-muted-foreground">
      We're adding more services. Stay tuned!
    </p>
  </motion.div>
);

/**
 * Pattern for multiple card skeletons
 */
export const CardGridSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
