import StatusBadge from '../ui/StatusBadge';
import type { RetailerStatus, DocumentStatus, SignatoryStatus, AgreementStatus } from '../../data/retailers';

const retailerTones: Record<RetailerStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Pending: 'warning',
  'Under Review': 'info',
  'Documents Required': 'warning',
  Verified: 'success',
  Approved: 'success',
  Active: 'success',
  Rejected: 'danger',
};

const documentTones: Record<DocumentStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Pending: 'neutral',
  Uploaded: 'info',
  Verified: 'success',
  Rejected: 'danger',
  'Action Required': 'warning',
};

const signatoryTones: Record<SignatoryStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Pending: 'warning',
  Verified: 'success',
  Rejected: 'danger',
};

const agreementTones: Record<AgreementStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'Not Accepted': 'neutral',
  Accepted: 'info',
  Signed: 'info',
  Verified: 'success',
};

export function RetailerBadge({ status }: { status: RetailerStatus }) {
  return <StatusBadge status={status} tone={retailerTones[status]} />;
}

export function DocumentBadge({ status }: { status: DocumentStatus }) {
  return <StatusBadge status={status} tone={documentTones[status]} />;
}

export function SignatoryBadge({ status }: { status: SignatoryStatus }) {
  return <StatusBadge status={status} tone={signatoryTones[status]} />;
}

export function AgreementBadge({ status }: { status: AgreementStatus }) {
  return <StatusBadge status={status} tone={agreementTones[status]} />;
}
