import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertOctagon, Info, type LucideIcon } from 'lucide-react';
import type { Alert } from '../../data/mockData';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const severityStyle: Record<
  Alert['severity'],
  { icon: LucideIcon; border: string; badge: string; badgeText: string }
> = {
  critical: {
    icon: AlertOctagon,
    border: 'border-l-status-danger',
    badge: 'bg-status-dangerBg text-status-danger',
    badgeText: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-status-warning',
    badge: 'bg-status-warningBg text-status-warning',
    badgeText: 'Attention',
  },
  info: {
    icon: Info,
    border: 'border-l-brand-muted',
    badge: 'bg-status-infoBg text-brand-muted',
    badgeText: 'Info',
  },
};

export default function AlertCard({ alert }: { alert: Alert }) {
  const navigate = useNavigate();
  const style = severityStyle[alert.severity];
  const Icon = style.icon;

  return (
    <div className={cn('card card-hover flex flex-col overflow-hidden border-l-[3px]', style.border)}>
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('badge', style.badge)}>
            <Icon size={12} />
            {style.badgeText}
          </span>
        </div>
        <h4 className="mt-2.5 text-[14.5px] font-semibold text-brand-charcoal">{alert.title}</h4>
        <p className="mt-0.5 text-[13px] text-brand-charcoal/60">{alert.description}</p>
        <dl className="mt-3 grid grid-cols-1 gap-1.5 rounded-lg bg-brand-navy/[0.03] p-3">
          {alert.meta.map((m) => (
            <div key={m.label} className="flex items-baseline justify-between gap-2">
              <dt className="text-[11.5px] text-brand-charcoal/50">{m.label}</dt>
              <dd className="text-[12.5px] font-medium text-brand-charcoal tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex gap-2 border-t border-brand-navy/5 bg-brand-navy/[0.02] p-3">
        {alert.actions.map((action) => (
          <Button
            key={action.label}
            variant={action.type === 'primary' ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            onClick={() => navigate(alert.actionLinks?.[action.label] ?? alert.link)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
