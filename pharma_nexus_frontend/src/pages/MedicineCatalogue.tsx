import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FilterX, Pill, Search, SlidersHorizontal } from 'lucide-react';
import {
  medicines,
  medicineCategories,
  medicineDosageForms,
  medicineStrengths,
  medicinePackSizes,
  medicineSuppliers,
  MEDICINE_PRICE_NOTE,
} from '../data/medicines';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Pagination, { pageCount, visibleRange } from '../components/ui/Pagination';
import { cn } from '../lib/utils';
import { useControlTower } from '../context/ControlTowerContext';

const PAGE_SIZE = 10;

interface Filters {
  category: string[];
  dosageForm: string[];
  strengths: string[];
  packSizes: string[];
  suppliers: string[];
  name: string;
}

const emptyFilters: Filters = { category: [], dosageForm: [], strengths: [], packSizes: [], suppliers: [], name: '' };

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function MedicineCatalogue() {
  const { state } = useControlTower();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const activeCount =
    filters.category.length +
    filters.dosageForm.length +
    filters.strengths.length +
    filters.packSizes.length +
    filters.suppliers.length +
    (filters.name ? 1 : 0);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const inName = !filters.name || [m.name, m.generic, m.category, m.supplier, m.dosageForm, m.strength, m.packSize, m.id].join(' ').toLowerCase().includes(filters.name.toLowerCase());
      const inCat = filters.category.length === 0 || filters.category.includes(m.category);
      const inForm = filters.dosageForm.length === 0 || filters.dosageForm.includes(m.dosageForm);
      const inStrength = filters.strengths.length === 0 || filters.strengths.includes(m.strength);
      const inPack = filters.packSizes.length === 0 || filters.packSizes.includes(m.packSize);
      const inSupplier = filters.suppliers.length === 0 || filters.suppliers.includes(m.supplier);
      return inName && inCat && inForm && inStrength && inPack && inSupplier;
    });
  }, [filters]);

  const section = (title: string, values: string[], selected: string[], onChange: (list: string[]) => void) => (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">{title}</p>
      <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
        {values.map((v) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-brand-charcoal/75 transition-colors hover:bg-brand-navy/5">
            <input
              type="checkbox"
              checked={selected.includes(v)}
              onChange={() => onChange(toggle(selected, v))}
              className="h-4 w-4 rounded border-brand-navy/20 accent-brand-navy"
            />
            <span className="flex-1 truncate">{v}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const pages = pageCount(filtered.length, PAGE_SIZE);
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const range = visibleRange(safePage, PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
            <Pill size={20} /> Medicine Catalogue
          </h1>
          <p className="mt-1 text-[13px] text-brand-charcoal/55">
            {filtered.length} of {medicines.length} medicines in the PharmaNexus master catalogue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(emptyFilters)}>
              <FilterX size={14} /> Clear ({activeCount})
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => { setDraft(filters); setOpen(true); }}>
            <SlidersHorizontal size={14} /> Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-brand-navy px-1.5 text-[10.5px] font-bold text-white tabular-nums">{activeCount}</span>
            )}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-brand-charcoal/35" />
        <input
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          placeholder="Search by medicine name, generic name, category, supplier, or Medicine ID..."
          className="w-full rounded-xl border border-brand-navy/10 bg-white py-3 pr-4 pl-11 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No medicines found"
          message="No medicines match the current search or filters."
          action={{ label: 'Clear all filters', onClick: () => setFilters(emptyFilters) }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Medicine ID</th>
                  <th className="table-th">Medicine Name</th>
                  <th className="table-th">Generic Name</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Form</th>
                  <th className="table-th">Strength</th>
                  <th className="table-th">Pack Size</th>
                  <th className="table-th">Supplier</th>
                  <th className="table-th text-right">Indicative Price</th>
                  <th className="table-th text-right">Total Network Stock</th>
                  <th className="table-th" />
                </tr>
              </thead>
              <tbody>
                {paged.map((m) => {
                  const skuInventory = (state?.inventory || []).filter((inv) => inv.sku_id === m.id);
                  const totalStock = skuInventory.length > 0 ? skuInventory.reduce((s, i) => s + i.closing_stock, 0) : 1250;
                  return (
                    <tr key={m.id} className="table-row cursor-pointer" onClick={() => navigate(`/medicine-catalogue/${m.id}`)}>
                      <td className="table-td text-[12px] text-brand-charcoal/55 tabular-nums">{m.id}</td>
                      <td className="table-td font-semibold text-brand-charcoal">{m.name}</td>
                      <td className="table-td text-brand-charcoal/75">{m.generic}</td>
                      <td className="table-td">
                        <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-[11.5px] font-medium text-brand-charcoal/70">{m.category}</span>
                      </td>
                      <td className="table-td text-brand-charcoal/75">{m.dosageForm}</td>
                      <td className="table-td text-brand-charcoal/75">{m.strength}</td>
                      <td className="table-td text-brand-charcoal/75">{m.packSize}</td>
                      <td className="table-td max-w-[180px] truncate text-brand-charcoal/75">{m.supplier}</td>
                      <td className="table-td text-right font-semibold tabular-nums">₹{m.indicativePrice}</td>
                      <td className="table-td text-right">
                        <span className={cn('font-bold tabular-nums text-xs px-2 py-0.5 rounded', totalStock < 300 ? 'bg-status-dangerBg text-status-danger border border-status-danger/20' : 'bg-status-successBg text-status-success')}>
                          {totalStock.toLocaleString()} units
                        </span>
                      </td>
                      <td className="table-td">
                        <ChevronRight size={15} className="ml-auto text-brand-charcoal/25" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-navy/5 px-5 py-3">
            <p className="text-[11.5px] text-brand-charcoal/45">
              Showing {range.from}–{range.to} of {filtered.length} · {MEDICINE_PRICE_NOTE}
            </p>
            {filtered.length > PAGE_SIZE && (
              <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
            )}
          </div>
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-brand-navy/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 right-0 flex h-full w-full max-w-[380px] flex-col bg-white shadow-panel animate-fade-in-scale">
            <div className="flex items-center justify-between border-b border-brand-navy/8 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-brand-charcoal">Filters</h2>
                <p className="text-[12px] text-brand-charcoal/50">Narrow down the medicine catalogue</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-brand-charcoal/40 hover:bg-brand-navy/5 hover:text-brand-charcoal" aria-label="Close filters">
                <SlidersHorizontal size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Medicine Name / ID</p>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Search..."
                  className="w-full rounded-xl border border-brand-navy/10 bg-white px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
                />
              </div>
              {section('Therapeutic Category', medicineCategories, draft.category, (list) => setDraft((d) => ({ ...d, category: list })))}
              {section('Dosage Form', medicineDosageForms, draft.dosageForm, (list) => setDraft((d) => ({ ...d, dosageForm: list })))}
              {section('Strength', medicineStrengths, draft.strengths, (list) => setDraft((d) => ({ ...d, strengths: list })))}
              {section('Pack Size', medicinePackSizes, draft.packSizes, (list) => setDraft((d) => ({ ...d, packSizes: list })))}
              {section('Supplier', medicineSuppliers, draft.suppliers, (list) => setDraft((d) => ({ ...d, suppliers: list })))}
            </div>

            <div className="flex gap-2 border-t border-brand-navy/8 px-5 py-4">
              <Button variant="ghost" className="flex-1" onClick={() => setDraft(emptyFilters)}>
                Clear Filters
              </Button>
              <Button
                className={cn('flex-1')}
                onClick={() => {
                  setFilters(draft);
                  setOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['Therapeutic Category', 'Dosage Form', 'Strength', 'Pack Size', 'Supplier'] as const).map((label, idx) => {
          const active = [filters.category, filters.dosageForm, filters.strengths, filters.packSizes, filters.suppliers][idx].length;
          return active ? null : (
            <span key={label} className="rounded-full bg-brand-navy/5 px-3 py-1 text-[11.5px] font-medium text-brand-charcoal/55">
              {label}: All
            </span>
          );
        })}
      </div>
    </div>
  );
}
