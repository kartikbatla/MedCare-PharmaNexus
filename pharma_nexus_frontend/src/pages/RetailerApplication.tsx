import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock3,
  Database,
  Download,
  Eye,
  FileCheck2,
  History,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useRetailers } from '../context/RetailerContext';
import { useMigrations } from '../context/MigrationContext';
import { useToast } from '../context/ToastContext';
import { MigrationBadge, SourceBadge } from '../components/migration/MigrationBadges';
import type { Migration } from '../data/migration';
import {
  AgreementBadge,
  DocumentBadge,
  RetailerBadge,
  SignatoryBadge,
} from '../components/onboarding/RetailerBadges';
import {
  AGREEMENT_TEXT,
  agreementDownloadContent,
  documentPreviewContent,
  downloadTextFile,
} from '../components/onboarding/helpers';
import type { AuthorizedSignatory, ChangeIssue, OnboardingDocument, Retailer } from '../data/retailers';
import { cn } from '../lib/utils';

const CHANGE_ISSUES: ChangeIssue[] = [
  'Missing document',
  'Invalid document',
  'Business information mismatch',
  'Signatory verification required',
  'Contract issue',
  'Other',
];

function Def({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium tracking-wide text-brand-charcoal/45 uppercase">{label}</p>
      <p className="mt-0.5 text-[13.5px] text-brand-charcoal">{value || '—'}</p>
    </div>
  );
}

