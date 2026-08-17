import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  ClipboardList,
  CreditCard,
  Home,
  Layers,
  LifeBuoy,
  LogOut,
  Pill,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { cn } from '../../lib/utils';
import PharmaNexusLogo from '../brand/PharmaNexusLogo';
import AssistantDrawer from '../features/ai/AssistantDrawer';

const navItems = [
  { label: 'Home', to: '/retailer', icon: Home },
  { label: 'Medicines', to: '/retailer/medicines', icon: Pill },
  { label: 'Categories', to: '/retailer/categories', icon: Layers },
  { label: 'My Orders', to: '/retailer/orders', icon: ClipboardList },
  { label: 'Quick Reorder', to: '/retailer/quick-reorder', icon: RotateCcw },
  { label: 'Cart', to: '/retailer/cart', icon: ShoppingCart },
  { label: 'Payments', to: '/retailer/payments', icon: CreditCard },
  { label: 'Assistant', to: '/retailer/ai-assistant', icon: Sparkles },
  { label: 'Help & Support', to: '/retailer/help', icon: LifeBuoy },
];

export default function RetailerLayout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/retailer/medicines?q=${encodeURIComponent(query.trim())}` : '/retailer/medicines');
  };

  const initials = (user?.name ?? 'User')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navIcon =
    'relative flex h-10 w-10 items-center justify-center rounded-xl text-brand-charcoal/70 transition-colors hover:bg-brand-navy/5 hover:text-brand-navy';

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <header className="sticky top-0 z-40 border-b border-brand-navy/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
          <Link to="/retailer" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 items-center justify-center rounded-xl bg-brand-navy px-1.5 text-white">
              <PharmaNexusLogo className="h-7 w-auto" />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-brand-charcoal">PharmaNexus</span>
              <span className="block text-[11px] font-medium tracking-wide text-brand-muted uppercase">Retail Portal</span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="relative mx-auto w-full max-w-xl">
            <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-charcoal/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicine name, generic name, category or supplier..."
              className="h-10 w-full rounded-xl border border-brand-navy/10 bg-[#F7F6F3] pr-3 pl-9 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
            />
          </form>

          <nav className="flex shrink-0 items-center gap-1">
            <Link to="/retailer/notifications" className={navIcon} aria-label="Notifications">
              <Bell size={18} />
            </Link>
            <Link to="/retailer/orders" className={navIcon} aria-label="My Orders">
              <ClipboardList size={18} />
            </Link>
            <Link to="/retailer/cart" className={navIcon} aria-label="Cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link to="/retailer/profile" className={cn(navIcon, 'w-auto gap-2 px-2')} aria-label="Profile">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                {initials}
              </span>
              <span className="hidden leading-tight lg:block">
                <span className="block max-w-[120px] truncate text-[12.5px] font-semibold text-brand-charcoal">
                  {user?.name ?? 'User'}
                </span>
                <span className="block text-[10.5px] text-brand-charcoal/50">{user?.role ?? 'Store Owner'}</span>
              </span>
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className={cn(navIcon, 'ml-1')}
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </nav>
        </div>

        <nav className="mx-auto max-w-7xl px-4 pb-0 sm:px-6">
          <div className="flex gap-1 overflow-x-auto border-b border-brand-navy/5 [scrollbar-width:none]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/retailer'}
                  className={({ isActive }) =>
                    cn(
                      'flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors',
                      isActive
                        ? 'border-brand-navy text-brand-navy'
                        : 'border-transparent text-brand-charcoal/60 hover:text-brand-charcoal',
                    )
                  }
                >
                  <Icon size={15} strokeWidth={1.9} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs text-brand-charcoal/40">
          <UserRound size={12} /> PharmaNexus Retail Portal — demo experience. Medicine identity is from the PharmaNexus master
          dataset; prices and stock are indicative demo values.
        </p>
      </footer>

      <button
        onClick={() => setAssistantOpen(true)}
        aria-label="Open AI Assistant"
        title="AI Assistant"
        className="fixed right-5 bottom-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-white shadow-[0_8px_24px_rgba(15,34,58,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand-muted"
      >
        <Sparkles size={20} />
      </button>

      <AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
