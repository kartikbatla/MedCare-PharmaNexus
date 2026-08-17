import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  FileSpreadsheet,
  FileUp,
  History,
  Loader2,
  Plug,
  RefreshCw,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import {
  ConfidencePill,
  DuplicateBadge,
  MatchBadge,
  MigrationBadge,
  RecordBadge,
  SourceBadge,
  StageIndicator,
} from '../components/migration/MigrationBadges';
import { useMigrations } from '../context/MigrationContext';
import { useRetailers } from '../context/RetailerContext';
import { useToast } from '../context/ToastContext';
import {
  DATA_TYPES,
  MAPPING_ROWS,
  METHOD_HINTS,
  SYSTEM_TYPES,
  type DataCategory,
  type DuplicateResolution,
  type MatchResolution,
  type Migration,
  type RecordStatus,
  type SystemType,
} from '../data/migration';
import { cn } from '../lib/utils';

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-brand-navy/8">
      <div className="h-full rounded-full bg-status-success transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <Card className="p-5">{children}</Card>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[13px] font-semibold tracking-tight text-brand-charcoal">{children}</h3>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11.5px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{label}</p>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-[13.5px] text-brand-charcoal outline-none transition focus:border-brand-navy/40 focus:ring-2 focus:ring-brand-navy/10';

