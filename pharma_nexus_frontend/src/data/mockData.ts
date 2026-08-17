export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export { suppliers } from './suppliers';
export type { Supplier, VerificationStatus } from './suppliers';

import { medicineNameById } from './medicineCatalog';

export interface InventoryItem {
  id: string;
  medicineId: string;
  medicine: string;
  location: string;
  currentStock: number;
  predictedDemand: number;
  safetyStock: number;
  daysRemaining: number;
  status: 'Critical' | 'Warning' | 'Healthy';
  unitPrice: number;
  expiryDate: string;
}

export interface ExpiryItem {
  id: string;
  medicineId: string;
  product: string;
  warehouse: string;
  quantity: number;
  expiryDate: string;
  daysRemaining: number;
  valueAtRisk: number;
  batch: string;
  action: string;
}

export interface MaterialRequest {
  id: string;
  medicineId?: string;
  material: string;
  location: string;
  quantity: number;
  requiredDate: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  status: 'Under Review' | 'Approved' | 'Rejected' | 'Completed';
  createdBy: string;
  createdAt: string;
  source?: 'internal' | 'retailer';
  dosage?: string;
}

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Approved'
  | 'Partially Fulfilled'
  | 'Fully Fulfilled'
  | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  medicineId?: string;
  material: string;
  location: string;
  quantity: number;
  receivedQty?: number;
  unitPrice: number;
  totalAmount: number;
  expectedDelivery: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  aiRecommended?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  poNumber: string;
  invoiceDate: string;
  medicineId?: string;
  material: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Processing' | 'Verified' | 'Review Required' | 'Approved' | 'Paid' | 'Rejected';
  confidence: number;
  anomalies: string[];
}

export interface PaymentRequest {
  id: string;
  supplier: string;
  invoice: string;
  poNumber: string;
  amount: number;
  dueDate: string;
  matchStatus: 'success' | 'failed' | 'pending';
  anomalyStatus: 'none' | 'warning';
  riskStatus: 'low' | 'medium' | 'high';
  recommendation: 'Approve' | 'Review' | 'Reject';
  status: 'Pending' | 'Approved' | 'Paid' | 'Review';
  paymentMethod?: string;
  approvedBy?: string;
  paidAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'Critical' | 'Warning' | 'Invoice' | 'Procurement' | 'System';
  time: string;
  read: boolean;
  link: string;
  ref?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  meta: Array<{ label: string; value: string }>;
  actions: Array<{ label: string; type: 'primary' | 'secondary' }>;
  link: string;
  actionLinks?: Record<string, string>;
}

export const KPI = [
  {
    id: 'inventory',
    label: 'Total Inventory',
    value: '₹24.5L',
    change: '+4.2% from last month',
    trend: 'up' as const,
    trendTone: 'success' as const,
    icon: 'box',
    hint: 'Total value of stock across all warehouses',
  },
  {
    id: 'lowstock',
    label: 'Low Stock Items',
    value: '12',
    change: '3 new this week',
    trend: 'neutral' as const,
    icon: 'alert',
    hint: 'Items below the minimum stock threshold',
  },
  {
    id: 'risk',
    label: 'Stock-Out Risks',
    value: '5',
    change: '↑ 2 from last week',
    trend: 'up' as const,
    trendTone: 'danger' as const,
    icon: 'trending',
    hint: 'Items predicted to stock out within 7 days',
  },
  {
    id: 'expiry',
    label: 'Near-Expiry Items',
    value: '8',
    change: '₹3.2L at risk',
    trend: 'neutral' as const,
    icon: 'calendar',
    hint: 'Items expiring within 60 days (FEFO)',
  },
  {
    id: 'po',
    label: 'Purchase Orders',
    value: '3',
    change: 'Partially fulfilled',
    trend: 'up' as const,
    trendTone: 'warning' as const,
    icon: 'file',
    hint: 'Purchase orders awaiting remaining deliveries',
  },
  {
    id: 'requests',
    label: 'Pending Requests',
    value: '4',
    change: 'Incl. retailer orders',
    trend: 'neutral' as const,
    icon: 'clipboard',
    hint: 'Material requests currently under review',
  },
  {
    id: 'payment',
    label: 'Payment Pending',
    value: '7',
    change: '₹6.1L to approve',
    trend: 'neutral' as const,
    icon: 'wallet',
    hint: 'Invoices awaiting finance approval',
  },
  {
    id: 'approval',
    label: 'Pending Approvals',
    value: '12',
    change: '6 POs · 6 invoices',
    trend: 'neutral' as const,
    icon: 'check',
    hint: 'POs and invoices awaiting your approval',
  },
];

