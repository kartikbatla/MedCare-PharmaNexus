import { useMemo, useState } from 'react';
import { FlaskConical, Calculator, Truck, ArrowRight, TrendingUp } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import SegmentControl from '../components/ui/SegmentControl';
import { useToast } from '../context/ToastContext';
import { medicineNameById } from '../data/medicineCatalog';
import { formatINR, cn } from '../lib/utils';

interface Baseline {
  medicine: string;
  location: string;
  stock: number;
  weeklyDemand: number;
  price: number;
  supplier: string;
  supplierScore: number;
  coverage: number;
}

const PARACETAMOL = medicineNameById('MED-0001');
const AMOXICILLIN = medicineNameById('MED-0011');
const DICLOFENAC = medicineNameById('MED-0004');

const baselines: Record<string, Baseline> = {
  [`${PARACETAMOL} · Delhi`]: { medicine: PARACETAMOL, location: 'Delhi', stock: 120, weeklyDemand: 300, price: 105, supplier: 'Aurobindo Pharma Limited', supplierScore: 94, coverage: 4 },
  [`${AMOXICILLIN} · Chennai`]: { medicine: AMOXICILLIN, location: 'Chennai', stock: 180, weeklyDemand: 200, price: 64, supplier: 'Themis Medicare Limited', supplierScore: 88, coverage: 7 },
  [`${DICLOFENAC} · Bengaluru`]: { medicine: DICLOFENAC, location: 'Bengaluru', stock: 95, weeklyDemand: 180, price: 58, supplier: 'Aurobindo Pharma Limited', supplierScore: 94, coverage: 5 },
};

const increments = [10, 20, 30, 50];

import { useControlTower } from '../context/ControlTowerContext';

