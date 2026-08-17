import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, PackageSearch, RotateCcw, ShoppingBag } from 'lucide-react';
import { useCart, type OrderStatus } from '../../context/CartContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn, formatDateTime } from '../../lib/utils';

const tabs: Array<'All' | OrderStatus> = ['All', 'Submitted', 'Under Review', 'Approved', 'Shipped', 'Delivered', 'Cancelled'];

const statusToneMap: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Submitted: 'warning',
  'Under Review': 'info',
  Approved: 'neutral',
  Shipped: 'neutral',
  Delivered: 'success',
  Cancelled: 'danger',
};

export default function RetailerOrders() {
  const navigate = useNavigate();
  const { orders, reorder, cart } = useCart();
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');
  const [open, setOpen] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );
  const filtered = tab === 'All' ? sorted : sorted.filter((o) => o.status === tab);

  const counts = useMemo(() => {
    const c: Record<(typeof tabs)[number], number> = {
      All: orders.length,
      Submitted: 0,
      'Under Review': 0,
      Approved: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    orders.forEach((o) => {
      c[o.status] += 1;
    });
    return c;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
            <ShoppingBag size={20} /> My Orders
          </h1>
          <p className="mt-1 text-[13px] text-brand-charcoal/55">Track, review, and reorder your medicine orders.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate('/retailer/medicines')}>
          <PackageSearch size={15} /> New Order
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium whitespace-nowrap transition-colors',
              tab === t ? 'bg-brand-navy text-white' : 'bg-brand-navy/5 text-brand-charcoal/70 hover:bg-brand-navy/10 hover:text-brand-charcoal',
            )}
          >
            {t}
            <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', tab === t ? 'bg-white/20' : 'bg-brand-navy/10')}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab === 'All' ? '' : tab.toLowerCase() + ' '}orders`}
          message="Orders you place will appear here with live status updates."
          action={{ label: 'Browse Medicines', onClick: () => navigate('/retailer/medicines') }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Supplier</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Delivery</th>
                  <th className="table-th" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const suppliers = Array.from(new Set(o.items.map((i) => i.supplier.split(' ')[0]))).slice(0, 2).join(', ');
                  const itemNames = o.items.slice(0, 2).map((i) => i.name).join(', ');
                  const more = o.items.length - 2;
                  const inCart = o.items.every((i) => cart.some((l) => l.medicineId === i.medicineId));
                  return (
                    <Fragment key={o.id}>
                      <tr className="table-row">
                        <td className="table-td font-semibold text-brand-charcoal">{o.orderNumber}</td>
                        <td className="table-td whitespace-nowrap text-brand-charcoal/70">{formatDateTime(o.createdAt)}</td>
                        <td className="table-td max-w-[220px] truncate text-brand-charcoal/75">
                          {itemNames}
                          {more > 0 && <span className="text-brand-charcoal/45"> +{more} more</span>}
                        </td>
                        <td className="table-td max-w-[150px] truncate text-brand-charcoal/75">{suppliers}</td>
                        <td className="table-td text-right font-semibold tabular-nums">₹{o.total}</td>
                        <td className="table-td">
                          <StatusBadge status={o.status} tone={statusToneMap[o.status]} />
                        </td>
                        <td className="table-td text-brand-charcoal/70">
                          {o.status === 'Delivered'
                            ? 'Delivered'
                            : o.status === 'Cancelled'
                              ? '—'
                              : '2–4 days'}
                        </td>
                        <td className="table-td">
                          <div className="flex items-center justify-end gap-1">
                            {o.status === 'Delivered' && (
                              <button
                                onClick={() => reorder(o.id)}
                                disabled={inCart}
                                title="Reorder"
                                className="rounded p-1.5 text-brand-charcoal/40 transition-colors hover:bg-brand-navy/5 hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <RotateCcw size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => setOpen(open === o.id ? null : o.id)}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-brand-muted transition-colors hover:bg-brand-navy/5 hover:text-brand-navy"
                            >
                              View <ChevronDown size={13} className={cn('transition-transform', open === o.id && 'rotate-180')} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open === o.id && (
                        <tr className="bg-brand-navy/[0.02]">
                          <td colSpan={8}>
                            <div className="grid gap-5 px-6 py-4 lg:grid-cols-2">
                              <div>
                                <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Items</p>
                                <div className="mt-2 divide-y divide-brand-navy/5">
                                  {o.items.map((i) => (
                                    <div key={i.medicineId} className="flex items-center justify-between py-2 text-[13px]">
                                      <span className="text-brand-charcoal/75">
                                        {i.name} <span className="text-brand-charcoal/45">× {i.qty}</span>
                                      </span>
                                      <span className="font-medium tabular-nums">₹{i.indicativePrice * i.qty}</span>
                                    </div>
                                  ))}
                                  <div className="flex items-center justify-between py-2 text-[12.5px] text-brand-charcoal/55">
                                    <span>Subtotal · GST · Delivery</span>
                                    <span className="tabular-nums">₹{o.subtotal} · ₹{o.gst} · {o.deliveryFee === 0 ? 'Free' : `₹${o.deliveryFee}`}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Delivery</p>
                                <p className="mt-2 text-[13px] leading-relaxed text-brand-charcoal/70">
                                  <span className="font-semibold text-brand-charcoal">{o.delivery.storeName}</span>
                                  <br />
                                  {o.delivery.address}, {o.delivery.city}, {o.delivery.state} — {o.delivery.pincode}
                                </p>
                                <p className="mt-2 text-[12px] text-brand-charcoal/50">Paid via {o.paymentMethod} · {o.paymentMethod === 'UPI' || o.paymentMethod === 'Card' ? 'demo payment received' : 'on account'}</p>
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      const text = [
                                        '===========================================================',
                                        '                  PHARMANEXUS B2B TAX INVOICE              ',
                                        '===========================================================',
                                        `Invoice No    : INV-RET-2026-${o.orderNumber.replace(/[^0-9]/g, '') || '1001'}`,
                                        `Date          : ${formatDateTime(o.createdAt)}`,
                                        `Order No       : ${o.orderNumber}`,
                                        `Retailer      : ${o.delivery.storeName}`,
                                        `Address       : ${o.delivery.address}, ${o.delivery.city}, ${o.delivery.state}`,
                                        '-----------------------------------------------------------',
                                        'Item Description                Qty     Price      Total',
                                        '-----------------------------------------------------------',
                                        ...o.items.map(
                                          (i) =>
                                            `${i.name.padEnd(30)} ${String(i.qty).padStart(5)}  ₹${String(i.indicativePrice).padStart(8)}  ₹${String(i.indicativePrice * i.qty).padStart(8)}`,
                                        ),
                                        '-----------------------------------------------------------',
                                        `Subtotal                                            ₹${o.subtotal}`,
                                        `GST (18% B2B Pharma)                                 ₹${o.gst}`,
                                        `Freight / Delivery                                  ${o.deliveryFee === 0 ? 'FREE' : `₹${o.deliveryFee}`}`,
                                        '-----------------------------------------------------------',
                                        `TOTAL INVOICE AMOUNT                                ₹${o.total}`,
                                        '===========================================================',
                                        `Payment Status: PAID via ${o.paymentMethod}`,
                                        'GSTIN         : 07AAAAA0000A1Z5 (PharmaNexus Central)',
                                        'Drug License  : DL-DL-2026-99182',
                                        '===========================================================',
                                      ].join('\n');
                                      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `Invoice_${o.orderNumber}.txt`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                  >
                                    Download B2B Tax Invoice
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