export const inventory: InventoryItem[] = [
  {
    id: 'inv-1',
    medicineId: 'MED-0001',
    medicine: medicineNameById('MED-0001'),
    location: 'Delhi',
    currentStock: 120,
    predictedDemand: 480,
    safetyStock: 50,
    daysRemaining: 4,
    status: 'Critical',
    unitPrice: 105,
    expiryDate: '2026-11-12',
  },
  {
    id: 'inv-2',
    medicineId: 'MED-0002',
    medicine: medicineNameById('MED-0002'),
    location: 'Mumbai',
    currentStock: 450,
    predictedDemand: 300,
    safetyStock: 80,
    daysRemaining: 15,
    status: 'Healthy',
    unitPrice: 88,
    expiryDate: '2026-08-30',
  },
  {
    id: 'inv-3',
    medicineId: 'MED-0011',
    medicine: medicineNameById('MED-0011'),
    location: 'Chennai',
    currentStock: 180,
    predictedDemand: 250,
    safetyStock: 60,
    daysRemaining: 7,
    status: 'Warning',
    unitPrice: 64,
    expiryDate: '2026-10-05',
  },
  {
    id: 'inv-4',
    medicineId: 'MED-0013',
    medicine: medicineNameById('MED-0013'),
    location: 'Delhi',
    currentStock: 320,
    predictedDemand: 340,
    safetyStock: 70,
    daysRemaining: 9,
    status: 'Warning',
    unitPrice: 42,
    expiryDate: '2026-09-18',
  },
  {
    id: 'inv-5',
    medicineId: 'MED-0007',
    medicine: medicineNameById('MED-0007'),
    location: 'Mumbai',
    currentStock: 640,
    predictedDemand: 280,
    safetyStock: 90,
    daysRemaining: 22,
    status: 'Healthy',
    unitPrice: 150,
    expiryDate: '2027-02-10',
  },
  {
    id: 'inv-6',
    medicineId: 'MED-0004',
    medicine: medicineNameById('MED-0004'),
    location: 'Bengaluru',
    currentStock: 95,
    predictedDemand: 210,
    safetyStock: 40,
    daysRemaining: 5,
    status: 'Critical',
    unitPrice: 58,
    expiryDate: '2026-12-01',
  },
  {
    id: 'inv-7',
    medicineId: 'MED-0018',
    medicine: medicineNameById('MED-0018'),
    location: 'Hyderabad',
    currentStock: 260,
    predictedDemand: 150,
    safetyStock: 50,
    daysRemaining: 17,
    status: 'Healthy',
    unitPrice: 220,
    expiryDate: '2026-09-25',
  },
  {
    id: 'inv-8',
    medicineId: 'MED-0029',
    medicine: medicineNameById('MED-0029'),
    location: 'Kolkata',
    currentStock: 130,
    predictedDemand: 190,
    safetyStock: 45,
    daysRemaining: 8,
    status: 'Warning',
    unitPrice: 76,
    expiryDate: '2026-08-22',
  },
];