export default function ScenarioSimulator() {
  const { simulateScenario } = useControlTower();
  const { toast } = useToast();
  const [target, setTarget] = useState(`${PARACETAMOL} · Delhi`);
  const [inc, setInc] = useState(30);
  const [horizon, setHorizon] = useState<4 | 8>(4);
  const [simResult, setSimResult] = useState<any>(null);

  const base = baselines[target];

  const handleRunOutage = async () => {
    const res = await simulateScenario('supplier_outage');
    setSimResult(res);
  };

  const handleRunFluSurge = async () => {
    const res = await simulateScenario('flu_surge');
    setSimResult(res);
  };

  const result = useMemo(() => {
    const predictedWeekly = Math.round(base.weeklyDemand * (1 + inc / 100));
    const predictedNeed = predictedWeekly * (horizon / 4);
    const currentCoverage = base.stock / base.weeklyDemand * 4;
    const shortage = Math.max(0, Math.ceil(predictedNeed - base.stock - currentCoverage * 0.25));
    const required = Math.max(0, Math.ceil(predictedNeed - base.stock));
    const cost = required * base.price;
    return { predictedWeekly, predictedNeed, shortage, required, cost, supplyDays: Math.round(base.stock / predictedWeekly * 7) };
  }, [base, inc, horizon]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenario Simulator & PuLP Stress Testing"
        subtitle="Model supply chain disruptions and run PuLP MILP optimization algorithms in real time"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleRunOutage}
            >
              <FlaskConical size={15} /> Simulate Supplier Outage
            </Button>
            <Button
              variant="primary"
              onClick={handleRunFluSurge}
            >
              <TrendingUp size={15} /> Simulate Flu Surge (+50%)
            </Button>
          </div>
        }
      />

      {simResult && (
        <Card className="p-4 border-l-4 border-l-status-warning bg-status-warningBg/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brand-charcoal">{simResult.scenario_name}</h3>
              <p className="text-xs text-brand-charcoal/70 mt-0.5">{simResult.summary}</p>
            </div>
            {simResult.cost_increase_inr && (
              <span className="text-sm font-semibold text-status-danger">
                +₹{simResult.cost_increase_inr.toLocaleString()} Landed Cost Increase
              </span>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Scenario Parameters" subtitle="Adjust the inputs to model impact" icon={<FlaskConical size={15} />} />
          <div className="space-y-5 px-5 pb-5">
            <div>
              <label className="label">Item & location</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.keys(baselines).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTarget(k)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors',
                      target === k
                        ? 'border-brand-muted bg-brand-muted/5 font-medium text-brand-navy'
                        : 'border-brand-navy/10 hover:border-brand-muted/40 text-brand-charcoal/75',
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Demand increase</label>
              <SegmentControl
                options={increments.map((i) => ({ id: String(i), label: `+${i}%` }))}
                value={String(inc)}
                onChange={(v) => setInc(Number(v))}
              />
            </div>

            <div>
              <label className="label">Forecast horizon</label>
              <SegmentControl
                options={[
                  { id: '4', label: '4 weeks' },
                  { id: '8', label: '8 weeks' },
                ]}
                value={String(horizon)}
                onChange={(v) => setHorizon(Number(v) as 4 | 8)}
              />
            </div>

            <div className="rounded-lg bg-brand-navy/[0.03] p-3.5">
              <p className="text-[11px] text-brand-charcoal/50">Baseline</p>
              <p className="mt-0.5 text-[13px] text-brand-charcoal/80">
                {base.medicine} · {base.location} — {base.stock} units in stock, {base.weeklyDemand} weekly demand,{' '}
                {base.coverage} days cover.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 bg-brand-navy px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
                  <TrendingUp size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    If demand increases by <span className="text-white">{inc}%</span>…
                  </p>
                  <p className="text-[13px] text-white/60">
                    {base.medicine} · {base.location} · {horizon}-week horizon
                  </p>
                </div>
              </div>
              <span className="badge bg-white/10 text-white">Model complete · 0.8s</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              {[
                ['Predicted weekly demand', `${result.predictedWeekly} units`],
                ['Projected requirement', `${result.predictedNeed} units`],
                ['Supply days at new rate', `${result.supplyDays} days`],
                ['Expected shortage', `${result.required} units`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-brand-navy/8 bg-brand-navy/[0.02] px-3 py-3">
                  <p className="text-[11px] leading-tight text-brand-charcoal/50">{k}</p>
                  <p className="mt-1 text-lg font-semibold text-brand-charcoal tabular-nums">{v}</p>
                </div>
              ))}
            </div>

            <div className="mx-5 mb-5 rounded-xl border border-status-warning/25 bg-status-warningBg/40 p-4">
              <p className="text-[13.5px] leading-relaxed text-brand-charcoal/80">
                <span className="font-semibold text-status-warning">Impact:</span> at a {inc}% demand increase,{' '}
                {base.location} will require <span className="font-semibold text-brand-charcoal">{result.required} additional units</span>{' '}
                over {horizon} weeks. Estimated procurement cost{' '}
                <span className="font-semibold text-brand-charcoal tabular-nums">{formatINR(result.cost)}</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-brand-navy/8 bg-brand-navy/[0.02] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-successBg text-status-success">
                  <Truck size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-charcoal">Recommended: purchase {result.required} units</p>
                  <p className="text-[13px] text-brand-charcoal/55">
                    from {base.supplier} · Supplier Score {base.supplierScore}/100 · {formatINR(base.price)}/unit
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => toast('info', 'Recommendation detail', `${base.supplier} recommended — 5-day delivery, 98% quality, 96% on-time.`)}
                >
                  <Calculator size={14} /> View Math
                </Button>
                <Button
                  onClick={() => toast('success', 'Action created', `${result.required} units of ${base.medicine} queued as a material request for ${base.location}.`)}
                >
                  Create Request <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: 'Demand stress', value: `+${inc}%`, sub: 'Q3 seasonal peak scenario' },
              { title: 'Coverage after action', value: `${Math.round(base.stock / result.predictedWeekly * 7)} days`, sub: 'With recommended procurement' },
              { title: 'Stock-out avoided', value: `${result.required} units`, sub: 'If scenario materializes' },
            ].map((s) => (
              <div key={s.title} className="card p-4">
                <p className="text-xs text-brand-charcoal/50">{s.title}</p>
                <p className="mt-1 text-xl font-semibold text-brand-charcoal tabular-nums">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-brand-charcoal/45">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
