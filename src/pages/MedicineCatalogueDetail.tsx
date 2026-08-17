import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Package, ShieldCheck, Truck, Warehouse } from 'lucide-react';
import { medicineById, MEDICINE_PRICE_NOTE } from '../data/medicines';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { formatINR } from '../lib/utils';

const warehouses = ['Delhi North', 'Mumbai Central', 'Bengaluru Tech Park', 'Hyderabad West', 'Kolkata East', 'Chennai South'];

function seedFrom(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function pick<T>(list: T[], seed: number, offset = 0): T {
  return list[(seed + offset) % list.length];
}

export default function MedicineCatalogueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const medicine = medicineById(id ?? '');

  if (!medicine) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-semibold text-brand-charcoal">Medicine not found</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/medicine-catalogue')}>
          Back to Catalogue
        </Button>
      </Card>
    );
  }

  const seed = seedFrom(medicine.id);
  const warehouse = pick(warehouses, seed);
  const stock = 40 + (seed % 960);
  const daysRemaining = 5 + (seed % 80);
  const stockOut = seed % 5 === 0;
  const risk: 'Low' | 'Medium' | 'High' = stock < 120 ? 'High' : stock < 260 ? 'Medium' : 'Low';
  const expiry: 'Healthy' | 'Near Expiry' | 'At Risk' = daysRemaining < 21 ? 'At Risk' : daysRemaining < 45 ? 'Near Expiry' : 'Healthy';
  const replenished = stockOut || stock < 150;
  const monthDemand = 80 + (seed % 700);

  const fields: Array<[string, string]> = [
    ['Medicine ID', medicine.id],
    ['Medicine Name', medicine.name],
    ['Generic Name', medicine.generic],
    ['Therapeutic Category', medicine.category],
    ['Dosage Form', medicine.dosageForm],
    ['Strength', medicine.strength],
    ['Pack Size', medicine.packSize],
    ['Supplier', medicine.supplier],
  ];

  const po = `${medicine.id.slice(-3)}-${1200 + (seed % 900)}`;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/medicine-catalogue')}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-muted transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={14} /> Back to Medicine Catalogue
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-brand-charcoal/50">{medicine.id} · {medicine.category}</p>
          <h1 className="mt-0.5 text-[22px] font-semibold tracking-tight text-brand-charcoal">{medicine.name}</h1>
          <p className="text-[13.5px] text-brand-charcoal/60">{medicine.generic}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-wide text-brand-charcoal/45 uppercase">Indicative Price</p>
          <p className="text-[20px] font-bold text-brand-charcoal tabular-nums">{formatINR(medicine.indicativePrice)}</p>
          <p className="text-[11px] text-brand-charcoal/45">{MEDICINE_PRICE_NOTE}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Medicine Information" subtitle="Master catalogue record" icon={<ClipboardList size={15} />} />
          <div className="grid grid-cols-1 gap-x-8 px-5 pb-5 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="border-b border-brand-navy/5 py-2.5">
                <p className="text-[11px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{label}</p>
                <p className="mt-0.5 text-[13.5px] font-medium text-brand-charcoal">{value}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-navy/5 px-5 py-3">
            <p className="text-[11.5px] text-brand-charcoal/45">
              Strength is representative of the master dataset and is not a prescribing recommendation.
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Inventory (demo)" subtitle="Simulated operational view" icon={<Package size={15} />} />
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-brand-charcoal/65">Current stock</span>
                <span className="text-[14px] font-bold text-brand-charcoal tabular-nums">{stock} packs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-brand-charcoal/65">Predicted monthly demand</span>
                <span className="text-[13.5px] font-semibold text-brand-charcoal/80 tabular-nums">{monthDemand} packs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-brand-charcoal/65">Stock-out risk</span>
                <StatusBadge status={risk} tone={risk === 'High' ? 'danger' : risk === 'Medium' ? 'warning' : 'success'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-brand-charcoal/65">Replenishment</span>
                <StatusBadge
                  status={replenished ? 'PO Suggested' : 'On Track'}
                  tone={replenished ? 'warning' : 'success'}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Supply & Warehouse (demo)" subtitle="Simulated operational view" icon={<Truck size={15} />} />
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/[0.06] text-brand-muted">
                  <Warehouse size={15} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-brand-charcoal">{warehouse}</p>
                  <p className="text-[11.5px] text-brand-charcoal/50">Primary warehouse</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-brand-charcoal/65">Days to expiry</span>
                <StatusBadge status={expiry} tone={expiry === 'At Risk' ? 'danger' : expiry === 'Near Expiry' ? 'warning' : 'success'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-brand-charcoal/65">Open purchase orders</span>
                <span className="text-[13.5px] font-semibold text-brand-charcoal/80">{replenished ? `PO-${po}` : '—'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
              <ShieldCheck size={13} /> Supplier
            </p>
            <p className="mt-1.5 text-[14px] font-semibold text-brand-charcoal">{medicine.supplier}</p>
            <p className="text-[12.5px] text-brand-charcoal/55">Approved supplier on the PharmaNexus network.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