export const expiryItems: ExpiryItem[] = [
  {
    id: 'exp-1',
    medicineId: 'MED-0002',
    product: medicineNameById('MED-0002'),
    warehouse: 'Mumbai Central',
    quantity: 300,
    expiryDate: '2026-08-30',
    daysRemaining: 15,
    valueAtRisk: 30000,
    batch: 'FX-2281',
    action: 'Prioritize for dispatch',
  },
  {
    id: 'exp-2',
    medicineId: 'MED-0029',
    product: medicineNameById('MED-0029'),
    warehouse: 'Kolkata East',
    quantity: 120,
    expiryDate: '2026-08-22',
    daysRemaining: 7,
    valueAtRisk: 9600,
    batch: 'GG-1189',
    action: 'Transfer stock',
  },
  {
    id: 'exp-3',
    medicineId: 'MED-0013',
    product: medicineNameById('MED-0013'),
    warehouse: 'Delhi North',
    quantity: 210,
    expiryDate: '2026-09-18',
    daysRemaining: 34,
    valueAtRisk: 8820,
    batch: 'CR-0945',
    action: 'Monitor',
  },
  {
    id: 'exp-4',
    medicineId: 'MED-0018',
    product: medicineNameById('MED-0018'),
    warehouse: 'Hyderabad West',
    quantity: 80,
    expiryDate: '2026-09-25',
    daysRemaining: 41,
    valueAtRisk: 17600,
    batch: 'AB-3301',
    action: 'Prioritize for dispatch',
  },
  {
    id: 'exp-5',
    medicineId: 'MED-0011',
    product: medicineNameById('MED-0011'),
    warehouse: 'Chennai South',
    quantity: 90,
    expiryDate: '2026-10-05',
    daysRemaining: 51,
    valueAtRisk: 5760,
    batch: 'MP-4412',
    action: 'Monitor',
  },
  {
    id: 'exp-6',
    medicineId: 'MED-0001',
    product: medicineNameById('MED-0001'),
    warehouse: 'Delhi North',
    quantity: 150,
    expiryDate: '2026-11-12',
    daysRemaining: 89,
    valueAtRisk: 15750,
    batch: 'FC-5102',
    action: 'Monitor',
  },
];

