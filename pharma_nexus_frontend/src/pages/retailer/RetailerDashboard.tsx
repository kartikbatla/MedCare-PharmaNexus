import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, PackageOpen, Pill, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { medicineById, medicines, medicineCategories, popularMedicines } from '../../data/medicines';
import ProductCard from '../../components/retail/ProductCard';
import Button from '../../components/ui/Button';
import { greeting } from '../../lib/utils';

export default function RetailerDashboard() {
  const { user } = useAuth();
  const { orders } = useCart();
  const navigate = useNavigate();

  const firstName = (user?.name ?? 'there').split(' ')[0];

  const latestOrder = orders[0];
  const recentlyOrdered = latestOrder
    ? Array.from(new Set(latestOrder.items.map((i) => i.medicineId)))
        .map((id) => medicineById(id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .slice(0, 4)
    : [];

  const quickReorder = [
    ...recentlyOrdered,
    ...popularMedicines.filter((m) => !recentlyOrdered.some((r) => r.id === m.id)),
  ].slice(0, 4);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    medicines.forEach((m) => counts.set(m.category, (counts.get(m.category) ?? 0) + 1));
    return counts;
  }, []);

  const topCategories = useMemo(
    () =>
      [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name),
    [categoryCounts],
  );

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-brand-charcoal">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-[13.5px] text-brand-charcoal/55">
            Order medicines for CarePlus Pharmacy and track deliveries in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-warning/30 bg-status-warningBg px-3 py-1.5 text-xs font-semibold text-status-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-status-warning" />
            Demo · indicative prices
          </span>
          <Button size="sm" onClick={() => navigate('/retailer/medicines')}>
            <PackageOpen size={15} /> Browse Medicines
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/retailer/orders')}>
            <ClipboardList size={15} /> My Orders
          </Button>
        </div>
      </section>

      <section aria-label="Browse medicines" className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/8 px-6 py-4">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-brand-charcoal">Browse Medicines</h2>
            <p className="mt-0.5 text-[13px] text-brand-charcoal/55">
              Explore the full catalogue by category, or search for a specific medicine.
            </p>
          </div>
          <Link
            to="/retailer/medicines"
            className="flex items-center gap-1 text-[13px] font-semibold text-brand-muted transition-colors hover:text-brand-navy"
          >
            View all {medicines.length} medicines <ArrowRight size={14} />
          </Link>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {topCategories.map((c) => (
              <Link
                key={c}
                to={`/retailer/medicines?category=${encodeURIComponent(c)}`}
                className="group flex items-center gap-3 rounded-xl border border-brand-navy/10 bg-[#F7F6F3]/70 px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-muted/40 hover:bg-white hover:shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/[0.06] text-brand-muted transition-colors group-hover:bg-brand-navy group-hover:text-white">
                  <Pill size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-brand-charcoal">{c}</span>
                  <span className="block text-[11.5px] text-brand-charcoal/50">
                    {categoryCounts.get(c)} medicines
                  </span>
                </span>
              </Link>
            ))}
            <Link
              to="/retailer/categories"
              className="group flex items-center gap-3 rounded-xl border border-dashed border-brand-navy/20 bg-transparent px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-brand-muted/50 hover:bg-white hover:shadow-card"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/[0.06] text-brand-muted transition-colors group-hover:bg-brand-navy group-hover:text-white">
                <ArrowRight size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-brand-charcoal">
                  All categories
                </span>
                <span className="block text-[11.5px] text-brand-charcoal/50">
                  {medicineCategories.length} categories
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-brand-navy/5 pt-5">
            <Button onClick={() => navigate('/retailer/medicines')}>
              <PackageOpen size={15} /> Browse All Medicines
            </Button>
            <Button variant="secondary" onClick={() => navigate('/retailer/quick-reorder')}>
              <RotateCcw size={15} /> Quick Reorder
            </Button>
          </div>
        </div>
      </section>

      {recentlyOrdered.length > 0 && (
        <section aria-label="Recently ordered">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Recently Ordered</h2>
            <Link
              to="/retailer/orders"
              className="flex items-center gap-1 text-[13px] font-medium text-brand-muted hover:text-brand-navy"
            >
              My Orders <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recentlyOrdered.map((m) => (
              <ProductCard key={m.id} medicine={m} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Quick reorder">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Quick Reorder</h2>
            <p className="mt-0.5 text-[13px] text-brand-charcoal/55">
              Quickly reorder medicines you frequently purchase.
            </p>
          </div>
          <Link
            to="/retailer/quick-reorder"
            className="flex items-center gap-1 text-[13px] font-medium text-brand-muted hover:text-brand-navy"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickReorder.map((m) => (
            <ProductCard key={m.id} medicine={m} showReorder />
          ))}
        </div>
      </section>

      <section aria-label="Popular medicines">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Popular Medicines</h2>
          <Link
            to="/retailer/medicines"
            className="flex items-center gap-1 text-[13px] font-medium text-brand-muted hover:text-brand-navy"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {popularMedicines.slice(0, 8).map((m) => (
            <ProductCard key={m.id} medicine={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
