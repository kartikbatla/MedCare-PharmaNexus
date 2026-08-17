import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ClipboardList, UserPlus, ShoppingBag, Truck, CheckCircle2, RefreshCw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import DataTable, { type Column } from '../components/ui/DataTable';
import KPICard from '../components/ui/KPICard';
import { useRetailers } from '../context/RetailerContext';
import { RetailerBadge } from '../components/onboarding/RetailerBadges';
import type { Retailer, RetailerStatus } from '../data/retailers';
import { cn, formatINR } from '../lib/utils';
import { fetchRetailerOrders } from '../lib/api';
import { useControlTower } from '../context/ControlTowerContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/ui/StatusBadge';

const STATUS_FILTERS: Array<{ id: RetailerStatus | 'All'; label: string }> = [
  { id: 'All', label: 'All' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Under Review', label: 'Under Review' },
  { id: 'Documents Required', label: 'Documents Required' },
  { id: 'Verified', label: 'Verified' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Active', label: 'Active' },
  { id: 'Rejected', label: 'Rejected' },
];

const ACTIONABLE: RetailerStatus[] = ['Pending', 'Under Review', 'Documents Required', 'Rejected'];

interface RetailerOrder {
  order_id: string;
  retailer_id: string;
  retailer_name: string;
  sku_id: string;
  medicine_name: string;
  quantity: number;
  total_amount: number;
  order_date: string;
  status: string;
  location?: string;
}

export default function Retailers() {
  const { retailers } = useRetailers();
  const { fulfillRetailer } = useControlTower();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('filter') as RetailerStatus | null) ?? 'All';

  const [retailerOrders, setRetailerOrders] = useState<RetailerOrder[]>([]);
  const [fulfilledIds, setFulfilledIds] = useState<Set<string>>(new Set());

  const loadOrders = async () => {
    try {
      const res = await fetchRetailerOrders();
      const orderList = Array.isArray(res) ? res : (res?.orders || []);
      setRetailerOrders(orderList);
    } catch (e) {
      console.error('Failed to fetch retailer orders:', e);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFulfillOrder = async (order: RetailerOrder) => {
    await fulfillRetailer(order.order_id, 'PLANT_DEL');
    setFulfilledIds((prev) => new Set(prev).add(order.order_id));
    toast('success', 'Order Fulfilled & Stock Deducted', `Released ${order.quantity} units of ${order.medicine_name} to ${order.retailer_name}. PLANT_DEL inventory updated.`);
    loadOrders();
  };

  const counts = (id: RetailerStatus | 'All') =>
    id === 'All' ? retailers.length : retailers.filter((r) => r.status === id).length;

  const setFilter = (id: RetailerStatus | 'All') => {
    const next = new URLSearchParams(params);
    if (id === 'All') next.delete('filter');
    else next.set('filter', id);
    setParams(next, { replace: true });
  };

  const visible = filter === 'All' ? retailers : retailers.filter((r) => r.status === filter);

  const columns: Column<Retailer>[] = [
    {
      key: 'retailer',
      header: 'Retailer',
      sortValue: (r) => r.business.tradeName,
      render: (r) => (
        <div>
          <p className="font-semibold text-brand-charcoal">{r.business.tradeName}</p>
          <p className="text-xs text-brand-charcoal/50">{r.business.city}</p>
        </div>
      ),
    },
    {
      key: 'business',
      header: 'Business',
      sortValue: (r) => r.business.legalName,
      render: (r) => (
        <div>
          <p className="text-[13px] text-brand-charcoal">{r.business.legalName}</p>
          <p className="text-xs text-brand-charcoal/50">{r.applicationNumber}</p>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      sortValue: (r) => r.submittedDate ?? '',
      render: (r) => <span className="text-[13px] text-brand-charcoal/70">{r.submittedDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => <RetailerBadge status={r.status} />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/retailers/${r.id}`);
          }}
        >
          View <ArrowRight size={14} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retailer Management & Live B2B Orders"
        subtitle="Onboard new pharmacies, manage current retailer orders, and authorize stock releases"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/migrations')}>
              Import / Migration
            </Button>
            <Button onClick={() => navigate('/retailers/onboard')}>
              <UserPlus size={15} /> Onboard Retailer
            </Button>
          </div>
        }
      />

      {/* Current Retailer Orders Section */}
      <Card>
        <CardHeader
          title="Current B2B Retailer Orders (Real-Time)"
          subtitle="Orders placed by registered pharmacies requiring inventory fulfillment & delivery"
          icon={<ShoppingBag size={15} />}
          action={
            <Button variant="ghost" size="sm" onClick={loadOrders}>
              <RefreshCw size={13} /> Sync Orders
            </Button>
          }
        />

        <div className="overflow-x-auto p-5">
          {retailerOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-navy/15 p-6 text-center text-xs text-brand-charcoal/50">
              No active retailer orders. Place an order on the Retailer Portal (/#/retailer) to see it arrive here in real-time.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-navy/10 text-brand-charcoal/60">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Retailer Name</th>
                  <th className="pb-3 font-semibold">Medicine Ordered</th>
                  <th className="pb-3 font-semibold text-right">Quantity</th>
                  <th className="pb-3 font-semibold text-right">Total Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/8">
                {retailerOrders.map((o) => {
                  const isFulfilled = fulfilledIds.has(o.order_id) || o.status === 'Released & Shipped' || o.status === 'Delivered';
                  return (
                    <tr key={o.order_id} className="hover:bg-brand-navy/[0.02]">
                      <td className="py-3 font-mono font-semibold text-brand-navy">{o.order_id}</td>
                      <td className="py-3 font-medium text-brand-charcoal">{o.retailer_name}</td>
                      <td className="py-3 text-brand-charcoal/80">{o.medicine_name} ({o.sku_id})</td>
                      <td className="py-3 text-right font-semibold text-brand-charcoal tabular-nums">{o.quantity} units</td>
                      <td className="py-3 text-right font-bold text-brand-navy tabular-nums">{formatINR(o.total_amount)}</td>
                      <td className="py-3">
                        <StatusBadge
                          status={isFulfilled ? 'Delivered & Deducted' : o.status}
                          tone={isFulfilled ? 'success' : 'warning'}
                        />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const text = [
                                '===========================================================',
                                '                  PHARMANEXUS B2B TAX INVOICE              ',
                                '===========================================================',
                                `Invoice No    : INV-RET-2026-${o.order_id.replace(/[^0-9]/g, '') || '1001'}`,
                                `Date          : ${new Date().toISOString().split('T')[0]}`,
                                `Order No       : ${o.order_id}`,
                                `Retailer      : ${o.retailer_name}`,
                                `Location      : ${o.location || 'Delhi Branch'}`,
                                '-----------------------------------------------------------',
                                'SKU ID     Medicine Description           Qty       Total',
                                '-----------------------------------------------------------',
                                `${o.sku_id.padEnd(10)} ${o.medicine_name.padEnd(28)} ${String(o.quantity).padStart(5)}  ₹${String(o.total_amount).padStart(8)}`,
                                '-----------------------------------------------------------',
                                `Subtotal                                            ₹${Math.round(o.total_amount * 0.847)}`,
                                `GST (18% B2B Pharma)                                 ₹${Math.round(o.total_amount * 0.153)}`,
                                `Freight / Delivery                                  FREE`,
                                '-----------------------------------------------------------',
                                `TOTAL INVOICE AMOUNT                                ₹${o.total_amount}`,
                                '===========================================================',
                                `Fulfillment Status : ${isFulfilled ? 'FULFILLED & DELIVERED' : o.status.toUpperCase()}`,
                                'Dispatch Plant     : PLANT_DEL (Delhi Central Hub)',
                                'GSTIN              : 07AAAAA0000A1Z5 (PharmaNexus Admin)',
                                '===========================================================',
                              ].join('\n');
                              const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Invoice_${o.order_id}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            Invoice
                          </Button>
                          {isFulfilled ? (
                            <span className="inline-flex items-center gap-1 font-medium text-status-success text-xs">
                              <CheckCircle2 size={13} /> Stock Released
                            </span>
                          ) : (
                            <Button size="sm" onClick={() => handleFulfillOrder(o)}>
                              <Truck size={13} /> Fulfill & Deliver Stock
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <section aria-label="Retailer statistics" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Total Retailers" value={String(counts('All'))} change="Onboarded network" icon="store" />
        <KPICard
          label="Action Needed"
          value={String(retailers.filter((r) => ACTIONABLE.includes(r.status)).length)}
          change="Pending verification"
          trend="up"
          trendTone="warning"
          icon="alert"
        />
        <KPICard label="Approved & Active" value={String(counts('Approved') + counts('Active'))} change="Order-ready" trend="up" trendTone="success" icon="check" />
        <KPICard label="Documents Pending" value={String(counts('Documents Required'))} change="Awaiting upload" icon="file" />
      </section>

      <Card>
        <CardHeader title="Retailer Applications" subtitle="Filter by application status to manage onboarding approvals." icon={<ClipboardList size={15} />} />

        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-brand-navy/8">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.id}
              onClick={() => setFilter(sf.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === sf.id
                  ? 'bg-brand-navy text-white'
                  : 'bg-brand-navy/5 text-brand-charcoal/60 hover:bg-brand-navy/10',
              )}
            >
              {sf.label} ({counts(sf.id)})
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/retailers/${r.id}`)}
          initialSort={{ key: 'submitted', dir: 'desc' }}
          pageSize={10}
          emptyTitle="No retailer applications"
          emptyMessage="Applications matching this status will appear here."
        />
      </Card>
    </div>
  );
}
