import { NavLink, useNavigate } from 'react-router-dom';
import { openAIPanel } from '../../lib/aiPanel';
import {
  LayoutDashboard,
  PackageSearch,
  RefreshCcw,
  CalendarClock,
  ClipboardList,
  Truck,
  FileText,
  CreditCard,
  Bot,
  BarChart3,
  Bell,
  LifeBuoy,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import PharmaNexusLogo from '../brand/PharmaNexusLogo';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Demand & Inventory',
    items: [
      { label: 'Demand Sensing & Inventory', to: '/demand-inventory', icon: PackageSearch },
      { label: 'Expiry-Aware Replenishment', to: '/replenishment', icon: RefreshCcw },
      { label: 'Expiry Management', to: '/expiry', icon: CalendarClock },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { label: 'Material Requests', to: '/material-requests', icon: ClipboardList, badge: 2 },
      { label: 'Suppliers', to: '/suppliers', icon: Truck },
      { label: 'Purchase Orders', to: '/purchase-orders', icon: FileText, badge: 4 },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payment Approval', to: '/payments', icon: CreditCard, badge: 3 },
    ],
  },
  {
    title: 'Retailer Management',
    items: [{ label: 'Retailers', to: '/retailers', icon: Store, badge: 3 }],
  },
  {
    title: 'Analytics',
    items: [{ label: 'P2P Analytics', to: '/analytics', icon: BarChart3 }],
  },
  {
    title: 'Automation',
    items: [{ label: 'Assistant', to: '/ai-assistant', icon: Bot }],
  },
];

const bottomItems: NavItem[] = [
  { label: 'Notifications', to: '/notifications', icon: Bell, badge: 3 },
  { label: 'Help', to: '/help', icon: LifeBuoy },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/10 mb-2">
      <PharmaNexusLogo className="h-9 w-auto" />
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-white">Pharma<span className="text-brand-muted">Nexus</span></p>
        <p className="text-[10px] font-semibold tracking-wider text-white/50 uppercase">
          Control Tower
        </p>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <Brand />

      <div className="mt-1 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-white/35 uppercase">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) =>
                item.to === '/ai-assistant' ? (
                  <button
                    key={item.to}
                    onClick={() => {
                      onNavigate?.();
                      openAIPanel();
                    }}
                    className="sidebar-item w-full text-white/70 hover:bg-white/[0.07] hover:text-white"
                  >
                    <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-px text-[10.5px] font-semibold text-white/70">
                      ✨
                    </span>
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'sidebar-item text-white/70 hover:bg-white/[0.07] hover:text-white',
                        isActive &&
                          'bg-white/[0.12] text-white shadow-[inset_2px_0_0_0_#8FA3C8]',
                      )
                    }
                  >
                    <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="rounded-full bg-status-warning px-1.5 py-px text-[10.5px] font-semibold text-white tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ),
              )}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.08] px-3 py-3">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'sidebar-item text-white/70 hover:bg-white/[0.07] hover:text-white',
                isActive && 'bg-white/[0.12] text-white shadow-[inset_2px_0_0_0_#8FA3C8]',
              )
            }
          >
            <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span className="rounded-full bg-status-warning px-1.5 py-px text-[10.5px] font-semibold text-white tabular-nums">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="mx-2 mb-2 mt-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2">
          <p className="text-[10.5px] font-semibold tracking-wide text-white/70 uppercase">Demo environment</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/45">
            Supply-chain values are simulated for the demo.
          </p>
        </div>

        <button
          onClick={() => {
            onNavigate?.();
            navigate('/profile');
          }}
          className="sidebar-item mt-1 text-white/70 hover:bg-white/[0.07] hover:text-white"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-muted text-[11px] font-semibold text-white">
            AS
          </span>
          <span className="flex-1 leading-tight">
            <span className="block">Anita Sharma</span>
            <span className="block text-[11px] font-normal text-white/45">
              Procurement Manager
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] bg-brand-navy lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-brand-navy/50 backdrop-blur-[2px] animate-fade-in"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-[270px] bg-brand-navy shadow-panel animate-fade-in-scale">
            <button
              onClick={onClose}
              className="absolute top-5 right-3 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
