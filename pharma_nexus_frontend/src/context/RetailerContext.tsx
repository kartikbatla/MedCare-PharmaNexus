import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  loadRetailers,
  saveRetailers,
  type AuthorizedSignatory,
  type ChangeIssue,
  type OnboardingDocument,
  type Retailer,
} from '../data/retailers';

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

function dayLabel(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function nextAuditId(r: Retailer): number {
  return r.audit.reduce((m, a) => Math.max(m, Number(a.id.replace(/\D/g, '')) || 0), 0) + 1;
}

interface RetailerContextValue {
  retailers: Retailer[];
  retailerById: (id: string) => Retailer | undefined;
  createApplication: (r: Retailer) => Retailer;
  verifyDocument: (retailerId: string, docId: string) => void;
  rejectDocument: (retailerId: string, docId: string, reason: string) => void;
  verifySignatory: (retailerId: string, signatoryId: string) => void;
  rejectSignatory: (retailerId: string, signatoryId: string, reason: string) => void;
  verifyAgreement: (retailerId: string) => void;
  requestChanges: (retailerId: string, issue: ChangeIssue, comments: string) => void;
  rejectApplication: (retailerId: string, reason: string) => void;
  approveRetailer: (retailerId: string) => void;
  activateRetailer: (retailerId: string) => void;
  reuploadDocument: (retailerId: string, docId: string) => void;
}

const RetailerContext = createContext<RetailerContextValue | null>(null);

export function RetailerProvider({ children }: { children: ReactNode }) {
  const [retailers, setRetailers] = useState<Retailer[]>(() => loadRetailers());

  const commit = (next: Retailer[]) => {
    saveRetailers(next);
    setRetailers(next);
  };

  const updateOne = (id: string, updater: (r: Retailer) => Retailer) => {
    const next = retailers.map((r) => (r.id === id ? updater(r) : r));
    commit(next);
  };

  const auditAppend = (r: Retailer, action: string): Retailer => ({
    ...r,
    audit: [
      { id: `a-${nextAuditId(r)}`, timestamp: nowStamp(), action, actor: AUDITOR },
      ...r.audit,
    ],
  });

  const retailerById = (id: string) => retailers.find((r) => r.id === id);

  const createApplication = (r: Retailer) => {
    const next = [r, ...retailers];
    commit(next);
    return r;
  };

  const verifyDocument = (retailerId: string, docId: string) => {
    updateOne(retailerId, (r) => {
      const documents = r.documents.map((d) =>
        d.id === docId ? { ...d, status: 'Verified' as const, verifiedBy: AUDITOR, reviewerComment: undefined } : d,
      );
      const label = documents.find((d) => d.id === docId)?.label ?? 'Document';
      return auditAppend({ ...r, documents }, `${label} verified.`);
    });
  };

  const rejectDocument = (retailerId: string, docId: string, reason: string) => {
    updateOne(retailerId, (r) => {
      const documents = r.documents.map((d) =>
        d.id === docId ? { ...d, status: 'Rejected' as const, reviewerComment: reason } : d,
      );
      const label = documents.find((d) => d.id === docId)?.label ?? 'Document';
      return auditAppend({ ...r, documents }, `${label} rejected — ${reason}`);
    });
  };

  const verifySignatory = (retailerId: string, signatoryId: string) => {
    updateOne(retailerId, (r) => {
      const signatories = r.signatories.map((s) =>
        s.id === signatoryId ? { ...s, status: 'Verified' as const, reason: undefined } : s,
      );
      const name = signatories.find((s) => s.id === signatoryId)?.fullName ?? 'Signatory';
      return auditAppend({ ...r, signatories }, `Authorized signatory ${name} verified.`);
    });
  };

  const rejectSignatory = (retailerId: string, signatoryId: string, reason: string) => {
    updateOne(retailerId, (r) => {
      const signatories = r.signatories.map((s) =>
        s.id === signatoryId ? { ...s, status: 'Rejected' as const, reason } : s,
      );
      const name = signatories.find((s) => s.id === signatoryId)?.fullName ?? 'Signatory';
      return auditAppend({ ...r, signatories }, `Authorized signatory ${name} rejected — ${reason}`);
    });
  };

  const verifyAgreement = (retailerId: string) => {
    updateOne(retailerId, (r) => {
      const agreement = { ...r.agreement, status: 'Verified' as const, reviewedBy: AUDITOR };
      return auditAppend({ ...r, agreement }, 'Retailer agreement verified.');
    });
  };

  const requestChanges = (retailerId: string, issue: ChangeIssue, comments: string) => {
    updateOne(retailerId, (r) =>
      auditAppend(
        {
          ...r,
          status: 'Documents Required' as const,
          requestedChange: { issue, comments, requestedAt: nowStamp() },
          rejectionReason: undefined,
        },
        `Additional information requested: ${issue} — ${comments}`,
      ),
    );
  };

  const rejectApplication = (retailerId: string, reason: string) => {
    updateOne(retailerId, (r) =>
      auditAppend(
        { ...r, status: 'Rejected' as const, rejectionReason: reason, requestedChange: undefined },
        `Retailer application rejected: ${reason}`,
      ),
    );
  };

  const approveRetailer = (retailerId: string) => {
    updateOne(retailerId, (r) =>
      auditAppend({ ...r, status: 'Approved' as const, rejectionReason: undefined }, 'Retailer approved by administrator.'),
    );
  };

  const activateRetailer = (retailerId: string) => {
    updateOne(retailerId, (r) =>
      auditAppend(
        { ...r, status: 'Active' as const, submittedAt: r.submittedAt, requestedChange: undefined },
        'Retailer account activated — ordering enabled.',
      ),
    );
  };

  const reuploadDocument = (retailerId: string, docId: string) => {
    updateOne(retailerId, (r) => {
      const documents = r.documents.map((d) =>
        d.id === docId
          ? { ...d, status: 'Uploaded' as const, fileName: `${r.id}-${d.id}-revised.pdf`, uploadDate: dayLabel(), reviewerComment: undefined, verifiedBy: undefined }
          : d,
      );
      const label = documents.find((d) => d.id === docId)?.label ?? 'Document';
      return auditAppend(
        { ...r, documents, status: r.status === 'Rejected' ? ('Under Review' as const) : ('Under Review' as const), requestedChange: undefined },
        `${label} re-uploaded by retailer (corrected document).`,
      );
    });
  };

  return (
    <RetailerContext.Provider
      value={{
        retailers,
        retailerById,
        createApplication,
        verifyDocument,
        rejectDocument,
        verifySignatory,
        rejectSignatory,
        verifyAgreement,
        requestChanges,
        rejectApplication,
        approveRetailer,
        activateRetailer,
        reuploadDocument,
      }}
    >
      {children}
    </RetailerContext.Provider>
  );
}

export function useRetailers(): RetailerContextValue {
  const ctx = useContext(RetailerContext);
  if (!ctx) throw new Error('useRetailers must be used within RetailerProvider');
  return ctx;
}

export type { OnboardingDocument, AuthorizedSignatory };
