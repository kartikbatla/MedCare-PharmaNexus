import { procurementPipeline } from '../../data/mockData';
import { cn } from '../../lib/utils';

const stageTone: Record<string, string> = {
  REQUEST: 'bg-brand-navy/10 text-brand-navy',
  PREDICT: 'bg-brand-muted/15 text-brand-muted',
  PLAN: 'bg-brand-muted/15 text-brand-muted',
  PROCURE: 'bg-brand-navy/10 text-brand-navy',
  RECEIVE: 'bg-brand-muted/15 text-brand-muted',
  VERIFY: 'bg-brand-muted/15 text-brand-muted',
  MATCH: 'bg-brand-navy/10 text-brand-navy',
  PAY: 'bg-brand-navy/10 text-brand-navy',
  ANALYZE: 'bg-brand-navy/10 text-brand-navy',
};

export default function PipelineStrip() {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex min-w-max items-stretch gap-0">
        {procurementPipeline.map((stage, i) => (
          <div key={stage.stage} className="flex items-center">
            <div className="w-[118px]">
              <div className={cn('mb-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1', stageTone[stage.stage])}>
                <span className="text-[10.5px] font-bold tracking-wide">{stage.stage}</span>
              </div>
              <p className="truncate text-xs font-medium text-brand-charcoal/70">{stage.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-brand-charcoal/45">{stage.detail}</p>
            </div>
            {i < procurementPipeline.length - 1 && (
              <div className="mx-1 mb-5 flex w-3 shrink-0 items-center">
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-brand-navy/20" fill="none">
                  <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
