import { cn } from '../../lib/utils';

interface SegmentControlProps<T extends string> {
  options: Array<{ id: T; label: string; suffix?: string }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentControlProps<T>) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-brand-navy/12 bg-white p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
            value === opt.id
              ? 'bg-brand-navy text-white'
              : 'text-brand-charcoal/60 hover:text-brand-charcoal',
          )}
        >
          {opt.label}
          {opt.suffix && <span className="tabular-nums opacity-80">{opt.suffix}</span>}
        </button>
      ))}
    </div>
  );
}
