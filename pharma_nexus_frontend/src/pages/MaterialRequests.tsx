import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ClipboardList, FilterX } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import DataTable, { type Column } from '../components/ui/DataTable';
import { useToast } from '../context/ToastContext';
import { type MaterialRequest } from '../data/mockData';
import { medicines } from '../data/medicines';
import { medicineIdByName } from '../data/medicineCatalog';
import {
  addMaterialRequest,
  formatRequestId,
  getMaterialRequests,
} from '../lib/materialRequestStore';
import { formatDate, cn } from '../lib/utils';

const STATUSES: Array<MaterialRequest['status']> = ['Under Review', 'Approved', 'Rejected', 'Completed'];
const PRIORITIES: Array<MaterialRequest['priority']> = ['High', 'Medium', 'Low'];
const LOCATIONS = ['Delhi', 'Mumbai', 'Chennai', 'Bengaluru', 'Hyderabad', 'Kolkata'];

interface Filters {
  requestNo: string;
  medicine: string;
  location: string;
  priority: string;
  status: string;
  requestedBy: string;
}

const emptyFilters: Filters = {
  requestNo: '',
  medicine: '',
  location: '',
  priority: '',
  status: '',
  requestedBy: '',
};

function SourceBadge({ request }: { request: MaterialRequest }) {
  if (request.source !== 'retailer') return null;
  return (
    <span
      className="rounded bg-brand-muted/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand-muted"
      title="Created automatically from a retailer order"
    >
      Retailer order
    </span>
  );
}

const columns: Column<MaterialRequest>[] = [
  {
    key: 'id',
    header: 'Request',
    render: (r) => (
      <div>
        <p className="font-medium text-brand-charcoal">{formatRequestId(r.id)}</p>
        <p className="text-xs text-brand-charcoal/45">{formatDate(r.createdAt)}</p>
      </div>
    ),
    sortValue: (r) => requestNumberFromIdSort(r),
  },
  {
    key: 'material',
    header: 'Material',
    render: (r) => (
      <div>
        <p className="flex items-center gap-2 font-medium text-brand-charcoal">
          {r.material}
          <SourceBadge request={r} />
        </p>
        {r.dosage && <p className="text-xs text-brand-charcoal/45">{r.dosage}</p>}
        <p className="text-xs text-brand-charcoal/45">{r.quantity} units</p>
      </div>
    ),
    sortValue: (r) => r.material,
  },
  {
    key: 'location',
    header: 'Location',
    render: (r) => <span className="text-brand-charcoal/70">{r.location}</span>,
    sortValue: (r) => r.location,
  },
  {
    key: 'requiredDate',
    header: 'Required by',
    render: (r) => <span className="text-brand-charcoal/70">{formatDate(r.requiredDate)}</span>,
    sortValue: (r) => r.requiredDate,
  },
  {
    key: 'priority',
    header: 'Priority',
    render: (r) => <StatusBadge status={r.priority} />,
    sortValue: (r) => r.priority,
  },
  {
    key: 'status',
    header: 'Status',
    render: (r) => <StatusBadge status={r.status} />,
    sortValue: (r) => r.status,
  },
  {
    key: 'createdBy',
    header: 'Requested by',
    render: (r) => <span className="text-brand-charcoal/70">{r.createdBy}</span>,
    sortValue: (r) => r.createdBy,
  },
];

function requestNumberFromIdSort(r: MaterialRequest): number {
  return Number(r.id.replace(/^mr-/, '')) || 0;
}

const selectClass =
  'h-[38px] rounded-lg border border-brand-navy/15 bg-white px-3 pr-7 text-[13px] text-brand-charcoal outline-none transition-colors focus:border-brand-muted focus:ring-4 focus:ring-brand-muted/10 cursor-pointer';
const textClass = 'input h-[38px] py-2';

import { useControlTower } from '../context/ControlTowerContext';
import { Truck } from 'lucide-react';

