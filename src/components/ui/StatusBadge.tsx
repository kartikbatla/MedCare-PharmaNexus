import { cn } from '../../lib/utils';
import type { StatusTone } from '../../data/mockData';

const toneMap: Record<StatusTone, string> = {
  success: 'bg-status-successBg text-status-success',
  warning: 'bg-status-warningBg text-status-warning',
  danger: 'bg-status-dangerBg text-status-danger',
  info: 'bg-status-infoBg text-brand-muted',
  neutral: 'bg-brand-navy/6 text-brand-charcoal/60',
};

export function statusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (
    s.includes('healthy') ||
    s.includes('approved') ||
    s.includes('completed') ||
    s.includes('fulfilled') ||
    s.includes('verified') ||
    s.includes('delivered') ||
    s.includes('matched') ||
    s.includes('paid') ||
    s.includes('success') ||
    s.includes('low') ||
    s.includes('active')
  ) {
    return 'success';
  }
  if (
    s.includes('critical') ||
    s.includes('failed') ||
    s.includes('reject') ||
    s.includes('mismatch') ||
    s.includes('high') ||
    s.includes('overdue')
  ) {
    return 'danger';
  }
  if (
    s.includes('warning') ||
    s.includes('review') ||
    s.includes('pending') ||
    s.includes('draft') ||
    s.includes('partially') ||
    s.includes('expiring') ||
    s.includes('medium') ||
    s.includes('sent') ||
    s.includes('request') ||
    s.includes('under') ||
    s.includes('required')
  ) {
    return 'warning';
  }
  if (s.includes('received') || s.includes('processing')) {
    return 'info';
  }
  return 'neutral';
}

interface StatusBadgeProps {
  status: string;
  tone?: StatusTone;
  dot?: boolean;
  variant?: 'default' | 'onDark';
  className?: string;
}

export default function StatusBadge({
  status,
  tone,
  dot = true,
  variant = 'default',
  className,
}: StatusBadgeProps) {
  const resolvedTone = tone ?? statusTone(status);
  if (variant === 'onDark') {
    return (
      <span className={cn('badge bg-white/10 text-white', className)}>
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-white/70" />}
        {status}
      </span>
    );
  }
  return (
    <span className={cn('badge', toneMap[resolvedTone], className)}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            resolvedTone === 'success' && 'bg-status-success',
            resolvedTone === 'warning' && 'bg-status-warning',
            resolvedTone === 'danger' && 'bg-status-danger',
            resolvedTone === 'info' && 'bg-brand-muted',
            resolvedTone === 'neutral' && 'bg-brand-charcoal/30',
          )}
        />
      )}
      {status}
    </span>
  );
}
