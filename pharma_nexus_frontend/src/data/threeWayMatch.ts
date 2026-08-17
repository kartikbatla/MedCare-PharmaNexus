import { medicineNameById } from './medicineCatalog';

export type MatchKind = 'Full Match' | 'Valid Partial Match' | 'Mismatch';

export interface ThreeWayLineItem {
  medicineId: string;
  medicine: string;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  unitPrice: number;
}

export interface MatchCharges {
  subtotal: number;
  gst: number;
  logistics: number;
  total: number;
}

export interface ThreeWayMatchDetails {
  paymentId: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  supplier: string;
  orderDate: string;
  receivedDate: string;
  invoiceDate: string;
  grnStatus: 'Fully Received' | 'Partially Received';
  items: ThreeWayLineItem[];
  charges: MatchCharges;
  kind: MatchKind;
  reason: string;
  pendingUnits: number;
}

export function threeWayMatchFor(paymentId: string): ThreeWayMatchDetails | undefined {
  return threeWayMatchDetails[paymentId];
}

const details: Array<[string, Omit<ThreeWayMatchDetails, 'paymentId'>]> = [
  [
    'pay-1',
    {
      poNumber: 'PO-10452',
      grnNumber: 'GRN-10452',
      invoiceNumber: 'INV-20452',
      supplier: 'Aurobindo Pharma Limited',
      orderDate: '16 Aug 2026',
      receivedDate: '16 Aug 2026',
      invoiceDate: '16 Aug 2026',
      grnStatus: 'Partially Received',
      items: [{ medicineId: 'MED-0001', medicine: medicineNameById('MED-0001'), poQty: 380, grnQty: 200, invoiceQty: 200, unitPrice: 105 }],
      charges: { subtotal: 21000, gst: 3780, logistics: 500, total: 25280 },
      kind: 'Valid Partial Match',
      reason:
        '200 units were received and the invoice has been generated for the same 200 units. 180 units remain pending delivery.',
      pendingUnits: 180,
    },
  ],
  [
    'pay-2',
    {
      poNumber: 'PO-10447',
      grnNumber: 'GRN-10447',
      invoiceNumber: 'INV-20450',
      supplier: 'Centaur Pharmaceuticals Pvt. Ltd.',
      orderDate: '12 Aug 2026',
      receivedDate: '14 Aug 2026',
      invoiceDate: '15 Aug 2026',
      grnStatus: 'Partially Received',
      items: [{ medicineId: 'MED-0012', medicine: medicineNameById('MED-0012'), poQty: 480, grnQty: 280, invoiceQty: 280, unitPrice: 72 }],
      charges: { subtotal: 20160, gst: 0, logistics: 0, total: 20160 },
      kind: 'Valid Partial Match',
      reason:
        '280 units were received and the invoice has been generated for the same 280 units. 200 units remain pending delivery.',
      pendingUnits: 200,
    },
  ],
  [
    'pay-3',
    {
      poNumber: 'PO-10446',
      grnNumber: 'GRN-10446',
      invoiceNumber: 'INV-20451',
      supplier: 'Akums Drugs & Pharmaceuticals Ltd.',
      orderDate: '10 Aug 2026',
      receivedDate: '13 Aug 2026',
      invoiceDate: '14 Aug 2026',
      grnStatus: 'Partially Received',
      items: [{ medicineId: 'MED-0013', medicine: medicineNameById('MED-0013'), poQty: 300, grnQty: 224, invoiceQty: 224, unitPrice: 42 }],
      charges: { subtotal: 9408, gst: 0, logistics: 0, total: 9408 },
      kind: 'Valid Partial Match',
      reason:
        '224 units were received and the invoice has been generated for the same 224 units. 76 units remain pending delivery.',
      pendingUnits: 76,
    },
  ],
  [
    'pay-4',
    {
      poNumber: 'PO-10449',
      grnNumber: 'GRN-10449',
      invoiceNumber: 'INV-20447',
      supplier: 'Lee Pharma Limited',
      orderDate: '09 Aug 2026',
      receivedDate: '13 Aug 2026',
      invoiceDate: '16 Aug 2026',
      grnStatus: 'Partially Received',
      items: [{ medicineId: 'MED-0055', medicine: medicineNameById('MED-0055'), poQty: 500, grnQty: 256, invoiceQty: 320, unitPrice: 77 }],
      charges: { subtotal: 24640, gst: 0, logistics: 0, total: 24640 },
      kind: 'Mismatch',
      reason: 'Invoice quantity of 320 units exceeds the received quantity of 256 units.',
      pendingUnits: 244,
    },
  ],
  [
    'pay-5',
    {
      poNumber: 'PO-10420',
      grnNumber: 'GRN-10420',
      invoiceNumber: 'INV-20449',
      supplier: 'Gland Chemicals Pvt. Ltd.',
      orderDate: '28 Jul 2026',
      receivedDate: '12 Aug 2026',
      invoiceDate: '18 Aug 2026',
      grnStatus: 'Partially Received',
      items: [{ medicineId: 'MED-0016', medicine: medicineNameById('MED-0016'), poQty: 700, grnQty: 400, invoiceQty: 560, unitPrice: 74 }],
      charges: { subtotal: 41440, gst: 0, logistics: 0, total: 41440 },
      kind: 'Mismatch',
      reason: 'Invoice quantity of 560 units exceeds the received quantity of 400 units.',
      pendingUnits: 300,
    },
  ],
  [
    'pay-6',
    {
      poNumber: 'PO-10444',
      grnNumber: 'GRN-10444',
      invoiceNumber: 'INV-20446',
      supplier: 'Akums Drugs & Pharmaceuticals Ltd.',
      orderDate: '06 Aug 2026',
      receivedDate: '13 Aug 2026',
      invoiceDate: '14 Aug 2026',
      grnStatus: 'Fully Received',
      items: [{ medicineId: 'MED-0162', medicine: medicineNameById('MED-0162'), poQty: 300, grnQty: 300, invoiceQty: 300, unitPrice: 42 }],
      charges: { subtotal: 12600, gst: 0, logistics: 0, total: 12600 },
      kind: 'Full Match',
      reason: 'Invoice quantity matches the quantity received. All 300 units delivered.',
      pendingUnits: 0,
    },
  ],
];

export const threeWayMatchDetails: Record<string, ThreeWayMatchDetails> = Object.fromEntries(
  details.map(([id, d]) => [id, { paymentId: id, ...d } as ThreeWayMatchDetails]),
);
