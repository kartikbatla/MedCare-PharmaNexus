import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, PackageSearch, Truck } from 'lucide-react';
import type { ProcurementRecommendation } from '../../data/procurementRecommendations';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

export function createMaterialRequestUrl(rec: ProcurementRecommendation): string {
  const params = new URLSearchParams();
  params.set('open', '1');
  params.set('material', rec.medicine);
  params.set('location', rec.location);
  params.set('qty', String(rec.recommendedQty));
  params.set('priority', rec.priority);
  return `/material-requests?${params.toString()}`;
}

export default function ProcurementRecommendationCard({
  recommendation: rec,
  compact,
}: {
  recommendation: ProcurementRecommendation;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const coverPct = Math.min(100, Math.round((rec.currentStock / Math.max(rec.reorderLevel, 1)) * 100));

  return (
    <div className="flex flex-col rounded-xl border border-brand-navy/8 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              rec.priority === 'High' ? 'bg-status-dangerBg text-status-danger' : rec.priority === 'Medium' ? 'bg-status-warningBg text-status-warning' : 'bg-status-successBg text-status-success',
            )}
          >
            <PackageSearch size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-brand-charcoal">{rec.medicine}</p>
            <p className="flex items-center gap-1 text-[12px] text-brand-charcoal/55">
              <MapPin size={11} /> {rec.location}
            </p>
          </div>
        </div>
        <StatusBadge status={rec.priority === 'High' ? 'High' : rec.priority === 'Medium' ? 'Medium' : 'Low'} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2">
          <p className="text-[11px] text-brand-charcoal/50">Current stock</p>
          <p className="text-[14px] font-semibold text-brand-charcoal tabular-nums">{rec.currentStock} units</p>
        </div>
        <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2">
          <p className="text-[11px] text-brand-charcoal/50">Reorder level</p>
          <p className="text-[14px] font-semibold text-brand-charcoal tabular-nums">{rec.reorderLevel} units</p>
        </div>
        <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2">
          <p className="text-[11px] text-brand-charcoal/50">Recommended</p>
          <p className="text-[14px] font-semibold text-brand-muted tabular-nums">{rec.recommendedQty} units</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-navy/8">
          <div
            className={cn(
              'h-full rounded-full',
              rec.priority === 'High' ? 'bg-status-danger' : rec.priority === 'Medium' ? 'bg-status-warning' : 'bg-status-success',
            )}
            style={{ width: `${coverPct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-brand-charcoal/45">
          <span>Stock vs reorder level ({coverPct}%)</span>
          <span>Forecast: {rec.forecastDemand} units</span>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-brand-charcoal/70">{rec.reason}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-brand-charcoal/55">
          <Truck size={12} className="shrink-0 text-brand-muted" />
          <span className="truncate">{rec.supplier}</span>
        </p>
        <Button size="sm" onClick={() => navigate(createMaterialRequestUrl(rec))} className={compact ? 'px-3' : ''}>
          Create Material Request <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
}
