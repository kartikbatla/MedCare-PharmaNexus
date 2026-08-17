import type { OnboardingDocument } from '../../data/retailers';

export function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const AGREEMENT_VERSION = 'v1.0';

export const AGREEMENT_TEXT = `PHARMANEXUS RETAILER AGREEMENT (v1.0)

This Retailer Agreement (the "Agreement") is entered into between the authorized PharmaNexus warehouse / distributor and the retailer identified in the onboarding application.

1. ORDERING
   The retailer may place orders through the PharmaNexus retail portal only after its business details, required documents, authorized signatories and this Agreement have been verified and its account has been approved and activated by the authorized distributor.

2. VERIFICATION
   The retailer agrees to submit accurate business information and genuine documents. PharmaNexus reserves the right to verify documents, request corrections, or reject the application if any information is found to be inaccurate.

3. SUPPLY & PAYMENT
   Orders are fulfilled based on availability. Indicative prices are displayed for demo purposes. Payment terms are as per the retailer's approved account.

4. COMPLIANCE
   The retailer agrees to comply with applicable drug licensing, GST and statutory requirements, and to maintain valid licenses for the duration of the Agreement.

5. TERMINATION
   PharmaNexus may suspend or terminate ordering access if the retailer breaches this Agreement or fails to maintain required licenses.

6. DEMO NOTICE
   This is a demonstration agreement for the PharmaNexus demo application. It does not constitute a binding legal contract.

By accepting this Agreement, the authorized signatory confirms they have the authority to bind the retailer business to these terms.
`;

export function documentPreviewContent(doc: OnboardingDocument): string {
  return `PharmaNexus — Retailer Document (demo)

Document        : ${doc.label}
Status          : ${doc.status}
Uploaded        : ${doc.uploadDate ?? '—'}
File            : ${doc.fileName ?? '—'}
Uploaded by     : Retailer
Size            : ~148 KB (simulated)

--- DEMO DOCUMENT PREVIEW ---

This is a simulated secure preview of the uploaded "${doc.label}".
In the production environment, an encrypted, access-restricted scan of the
original document would be shown here. Access is limited to authorized
warehouse / distributor administrators performing verification.
`;
}

export function agreementDownloadContent(retailerName: string, signatoryName: string, version: string): string {
  return `${AGREEMENT_TEXT}

Retailer     : ${retailerName}
Signatory    : ${signatoryName}
Version      : ${version}
Downloaded from the PharmaNexus demo — not a binding document.
`;
}
