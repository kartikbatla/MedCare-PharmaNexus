export type MigrationStatus =
  | 'Not Started'
  | 'Assessment'
  | 'Extraction'
  | 'Transformation'
  | 'Validation'
  | 'Loading'
  | 'Completed'
  | 'Action Required';

export type SystemType =
  | 'ERP'
  | 'Accounting Software'
  | 'Pharmacy Management Software'
  | 'Excel / CSV'
  | 'Local Database'
  | 'Paper Records'
  | 'Other';

export type ExtractionMethod = 'OCR' | 'CSV / File Import' | 'API / ERP Connector' | 'Database Extractor';

export type DataCategory =
  | 'Historical Invoices'
  | 'Purchase Orders'
  | 'Supplier Records'
  | 'Medicine/Product Records'
  | 'Payment Records'
  | 'Customer/Retailer Records'
  | 'Inventory History'
  | 'Tax Records';

export type RecordStatus = 'Confirmed' | 'Requires Review' | 'Rejected' | 'Duplicate';

export type DuplicateResolution = 'Keep Both' | 'Mark Duplicate' | 'Review';

export type MatchResolution = 'Map to Existing' | 'Create New';

export interface ExtractorConfig {
  dataSource: string;
  dataType: DataCategory;
  method: ExtractionMethod;
  dateFrom: string;
  dateTo: string;
  recordEstimate: string;
  tested?: boolean;
  testedAt?: string;
}

export interface OcrStats {
  uploaded: number;
  read: number;
  needsReview: number;
  failed: number;
  processedAt?: string;
}

export interface OcrField {
  field: string;
  value: string;
  confidence: number;
}

export interface OcrRecord {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string;
  amount: string;
  status: RecordStatus;
  needsReview: boolean;
  confidence: number;
  fields: OcrField[];
}

export interface DuplicateRecord {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string;
  amount: string;
  status: DuplicateResolution | 'Requires Review';
}

export interface MappingItem {
  legacyField: string;
  targetField: string;
  method: 'Direct' | 'Transform' | 'Review';
}

export interface ExistingRecordMatch {
  id: string;
  type: 'Supplier' | 'Medicine';
  legacyName: string;
  matchName: string;
  status: MatchResolution | 'Unresolved';
}

export interface MigrationAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
}

export interface MigrationProgress {
  percent: number;
  invoices: { total: number; migrated: number; remaining: number };
  suppliers: { total: number; mapped: number; review: number };
  products: { total: number; mapped: number; review: number };
  errors: number;
  duplicates: number;
}

export interface Migration {
  retailerId: string;
  status: MigrationStatus;
  stage: number;
  systemType?: SystemType;
  systemName?: string;
  dataTypes: DataCategory[];
  extractor?: ExtractorConfig;
  ocr?: OcrStats;
  ocrRecords?: OcrRecord[];
  duplicates?: DuplicateRecord[];
  mapping?: MappingItem[];
  matches?: ExistingRecordMatch[];
  skipped?: boolean;
  progress: MigrationProgress;
  audit: MigrationAuditEntry[];
  startedAt?: string;
  completedAt?: string;
  importedCount?: number;
  importedAt?: string;
}

export const MIGRATION_STAGES = [
  'Understand Current System',
  'Configure Extractors',
  'Extract Data',
  'Transform & Validate',
  'Load Into PharmaNexus',
  'Migration Verification',
];

export const SYSTEM_TYPES: SystemType[] = [
  'ERP',
  'Accounting Software',
  'Pharmacy Management Software',
  'Excel / CSV',
  'Local Database',
  'Paper Records',
  'Other',
];

export const DATA_TYPES: DataCategory[] = [
  'Historical Invoices',
  'Purchase Orders',
  'Supplier Records',
  'Medicine/Product Records',
  'Payment Records',
  'Customer/Retailer Records',
  'Inventory History',
  'Tax Records',
];

export const METHOD_HINTS: Record<SystemType, string> = {
  'Excel / CSV': 'Upload Files',
  'Local Database': 'Configure Database Extractor',
  ERP: 'ERP Connector / API',
  'Accounting Software': 'Connector / Export Import',
  'Paper Records': 'OCR Migration',
  'Pharmacy Management Software': 'API / ERP Connector',
  Other: 'File Import',
};

export const MAPPING_ROWS: MappingItem[] = [
  { legacyField: 'vendor_name', targetField: 'Supplier Name', method: 'Direct' },
  { legacyField: 'invoice_no', targetField: 'Invoice Number', method: 'Direct' },
  { legacyField: 'invoice_date', targetField: 'Invoice Date', method: 'Transform' },
  { legacyField: 'product_name', targetField: 'Medicine', method: 'Transform' },
  { legacyField: 'strength', targetField: 'Strength', method: 'Transform' },
  { legacyField: 'dosage_form', targetField: 'Dosage Form', method: 'Transform' },
  { legacyField: 'qty', targetField: 'Quantity', method: 'Direct' },
  { legacyField: 'unit_price', targetField: 'Unit Price', method: 'Direct' },
  { legacyField: 'gst_amount', targetField: 'GST', method: 'Direct' },
  { legacyField: 'freight', targetField: 'Logistics / Freight', method: 'Direct' },
  { legacyField: 'other_charges', targetField: 'Other Fees', method: 'Direct' },
  { legacyField: 'total', targetField: 'Total Amount', method: 'Direct' },
  { legacyField: 'payment_status', targetField: 'Payment Status', method: 'Transform' },
];

