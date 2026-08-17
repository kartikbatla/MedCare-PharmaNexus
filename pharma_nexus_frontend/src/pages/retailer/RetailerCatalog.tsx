import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, FilterX, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  medicines,
  medicineCategories,
  medicineDosageForms,
  medicineStrengths,
  medicinePackSizes,
  medicineSuppliers,
} from '../../data/medicines';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/retail/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import Pagination, { pageCount } from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const PAGE_SIZE = 20;

type SortKey =
  | 'recommended'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'most-ordered'
  | 'recent-ordered';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'name-asc', label: 'Name: A → Z' },
  { value: 'name-desc', label: 'Name: Z → A' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'most-ordered', label: 'Most Ordered' },
  { value: 'recent-ordered', label: 'Recently Ordered' },
];

interface Filters {
  category: string[];
  dosageForm: string[];
  strengths: string[];
  packSizes: string[];
  suppliers: string[];
  name: string;
  priceMin: string;
  priceMax: string;
  freq: boolean;
}

const emptyFilters: Filters = {
  category: [],
  dosageForm: [],
  strengths: [],
  packSizes: [],
  suppliers: [],
  name: '',
  priceMin: '',
  priceMax: '',
  freq: false,
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const selectClass =
  'h-9 rounded-lg border border-brand-navy/12 bg-white px-2.5 text-[13px] text-brand-charcoal/80 focus:border-brand-muted focus:outline-none';

export default function RetailerCatalog() {
  const [params, setParams] = useSearchParams();
  const { orders } = useCart();

  const q = (params.get('q') ?? '').trim().toLowerCase();
  const categoryParam = params.get('category') ?? '';

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(() =>
    categoryParam ? { ...emptyFilters, category: [categoryParam] } : emptyFilters,
  );
  const [draft, setDraft] = useState<Filters>(filters);

  const orderStats = useMemo(() => {
    const stats = new Map<string, { qty: number; last: number }>();
    orders
      .filter((o) => o.status !== 'Cancelled')
      .forEach((o) =>
        o.items.forEach((i) => {
          const prev = stats.get(i.medicineId);
          const t = new Date(o.createdAt).getTime();
          stats.set(i.medicineId, {
            qty: (prev?.qty ?? 0) + i.qty,
            last: Math.max(prev?.last ?? 0, t),
          });
        }),
      );
    return stats;
  }, [orders]);

  const activeCount =
    filters.category.length +
    filters.dosageForm.length +
    filters.strengths.length +
    filters.packSizes.length +
    filters.suppliers.length +
    (filters.name ? 1 : 0) +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.freq ? 1 : 0);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const inQuery =
        !q ||
        [m.name, m.generic, m.category, m.supplier, m.dosageForm, m.strength, m.packSize, m.id]
          .join(' ')
          .toLowerCase()
          .includes(q);
      const inCat = filters.category.length === 0 || filters.category.includes(m.category);
      const inForm = filters.dosageForm.length === 0 || filters.dosageForm.includes(m.dosageForm);
      const inStrength = filters.strengths.length === 0 || filters.strengths.includes(m.strength);
      const inPack = filters.packSizes.length === 0 || filters.packSizes.includes(m.packSize);
      const inSupplier = filters.suppliers.length === 0 || filters.suppliers.includes(m.supplier);
      const inName = !filters.name || m.name.toLowerCase().includes(filters.name.toLowerCase());
      const inPrice =
        (!filters.priceMin || m.indicativePrice >= Number(filters.priceMin)) &&
        (!filters.priceMax || m.indicativePrice <= Number(filters.priceMax));
      const inFreq = !filters.freq || orderStats.has(m.id);
      return inQuery && inCat && inForm && inStrength && inPack && inSupplier && inName && inPrice && inFreq;
    });
  }, [q, filters, orderStats]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return list.sort((a, b) => a.indicativePrice - b.indicativePrice);
      case 'price-desc':
        return list.sort((a, b) => b.indicativePrice - a.indicativePrice);
      case 'most-ordered':
        return list.sort(
          (a, b) =>
            (orderStats.get(b.id)?.qty ?? 0) - (orderStats.get(a.id)?.qty ?? 0) ||
            a.name.localeCompare(b.name),
        );
      case 'recent-ordered':
        return list.sort(
          (a, b) =>
            (orderStats.get(b.id)?.last ?? 0) - (orderStats.get(a.id)?.last ?? 0) ||
            a.name.localeCompare(b.name),
        );
      default:
        return list.sort(
          (a, b) => Number(b.popular ?? false) - Number(a.popular ?? false) || a.name.localeCompare(b.name),
        );
    }
  }, [filtered, sort, orderStats]);

  const pages = pageCount(sorted.length, PAGE_SIZE);
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, sort, filters]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (query.trim()) next.set('q', query.trim());
    else next.delete('q');
    setParams(next);
  };

  const clearSearch = () => {
    setQuery('');
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next);
  };

  const openDrawer = () => {
    setDraft(filters);
    setOpen(true);
  };

  const apply = () => {
    setFilters(draft);
    setOpen(false);
  };

  const clearAll = () => {
    setFilters(emptyFilters);
    setDraft(emptyFilters);
    setQuery('');
    setParams({});
  };

  const section = (title: string, values: string[], selected: string[], onChange: (list: string[]) => void) => (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">{title}</p>
      <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
        {values.map((v) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-brand-charcoal/75 transition-colors hover:bg-brand-navy/5"
          >
            <input
              type="checkbox"
              checked={selected.includes(v)}
              onChange={() => onChange(toggle(selected, v))}
              className="h-4 w-4 rounded border-brand-navy/20 accent-brand-navy"
            />
            <span className="flex-1 truncate">{v}</span>
            <span className="text-[11px] text-brand-charcoal/35 tabular-nums">
              {values.filter((x) => x === v).length}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-brand-charcoal">All Medicines</h1>
          <p className="mt-1 text-[13px] text-brand-charcoal/55">
            {sorted.length} of {medicines.length} medicines
            {q && (
              <>
                {' '}
                for “<span className="font-medium">{params.get('q')}</span>”
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <FilterX size={14} /> Clear ({activeCount})
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="relative order-1 w-full sm:min-w-56 sm:flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-brand-charcoal/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines..."
            aria-label="Search medicines"
            className="h-10 w-full rounded-lg border border-brand-navy/12 bg-white pr-9 pl-9 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-muted/10"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 text-brand-charcoal/40 transition-colors hover:text-brand-charcoal"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="order-2 hidden items-center gap-2 lg:flex">
          <select
            value={filters.category[0] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({ ...f, category: v ? [v] : [] }));
            }}
            className={selectClass}
            aria-label="Filter by category"
          >
            <option value="">Category: All</option>
            {medicineCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.dosageForm[0] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({ ...f, dosageForm: v ? [v] : [] }));
            }}
            className={selectClass}
            aria-label="Filter by dosage form"
          >
            <option value="">Form: All</option>
            {medicineDosageForms.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={filters.suppliers[0] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((f) => ({ ...f, suppliers: v ? [v] : [] }));
            }}
            className={cn(selectClass, 'max-w-44')}
            aria-label="Filter by supplier"
          >
            <option value="">Supplier: All</option>
            {medicineSuppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="order-3 flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openDrawer}>
            <SlidersHorizontal size={14} /> Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-brand-navy px-1.5 text-[10.5px] font-bold text-white tabular-nums">
                {activeCount}
              </span>
            )}
          </Button>
          <div className="flex items-center gap-1.5">
            <span className="hidden text-[13px] text-brand-charcoal/55 sm:inline">Sort by</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={cn(selectClass, 'appearance-none pr-8')}
                aria-label="Sort medicines"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-brand-charcoal/40"
              />
            </div>
          </div>
        </div>
      </div>

      {q && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-navy/10 bg-white px-4 py-2.5 text-[13px] text-brand-charcoal/70">
          <Search size={14} className="text-brand-muted" />
          Showing results for “{params.get('q')}”
          <button
            onClick={clearSearch}
            className="ml-auto flex items-center gap-1 text-[12.5px] font-semibold text-brand-muted hover:text-brand-navy"
          >
            <X size={13} /> Clear search
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title="No medicines found"
          message={
            q
              ? `Nothing matched "${params.get('q')}". Try a different medicine, category, or supplier.`
              : 'No medicines match the selected filters.'
          }
          action={{ label: 'Clear all filters', onClick: clearAll }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((m) => (
              <ProductCard key={m.id} medicine={m} />
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
        </>
      )}

      <p className="text-xs text-brand-charcoal/40">
        Catalogue sourced from the PharmaNexus 200-medicine master dataset. Prices are indicative demo values.
      </p>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-brand-navy/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed top-0 right-0 flex h-full w-full max-w-[380px] flex-col bg-white shadow-panel animate-fade-in-scale">
            <div className="flex items-center justify-between border-b border-brand-navy/8 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-brand-charcoal">Filters</h2>
                <p className="text-[12px] text-brand-charcoal/50">Narrow down the medicine catalogue</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-brand-charcoal/40 hover:bg-brand-navy/5 hover:text-brand-charcoal"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                  Medicine Name
                </p>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Filter by medicine name..."
                  className="w-full rounded-xl border border-brand-navy/10 bg-white px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                  Indicative Price (₹)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={draft.priceMin}
                    onChange={(e) => setDraft((d) => ({ ...d, priceMin: e.target.value }))}
                    type="number"
                    min="0"
                    placeholder="Min"
                    className="w-full rounded-xl border border-brand-navy/10 bg-white px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
                  />
                  <input
                    value={draft.priceMax}
                    onChange={(e) => setDraft((d) => ({ ...d, priceMax: e.target.value }))}
                    type="number"
                    min="0"
                    placeholder="Max"
                    className="w-full rounded-xl border border-brand-navy/10 bg-white px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                  Frequently Ordered
                </p>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-brand-charcoal/75 transition-colors hover:bg-brand-navy/5">
                  <input
                    type="checkbox"
                    checked={draft.freq}
                    onChange={(e) => setDraft((d) => ({ ...d, freq: e.target.checked }))}
                    className="h-4 w-4 rounded border-brand-navy/20 accent-brand-navy"
                  />
                  <span>Only show medicines from your order history</span>
                  <span className="ml-auto text-[11px] text-brand-charcoal/35 tabular-nums">
                    {orderStats.size}
                  </span>
                </label>
              </div>

              {section('Therapeutic Category', medicineCategories, draft.category, (list) =>
                setDraft((d) => ({ ...d, category: list })),
              )}
              {section('Dosage Form', medicineDosageForms, draft.dosageForm, (list) =>
                setDraft((d) => ({ ...d, dosageForm: list })),
              )}
              {section('Strength', medicineStrengths, draft.strengths, (list) =>
                setDraft((d) => ({ ...d, strengths: list })),
              )}
              {section('Pack Size', medicinePackSizes, draft.packSizes, (list) =>
                setDraft((d) => ({ ...d, packSizes: list })),
              )}
              {section('Supplier', medicineSuppliers, draft.suppliers, (list) =>
                setDraft((d) => ({ ...d, suppliers: list })),
              )}
            </div>

            <div className="flex gap-2 border-t border-brand-navy/8 px-5 py-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDraft(emptyFilters)}>
                Clear Filters
              </Button>
              <Button className={cn('flex-1')} onClick={apply}>
                Apply Filters
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
