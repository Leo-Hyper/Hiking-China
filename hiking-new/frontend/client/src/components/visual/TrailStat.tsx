import type { LucideIcon } from 'lucide-react';

interface TrailStatProps {
  icon: LucideIcon;
  value: string;
  unit?: string;
  label: string;
  dark?: boolean;
}

const TrailStat = ({ icon: Icon, value, unit, label, dark = false }: TrailStatProps) => {
  return (
    <div className="flex items-center gap-3">
      <Icon
        size={18}
        strokeWidth={1.75}
        className={dark ? 'text-pine-300' : 'text-pine-600'}
      />
      <div>
        <div
          className={`font-data text-lg leading-none tracking-tight ${
            dark ? 'text-pine-50' : 'text-ink'
          }`}
        >
          {value}
          {unit && (
            <span
              className={`ml-1 text-xs ${dark ? 'text-pine-400' : 'text-muted-foreground'}`}
            >
              {unit}
            </span>
          )}
        </div>
        <div
          className={`mt-1.5 text-[11px] tracking-wider ${
            dark ? 'text-pine-400' : 'text-muted-foreground'
          }`}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default TrailStat;
