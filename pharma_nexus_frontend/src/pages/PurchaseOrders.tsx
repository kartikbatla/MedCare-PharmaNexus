import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  PackageCheck,
  ReceiptText,
  FileText,
  Building,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import DataTable, { type Column } from '../components/ui/DataTable';
import Tabs from '../components/ui/Tabs';
import { useToast } from '../context/ToastContext';
import {
  purchaseOrders,
  suppliers,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../data/mockData';
import { medicineIdByName } from '../data/medicineCatalog';
import { formatINR, formatDate, cn } from '../lib/utils';
import { useControlTower } from '../context/ControlTowerContext';

type PoTab = 'All' | PurchaseOrderStatus;

const TAB_IDS: PoTab[] = ['All', 'Draft', 'Approved', 'Partially Fulfilled', 'Fully Fulfilled', 'Cancelled'];

export default function PurchaseOrders() {
  const { state, deliverPO, exportToSAP, approvePO } = useControlTower();
  const { toast } = useToast();
  const [tab, setTab] = useState<PoTab>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [aiPrefill, setAiPrefill] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedPrefill = useRef(false);

  const [form, setForm] = useState({
    supplier: suppliers[0].name,
    material: '',
    quantity: '',
    location: 'Delhi',
    unitPrice: '',
    expectedDelivery: '',
  });

  const liveOrders: PurchaseOrder[] = useMemo(() => {
    if (!state?.purchase_orders) return purchaseOrders;
    return state.purchase_orders.map((p) => {
      let status: PurchaseOrderStatus = 'Approved';
      if (p.po_status === 'Fulfilled & Delivered') status = 'Fully Fulfilled';
      else if (p.po_status === 'Pending Approval') status = 'Draft';
      else if (p.po_status === 'Cancelled') status = 'Cancelled';

      return {
        id: p.po_id,
        poNumber: p.po_id,
        supplier: p.supplier_name,
        medicineId: p.sku_id,
        material: p.sku_id,
        location: p.plant_id,
        quantity: p.po_qty,
        receivedQty: p.po_status === 'Fulfilled & Delivered' ? p.po_qty : 0,
        unitPrice: p.po_unit_price,
        totalAmount: p.po_qty * p.po_unit_price,
        expectedDelivery: '2026-08-20',
        status,
        createdAt: '2026-08-15',
        aiRecommended: true,
      };
    });
  }, [state]);

  const [rows, setRows] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    setRows(liveOrders);
  }, [liveOrders]);

  useEffect(() => {
    if (!appliedPrefill.current && searchParams.get('open') === '1') {
      appliedPrefill.current = true;
      const supplierName = searchParams.get('supplier') ?? suppliers[0].name;
      const supplier = suppliers.find((s) => s.name === supplierName) ?? suppliers[0];
      const material = searchParams.get('material') ?? '';
      const qty = searchParams.get('qty');
      const location = searchParams.get('location') ?? 'Delhi';
      const ai = searchParams.get('ai') === '1';

      const delivery = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

      setForm({
        supplier: supplier.name,
        material,
        quantity: qty ?? '',
        location,
        unitPrice: supplier.price != null ? String(supplier.price) : '',
        expectedDelivery: delivery,
      });
      setAiPrefill(ai);
      setShowCreate(true);
    }

    const status = searchParams.get('status');
    if (status && (TAB_IDS as readonly string[]).includes(status)) {
      setTab(status as PoTab);
    }

    if (searchParams.get('open') === '1' || searchParams.get('status')) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleApprovePo = async (po: PurchaseOrder) => {
    await approvePO(po.poNumber);
  };

  const handleDeliverPo = async (po: PurchaseOrder) => {
    await deliverPO(po.poNumber);
  };

  const handleExportSAP = async (po: PurchaseOrder) => {
    await exportToSAP(po.poNumber);
  };

  const openTaxInvoice = (po: PurchaseOrder) => {
    window.open(`/api/invoice/${po.poNumber}`, '_blank');
  };

  const openSupplierInvoice = (po: PurchaseOrder) => {
    window.open(`/api/supplier-invoice/${po.poNumber}`, '_blank');
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      render: (r) => (
        <div>
          <p className="font-semibold text-brand-charcoal">{r.poNumber}</p>
          <p className="text-xs text-brand-charcoal/45">{formatDate(r.createdAt)}</p>
        </div>
      ),
      sortValue: (r) => r.poNumber,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (r) => (
        <div>
          <p className="text-brand-charcoal/80 font-medium">{r.supplier}</p>
          {r.aiRecommended && <span className="text-[11px] font-medium text-brand-muted">AI MILP Sourced</span>}
        </div>
      ),
      sortValue: (r) => r.supplier,
    },
    {
      key: 'material',
      header: 'Material / Plant',
      render: (r) => (
        <div>
          <p className="text-brand-charcoal/80">{r.material}</p>
          <p className="text-xs text-brand-charcoal/45">{r.location}</p>
        </div>
      ),
      sortValue: (r) => r.material,
    },
    {
      key: 'quantity',
      header: 'Ordered',
      align: 'right',
      render: (r) => <span className="tabular-nums font-medium">{r.quantity.toLocaleString()}</span>,
      sortValue: (r) => r.quantity,
    },
    {
      key: 'receivedQty',
      header: 'Received',
      align: 'right',
      render: (r) => (
        <span className={cn('tabular-nums font-semibold', (r.receivedQty ?? 0) > 0 ? 'text-status-success' : 'text-brand-charcoal/35')}>
          {r.receivedQty ? r.receivedQty.toLocaleString() : '0'}
        </span>
      ),
      sortValue: (r) => r.receivedQty ?? 0,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums text-brand-charcoal">{formatINR(r.totalAmount)}</span>,
      sortValue: (r) => r.totalAmount,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
    },
    {
      key: 'deliveryStatus',
      header: 'Delivery Status',
      render: (r) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded-full',
            r.status === 'Fully Fulfilled' || (r.receivedQty ?? 0) >= r.quantity
              ? 'bg-status-successBg text-status-success border border-status-success/20'
              : 'bg-status-warningBg text-status-warning border border-status-warning/20',
          )}
        >
          {r.status === 'Fully Fulfilled' || (r.receivedQty ?? 0) >= r.quantity ? (
            <>
              <CheckCircle2 size={12} /> Delivered
            </>
          ) : (
            'In Transit'
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions & Invoices',
      align: 'right',
      render: (r) => (
        <div className="flex flex-wrap items-center justify-end gap-1">
          {r.status !== 'Fully Fulfilled' && (
            <Button variant="primary" size="sm" onClick={() => handleDeliverPo(r)}>
              <PackageCheck size={13} /> Deliver Goods
            </Button>
          )}
          {r.status === 'Draft' && (
            <Button variant="secondary" size="sm" onClick={() => handleApprovePo(r)}>
              <CheckCircle2 size={13} /> Approve
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => openTaxInvoice(r)} title="Official MedCare Commercial Tax Invoice">
            <FileText size={13} /> Tax Invoice
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openSupplierInvoice(r)} title="Raw Supplier Bill (OCR Exception Check)">
            <ReceiptText size={13} /> Supplier Bill (OCR)
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleExportSAP(r)} title="Post SAP S/4HANA IDoc">
            <Building size={13} /> SAP ERP
          </Button>
        </div>
      ),
    },
  ];

  const filtered = useMemo(() => {
    if (tab === 'All') return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const submit = () => {
    if (!form.material || !form.quantity || !form.unitPrice) {
      toast('error', 'Missing fields', 'Material, quantity and unit price are required.');
      return;
    }
    const qty = Number(form.quantity);
    const price = Number(form.unitPrice);
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier: form.supplier,
      medicineId: medicineIdByName(form.material),
      material: form.material,
      location: form.location,
      quantity: qty,
      unitPrice: price,
      totalAmount: qty * price,
      expectedDelivery: form.expectedDelivery || new Date().toISOString().slice(0, 10),
      status: 'Approved',
      createdAt: new Date().toISOString(),
      aiRecommended: aiPrefill,
    };
    setRows((prev) => [po, ...prev]);
    setShowCreate(false);
    setAiPrefill(false);
    setForm({ supplier: suppliers[0].name, material: '', quantity: '', location: 'Delhi', unitPrice: '', expectedDelivery: '' });
    toast('success', `PO ${po.poNumber} created`, `${po.material} · ${po.quantity} units · ${formatINR(po.totalAmount)} from ${po.supplier}.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders & 3-Way Match Audit"
        subtitle="Manage orders, deliver shipments, view commercial tax invoices, and inspect raw OCR supplier bills"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create PO
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Active Purchase Orders</h3>
            <p className="mt-0.5 text-[13px] text-brand-charcoal/55">Real-time fulfillment tracking with SAP ERP integration and 3-way match protection</p>
          </div>
        </div>
        <div className="px-5 pb-3">
          <Tabs
            tabs={TAB_IDS.map((id) => ({ id, label: id === 'All' ? 'All' : id, count: counts[id] ?? 0 }))}
            active={tab}
            onChange={setTab}
          />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          searchable
          searchValue={(r) => `${r.poNumber} ${r.supplier} ${r.material} ${r.location}`}
          searchPlaceholder="Search PO, supplier or material…"
          pageSize={10}
        />
      </Card>

      {/* Modal for creating PO */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={aiPrefill ? 'AI Suggested Purchase Order' : 'Create Purchase Order'}
        subtitle="Specify material, quantity, supplier and delivery location"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit}>Create PO</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="po-supplier">Supplier</label>
            <select
              id="po-supplier"
              className="input"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} · {s.price != null ? `${formatINR(s.price)}/unit` : 'Quotation required'} · Supplier Score {s.aiScore}/100
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="po-material">Material</label>
            <input
              id="po-material"
              className="input"
              list="po-material-list"
              placeholder="e.g. Paracetamol"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="po-location">Location</label>
            <select id="po-location" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              {['PLANT_DEL', 'PLANT_MUM', 'PLANT_BLR', 'PLANT_HYD', 'PLANT_CHE'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="po-qty">Quantity</label>
            <input id="po-qty" className="input" type="number" min="1" placeholder="e.g. 15000" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="po-price">Unit price (₹)</label>
            <input id="po-price" className="input" type="number" min="0" placeholder="e.g. 14.50" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
