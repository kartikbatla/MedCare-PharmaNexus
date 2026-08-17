import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  ClipboardList,
  Info,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import { Card, CardHeader } from '../components/ui/Card';
import { alerts, inventory } from '../data/mockData';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import ProcurementRecommendationsDrawer from '../components/features/ProcurementRecommendationsDrawer';
import { getProcurementRecommendations } from '../data/procurementRecommendations';
import { openAIPanel } from '../lib/aiPanel';
import { getMaterialRequests } from '../lib/materialRequestStore';
import { cn } from '../lib/utils';

const severityMeta: Record<'critical' | 'warning' | 'info', { icon: LucideIcon; tile: string; badge: string }> = {
  critical: { icon: AlertOctagon, tile: 'bg-status-dangerBg text-status-danger', badge: 'Critical' },
  warning: { icon: AlertTriangle, tile: 'bg-status-warningBg text-status-warning', badge: 'Attention' },
  info: { icon: Info, tile: 'bg-status-infoBg text-brand-muted', badge: 'Info' },
};

const severityRank = { critical: 0, warning: 1, info: 2 } as const;

const criticalCases = [...alerts].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 2);

import { useControlTower } from '../context/ControlTowerContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recsOpen, setRecsOpen] = useState(false);
  const { state } = useControlTower();
  const recommendations = getProcurementRecommendations();
  const pendingRequests = getMaterialRequests().filter((r) => r.status === 'Under Review').length;

  const liveRecsCount = state?.procurement_requirements?.length ?? recommendations.length;

  const dynamicCriticalCases = useMemo(() => {
    if (!state?.inventory) return criticalCases;
    const lowStockItems = state.inventory.filter((inv) => inv.closing_stock < inv.safety_stock);
    if (lowStockItems.length === 0) return [];
    return lowStockItems.map((inv, i) => ({
      id: `alt-dyn-${i}`,
      title: `Stock-Out Risk: ${inv.sku_id} at ${inv.plant_id}`,
      description: `Closing stock is ${inv.closing_stock} units, below safety threshold of ${inv.safety_stock} units. Automated PuLP sourcing active.`,
      severity: 'critical' as const,
      link: '/demand-inventory',
      meta: [
        { label: 'Location', value: inv.plant_id },
        { label: 'Current Stock', value: `${inv.closing_stock} units` },
        { label: 'Safety Stock', value: `${inv.safety_stock} units` },
      ],
    }));
  }, [state]);

  const kpis = state?.kpis || {
    demand_alerts: 21,
    low_stock: 3,
    near_expiry: 3,
    pos_pending_approval: 1,
    pos_released: 5,
    invoices_processing: 5,
    anomalies_detected: 1,
    capital_protected_inr: 142500,
    total_working_capital_ap: 845200,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Overview"
        subtitle="Here's what needs your attention across the supply chain today."
        action={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/material-requests')}>
              <ClipboardList size={15} /> Request Material
            </Button>
            <Button size="sm" onClick={openAIPanel}>
              <Sparkles size={15} /> Ask Assistant
            </Button>
          </>
        }
      />

      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <KPICard
            label="Demand Alerts"
            value={String(kpis.demand_alerts)}
            change={`${kpis.demand_alerts} active signals`}
            trend="up"
            trendTone="danger"
            icon="alert"
            hint="Sensed from flu ILI & kaggle sales"
          />
          <KPICard
            label="Stock Out Risk"
            value={String(kpis.low_stock)}
            change={kpis.low_stock === 0 ? 'All stocks healthy' : `${kpis.low_stock} SKUs critical`}
            trend={kpis.low_stock === 0 ? 'down' : 'up'}
            trendTone={kpis.low_stock === 0 ? 'success' : 'danger'}
            icon="alert"
            hint="Stock cover < 15 days"
          />
          <KPICard
            label="Near Expiry"
            value={String(kpis.near_expiry)}
            change={`${kpis.near_expiry} batches flag`}
            trend="neutral"
            trendTone="neutral"
            icon="box"
            hint="Eligible for inter-plant transfer"
          />
          <KPICard
            label="Pending Requests"
            value={String(pendingRequests)}
            change={`${pendingRequests} in review`}
            trend="neutral"
            trendTone="neutral"
            icon="clipboard"
            hint="Material requisitions"
          />
          <KPICard
            label="Capital Protected"
            value={`₹${(kpis.capital_protected_inr / 1000).toFixed(1)}k`}
            change="3-Way Match Protection"
            trend="up"
            trendTone="success"
            icon="file"
            hint="Fraud & over-invoice saved"
          />
          <KPICard
            label="AP Working Capital"
            value={`₹${(kpis.total_working_capital_ap / 1000).toFixed(1)}k`}
            change={`${kpis.pos_released} Released POs`}
            trend="neutral"
            trendTone="neutral"
            icon="wallet"
            hint="Accounts Payable committed"
            to="/purchase-orders"
          />
        </div>
      </section>

      <section aria-label="Procurement recommendations" className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Procurement Recommendations"
              subtitle={`${liveRecsCount} recommendations generated by PuLP MILP solver require attention`}
              icon={<Sparkles size={15} />}
              action={
                <Button size="sm" onClick={() => setRecsOpen(true)}>
                  View Recommendations <ArrowRight size={14} />
                </Button>
              }
            />
          </Card>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Critical Cases</h2>
                <p className="mt-0.5 text-[13px] text-brand-charcoal/55">Items that require immediate attention</p>
              </div>
              <Link
                to="/notifications"
                className="flex items-center gap-1 text-[13px] font-medium text-brand-muted hover:text-brand-navy"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dynamicCriticalCases.length === 0 ? (
                <div className="col-span-2 card p-5 border-l-4 border-l-status-success bg-status-successBg/20 flex items-center gap-3">
                  <Sparkles className="text-status-success shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-brand-charcoal">All Critical Inventory Cases Resolved</h4>
                    <p className="text-xs text-brand-charcoal/60">No low-stock items detected. Sourcing, demand fulfillment, and plant stocks are optimal.</p>
                  </div>
                </div>
              ) : (
                dynamicCriticalCases.map((alert) => {
                  const meta = severityMeta[alert.severity];
                  const Icon = meta.icon;
                  return (
                    <div key={alert.id} className="card flex flex-col p-4">
                      <span className={cn('badge self-start', meta.tile)}>
                        <Icon size={12} /> {meta.badge}
                      </span>
                      <h3 className="mt-2.5 text-[14px] font-semibold text-brand-charcoal">Stock-Out Risk</h3>
                      <p className="mt-0.5 text-[13px] font-medium text-brand-charcoal/85">{alert.title}</p>
                      <p className="mt-1 text-[12.5px] leading-snug text-brand-charcoal/55">{alert.description}</p>
                      <dl className="mt-3 grid grid-cols-1 gap-1.5 rounded-lg bg-brand-navy/[0.03] px-3 py-2.5">
                        {alert.meta.map((m) => (
                          <div key={m.label} className="flex items-baseline justify-between gap-2">
                            <dt className="text-[11px] text-brand-charcoal/50">{m.label}</dt>
                            <dd className="text-[12px] font-medium text-brand-charcoal tabular-nums">{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-auto w-full"
                        onClick={() => navigate(alert.link)}
                      >
                        Review <ArrowRight size={13} />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="h-fit">
            <CardHeader
              title="Inventory Summary"
              subtitle="Stock position across warehouses"
              icon={<Boxes size={15} />}
              action={
                <Link to="/demand-inventory" className="flex items-center gap-1 text-[13px] font-medium text-brand-muted hover:text-brand-navy">
                  View all <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="px-3 pb-3">
              {inventory.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate('/demand-inventory')}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-brand-navy/[0.03]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-brand-charcoal">{item.medicine}</span>
                    <span className="block text-[12px] text-brand-charcoal/50">{item.location}</span>
                  </span>
                  <span className="w-12 shrink-0 text-right text-[13px] font-semibold text-brand-charcoal tabular-nums">
                    {item.currentStock}
                  </span>
                  <StatusBadge status={item.status} className="w-20 shrink-0 justify-end" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <ProcurementRecommendationsDrawer open={recsOpen} onClose={() => setRecsOpen(false)} />
    </div>
  );
}
