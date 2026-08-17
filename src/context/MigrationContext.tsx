import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  loadMigrations,
  saveMigrations,
  MAPPING_ROWS,
  defaultProgress,
  type DataCategory,
  type DuplicateResolution,
  type ExtractorConfig,
  type MappingItem,
  type MatchResolution,
  type Migration,
  type MigrationAuditEntry,
  type OcrField,
  type OcrRecord,
  type RecordStatus,
  type SystemType,
} from '../data/migration';

const AUDITOR = 'Anita Sharma';

function nowStamp(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${mm} ${ampm}`;
}

function nextAuditId(m: Migration): number {
  return m.audit.reduce((max, a) => {
    const n = Number(a.id.replace(/[^0-9]/g, ''));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;
}

function auditAppend(m: Migration, action: string, actor = AUDITOR): Migration {
  const entry: MigrationAuditEntry = { id: `m-${nextAuditId(m)}`, timestamp: nowStamp(), action, actor };
  return { ...m, audit: [entry, ...m.audit] };
}

function recalc(m: Migration): Migration {
  const invoices = m.progress.invoices;
  const total = invoices.total;
  const migrated = invoices.migrated;
  const remaining = Math.max(0, total - migrated);
  const percent = Math.min(99, Math.round((migrated / (total || 1)) * 100));
  return { ...m, progress: { ...m.progress, invoices: { ...invoices, remaining }, percent } };
}

function seedOcrRecords(): OcrRecord[] {
  const statuses: RecordStatus[] = ['Confirmed', 'Confirmed', 'Confirmed', 'Confirmed', 'Requires Review', 'Confirmed', 'Confirmed', 'Requires Review', 'Confirmed', 'Rejected'];
  const recs: OcrRecord[] = [];
  const rows: Array<{ inv: string; sup: string; date: string; amount: string; conf: number }> = [
    { inv: 'INV-2024-0001', sup: 'MedPlus Distributors Pvt Ltd', date: '02 Jan 2024', amount: '₹ 1,84,320', conf: 0.98 },
    { inv: 'INV-2024-0002', sup: 'Ravichandran Distributors', date: '05 Jan 2024', amount: '₹ 96,540', conf: 0.97 },
    { inv: 'INV-2024-0003', sup: 'Krishna Pharma Wholesale', date: '09 Jan 2024', amount: '₹ 2,10,875', conf: 0.96 },
    { inv: 'INV-2024-0004', sup: 'MedPlus Distributors Pvt Ltd', date: '12 Jan 2024', amount: '₹ 1,48,220', conf: 0.99 },
    { inv: 'INV-2024-0005', sup: 'Sunrise Distributors', date: '18 Jan 2024', amount: '₹ 1,12,000', conf: 0.84 },
    { inv: 'INV-2024-0006', sup: 'Balaji Medical Agency', date: '22 Jan 2024', amount: '₹ 88,940', conf: 0.97 },
    { inv: 'INV-2024-0007', sup: 'MedPlus Distributors Pvt Ltd', date: '28 Jan 2024', amount: '₹ 1,63,710', conf: 0.95 },
    { inv: 'INV-2024-0008', sup: 'Wellness Pharma Supplies', date: '03 Feb 2024', amount: '₹ 1,27,450', conf: 0.81 },
    { inv: 'INV-2024-0009', sup: 'Krishna Pharma Wholesale', date: '08 Feb 2024', amount: '₹ 2,02,660', conf: 0.98 },
    { inv: 'INV-2024-0010', sup: 'Ravichandran Distributors', date: '15 Feb 2024', amount: '₹ 75,890', conf: 0.99 },
  ];
  const fieldsets: OcrField[][] = [
    [
      { field: 'Invoice Number', value: 'INV-2024-0001', confidence: 1 },
      { field: 'Supplier Name', value: 'MedPlus Distributors Pvt Ltd', confidence: 0.99 },
      { field: 'Invoice Date', value: '02 Jan 2024', confidence: 0.98 },
      { field: 'Medicine Name', value: 'Paracetamol 500mg', confidence: 0.97 },
      { field: 'Quantity', value: '480', confidence: 0.98 },
      { field: 'Amount', value: '₹ 1,84,320', confidence: 0.99 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0002', confidence: 1 },
      { field: 'Supplier Name', value: 'Ravichandran Distributors', confidence: 0.98 },
      { field: 'Invoice Date', value: '05 Jan 2024', confidence: 0.96 },
      { field: 'Medicine Name', value: 'Amoxicillin 250mg', confidence: 0.95 },
      { field: 'Quantity', value: '600', confidence: 0.97 },
      { field: 'Amount', value: '₹ 96,540', confidence: 0.98 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0003', confidence: 1 },
      { field: 'Supplier Name', value: 'Krishna Pharma Wholesale', confidence: 0.97 },
      { field: 'Invoice Date', value: '09 Jan 2024', confidence: 0.95 },
      { field: 'Medicine Name', value: 'Azithromycin 500mg', confidence: 0.94 },
      { field: 'Quantity', value: '420', confidence: 0.96 },
      { field: 'Amount', value: '₹ 2,10,875', confidence: 0.97 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0004', confidence: 1 },
      { field: 'Supplier Name', value: 'MedPlus Distributors Pvt Ltd', confidence: 0.99 },
      { field: 'Invoice Date', value: '12 Jan 2024', confidence: 0.99 },
      { field: 'Medicine Name', value: 'Metformin 500mg', confidence: 0.98 },
      { field: 'Quantity', value: '720', confidence: 0.97 },
      { field: 'Amount', value: '₹ 1,48,220', confidence: 0.99 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0005', confidence: 0.92 },
      { field: 'Supplier Name', value: 'Sunrise Distributors', confidence: 0.88 },
      { field: 'Invoice Date', value: '18 Jan 2024', confidence: 0.9 },
      { field: 'Medicine Name', value: 'Cefixime 200mg', confidence: 0.8 },
      { field: 'Quantity', value: '300', confidence: 0.86 },
      { field: 'Amount', value: '₹ 1,12,000', confidence: 0.88 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0006', confidence: 1 },
      { field: 'Supplier Name', value: 'Balaji Medical Agency', confidence: 0.98 },
      { field: 'Invoice Date', value: '22 Jan 2024', confidence: 0.97 },
      { field: 'Medicine Name', value: 'Omeprazole 20mg', confidence: 0.95 },
      { field: 'Quantity', value: '540', confidence: 0.98 },
      { field: 'Amount', value: '₹ 88,940', confidence: 0.97 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0007', confidence: 1 },
      { field: 'Supplier Name', value: 'MedPlus Distributors Pvt Ltd', confidence: 0.99 },
      { field: 'Invoice Date', value: '28 Jan 2024', confidence: 0.98 },
      { field: 'Medicine Name', value: 'Dolo 650mg', confidence: 0.96 },
      { field: 'Quantity', value: '880', confidence: 0.97 },
      { field: 'Amount', value: '₹ 1,63,710', confidence: 0.98 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0008', confidence: 0.85 },
      { field: 'Supplier Name', value: 'Wellness Pharma Supplies', confidence: 0.82 },
      { field: 'Invoice Date', value: '03 Feb 2024', confidence: 0.86 },
      { field: 'Medicine Name', value: 'Amlodipine 5mg', confidence: 0.78 },
      { field: 'Quantity', value: '410', confidence: 0.8 },
      { field: 'Amount', value: '₹ 1,27,450', confidence: 0.85 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0009', confidence: 1 },
      { field: 'Supplier Name', value: 'Krishna Pharma Wholesale', confidence: 0.98 },
      { field: 'Invoice Date', value: '08 Feb 2024', confidence: 0.98 },
      { field: 'Medicine Name', value: 'Pantoprazole 40mg', confidence: 0.96 },
      { field: 'Quantity', value: '510', confidence: 0.97 },
      { field: 'Amount', value: '₹ 2,02,660', confidence: 0.98 },
    ],
    [
      { field: 'Invoice Number', value: 'INV-2024-0010', confidence: 1 },
      { field: 'Supplier Name', value: 'Ravichandran Distributors', confidence: 0.99 },
      { field: 'Invoice Date', value: '15 Feb 2024', confidence: 0.99 },
      { field: 'Medicine Name', value: 'Vitamin D3 60000', confidence: 0.97 },
      { field: 'Quantity', value: '360', confidence: 0.98 },
      { field: 'Amount', value: '₹ 75,890', confidence: 0.99 },
    ],
  ];
  rows.forEach((row, i) => {
    recs.push({
      id: `ocr-${i + 1}`,
      invoiceNumber: row.inv,
      supplier: row.sup,
      date: row.date,
      amount: row.amount,
      status: statuses[i],
      needsReview: statuses[i] === 'Requires Review',
      confidence: row.conf,
      fields: fieldsets[i],
    });
  });
  return recs;
}

function seedMapping(): MappingItem[] {
  return MAPPING_ROWS.map((row) => ({ ...row }));
}

interface MigrationContextValue {
  migrations: Migration[];
  migrationForRetailer: (retailerId: string) => Migration | undefined;
  startMigration: (retailerId: string) => void;
  skipMigration: (retailerId: string) => void;
  resumeMigration: (retailerId: string) => void;
  saveAssessment: (retailerId: string, systemType: SystemType, systemName: string, dataTypes: DataCategory[]) => void;
  saveExtractor: (retailerId: string, config: ExtractorConfig) => void;
  testExtractor: (retailerId: string) => void;
  runExtraction: (retailerId: string) => void;
  runOcr: (retailerId: string, uploaded: number) => void;
  updateOcrRecord: (retailerId: string, recordId: string, status: RecordStatus) => void;
  resolveDuplicate: (retailerId: string, recordId: string, resolution: DuplicateResolution) => void;
  resolveMatch: (retailerId: string, matchId: string, resolution: MatchResolution) => void;
  updateMapping: (retailerId: string, index: number, patch: Partial<MappingItem>) => void;
  importRecords: (retailerId: string) => void;
  stageNext: (retailerId: string) => void;
}

const MigrationContext = createContext<MigrationContextValue | null>(null);

export function MigrationProvider({ children }: { children: ReactNode }) {
  const [migrations, setMigrations] = useState<Migration[]>(() => loadMigrations());

  const commit = (next: Migration[]) => {
    saveMigrations(next);
    setMigrations(next);
  };

  const updateOne = (retailerId: string, updater: (m: Migration) => Migration) => {
    const next = migrations.map((m) => (m.retailerId === retailerId ? updater(m) : m));
    commit(next);
  };

  const migrationForRetailer = (retailerId: string) => migrations.find((m) => m.retailerId === retailerId);

  const startMigration = (retailerId: string) => {
    const existing = migrations.find((m) => m.retailerId === retailerId);
    if (existing) {
      updateOne(retailerId, (m) => auditAppend({ ...m, skipped: false }, 'Migration resumed.'));
      return;
    }
    const fresh: Migration = {
      retailerId,
      status: 'Assessment',
      stage: 1,
      systemType: undefined,
      systemName: '',
      dataTypes: [],
      skipped: false,
      progress: defaultProgress(4487, 125, 2100),
      audit: [{ id: 'm-1', timestamp: nowStamp(), action: 'Migration started.', actor: AUDITOR }],
      startedAt: nowStamp(),
    };
    commit([fresh, ...migrations]);
  };

  const skipMigration = (retailerId: string) => {
    const existing = migrations.find((m) => m.retailerId === retailerId);
    const skipped: Migration = existing
      ? { ...existing, skipped: true }
      : {
          retailerId,
          status: 'Not Started',
          stage: 0,
          dataTypes: [],
          skipped: true,
          progress: defaultProgress(4487, 125, 2100),
          audit: [],
        };
    const next = [skipped, ...migrations.filter((m) => m.retailerId !== retailerId)];
    commit(next);
  };

  const resumeMigration = (retailerId: string) => {
    updateOne(retailerId, (m) => ({ ...m, skipped: false, status: m.stage >= 1 ? m.status : 'Assessment' }));
  };

  const saveAssessment = (retailerId: string, systemType: SystemType, systemName: string, dataTypes: DataCategory[]) => {
    updateOne(retailerId, (m) =>
      auditAppend({ ...m, systemType, systemName, dataTypes }, `Current system assessment saved (${systemName || systemType}).`),
    );
  };

  const saveExtractor = (retailerId: string, config: ExtractorConfig) => {
    updateOne(retailerId, (m) => auditAppend({ ...m, extractor: config }, `Extractor configuration saved (${config.method}).`));
  };

  const testExtractor = (retailerId: string) => {
    updateOne(retailerId, (m) => {
      const extractor = m.extractor ? { ...m.extractor, tested: true, testedAt: nowStamp() } : undefined;
      return auditAppend({ ...m, extractor }, 'Extractor test successful — connection verified.');
    });
  };

  const runExtraction = (retailerId: string) => {
    updateOne(retailerId, (m) => auditAppend({ ...m, status: 'Extraction', stage: 3 }, 'Extraction completed — records pulled from source system.'));
  };

  const runOcr = (retailerId: string, uploaded: number) => {
    updateOne(retailerId, (m) => {
      const needsReview = 13;
      const read = Math.max(0, uploaded - needsReview);
      const ocr = { uploaded, read, needsReview, failed: 0, processedAt: nowStamp() };
      return auditAppend({ ...m, ocr, ocrRecords: seedOcrRecords(), status: 'Extraction', stage: 3 }, `OCR completed — ${read} invoices read, ${needsReview} flagged for review.`);
    });
  };

  const updateOcrRecord = (retailerId: string, recordId: string, status: RecordStatus) => {
    updateOne(retailerId, (m) => {
      const ocrRecords = m.ocrRecords?.map((r) => (r.id === recordId ? { ...r, status, needsReview: status === 'Requires Review' } : r));
      const label = m.ocrRecords?.find((r) => r.id === recordId)?.invoiceNumber ?? 'record';
      return auditAppend({ ...m, ocrRecords }, `Invoice ${label} marked as ${status}.`);
    });
  };

  const resolveDuplicate = (retailerId: string, recordId: string, resolution: DuplicateResolution) => {
    updateOne(retailerId, (m) => {
      const duplicates = m.duplicates?.map((d) => (d.id === recordId ? { ...d, status: resolution } : d));
      const label = m.duplicates?.find((d) => d.id === recordId)?.invoiceNumber ?? 'duplicate';
      return auditAppend({ ...m, duplicates }, `Duplicate invoice ${label} resolved — ${resolution}.`);
    });
  };

  const resolveMatch = (retailerId: string, matchId: string, resolution: MatchResolution) => {
    updateOne(retailerId, (m) => {
      const matches = m.matches?.map((x) => (x.id === matchId ? { ...x, status: resolution } : x));
      const label = m.matches?.find((x) => x.id === matchId)?.legacyName ?? 'record';
      return auditAppend({ ...m, matches }, `Existing record match for "${label}" resolved — ${resolution}.`);
    });
  };

  const updateMapping = (retailerId: string, index: number, patch: Partial<MappingItem>) => {
    updateOne(retailerId, (m) => {
      const mapping = m.mapping?.map((row, i) => (i === index ? { ...row, ...patch } : row)) ?? seedMapping();
      return auditAppend({ ...m, mapping }, `Field mapping updated (${mapping[index]?.legacyField} → ${patch.targetField ?? mapping[index]?.targetField}).`);
    });
  };

  const stageNext = (retailerId: string) => {
    updateOne(retailerId, (m) => {
      const stage = m.stage + 1;
      const statusMap: Record<number, Migration['status']> = { 1: 'Assessment', 2: 'Extraction', 3: 'Extraction', 4: 'Transformation', 5: 'Validation' };
      return { ...m, stage, status: statusMap[stage] ?? m.status };
    });
  };

  const importRecords = (retailerId: string) => {
    updateOne(retailerId, (m) => {
      const invoices = m.progress.invoices;
      const products = m.progress.products;
      const suppliers = m.progress.suppliers;
      const ready = m.ocr?.read ?? invoices.total;
      const confirmed = ready - (m.ocr?.needsReview ?? 0);
      const progress = recalc({
        ...m,
        progress: {
          ...m.progress,
          invoices: { total: invoices.total, migrated: confirmed, remaining: Math.max(0, invoices.total - confirmed) },
          suppliers: { total: suppliers.total, mapped: suppliers.total, review: 0 },
          products: { total: products.total, mapped: products.total, review: 0 },
          errors: 0,
          duplicates: m.duplicates?.filter((d) => d.status === 'Mark Duplicate').length ?? 0,
        },
      });
      return auditAppend(
        { ...progress, status: 'Completed', stage: 6, importedCount: confirmed, importedAt: nowStamp(), completedAt: nowStamp() },
        `${confirmed} records loaded into PharmaNexus. Migration complete.`,
      );
    });
  };

  return (
    <MigrationContext.Provider
      value={{
        migrations,
        migrationForRetailer,
        startMigration,
        skipMigration,
        resumeMigration,
        saveAssessment,
        saveExtractor,
        testExtractor,
        runExtraction,
        runOcr,
        updateOcrRecord,
        resolveDuplicate,
        resolveMatch,
        updateMapping,
        importRecords,
        stageNext,
      }}
    >
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigrations(): MigrationContextValue {
  const ctx = useContext(MigrationContext);
  if (!ctx) throw new Error('useMigrations must be used within MigrationProvider');
  return ctx;
}