export const materialRequests: MaterialRequest[] = [
  {
    id: 'mr-1',
    medicineId: 'MED-0001',
    material: medicineNameById('MED-0001'),
    location: 'Delhi',
    quantity: 360,
    requiredDate: '2026-08-22',
    priority: 'High',
    reason: 'Forecast demand spike (+60%) — projected stock-out in 4 days',
    status: 'Approved',
    createdBy: 'Anita Sharma',
    createdAt: '2026-08-15T08:30:00',
    source: 'internal',
  },
  {
    id: 'mr-2',
    medicineId: 'MED-0011',
    material: medicineNameById('MED-0011'),
    location: 'Chennai',
    quantity: 120,
    requiredDate: '2026-08-24',
    priority: 'Medium',
    reason: 'Weekly replenishment to maintain safety stock',
    status: 'Under Review',
    createdBy: 'Rahul Verma',
    createdAt: '2026-08-15T09:15:00',
    source: 'internal',
  },
  {
    id: 'mr-3',
    medicineId: 'MED-0004',
    material: medicineNameById('MED-0004'),
    location: 'Bengaluru',
    quantity: 150,
    requiredDate: '2026-08-21',
    priority: 'High',
    reason: 'Stock below safety threshold — 5 days of cover remaining',
    status: 'Under Review',
    createdBy: 'Sneha Iyer',
    createdAt: '2026-08-15T10:00:00',
    source: 'internal',
  },
  {
    id: 'mr-4',
    medicineId: 'MED-0018',
    material: medicineNameById('MED-0018'),
    location: 'Hyderabad',
    quantity: 80,
    requiredDate: '2026-08-28',
    priority: 'Low',
    reason: 'Seasonal buffer build-up',
    status: 'Completed',
    createdBy: 'Vikram Rao',
    createdAt: '2026-08-14T11:45:00',
    source: 'internal',
  },
  {
    id: 'mr-5',
    medicineId: 'MED-0013',
    material: medicineNameById('MED-0013'),
    location: 'Delhi',
    quantity: 60,
    requiredDate: '2026-08-25',
    priority: 'Medium',
    reason: 'Replenish transfer from Mumbai surplus',
    status: 'Completed',
    createdBy: 'Anita Sharma',
    createdAt: '2026-08-13T14:20:00',
    source: 'internal',
  },
  {
    id: 'mr-6',
    medicineId: 'MED-0002',
    material: medicineNameById('MED-0002'),
    location: 'Mumbai',
    quantity: 200,
    requiredDate: '2026-09-05',
    priority: 'Medium',
    reason: 'FEFO-driven batch rotation — restock fast-moving batches',
    status: 'Under Review',
    createdBy: 'Rahul Verma',
    createdAt: '2026-08-15T12:10:00',
    source: 'internal',
  },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-10452',
    supplier: 'Aurobindo Pharma Limited',
    medicineId: 'MED-0001',
    material: medicineNameById('MED-0001'),
    location: 'Delhi',
    quantity: 380,
    receivedQty: 200,
    unitPrice: 105,
    totalAmount: 39900,
    expectedDelivery: '2026-08-20',
    status: 'Partially Fulfilled',
    createdAt: '2026-08-15T10:45:00',
    aiRecommended: true,
  },
  {
    id: 'po-2',
    poNumber: 'PO-10451',
    supplier: 'Themis Medicare Limited',
    medicineId: 'MED-0011',
    material: medicineNameById('MED-0011'),
    location: 'Chennai',
    quantity: 150,
    unitPrice: 64,
    totalAmount: 9600,
    expectedDelivery: '2026-08-24',
    status: 'Approved',
    createdAt: '2026-08-15T09:20:00',
    aiRecommended: true,
  },
  {
    id: 'po-3',
    poNumber: 'PO-10450',
    supplier: 'Hetero Healthcare Limited',
    medicineId: 'MED-0004',
    material: medicineNameById('MED-0004'),
    location: 'Bengaluru',
    quantity: 150,
    unitPrice: 58,
    totalAmount: 8700,
    expectedDelivery: '2026-08-21',
    status: 'Draft',
    createdAt: '2026-08-15T11:05:00',
  },
  {
    id: 'po-4',
    poNumber: 'PO-10449',
    supplier: 'Lee Pharma Limited',
    medicineId: 'MED-0018',
    material: medicineNameById('MED-0018'),
    location: 'Hyderabad',
    quantity: 80,
    unitPrice: 220,
    totalAmount: 17600,
    expectedDelivery: '2026-08-28',
    status: 'Approved',
    createdAt: '2026-08-14T13:30:00',
  },
  {
    id: 'po-5',
    poNumber: 'PO-10448',
    supplier: 'Aurobindo Pharma Limited',
    medicineId: 'MED-0002',
    material: medicineNameById('MED-0002'),
    location: 'Mumbai',
    quantity: 300,
    receivedQty: 200,
    unitPrice: 88,
    totalAmount: 26400,
    expectedDelivery: '2026-08-18',
    status: 'Partially Fulfilled',
    createdAt: '2026-08-12T10:10:00',
  },
  {
    id: 'po-6',
    poNumber: 'PO-10447',
    supplier: 'Centaur Pharmaceuticals Pvt. Ltd.',
    medicineId: 'MED-0007',
    material: medicineNameById('MED-0007'),
    location: 'Mumbai',
    quantity: 120,
    receivedQty: 120,
    unitPrice: 150,
    totalAmount: 18000,
    expectedDelivery: '2026-08-16',
    status: 'Fully Fulfilled',
    createdAt: '2026-08-05T09:00:00',
  },
  {
    id: 'po-7',
    poNumber: 'PO-10446',
    supplier: 'Akums Drugs & Pharmaceuticals Ltd.',
    medicineId: 'MED-0013',
    material: medicineNameById('MED-0013'),
    location: 'Delhi',
    quantity: 200,
    receivedQty: 200,
    unitPrice: 42,
    totalAmount: 8400,
    expectedDelivery: '2026-08-14',
    status: 'Fully Fulfilled',
    createdAt: '2026-08-02T15:40:00',
  },
  {
    id: 'po-8',
    poNumber: 'PO-10445',
    supplier: 'Aarti Drugs Limited',
    medicineId: 'MED-0029',
    material: medicineNameById('MED-0029'),
    location: 'Kolkata',
    quantity: 100,
    receivedQty: 60,
    unitPrice: 76,
    totalAmount: 7600,
    expectedDelivery: '2026-08-19',
    status: 'Partially Fulfilled',
    createdAt: '2026-08-15T08:55:00',
  },
];

export const poPendingQty = (po: PurchaseOrder): number => po.quantity - (po.receivedQty ?? 0);

export const poFulfillmentPct = (po: PurchaseOrder): number =>
  po.quantity > 0 ? Math.round(((po.receivedQty ?? 0) / po.quantity) * 100) : 0;

