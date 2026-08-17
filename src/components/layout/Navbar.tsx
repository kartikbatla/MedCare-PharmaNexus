import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Bot, Menu, Search, ArrowRight } from 'lucide-react';
import { inventory, purchaseOrders, suppliers, invoices, notifications } from '../../data/mockData';
import { loadRetailers } from '../../data/retailers';
import { cn } from '../../lib/utils';
import { greeting } from '../../lib/utils';
import { openAIPanel } from '../../lib/aiPanel';
import { useAuth } from '../../context/AuthContext';

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: `${greeting()}, Procurement Team`,
    subtitle: `Here's what's happening across your supply chain today.`,
  },
  '/demand-inventory': { title: 'Demand & Inventory', subtitle: 'Forecast demand against live inventory levels.' },
  '/replenishment': { title: 'Smart Replenishment', subtitle: 'Replenishment plans across all locations.' },
  '/expiry': { title: 'Expiry Management', subtitle: 'FEFO-driven tracking of near-expiry inventory.' },
  '/material-requests': { title: 'Material Requests', subtitle: 'Create and track material requests across the network.' },
  '/suppliers': { title: 'Supplier Intelligence', subtitle: 'Suppliers ranked by live performance scoring.' },
  '/purchase-orders': { title: 'Purchase Orders', subtitle: 'Create, approve and track purchase orders.' },
  '/payments': { title: 'Payment Approval', subtitle: 'Review and approve supplier payments.' },
  '/ai-assistant': { title: 'Assistant', subtitle: 'Ask anything about your supply chain and P2P.' },
  '/analytics': { title: 'P2P Analytics', subtitle: 'End-to-end procure-to-pay control tower.' },
  '/simulator': { title: 'Scenario Simulator', subtitle: 'Model demand scenarios and see the impact instantly.' },
  '/notifications': { title: 'Notification Center', subtitle: 'Actionable alerts across your supply chain.' },
  '/help': { title: 'Help & Documentation', subtitle: 'Answers to common questions and contact options.' },
  '/profile': { title: 'Your Profile', subtitle: 'Account settings and preferences.' },
  '/retailers': { title: 'Retailer Management', subtitle: 'Onboard, verify and approve retailer applications.' },
  '/retailers/onboard': { title: 'Onboard New Retailer', subtitle: 'Structured verification workflow for a new retailer.' },
  '/retailers/:id': { title: 'Retailer Application', subtitle: 'Review documents, signatories and approve the application.' },
  '/migrations': { title: 'Data Migrations', subtitle: 'Migrate existing retailer data into PharmaNexus.' },
};

interface SearchResult {
  label: string;
  sublabel: string;
  to: string;
}

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const meta =
    routeMeta[location.pathname] ??
    (location.pathname.startsWith('/retailers/')
      ? location.pathname === '/retailers/onboard'
        ? routeMeta['/retailers/onboard']
        : location.pathname.endsWith('/migration')
          ? { title: 'Data Migration / ELT', subtitle: 'Understand, extract, transform and load retailer data.' }
          : routeMeta['/retailers/:id']
      : routeMeta['/']);
  const title = meta === routeMeta['/'] ? `${greeting()}, ${user?.name ?? 'Procurement Team'}` : meta.title;
  const initials = (user?.name ?? 'Procurement Team')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const results = useMemo<SearchResult[]>(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    inventory
      .filter((i) => i.medicine.toLowerCase().includes(q) || i.location.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((i) =>
        out.push({ label: i.medicine, sublabel: `${i.location} · ${i.currentStock} units in stock`, to: '/demand-inventory' }),
      );
    purchaseOrders
      .filter((p) => p.poNumber.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((p) =>
        out.push({ label: p.poNumber, sublabel: `${p.supplier} · ${p.status}`, to: '/purchase-orders' }),
      );
    suppliers
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((s) =>
        out.push({ label: s.name, sublabel: `Supplier Score ${s.aiScore}/100`, to: '/suppliers' }),
      );
    invoices
      .filter((v) => v.invoiceNumber.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((v) =>
        out.push({ label: v.invoiceNumber, sublabel: `${v.supplier} · ${v.status}`, to: '/payments' }),
      );
    loadRetailers()
      .filter((r) => r.business.tradeName.toLowerCase().includes(q) || r.business.legalName.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((r) =>
        out.push({ label: r.business.tradeName, sublabel: `${r.applicationNumber} · ${r.status}`, to: `/retailers/${r.id}` }),
      );
    return out.slice(0, 6);
  }, [query]);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-navy/8 bg-brand-warm/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-brand-charcoal/70 transition-colors hover:bg-brand-navy/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold tracking-tight text-brand-charcoal">
              {title}
            </h1>
            <p className="hidden truncate text-[13px] text-brand-charcoal/50 sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div ref={searchRef} className="relative hidden md:block">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-brand-charcoal/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              placeholder="Search medicines, POs, suppliers…"
              className="w-64 rounded-lg border border-brand-navy/12 bg-white py-2 pr-3 pl-9 text-[13px] placeholder:text-brand-charcoal/35 transition-all focus:w-72 focus:border-brand-muted focus:ring-4 focus:ring-brand-muted/10 outline-none"
            />
            {focused && results.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-[340px] overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-panel animate-fade-in-scale">
                <div className="flex items-center justify-between border-b border-brand-navy/5 px-4 py-2">
                  <p className="text-xs font-semibold text-brand-charcoal/50 uppercase tracking-wide">
                    Search results
                  </p>
                </div>
                {results.map((r, i) => (
                  <button
                    key={i}
                    onMouseDown={() => {
                      navigate(r.to);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-navy/4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-brand-charcoal">{r.label}</p>
                      <p className="truncate text-xs text-brand-charcoal/50">{r.sublabel}</p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-brand-charcoal/30" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={openAIPanel}
            className="group flex items-center gap-2 rounded-lg border border-brand-navy/12 bg-white px-3 py-2 text-[13px] font-medium text-brand-navy transition-colors hover:border-brand-muted hover:bg-brand-muted/5"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-navy text-[8px] text-white">
              <Bot size={10} />
            </span>
            <span className="hidden sm:inline">Assistant</span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="relative rounded-lg border border-brand-navy/12 bg-white p-2 text-brand-charcoal/70 transition-colors hover:border-brand-muted hover:bg-brand-muted/5"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[9.5px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/profile')}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-brand-navy/12 bg-white py-1.5 pr-3 pl-1.5 transition-colors hover:border-brand-muted hover:bg-brand-muted/5',
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-muted text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[12.5px] font-medium text-brand-charcoal">{user?.name ?? 'Procurement Team'}</span>
              <span className="block text-[11px] text-brand-charcoal/50">Procurement</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
