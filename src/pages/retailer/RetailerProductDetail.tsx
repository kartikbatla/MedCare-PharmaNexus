import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Info, Minus, Pill, Plus, ShoppingCart, Zap } from 'lucide-react';
import { medicineById, medicines, MEDICINE_PRICE_NOTE } from '../../data/medicines';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import ProductCard from '../../components/retail/ProductCard';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';

export default function RetailerProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const medicine = medicineById(id ?? '');
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  const related = useMemo(() => {
    if (!medicine) return [];
    return medicines.filter((m) => m.category === medicine.category && m.id !== medicine.id).slice(0, 4);
  }, [medicine]);

  if (!medicine) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm font-semibold text-brand-charcoal">Medicine not found</p>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">It may have been removed from the catalogue.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/retailer/medicines')}>
          <ArrowLeft size={14} /> Back to medicines
        </Button>
      </div>
    );
  }

  const m = medicine;

  const add = (goToCart: boolean) => {
    addToCart(m.id, Math.max(qty, 1));
    toast('success', `${m.name} added to cart`, `${m.strength} · ${m.packSize} · ₹${m.indicativePrice}`);
    if (goToCart) navigate('/retailer/cart');
  };

  const rows: Array<[string, string]> = [
    ['Medicine ID', m.id],
    ['Medicine Name', m.name],
    ['Generic Name', m.generic],
    ['Therapeutic Category', m.category],
    ['Dosage Form', m.dosageForm],
    ['Strength', m.strength],
    ['Pack Size', m.packSize],
    ['Supplier', m.supplier],
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-brand-muted transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Medicine Information" subtitle="From the PharmaNexus master dataset" icon={<Pill size={15} />} />
            <div className="grid gap-x-8 gap-y-3 px-5 pb-5 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex flex-col border-b border-brand-navy/5 pb-2.5">
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">{label}</p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-brand-charcoal">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-navy/5 px-5 py-3">
              <p className="flex items-start gap-2 text-[12px] leading-relaxed text-brand-charcoal/50">
                <Info size={14} className="mt-0.5 shrink-0 text-brand-muted" />
                Strength is a representative value for UI modeling, not a prescribing recommendation.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Order" subtitle="Select quantity and add to cart" icon={<ShoppingCart size={15} />} />
            <div className="px-5 pb-5">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-navy/8 bg-brand-navy/[0.02] p-4">
                <span className="text-[13px] font-medium text-brand-charcoal/60">Dosage Form:</span>
                <span className="badge bg-brand-navy/[0.06] text-brand-navy">{m.dosageForm}</span>
                <span className="text-[13px] font-medium text-brand-charcoal/60">Strength:</span>
                <span className="badge bg-brand-navy/[0.06] text-brand-navy">{m.strength}</span>
                <span className="text-[13px] font-medium text-brand-charcoal/60">Pack:</span>
                <span className="badge bg-brand-navy/[0.06] text-brand-navy">{m.packSize}</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-brand-navy/15 px-1.5 py-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-charcoal/70 transition-colors hover:bg-brand-navy/5"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-brand-charcoal tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-charcoal/70 transition-colors hover:bg-brand-navy/5"
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <p className="text-[13px] text-brand-charcoal/55">
                  Indicative total:{' '}
                  <span className="font-semibold text-brand-charcoal tabular-nums">₹{m.indicativePrice * qty}</span>
                </p>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => add(false)}>
                    <ShoppingCart size={15} /> Add to Cart
                  </Button>
                  <Button onClick={() => add(true)}>
                    <Zap size={15} /> Buy Now
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-[11.5px] leading-relaxed text-brand-charcoal/45">{MEDICINE_PRICE_NOTE}</p>
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Supplier" icon={<Info size={15} />} />
          <div className="px-5 pb-5">
            <p className="text-[15px] font-semibold text-brand-charcoal">{m.supplier}</p>
            <p className="mt-1 text-[12.5px] text-brand-charcoal/55">Supplies this medicine in {m.packSize} packs.</p>
            <Link
              to={`/retailer/medicines?q=${encodeURIComponent(m.supplier.split(' ')[0])}`}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-muted transition-colors hover:text-brand-navy"
            >
              More from this supplier <ArrowRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

      {related.length > 0 && (
        <section aria-label="Related medicines">
          <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">
            More in {m.category}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} medicine={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
