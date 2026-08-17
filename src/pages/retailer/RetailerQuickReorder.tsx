import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { medicineById, popularMedicines } from '../../data/medicines';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/retail/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

export default function RetailerQuickReorder() {
  const navigate = useNavigate();
  const { orders, cart } = useCart();

  const reorderItems = useMemo(() => {
    const freq = new Map<string, number>();
    orders
      .filter((o) => o.status !== 'Cancelled')
      .forEach((o) => o.items.forEach((i) => freq.set(i.medicineId, (freq.get(i.medicineId) ?? 0) + i.qty)));
    const byFrequency = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => medicineById(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    const filled = [...byFrequency];
    popularMedicines.forEach((m) => {
      if (!filled.some((f) => f.id === m.id)) filled.push(m);
    });
    return filled.slice(0, 8);
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <RotateCcw size={20} /> Quick Reorder
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">
          Your most-ordered medicines, ranked by order frequency. One-tap reorder.
        </p>
      </div>

      {cart.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-brand-navy/10 bg-white px-5 py-3.5">
          <p className="text-[13px] text-brand-charcoal/70">
            You have <span className="font-semibold text-brand-charcoal">{cart.length} items</span> in your cart.
          </p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/retailer/cart')}>
            Go to Cart <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {reorderItems.length === 0 ? (
        <EmptyState
          title="No reorder history yet"
          message="Once you place orders, your most-ordered medicines will appear here for one-tap reordering."
          action={{ label: 'Browse Medicines', onClick: () => navigate('/retailer/medicines') }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reorderItems.map((m) => (
            <ProductCard key={m.id} medicine={m} showReorder />
          ))}
        </div>
      )}
    </div>
  );
}
