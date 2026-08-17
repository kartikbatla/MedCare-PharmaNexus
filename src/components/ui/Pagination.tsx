import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function visibleRange(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to };
}

export default function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  if (total <= pageSize) return null;

  const pages = pageCount(total, pageSize);
  const { from, to } = visibleRange(page, pageSize, total);

  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, Math.max(start + 4, 5));
  const window: number[] = [];
  for (let i = start; i <= end; i += 1) window.push(i);

  const pageBtn =
    'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium transition-colors';

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-[13px] text-brand-charcoal/55">
        Showing <span className="font-medium text-brand-charcoal">{from}</span>–<span className="font-medium text-brand-charcoal">{to}</span> of{' '}
        <span className="font-medium text-brand-charcoal">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={cn(
            pageBtn,
            'gap-1 border border-brand-navy/10 text-brand-charcoal/70 hover:border-brand-muted hover:text-brand-navy disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {window.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              pageBtn,
              p === page
                ? 'bg-brand-navy text-white'
                : 'border border-transparent text-brand-charcoal/60 hover:bg-brand-navy/5 hover:text-brand-charcoal',
            )}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={cn(
            pageBtn,
            'gap-1 border border-brand-navy/10 text-brand-charcoal/70 hover:border-brand-muted hover:text-brand-navy disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
