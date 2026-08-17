import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, BookmarkCheck, Minus, Pill, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { MEDICINE_PRICE_NOTE } from '../../data/medicines';
import { useCart } from '../../context/CartContext';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';

export default function RetailerCart() {
  const navigate = useNavigate();
  const {
    cartItems,
    saved,
    updateQty,
    removeFromCart,
    saveForLater,
    moveToCart,
    cartSubtotal,
    cartGst,
    cartDeliveryFee,
    cartTotal,
  } = useCart();

  const savedMedicines = saved
    .map((id) => cartItems.map((c) => c.medicine).find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const empty = cartItems.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <ShoppingBag size={20} /> Your Cart
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">
          {empty ? 'Your cart is empty' : `${cartItems.length} medicine${cartItems.length === 1 ? '' : 's'} in your cart`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {empty ? (
            <EmptyState
              title="Your cart is empty"
              message="Browse the medicine catalogue and add items to place your first order."
              action={{ label: 'Browse Medicines', onClick: () => navigate('/retailer/medicines') }}
            />
          ) : (
            <Card>
              <CardHeader title="Cart Items" subtitle="Indicative prices — see note below" icon={<Pill size={15} />} />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-navy/8">
                      <th className="table-th">Medicine</th>
                      <th className="table-th">Strength</th>
                      <th className="table-th">Pack</th>
                      <th className="table-th">Supplier</th>
                      <th className="table-th text-right">Qty</th>
                      <th className="table-th text-right">Total</th>
                      <th className="table-th" />
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(({ line, medicine }) => (
                      <tr key={medicine.id} className="table-row">
                        <td className="table-td">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/[0.06] text-brand-muted">
                              <Pill size={16} />
                            </span>
                            <div className="min-w-0">
                              <button
                                onClick={() => navigate(`/retailer/medicines/${medicine.id}`)}
                                className="block truncate text-[13.5px] font-semibold text-brand-charcoal hover:text-brand-navy"
                              >
                                {medicine.name}
                              </button>
                              <p className="text-[11.5px] text-brand-charcoal/45 tabular-nums">{medicine.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-td whitespace-nowrap text-brand-charcoal/75">{medicine.strength}</td>
                        <td className="table-td whitespace-nowrap text-brand-charcoal/75">{medicine.packSize}</td>
                        <td className="table-td max-w-[160px] truncate text-brand-charcoal/75">{medicine.supplier}</td>
                        <td className="table-td">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => updateQty(medicine.id, line.qty - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded text-brand-charcoal/70 hover:bg-brand-navy/5"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-[13px] font-semibold tabular-nums">{line.qty}</span>
                            <button
                              onClick={() => updateQty(medicine.id, line.qty + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded text-brand-charcoal/70 hover:bg-brand-navy/5"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="table-td text-right font-semibold tabular-nums">
                          ₹{medicine.indicativePrice * line.qty}
                        </td>
                        <td className="table-td">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => saveForLater(medicine.id)}
                              title="Save for later"
                              className="rounded p-1.5 text-brand-charcoal/40 transition-colors hover:bg-brand-navy/5 hover:text-brand-muted"
                            >
                              <Bookmark size={14} />
                            </button>
                            <button
                              onClick={() => removeFromCart(medicine.id)}
                              title="Remove"
                              className="rounded p-1.5 text-brand-charcoal/40 transition-colors hover:bg-brand-navy/5 hover:text-status-danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {savedMedicines.length > 0 && (
            <Card>
              <CardHeader title="Saved for Later" subtitle="Move items back to your cart when ready" icon={<BookmarkCheck size={15} />} />
              <div className="divide-y divide-brand-navy/5 px-5 pb-4">
                {savedMedicines.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/[0.06] text-brand-muted">
                      <Pill size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-brand-charcoal">{m.name}</p>
                      <p className="text-[12px] text-brand-charcoal/50">
                        ₹{m.indicativePrice}/pack · {m.strength} · {m.packSize}
                      </p>
                    </div>
                    <button
                      onClick={() => moveToCart(m.id)}
                      className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-navy transition-colors hover:text-brand-muted"
                    >
                      Move to cart <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <p className="text-[11.5px] leading-relaxed text-brand-charcoal/45">{MEDICINE_PRICE_NOTE}</p>
        </div>

        <Card className="h-fit lg:sticky lg:top-40">
          <CardHeader title="Order Summary" subtitle="Subtotal + 5% GST + delivery" icon={<ShoppingBag size={15} />} />
          <div className="space-y-2.5 px-5 pb-4 text-[13.5px]">
            <div className="flex justify-between">
              <span className="text-brand-charcoal/60">Subtotal</span>
              <span className="font-medium tabular-nums">₹{cartSubtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-charcoal/60">GST (5%)</span>
              <span className="font-medium tabular-nums">₹{cartGst}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 text-brand-charcoal/60">
                <Truck size={13} /> Delivery
              </span>
              <span className="font-medium tabular-nums">
                {cartDeliveryFee === 0 ? <span className="text-status-success">Free</span> : `₹${cartDeliveryFee}`}
              </span>
            </div>
            {cartDeliveryFee > 0 && (
              <p className="rounded-lg bg-brand-navy/[0.03] px-2.5 py-1.5 text-[12px] text-brand-charcoal/55">
                Add ₹{Math.max(0, 500 - cartSubtotal)} more for free delivery.
              </p>
            )}
            <div className="flex justify-between border-t border-brand-navy/8 pt-2.5">
              <span className="font-semibold text-brand-charcoal">Total</span>
              <span className="text-[16px] font-bold text-brand-charcoal tabular-nums">₹{cartTotal}</span>
            </div>
          </div>
          <div className="space-y-2 px-5 pb-5">
            <Button className="w-full" disabled={empty} onClick={() => navigate('/retailer/checkout')}>
              Proceed to Checkout <ArrowRight size={15} />
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/retailer/medicines')}>
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
