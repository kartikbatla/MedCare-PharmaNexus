import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
  className?: string;
}

export default function EmptyState({ title, message, action, compact, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-20', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy/5 text-brand-muted">
        <Inbox size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-brand-charcoal">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-[13px] text-brand-charcoal/55">{message}</p>}
      {action && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