export default function MigrationPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { retailerById } = useRetailers();
  const { migrationForRetailer } = useMigrations();

  const r = retailerById(id ?? '');
  const m = migrationForRetailer(id ?? '');

  if (!r) {
    return (
      <div className="space-y-6">
        <PageHeader title="Data Migration" subtitle="Retailer not found." />
        <Card>
          <EmptyState title="Retailer not found" message="This retailer may have been removed or the link is invalid." />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/retailers/${r.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-muted transition hover:text-brand-navy">
          <ArrowLeft className="h-4 w-4" />
          Back to {r.business.tradeName}
        </Link>
      </div>

      <PageHeader
        title="Data Migration / ELT"
        subtitle={`${r.business.tradeName} — bring existing business data into PharmaNexus`}
        action={m ? <MigrationBadge status={m.status} /> : undefined}
      />

      {!m ? (
        <Card>
          <EmptyState
            title="No migration started"
            message="Start a data migration for this retailer to bring their existing business records into PharmaNexus."
          />
        </Card>
      ) : m.stage === 0 || m.status === 'Not Started' ? (
        <Card>
          <EmptyState title="Migration not started" message="Begin the migration workflow to bring this retailer's data into PharmaNexus." />
        </Card>
      ) : (
        <>
          <StageIndicator current={m.stage} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <StageContent m={m} toast={toast} />
            </div>
            <div className="space-y-6">
              <ProgressPanel m={m} />
              <AuditPanel m={m} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StageContent({ m, toast }: { m: Migration; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  switch (m.stage) {
    case 1:
      return <StageAssessment m={m} retailerId={m.retailerId} toast={toast} />;
    case 2:
      return <StageExtractor m={m} retailerId={m.retailerId} toast={toast} />;
    case 3:
      return <StageExtract m={m} retailerId={m.retailerId} toast={toast} />;
    case 4:
      return <StageTransform m={m} retailerId={m.retailerId} toast={toast} />;
    case 5:
      return <StageLoad m={m} retailerId={m.retailerId} toast={toast} />;
    case 6:
      return <StageVerify m={m} retailerId={m.retailerId} />;
    default:
      return null;
  }
}

function useStageActions() {
  return useMigrations();
}

function StageAssessment({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { saveAssessment, stageNext } = useStageActions();
  const [systemType, setSystemType] = useState<SystemType>(m.systemType ?? 'Paper Records');
  const [systemName, setSystemName] = useState(m.systemName ?? '');
  const [dataTypes, setDataTypes] = useState<DataCategory[]>(m.dataTypes.length ? m.dataTypes : ['Historical Invoices', 'Supplier Records']);

  const toggleType = (t: DataCategory) => {
    setDataTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const save = () => {
    if (!systemName.trim()) {
      toast('warning', 'System name required', 'Enter the name of the current system used by the retailer.');
      return;
    }
    if (dataTypes.length === 0) {
      toast('warning', 'Select data types', 'Choose at least one category of data to migrate.');
      return;
    }
    saveAssessment(retailerId, systemType, systemName.trim(), dataTypes);
    toast('success', 'Assessment saved', 'Current system assessment recorded.');
    stageNext(retailerId);
  };

  return (
    <>
      <Panel>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
            <Database className="h-4.5 w-4.5" />
          </span>
          <div>
            <SectionTitle>Current System Assessment</SectionTitle>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/55">
              Understand the system the retailer currently runs their business on. PharmaNexus does not expect an existing business to start from zero — we bring their records with them.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current System Type">
            <select className={inputClass} value={systemType} onChange={(e) => setSystemType(e.target.value as SystemType)}>
              {SYSTEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="System / Software Name">
            <input className={inputClass} value={systemName} onChange={(e) => setSystemName(e.target.value)} placeholder="e.g. Tally Prime, MS Excel, Paper registers" />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Data to Migrate">
            <div className="flex flex-wrap gap-2">
              {DATA_TYPES.map((t) => {
                const on = dataTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition',
                      on
                        ? 'border-brand-navy/40 bg-brand-navy text-white'
                        : 'border-brand-navy/15 bg-white text-brand-charcoal/70 hover:border-brand-navy/30',
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} icon={<ArrowRight />}>
            Save Assessment & Continue
          </Button>
        </div>
      </Panel>
    </>
  );
}

function StageExtractor({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { saveExtractor, testExtractor, stageNext } = useStageActions();
  const method = m.systemType ? METHOD_HINTS[m.systemType] : 'OCR';
  const [dataSource, setDataSource] = useState(m.extractor?.dataSource ?? `${m.systemName || 'Current system'} (${m.systemType ?? 'Paper Records'})`);
  const [dateFrom, setDateFrom] = useState(m.extractor?.dateFrom ?? '01 Jan 2023');
  const [dateTo, setDateTo] = useState(m.extractor?.dateTo ?? '31 Dec 2025');
  const [estimate, setEstimate] = useState(m.extractor?.recordEstimate ?? '');
  const [testing, setTesting] = useState(false);

  const save = () => {
    saveExtractor(retailerId, {
      dataSource: dataSource.trim() || 'Current system',
      dataType: 'Historical Invoices',
      method: method as 'OCR' | 'CSV / File Import' | 'API / ERP Connector' | 'Database Extractor',
      dateFrom,
      dateTo,
      recordEstimate: estimate.trim() || '—',
      tested: m.extractor?.tested,
      testedAt: m.extractor?.testedAt,
    });
    toast('success', 'Extractor configured', `${method} configured for ${dataSource.trim() || 'current system'}.`);
    stageNext(retailerId);
  };

  const test = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      testExtractor(retailerId);
      toast('success', 'Connection verified', 'Extractor connected to the source successfully.');
    }, 700);
  };

  return (
    <>
      <Panel>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
            <Plug className="h-4.5 w-4.5" />
          </span>
          <div>
            <SectionTitle>Configure Extractors</SectionTitle>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/55">
              Configure how PharmaNexus reads data from the current system. Recommended method for{' '}
              <span className="font-medium text-brand-charcoal">{m.systemType}</span>: <span className="font-medium text-brand-charcoal">{method}</span>.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data Source">
            <input className={inputClass} value={dataSource} onChange={(e) => setDataSource(e.target.value)} />
          </Field>
          <Field label="Extraction Method">
            <div className="flex h-[38px] items-center rounded-lg border border-brand-navy/15 bg-brand-navy/4 px-3 text-[13.5px] font-medium text-brand-navy">
              {method}
            </div>
          </Field>
          <Field label="From">
            <input className={inputClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <input className={inputClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Expected Records">
            <input className={inputClass} value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="e.g. Approximately 4,500 invoices" />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" onClick={test} loading={testing} icon={<RefreshCw className="h-4 w-4" />}>
            {m.extractor?.tested ? 'Test Connection Again' : 'Test Connection'}
          </Button>
          <Button onClick={save} icon={<ArrowRight />}>
            Save & Continue
          </Button>
        </div>
      </Panel>
    </>
  );
}

function StageExtract({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { runExtraction, runOcr, stageNext } = useStageActions();
  const method = m.extractor?.method ?? (m.systemType ? METHOD_HINTS[m.systemType] : 'OCR');
  const isOcr = method === 'OCR' || m.systemType === 'Paper Records';
  const [uploaded, setUploaded] = useState(m.ocr?.uploaded ?? 0);
  const [extracting, setExtracting] = useState(false);
  const placeholder = m.progress.invoices.total.toLocaleString('en-IN');

  const run = () => {
    setExtracting(true);
    setTimeout(() => {
      setExtracting(false);
      runExtraction(retailerId);
      toast('success', 'Extraction complete', `${m.progress.invoices.total.toLocaleString('en-IN')} records extracted from the source system.`);
    }, 700);
  };

  const runOCR = () => {
    if (uploaded === 0) {
      toast('warning', 'Upload invoices first', 'Upload the historical invoices you want to migrate.');
      return;
    }
    setExtracting(true);
    setTimeout(() => {
      setExtracting(false);
      runOcr(retailerId, uploaded);
      toast('success', 'OCR complete', `${Math.max(0, uploaded - 13)} invoices read, 13 flagged for human review.`);
    }, 700);
  };

  const done = isOcr ? !!m.ocr : !!m.extractor;

  return (
    <>
      {!done ? (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
              <ScanSearch className="h-4.5 w-4.5" />
            </span>
            <div>
              <SectionTitle>{isOcr ? 'OCR Migration — Historical Invoices' : 'Extract Data'}</SectionTitle>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/55">
                {isOcr
                  ? 'Upload scanned / paper invoices. PharmaNexus runs OCR to read supplier, medicine, quantity and amount fields from each invoice.'
                  : `Read records from the configured source using ${method}.`}
              </p>
            </div>
          </div>

          <div className="mt-5">
            {isOcr ? (
              <div className="rounded-xl border border-dashed border-brand-navy/25 bg-brand-navy/2 p-6 text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-brand-muted" />
                <p className="mt-2 text-[13.5px] font-medium text-brand-charcoal">Drag & drop historical invoices here</p>
                <p className="mt-0.5 text-[12.5px] text-brand-charcoal/50">PDF, JPG or PNG — scanned bills, purchase invoices, supplier statements</p>
                <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={uploaded || ''}
                    onChange={(e) => setUploaded(Number(e.target.value) || 0)}
                    placeholder={placeholder}
                  />
                  <span className="text-[12.5px] whitespace-nowrap text-brand-charcoal/50">invoices uploaded</span>
                </div>
                <div className="mt-4 flex justify-center gap-3">
                  <Button variant="secondary" icon={<FileUp className="h-4 w-4" />}>
                    Choose Files
                  </Button>
                  <Button onClick={runOCR} loading={extracting} icon={<ScanSearch className="h-4 w-4" />}>
                    Run OCR Extraction
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-brand-navy/15 bg-brand-navy/2 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[13.5px] font-semibold text-brand-charcoal">{m.extractor?.dataSource}</p>
                    <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                      {m.extractor?.dataType} · {m.extractor?.dateFrom} → {m.extractor?.dateTo}
                    </p>
                  </div>
                  <Button onClick={run} loading={extracting} icon={<Database className="h-4 w-4" />}>
                    Run Extraction
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-successBg text-status-success">
              <Check className="h-4.5 w-4.5" />
            </span>
            <div>
              <SectionTitle>{isOcr ? 'OCR Extraction Complete' : 'Extraction Complete'}</SectionTitle>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/55">
                {isOcr
                  ? `${m.ocr?.read} of ${m.ocr?.uploaded} invoices were read automatically. ${m.ocr?.needsReview} require human review due to low confidence.`
                  : `${m.progress.invoices.total.toLocaleString('en-IN')} records were extracted from the source system.`}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: isOcr ? 'Uploaded' : 'Extracted', value: isOcr ? m.ocr?.uploaded ?? 0 : m.progress.invoices.total },
              { label: isOcr ? 'Read Automatically' : 'Mapped Automatically', value: isOcr ? m.ocr?.read ?? 0 : m.progress.invoices.total },
              { label: 'Needs Review', value: isOcr ? m.ocr?.needsReview ?? 0 : 0 },
              { label: 'Failed', value: isOcr ? m.ocr?.failed ?? 0 : 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-brand-navy/10 bg-white p-3.5">
                <p className="text-[19px] font-semibold tracking-tight text-brand-charcoal">{s.value.toLocaleString('en-IN')}</p>
                <p className="mt-0.5 text-[11.5px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => stageNext(retailerId)} icon={<ArrowRight />}>
              Continue to Transform & Validate
            </Button>
          </div>
        </Panel>
      )}
    </>
  );
}

function StageTransform({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const [tab, setTab] = useState<'mapping' | 'records' | 'duplicates' | 'matches'>('mapping');
  const { stageNext } = useStageActions();
  const hasRecords = !!m.ocrRecords?.length;

  const tabs = [
    { id: 'mapping' as const, label: 'Data Mapping' },
    { id: 'records' as const, label: `Migration Review${hasRecords ? ' (13)' : ''}` },
    { id: 'duplicates' as const, label: `Duplicate Detection${m.duplicates?.length ? ` (${m.duplicates.length})` : ''}` },
    { id: 'matches' as const, label: `Existing Records${m.matches?.length ? ` (${m.matches.length})` : ''}` },
  ];

  return (
    <>
      <Panel>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
            <Settings2 className="h-4.5 w-4.5" />
          </span>
          <div>
            <SectionTitle>Transform & Validate</SectionTitle>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/55">
              Map legacy fields, review OCR output, resolve duplicates and decide whether records map to existing PharmaNexus records or are created new.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition',
                tab === t.id ? 'bg-brand-navy text-white' : 'bg-brand-navy/6 text-brand-charcoal/70 hover:bg-brand-navy/10',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Panel>

      {tab === 'mapping' && <MappingTab m={m} retailerId={retailerId} />}
      {tab === 'records' && <RecordsTab m={m} retailerId={retailerId} toast={toast} />}
      {tab === 'duplicates' && <DuplicatesTab m={m} retailerId={retailerId} toast={toast} />}
      {tab === 'matches' && <MatchesTab m={m} retailerId={retailerId} toast={toast} />}

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[12.5px] text-brand-charcoal/55">
            <SourceBadge source="Migrated" /> Historical records are kept separate from new PharmaNexus records. Current procurement is never overwritten.
          </p>
          <Button onClick={() => stageNext(retailerId)} icon={<ArrowRight />}>
            Continue to Load
          </Button>
        </div>
      </Panel>
    </>
  );
}

function MappingTab({ m, retailerId }: { m: Migration; retailerId: string }) {
  const { updateMapping } = useStageActions();
  const mapping = m.mapping ?? MAPPING_ROWS;
  const rows = mapping.slice(0, 12);
  return (
    <Panel>
      <SectionTitle>Field Mapping — Legacy → PharmaNexus</SectionTitle>
      <p className="mt-1 text-[13px] text-brand-charcoal/55">Legacy fields are mapped to their PharmaNexus equivalents. Transform rows apply rules during load.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-brand-navy/10 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
              <th className="py-2 pr-4">Legacy Field</th>
              <th className="py-2 pr-4">Target Field</th>
              <th className="py-2 pr-4">Method</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.legacyField} className="border-b border-brand-navy/6">
                <td className="py-2.5 pr-4 font-mono text-[12.5px] text-brand-charcoal/80">{row.legacyField}</td>
                <td className="py-2.5 pr-4">
                  <select
                    className="rounded-md border border-brand-navy/15 bg-white px-2 py-1.5 text-[12.5px] outline-none"
                    value={row.targetField}
                    onChange={(e) => updateMapping(retailerId, i, { targetField: e.target.value })}
                  >
                    {MAPPING_ROWS.map((o) => (
                      <option key={o.targetField} value={o.targetField}>
                        {o.targetField}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 pr-4">
                  <select
                    className="rounded-md border border-brand-navy/15 bg-white px-2 py-1.5 text-[12.5px] outline-none"
                    value={row.method}
                    onChange={(e) => updateMapping(retailerId, i, { method: e.target.value as 'Direct' | 'Transform' | 'Review' })}
                  >
                    <option>Direct</option>
                    <option>Transform</option>
                    <option>Review</option>
                  </select>
                </td>
                <td className="py-2.5">
                  <span className="badge bg-status-successBg text-status-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                    Mapped
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RecordsTab({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { updateOcrRecord } = useStageActions();
  const [selected, setSelected] = useState(m.ocrRecords?.[0]?.id ?? '');
  const records = m.ocrRecords ?? [];
  const rec = records.find((x) => x.id === selected) ?? records[0];
  const needsReview = records.filter((x) => x.status === 'Requires Review').length;

  const setStatus = (s: RecordStatus) => {
    if (!rec) return;
    updateOcrRecord(retailerId, rec.id, s);
    toast('success', 'Record updated', `${rec.invoiceNumber} marked ${s}.`);
  };

  if (!rec) {
    return (
      <Panel>
        <EmptyState title="No OCR records" message="Run OCR extraction first to review records here." />
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-navy/10 px-5 py-3.5">
          <SectionTitle>Extracted Invoices ({records.length})</SectionTitle>
          <span className="badge bg-status-warningBg text-status-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-status-warning" />
            {needsReview} need review
          </span>
        </div>
        <div className="max-h-[420px] divide-y divide-brand-navy/6 overflow-y-auto">
          {records.map((x) => (
            <button
              key={x.id}
              onClick={() => setSelected(x.id)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition',
                selected === x.id ? 'bg-brand-navy/4' : 'hover:bg-brand-navy/2',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-brand-charcoal">{x.invoiceNumber}</p>
                <p className="truncate text-[12px] text-brand-charcoal/55">{x.supplier} · {x.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ConfidencePill value={x.confidence} />
                <RecordBadge status={x.status} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <SectionTitle>{rec.invoiceNumber}</SectionTitle>
            <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">{rec.supplier} · {rec.date} · {rec.amount}</p>
          </div>
          <RecordBadge status={rec.status} />
        </div>

        <div className="mt-4 space-y-2.5">
          {rec.fields.map((f) => (
            <div key={f.field} className="flex items-center justify-between gap-3 rounded-lg border border-brand-navy/8 bg-brand-navy/2 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{f.field}</p>
                <p className="truncate text-[13.5px] font-medium text-brand-charcoal">{f.value}</p>
              </div>
              <ConfidencePill value={f.confidence} />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button size="sm" variant={rec.status === 'Confirmed' ? 'primary' : 'secondary'} onClick={() => setStatus('Confirmed')} icon={<Check className="h-4 w-4" />}>
            Confirm Record
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setStatus('Requires Review')} icon={<ScanSearch className="h-4 w-4" />}>
            Request Review
          </Button>
          <Button size="sm" variant="danger" onClick={() => setStatus('Rejected')}>
            Reject
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function DuplicatesTab({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { resolveDuplicate } = useStageActions();
  const rows = m.duplicates ?? [
    { id: 'dup-1', invoiceNumber: 'INV-2023-9874', supplier: 'MedPlus Distributors Pvt Ltd', date: '14 Mar 2023', amount: '₹ 1,21,300', status: 'Keep Both' as const },
    { id: 'dup-2', invoiceNumber: 'INV-2023-1198', supplier: 'Ravichandran Distributors', date: '22 Jun 2023', amount: '₹ 84,920', status: 'Keep Both' as const },
    { id: 'dup-3', invoiceNumber: 'INV-2024-0005', supplier: 'Sunrise Distributors', date: '18 Jan 2024', amount: '₹ 1,12,000', status: 'Mark Duplicate' as const },
    { id: 'dup-4', invoiceNumber: 'INV-2024-0008', supplier: 'Wellness Pharma Supplies', date: '03 Feb 2024', amount: '₹ 1,27,450', status: 'Review' as const },
  ];

  const act = (id: string, res: DuplicateResolution) => {
    resolveDuplicate(retailerId, id, res);
    toast('success', 'Duplicate resolved', `Marked ${res}.`);
  };

  return (
    <Panel>
      <SectionTitle>Duplicate Detection</SectionTitle>
      <p className="mt-1 text-[13px] text-brand-charcoal/55">
        Invoices that may already exist in PharmaNexus or within the migrated set. Duplicates never overwrite existing records.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-brand-navy/10 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
              <th className="py-2 pr-4">Invoice</th>
              <th className="py-2 pr-4">Supplier</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-brand-navy/6">
                <td className="py-2.5 pr-4 font-medium text-brand-charcoal">{d.invoiceNumber}</td>
                <td className="py-2.5 pr-4 text-brand-charcoal/70">{d.supplier}</td>
                <td className="py-2.5 pr-4 text-brand-charcoal/70">{d.date}</td>
                <td className="py-2.5 pr-4 text-brand-charcoal/70">{d.amount}</td>
                <td className="py-2.5 pr-4">
                  <DuplicateBadge status={d.status} />
                </td>
                <td className="py-2.5">
                  <div className="flex gap-1.5">
                    <button className="rounded-md border border-brand-navy/15 px-2 py-1 text-[11.5px] font-medium text-brand-charcoal/70 hover:bg-brand-navy/5" onClick={() => act(d.id, 'Keep Both')}>
                      Keep Both
                    </button>
                    <button className="rounded-md border border-brand-navy/15 px-2 py-1 text-[11.5px] font-medium text-brand-charcoal/70 hover:bg-brand-navy/5" onClick={() => act(d.id, 'Mark Duplicate')}>
                      Mark Duplicate
                    </button>
                    <button className="rounded-md border border-brand-navy/15 px-2 py-1 text-[11.5px] font-medium text-brand-charcoal/70 hover:bg-brand-navy/5" onClick={() => act(d.id, 'Review')}>
                      Review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MatchesTab({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { resolveMatch } = useStageActions();
  const rows = m.matches ?? [
    { id: 'm-1', type: 'Supplier' as const, legacyName: 'MedPlus Distributors', matchName: 'MedPlus Distributors Pvt Ltd', status: 'Map to Existing' as const },
    { id: 'm-2', type: 'Supplier' as const, legacyName: 'Krishna Pharma Whole', matchName: 'Krishna Pharma Wholesale', status: 'Map to Existing' as const },
    { id: 'm-3', type: 'Medicine' as const, legacyName: 'Paracetamal 500mg', matchName: 'Paracetamol 500mg', status: 'Map to Existing' as const },
    { id: 'm-4', type: 'Medicine' as const, legacyName: 'Dolo 650', matchName: 'Dolo 650mg', status: 'Map to Existing' as const },
    { id: 'm-5', type: 'Supplier' as const, legacyName: 'Wellness Pharma Supplies', matchName: '', status: 'Unresolved' as const },
  ];

  const act = (id: string, res: MatchResolution) => {
    resolveMatch(retailerId, id, res);
    toast('success', 'Record matched', `Resolved ${res}.`);
  };

  return (
    <Panel>
      <SectionTitle>Existing Record Found</SectionTitle>
      <p className="mt-1 text-[13px] text-brand-charcoal/55">
        Some migrated records match records that already exist in PharmaNexus. Choose whether to map to the existing record or create a new one. Existing records are never overwritten.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-brand-navy/10 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Legacy Record</th>
              <th className="py-2 pr-4">Matched Record</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className="border-b border-brand-navy/6">
                <td className="py-2.5 pr-4">
                  <span className="badge bg-brand-navy/6 text-brand-charcoal/70">{x.type}</span>
                </td>
                <td className="py-2.5 pr-4 font-medium text-brand-charcoal">{x.legacyName}</td>
                <td className="py-2.5 pr-4 text-brand-charcoal/70">{x.matchName || '—'}</td>
                <td className="py-2.5 pr-4">
                  <MatchBadge status={x.status} />
                </td>
                <td className="py-2.5">
                  <div className="flex gap-1.5">
                    <button
                      className="rounded-md border border-brand-navy/15 px-2 py-1 text-[11.5px] font-medium text-brand-charcoal/70 hover:bg-brand-navy/5"
                      onClick={() => act(x.id, 'Map to Existing')}
                    >
                      Map to Existing
                    </button>
                    <button
                      className="rounded-md border border-brand-navy/15 px-2 py-1 text-[11.5px] font-medium text-brand-charcoal/70 hover:bg-brand-navy/5"
                      onClick={() => act(x.id, 'Create New')}
                    >
                      Create New
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function StageLoad({ m, retailerId, toast }: { m: Migration; retailerId: string; toast: (t: 'success' | 'warning', title: string, msg: string) => void }) {
  const { importRecords } = useStageActions();
  const [loading, setLoading] = useState(false);
  const ocrNeedsReview = m.ocr?.needsReview ?? 0;
  const confirmed = Math.max(0, (m.ocr?.read ?? m.progress.invoices.total) - ocrNeedsReview);

  const doImport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      importRecords(retailerId);
      toast('success', 'Migration complete', `${confirmed.toLocaleString('en-IN')} records loaded into PharmaNexus.`);
    }, 900);
  };

  return (
    <>
      <Panel>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </span>
          <div>
            <SectionTitle>Load Into PharmaNexus</SectionTitle>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/55">
              Records that passed transform & validation are loaded as <span className="font-medium text-brand-charcoal">Historical Migrated</span> records — clearly separated from current procurement.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Ready to Load', value: m.progress.invoices.total, tone: 'text-brand-charcoal' },
            { label: 'Confirmed', value: confirmed, tone: 'text-status-success' },
            { label: 'Needs Review', value: ocrNeedsReview, tone: 'text-status-warning' },
            { label: 'Will Be Rejected', value: m.ocr?.failed ?? 0, tone: 'text-status-danger' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-brand-navy/10 bg-white p-3.5">
              <p className={cn('text-[19px] font-semibold tracking-tight', s.tone)}>{s.value.toLocaleString('en-IN')}</p>
              <p className="mt-0.5 text-[11.5px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-brand-navy/10 bg-brand-navy/2 p-4">
          <SourceBadge source="Migrated" />
          <p className="text-[12.5px] leading-relaxed text-brand-charcoal/60">
            Loading never overwrites existing PharmaNexus records. Duplicates and rejected records are excluded from the load.
          </p>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <SectionTitle>Ready to import</SectionTitle>
            <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
              {confirmed.toLocaleString('en-IN')} confirmed records will be imported for {m.systemName || m.systemType}.
            </p>
          </div>
          <Button onClick={doImport} loading={loading} icon={<UploadCloud className="h-4 w-4" />}>
            Import Records
          </Button>
        </div>
      </Panel>
    </>
  );
}

function StageVerify({ m, retailerId }: { m: Migration; retailerId: string }) {
  const { stageNext } = useStageActions();
  const confirmed = m.importedCount ?? m.progress.invoices.migrated;
  return (
    <>
      <Card className="border-status-success/30 bg-status-successBg/40 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Migration Complete</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/60">
              {confirmed.toLocaleString('en-IN')} invoices migrated into PharmaNexus. Historical records are available and clearly marked as <SourceBadge source="Migrated" /> —
              fully separated from current procurement and live purchase orders.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Invoices Migrated', value: confirmed },
            { label: 'Suppliers Mapped', value: m.progress.suppliers.total },
            { label: 'Products Mapped', value: m.progress.products.total },
            { label: 'Duplicates Excluded', value: m.progress.duplicates },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-brand-navy/10 bg-white p-3.5">
              <p className="text-[19px] font-semibold tracking-tight text-brand-charcoal">{s.value.toLocaleString('en-IN')}</p>
              <p className="mt-0.5 text-[11.5px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-brand-muted" />
            <p className="text-[13px] text-brand-charcoal/60">
              The retailer can now place live orders. New records created on PharmaNexus carry the <SourceBadge source="PharmaNexus" /> source.
            </p>
          </div>
          <Button variant="secondary" onClick={() => stageNext(retailerId)} icon={<Check className="h-4 w-4" />}>
            Mark Verified
          </Button>
        </div>
      </Panel>
    </>
  );
}

function ProgressPanel({ m }: { m: Migration }) {
  const p = m.progress;
  return (
    <Card>
      <CardHeader
        title="Migration Progress"
        subtitle={m.status === 'Completed' ? 'All records migrated' : `${p.percent}% complete`}
        icon={<Loader2 className="h-4.5 w-4.5" />}
      />
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between text-[12px] font-medium">
          <span className="text-brand-charcoal/55">Overall</span>
          <span className="text-brand-charcoal">{p.percent}%</span>
        </div>
        <div className="mt-1.5">
          <ProgressBar value={p.percent} />
        </div>

        <div className="mt-5 space-y-3">
          {[
            { label: 'Invoices', done: p.invoices.migrated, total: p.invoices.total },
            { label: 'Suppliers', done: p.suppliers.mapped, total: p.suppliers.total },
            { label: 'Products / Medicines', done: p.products.mapped, total: p.products.total },
          ].map((row) => {
            const val = Math.round((row.done / (row.total || 1)) * 100);
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-brand-charcoal/55">{row.label}</span>
                  <span className="font-medium text-brand-charcoal">
                    {row.done.toLocaleString('en-IN')} / {row.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={val} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg bg-brand-navy/4 px-3 py-2.5">
            <p className="text-[16px] font-semibold text-brand-charcoal">{p.errors}</p>
            <p className="text-[11px] font-medium tracking-wide text-brand-charcoal/45 uppercase">Errors</p>
          </div>
          <div className="rounded-lg bg-brand-navy/4 px-3 py-2.5">
            <p className="text-[16px] font-semibold text-brand-charcoal">{p.duplicates}</p>
            <p className="text-[11px] font-medium tracking-wide text-brand-charcoal/45 uppercase">Duplicates</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AuditPanel({ m }: { m: Migration }) {
  return (
    <Card>
      <CardHeader title="Audit Trail" subtitle="Every action is recorded" icon={<History className="h-4.5 w-4.5" />} />
      <div className="px-5 pb-5">
        <ol className="space-y-4">
          {m.audit.map((a) => (
            <li key={a.id} className="relative flex gap-3 pl-5">
              <span className="absolute top-1.5 left-0 h-2 w-2 rounded-full bg-brand-navy/30" />
              <div>
                <p className="text-[12.5px] leading-snug text-brand-charcoal">{a.action}</p>
                <p className="mt-0.5 text-[11px] text-brand-charcoal/45">
                  {a.timestamp} · {a.actor}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
