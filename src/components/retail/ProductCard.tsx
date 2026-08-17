import { useNavigate } from 'react-router-dom';
import { Eye, Pill, Plus, ShoppingCart } from 'lucide-react';
import type { Medicine } from '../../data/medicines';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';

interface ProductCardProps {
  medicine: Medicine;
  showReorder?: boolean;
}

export default function ProductCard({ medicine: m, showReorder }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const { toast } = useToast();
  const inCart = cart.some((l) => l.medicineId === m.id);

  const add = () => {
    addToCart(m.id, 1);
    toast('success', `${m.name} added to cart`, `${m.strength} · ${m.packSize} · ₹${m.indicativePrice}`);
  };

  return (
    <div className="card group flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-panel">
      <button
        onClick={() => navigate(`/retailer/medicines/${m.id}`)}
        className="flex flex-1 flex-col p-4 text-left"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy/[0.06] text-brand-muted transition-colors group-hover:bg-brand-navy group-hover:text-white">
            <Pill size={20} />
          </span>
          <span className="text-[11px] font-medium text-brand-charcoal/35 tabular-nums">{m.id}</span>
        </div>
        <h3 className="mt-3 text-[15px] font-semibold leading-snug text-brand-charcoal">{m.name}</h3>
        <p className="mt-0.5 text-[12px] text-brand-charcoal/55">
          <span className="font-medium">Generic:</span> {m.generic}
        </p>
        <p className="mt-1 text-[12px] text-brand-charcoal/55">
          <span className="font-medium">Category:</span> {m.category}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-brand-charcoal/50">
          <span>
            <span className="font-medium">Form:</span> {m.dosageForm}
          </span>
          <span>
            <span className="font-medium">Strength:</span> {m.strength}
          </span>
          <span>
            <span className="font-medium">Pack:</span> {m.packSize}
          </span>
        </div>
        <p className="mt-2.5 text-[12px] font-medium text-brand-muted">{m.supplier}</p>
      </button>

      <div className="flex items-end justify-between gap-2 border-t border-brand-navy/5 px-4 py-3">
        <div>
          <p className="text-[15px] font-semibold text-brand-charcoal tabular-nums">₹{m.indicativePrice}</p>
          <p className="text-[10.5px] text-brand-charcoal/40">Indicative price</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/retailer/medicines/${m.id}`)}
            >
              <Eye size={13} /> View
            </Button>
            <Button
              size="sm"
              variant={inCart ? 'secondary' : 'primary'}
              onClick={(e) => {
                e.stopPropagation();
                if (!inCart) add();
                else navigate('/retailer/cart');
              }}
            >
              {inCart ? <ShoppingCart size={13} /> : <Plus size={13} />}
              {inCart ? 'In Cart' : 'Add'}
            </Button>
          </div>
          {showReorder && (
            <button
              onClick={add}
              className="text-[12px] font-semibold text-brand-navy transition-colors hover:text-brand-muted"
            >
              {inCart ? 'In cart — + more' : 'Quick reorder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
