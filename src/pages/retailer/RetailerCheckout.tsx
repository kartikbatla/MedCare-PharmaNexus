import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  MapPin,
  QrCode,
  Receipt,
  ShieldCheck,
  Smartphone,
  Truck,
} from 'lucide-react';
import { useCart, type DeliveryDetails, type PaymentMethod } from '../../context/CartContext';
import { MEDICINE_PRICE_NOTE } from '../../data/medicines';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

const steps = ['Order Details', 'Delivery Details', 'Payment', 'Review Order'];

const paymentOptions: Array<{ id: PaymentMethod; icon: typeof QrCode; blurb: string; note: string }> = [
  { id: 'UPI', icon: QrCode, blurb: 'Google Pay, PhonePe, BHIM', note: 'Instant confirmation on payment.' },
  { id: 'Card', icon: CreditCard, blurb: 'Credit / debit cards', note: 'Visa, Mastercard, RuPay and Amex accepted.' },
  { id: 'Net Banking', icon: Landmark, blurb: 'All major Indian banks', note: 'Redirect to your bank to authorize.' },
  { id: 'Business Account', icon: Building2, blurb: 'Net-30 for registered pharmacies', note: 'Pay within 30 days of delivery.' },
  { id: 'Credit / Invoice', icon: Banknote, blurb: 'Invoice-based credit terms', note: 'Available for approved business accounts.' },
];

const emptyDelivery: DeliveryDetails = {
  storeName: 'CarePlus Pharmacy',
  contactName: 'Rahul Mehta',
  phone: '+91 98200 44567',
  address: 'Shop 12, Linking Road, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
  deliveryNote: '',
};

