import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrendPillProps {
  change: string;
  trend?: 'up' | 'down' | 'neutral';
  tone?: 'success' | 'danger' | 'warning' | 'neutral';
  className?: string;
}

export default function TrendPill({ change, trend = 'neutral', tone, className }: TrendPillProps) {
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const resolvedTone =
    tone ??
    (trend === 'up'
      ? 'success'
      : trend === 'down'
        ? 'danger'
        : 'neutral');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        resolvedTone === 'success' && 'text-status-success',
        resolvedTone === 'warning' && 'text-status-warning',
        resolvedTone === 'danger' && 'text-status-danger',
        resolvedTone === 'neutral' && 'text-brand-charcoal/50',
        className,
      )}
    >
      <Icon size={13} />
      {change}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = 'muted',
  className,
}: {
  value: number;
  tone?: 'muted' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const barColor =
    tone === 'success'
      ? 'bg-status-success'
      : tone === 'warning'
        ? 'bg-status-warning'
        : tone === 'danger'
          ? 'bg-status-danger'
          : 'bg-brand-muted';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-brand-navy/8', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', barColor)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
