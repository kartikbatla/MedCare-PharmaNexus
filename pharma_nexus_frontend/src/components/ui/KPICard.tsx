import { Box, AlertTriangle, TrendingUp, CalendarClock, FileText, Wallet, ClipboardCheck, ClipboardList, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import TrendPill from './TrendPill';
import Tooltip from './Tooltip';

const iconMap: Record<string, LucideIcon> = {
  box: Box,
  alert: AlertTriangle,
  trending: TrendingUp,
  calendar: CalendarClock,
  file: FileText,
  wallet: Wallet,
  check: ClipboardCheck,
  clipboard: ClipboardList,
};

interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendTone?: 'success' | 'danger' | 'warning' | 'neutral';
  icon: string;
  hint?: string;
  to?: string;
  className?: string;
}

export default function KPICard({ label, value, change, trend, trendTone, icon, hint, to, className }: KPICardProps) {
  const Icon = iconMap[icon] ?? Box;
  const body = (
    <div className={cn('card card-hover p-5', className)}>
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-brand-charcoal/55">{label}</p>
        <Tooltip content={hint ?? label}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted transition-colors hover:bg-brand-navy/10">
            <Icon size={16} />
          </span>
        </Tooltip>
      </div>
      <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-brand-charcoal tabular-nums">
        {value}
      </p>
      {change && <TrendPill change={change} trend={trend} tone={trendTone} className="mt-3" />}
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="block rounded-xl">
        {body}
      </Link>
    );
  }
  return body;
}
