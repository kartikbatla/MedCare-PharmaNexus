import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, FileCheck2, PackageCheck, ShieldAlert, Truck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { RetailerBadge } from '../../components/onboarding/RetailerBadges';
import { useAuth } from '../../context/AuthContext';
import { useRetailers } from '../../context/RetailerContext';
import { cn } from '../../lib/utils';

interface RetailerNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: 'success' | 'warning' | 'info';
  to: string;
  icon: typeof BellRing;
}

const notices: RetailerNotice[] = [
  {
    id: 'n1',
    title: 'Order ORD-20450 shipped',
    body: 'Your order is on the way and expected in 2–3 days.',
    time: '2h ago',
    tone: 'success',
    to: '/retailer/orders',
    icon: Truck,
  },
  {
    id: 'n2',
    title: 'Low stock: Clavam 625 & Insugen 30/70',
    body: 'Both SKUs are running low at the depot. Consider restocking this week.',
    time: '6h ago',
    tone: 'warning',
    to: '/retailer/medicines',
    icon: ShieldAlert,
  },
  {
    id: 'n3',
    title: 'Recommended for your store',
    body: 'Restock Shelcal 500 and Pan 40 based on your recent orders.',
    time: '1d ago',
    tone: 'info',
    to: '/retailer/medicines',
    icon: PackageCheck,
  },
  {
    id: 'n4',
    title: 'Order ORD-20452 delivered',
    body: 'Delivered to CarePlus Pharmacy. Thanks for ordering with PharmaNexus Retail!',
    time: '1d ago',
    tone: 'success',
    to: '/retailer/orders',
    icon: PackageCheck,
  },
  {
    id: 'n5',
    title: 'UPI payment confirmed',
    body: 'Your payment of ₹2,482 for ORD-20452 was received.',
    time: '1d ago',
    tone: 'success',
    to: '/retailer/orders',
    icon: PackageCheck,
  },
];

const toneStyles = {
  success: 'bg-status-successBg text-status-success',
  warning: 'bg-status-warningBg text-status-warning',
  info: 'bg-brand-navy/[0.06] text-brand-muted',
};

export default function RetailerNotifications() {
  const { user } = useAuth();
  const { retailerById } = useRetailers();
  const r = user?.storeId ? retailerById(user.storeId) : undefined;
  const pending = r && r.status !== 'Active';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <BellRing size={20} /> Notifications
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">Order updates, stock alerts, and recommendations.</p>
      </div>

      {pending && r && (
        <Link
          to="/retailer/application"
          className="group flex items-start gap-3 rounded-xl border border-status-warning/30 bg-status-warningBg/50 px-5 py-4 transition-colors hover:border-status-warning/60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-warning text-white">
            <FileCheck2 size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
              <span className="truncate text-[13.5px] font-semibold text-brand-charcoal">
                Your retailer application is {r.status === 'Documents Required' ? 'awaiting action' : 'under verification'}
              </span>
              <RetailerBadge status={r.status} />
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-relaxed text-brand-charcoal/60">
              Ordering is locked until your business details and documents are verified and approved by the authorized
              distributor.
            </span>
          </span>
          <ArrowRight size={15} className="mt-1 shrink-0 text-brand-charcoal/25 transition-colors group-hover:text-brand-muted" />
        </Link>
      )}

      <Card>
        <div className="divide-y divide-brand-navy/5">
          {notices.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.id} to={n.to} className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-brand-navy/[0.02]">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', toneStyles[n.tone])}>
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13.5px] font-semibold text-brand-charcoal">{n.title}</span>
                    <span className="shrink-0 text-[11.5px] text-brand-charcoal/40">{n.time}</span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-brand-charcoal/60">{n.body}</span>
                </span>
                <ArrowRight size={15} className="mt-1 shrink-0 text-brand-charcoal/25 transition-colors group-hover:text-brand-muted" />
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
