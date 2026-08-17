import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Database, Loader2, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MigrationBadge, SourceBadge } from '../components/migration/MigrationBadges';
import { useMigrations } from '../context/MigrationContext';
import { useRetailers } from '../context/RetailerContext';
import type { Migration } from '../data/migration';

function Dashboard() {
  const { migrations } = useMigrations();
  const { retailers } = useRetailers();

  const eligible = retailers.filter((r) => r.status === 'Approved' || r.status === 'Active');
  const started = migrations.filter((m) => m.status !== 'Not Started' && !m.skipped);
  const completed = started.filter((m) => m.status === 'Completed');
  const inProgress = started.filter((m) => m.status !== 'Completed');
  const pending = eligible.filter((r) => !migrations.some((m) => m.retailerId === r.id && !m.skipped));
  const totalInvoices = completed.reduce((sum, m) => sum + (m.importedCount ?? 0), 0);

  const kpis = [
    { label: 'Approved Retailers', value: eligible.length, icon: Users },
    { label: 'Migrations Completed', value: completed.length, icon: CheckCircle2 },
    { label: 'In Progress', value: inProgress.length, icon: Loader2 },
    { label: 'Invoices Migrated', value: totalInvoices.toLocaleString('en-IN'), icon: Database },
  ];

  const rows: Array<{ r: typeof eligible[number]; m: Migration | undefined }> = eligible.map((r) => ({
    r,
    m: migrations.find((x) => x.retailerId === r.id),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Migrations"
        subtitle="Bring existing retail businesses into PharmaNexus — migrate historical data, never overwrite live records."
        action={
          <Button variant="secondary" icon={<Database className="h-4 w-4" />}>
            Migration Guide
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-brand-navy/10 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
                <k.icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-[20px] font-semibold tracking-tight text-brand-charcoal">{k.value}</p>
                <p className="text-[11.5px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{k.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader
            title="Ready to Migrate"
            subtitle="Approved retailers who have not started their data migration yet."
            icon={<Clock3 className="h-4.5 w-4.5" />}
          />
          <div className="space-y-2.5 px-5 pb-5">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-brand-navy/10 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-brand-charcoal">{r.business.tradeName}</p>
                  <p className="truncate text-[12px] text-brand-charcoal/55">
                    {r.applicationNumber} · {r.business.legalName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="badge bg-status-infoBg text-brand-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-muted" />
                    Not Started
                  </span>
                  <Link to={`/retailers/${r.id}/migration`}>
                    <Button size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                      Start Migration
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Migration Status" subtitle="All approved retailers and their ELT pipeline status." icon={<Database className="h-4.5 w-4.5" />} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-brand-navy/10 text-[11px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
                <th className="px-5 py-3">Retailer</th>
                <th className="px-5 py-3">Source System</th>
                <th className="px-5 py-3">Records</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ r, m }) => {
                const pct = m?.progress.percent ?? 0;
                return (
                  <tr key={r.id} className="border-b border-brand-navy/6">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-brand-charcoal">{r.business.tradeName}</p>
                      <p className="text-[11.5px] text-brand-charcoal/50">{r.applicationNumber}</p>
                    </td>
                    <td className="px-5 py-3.5 text-brand-charcoal/70">
                      {m?.systemName || m?.systemType || '—'}
                      {m?.extractor && <p className="text-[11.5px] text-brand-charcoal/45">{m.extractor.method}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-brand-charcoal/70">
                      {m ? `${m.progress.invoices.migrated.toLocaleString('en-IN')} / ${m.progress.invoices.total.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-brand-navy/8">
                          <div className="h-full rounded-full bg-status-success" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[12px] font-medium text-brand-charcoal/60">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{m ? <MigrationBadge status={m.status} /> : <MigrationBadge status="Not Started" />}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/retailers/${r.id}/migration`} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-navy hover:underline">
                        {m?.status === 'Completed' ? 'View Details' : m ? 'Continue' : 'Start'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-brand-charcoal/50">
                    No approved retailers yet. Approve a retailer application to enable data migration.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader title="Completed Migrations" subtitle="Retailers fully onboarded with their historical data." icon={<CheckCircle2 className="h-4.5 w-4.5" />} />
          <div className="space-y-4 px-5 pb-5">
            {completed.map((m) => {
              const r = retailers.find((x) => x.id === m.retailerId);
              return (
                <div key={m.retailerId} className="rounded-xl border border-status-success/30 bg-status-successBg/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-brand-charcoal">
                        {r?.business.tradeName ?? m.retailerId} — Migration Complete
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                        {m.importedCount?.toLocaleString('en-IN')} invoices migrated from {m.systemName || m.systemType} on {m.completedAt}
                      </p>
                    </div>
                    <MigrationBadge status={m.status} />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[12.5px] text-brand-charcoal/60">
                    Migrated records carry the <SourceBadge source="Migrated" /> source and never overwrite live PharmaNexus records.
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
