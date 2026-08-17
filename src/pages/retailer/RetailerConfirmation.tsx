import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, MapPin, PackageSearch, Smartphone, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatDateTime } from '../../lib/utils';

const statusFlow = ['Submitted', 'Under Review', 'Approved', 'Shipped', 'Delivered'];

export default function RetailerConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useCart();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-semibold text-brand-charcoal">Order not found</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/retailer/orders')}>
          View My Orders
        </Button>
      </Card>
    );
  }

  const currentStep = statusFlow.indexOf(order.status) + 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-brand-navy to-brand-muted px-6 py-8 text-center text-white">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-3 text-[22px] font-semibold tracking-tight">Order Submitted Successfully</h1>
          <p className="mt-1 text-[13.5px] text-white/80">
            Your order has been submitted and is now under review. Order ID: {order.orderNumber} · {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-4 gap-2">
            {statusFlow.map((s, i) => {
              const done = i < currentStep;
              return (
                <div key={s} className="text-center">
                  <span
                    className={
                      done
                        ? 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-status-successBg text-status-success'
                        : 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy/[0.06] text-brand-charcoal/35'
                    }
                  >
                    {done ? <CheckCircle2 size={16} /> : i + 1}
                  </span>
                  <p className={`mt-1.5 text-[11px] font-medium ${done ? 'text-brand-charcoal' : 'text-brand-charcoal/45'}`}>
                    {s}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-brand-navy/8">
            <div className="flex items-center justify-between border-b border-brand-navy/5 px-4 py-3">
              <p className="text-[12px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Items</p>
              <p className="text-[13px] font-medium text-brand-charcoal">
                {order.items.reduce((s, i) => s + i.qty, 0)} packs
              </p>
            </div>
            <div className="divide-y divide-brand-navy/5 px-4">
              {order.items.map((i) => (
                <div key={i.medicineId} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-brand-charcoal/75">
                    {i.name} <span className="text-brand-charcoal/45">× {i.qty}</span>
                  </span>
                  <span className="text-[12px] text-brand-charcoal/55">{i.supplier}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-navy/8 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                <MapPin size={13} /> Delivery Address
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-brand-charcoal">{order.delivery.storeName}</p>
              <p className="text-[12.5px] text-brand-charcoal/60">
                {order.delivery.address}, {order.delivery.city} — {order.delivery.pincode}
              </p>
            </div>
            <div className="rounded-xl border border-brand-navy/8 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                <Smartphone size={13} /> Payment
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-brand-charcoal">
                {order.status === 'Cancelled' ? 'Refund pending' : order.paymentMethod} · ₹{order.total}
              </p>
              <p className="text-[12px] text-brand-charcoal/50">Payment Status: {order.status === 'Cancelled' ? 'Refunded' : 'Received (demo)'}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-navy/[0.03] px-4 py-3">
            <Truck size={15} className="shrink-0 text-brand-muted" />
            <p className="text-[13px] text-brand-charcoal/70">
              Expected Delivery: <span className="font-semibold text-brand-charcoal">in 2–4 business days</span> (demo estimate)
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/retailer/orders')}>
              <PackageSearch size={15} /> Track Order
            </Button>
            <Button variant="secondary" onClick={() => navigate('/retailer/orders')}>
              View Order
            </Button>
            <Button variant="ghost" onClick={() => navigate('/retailer/medicines')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