export default function RetailerApplication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    retailerById,
    verifyDocument,
    rejectDocument,
    verifySignatory,
    rejectSignatory,
    verifyAgreement,
    requestChanges,
    rejectApplication,
    approveRetailer,
    activateRetailer,
  } = useRetailers();
  const { migrationForRetailer, startMigration, skipMigration } = useMigrations();

  const [viewDoc, setViewDoc] = useState<OnboardingDocument | null>(null);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectSigId, setRejectSigId] = useState<string | null>(null);
  const [docReason, setDocReason] = useState('');
  const [sigReason, setSigReason] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changeIssue, setChangeIssue] = useState<ChangeIssue>('Missing document');
  const [changeComments, setChangeComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const r = retailerById(id ?? '');
  if (!r) {
    return (
      <div className="space-y-6">
        <PageHeader title="Retailer Application" subtitle="Application not found." />
        <Card>
          <EmptyState
            title="Retailer not found"
            message="This application may have been removed or the link is invalid."
            action={{ label: 'Back to Retailers', onClick: () => navigate('/retailers') }}
          />
        </Card>
      </div>
    );
  }

  const requiredDocs = r.documents.filter((d) => d.required);
  const docsVerified = requiredDocs.length > 0 && requiredDocs.every((d) => d.status === 'Verified');
  const signatoryVerified = r.signatories.length > 0 && r.signatories.every((s) => s.status === 'Verified');
  const agreementVerified = r.agreement.status === 'Verified';
  const allVerified = docsVerified && signatoryVerified && agreementVerified;

  const terminal = r.status === 'Active' || r.status === 'Rejected';

  const onVerifyDoc = (d: OnboardingDocument) => {
    verifyDocument(r.id, d.id);
    toast('success', 'Document verified', `${d.label} has been marked as verified.`);
  };

  const onRejectDoc = (d: OnboardingDocument) => {
    if (!docReason.trim()) return;
    rejectDocument(r.id, d.id, docReason.trim());
    setRejectDocId(null);
    setDocReason('');
    toast('warning', 'Document rejected', `The retailer will be asked to upload a corrected ${d.label}.`);
  };

  const onVerifySig = (s: AuthorizedSignatory) => {
    verifySignatory(r.id, s.id);
    toast('success', 'Signatory verified', `${s.fullName} has been verified as an authorized signatory.`);
  };

  const onRejectSig = (s: AuthorizedSignatory) => {
    if (!sigReason.trim()) return;
    rejectSignatory(r.id, s.id, sigReason.trim());
    setRejectSigId(null);
    setSigReason('');
    toast('warning', 'Signatory rejected', `${s.fullName} was rejected with the provided reason.`);
  };

  const onApprove = () => {
    if (!allVerified) {
      toast('warning', 'Verification incomplete', 'Verify all documents, the signatory and the agreement before approving.');
      return;
    }
    approveRetailer(r.id);
    toast('success', 'Retailer approved', `${r.business.tradeName} is approved. Activate the account to enable ordering.`);
  };

  const onActivate = () => {
    activateRetailer(r.id);
    toast('success', 'Account activated', `${r.business.tradeName} can now place medicine orders.`);
  };

  const onRequestChanges = () => {
    if (!changeComments.trim()) return;
    requestChanges(r.id, changeIssue, changeComments.trim());
    setRequestOpen(false);
    setChangeComments('');
    toast('warning', 'Changes requested', 'The retailer has been notified about what needs to be corrected.');
  };

  const onReject = () => {
    if (!rejectReason.trim()) return;
    rejectApplication(r.id, rejectReason.trim());
    setRejectOpen(false);
    setRejectReason('');
    toast('error', 'Application rejected', `${r.business.tradeName} was not approved.`);
  };

  return (
    <div className="space-y-6">
      <Link
        to="/retailers"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-muted transition-colors hover:text-brand-navy"
      >
        <ArrowLeft size={14} /> Retailer Management
      </Link>

      <PageHeader
        title={r.business.tradeName}
        subtitle={`${r.business.legalName} · ${r.applicationNumber} · Submitted ${r.submittedDate ?? '—'}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RetailerBadge status={r.status} />
            {!terminal && (
              <>
                {r.status === 'Approved' ? (
                  <Button icon={<ShieldCheck size={15} />} onClick={onActivate}>
                    Activate Account
                  </Button>
                ) : (
                  <Button icon={<ShieldCheck size={15} />} disabled={!allVerified} onClick={onApprove}>
                    Approve Retailer
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setRequestOpen(true)}>
                  Request Changes
                </Button>
                <Button variant="ghost" className="text-status-danger hover:bg-status-dangerBg" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
          </div>
        }
      />

      {(r.requestedChange || r.rejectionReason) && (
        <Card className={cn('border p-4', r.status === 'Rejected' ? 'border-status-danger/25 bg-status-dangerBg/30' : 'border-status-warning/25 bg-status-warningBg/40')}>
          {r.status === 'Rejected' ? (
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-danger text-white">
                <FileCheck2 size={16} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-brand-charcoal">Application rejected</p>
                <p className="mt-0.5 text-[13px] text-brand-charcoal/70">{r.rejectionReason}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-warning text-white">
                <Circle size={16} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-brand-charcoal">
                  Action Required — {r.requestedChange?.issue}
                </p>
                <p className="mt-0.5 text-[13px] text-brand-charcoal/70">{r.requestedChange?.comments}</p>
                <p className="mt-1 text-[12px] text-brand-charcoal/45">Requested {r.requestedChange?.requestedAt}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeaderRow icon={<UserRound size={15} />} title="Business Information" subtitle="Registered details of the retailer business" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 pb-5 sm:grid-cols-2">
              <Def label="Legal Business Name" value={r.business.legalName} />
              <Def label="Trade Name" value={r.business.tradeName} />
              <Def label="Business Type" value={r.business.businessType} />
              <Def label="Registration Number" value={r.business.registrationNumber} />
              <Def label="GSTIN" value={r.business.gstin} />
              <Def label="PAN" value={r.business.pan} />
              <Def label="Drug License" value={r.business.drugLicense} />
              <Def label="Business Phone" value={r.business.phone} />
              <Def label="Business Email" value={r.business.email} />
              <Def label="City / State / PIN" value={`${r.business.city}, ${r.business.state} · ${r.business.pincode}`} />
              <Def label="Address" value={r.business.address} />
            </div>
            <div className="border-t border-brand-navy/5 px-5 py-4">
              <p className="text-[12px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Contact Person</p>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Def label="Full Name" value={r.contact.fullName} />
                <Def label="Designation" value={r.contact.designation} />
                <Def label="Phone" value={r.contact.phone} />
                <Def label="Email" value={r.contact.email} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeaderRow
              icon={<FileCheck2 size={15} />}
              title="Business Documents"
              subtitle="Each uploaded document is treated as a sensitive business record."
              action={<DocumentBadge status={docsVerified ? 'Verified' : 'Uploaded'} />}
            />
            <div className="divide-y divide-brand-navy/5">
              {r.documents.map((d) => {
                const rejected = d.status === 'Rejected';
                return (
                  <div key={d.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-brand-charcoal">{d.label}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-brand-charcoal/50">
                          {d.fileName ? (
                            <>
                              {d.fileName} · {d.uploadDate}
                              {d.verifiedBy && <span className="text-status-success">Verified by {d.verifiedBy}</span>}
                            </>
                          ) : (
                            'Not uploaded'
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <DocumentBadge status={d.status} />
                        {d.fileName && (
                          <>
                            <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={() => setViewDoc(d)}>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Download size={13} />}
                              onClick={() => downloadTextFile(d.fileName ?? `${d.id}.pdf`, documentPreviewContent(d))}
                            >
                              Download
                            </Button>
                          </>
                        )}
                        {d.status !== 'Verified' && d.status !== 'Pending' && !rejected && (
                          <Button variant="secondary" size="sm" icon={<Check size={13} />} onClick={() => onVerifyDoc(d)}>
                            Verify
                          </Button>
                        )}
                        {d.status !== 'Pending' && !terminal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-status-danger hover:bg-status-dangerBg"
                            onClick={() => setRejectDocId(rejectDocId === d.id ? null : d.id)}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                    {d.reviewerComment && (
                      <p className="mt-2 rounded-lg bg-status-dangerBg/40 px-3 py-2 text-[12.5px] text-status-danger">
                        {d.reviewerComment}
                      </p>
                    )}
                    {rejectDocId === d.id && !terminal && (
                      <div className="mt-3 space-y-2 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.02] p-3">
                        <label className="label">Reason for rejection</label>
                        <textarea
                          className="input min-h-[70px] py-2.5"
                          placeholder="e.g. GSTIN does not match the registered business name."
                          value={docReason}
                          onChange={(e) => setDocReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setRejectDocId(null)}>
                            Cancel
                          </Button>
                          <Button variant="danger" size="sm" disabled={!docReason.trim()} onClick={() => onRejectDoc(d)}>
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeaderRow
              icon={<UserRound size={15} />}
              title="Authorized Signatories"
              subtitle="People authorized to represent the retailer."
              action={<SignatoryBadge status={signatoryVerified ? 'Verified' : 'Pending'} />}
            />
            <div className="space-y-3 px-5 pb-5">
              {r.signatories.map((s) => (
                  <div key={s.id} className="rounded-xl border border-brand-navy/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-brand-charcoal">{s.fullName}</p>
                        <p className="text-[12.5px] text-brand-charcoal/50">
                          {s.designation} · {s.email} · {s.phone}
                        </p>
                        <p className="mt-1 text-[12px] text-brand-charcoal/45">Authority: {s.authority}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SignatoryBadge status={s.status} />
                        {s.status !== 'Verified' && (
                          <Button variant="secondary" size="sm" icon={<Check size={13} />} onClick={() => onVerifySig(s)}>
                            Verify
                          </Button>
                        )}
                        {s.status !== 'Pending' && !terminal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-status-danger hover:bg-status-dangerBg"
                            onClick={() => setRejectSigId(rejectSigId === s.id ? null : s.id)}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                    {s.reason && <p className="mt-2 rounded-lg bg-status-dangerBg/40 px-3 py-2 text-[12.5px] text-status-danger">{s.reason}</p>}
                    {rejectSigId === s.id && !terminal && (
                      <div className="mt-3 space-y-2 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.02] p-3">
                        <label className="label">Reason for rejection</label>
                        <textarea
                          className="input min-h-[70px] py-2.5"
                          value={sigReason}
                          onChange={(e) => setSigReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setRejectSigId(null)}>
                            Cancel
                          </Button>
                          <Button variant="danger" size="sm" disabled={!sigReason.trim()} onClick={() => onRejectSig(s)}>
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeaderRow
              icon={<ShieldCheck size={15} />}
              title="Retailer Agreement"
              subtitle={`PharmaNexus Retailer Agreement · Version ${r.agreement.version}`}
              action={<AgreementBadge status={r.agreement.status} />}
            />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <Def label="Status" value={r.agreement.status} />
                <Def label="Version" value={r.agreement.version} />
                <Def label="Accepted" value={r.agreement.acceptedDate ?? '—'} />
                <Def label="Signatory" value={r.agreement.signatoryName ?? '—'} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon={<Eye size={13} />} onClick={() => setViewDoc({ id: 'agreement', label: 'PharmaNexus Retailer Agreement', status: r.agreement.status === 'Verified' ? 'Verified' : 'Uploaded', fileName: r.agreement.signedFileName ?? 'pharmanexus-retailer-agreement.pdf', uploadDate: r.agreement.acceptedDate, required: true })}>
                  View Agreement
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={() => downloadTextFile('PharmaNexus-Retailer-Agreement.txt', agreementDownloadContent(r.business.tradeName, r.agreement.signatoryName ?? r.contact.fullName, r.agreement.version))}
                >
                  Download Agreement
                </Button>
                {r.agreement.status === 'Signed' && !terminal && (
                  <Button variant="secondary" size="sm" icon={<Check size={13} />} onClick={() => { verifyAgreement(r.id); toast('success', 'Agreement verified', 'The signed retailer agreement has been verified.'); }}>
                    Verify Signed Agreement
                  </Button>
                )}
              </div>
              <p className="mt-3 text-[12px] text-brand-charcoal/45">
                Accepted by {r.agreement.signatoryName ?? '—'} ({r.agreement.signatoryDesignation ?? '—'})
                {r.agreement.signedFileName ? ` · Signed copy: ${r.agreement.signedFileName}` : ''}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeaderRow icon={<FileCheck2 size={15} />} title="Verification Summary" />
            <div className="space-y-1 px-5 pb-5">
              <SummaryLine ok title="Business details submitted" />
              {requiredDocs.map((d) => (
                <SummaryLine key={d.id} ok={d.status === 'Verified'} title={d.label} sub={d.status} />
              ))}
              <SummaryLine ok={signatoryVerified} title="Authorized Signatory" sub={signatoryVerified ? 'Verified' : 'Pending'} />
              <SummaryLine ok={agreementVerified} title="Retailer Agreement" sub={r.agreement.status} />
            </div>
            <div
              className={cn(
                'mx-5 mb-5 rounded-xl px-4 py-3 text-center',
                allVerified ? 'border border-status-success/25 bg-status-successBg/40' : 'border border-brand-navy/10 bg-brand-navy/[0.03]',
              )}
            >
              <p className={cn('text-[14px] font-semibold', allVerified ? 'text-status-success' : 'text-brand-charcoal/55')}>
                {allVerified ? 'Ready for Approval' : 'Verification Incomplete'}
              </p>
              <p className="mt-0.5 text-[12px] text-brand-charcoal/50">
                {allVerified ? 'All checks passed — the retailer can be approved.' : 'Complete the remaining checks to enable approval.'}
              </p>
            </div>
            {!terminal && (
              <div className="flex gap-2 border-t border-brand-navy/5 px-5 py-4">
                {r.status === 'Approved' ? (
                  <Button className="flex-1" icon={<ShieldCheck size={14} />} onClick={onActivate}>
                    Activate Account
                  </Button>
                ) : (
                  <Button className="flex-1" icon={<ShieldCheck size={14} />} disabled={!allVerified} onClick={onApprove}>
                    Approve Retailer
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setRequestOpen(true)}>
                  Request Changes
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeaderRow icon={<History size={15} />} title="Verification History" subtitle="Every verification action is recorded for accountability." />
            <div className="space-y-0 px-5 pb-5">
              {r.audit.map((a, i) => (
                <div key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < r.audit.length - 1 && <span className="absolute top-6 left-[9px] h-full w-px bg-brand-navy/10" />}
                  <span className="mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-brand-navy/15 bg-white">
                    <Clock3 size={10} className="text-brand-muted" />
                  </span>
                  <div>
                    <p className="text-[13px] leading-snug text-brand-charcoal">{a.action}</p>
                    <p className="mt-0.5 text-[11.5px] text-brand-charcoal/45">
                      {a.timestamp} · {a.actor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.03] p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-charcoal">
              <ShieldCheck size={14} className="text-brand-muted" /> Security & privacy
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-brand-charcoal/55">
              Uploaded business documents and agreements are securely stored, access-restricted, and visible only to
              authorized warehouse / distributor administrators.
            </p>
          </div>

          {(r.status === 'Approved' || r.status === 'Active') && (
            <MigrationSection
              r={r}
              migrationForRetailer={migrationForRetailer(r.id)}
              onStart={() => {
                startMigration(r.id);
                toast('success', 'Migration started', 'The retailer data migration / ELT workflow has been started.');
              }}
              onSkip={() => {
                skipMigration(r.id);
                toast('warning', 'Migration skipped', 'The retailer can resume data migration at any time.');
              }}
            />
          )}
        </div>
      </div>

      {viewDoc && (
        <Modal
          open
          onClose={() => setViewDoc(null)}
          title={viewDoc.label}
          subtitle="Secure document preview (demo)"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                icon={<Download size={14} />}
                onClick={() => downloadTextFile(viewDoc.fileName ?? `${viewDoc.id}.pdf`, documentPreviewContent(viewDoc))}
              >
                Download
              </Button>
              <Button onClick={() => setViewDoc(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-3 text-[13px] leading-relaxed whitespace-pre-wrap text-brand-charcoal/70">
            {viewDoc.id === 'agreement' ? AGREEMENT_TEXT : documentPreviewContent(viewDoc)}
          </div>
        </Modal>
      )}

      {requestOpen && (
        <Modal
          open
          onClose={() => setRequestOpen(false)}
          title="Request Changes"
          subtitle={`Send ${r.business.tradeName} a list of corrections required.`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button>
              <Button disabled={!changeComments.trim()} onClick={onRequestChanges}>
                Send to Retailer
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">Select the issue</label>
              <select className="input h-10" value={changeIssue} onChange={(e) => setChangeIssue(e.target.value as ChangeIssue)}>
                {CHANGE_ISSUES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reviewer Comments</label>
              <textarea
                className="input min-h-[90px] py-2.5"
                placeholder="Explain what needs to be corrected…"
                value={changeComments}
                onChange={(e) => setChangeComments(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {rejectOpen && (
        <Modal
          open
          onClose={() => setRejectOpen(false)}
          title="Reject Application"
          subtitle="The application will be marked as rejected and the retailer notified."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button disabled={!rejectReason.trim()} variant="danger" onClick={onReject}>
                Reject Application
              </Button>
            </div>
          }
        >
          <div>
            <label className="label">Reason for rejection</label>
            <textarea
              className="input min-h-[90px] py-2.5"
              placeholder="Required — the retailer will see this reason…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function CardHeaderRow({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-navy/5 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">{icon}</span>
        <div>
          <p className="text-[14px] font-semibold text-brand-charcoal">{title}</p>
          {subtitle && <p className="text-[12px] text-brand-charcoal/50">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function SummaryLine({ ok, title, sub }: { ok: boolean; title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', ok ? 'bg-status-success text-white' : 'bg-status-warningBg text-status-warning')}>
          {ok ? <Check size={12} /> : <Circle size={11} />}
        </span>
        <p className="text-[13px] text-brand-charcoal">{title}</p>
      </div>
      {sub && <p className="text-[12px] text-brand-charcoal/45">{sub}</p>}
    </div>
  );
}

function MigrationSection({
  r,
  migrationForRetailer: m,
  onStart,
  onSkip,
}: {
  r: Retailer;
  migrationForRetailer: Migration | undefined;
  onStart: () => void;
  onSkip: () => void;
}) {
  if (m?.status === 'Completed') {
    return (
      <div className="rounded-xl border border-status-success/25 bg-status-successBg/40 p-4">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-charcoal">
          <Check size={14} className="text-status-success" /> Data Migration Complete
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-brand-charcoal/55">
          {m.importedCount?.toLocaleString('en-IN')} invoices migrated from {m.systemName || m.systemType}. Records carry the{' '}
          <SourceBadge source="Migrated" /> source and are kept separate from current procurement.
        </p>
        <Link to={`/retailers/${r.id}/migration`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-navy hover:underline">
          View Migration Details <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  if (m && !m.skipped && m.stage >= 1) {
    return (
      <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.03] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-charcoal">
            <Database size={14} className="text-brand-muted" /> Data Migration / ELT
          </p>
          <MigrationBadge status={m.status} />
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-navy/8">
            <div className="h-full rounded-full bg-status-success" style={{ width: `${m.progress.percent}%` }} />
          </div>
          <span className="text-[12px] font-medium text-brand-charcoal/60">{m.progress.percent}%</span>
        </div>
        <p className="mt-1.5 text-[11.5px] text-brand-charcoal/50">Stage {Math.min(m.stage, 6)} of 6 — {m.systemName || m.systemType || 'Assessment'}</p>
        <Link to={`/retailers/${r.id}/migration`}>
          <Button size="sm" className="mt-3 w-full" icon={<ArrowRight size={13} />}>
            Continue Migration
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.03] p-4">
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-charcoal">
        <Database size={14} className="text-brand-muted" /> Data Migration / ELT
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-brand-charcoal/55">
        Bring this retailer's existing invoices, suppliers and products into PharmaNexus. Historical records are kept separate and never overwrite live data.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" icon={<Database size={13} />} onClick={onStart}>
          Start Migration
        </Button>
        <Button size="sm" variant="ghost" onClick={onSkip}>
          Skip for Now
        </Button>
      </div>
      {m?.skipped && <p className="mt-2 text-[11.5px] text-brand-charcoal/45">Skipped — the retailer can resume migration later.</p>}
    </div>
  );
}
