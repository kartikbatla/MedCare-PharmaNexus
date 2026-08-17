import { useMemo, useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, XCircle, ArrowRight, Download, ReceiptText, FileText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { type Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import ThreeWayMatchDrawer from '../components/features/payments/ThreeWayMatchDrawer';
import { useToast } from '../context/ToastContext';
import { paymentRequests, type PaymentRequest } from '../data/mockData';
import { threeWayMatchFor } from '../data/threeWayMatch';
import { formatDate, formatINR } from '../lib/utils';
import { useControlTower } from '../context/ControlTowerContext';

const checks: Array<{ label: string; ok: boolean; detail: string }> = [
  { label: '3-Way Match', ok: true, detail: 'PO + GRN + Invoice verified' },
  { label: 'Invoice Anomaly', ok: true, detail: 'No anomalies detected' },
  { label: 'Supplier Risk', ok: true, detail: 'Low risk · 97% reliability' },
];

export default function PaymentApproval() {
  const { state, approvePO, rejectPO, refreshState } = useControlTower();
  const { toast } = useToast();
  const [reviewTarget, setReviewTarget] = useState<PaymentRequest | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<PaymentRequest | null>(null);
  const [matchTarget, setMatchTarget] = useState<PaymentRequest | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('All');

  const liveRequests: PaymentRequest[] = useMemo(() => {
    if (!state?.three_way_match) return paymentRequests.map((p) => approvedIds.has(p.id) ? { ...p, status: 'Approved' } : p);
    return state.three_way_match.map((m, idx) => {
      const matchOk = m.three_way_match === 'MATCH';
      const reqId = `PR-${idx + 1}`;
      const isApproved = approvedIds.has(reqId) || m.payment_status === 'APPROVED';
      return {
        id: reqId,
        supplier: `Supplier ${m.po_id}`,
        invoice: m.invoice_number || `INV-${m.po_id}`,
        poNumber: m.po_id,
        amount: m.invoice_qty * m.invoice_price,
        dueDate: '2026-08-25',
        matchStatus: matchOk ? 'success' : 'failed',
        anomalyStatus: matchOk ? 'none' : 'warning',
        riskStatus: matchOk ? 'low' : 'high',
        recommendation: isApproved ? 'Approve' : (matchOk ? 'Approve' : 'Review'),
        status: isApproved ? 'Approved' : (matchOk ? 'Approved' : 'Review'),
      };
    });
  }, [state, approvedIds]);

  const active = liveRequests[0] || paymentRequests[0];

  const handleApprove = async (p: PaymentRequest) => {
    await approvePO(p.poNumber);
    setApprovedIds((prev) => new Set(prev).add(p.id));
    toast('success', 'Payment approved', `${formatINR(p.amount)} released to ${p.supplier}. Status updated to Paid.`);
  };

  const handleReject = async (p: PaymentRequest) => {
    await rejectPO(p.poNumber);
    toast('error', 'Payment rejected', `${p.invoice} rejected — supplier notified.`);
  };

  const downloadReceipt = (p: PaymentRequest) => {
    const lines = [
      'MedCare Control Tower — Payment Receipt',
      '------------------------------------------',
      `Receipt number : RCPT-${p.invoice.replace(/[^A-Z0-9]/gi, '').slice(-6)}`,
      `Payment date   : ${formatDate(new Date().toISOString())}`,
      `Supplier       : ${p.supplier}`,
      `PO number      : ${p.poNumber}`,
      `Invoice number : ${p.invoice}`,
      `Amount paid    : ${formatINR(p.amount)}`,
      `Payment method : Net Banking`,
      `Payment status : Paid`,
      '------------------------------------------',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${p.invoice}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('success', 'Receipt downloaded', `Payment receipt for ${p.invoice} downloaded.`);
  };

  const openTaxInvoice = (poNumber: string) => {
    window.open(`/api/invoice/${poNumber}`, '_blank');
  };

  const openSupplierInvoice = (poNumber: string) => {
    window.open(`/api/supplier-invoice/${poNumber}`, '_blank');
  };

  const columns: Column<PaymentRequest>[] = [
    {
      key: 'supplier',
      header: 'Supplier & PO',
      render: (r) => (
        <div>
          <span className="font-semibold text-brand-charcoal">{r.poNumber}</span>
          <p className="text-xs text-brand-charcoal/50">{r.supplier}</p>
        </div>
      ),
      sortValue: (r) => r.supplier,
    },
    {
      key: 'invoice',
      header: 'Invoice',
      render: (r) => (
        <div>
          <p className="font-mono text-[13px] font-medium text-brand-charcoal/80">{r.invoice}</p>
          <p className="text-xs text-brand-charcoal/45">Due {r.dueDate}</p>
        </div>
      ),
      sortValue: (r) => r.invoice,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums text-brand-charcoal">{formatINR(r.amount)}</span>,
      sortValue: (r) => r.amount,
    },
    {
      key: 'matchStatus',
      header: '3-Way Match Audit',
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            status={
              r.matchStatus === 'success' ? 'Matched' : 'Mismatch Exception'
            }
          />
          <button
            onClick={() => setMatchTarget(r)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-navy hover:underline"
          >
            Match Trace <ArrowRight size={12} />
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
    },
    {
      key: 'actions',
      header: 'Actions & Documents',
      align: 'right',
      render: (r) => (
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openTaxInvoice(r.poNumber)} title="Official Tax Invoice">
            <FileText size={13} /> Tax Invoice
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openSupplierInvoice(r.poNumber)} title="Raw Supplier Bill (OCR Check)">
            <ReceiptText size={13} /> Supplier Bill (OCR)
          </Button>
          {r.status === 'Review' && (
            <Button variant="primary" size="sm" onClick={() => handleApprove(r)}>
              <CheckCircle2 size={13} /> Approve Payment
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filtered = useMemo(() => {
    if (filter === 'All') return liveRequests;
    if (filter === 'Pending') return liveRequests.filter((r) => r.status === 'Review' || r.status === 'Pending');
    if (filter === 'Approved') return liveRequests.filter((r) => r.status === 'Approved' || r.status === 'Paid');
    return liveRequests;
  }, [liveRequests, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="3-Way Match & Payment Approval"
        subtitle="3-Way Match Audit engine verifies PO Contracted Qty vs IoT Scanned Receipt vs Supplier Invoice"
        action={
          <Button variant="secondary" onClick={async () => { await refreshState(); toast('info', 'List refreshed', 'Payment statuses re-synchronized with backend.'); }}>
            <CreditCard size={15} /> Refresh Audit Pipeline
          </Button>
        }
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-brand-charcoal">3-Way Match Verification</h2>
            <p className="text-[13px] text-brand-charcoal/55">Review invoice anomalies before releasing funds</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReviewTarget(active)}>
              Detailed Inspection
            </Button>
            {active.status !== 'Approved' && active.status !== 'Paid' && (
              <Button size="sm" onClick={() => handleApprove(active)}>
                <CheckCircle2 size={15} /> Approve & Release
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {checks.map((c) => (
            <div key={c.label} className="rounded-lg border border-brand-navy/10 bg-brand-navy/[0.02] p-3">
              <div className="flex items-center gap-2">
                {c.ok ? <ShieldCheck size={16} className="text-status-success" /> : <XCircle size={16} className="text-status-danger" />}
                <p className="text-xs font-semibold text-brand-charcoal">{c.label}</p>
              </div>
              <p className="mt-1 text-[11px] text-brand-charcoal/60">{c.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="px-5 pt-4 pb-2">
          <Tabs
            tabs={[
              { id: 'All', label: 'All Payments', count: liveRequests.length },
              { id: 'Pending', label: 'Pending Review', count: liveRequests.filter((r) => r.status === 'Review').length },
              { id: 'Approved', label: 'Approved & Released', count: liveRequests.filter((r) => r.status === 'Approved' || r.status === 'Paid').length },
            ]}
            active={filter}
            onChange={setFilter}
          />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          searchable
          searchValue={(r) => `${r.supplier} ${r.invoice} ${r.poNumber}`}
          searchPlaceholder="Search supplier or invoice…"
          pageSize={10}
        />
      </Card>

      {/* Drawers and modals */}
      {matchTarget && (
        <ThreeWayMatchDrawer
          open={!!matchTarget}
          onClose={() => setMatchTarget(null)}
          payment={matchTarget}
          details={threeWayMatchFor(matchTarget.id) || {
            paymentId: matchTarget.id,
            poNumber: matchTarget.poNumber,
            grnNumber: `GRN-${matchTarget.poNumber}`,
            invoiceNumber: matchTarget.invoice,
            supplier: matchTarget.supplier,
            orderDate: '2026-08-10',
            receivedDate: '2026-08-14',
            invoiceDate: '2026-08-15',
            grnStatus: 'Fully Received',
            items: [{ medicineId: 'MED-0001', medicine: 'Paracetamol 500mg', poQty: 15000, grnQty: 15000, invoiceQty: 15000, unitPrice: 14.5 }],
            charges: { subtotal: matchTarget.amount, gst: matchTarget.amount * 0.18, logistics: 0, total: matchTarget.amount * 1.18 },
            kind: matchTarget.matchStatus === 'success' ? 'Full Match' : 'Mismatch',
            reason: matchTarget.matchStatus === 'success' ? 'PO, GRN Receipt, and Invoiced quantities match perfectly.' : 'Quantity mismatch exception detected: units variance held from payout.',
            pendingUnits: 0,
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onReview={setReviewTarget}
        />
      )}

      {reviewTarget && (
        <Modal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          title={`Review Payment Request — ${reviewTarget.invoice}`}
          subtitle={`${reviewTarget.supplier} · PO ${reviewTarget.poNumber}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => handleReject(reviewTarget)}>
                Reject & Notify
              </Button>
              <Button onClick={() => handleApprove(reviewTarget)}>
                Approve Payment ({formatINR(reviewTarget.amount)})
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p><strong>Supplier:</strong> {reviewTarget.supplier}</p>
            <p><strong>Amount:</strong> {formatINR(reviewTarget.amount)}</p>
            <p><strong>Status:</strong> {reviewTarget.status}</p>
          </div>
        </Modal>
      )}

      {receiptTarget && (
        <Modal
          open={!!receiptTarget}
          onClose={() => setReceiptTarget(null)}
          title="Payment Confirmation Receipt"
          subtitle={`Receipt for invoice ${receiptTarget.invoice}`}
          footer={
            <Button onClick={() => downloadReceipt(receiptTarget)}>
              <Download size={14} /> Download Receipt Text
            </Button>
          }
        >
          <div className="rounded border bg-brand-navy/5 p-4 text-xs font-mono">
            <p>Receipt: RCPT-{receiptTarget.invoice}</p>
            <p>Supplier: {receiptTarget.supplier}</p>
            <p>Amount: {formatINR(receiptTarget.amount)}</p>
            <p>Status: Released & Paid</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
