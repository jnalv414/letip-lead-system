'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  delay?: number;
}

export function AnimatedList({
  children,
  className,
  delay = 0.1,
}: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence>
        {children.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              delay: index * delay,
              ease: 'easeOut',
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
