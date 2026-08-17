import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, CheckCircle2, ChevronDown, Zap } from 'lucide-react';
import Button from '../ui/Button';
import { procureNowUrl } from '../../lib/aiPanel';
import { cn } from '../../lib/utils';
import { inventory } from '../../data/mockData';

interface RecommendationProps {
  onApprove?: () => void;
  onDetails?: () => void;
}

const base = inventory[0];

const REC = {
  supplier: 'Aurobindo Pharma Limited',
  material: base.medicine,
  location: base.location,
  currentStock: base.currentStock,
  predictedDemand: base.predictedDemand,
  recommendedQty: Math.max(0, base.predictedDemand - base.currentStock),
  unitPrice: base.unitPrice,
};

const whySupplier = [
  `Product capability — ${base.medicine} is within Aurobindo’s approved manufacturing portfolio.`,
  'Delivery — 5-day lead time vs. 7–12 days for most alternatives.',
  'On-time delivery — 96% across the last 12 months.',
  'Cost — competitive total landed cost for the recommended quantity.',
];

export default function Recommendation({ onApprove, onDetails }: RecommendationProps) {
  const navigate = useNavigate();
  const [showWhy, setShowWhy] = useState(false);

  const procureNow = () =>
    onApprove ??
    (() =>
      navigate(
        procureNowUrl({
          supplier: REC.supplier,
          material: REC.material,
          qty: REC.recommendedQty,
          location: REC.location,
          ai: true,
        }),
      ));

  const review = () => onDetails ?? (() => navigate('/replenishment'));

  return (
    <div className="card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-navy via-brand-muted to-transparent" />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy text-white">
            <Sparkles size={14} />
          </span>
          <h3 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">
            Procurement Recommendation
          </h3>
          <span className="badge bg-brand-muted/10 text-brand-muted ml-auto">
            <ShieldCheck size={12} />
            Confidence 94%
          </span>
        </div>

        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div>
            <h4 className="text-[14.5px] font-semibold text-brand-charcoal">
              {REC.material} — {REC.location}
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/70">
              {REC.material} is expected to <span className="font-semibold text-status-danger">run out of stock in 4 days</span>{' '}
              based on current inventory and forecast demand.
            </p>
          </div>
          <span className="badge shrink-0 bg-status-dangerBg text-status-danger">Stock-out risk</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Current stock', value: `${REC.currentStock} units` },
            { label: 'Predicted demand', value: `${REC.predictedDemand} units` },
            { label: 'Recommended buy', value: `${REC.recommendedQty} units`, highlight: true },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                'rounded-lg border px-3 py-2',
                s.highlight
                  ? 'border-brand-navy/20 bg-brand-navy/[0.06]'
                  : 'border-brand-navy/8 bg-brand-navy/[0.02]',
              )}
            >
              <p className="text-[11px] text-brand-charcoal/50">{s.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-brand-charcoal tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-brand-navy/8 bg-brand-navy/[0.02] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                Recommended supplier
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[15px] font-semibold text-brand-charcoal">
                {REC.supplier}
                <CheckCircle2 size={16} className="text-status-success" />
              </p>
            </div>
            <button
              onClick={() => setShowWhy((s) => !s)}
              className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-brand-muted transition-colors hover:text-brand-navy"
            >
              Why this supplier?
              <ChevronDown size={13} className={cn('transition-transform', showWhy && 'rotate-180')} />
            </button>
          </div>

          {showWhy && (
            <div className="mt-3 space-y-1.5 border-t border-brand-navy/8 pt-3 animate-fade-in">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-muted uppercase">
                <Sparkles size={11} /> Selection rationale
              </p>
              {whySupplier.map((r, i) => (
                <p key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-brand-charcoal/75">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-status-success" />
                  {r}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={procureNow()}>
            <Zap size={15} /> Procure Now
          </Button>
          <Button variant="secondary" onClick={review()}>
            Review Recommendation
          </Button>
        </div>
      </div>
    </div>
  );
}
