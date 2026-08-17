import { cn } from '../../lib/utils';

interface TabsProps<T extends string> {
  tabs: Array<{ id: T; label: string; count?: number }>;
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto rounded-lg bg-brand-navy/5 p-1 no-scrollbar', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
            active === tab.id
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-brand-charcoal/55 hover:text-brand-charcoal',
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums',
                active === tab.id ? 'bg-brand-muted text-white' : 'bg-brand-navy/8 text-brand-charcoal/60',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