export default function MaterialRequests() {
  const { toast } = useToast();
  const { fulfillRetailer } = useControlTower();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [requests, setRequests] = useState<MaterialRequest[]>(() => getMaterialRequests());

  const [form, setForm] = useState({
    material: '',
    quantity: '',
    location: 'Delhi',
    requiredDate: '',
    priority: 'Medium',
    reason: '',
  });

  const liveColumns: Column<MaterialRequest>[] = useMemo(() => [
    ...columns,
    {
      key: 'action',
      header: 'Stock Action',
      align: 'right',
      render: (r) => {
        if (r.source === 'retailer' || r.id.startsWith('RORD-')) {
          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await fulfillRetailer(r.id);
                toast('success', 'Stock Released', `Inventory updated for order ${r.id}.`);
              }}
            >
              <Truck size={13} /> Release Stock
            </Button>
          );
        }
        return null;
      },
    },
  ], [fulfillRetailer, toast]);

  const locations = useMemo(() => Array.from(new Set([...LOCATIONS, ...requests.map((r) => r.location)])), [requests]);
  const materials = useMemo(() => Array.from(new Set(requests.map((r) => r.material))).sort(), [requests]);
  const requestedBy = useMemo(() => Array.from(new Set(requests.map((r) => r.createdBy))).sort(), [requests]);

  useEffect(() => {
    fetch('/api/retailer/orders')
      .then((res) => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const fetchedReqs: MaterialRequest[] = data.map((o) => ({
            id: o.order_id || `rord-${Date.now()}`,
            material: o.medicine_name || 'Pharma Order',
            location: o.location || 'Mumbai',
            quantity: o.quantity || 100,
            requiredDate: new Date().toISOString().slice(0, 10),
            priority: 'High',
            reason: `Retailer B2B order placed by ${o.retailer_name}`,
            status: (o.status as any) || 'Under Review',
            createdBy: o.retailer_name || 'Retailer',
            createdAt: o.created_at || new Date().toISOString(),
            source: 'retailer',
          }));
          setRequests((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const newReqs = fetchedReqs.filter((f) => !ids.has(f.id));
            return [...newReqs, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('open') === '1') {
      setForm((prev) => ({
        material: searchParams.get('material') ?? prev.material,
        quantity: searchParams.get('qty') ?? prev.quantity,
        location: searchParams.get('location') ?? prev.location,
        requiredDate: prev.requiredDate,
        priority: (searchParams.get('priority') as MaterialRequest['priority']) ?? prev.priority,
        reason: '',
      }));
      setShowForm(true);
    }
  }, [searchParams]);

  const activeCount = (Object.values(filters) as string[]).filter((v) => v !== '').length;

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filters.requestNo) {
        const q = filters.requestNo.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !formatRequestId(r.id).toLowerCase().includes(q)) return false;
      }
      if (filters.medicine && !r.material.toLowerCase().includes(filters.medicine.toLowerCase())) return false;
      if (filters.location && r.location !== filters.location) return false;
      if (filters.priority && r.priority !== filters.priority) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.requestedBy && r.createdBy !== filters.requestedBy) return false;
      return true;
    });
  }, [requests, filters]);

  const setFilter = (key: keyof Filters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () => setFilters(emptyFilters);

  const submit = () => {
    if (!form.material || !form.quantity) {
      toast('error', 'Missing fields', 'Material and quantity are required.');
      return;
    }
    const newRequest = addMaterialRequest({
      medicineId: medicineIdByName(form.material),
      material: form.material,
      location: form.location,
      quantity: Number(form.quantity),
      requiredDate: form.requiredDate || new Date().toISOString().slice(0, 10),
      priority: form.priority as MaterialRequest['priority'],
      reason: form.reason || 'Manual request from procurement team',
      status: 'Under Review',
      createdBy: 'Anita Sharma',
      createdAt: new Date().toISOString(),
      source: 'internal',
    });
    setRequests(getMaterialRequests());
    setShowForm(false);
    setForm({ material: '', quantity: '', location: 'Delhi', requiredDate: '', priority: 'Medium', reason: '' });
    toast('success', 'Request submitted', `${newRequest.quantity} units of ${newRequest.material} requested for ${newRequest.location}.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Requests"
        subtitle="Create and track material requests across your network"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> Request Material
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="All Requests"
          subtitle={`${filtered.length} request${filtered.length === 1 ? '' : 's'}${activeCount > 0 ? ` · ${activeCount} filter${activeCount === 1 ? '' : 's'} applied` : ''}`}
          icon={<ClipboardList size={15} />}
        />
        <DataTable
          key={JSON.stringify(filters)}
          columns={liveColumns}
          rows={filtered}
          rowKey={(r) => r.id}
          searchable
          searchValue={(r) => `${r.material} ${r.location} ${formatRequestId(r.id)} ${r.createdBy}`}
          searchPlaceholder="Search requests…"
          pageSize={10}
          filters={
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={filters.requestNo}
                onChange={(e) => setFilter('requestNo', e.target.value)}
                placeholder="Request no."
                aria-label="Filter by request number"
                className={cn(textClass, 'w-28')}
              />
              <input
                value={filters.medicine}
                onChange={(e) => setFilter('medicine', e.target.value)}
                placeholder="Medicine"
                aria-label="Filter by medicine"
                className={cn(textClass, 'w-36')}
                list="mr-medicine-options"
              />
              <datalist id="mr-medicine-options">
                {materials.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <select
                value={filters.location}
                onChange={(e) => setFilter('location', e.target.value)}
                aria-label="Filter by location"
                className={selectClass}
              >
                <option value="">Location · All</option>
                {locations.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilter('priority', e.target.value)}
                aria-label="Filter by priority"
                className={selectClass}
              >
                <option value="">Priority · All</option>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
                aria-label="Filter by status"
                className={selectClass}
              >
                <option value="">Status · All</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={filters.requestedBy}
                onChange={(e) => setFilter('requestedBy', e.target.value)}
                aria-label="Filter by requested by"
                className={selectClass}
              >
                <option value="">Requested by · All</option>
                {requestedBy.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FilterX size={14} /> Clear Filters
                </Button>
              )}
            </div>
          }
        />
      </Card>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Request Material"
        subtitle="Submit a new material request for review"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              <Plus size={15} /> Submit Request
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="label" htmlFor="mr-material">Material name</label>
            <input
              id="mr-material"
              className="input"
              list="mr-material-list"
              placeholder="e.g. Paracetamol"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
            />
            <datalist id="mr-material-list">
              {medicines.map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="mr-qty">Quantity</label>
            <input
              id="mr-qty"
              className="input"
              type="number"
              min="1"
              placeholder="e.g. 500"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="mr-loc">Required location</label>
            <select
              id="mr-loc"
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="mr-date">Required date</label>
            <input
              id="mr-date"
              className="input"
              type="date"
              value={form.requiredDate}
              onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="mr-priority">Priority</label>
            <select
              id="mr-priority"
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="mr-reason">Reason</label>
            <textarea
              id="mr-reason"
              className="input min-h-[84px] resize-none"
              placeholder="Why is this material needed?"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </div>
        <p className="mt-4 rounded-lg border-l-2 border-brand-muted bg-brand-muted/5 px-3 py-2.5 text-[13px] text-brand-charcoal/70">
          Requests placed by retailer stores appear automatically and are marked under review until approved.
        </p>
      </Modal>
    </div>
  );
}
