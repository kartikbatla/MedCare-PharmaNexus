import { useState } from 'react';
import { CalendarClock, Truck, Send, ArrowRight, Layers } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { expiryItems, type ExpiryItem } from '../data/mockData';
import { medicineNameById } from '../data/medicineCatalog';
import { formatINR, cn } from '../lib/utils';

function expiryStatus(days: number) {
  if (days < 0) return { label: 'Expired', chip: 'bg-status-dangerBg text-status-danger' };
  if (days <= 7) return { label: 'Expiring soon', chip: 'bg-status-dangerBg text-status-danger' };
  if (days <= 30) return { label: 'Monitor', chip: 'bg-status-warningBg text-status-warning' };
  return { label: 'Healthy', chip: 'bg-brand-navy/5 text-brand-charcoal/70' };
}

function expiryTone(days: number) {
  if (days <= 15) return 'danger';
  if (days <= 45) return 'warning';
  return 'info';
}

import { useControlTower } from '../context/ControlTowerContext';

export default function ExpiryManagement() {
  const { toast } = useToast();
  const { transferStock } = useControlTower();
  const [selected, setSelected] = useState<ExpiryItem | null>(null);
  const [transferItem, setTransferItem] = useState<ExpiryItem | null>(null);
  const [transferredIds, setTransferredIds] = useState<Set<string>>(new Set());

  const handleConfirmTransfer = async () => {
    if (!transferItem) return;
    await transferStock(transferItem.medicineId, 'PLANT_MUM', 'PLANT_DEL', transferItem.quantity, transferItem.batch);
    setTransferredIds((prev) => new Set(prev).add(transferItem.id));
    toast('success', 'Inter-Plant Transfer Executed', `${transferItem.quantity} units of ${transferItem.product} moved to PLANT_DEL. Inventory updated for both plants.`);
    setTransferItem(null);
  };

  const sortedItems = [...expiryItems].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const summaryStats = [
    { label: 'Units near expiry', value: String(expiryItems.reduce((s, i) => s + i.quantity, 0)), sub: `Across ${expiryItems.length} batches` },
    { label: 'Value at risk', value: formatINR(expiryItems.reduce((s, i) => s + i.valueAtRisk, 0)), sub: 'Next 90 days' },
    { label: 'FEFO compliance', value: '96%', sub: '+2% vs last quarter' },
    { label: 'Dispatched early', value: '₹31,200', sub: 'Saved via FEFO prioritization' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry Management"
        subtitle="FEFO-first tracking of near-expiry pharmaceutical inventory"
        action={
          <Button variant="secondary" onClick={() => toast('info', 'Batch report generated', 'Expiry register exported as PDF.')}>
            Export Expiry Register
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((s) => (
          <div key={s.label} className="card card-hover p-5">
            <p className="text-[13px] font-medium text-brand-charcoal/55">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-charcoal tabular-nums">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-brand-charcoal/50">{s.sub}</p>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden border-brand-navy/10">
        <div className="flex flex-wrap items-center gap-4 bg-brand-navy px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
            <Layers size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">FEFO — First Expiry, First Out</p>
            <p className="text-[13px] text-white/60">
              The system automatically prioritizes dispatch of batches with the earliest expiry dates to minimize write-offs.
            </p>
          </div>
          <StatusBadge status="Enforced · 6 batches" variant="onDark" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-navy/[0.02]">
                <th className="table-th">Product</th>
                <th className="table-th">Warehouse</th>
                <th className="table-th text-right">Quantity</th>
                <th className="table-th">Batch</th>
                <th className="table-th">Expiry date</th>
                <th className="table-th text-right">Days left</th>
                <th className="table-th text-right">Value at risk</th>
                <th className="table-th">Recommended action</th>
                <th className="table-th" />
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const tone = expiryTone(item.daysRemaining);
                const status = expiryStatus(item.daysRemaining);
                return (
                  <tr key={item.id} className="table-row">
                    <td className="table-td">
                      <p className="font-medium text-brand-charcoal">{medicineNameById(item.medicineId)}</p>
                      <p className="text-xs text-brand-charcoal/45">SKU · {item.medicineId}</p>
                      <span className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[10.5px] font-medium', status.chip)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="table-td text-brand-charcoal/70">{item.warehouse}</td>
                    <td className="table-td text-right font-medium tabular-nums">{item.quantity}</td>
                    <td className="table-td">
                      <span className="rounded bg-brand-navy/5 px-2 py-0.5 font-mono text-xs text-brand-charcoal/70">
                        {item.batch}
                      </span>
                    </td>
                    <td className="table-td text-brand-charcoal/70">{item.expiryDate}</td>
                    <td className="table-td text-right">
                      <span
                        className={
                          tone === 'danger'
                            ? 'font-semibold text-status-danger tabular-nums'
                            : tone === 'warning'
                              ? 'font-semibold text-status-warning tabular-nums'
                              : 'tabular-nums text-brand-charcoal/80'
                        }
                      >
                        {item.daysRemaining}
                      </span>
                    </td>
                    <td className="table-td text-right font-medium text-status-danger tabular-nums">
                      {formatINR(item.valueAtRisk)}
                    </td>
                    <td className="table-td">
                      <StatusBadge
                        status={transferredIds.has(item.id) ? 'Transferred & Redistributed' : item.action}
                        tone={transferredIds.has(item.id) ? 'success' : undefined}
                      />
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTransferItem(item)}
                        >
                          <Truck size={13} /> Transfer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast(
                              'success',
                              'Dispatch prioritized',
                              `${item.product} batch ${item.batch} flagged for priority dispatch to FEFO-eligible locations.`,
                            )
                          }
                        >
                          <Send size={13} /> Dispatch
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(item)}>
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Expiry by Month"
          subtitle="Upcoming expiry exposure"
          icon={<CalendarClock size={15} />}
        />
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-3">
          {[
            { month: 'Aug 2026', value: 420, pct: 52, tone: 'danger' as const },
            { month: 'Sep 2026', value: 210, pct: 26, tone: 'warning' as const },
            { month: 'Oct 2026', value: 170, pct: 21, tone: 'info' as const },
          ].map((m) => (
            <div key={m.month} className="rounded-xl border border-brand-navy/8 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-charcoal">{m.month}</p>
                <span className="text-sm font-semibold text-brand-charcoal tabular-nums">{m.value}</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-navy/8">
                <div
                  className={`h-full rounded-full ${
                    m.tone === 'danger'
                      ? 'bg-status-danger'
                      : m.tone === 'warning'
                        ? 'bg-status-warning'
                        : 'bg-brand-muted'
                  }`}
                  style={{ width: `${m.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-brand-charcoal/50">{m.pct}% of exposure</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.product} — Batch ${selected.batch}` : ''}
        subtitle="FEFO analysis"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                toast('success', 'Dispatch prioritized', `${selected?.product} marked for priority dispatch.`);
                setSelected(null);
              }}
            >
              <Send size={14} /> Prioritize Dispatch
            </Button>
          </>
        }
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Warehouse', selected.warehouse],
              ['Quantity', `${selected.quantity} units`],
              ['Expiry date', selected.expiryDate],
              ['Days remaining', `${selected.daysRemaining} days`],
              ['Value at risk', formatINR(selected.valueAtRisk)],
              ['Recommended', selected.action],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5">
                <dt className="text-[11px] text-brand-charcoal/50">{k}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand-charcoal">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <Modal
        open={!!transferItem}
        onClose={() => setTransferItem(null)}
        title={transferItem ? `Transfer ${transferItem.product}` : ''}
        subtitle="Move stock to a higher-demand location before expiry"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmTransfer}>
              <Truck size={14} /> Confirm Transfer
            </Button>
          </>
        }
      >
        {transferItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5">
                <p className="text-[11px] text-brand-charcoal/50">Available</p>
                <p className="text-sm font-semibold text-brand-charcoal tabular-nums">{transferItem.quantity} units</p>
              </div>
              <div className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5">
                <p className="text-[11px] text-brand-charcoal/50">From</p>
                <p className="text-sm font-semibold text-brand-charcoal">{transferItem.warehouse}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-brand-navy/[0.03] px-3 py-2.5">
                <p className="text-[11px] text-brand-charcoal/50">Destination (FEFO-eligible)</p>
                <p className="text-sm font-semibold text-brand-charcoal">Delhi North — High demand</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-[13px] text-brand-charcoal/60">
              <ArrowRight size={14} className="text-brand-muted" />
              Estimated <span className="font-semibold text-status-success">{formatINR(transferItem.valueAtRisk)}</span> of
              write-off avoided by this transfer.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
