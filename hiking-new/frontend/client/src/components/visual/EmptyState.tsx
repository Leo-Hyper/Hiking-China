import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Compass } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState = ({
  icon: Icon = Compass,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-8 py-16 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-paper">
        <Icon size={20} strokeWidth={1.75} className="text-pine-600" />
      </div>
      <h3 className="mt-5 font-display text-h3 text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
