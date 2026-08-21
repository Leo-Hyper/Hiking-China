import React from 'react';

type TrailTagTone = 'pine' | 'ember' | 'mist' | 'neutral';

interface TrailTagProps {
  children: React.ReactNode;
  tone?: TrailTagTone;
  className?: string;
}

const TONE_CLASSES: Record<TrailTagTone, string> = {
  pine: 'border-pine-200 bg-pine-50 text-pine-700',
  ember: 'border-ember-200 bg-ember-100 text-ember-700',
  mist: 'border-mist-400/40 bg-paper text-mist-600',
  neutral: 'border-border bg-muted/60 text-muted-foreground',
};

const TrailTag = ({ children, tone = 'pine', className = '' }: TrailTagProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 font-data text-[11px] tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export default TrailTag;
