import { useState } from 'react';
import { PackageSearch, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Drawer from '../ui/Drawer';
import ProcurementRecommendationCard from './ProcurementRecommendationCard';
import { getProcurementRecommendations } from '../../data/procurementRecommendations';
import { useControlTower } from '../../context/ControlTowerContext';
import { medicineNameById } from '../../data/medicineCatalog';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface ProcurementRecommendationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProcurementRecommendationsDrawer({
  open,
  onClose,
}: ProcurementRecommendationsDrawerProps) {
  const { state, refreshState } = useControlTower();
  const { toast } = useToast();
  const [createdPos, setCreatedPos] = useState<Set<string>>(new Set());
  const fallbackRecs = getProcurementRecommendations();

  const liveReqs = state?.procurement_requirements || [];
  const allocations = state?.allocations || [];

  const handleCreatePO = (sku: string, plant: string, qty: number, supplier: string) => {
    const key = `${sku}_${plant}`;
    setCreatedPos((prev) => new Set(prev).add(key));
    toast('success', 'Purchase Order Generated', `Generated PO for ${qty} units of ${medicineNameById(sku)} allocated to ${supplier}.`);
    refreshState();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Real-Time PuLP Procurement Recommendations"
      subtitle={`${liveReqs.length || fallbackRecs.length} AI-optimized sourcing requirements calculated`}
      width="lg"
    >
      <div className="space-y-4">
        {liveReqs.length > 0
          ? liveReqs.map((req, idx) => {
              const key = `${req.sku_id}_${req.plant_id}`;
              const isDone = createdPos.has(key);
              const alloc = allocations.find((a) => a.sku_id === req.sku_id && a.plant_id === req.plant_id);
              const supplier = alloc?.supplier_name || 'Cipla Pharma Ltd';

              return (
                <div key={key + idx} className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="badge bg-brand-navy/10 text-brand-navy">PuLP MILP Sourcing</span>
                      <h4 className="mt-1 text-sm font-semibold text-brand-charcoal">
                        {medicineNameById(req.sku_id)} ({req.sku_id})
                      </h4>
                      <p className="text-xs text-brand-charcoal/60">Target Location: <span className="font-semibold">{req.plant_id}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-charcoal/50">Required Qty</p>
                      <p className="text-base font-bold text-brand-navy tabular-nums">{req.required_qty} units</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-brand-navy/[0.03] p-2.5 text-xs">
                    <div>
                      <p className="text-brand-charcoal/50">Allocated Supplier</p>
                      <p className="font-semibold text-brand-charcoal">{supplier}</p>
                    </div>
                    <div>
                      <p className="text-brand-charcoal/50">Optimization Criteria</p>
                      <p className="font-semibold text-status-success">Lowest Landed Cost + OTIF 98%</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    {isDone ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-status-success">
                        <CheckCircle2 size={14} /> PO Generated & Released
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleCreatePO(req.sku_id, req.plant_id, req.required_qty, supplier)}
                      >
                        <Sparkles size={13} /> Generate PO & Authorize <ArrowRight size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          : fallbackRecs.map((rec) => (
              <ProcurementRecommendationCard key={rec.id} recommendation={rec} />
            ))}
      </div>

      <p className="mt-5 flex items-center gap-1.5 rounded-lg bg-brand-muted/5 px-3 py-2.5 text-[12px] text-brand-charcoal/55">
        <PackageSearch size={13} className="shrink-0 text-brand-muted" />
        Recommendations are computed deterministically by the 8-agent FastAPI Control Tower engine from live stock levels, safety thresholds, and LightGBM demand sensing.
      </p>
    </Drawer>
  );
}
