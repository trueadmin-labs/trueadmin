import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const classes = ['trueadmin-page-transition', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <motion.div
        className="trueadmin-page-transition-inner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
