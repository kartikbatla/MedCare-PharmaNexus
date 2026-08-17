import StatusBadge from '../ui/StatusBadge';
import { cn } from '../../lib/utils';
import type { MigrationStatus, RecordStatus, DuplicateResolution, MatchResolution, DataCategory } from '../../data/migration';

const migrationTones: Record<MigrationStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'Not Started': 'neutral',
  Assessment: 'info',
  Extraction: 'info',
  Transformation: 'warning',
  Validation: 'warning',
  Loading: 'warning',
  Completed: 'success',
  'Action Required': 'danger',
};

const recordTones: Record<RecordStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Confirmed: 'success',
  'Requires Review': 'warning',
  Rejected: 'danger',
  Duplicate: 'danger',
};

const duplicateTones: Record<DuplicateResolution, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'Keep Both': 'success',
  'Mark Duplicate': 'danger',
  Review: 'warning',
};

const matchTones: Record<MatchResolution | 'Unresolved', 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'Map to Existing': 'success',
  'Create New': 'info',
  Unresolved: 'warning',
};

export function MigrationBadge({ status }: { status: MigrationStatus }) {
  return <StatusBadge status={status} tone={migrationTones[status]} />;
}

export function RecordBadge({ status }: { status: RecordStatus }) {
  return <StatusBadge status={status} tone={recordTones[status]} />;
}

export function DuplicateBadge({ status }: { status: DuplicateResolution | 'Requires Review' }) {
  return <StatusBadge status={status} tone={duplicateTones[status as DuplicateResolution] ?? 'warning'} />;
}

export function MatchBadge({ status }: { status: MatchResolution | 'Unresolved' }) {
  return <StatusBadge status={status} tone={matchTones[status]} />;
}

export function SourceBadge({ source }: { source: 'Migrated' | 'PharmaNexus' | 'Historical' }) {
  if (source === 'PharmaNexus') {
    return (
      <span className="badge bg-status-successBg text-status-success">
        <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
        {source}
      </span>
    );
  }
  return (
    <span className="badge bg-status-infoBg text-brand-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-muted" />
      {source}
    </span>
  );
}

export function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 95
      ? 'bg-status-successBg text-status-success'
      : pct >= 85
        ? 'bg-status-warningBg text-status-warning'
        : 'bg-status-dangerBg text-status-danger';
  return (
    <span className={cn('badge', tone)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          pct >= 95 && 'bg-status-success',
          pct >= 85 && pct < 95 && 'bg-status-warning',
          pct < 85 && 'bg-status-danger',
        )}
      />
      {pct}%
    </span>
  );
}

export function CategoryChip({ category }: { category: DataCategory }) {
  return <span className="badge bg-brand-navy/6 text-brand-charcoal/70">{category}</span>;
}

export function StageIndicator({ current }: { current: number }) {
  const stages = [
    'Understand Current System',
    'Configure Extractors',
    'Extract Data',
    'Transform & Validate',
    'Load Into PharmaNexus',
    'Migration Verification',
  ];
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {stages.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <li
            key={label}
            className={cn(
              'flex items-start gap-2.5 rounded-xl border p-3',
              active ? 'border-brand-navy/25 bg-brand-navy/4' : done ? 'border-status-success/40 bg-status-successBg' : 'border-brand-navy/10 bg-white',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                done && 'bg-status-success text-white',
                active && 'bg-brand-navy text-white',
                !done && !active && 'bg-brand-navy/10 text-brand-charcoal/50',
              )}
            >
              {done ? '✓' : idx}
            </span>
            <div className="min-w-0">
              <p className={cn('text-[12px] font-semibold leading-tight', active ? 'text-brand-navy' : done ? 'text-status-success' : 'text-brand-charcoal/60')}>
                {label}
              </p>
              {active && <p className="mt-0.5 text-[10.5px] leading-tight text-brand-charcoal/50">Current stage</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
