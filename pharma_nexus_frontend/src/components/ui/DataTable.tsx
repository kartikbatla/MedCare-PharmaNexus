import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import EmptyState from './EmptyState';
import Pagination, { pageCount } from './Pagination';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: (row: T) => string;
  filters?: ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  footer?: ReactNode;
  pageSize?: number;
  filterVersion?: number;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchable,
  searchPlaceholder = 'Search…',
  searchValue,
  filters,
  emptyTitle = 'No results found',
  emptyMessage = 'Try adjusting your filters or search query.',
  onRowClick,
  initialSort,
  footer,
  pageSize,
  filterVersion,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, filterVersion]);

  const filtered = useMemo(() => {
    let data = rows;
    if (query && searchValue) {
      const q = query.toLowerCase();
      data = data.filter((row) => searchValue(row).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        data = [...data].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (typeof av === 'number' && typeof bv === 'number') {
            return sort.dir === 'asc' ? av - bv : bv - av;
          }
          return sort.dir === 'asc'
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
      }
    }
    return data;
  }, [rows, query, searchValue, sort, columns]);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (prev?.key === col.key) {
        return { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key: col.key, dir: 'asc' };
    });
  };

  const pages = pageCount(filtered.length, pageSize ?? filtered.length);
  const safePage = Math.min(page, pages);
  const visibleRows = pageSize
    ? filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
    : filtered;

  return (
    <div>
      {(searchable || filters) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/5 px-4 py-3">
          {filters ?? <span />}
          {searchable && (
            <div className="relative w-56">
              <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-brand-charcoal/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="input pl-9 py-2"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('table-th', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                >
                  <button
                    type="button"
                    disabled={!col.sortValue}
                    onClick={() => toggleSort(col)}
                    className={cn(
                      'inline-flex items-center gap-1 uppercase tracking-wider',
                      col.align === 'right' && 'flex-row-reverse',
                      col.sortValue ? 'cursor-pointer hover:text-brand-charcoal/75' : 'cursor-default',
                      sort?.key === col.key && 'text-brand-muted',
                    )}
                  >
                    {col.header}
                    {col.sortValue && sort?.key === col.key && (
                      sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    )}
                    {col.sortValue && sort?.key !== col.key && (
                      <ChevronDown size={13} className="opacity-25" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={emptyTitle}
                    message={emptyMessage}
                    compact
                    className="py-12"
                  />
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn('table-row', onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'table-td',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageSize && filtered.length > pageSize && (
        <div className="border-t border-brand-navy/5 px-4 py-3">
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      )}

      {footer && <div className="border-t border-brand-navy/5 px-4 py-3">{footer}</div>}
    </div>
  );
}

export function TablePagination({
  total,
  showing,
  onLoadMore,
}: {
  total: number;
  showing: number;
  onLoadMore?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[13px] text-brand-charcoal/55">
        Showing <span className="font-medium text-brand-charcoal">{showing}</span> of{' '}
        <span className="font-medium text-brand-charcoal">{total}</span> records
      </p>
      {onLoadMore && (
        <Button variant="ghost" size="sm" onClick={onLoadMore}>
          Load more
        </Button>
      )}
    </div>
  );
}