export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-20452',
    supplier: 'Aurobindo Pharma Limited',
    poNumber: 'PO-10452',
    invoiceDate: '2026-08-16',
    medicineId: 'MED-0001',
    material: medicineNameById('MED-0001'),
    quantity: 200,
    unitPrice: 105,
    taxPercent: 12,
    taxAmount: 0,
    totalAmount: 21000,
    status: 'Verified',
    confidence: 99,
    anomalies: [],
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-20451',
    supplier: 'Akums Drugs & Pharmaceuticals Ltd.',
    poNumber: 'PO-10446',
    invoiceDate: '2026-08-15',
    medicineId: 'MED-0013',
    material: medicineNameById('MED-0013'),
    quantity: 200,
    unitPrice: 42,
    taxPercent: 12,
    taxAmount: 1008,
    totalAmount: 9408,
    status: 'Verified',
    confidence: 99,
    anomalies: [],
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-20450',
    supplier: 'Centaur Pharmaceuticals Pvt. Ltd.',
    poNumber: 'PO-10447',
    invoiceDate: '2026-08-14',
    medicineId: 'MED-0007',
    material: medicineNameById('MED-0007'),
    quantity: 120,
    unitPrice: 150,
    taxPercent: 12,
    taxAmount: 2160,
    totalAmount: 20160,
    status: 'Approved',
    confidence: 98,
    anomalies: [],
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-20449',
    supplier: 'Gland Chemicals Pvt. Ltd.',
    poNumber: 'PO-10420',
    invoiceDate: '2026-08-12',
    medicineId: 'MED-0170',
    material: medicineNameById('MED-0170'),
    quantity: 500,
    unitPrice: 74,
    taxPercent: 12,
    taxAmount: 4440,
    totalAmount: 41440,
    status: 'Processing',
    confidence: 91,
    anomalies: [],
  },
  {
    id: 'inv-5',
    invoiceNumber: 'INV-20448',
    supplier: 'Aurobindo Pharma Limited',
    poNumber: 'PO-10448',
    invoiceDate: '2026-08-10',
    medicineId: 'MED-0002',
    material: medicineNameById('MED-0002'),
    quantity: 300,
    unitPrice: 88,
    taxPercent: 12,
    taxAmount: 3168,
    totalAmount: 29568,
    status: 'Review Required',
    confidence: 97,
    anomalies: ['Quantity mismatch — 300 invoiced vs 200 received'],
  },
  {
    id: 'inv-6',
    invoiceNumber: 'INV-20447',
    supplier: 'Lee Pharma Limited',
    poNumber: 'PO-10449',
    invoiceDate: '2026-08-18',
    medicineId: 'MED-0018',
    material: medicineNameById('MED-0018'),
    quantity: 80,
    unitPrice: 220,
    taxPercent: 12,
    taxAmount: 2112,
    totalAmount: 19712,
    status: 'Processing',
    confidence: 93,
    anomalies: [],
  },
];

export const paymentRequests: PaymentRequest[] = [
  {
    id: 'pay-1',
    supplier: 'Aurobindo Pharma Limited',
    invoice: 'INV-20452',
    poNumber: 'PO-10452',
    amount: 25280,
    dueDate: '2026-08-26',
    matchStatus: 'success',
    anomalyStatus: 'none',
    riskStatus: 'low',
    recommendation: 'Approve',
    status: 'Pending',
  },
  {
    id: 'pay-2',
    supplier: 'Centaur Pharmaceuticals Pvt. Ltd.',
    invoice: 'INV-20450',
    poNumber: 'PO-10447',
    amount: 20160,
    dueDate: '2026-08-22',
    matchStatus: 'success',
    anomalyStatus: 'none',
    riskStatus: 'low',
    recommendation: 'Approve',
    status: 'Pending',
  },
  {
    id: 'pay-3',
    supplier: 'Akums Drugs & Pharmaceuticals Ltd.',
    invoice: 'INV-20451',
    poNumber: 'PO-10446',
    amount: 9408,
    dueDate: '2026-08-24',
    matchStatus: 'success',
    anomalyStatus: 'none',
    riskStatus: 'low',
    recommendation: 'Approve',
    status: 'Approved',
    paymentMethod: 'Net Banking',
    approvedBy: 'Anita Sharma',
    paidAt: '2026-08-15T11:30:00',
  },
  {
    id: 'pay-4',
    supplier: 'Lee Pharma Limited',
    invoice: 'INV-20447',
    poNumber: 'PO-10449',
    amount: 24640,
    dueDate: '2026-08-28',
    matchStatus: 'pending',
    anomalyStatus: 'none',
    riskStatus: 'medium',
    recommendation: 'Review',
    status: 'Review',
  },
  {
    id: 'pay-5',
    supplier: 'Gland Chemicals Pvt. Ltd.',
    invoice: 'INV-20449',
    poNumber: 'PO-10420',
    amount: 41440,
    dueDate: '2026-08-20',
    matchStatus: 'failed',
    anomalyStatus: 'warning',
    riskStatus: 'high',
    recommendation: 'Reject',
    status: 'Pending',
  },
  {
    id: 'pay-6',
    supplier: 'Akums Drugs & Pharmaceuticals Ltd.',
    invoice: 'INV-20446',
    poNumber: 'PO-10444',
    amount: 12600,
    dueDate: '2026-08-19',
    matchStatus: 'success',
    anomalyStatus: 'none',
    riskStatus: 'low',
    recommendation: 'Approve',
    status: 'Paid',
    paymentMethod: 'UPI',
    approvedBy: 'Anita Sharma',
    paidAt: '2026-08-14T16:45:00',
  },
];

