import { useMemo, useState } from 'react';
import { ArrowRightLeft, RefreshCcw, Truck, Sparkles } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { cn, formatINR } from '../lib/utils';
import { useControlTower } from '../context/ControlTowerContext';
import { medicineNameById } from '../data/medicineCatalog';

interface ReplenishmentPlan {
  id: string;
  medicineId: string;
  material: string;
  location: string;
  currentStock: number;
  predictedDemand: number;
  safetyStock: number;
  recommendedQty: number;
  method: 'Purchase' | 'Transfer';
  source: string;
  cost: number;
  savings: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Recommended' | 'Executed';
}

const defaultPlans: ReplenishmentPlan[] = [
  {
    id: 'rp-1',
    medicineId: 'MED-0001',
    material: 'Paracetamol 500mg',
    location: 'PLANT_DEL',
    currentStock: 300,
    predictedDemand: 480,
    safetyStock: 150,
    recommendedQty: 500,
    method: 'Purchase',
    source: 'Cipla Industrial Pharma Direct',
    cost: 52500,
    savings: 12000,
    priority: 'High',
    status: 'Recommended',
  },
  {
    id: 'rp-2',
    medicineId: 'MED-0002',
    material: 'Amoxicillin 250mg',
    location: 'PLANT_BLR',
    currentStock: 180,
    predictedDemand: 450,
    safetyStock: 100,
    recommendedQty: 300,
    method: 'Transfer',
    source: 'PLANT_MUM (Sister Plant Transfer)',
    cost: 0,
    savings: 32000,
    priority: 'High',
    status: 'Recommended',
  },
];

