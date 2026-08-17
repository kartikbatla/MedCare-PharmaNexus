import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, FileUp, Lock, LogOut, Pill, ShieldCheck, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useRetailers } from '../../context/RetailerContext';
import { useToast } from '../../context/ToastContext';
import { DocumentBadge, RetailerBadge } from '../../components/onboarding/RetailerBadges';
import { cn } from '../../lib/utils';

export default function RetailerApplicationStatus() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { retailerById, reuploadDocument } = useRetailers();

  const r = user?.storeId ? retailerById(user.storeId) : undefined;

  if (!r) {
    return (
      <Centered
        header={
          <Header user={user?.name} onSignOut={() => { logout(); navigate('/login'); }} />
        }
      >
        <Card>
          <p className="text-center text-[15px] font-semibold text-brand-charcoal">No application found</p>
          <p className="mt-1 text-center text-[13px] text-brand-charcoal/55">
            No retailer onboarding application is linked to this account. Contact the distributor for assistance.
          </p>
        </Card>
      </Centered>
    );
  }

  const docsSubmitted = r.documents.some((d) => d.status !== 'Pending');
  const verified = ['Verified', 'Approved', 'Active'].includes(r.status);
  const approved = ['Approved', 'Active'].includes(r.status);
  const rejectedDocs = r.documents.filter((d) => d.status === 'Rejected');
  const needsAction = r.status === 'Documents Required' || rejectedDocs.length > 0;

  const reupload = (docId: string) => {
    reuploadDocument(r.id, docId);
    toast('success', 'Document re-uploaded', 'Your corrected document has been submitted for verification.');
  };

  const steps = [
    { label: 'Business Details', done: true, active: false },
    { label: 'Documents Submitted', done: docsSubmitted, active: !docsSubmitted && r.status !== 'Documents Required' },
    { label: 'Verification', done: verified, active: !verified },
    { label: 'Approval', done: approved, active: !approved },
  ];

  return (
    <Centered
      header={<Header user={user?.name} onSignOut={() => { logout(); navigate('/login'); }} />}
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11.5px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">
              {r.applicationNumber} · Submitted {r.submittedDate}
            </p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-brand-charcoal">Your Retailer Application</h1>
          </div>
          <RetailerBadge status={r.status} />
        </div>

        <div className="rounded-xl border border-brand-navy/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-semibold text-brand-charcoal">
              {r.business.tradeName} · {r.business.legalName}
            </p>
            <p className="text-[12.5px] text-brand-charcoal/50">{r.business.city}, {r.business.state}</p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold',
                    s.done ? 'bg-status-success text-white' : s.active ? 'bg-brand-navy text-white' : 'border border-brand-navy/20 text-brand-charcoal/40',
                  )}
                >
                  {s.done ? <Check size={15} /> : i + 1}
                </span>
                <p className={cn('mt-2 text-[11.5px] font-medium', s.done || s.active ? 'text-brand-charcoal' : 'text-brand-charcoal/40')}>
                  {s.label}
                </p>
                {i < 3 && <span className="mt-2 hidden h-px w-full bg-brand-navy/10 sm:block" />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.03] p-4">
          <p className="text-[13px] leading-relaxed text-brand-charcoal/70">
            Your account will be activated once your business information and submitted documents have been verified by
            the authorized distributor.
          </p>
          {r.status === 'Approved' && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-status-success">
              <ShieldCheck size={14} /> Your application has been approved — your account is awaiting activation.
            </p>
          )}
          {r.status === 'Active' && (
            <button
              onClick={() => navigate('/retailer')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-muted"
            >
              Continue to your portal <ArrowRight size={14} />
            </button>
          )}
        </div>

        {r.status === 'Rejected' && (
          <div className="rounded-xl border border-status-danger/25 bg-status-dangerBg/40 p-4">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-status-danger">
              <XCircle size={16} /> Application not approved
            </p>
            <p className="mt-1 text-[13px] text-brand-charcoal/70">{r.rejectionReason}</p>
          </div>
        )}

        {needsAction && (
          <div className="rounded-xl border border-status-warning/30 bg-status-warningBg/50 p-5">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-brand-charcoal">
              <AlertTriangle size={16} className="text-status-warning" /> Action Required
            </p>
            {r.requestedChange && (
              <div className="mt-2 rounded-lg bg-white/70 px-3.5 py-2.5">
                <p className="text-[12px] font-semibold tracking-wide text-brand-charcoal/50 uppercase">{r.requestedChange.issue}</p>
                <p className="mt-0.5 text-[13px] text-brand-charcoal">{r.requestedChange.comments}</p>
              </div>
            )}
            {rejectedDocs.length > 0 && (
              <div className="mt-3 space-y-2.5">
                <p className="text-[12px] font-semibold tracking-wide text-brand-charcoal/50 uppercase">Rejected documents</p>
                {rejectedDocs.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/70 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-brand-charcoal">{d.label}</p>
                      {d.reviewerComment && <p className="text-[12px] text-status-danger">{d.reviewerComment}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <DocumentBadge status={d.status} />
                      <button
                        onClick={() => reupload(d.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-muted"
                      >
                        <FileUp size={13} /> Re-upload corrected document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 rounded-lg border border-brand-navy/10 bg-white/60 px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[12px] text-brand-charcoal/55">
                <Lock size={12} /> Documents are securely stored and visible only to authorized distributor staff.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-brand-navy/10 p-4">
          <p className="text-[11.5px] font-semibold tracking-wide text-brand-charcoal/45 uppercase">Submitted documents</p>
          <div className="mt-2 divide-y divide-brand-navy/5">
            {r.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <p className="text-[13px] text-brand-charcoal">{d.label}</p>
                <DocumentBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Centered>
  );
}

function Centered({ header, children }: { header?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {header}
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}

function Header({ user, onSignOut }: { user?: string; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-navy/8 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-white">
            <Pill size={17} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-brand-charcoal">PharmaNexus</span>
            <span className="block text-[11px] font-medium tracking-wide text-brand-muted uppercase">Retail Portal</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[12.5px] text-brand-charcoal/55 sm:block">{user}</span>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-navy/12 px-3 py-2 text-[12.5px] font-semibold text-brand-charcoal/70 transition-colors hover:border-brand-muted hover:text-brand-navy"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
