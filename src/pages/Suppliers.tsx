import { useEffect, useMemo, useState } from 'react';
import {
  Truck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Award,
  Globe,
  Mail,
  Phone,
  Building2,
  Layers,
  ChevronDown,
  Sparkles,
  Search,
  Filter,
  X,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { suppliers, SIMULATED_METRICS_NOTE, type Supplier } from '../data/suppliers';
import { medicineNameById } from '../data/medicineCatalog';
import Pagination, { pageCount, visibleRange } from '../components/ui/Pagination';
import { formatINR, cn } from '../lib/utils';

const SCORECARD_PAGE_SIZE = 10;

const TYPE_FILTERS = [
  'API Manufacturer',
  'Formulation Manufacturer',
  'CDMO',
  'CMO',
  'CRO',
  'Biopharmaceutical',
  'Healthcare',
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const UTS = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function stateOf(s: Supplier): string {
  const loc = s.location;
  const known = [...STATES, ...UTS];
  const hit = known.find((st) => loc.includes(st));
  if (hit) return hit;
  const cityMap: Record<string, string> = {
    Mumbai: 'Maharashtra',
    'Navi Mumbai': 'Maharashtra',
    Pune: 'Maharashtra',
    Hyderabad: 'Telangana',
    Bengaluru: 'Karnataka',
    Bangalore: 'Karnataka',
    Chennai: 'Tamil Nadu',
    Delhi: 'Delhi',
    Ahmedabad: 'Gujarat',
    Vadodara: 'Gujarat',
    Raichur: 'Karnataka',
  };
  for (const [city, state] of Object.entries(cityMap)) {
    if (loc.includes(city)) return state;
  }
  return 'Other';
}

function VerificationBadge({ supplier }: { supplier: Supplier }) {
  if (supplier.verificationStatus === 'verified') {
    return (
      <span className="badge bg-status-successBg text-status-success" title="Information checked against an official company source">
        <CheckCircle2 size={12} /> Officially Verified
      </span>
    );
  }
  return (
    <span
      className="badge bg-status-warningBg text-status-warning"
      title="Supplier information could not be confirmed against an official source"
    >
      <AlertTriangle size={12} /> Verification Required
    </span>
  );
}

function Metric({
  label,
  value,
  demo,
}: {
  label: string;
  value: string;
  demo?: boolean;
}) {
  return (
    <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2">
      <p className="flex items-center gap-1 text-[11px] text-brand-charcoal/50">
        {label}
        {demo && (
          <span className="rounded bg-brand-muted/10 px-1 text-[9px] font-semibold text-brand-muted">DEMO</span>
        )}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-brand-charcoal tabular-nums">{value}</p>
    </div>
  );
}

function SupplierCard({ supplier, rank, onView }: { supplier: Supplier; rank?: number; onView: (s: Supplier) => void }) {
  const isRec = supplier.recommended;
  return (
    <div
      className={cn(
        'card card-hover flex flex-col p-5 transition-all',
        isRec && 'border-brand-muted/40 ring-1 ring-brand-muted/20',
        supplier.verificationStatus === 'required' && 'border-status-warning/30',
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {isRec && (
          <span className="badge bg-brand-navy text-white">
            <Award size={12} /> Recommended
          </span>
        )}
        {typeof rank === 'number' && (
          <span className="badge bg-brand-muted text-white">#{rank} by Supplier Score</span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-lg font-bold text-brand-navy">
            {supplier.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-brand-charcoal">{supplier.name}</h3>
            <p className="flex items-center gap-1 text-xs text-brand-charcoal/50">
              <MapPin size={11} className="shrink-0" /> {supplier.location}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-brand-charcoal/50">Supplier Score</p>
          <p className="text-2xl font-semibold tracking-tight text-brand-navy tabular-nums">
            {supplier.aiScore > 0 ? supplier.aiScore : '—'}
            {supplier.aiScore > 0 && <span className="text-xs font-medium text-brand-charcoal/40">/100</span>}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <VerificationBadge supplier={supplier} />
        {supplier.verificationStatus === 'required' && supplier.riskLevel === 'High' && (
          <StatusBadge status="High Risk" />
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-brand-charcoal/65">{supplier.description}</p>

      <div className="mt-3 flex items-center gap-1.5 text-[12px] text-brand-charcoal/55">
        <Building2 size={12} className="shrink-0 text-brand-muted" />
        <span className="truncate">{supplier.companyType}</span>
        <span className="text-brand-charcoal/25">·</span>
        <span className="truncate">{supplier.category}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Metric
          label="Price / unit"
          value={supplier.price != null ? formatINR(supplier.price) : 'Requires quotation'}
          demo={supplier.price != null}
        />
        <Metric label="Delivery" value={supplier.deliveryDays != null ? `${supplier.deliveryDays} days` : '—'} demo={supplier.deliveryDays != null} />
        <Metric
          label="Quality"
          value={supplier.qualityScore != null ? `${supplier.qualityScore}%` : '—'}
          demo={supplier.qualityScore != null}
        />
        <Metric
          label="On-time delivery"
          value={supplier.onTimeDelivery != null ? `${supplier.onTimeDelivery}%` : '—'}
          demo={supplier.onTimeDelivery != null}
        />
      </div>

      {supplier.products.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {supplier.products.slice(0, 4).map((p) => (
            <span key={p} className="rounded bg-brand-navy/5 px-1.5 py-0.5 text-[10.5px] font-medium text-brand-charcoal/60">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 pt-1">
        <Button variant={isRec ? 'primary' : 'secondary'} className="flex-1" onClick={() => onView(supplier)}>
          View Profile
        </Button>
        {supplier.website && (
          <a
            href={`https://${supplier.website}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-brand-navy/12 text-brand-muted transition-colors hover:border-brand-muted hover:bg-brand-muted/5"
            title={`View official website — ${supplier.website}`}
          >
            <Globe size={15} />
          </a>
        )}
      </div>
    </div>
  );
}

function matchesSupplierType(s: Supplier, type: string): boolean {
  if (!type) return true;
  const blob = `${s.category} ${s.products.join(' ')} ${s.description}`.toLowerCase();
  const tokens = new Set(blob.split(/[^a-z0-9]+/));
  switch (type) {
    case 'API Manufacturer':
      return blob.includes('api');
    case 'Formulation Manufacturer':
      return ['formulation', 'formulations', 'dosage', 'dosages', 'finished'].some((t) => tokens.has(t));
    case 'CDMO':
      return tokens.has('cdmo');
    case 'CMO':
      return tokens.has('cmo');
    case 'CRO':
      return tokens.has('cro');
    case 'Biopharmaceutical':
      return ['biologic', 'biologics', 'biosimilar', 'biosimilars', 'biopharmaceutical', 'biotechnology', 'insulin', 'vaccine', 'vaccines'].some((t) => tokens.has(t));
    case 'Healthcare':
      return ['healthcare', 'nutraceutical', 'nutraceuticals', 'otc', 'consumer'].some((t) => tokens.has(t));
    default:
      return true;
  }
}

export default function Suppliers() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [query, setQuery] = useState('');
  const [priceSort, setPriceSort] = useState('');
  const [deliverySort, setDeliverySort] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [type, setType] = useState('');
  const [verification, setVerification] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, priceSort, deliverySort, locations, type, verification]);

  const recommended = suppliers.find((s) => s.recommended) ?? suppliers[0];

  const topThree = useMemo(
    () => suppliers.filter((s) => s.verificationStatus === 'verified').sort((a, b) => b.aiScore - a.aiScore).slice(0, 3),
    [],
  );

  const hasActiveFilters = Boolean(query || priceSort || deliverySort || locations.length > 0 || type || verification);

  const filtered = useMemo(() => {
    let list = [...suppliers];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.products.some((p) => p.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q),
      );
    }
    if (locations.length > 0) list = list.filter((s) => locations.includes(stateOf(s)));
    if (type) list = list.filter((s) => matchesSupplierType(s, type));
    if (verification) list = list.filter((s) => s.verificationStatus === verification);

    if (priceSort === 'low') list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (priceSort === 'high') list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    if (deliverySort === 'fast') list.sort((a, b) => (a.deliveryDays ?? Infinity) - (b.deliveryDays ?? Infinity));
    if (deliverySort === 'slow') list.sort((a, b) => (b.deliveryDays ?? -Infinity) - (a.deliveryDays ?? -Infinity));

    return list;
  }, [query, priceSort, deliverySort, locations, type, verification]);

  const showingExpanded = viewAll || hasActiveFilters;
  const shown = showingExpanded ? filtered : topThree;

  const scorePages = pageCount(filtered.length, SCORECARD_PAGE_SIZE);
  const safeScorePage = Math.min(page, scorePages);
  const scorecardRows = filtered.slice((safeScorePage - 1) * SCORECARD_PAGE_SIZE, safeScorePage * SCORECARD_PAGE_SIZE);
  const scoreRange = visibleRange(safeScorePage, SCORECARD_PAGE_SIZE, filtered.length);

  const clearFilters = () => {
    setQuery('');
    setPriceSort('');
    setDeliverySort('');
    setLocations([]);
    setType('');
    setVerification('');
  };

  const selectStyle =
    'h-[38px] rounded-lg border border-brand-navy/15 bg-white px-3 pr-8 text-[13px] text-brand-charcoal transition-colors focus:border-brand-muted focus:ring-4 focus:ring-brand-muted/10 outline-none cursor-pointer';

  const onSelect = (s: Supplier) => {
    if (s.verificationStatus !== 'verified') {
      toast('error', 'Supplier not verified', 'This supplier requires verification and cannot be used for procurement yet.');
      return;
    }
    toast(
      'success',
      `${s.name} selected`,
      s.recommended
        ? `PO-10452 will be issued to ${s.name} at ${s.price != null ? `${formatINR(s.price)}/unit (demo)` : 'a quoted rate'}.`
        : `${s.name} added to the shortlist for the next request.`,
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Intelligence"
        subtitle={`${suppliers.length} real pharmaceutical suppliers ranked by supplier score`}
      />

      <Card className="overflow-hidden">
        <div className="bg-brand-navy px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <Award size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Recommended Supplier — Aurobindo Pharma Limited</p>
              <p className="text-[13px] text-white/60">
                Officially verified · Hyderabad, Telangana · API + Formulations · Supplier Score 94/100 (demo)
              </p>
            </div>
            <button
              onClick={() => setShowWhy((s) => !s)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12.5px] font-medium text-white/80 transition-colors hover:bg-white/15"
            >
              Why this supplier?
              <ChevronDown size={14} className={cn('transition-transform', showWhy && 'rotate-180')} />
            </button>
            <Button
              variant="secondary"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
              onClick={() => onSelect(recommended)}
            >
              <CheckCircle2 size={14} /> Use for PO-10452
            </Button>
          </div>
        </div>
        {showWhy && (
          <div className="border-b border-brand-navy/8 bg-brand-muted/5 px-5 py-4 animate-fade-in">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-muted uppercase">
              <Sparkles size={11} /> Selection rationale
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                `Product capability — ${medicineNameById('MED-0001')} is within Aurobindo’s approved manufacturing portfolio.`,
                'Delivery — 5-day lead time vs. 7–12 days for most alternatives.',
                'On-time delivery — 96% across the last 12 months.',
                'Cost — competitive total landed cost for the recommended quantity.',
              ].map((r) => (
                <p key={r} className="flex items-start gap-2 text-[13px] leading-relaxed text-brand-charcoal/75">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-status-success" />
                  {r}
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="rounded-xl border border-brand-navy/8 bg-brand-navy/[0.02] px-4 py-3">
        <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-brand-charcoal/65">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-muted" />
          <span>{SIMULATED_METRICS_NOTE}</span>
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1 lg:max-w-[320px]">
            <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-charcoal/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search suppliers, locations, capabilities..."
              className="input h-[38px] pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={priceSort} onChange={(e) => setPriceSort(e.target.value)} className={selectStyle} aria-label="Filter by price">
              <option value="">Price · Any</option>
              <option value="low">Price · Low → High</option>
              <option value="high">Price · High → Low</option>
            </select>
            <select value={deliverySort} onChange={(e) => setDeliverySort(e.target.value)} className={selectStyle} aria-label="Filter by delivery">
              <option value="">Delivery · Any</option>
              <option value="fast">Delivery · Fastest first</option>
              <option value="slow">Delivery · Slowest first</option>
            </select>

            <div className="relative">
              <button
                onClick={() => setLocationOpen((o) => !o)}
                className={cn(
                  'flex h-[38px] items-center gap-2 rounded-lg border bg-white px-3 text-[13px] text-brand-charcoal transition-colors focus:border-brand-muted focus:ring-4 focus:ring-brand-muted/10 outline-none cursor-pointer',
                  locations.length > 0 ? 'border-brand-muted text-brand-navy' : 'border-brand-navy/15',
                )}
                aria-haspopup="true"
                aria-expanded={locationOpen}
              >
                <MapPin size={13} className="text-brand-charcoal/45" />
                {locations.length === 0 ? 'Location · All states' : `Location · ${locations.length} selected`}
                <ChevronDown size={13} className={cn('transition-transform text-brand-charcoal/45', locationOpen && 'rotate-180')} />
              </button>
              {locationOpen && (
                <div className="absolute top-full left-0 z-20 mt-1.5 w-[340px] overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-panel animate-fade-in-scale">
                  <div className="flex items-center justify-between border-b border-brand-navy/5 px-4 py-2.5">
                    <p className="text-xs font-semibold tracking-wide text-brand-charcoal/50 uppercase">Filter by location</p>
                    {locations.length > 0 && (
                      <button
                        onClick={() => setLocations([])}
                        className="flex items-center gap-1 text-[12px] font-medium text-brand-muted transition-colors hover:text-brand-navy"
                      >
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-3">
                    {[
                      { group: 'States', list: STATES },
                      { group: 'Union Territories', list: UTS },
                    ].map(({ group, list }) => (
                      <div key={group}>
                        <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">{group}</p>
                        <div className="grid grid-cols-1 gap-1">
                          {list.map((st) => (
                            <label key={st} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-brand-charcoal/75 transition-colors hover:bg-brand-navy/5">
                              <input
                                type="checkbox"
                                checked={locations.includes(st)}
                                onChange={() => setLocations((prev) => (prev.includes(st) ? prev.filter((v) => v !== st) : [...prev, st]))}
                                className="h-4 w-4 rounded border-brand-navy/20 accent-brand-navy"
                              />
                              {st}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-brand-navy/5 px-4 py-3">
                    <Button size="sm" onClick={() => setLocationOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)} className={selectStyle} aria-label="Filter by supplier type">
              <option value="">Type · All</option>
              {TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={verification} onChange={(e) => setVerification(e.target.value)} className={selectStyle} aria-label="Filter by verification">
              <option value="">Verification · All</option>
              <option value="verified">Verified</option>
              <option value="required">Verification Required</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex h-[38px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-brand-charcoal/60 transition-colors hover:bg-brand-navy/5 hover:text-brand-charcoal"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[13px] text-brand-charcoal/55">
          {showingExpanded ? (
            <>
              Showing <span className="font-semibold text-brand-charcoal">{filtered.length}</span> of {suppliers.length} suppliers
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted/10 px-2 py-0.5 text-[11px] font-medium text-brand-muted">
                  <Filter size={11} /> filtered
                </span>
              )}
            </>
          ) : (
            <>
              <span className="font-semibold text-brand-charcoal">Top 3 recommended</span> · ranked by supplier score (demo)
            </>
          )}
        </p>
        <Button variant={showingExpanded ? 'secondary' : 'primary'} size="sm" onClick={() => setViewAll((v) => !v)}>
          {showingExpanded ? 'Show Top 3' : `View All Suppliers (${suppliers.length})`}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((s, i) => (
          <SupplierCard key={s.id} supplier={s} rank={showingExpanded ? undefined : i + 1} onView={setSelected} />
        ))}
      </div>

      {shown.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm font-medium text-brand-charcoal">No suppliers match your filters</p>
          <p className="mt-1 text-[13px] text-brand-charcoal/55">Try a different location, type or search term.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
            <X size={14} /> Clear Filters
          </Button>
        </Card>
      )}

      {!showingExpanded && topThree.length < suppliers.length && (
        <div className="text-center">
          <Button variant="secondary" onClick={() => setViewAll(true)}>
            More Suppliers <ArrowRight size={14} />
          </Button>
          <p className="mt-2 text-[12px] text-brand-charcoal/45">
            Browse the complete directory with search and filters.
          </p>
        </div>
      )}

      <Card>
        <CardHeader
          title="Supplier Scorecard"
          subtitle="Comparison across all suppliers · performance metrics are demo/simulation values"
          icon={<Truck size={15} />}
        />
        <div className="overflow-x-auto px-2 pb-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-th">Supplier</th>
                <th className="table-th">Verification</th>
                <th className="table-th text-right">Price/unit</th>
                <th className="table-th text-right">Quality</th>
                <th className="table-th text-right">Delivery</th>
                <th className="table-th text-right">On-time</th>
                <th className="table-th">Risk</th>
                <th className="table-th text-right">Supplier Score</th>
                <th className="table-th" />
              </tr>
            </thead>
            <tbody>
              {scorecardRows.map((s) => (
                <tr key={s.id} className={cn('table-row', s.recommended && 'bg-brand-muted/[0.04]')}>
                  <td className="table-td">
                    <p className="flex items-center gap-2 font-medium text-brand-charcoal">
                      {s.name}
                      {s.recommended && <CheckCircle2 size={14} className="text-status-success" />}
                    </p>
                  </td>
                  <td className="table-td">
                    <VerificationBadge supplier={s} />
                  </td>
                  <td className="table-td text-right font-medium tabular-nums">
                    {s.price != null ? `${formatINR(s.price)}*` : '—'}
                  </td>
                  <td className="table-td text-right tabular-nums">{s.qualityScore != null ? `${s.qualityScore}%*` : '—'}</td>
                  <td className="table-td text-right tabular-nums">{s.deliveryDays != null ? `${s.deliveryDays}d*` : '—'}</td>
                  <td className="table-td text-right tabular-nums">{s.onTimeDelivery != null ? `${s.onTimeDelivery}%*` : '—'}</td>
                  <td className="table-td">
                    <StatusBadge status={`${s.riskLevel} Risk`} />
                  </td>
                  <td className="table-td text-right">
                    <span className="text-sm font-semibold text-brand-navy tabular-nums">
                      {s.aiScore > 0 ? s.aiScore : '—'}
                    </span>
                  </td>
                  <td className="table-td">
                    <button
                      onClick={() => setSelected(s)}
                      className="flex items-center gap-1 text-[13px] font-medium text-brand-muted transition-colors hover:text-brand-navy"
                    >
                      View <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-navy/5 px-5 py-3">
          <p className="text-[11.5px] text-brand-charcoal/45">
            Showing {scoreRange.from}–{scoreRange.to} of {filtered.length} suppliers · * Demo/simulation value for the hackathon. Real-time price and delivery require an official quotation or live supplier API.
          </p>
          {filtered.length > SCORECARD_PAGE_SIZE && (
            <Pagination page={safeScorePage} pageSize={SCORECARD_PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          )}
        </div>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? `${selected.companyType} · ${selected.location}` : ''}
        size="lg"
        footer={
          selected ? (
            <>
              {selected.website && (
                <Button variant="secondary" onClick={() => window.open(`https://${selected.website}`, '_blank', 'noopener')}>
                  <Globe size={14} /> View Official Website
                </Button>
              )}
              <Button
                onClick={() => {
                  onSelect(selected);
                  setSelected(null);
                }}
              >
                <CheckCircle2 size={14} /> Select Supplier
              </Button>
            </>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge supplier={selected} />
              <StatusBadge status={`${selected.riskLevel} Risk`} />
              <StatusBadge status={selected.recommended ? 'Recommended' : 'Registered'} />
            </div>

            <p className="text-[13.5px] leading-relaxed text-brand-charcoal/75">{selected.description}</p>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                <Layers size={12} /> Capabilities
              </p>
              {selected.products.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selected.products.map((p) => (
                    <span key={p} className="rounded bg-brand-navy/5 px-2 py-1 text-xs font-medium text-brand-charcoal/65">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-brand-charcoal/50">Capabilities pending verification.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-navy/8 p-4">
                <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Official contacts</p>
                <div className="mt-2.5 space-y-2 text-[13px]">
                  <p className="flex items-center gap-2 text-brand-charcoal/75">
                    <Phone size={13} className="shrink-0 text-brand-muted" />
                    {selected.primaryPhone || 'See official website'}
                  </p>
                  <p className="flex items-center gap-2 text-brand-charcoal/75">
                    <Mail size={13} className="shrink-0 text-brand-muted" />
                    {selected.primaryEmail || 'See official website'}
                  </p>
                  {selected.website && (
                    <a
                      href={`https://${selected.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-medium text-brand-muted transition-colors hover:text-brand-navy"
                    >
                      <Globe size={13} className="shrink-0" /> {selected.website}
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-brand-navy/8 p-4">
                <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                  Performance (demo/simulation)
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 text-[13px]">
                  <div>
                    <p className="text-[11px] text-brand-charcoal/45">Supplier Score</p>
                    <p className="font-semibold text-brand-navy tabular-nums">
                      {selected.aiScore > 0 ? `${selected.aiScore}/100` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-brand-charcoal/45">Price/unit</p>
                    <p className="font-semibold text-brand-charcoal tabular-nums">
                      {selected.price != null ? formatINR(selected.price) : 'Requires quotation'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-brand-charcoal/45">Quality</p>
                    <p className="font-semibold text-status-success tabular-nums">
                      {selected.qualityScore != null ? `${selected.qualityScore}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-brand-charcoal/45">On-time delivery</p>
                    <p className="font-semibold text-brand-charcoal tabular-nums">
                      {selected.onTimeDelivery != null ? `${selected.onTimeDelivery}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-brand-charcoal/45">Delivery time</p>
                    <p className="font-semibold text-brand-charcoal tabular-nums">
                      {selected.deliveryDays != null ? `${selected.deliveryDays} days` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-brand-charcoal/45">Reliability</p>
                    <p className="font-semibold text-brand-charcoal tabular-nums">
                      {selected.reliabilityScore != null ? `${selected.reliabilityScore}%` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selected.verificationStatus === 'required' && selected.verificationNote && (
              <p className="rounded-lg border-l-2 border-status-warning bg-status-warningBg/50 px-3 py-2.5 text-[13px] text-brand-charcoal/75">
                <span className="font-semibold text-status-warning">Why verification is required: </span>
                {selected.verificationNote}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