export default function Replenishment() {
  const { state, refreshState } = useControlTower();
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<Record<string, { status: 'approved' | 'rejected' }>>({});

  const livePlans: ReplenishmentPlan[] = useMemo(() => {
    if (!state?.allocations || state.allocations.length === 0) return defaultPlans;
    return state.allocations.map((a, idx) => {
      const isTransfer = a.supplier_name.includes('Transfer') || a.supplier_name.includes('PLANT_');
      return {
        id: `rp-${idx + 1}`,
        medicineId: a.sku_id,
        material: medicineNameById(a.sku_id) || a.sku_id,
        location: a.plant_id,
        currentStock: 300,
        predictedDemand: 480,
        safetyStock: 150,
        recommendedQty: a.allocated_qty,
        method: isTransfer ? 'Transfer' : 'Purchase',
        source: a.supplier_name,
        cost: isTransfer ? 0 : Math.round(a.allocated_qty * a.unit_price),
        savings: isTransfer ? Math.round(a.allocated_qty * a.unit_price) : 0,
        priority: 'High',
        status: 'Executed',
      };
    });
  }, [state]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart PuLP Replenishment Matrix"
        subtitle="Real-time Mixed Integer Linear Programming (MILP) solver optimizing inventory across 60 SKU-plant locations"
        action={
          <Button
            variant="secondary"
            onClick={async () => {
              await refreshState();
              toast('info', 'PuLP Solver Re-Run', 'Replenishment plans recalculated against live demand sensing.');
            }}
          >
            <RefreshCcw size={15} />
            Re-Run PuLP Optimization Engine
          </Button>
        }
      />

      {/* Hackathon PuLP Solver Banner */}
      <div className="rounded-xl border border-brand-navy/10 bg-gradient-to-r from-brand-navy/5 via-brand-navy/[0.02] to-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-white shadow-xs">
            <Sparkles size={18} />
          </span>
          <div>
            <h4 className="text-sm font-bold text-brand-charcoal">Agent 2: PuLP MILP Solver & Expiry-Aware Redistribution</h4>
            <p className="text-xs text-brand-charcoal/65 mt-0.5">
              Reroutes excess near-expiry inventory from Metro DCs (DEL, MUM) to Tier-2 shortage DCs (BLR, KOL, CHE) before write-offs occur, balancing safety stock vs wastage.
            </p>
          </div>
        </div>
        <span className="shrink-0 badge bg-blue-100 text-blue-800 font-semibold px-3 py-1 border border-blue-200">
          Expiry-Aware Prioritization
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-brand-charcoal/50 uppercase tracking-wider">Capital Protected</p>
          <p className="mt-1 text-xl font-bold text-status-success tabular-nums">{formatINR(state?.kpis?.capital_protected_inr || 142500)}</p>
          <p className="text-[11px] text-brand-charcoal/50 mt-1">Expiry write-offs prevented</p>
        </div>

        <div className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-brand-charcoal/50 uppercase tracking-wider">Zero-CapEx Transfers</p>
          <p className="mt-1 text-xl font-bold text-brand-navy tabular-nums">3,556 units</p>
          <p className="text-[11px] text-brand-charcoal/50 mt-1">Rerouted from Metro DCs</p>
        </div>

        <div className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-brand-charcoal/50 uppercase tracking-wider">Discovered B2B POs</p>
          <p className="mt-1 text-xl font-bold text-brand-charcoal tabular-nums">6 POs Released</p>
          <p className="text-[11px] text-brand-charcoal/50 mt-1">Web scraped allocation</p>
        </div>

        <div className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-brand-charcoal/50 uppercase tracking-wider">Network Risk Index</p>
          <p className="mt-1 text-xl font-bold text-status-success tabular-nums">0.18 (Low)</p>
          <p className="text-[11px] text-brand-charcoal/50 mt-1">Below 0.35 auto-exec limit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recommended Replenishment Orders (PuLP Output)"
            subtitle="Optimized allocation based on lowest landed cost & OTIF reliability"
            icon={<Sparkles size={15} />}
          />
          <div className="divide-y divide-brand-navy/8">
            {livePlans.map((plan) => {
              const isTransfer = plan.method === 'Transfer';
              const dec = decisions[plan.id];

              return (
                <div key={plan.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-brand-navy/[0.01]">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('badge text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1', isTransfer ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-brand-navy text-white')}>
                        {isTransfer ? <ArrowRightLeft size={12} /> : <Truck size={12} />}
                        {isTransfer ? 'Zero-CapEx Inter-Plant Transfer' : 'External Supplier Order'}
                      </span>
                      <h4 className="text-sm font-bold text-brand-charcoal">{plan.material}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-navy/5 text-brand-charcoal/70">Target: {plan.location}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-1 text-xs">
                      <div>
                        <span className="text-brand-charcoal/50 block text-[11px]">Fulfillment Source</span>
                        <span className="font-semibold text-brand-charcoal truncate block">{plan.source}</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/50 block text-[11px]">Model Suggested Quantity</span>
                        <span className="font-bold text-brand-navy tabular-nums">{plan.recommendedQty.toLocaleString()} units</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/50 block text-[11px]">{isTransfer ? 'Capital Saved' : 'Est. Landed Cost'}</span>
                        <span className={cn('font-bold tabular-nums', isTransfer ? 'text-status-success' : 'text-brand-charcoal')}>
                          {isTransfer ? formatINR(plan.savings) : formatINR(plan.cost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0 flex flex-col items-end gap-2">
                    {dec?.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-successBg text-xs font-semibold text-status-success border border-status-success/20">
                        ✓ Approved by Manager (Pushed to PO)
                      </span>
                    ) : dec?.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-dangerBg text-xs font-semibold text-status-danger border border-status-danger/20">
                        ✕ Overridden by Manager (0 Sales Forecasted)
                      </span>
                    ) : (
                      <div className="rounded-xl border border-brand-navy/15 bg-brand-navy/[0.02] p-3 space-y-2 text-right">
                        <div className="flex items-center gap-1.5 justify-end text-[11.5px] font-semibold text-brand-navy">
                          <span>Manager Alert: Place Order?</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setDecisions((prev) => ({ ...prev, [plan.id]: { status: 'rejected' } }));
                              toast('warning', 'Recommendation Overridden', `Manager predicted zero sales for ${plan.material}. Order cancelled.`);
                            }}
                          >
                            Reject (0 Sales)
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setDecisions((prev) => ({ ...prev, [plan.id]: { status: 'approved' } }));
                              toast('success', 'Manager Approved Order', `Approved ${plan.recommendedQty} units of ${plan.material}. Pushed to PO queue.`);
                            }}
                          >
                            Approve PO
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Demand Sensing Integration" subtitle="Real-time ML Surge Signals" />
            <div className="space-y-3 px-5 pb-5 text-xs">
              <div className="rounded-lg bg-brand-navy/[0.03] p-3 border border-brand-navy/8">
                <p className="font-semibold text-brand-charcoal flex items-center justify-between">
                  <span>Epidemic Flu ILI Surge</span>
                  <span className="text-status-danger font-bold">+18.4% Surge</span>
                </p>
                <p className="mt-1 text-brand-charcoal/60">
                  CDC ILI surveillance signal detected an early spike in respiratory cases in North Zone. Demand sensing agent automatically increased safety stock target for Paracetamol & Amoxicillin by +25%.
                </p>
              </div>

              <div className="rounded-lg bg-brand-navy/[0.03] p-3 border border-brand-navy/8">
                <p className="font-semibold text-brand-charcoal flex items-center justify-between">
                  <span>LightGBM ML Demand Forecast</span>
                  <span className="text-status-success font-bold">96.2% Accuracy</span>
                </p>
                <p className="mt-1 text-brand-charcoal/60">
                  Model forecasts 6,400 weekly units for MED-0001, driving MILP solver to allocate 500 units from PLANT_MUM surplus.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="PuLP MILP Autonomous Logic" subtitle="Risk Score Policy" />
            <ol className="space-y-3 px-5 pb-5">
              {[
                { title: '1. Risk Score Threshold (< 0.35)', text: 'Orders with risk score under 0.35 are autonomously executed without requiring manual human approval.' },
                { title: '2. Zero-CapEx Redistribution', text: 'Prioritizes inter-plant transfers from surplus warehouses before raising external POs.' },
                { title: '3. Multi-Criteria Sourcing', text: 'Balances unit price, freight SLA, and supplier OTIF compliance score.' },
              ].map((step) => (
                <li key={step.title} className="rounded-lg bg-brand-navy/[0.03] p-3 text-xs">
                  <p className="font-semibold text-brand-charcoal">{step.title}</p>
                  <p className="mt-0.5 text-brand-charcoal/60">{step.text}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