export const notifications: Notification[] = [
  {
    id: 'ntf-1',
    title: 'Critical · Stock-out',
    message: `${medicineNameById('MED-0001')} will run out of stock in Delhi in 4 days.`,
    category: 'Critical',
    time: '2026-08-15T08:00:00',
    read: false,
    link: '/demand-inventory',
    ref: `Medicine · ${medicineNameById('MED-0001')} (Delhi)`,
  },
  {
    id: 'ntf-2',
    title: 'Warning · Expiry',
    message: `300 units of ${medicineNameById('MED-0002')} expire in 15 days in Mumbai.`,
    category: 'Warning',
    time: '2026-08-15T07:30:00',
    read: false,
    link: '/expiry',
    ref: `Medicine · ${medicineNameById('MED-0002')} (Mumbai)`,
  },
  {
    id: 'ntf-3',
    title: 'Invoice · Verified',
    message: `INV-20452 verified for PO-10452 — 200 of 380 ${medicineNameById('MED-0001')} units received.`,
    category: 'Invoice',
    time: '2026-08-15T07:00:00',
    read: false,
    link: '/purchase-orders',
    ref: 'PO-10452 · INV-20452',
  },
  {
    id: 'ntf-4',
    title: 'Procurement · Created',
    message: `PO-10452 has been successfully created for ${medicineNameById('MED-0001')}.`,
    category: 'Procurement',
    time: '2026-08-15T10:45:00',
    read: true,
    link: '/purchase-orders',
    ref: 'PO-10452',
  },
  {
    id: 'ntf-5',
    title: 'System · 3-Way Match',
    message: 'PO-10452 matched partially — invoice INV-20452 agrees with the 200 units received.',
    category: 'System',
    time: '2026-08-15T06:20:00',
    read: true,
    link: '/purchase-orders',
    ref: 'PO-10452',
  },
  {
    id: 'ntf-6',
    title: 'Warning · Supplier',
    message: 'Gland Chemicals Pvt. Ltd. requires supplier verification before any order can be placed.',
    category: 'Warning',
    time: '2026-08-14T17:00:00',
    read: true,
    link: '/suppliers',
    ref: 'Supplier · Gland Chemicals Pvt. Ltd.',
  },
  {
    id: 'ntf-7',
    title: 'Retailer Onboarding · Received',
    message: 'New retailer onboarding application received from ABC Pharmacy (ABC Healthcare Pvt Ltd).',
    category: 'System',
    time: '2026-08-16T09:12:00',
    read: false,
    link: '/retailers',
    ref: 'Application · RAPP-1007',
  },
  {
    id: 'ntf-8',
    title: 'Retailer Onboarding · Document',
    message: 'City Pharmacy (City Healthcare) — GST certificate rejected: GSTIN does not match the registered business name.',
    category: 'Warning',
    time: '2026-08-15T10:15:00',
    read: false,
    link: '/retailers?filter=Documents Required',
    ref: 'Application · RAPP-1005',
  },
];

