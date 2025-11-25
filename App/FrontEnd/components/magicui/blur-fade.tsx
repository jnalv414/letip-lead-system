'use client';

import { ReactNode, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  inView?: boolean;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  yOffset = 8,
  inView = true,
}: BlurFadeProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const shouldAnimate = inView ? isInView : true;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset, filter: 'blur(8px)' }}
      animate={shouldAnimate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