export default function RetailerCheckout() {
  const navigate = useNavigate();
  const { cartItems, cartSubtotal, cartGst, cartDeliveryFee, cartTotal, placeOrder } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState<DeliveryDetails>(emptyDelivery);
  const [payment, setPayment] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const placedRef = useRef(false);

  useEffect(() => {
    if (placedRef.current) return;
    if (cartItems.length === 0 && step > 0) {
      navigate('/retailer/cart', { replace: true });
    }
  }, [cartItems.length, step, navigate]);

  const set = (field: keyof DeliveryDetails, value: string) => {
    setDelivery((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validateDelivery = () => {
    const next: Record<string, string> = {};
    if (!delivery.storeName.trim()) next.storeName = 'Retailer / pharmacy name is required';
    if (!delivery.contactName.trim()) next.contactName = 'Contact person is required';
    if (!/^\+?\d{10,12}$/.test(delivery.phone.replace(/[\s-]/g, ''))) next.phone = 'Enter a valid phone number';
    if (!delivery.address.trim()) next.address = 'Delivery address is required';
    if (!delivery.city.trim()) next.city = 'City is required';
    if (!delivery.pincode.trim()) next.pincode = 'PIN Code is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const place = async () => {
    placedRef.current = true;
    const order = placeOrder(delivery, payment);
    
    try {
      await fetch('/api/retailer/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_id: order.id,
          retailer_name: delivery.storeName || 'CarePlus Pharmacy',
          location: `${delivery.city}, ${delivery.state}`,
          sku_id: cartItems[0]?.medicine?.id || 'MED-0001',
          medicine_name: cartItems[0]?.medicine?.name || 'Pharma Batch Order',
          quantity: cartItems.reduce((s, i) => s + i.line.qty, 0),
          unit_price: cartItems[0]?.medicine?.indicativePrice || 105,
          total_amount: order.total,
        }),
      });
    } catch (e) {
      console.error('Failed to sync retailer order to backend:', e);
    }

    toast('success', 'Order placed successfully', `${order.orderNumber} · ₹${order.total}`);
    navigate(`/retailer/orders/confirm/${order.id}`);
  };

  const inputClass =
    'w-full rounded-xl border border-brand-navy/10 bg-white px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10';

  const goBack = () => {
    if (step === 0) navigate('/retailer/cart');
    else setStep(step - 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <button onClick={goBack} className="flex items-center gap-1.5 text-[13px] font-medium text-brand-muted transition-colors hover:text-brand-navy">
          <ArrowLeft size={14} /> Back to {step === 0 ? 'Cart' : steps[step - 1]}
        </button>
        <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-brand-charcoal">Checkout</h1>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors',
                i < step
                  ? 'bg-status-successBg text-status-success'
                  : i === step
                    ? 'bg-brand-navy text-white'
                    : 'bg-brand-navy/8 text-brand-charcoal/40',
              )}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={cn('hidden text-[12.5px] font-medium sm:block', i === step ? 'text-brand-charcoal' : 'text-brand-charcoal/45')}>
              {s}
            </span>
            {i < steps.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-status-success' : 'bg-brand-navy/10')} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader title="Order Details" subtitle={`${cartItems.length} medicine${cartItems.length === 1 ? '' : 's'} ready to order`} icon={<Receipt size={15} />} />
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Medicine</th>
                  <th className="table-th">Dosage / Strength</th>
                  <th className="table-th">Pack</th>
                  <th className="table-th">Supplier</th>
                  <th className="table-th text-right">Qty</th>
                  <th className="table-th text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(({ line, medicine }) => (
                  <tr key={medicine.id} className="table-row">
                    <td className="table-td font-medium text-brand-charcoal">{medicine.name}</td>
                    <td className="table-td text-brand-charcoal/75">{medicine.dosageForm} · {medicine.strength}</td>
                    <td className="table-td text-brand-charcoal/75">{medicine.packSize}</td>
                    <td className="table-td max-w-[160px] truncate text-brand-charcoal/75">{medicine.supplier}</td>
                    <td className="table-td text-right tabular-nums">{line.qty}</td>
                    <td className="table-td text-right font-semibold tabular-nums">₹{medicine.indicativePrice * line.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 pb-1 text-[11.5px] text-brand-charcoal/45">{MEDICINE_PRICE_NOTE}</p>
          <div className="flex justify-end border-t border-brand-navy/5 px-5 py-4">
            <Button onClick={() => setStep(1)}>
              Continue to Delivery <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader title="Delivery Details" subtitle="Where should we deliver this order?" icon={<Truck size={15} />} />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">Retailer / Pharmacy Name</label>
              <input className={inputClass} value={delivery.storeName} onChange={(e) => set('storeName', e.target.value)} />
              {errors.storeName && <p className="mt-1 text-[12px] text-status-danger">{errors.storeName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">Contact Person</label>
              <input className={inputClass} value={delivery.contactName} onChange={(e) => set('contactName', e.target.value)} />
              {errors.contactName && <p className="mt-1 text-[12px] text-status-danger">{errors.contactName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">Phone</label>
              <input className={inputClass} value={delivery.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 ..." />
              {errors.phone && <p className="mt-1 text-[12px] text-status-danger">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">Delivery Address</label>
              <textarea className={cn(inputClass, 'min-h-[72px] resize-none')} value={delivery.address} onChange={(e) => set('address', e.target.value)} />
              {errors.address && <p className="mt-1 text-[12px] text-status-danger">{errors.address}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">City</label>
              <input className={inputClass} value={delivery.city} onChange={(e) => set('city', e.target.value)} />
              {errors.city && <p className="mt-1 text-[12px] text-status-danger">{errors.city}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">State</label>
                <input className={inputClass} value={delivery.state} onChange={(e) => set('state', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">PIN Code</label>
                <input className={inputClass} value={delivery.pincode} onChange={(e) => set('pincode', e.target.value)} />
                {errors.pincode && <p className="mt-1 text-[12px] text-status-danger">{errors.pincode}</p>}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">Delivery note (optional)</label>
              <input className={inputClass} value={delivery.deliveryNote} onChange={(e) => set('deliveryNote', e.target.value)} placeholder="e.g. Deliver after 10 AM, ring the rear bell" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-brand-navy/5 px-5 py-4">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft size={15} /> Order Details
            </Button>
            <Button
              onClick={() => {
                if (validateDelivery()) setStep(2);
              }}
            >
              Continue to Payment <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader title="Payment" subtitle="Demo Payment — no real money is moved" icon={<Smartphone size={15} />} />
          <div className="space-y-2 px-5 pb-5">
            {paymentOptions.map((o) => {
              const Icon = o.icon;
              return (
                <button
                  key={o.id}
                  onClick={() => setPayment(o.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
                    payment === o.id ? 'border-brand-navy bg-brand-navy/[0.04]' : 'border-brand-navy/10 hover:border-brand-navy/30',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                      payment === o.id ? 'bg-brand-navy text-white' : 'bg-brand-navy/[0.06] text-brand-muted',
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-brand-charcoal">{o.id}</span>
                      <span className="text-[12.5px] text-brand-charcoal/50">{o.blurb}</span>
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-brand-charcoal/55">{o.note}</span>
                  </span>
                  <span
                    className={cn(
                      'mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      payment === o.id ? 'border-brand-navy bg-brand-navy' : 'border-brand-charcoal/25',
                    )}
                  >
                    {payment === o.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
            {payment === 'UPI' && (
              <div className="rounded-xl border border-brand-navy/8 bg-brand-navy/[0.02] p-3.5">
                <label className="mb-1 block text-[12px] font-semibold text-brand-charcoal/60">UPI ID (optional)</label>
                <input className={inputClass} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@okhdfcbank" />
                <p className="mt-1.5 text-[12px] text-brand-charcoal/50">A collect request will be sent to this UPI ID.</p>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-[12.5px] text-brand-charcoal/55">
              <ShieldCheck size={14} className="text-status-success" /> Demo payment environment — simulated for this
              hackathon. No real transaction is processed.
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-brand-navy/5 px-5 py-4">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={15} /> Delivery Details
            </Button>
            <Button onClick={() => setStep(3)}>
              Review Order <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Order Summary" subtitle="Complete order before placing" icon={<Receipt size={15} />} />
              <div className="divide-y divide-brand-navy/5 px-5 pb-4">
                {cartItems.map(({ line, medicine }) => (
                  <div key={medicine.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-brand-charcoal">{medicine.name}</p>
                      <p className="text-[12px] text-brand-charcoal/50">
                        {line.qty} × ₹{medicine.indicativePrice} · {medicine.dosageForm} {medicine.strength} · {medicine.packSize}
                      </p>
                    </div>
                    <p className="font-semibold text-brand-charcoal tabular-nums">₹{medicine.indicativePrice * line.qty}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Delivery Details" icon={<MapPin size={15} />} />
              <div className="grid gap-3 px-5 pb-5 text-[13px] text-brand-charcoal/70 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Store</p>
                  <p className="mt-0.5 font-medium text-brand-charcoal">{delivery.storeName}</p>
                  <p className="text-brand-charcoal/55">{delivery.contactName} · {delivery.phone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Address</p>
                  <p className="mt-0.5 font-medium text-brand-charcoal">
                    {delivery.address}, {delivery.city}, {delivery.state} — {delivery.pincode}
                  </p>
                  {delivery.deliveryNote && <p className="text-brand-charcoal/55">Note: {delivery.deliveryNote}</p>}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Payment" icon={<Smartphone size={15} />} />
              <div className="px-5 pb-5 text-[13px]">
                <p className="font-medium text-brand-charcoal">{payment}</p>
                {payment === 'UPI' && upiId && <p className="text-brand-charcoal/55">to {upiId}</p>}
                <p className="mt-1 text-brand-charcoal/55">{paymentOptions.find((o) => o.id === payment)?.note}</p>
                <p className="mt-1 text-[11.5px] text-brand-charcoal/40">Demo payment — no real transaction.</p>
              </div>
            </Card>
          </div>

          <Card className="h-fit lg:sticky lg:top-40">
            <CardHeader title="Total" icon={<Receipt size={15} />} />
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
                <span className="text-brand-charcoal/60">Delivery</span>
                <span className="font-medium tabular-nums">
                  {cartDeliveryFee === 0 ? <span className="text-status-success">Free</span> : `₹${cartDeliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-brand-navy/8 pt-2.5">
                <span className="font-semibold text-brand-charcoal">Total</span>
                <span className="text-[17px] font-bold text-brand-charcoal tabular-nums">₹{cartTotal}</span>
              </div>
            </div>
            <div className="space-y-2 px-5 pb-5">
              <Button className="w-full" onClick={place}>
                Place Order · ₹{cartTotal}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
                Change payment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