export const alerts: Alert[] = [
  {
    id: 'al-1',
    title: `${medicineNameById('MED-0001')} — Delhi`,
    description: 'Predicted stock-out in 4 days',
    severity: 'critical',
    meta: [
      { label: 'Current stock', value: '120 units' },
      { label: 'Predicted demand', value: '480 units' },
      { label: 'Recommended procurement', value: '360 units' },
    ],
    actions: [
      { label: 'Review Recommendation', type: 'secondary' },
      { label: 'Create PO', type: 'primary' },
    ],
    link: '/replenishment',
    actionLinks: {
      'Create PO':
        `/purchase-orders?open=1&supplier=Aurobindo Pharma Limited&material=${medicineNameById('MED-0001')}&qty=360&location=Delhi&ai=1`,
      'Review Recommendation': '/replenishment',
    },
  },
  {
    id: 'al-2',
    title: `${medicineNameById('MED-0002')} — Mumbai`,
    description: '300 units expire in 15 days',
    severity: 'warning',
    meta: [
      { label: 'Batch', value: 'FX-2281' },
      { label: 'Value at risk', value: '₹30,000' },
      { label: 'Recommended action', value: 'Prioritize dispatch' },
    ],
    actions: [{ label: 'Manage Expiry', type: 'secondary' }],
    link: '/expiry',
  },
  {
    id: 'al-3',
    title: 'PO-10452 — Partially Fulfilled',
    description: `200 of 380 ${medicineNameById('MED-0001')} units received · 180 pending delivery`,
    severity: 'info',
    meta: [
      { label: 'Received', value: '200 units' },
      { label: 'Pending', value: '180 units' },
      { label: 'Fulfillment', value: '53%' },
    ],
    actions: [{ label: 'View PO', type: 'secondary' }],
    link: '/purchase-orders',
  },
  {
    id: 'al-4',
    title: `PO-10449 — ${medicineNameById('MED-0018')}`,
    description: 'Supplier delay risk flagged',
    severity: 'warning',
    meta: [
      { label: 'Supplier', value: 'Lee Pharma Limited' },
      { label: 'Expected delivery', value: 'Aug 28' },
      { label: 'Risk', value: 'Medium' },
    ],
    actions: [{ label: 'View PO', type: 'secondary' }],
    link: '/purchase-orders',
  },
  {
    id: 'al-5',
    title: 'Payment approval pending',
    description: '₹21,000 payable for the 200 units delivered (INV-20452)',
    severity: 'info',
    meta: [
      { label: 'Invoice', value: 'INV-20452' },
      { label: 'Supplier', value: 'Aurobindo Pharma Limited' },
      { label: 'Recommendation', value: 'Approve' },
    ],
    actions: [{ label: 'Review Payment', type: 'secondary' }],
    link: '/payments',
  },
];

export interface ForecastPoint {
  label: string;
  historical: number;
  predicted: number;
}

export const demandForecast: ForecastPoint[] = [
  { label: 'W-12', historical: 180, predicted: 180 },
  { label: 'W-11', historical: 195, predicted: 195 },
  { label: 'W-10', historical: 175, predicted: 175 },
  { label: 'W-9', historical: 210, predicted: 210 },
  { label: 'W-8', historical: 225, predicted: 225 },
  { label: 'W-7', historical: 240, predicted: 240 },
  { label: 'W-6', historical: 230, predicted: 230 },
  { label: 'W-5', historical: 260, predicted: 260 },
  { label: 'W-4', historical: 275, predicted: 275 },
  { label: 'W-3', historical: 290, predicted: 290 },
  { label: 'W-2', historical: 300, predicted: 300 },
  { label: 'W-1', historical: 320, predicted: 320 },
  { label: 'This week', historical: 300, predicted: 360 },
  { label: '+1 wk', historical: null as unknown as number, predicted: 420 },
  { label: '+2 wk', historical: null as unknown as number, predicted: 480 },
  { label: '+3 wk', historical: null as unknown as number, predicted: 445 },
  { label: '+4 wk', historical: null as unknown as number, predicted: 410 },
];

