import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface SectionHeaderProps {
  index: string;
  kicker: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader = ({ index, kicker, title, action, className = '' }: SectionHeaderProps) => {
  const prefersReduced: boolean = useReducedMotion() ?? false;

  return (
    <div className={`flex items-end justify-between gap-6 ${className}`}>
      <div className="min-w-0">
        <div className="mb-2.5 md:mb-4 flex items-center gap-3">
          <motion.span
            className="rounded-sm border border-ember-300 bg-ember-100/60 px-1.5 py-0.5 font-data text-xs text-ember-700"
            initial={prefersReduced ? false : { opacity: 0, scale: 1.6, rotate: -8 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            {index}
          </motion.span>
          <span className="text-kicker uppercase text-pine-600">{kicker}</span>
        </div>
        <h2 className="font-display text-lg md:text-h2 text-ink">{title}</h2>
        <motion.div
          className="mt-3 md:mt-5 h-px w-full max-w-64 origin-left bg-border"
          initial={prefersReduced ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.15 }}
        />
      </div>
      {action && <div className="shrink-0 pb-1.5">{action}</div>}
    </div>
  );
};

export default SectionHeader;