export function migrationProgress(p: MigrationProgress): MigrationProgress {
  return { ...p, percent: Math.max(0, Math.min(100, Math.round(p.percent))) };
}

export function defaultProgress(totalInvoices: number, totalSuppliers: number, totalProducts: number): MigrationProgress {
  return {
    percent: 0,
    invoices: { total: totalInvoices, migrated: 0, remaining: totalInvoices },
    suppliers: { total: totalSuppliers, mapped: 0, review: totalSuppliers },
    products: { total: totalProducts, mapped: 0, review: totalProducts },
    errors: 0,
    duplicates: 0,
  };
}

const STORAGE_KEY = 'pharmanexus-migrations-v1';
let cache: Migration[] | null = null;

export function loadMigrations(): Migration[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Migration[]) : seedMigrations();
  } catch {
    cache = seedMigrations();
  }
  return cache;
}

export function saveMigrations(list: Migration[]) {
  cache = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    cache = null;
  }
}

export function migrationFor(retailerId: string): Migration | undefined {
  return loadMigrations().find((m) => m.retailerId === retailerId);
}

export function seedMigrations(): Migration[] {
  return [
    {
      retailerId: 'careplus',
      status: 'Completed',
      stage: 6,
      systemType: 'Accounting Software',
      systemName: 'Tally Prime',
      dataTypes: ['Historical Invoices', 'Supplier Records', 'Medicine/Product Records', 'Inventory History', 'Tax Records'],
      extractor: {
        dataSource: 'Tally Prime (Existing accounting system)',
        dataType: 'Historical Invoices',
        method: 'API / ERP Connector',
        dateFrom: '01 Jan 2023',
        dateTo: '31 Dec 2025',
        recordEstimate: 'Approximately 4,500 invoices',
        tested: true,
        testedAt: '16 Aug 2026, 09:45 AM',
      },
      ocr: { uploaded: 500, read: 487, needsReview: 13, failed: 0, processedAt: '16 Aug 2026, 10:12 AM' },
      progress: {
        percent: 100,
        invoices: { total: 4474, migrated: 4474, remaining: 0 },
        suppliers: { total: 125, mapped: 125, review: 0 },
        products: { total: 2100, mapped: 2100, review: 0 },
        errors: 0,
        duplicates: 8,
      },
      startedAt: '16 Aug 2026, 09:30 AM',
      completedAt: '16 Aug 2026, 11:04 AM',
      importedCount: 4474,
      importedAt: '16 Aug 2026, 11:04 AM',
      audit: [
        { id: 'ma5', timestamp: '16 Aug 2026, 11:04 AM', action: '4,474 records loaded into PharmaNexus.', actor: 'Anita Sharma' },
        { id: 'ma4', timestamp: '16 Aug 2026, 10:55 AM', action: '4,474 records validated and confirmed.', actor: 'Anita Sharma' },
        { id: 'ma3', timestamp: '16 Aug 2026, 10:12 AM', action: 'OCR completed — 487 invoices read, 13 flagged for review.', actor: 'System' },
        { id: 'ma2', timestamp: '16 Aug 2026, 09:45 AM', action: '4,500 invoices extracted from Tally Prime.', actor: 'System' },
        { id: 'ma1', timestamp: '16 Aug 2026, 09:30 AM', action: 'Migration started.', actor: 'Anita Sharma' },
      ],
    },
    {
      retailerId: 'greenlife',
      status: 'Action Required',
      stage: 3,
      systemType: 'Pharmacy Management Software',
      systemName: 'MedPlus Retail Suite',
      dataTypes: ['Historical Invoices', 'Supplier Records', 'Medicine/Product Records', 'Payment Records'],
      extractor: {
        dataSource: 'MedPlus Retail Suite (Pharmacy management system)',
        dataType: 'Historical Invoices',
        method: 'API / ERP Connector',
        dateFrom: '01 Jan 2024',
        dateTo: '31 Dec 2025',
        recordEstimate: 'Approximately 2,300 invoices',
        tested: true,
        testedAt: '16 Aug 2026, 02:10 PM',
      },
      ocr: { uploaded: 300, read: 289, needsReview: 11, failed: 0, processedAt: '16 Aug 2026, 02:31 PM' },
      progress: {
        percent: 58,
        invoices: { total: 2300, migrated: 0, remaining: 2300 },
        suppliers: { total: 62, mapped: 58, review: 4 },
        products: { total: 980, mapped: 940, review: 40 },
        errors: 3,
        duplicates: 2,
      },
      startedAt: '16 Aug 2026, 02:00 PM',
      audit: [
        { id: 'gm3', timestamp: '16 Aug 2026, 02:31 PM', action: 'OCR completed — 289 invoices read, 11 flagged for review.', actor: 'System' },
        { id: 'gm2', timestamp: '16 Aug 2026, 02:10 PM', action: '2,300 invoices extracted.', actor: 'System' },
        { id: 'gm1', timestamp: '16 Aug 2026, 02:00 PM', action: 'Migration started.', actor: 'Anita Sharma' },
      ],
    },
  ];
}
