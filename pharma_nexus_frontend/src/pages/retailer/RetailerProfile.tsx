import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Building2, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { formatINR } from '../../lib/utils';

export default function RetailerProfile() {
  const { user, logout } = useAuth();
  const { orders, cartCount } = useCart();
  const navigate = useNavigate();

  const activeOrders = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const totalSpend = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((s, o) => s + o.total, 0);

  const initials = (user?.name ?? 'User')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const row = 'flex items-start gap-3 rounded-xl border border-brand-navy/8 p-3.5';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <UserRound size={20} /> My Profile
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">Your store details, contact info, and account settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Store Profile" subtitle="Registered with PharmaNexus Retail" icon={<Building2 size={15} />} />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4 rounded-xl bg-brand-navy/[0.04] p-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-lg font-bold text-white">
                {initials}
              </span>
              <div>
                <p className="text-[17px] font-semibold text-brand-charcoal">{user?.name ?? 'Rahul Mehta'}</p>
                <p className="text-[13px] text-brand-charcoal/55">{user?.role ?? 'Store Owner'} · {user?.email ?? 'rahul@carepluspharmacy.in'}</p>
              </div>
              <span className="badge ml-auto bg-status-successBg text-status-success">
                <ShieldCheck size={12} /> Verified business
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={row}>
                <Building2 size={16} className="mt-0.5 text-brand-muted" />
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Store</p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-brand-charcoal">CarePlus Pharmacy</p>
                  <p className="text-[12px] text-brand-charcoal/55">GSTIN · 27AAAPC1234F1Z5</p>
                </div>
              </div>
              <div className={row}>
                <Phone size={16} className="mt-0.5 text-brand-muted" />
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Phone</p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-brand-charcoal">+91 98200 44567</p>
                  <p className="text-[12px] text-brand-charcoal/55">Preferred contact for order updates</p>
                </div>
              </div>
              <div className={row}>
                <MapPin size={16} className="mt-0.5 text-brand-muted" />
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Address</p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-brand-charcoal">Shop 12, Linking Road, Bandra West</p>
                  <p className="text-[12px] text-brand-charcoal/55">Mumbai, Maharashtra — 400050</p>
                </div>
              </div>
              <div className={row}>
                <Mail size={16} className="mt-0.5 text-brand-muted" />
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Email</p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-brand-charcoal">{user?.email ?? 'rahul@carepluspharmacy.in'}</p>
                  <p className="text-[12px] text-brand-charcoal/55">Invoices & statements go here</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Order Summary" subtitle="Across all time" icon={<UserRound size={15} />} />
            <div className="grid grid-cols-3 gap-3 px-5 pb-5">
              <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5 text-center">
                <p className="text-lg font-semibold text-brand-charcoal tabular-nums">{orders.length}</p>
                <p className="text-[11px] text-brand-charcoal/50">Orders</p>
              </div>
              <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5 text-center">
                <p className="text-lg font-semibold text-brand-charcoal tabular-nums">{activeOrders}</p>
                <p className="text-[11px] text-brand-charcoal/50">Active</p>
              </div>
              <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5 text-center">
                <p className="text-lg font-semibold text-brand-charcoal tabular-nums">{cartCount}</p>
                <p className="text-[11px] text-brand-charcoal/50">In cart</p>
              </div>
            </div>
            <div className="border-t border-brand-navy/5 px-5 py-4">
              <p className="text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Delivered spend</p>
              <p className="mt-1 text-[20px] font-bold text-brand-charcoal tabular-nums">{formatINR(totalSpend, true)}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Account" icon={<ShieldCheck size={15} />} />
            <div className="space-y-1 px-3 pb-4">
              <button
                onClick={() => navigate('/retailer/orders')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-brand-charcoal/75 transition-colors hover:bg-brand-navy/5"
              >
                My Orders <ArrowUpRight size={14} className="text-brand-charcoal/30" />
              </button>
              <button
                onClick={() => navigate('/retailer/cart')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-brand-charcoal/75 transition-colors hover:bg-brand-navy/5"
              >
                My Cart <ArrowUpRight size={14} className="text-brand-charcoal/30" />
              </button>
              <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-brand-charcoal/75">
                Business Account <span className="badge bg-status-successBg text-status-success">Approved</span>
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-brand-charcoal/75">
                Net-30 terms <span className="text-[12px] text-brand-charcoal/50">enabled</span>
              </div>
            </div>
          </Card>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Switch account / Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
