import React, { useEffect, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.8 };
export const VIEWPORT_ONCE = { once: true, amount: 0.05 as const };

/**
 * Smooth scroll-triggered reveal for sections and blocks.
 */
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}> = ({ children, delay = 0, className = '', y = 16 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={VIEWPORT_ONCE}
    transition={{ duration: 0.55, delay, ease: EASE_OUT_EXPO }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Staggered container & item for lists and feature grids.
 */
export const StaggerList: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.06 }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={VIEWPORT_ONCE}
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 14 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: EASE_OUT_EXPO },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Smooth numeric counter for KPI statistics and risk scores.
 */
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  className?: string;
}> = ({ value, duration = 0.8, className = '' }) => {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: EASE_OUT_EXPO,
    });
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, motionVal, rounded]);

  return <span className={className}>{display}</span>;
};

/**
 * Animated horizontal progress bar / risk gauge.
 */
export const AnimatedProgressBar: React.FC<{
  value: number;
  barClassName?: string;
  trackClassName?: string;
}> = ({ value, barClassName = 'bg-slate-900', trackClassName = 'bg-slate-200' }) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${trackClassName}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(clamped > 0 ? 4 : 0, clamped)}%` }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className={`h-full rounded-full ${barClassName}`}
      />
    </div>
  );
};

/**
 * Subtle page/view transition wrapper.
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Animated modal backdrop and dialog container.
 */
export const AnimatedModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}> = ({ isOpen, onClose, children, maxWidthClass = 'max-w-md' }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl`}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

