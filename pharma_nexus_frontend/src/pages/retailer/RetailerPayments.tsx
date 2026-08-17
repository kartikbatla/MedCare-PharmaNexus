import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, ReceiptText } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { formatDate, formatINR } from '../../lib/utils';

const payTone = (payment: string): 'success' | 'warning' | 'neutral' | 'info' =>
  payment === 'UPI' || payment === 'Card' ? 'success' : 'neutral';

export default function RetailerPayments() {
  const navigate = useNavigate();
  const { orders } = useCart();

  const payments = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'Cancelled')
        .map((o) => ({
          orderNumber: o.orderNumber,
          date: o.createdAt,
          method: o.paymentMethod,
          amount: o.total,
          status: o.status === 'Delivered' ? 'Paid' : 'Pending',
        })),
    [orders],
  );

  const totalSpend = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <CreditCard size={20} /> Payments
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">Payment history and outstanding amounts for CarePlus Pharmacy.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[12px] text-brand-charcoal/55">Total paid (demo)</p>
          <p className="mt-1 text-[22px] font-bold text-brand-charcoal tabular-nums">{formatINR(totalSpend)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[12px] text-brand-charcoal/55">Outstanding</p>
          <p className="mt-1 text-[22px] font-bold text-brand-charcoal tabular-nums">{formatINR(pending)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[12px] text-brand-charcoal/55">Business account</p>
          <p className="mt-1 text-[15px] font-semibold text-brand-charcoal">Approved · Net-30</p>
          <p className="mt-0.5 text-[12px] text-brand-charcoal/45">Demo credit terms</p>
        </Card>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          message="Payments against your orders will appear here."
          action={{ label: 'Browse Medicines', onClick: () => navigate('/retailer/medicines') }}
        />
      ) : (
        <Card>
          <CardHeader title="Payment History" subtitle="Demo payment environment — no real transactions" icon={<ReceiptText size={15} />} />
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Order</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Method</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.orderNumber} className="table-row">
                    <td className="table-td font-semibold text-brand-charcoal">{p.orderNumber}</td>
                    <td className="table-td whitespace-nowrap text-brand-charcoal/70">{formatDate(p.date)}</td>
                    <td className="table-td text-brand-charcoal/75">{p.method}</td>
                    <td className="table-td text-right font-semibold tabular-nums">₹{p.amount}</td>
                    <td className="table-td">
                      <StatusBadge status={p.status} tone={payTone(p.method)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-brand-navy/5 px-5 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/retailer/orders')}>
              View orders <ArrowRight size={13} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