export const procurementPipeline = [
  {
    stage: 'REQUEST',
    label: 'Material Request',
    count: 6,
    detail: 'MR-1034 approved · MR-1035 under review',
  },
  { stage: 'PREDICT', label: 'Demand Forecast', count: 12, detail: '3 items forecasted to spike' },
  { stage: 'PLAN', label: 'Replenishment Plan', count: 5, detail: `360 units recommended · ${medicineNameById('MED-0001')}` },
  { stage: 'PROCURE', label: 'Supplier & PO', count: 4, detail: 'PO-10452 · Aurobindo Pharma' },
  { stage: 'RECEIVE', label: 'Material Receipt', count: 3, detail: `CV-confirmed · ${medicineNameById('MED-0002')} received` },
  { stage: 'VERIFY', label: 'OCR Invoice', count: 2, detail: 'INV-20451 verified · 99% confidence' },
  { stage: 'MATCH', label: '3-Way Matching', count: 2, detail: '1 match successful · 1 anomaly' },
  { stage: 'PAY', label: 'Payment Approval', count: 2, detail: '₹20,160 ready to approve' },
  { stage: 'ANALYZE', label: 'P2P Analytics', count: 1, detail: '78% automation this quarter' },
];

export const monthlySpend = [
  { month: 'Feb', spend: 1280000, automated: 860000 },
  { month: 'Mar', spend: 1410000, automated: 1000000 },
  { month: 'Apr', spend: 1350000, automated: 980000 },
  { month: 'May', spend: 1520000, automated: 1150000 },
  { month: 'Jun', spend: 1480000, automated: 1210000 },
  { month: 'Jul', spend: 1680000, automated: 1390000 },
  { month: 'Aug', spend: 1810000, automated: 1540000 },
];

export const supplierPerformance = [
  { name: 'Aurobindo Pharma', quality: 98, onTime: 96, cost: 92 },
  { name: 'Akums Drugs', quality: 96, onTime: 93, cost: 90 },
  { name: 'Lee Pharma', quality: 93, onTime: 90, cost: 85 },
  { name: 'Centaur Pharma', quality: 93, onTime: 90, cost: 86 },
  { name: 'Gland Chemicals', quality: 0, onTime: 0, cost: 0 },
];

export const cycleTime = [
  { step: 'Request', days: 1.2 },
  { step: 'PO', days: 2.4 },
  { step: 'Receipt', days: 5.1 },
  { step: 'Invoice', days: 1.8 },
  { step: 'Payment', days: 2.6 },
];

export const invoiceAnomalyTrend = [
  { month: 'Mar', anomalies: 14 },
  { month: 'Apr', anomalies: 11 },
  { month: 'May', anomalies: 9 },
  { month: 'Jun', anomalies: 6 },
  { month: 'Jul', anomalies: 5 },
  { month: 'Aug', anomalies: 3 },
];

export const stockOutRiskTrend = [
  { label: 'Aug 1', risk: 3 },
  { label: 'Aug 3', risk: 4 },
  { label: 'Aug 5', risk: 4 },
  { label: 'Aug 7', risk: 5 },
  { label: 'Aug 9', risk: 4 },
  { label: 'Aug 11', risk: 5 },
  { label: 'Aug 13', risk: 4 },
  { label: 'Aug 15', risk: 5 },
];

export const inventoryTrend = [
  { label: 'Aug 1', value: 2340 },
  { label: 'Aug 3', value: 2280 },
  { label: 'Aug 5', value: 2410 },
  { label: 'Aug 7', value: 2290 },
  { label: 'Aug 9', value: 2205 },
  { label: 'Aug 11', value: 2140 },
  { label: 'Aug 13', value: 2090 },
  { label: 'Aug 15', value: 2065 },
];

export const pipelineData = [
  { stage: 'Requested', count: 4 },
  { stage: 'PO Created', count: 6 },
  { stage: 'Received', count: 3 },
  { stage: 'Invoiced', count: 3 },
  { stage: 'Matched', count: 2 },
  { stage: 'Paid', count: 2 },
];

export const chatSuggestions = [
  `Create a request for 500 ${medicineNameById('MED-0001')} units in Delhi`,
  'Check current inventory levels',
  'What is the status of PO-10452?',
  'Show near-expiry items',
  'Why was invoice INV-20452 flagged?',
  'How does 3-way matching work?',
];
