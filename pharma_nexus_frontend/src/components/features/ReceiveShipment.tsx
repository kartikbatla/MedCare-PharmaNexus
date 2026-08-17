import { useEffect, useRef, useState } from 'react';
import { Barcode, QrCode, ScanLine, CheckCircle2, Truck, Loader2, PackageCheck } from 'lucide-react';
import type { PurchaseOrder } from '../../data/mockData';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatINR, cn } from '../../lib/utils';

interface ReceiveShipmentProps {
  po: PurchaseOrder | null;
  onClose: () => void;
  onConfirm: (po: PurchaseOrder) => void;
}

type ScanStep = 'barcode' | 'qr' | 'cv';

const steps: Array<{ id: ScanStep; label: string; icon: typeof Barcode; hint: string }> = [
  { id: 'barcode', label: 'Barcode scanning', icon: Barcode, hint: 'Reading batch + serial from label' },
  { id: 'qr', label: 'QR verification', icon: QrCode, hint: 'Cross-checking against PO-issued QR' },
  { id: 'cv', label: 'Computer vision', icon: ScanLine, hint: 'Counting cartons via camera feed' },
];

export default function ReceiveShipment({ po, onClose, onConfirm }: ReceiveShipmentProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [detected, setDetected] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!po) return;
    setStepIdx(0);
    setDone(false);
    setDetected(null);
    steps.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setStepIdx(i + 1);
          if (i === steps.length - 1) {
            setDetected(po.quantity - (po.receivedQty ?? 0));
            setDone(true);
          }
        }, 1100 * (i + 1)),
      );
    });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [po]);

  if (!po) return null;

  const remaining = po.quantity - (po.receivedQty ?? 0);

  return (
    <Modal
      open={!!po}
      onClose={onClose}
      title="Material Receipt — Incoming Shipment"
      subtitle={`${po.poNumber} · ${po.supplier}`}
      size="lg"
      footer={
        done ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onConfirm(po);
                onClose();
              }}
            >
              <PackageCheck size={14} /> Confirm Receipt
            </Button>
          </>
        ) : (
          <Button variant="secondary" disabled onClick={onClose}>
            Scanning in progress…
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-navy px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Truck size={15} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-white">{po.supplier}</p>
                  <p className="text-[12px] text-white/55">{po.poNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/50">Expected quantity</p>
                <p className="text-lg font-semibold text-white tabular-nums">{remaining} units</p>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Material', po.material],
              ['Location', po.location],
              ['Unit price', formatINR(po.unitPrice)],
              ['Order value', formatINR(po.totalAmount)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-brand-navy/[0.03] px-3 py-2.5">
                <dt className="text-[11px] text-brand-charcoal/50">{k}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand-charcoal">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-lg border border-brand-navy/8 p-3.5">
            <p className="text-[12px] font-medium text-brand-charcoal/60">Vision analytics</p>
            <ul className="mt-2 space-y-1.5">
              {['Cartons counted via overhead camera', 'Serial numbers extracted from barcodes', 'Boxes matched to PO-issued QR'.replace('QR', 'QR')].map((l) => (
                <li key={l} className="flex items-center gap-2 text-[12.5px] text-brand-charcoal/70">
                  <CheckCircle2 size={12} className="text-status-success" /> {l}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-navy/15 bg-brand-navy/[0.02] px-4 py-6">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-brand-navy text-white">
              <ScanLine size={22} />
              {!done && (
                <span className="absolute -inset-1.5 animate-ping rounded-xl bg-brand-navy/10" />
              )}
            </span>
            <p className="mt-3 text-sm font-semibold text-brand-charcoal">
              {done ? 'Shipment recognized' : 'Auto-detecting incoming materials…'}
            </p>
            <p className="text-xs text-brand-charcoal/50">
              {done ? 'IoT + Computer Vision confirmed the delivery' : 'Keep the shipment in the camera frame'}
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((s, i) => {
              const isDone = i < stepIdx || done;
              const isActive = i === stepIdx && !done;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors',
                    isDone
                      ? 'border-status-success/25 bg-status-successBg/40'
                      : isActive
                        ? 'border-brand-muted/40 bg-brand-muted/5'
                        : 'border-brand-navy/8 bg-white opacity-60',
                  )}
                >
                  {isDone ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-status-success text-white">
                      <CheckCircle2 size={13} />
                    </span>
                  ) : isActive ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-muted text-white">
                      <Loader2 size={13} className="animate-spin" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/8 text-brand-charcoal/50">
                      <s.icon size={13} />
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-brand-charcoal">{s.label}</p>
                    <p className="text-[11.5px] text-brand-charcoal/50">{s.hint}</p>
                  </div>
                  {isDone && <span className="text-[11px] font-medium text-status-success">OK</span>}
                </div>
              );
            })}
          </div>

          <div
            className={cn(
              'flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors',
              done ? 'bg-status-successBg/60' : 'bg-brand-navy/[0.03]',
            )}
          >
            <div>
              <p className="text-[11px] text-brand-charcoal/50">Detected quantity</p>
              <p className="text-xl font-semibold text-brand-charcoal tabular-nums">
                {detected === null ? '—' : `${detected} units`}
              </p>
            </div>
            {done ? (
              <span className="badge bg-status-success text-white">
                <CheckCircle2 size={12} /> Material Received
              </span>
            ) : (
              <span className="text-xs text-brand-charcoal/40">Awaiting vision result…</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
