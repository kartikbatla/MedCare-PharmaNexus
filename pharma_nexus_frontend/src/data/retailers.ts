export type RetailerStatus =
  | 'Pending'
  | 'Under Review'
  | 'Documents Required'
  | 'Verified'
  | 'Approved'
  | 'Active'
  | 'Rejected';

export type DocumentStatus = 'Pending' | 'Uploaded' | 'Verified' | 'Rejected' | 'Action Required';

export type SignatoryStatus = 'Pending' | 'Verified' | 'Rejected';

export type AgreementStatus = 'Not Accepted' | 'Accepted' | 'Signed' | 'Verified';

export type ChangeIssue =
  | 'Missing document'
  | 'Invalid document'
  | 'Business information mismatch'
  | 'Signatory verification required'
  | 'Contract issue'
  | 'Other';

export interface OnboardingDocument {
  id: string;
  label: string;
  status: DocumentStatus;
  fileName?: string;
  uploadDate?: string;
  verifiedBy?: string;
  reviewerComment?: string;
  required: boolean;
}

export interface AuthorizedSignatory {
  id: string;
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  authority: string;
  status: SignatoryStatus;
  reason?: string;
}

export interface RetailerAgreement {
  version: string;
  status: AgreementStatus;
  acceptedDate?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  signedFileName?: string;
  reviewedBy?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
}

export interface RequestedChange {
  issue: ChangeIssue;
  comments: string;
  requestedAt: string;
}

export interface RetailerBusiness {
  legalName: string;
  tradeName: string;
  businessType: string;
  registrationNumber: string;
  gstin: string;
  pan: string;
  drugLicense: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
}

export interface RetailerContact {
  fullName: string;
  designation: string;
  phone: string;
  email: string;
}

export interface Retailer {
  id: string;
  applicationNumber: string;
  business: RetailerBusiness;
  contact: RetailerContact;
  documents: OnboardingDocument[];
  signatories: AuthorizedSignatory[];
  agreement: RetailerAgreement;
  status: RetailerStatus;
  submittedDate?: string;
  submittedAt?: string;
  requestedChange?: RequestedChange;
  rejectionReason?: string;
  audit: AuditEntry[];
}

export const DOCUMENT_OPTIONS = [
  { id: 'registration', label: 'Business Registration Certificate' },
  { id: 'gst', label: 'GST Certificate' },
  { id: 'pan', label: 'PAN / Business Tax Document' },
  { id: 'drug-license', label: 'Drug / Pharmacy License' },
  { id: 'address-proof', label: 'Business Address Proof' },
  { id: 'other', label: 'Other Required Regulatory Documents' },
];

export function defaultDocuments(): OnboardingDocument[] {
  return DOCUMENT_OPTIONS.map((d) => ({ id: d.id, label: d.label, status: 'Pending', required: true }));
}

export function defaultAgreement(): RetailerAgreement {
  return { version: 'v1.0', status: 'Not Accepted' };
}

export function retailerCanOrder(r: Retailer | undefined): boolean {
  return r?.status === 'Active';
}

const STORAGE_KEY = 'pharmanexus-retailers-v1';
let cache: Retailer[] | null = null;

export function loadRetailers(): Retailer[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Retailer[]) : seedRetailers();
  } catch {
    cache = seedRetailers();
  }
  return cache;
}

export function saveRetailers(list: Retailer[]) {
  cache = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    cache = null;
  }
}

export function findRetailerByEmail(email: string): Retailer | undefined {
  const e = email.trim().toLowerCase();
  return loadRetailers().find((r) => r.business.email.toLowerCase() === e || r.contact.email.toLowerCase() === e);
}

export function retailerById(id: string): Retailer | undefined {
  return loadRetailers().find((r) => r.id === id);
}

export function nextApplicationNumber(list: Retailer[]): string {
  const max = list.reduce((m, r) => {
    const n = Number(r.applicationNumber.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `RAPP-${max + 1}`;
}

function doc(
  id: string,
  label: string,
  status: DocumentStatus,
  fileName?: string,
  uploadDate?: string,
  verifiedBy?: string,
  reviewerComment?: string,
  required = true,
): OnboardingDocument {
  return { id, label, status, fileName, uploadDate, verifiedBy, reviewerComment, required };
}

function audit(id: string, timestamp: string, action: string, actor: string): AuditEntry {
  return { id, timestamp, action, actor };
}

function seedRetailers(): Retailer[] {
  return [
    {
      id: 'careplus',
      applicationNumber: 'RAPP-1001',
      business: {
        legalName: 'CarePlus Retail LLP',
        tradeName: 'CarePlus Pharmacy',
        businessType: 'Retail Pharmacy Chain',
        registrationNumber: 'U74999MH2018LTC31045',
        gstin: '27AAAPC1234F1Z5',
        pan: 'AAAPC1234F',
        drugLicense: 'MH-DL-2020-004891',
        address: 'Shop 12, Linking Road, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        phone: '+91 98200 44567',
        email: 'rahul@carepluspharmacy.in',
      },
      contact: {
        fullName: 'Rahul Mehta',
        designation: 'Director',
        phone: '+91 98200 44567',
        email: 'rahul@carepluspharmacy.in',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Verified', 'careplus-reg-cert.pdf', '02 Aug 2026', 'Anita Sharma'),
        doc('gst', 'GST Certificate', 'Verified', 'careplus-gst-cert.pdf', '02 Aug 2026', 'Anita Sharma'),
        doc('pan', 'PAN / Business Tax Document', 'Verified', 'careplus-pan.pdf', '02 Aug 2026', 'Anita Sharma'),
        doc('drug-license', 'Drug / Pharmacy License', 'Verified', 'careplus-drug-license.pdf', '02 Aug 2026', 'Anita Sharma'),
        doc('address-proof', 'Business Address Proof', 'Verified', 'careplus-address.pdf', '03 Aug 2026', 'Anita Sharma'),
        doc('other', 'Other Required Regulatory Documents', 'Verified', 'careplus-consent.pdf', '03 Aug 2026', 'Anita Sharma'),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Rahul Mehta',
          designation: 'Director',
          email: 'rahul@carepluspharmacy.in',
          phone: '+91 98200 44567',
          authority: 'Full authority to order and accept invoices',
          status: 'Verified',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Verified',
        acceptedDate: '03 Aug 2026',
        signatoryName: 'Rahul Mehta',
        signatoryDesignation: 'Director',
        signedFileName: 'careplus-retailer-agreement.pdf',
        reviewedBy: 'Anita Sharma',
      },
      status: 'Active',
      submittedDate: '02 Aug',
      submittedAt: '02 Aug 2026, 09:41 AM',
      audit: [
        audit('a1', '03 Aug 2026, 02:15 PM', 'Retailer agreement verified.', 'Anita Sharma'),
        audit('a2', '03 Aug 2026, 02:10 PM', 'Authorized signatory verified.', 'Anita Sharma'),
        audit('a3', '03 Aug 2026, 11:02 AM', 'Drug license verified.', 'Anita Sharma'),
        audit('a4', '03 Aug 2026, 10:45 AM', 'GST certificate verified.', 'Anita Sharma'),
        audit('a5', '03 Aug 2026, 10:32 AM', 'Business registration certificate verified.', 'Anita Sharma'),
        audit('a6', '02 Aug 2026, 09:41 AM', 'Retailer application submitted.', 'Rahul Mehta'),
      ],
    },
    {
      id: 'abc',
      applicationNumber: 'RAPP-1007',
      business: {
        legalName: 'ABC Healthcare Pvt Ltd',
        tradeName: 'ABC Pharmacy',
        businessType: 'Independent Retail Pharmacy',
        registrationNumber: 'U74999DL2016PTC30521',
        gstin: '07ABCCA4321Q1Z8',
        pan: 'ABCCA4321Q',
        drugLicense: 'DL-DL-2019-009218',
        address: '14, Model Town Market, GT Karnal Road',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110009',
        phone: '+91 98110 22334',
        email: 'abc@abchealthcare.com',
      },
      contact: {
        fullName: 'Rahul Sharma',
        designation: 'Director',
        phone: '+91 98110 22334',
        email: 'rahul.sharma@abchealthcare.com',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Uploaded', 'abc-reg-cert.pdf', '16 Aug 2026'),
        doc('gst', 'GST Certificate', 'Uploaded', 'abc-gst-cert.pdf', '16 Aug 2026'),
        doc('pan', 'PAN / Business Tax Document', 'Uploaded', 'abc-pan.pdf', '16 Aug 2026'),
        doc('drug-license', 'Drug / Pharmacy License', 'Uploaded', 'abc-drug-license.pdf', '16 Aug 2026'),
        doc('address-proof', 'Business Address Proof', 'Pending'),
        doc('other', 'Other Required Regulatory Documents', 'Pending'),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Rahul Sharma',
          designation: 'Director',
          email: 'rahul.sharma@abchealthcare.com',
          phone: '+91 98110 22334',
          authority: 'Full authority to order and accept invoices',
          status: 'Pending',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Accepted',
        acceptedDate: '16 Aug 2026',
        signatoryName: 'Rahul Sharma',
        signatoryDesignation: 'Director',
      },
      status: 'Under Review',
      submittedDate: '16 Aug',
      submittedAt: '16 Aug 2026, 09:12 AM',
      audit: [
        audit('a1', '16 Aug 2026, 09:12 AM', 'Retailer application submitted.', 'Rahul Sharma'),
      ],
    },
    {
      id: 'xyz',
      applicationNumber: 'RAPP-1006',
      business: {
        legalName: 'XYZ Healthcare LLP',
        tradeName: 'XYZ Medicals',
        businessType: 'Medical Store',
        registrationNumber: 'U74999TN2017LTC29876',
        gstin: '33XYZZA1111B1Z3',
        pan: 'XYZZA1111B',
        drugLicense: 'TN-DL-2018-007124',
        address: '22, Anna Nagar Second Avenue',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600040',
        phone: '+91 98400 55678',
        email: 'priya@xyzhealthcare.com',
      },
      contact: {
        fullName: 'Priya Nair',
        designation: 'Managing Partner',
        phone: '+91 98400 55678',
        email: 'priya@xyzhealthcare.com',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Verified', 'xyz-reg-cert.pdf', '15 Aug 2026', 'Anita Sharma'),
        doc('gst', 'GST Certificate', 'Verified', 'xyz-gst-cert.pdf', '15 Aug 2026', 'Anita Sharma'),
        doc('pan', 'PAN / Business Tax Document', 'Verified', 'xyz-pan.pdf', '15 Aug 2026', 'Anita Sharma'),
        doc('drug-license', 'Drug / Pharmacy License', 'Verified', 'xyz-drug-license.pdf', '15 Aug 2026', 'Anita Sharma'),
        doc('address-proof', 'Business Address Proof', 'Verified', 'xyz-address.pdf', '15 Aug 2026', 'Anita Sharma'),
        doc('other', 'Other Required Regulatory Documents', 'Pending', undefined, undefined, undefined, undefined, false),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Priya Nair',
          designation: 'Managing Partner',
          email: 'priya@xyzhealthcare.com',
          phone: '+91 98400 55678',
          authority: 'Full authority to order and accept invoices',
          status: 'Verified',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Verified',
        acceptedDate: '15 Aug 2026',
        signatoryName: 'Priya Nair',
        signatoryDesignation: 'Managing Partner',
        signedFileName: 'xyz-retailer-agreement.pdf',
        reviewedBy: 'Anita Sharma',
      },
      status: 'Verified',
      submittedDate: '15 Aug',
      submittedAt: '15 Aug 2026, 10:05 AM',
      audit: [
        audit('a1', '15 Aug 2026, 04:20 PM', 'Retailer agreement verified.', 'Anita Sharma'),
        audit('a2', '15 Aug 2026, 04:05 PM', 'Authorized signatory verified.', 'Anita Sharma'),
        audit('a3', '15 Aug 2026, 03:30 PM', 'Drug license verified.', 'Anita Sharma'),
        audit('a4', '15 Aug 2026, 03:15 PM', 'GST certificate verified.', 'Anita Sharma'),
        audit('a5', '15 Aug 2026, 10:05 AM', 'Retailer application submitted.', 'Priya Nair'),
      ],
    },
    {
      id: 'city',
      applicationNumber: 'RAPP-1005',
      business: {
        legalName: 'City Healthcare Pvt Ltd',
        tradeName: 'City Pharmacy',
        businessType: 'Community Pharmacy',
        registrationNumber: 'U74999KA2015PTC28014',
        gstin: '29CITYH2211R1Z1',
        pan: 'CITYH2211R',
        drugLicense: 'KA-DL-2016-005672',
        address: '5, MG Road, Shivaji Nagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+91 99000 77889',
        email: 'city@cityhealthcare.in',
      },
      contact: {
        fullName: 'Arun Kumar',
        designation: 'Proprietor',
        phone: '+91 99000 77889',
        email: 'arun@cityhealthcare.in',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Verified', 'city-reg-cert.pdf', '14 Aug 2026', 'Anita Sharma'),
        doc('gst', 'GST Certificate', 'Rejected', 'city-gst-cert.pdf', '14 Aug 2026', 'Anita Sharma', 'GSTIN does not match the registered business name.'),
        doc('pan', 'PAN / Business Tax Document', 'Uploaded', 'city-pan.pdf', '14 Aug 2026'),
        doc('drug-license', 'Drug / Pharmacy License', 'Uploaded', 'city-drug-license.pdf', '14 Aug 2026'),
        doc('address-proof', 'Business Address Proof', 'Uploaded', 'city-address.pdf', '14 Aug 2026'),
        doc('other', 'Other Required Regulatory Documents', 'Pending'),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Arun Kumar',
          designation: 'Proprietor',
          email: 'arun@cityhealthcare.in',
          phone: '+91 99000 77889',
          authority: 'Full authority to order and accept invoices',
          status: 'Pending',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Accepted',
        acceptedDate: '14 Aug 2026',
        signatoryName: 'Arun Kumar',
        signatoryDesignation: 'Proprietor',
      },
      status: 'Documents Required',
      submittedDate: '14 Aug',
      submittedAt: '14 Aug 2026, 11:30 AM',
      requestedChange: {
        issue: 'Invalid document',
        comments: 'The GSTIN on the uploaded GST certificate does not match the registered business name. Upload a corrected certificate.',
        requestedAt: '15 Aug 2026, 10:15 AM',
      },
      audit: [
        audit('a1', '15 Aug 2026, 10:15 AM', 'Additional information requested: GST certificate does not match business name.', 'Anita Sharma'),
        audit('a2', '14 Aug 2026, 11:30 AM', 'Retailer application submitted.', 'Arun Kumar'),
      ],
    },
    {
      id: 'greenlife',
      applicationNumber: 'RAPP-1004',
      business: {
        legalName: 'GreenLife Healthcare Pvt Ltd',
        tradeName: 'GreenLife Medicos',
        businessType: 'Retail Pharmacy Chain',
        registrationNumber: 'U74999MH2014PTC26542',
        gstin: '27GREEN1234F1Z6',
        pan: 'GREEN1234F',
        drugLicense: 'MH-DL-2015-003412',
        address: '88, FC Road, Shivajinagar',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
        phone: '+91 97650 11223',
        email: 'greenlife@greenlife.in',
      },
      contact: {
        fullName: 'Kavita Deshmukh',
        designation: 'Director',
        phone: '+91 97650 11223',
        email: 'kavita@greenlife.in',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Verified', 'greenlife-reg-cert.pdf', '10 Aug 2026', 'Anita Sharma'),
        doc('gst', 'GST Certificate', 'Verified', 'greenlife-gst-cert.pdf', '10 Aug 2026', 'Anita Sharma'),
        doc('pan', 'PAN / Business Tax Document', 'Verified', 'greenlife-pan.pdf', '10 Aug 2026', 'Anita Sharma'),
        doc('drug-license', 'Drug / Pharmacy License', 'Verified', 'greenlife-drug-license.pdf', '10 Aug 2026', 'Anita Sharma'),
        doc('address-proof', 'Business Address Proof', 'Verified', 'greenlife-address.pdf', '11 Aug 2026', 'Anita Sharma'),
        doc('other', 'Other Required Regulatory Documents', 'Pending', undefined, undefined, undefined, undefined, false),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Kavita Deshmukh',
          designation: 'Director',
          email: 'kavita@greenlife.in',
          phone: '+91 97650 11223',
          authority: 'Full authority to order and accept invoices',
          status: 'Verified',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Verified',
        acceptedDate: '11 Aug 2026',
        signatoryName: 'Kavita Deshmukh',
        signatoryDesignation: 'Director',
        signedFileName: 'greenlife-retailer-agreement.pdf',
        reviewedBy: 'Anita Sharma',
      },
      status: 'Approved',
      submittedDate: '10 Aug',
      submittedAt: '10 Aug 2026, 09:20 AM',
      audit: [
        audit('a1', '13 Aug 2026, 12:00 PM', 'Retailer approved. Account awaiting activation.', 'Anita Sharma'),
        audit('a2', '12 Aug 2026, 04:10 PM', 'Retailer agreement verified.', 'Anita Sharma'),
        audit('a3', '12 Aug 2026, 03:45 PM', 'Authorized signatory verified.', 'Anita Sharma'),
        audit('a4', '11 Aug 2026, 02:30 PM', 'All required documents verified.', 'Anita Sharma'),
        audit('a5', '10 Aug 2026, 09:20 AM', 'Retailer application submitted.', 'Kavita Deshmukh'),
      ],
    },
    {
      id: 'sunrise',
      applicationNumber: 'RAPP-1003',
      business: {
        legalName: 'Sunrise Healthcare Pvt Ltd',
        tradeName: 'Sunrise Medico',
        businessType: 'Medical Store',
        registrationNumber: 'U74999WB2016PTC29103',
        gstin: '19SUNRI9876L1Z4',
        pan: 'SUNRI9876L',
        drugLicense: 'WB-DL-2017-004210',
        address: '31, College Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700073',
        phone: '+91 98300 44556',
        email: 'sunrise@sunrisehealthcare.in',
      },
      contact: {
        fullName: 'Sourav Ghosh',
        designation: 'Owner',
        phone: '+91 98300 44556',
        email: 'sourav@sunrisehealthcare.in',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Uploaded', 'sunrise-reg-cert.pdf', '12 Aug 2026'),
        doc('gst', 'GST Certificate', 'Uploaded', 'sunrise-gst-cert.pdf', '12 Aug 2026'),
        doc('pan', 'PAN / Business Tax Document', 'Uploaded', 'sunrise-pan.pdf', '12 Aug 2026'),
        doc('drug-license', 'Drug / Pharmacy License', 'Uploaded', 'sunrise-drug-license.pdf', '12 Aug 2026'),
        doc('address-proof', 'Business Address Proof', 'Uploaded', 'sunrise-address.pdf', '12 Aug 2026'),
        doc('other', 'Other Required Regulatory Documents', 'Pending'),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Sourav Ghosh',
          designation: 'Owner',
          email: 'sourav@sunrisehealthcare.in',
          phone: '+91 98300 44556',
          authority: 'Full authority to order and accept invoices',
          status: 'Pending',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Accepted',
        acceptedDate: '12 Aug 2026',
        signatoryName: 'Sourav Ghosh',
        signatoryDesignation: 'Owner',
      },
      status: 'Rejected',
      submittedDate: '12 Aug',
      submittedAt: '12 Aug 2026, 10:48 AM',
      rejectionReason: 'Business information mismatch — the PAN submitted belongs to a different entity.',
      audit: [
        audit('a1', '13 Aug 2026, 09:05 AM', 'Retailer application rejected: business information mismatch.', 'Anita Sharma'),
        audit('a2', '12 Aug 2026, 10:48 AM', 'Retailer application submitted.', 'Sourav Ghosh'),
      ],
    },
    {
      id: 'metro',
      applicationNumber: 'RAPP-1008',
      business: {
        legalName: 'Metro Healthcare LLP',
        tradeName: 'Metro Drug House',
        businessType: 'Wholesale-cum-Retail Pharmacy',
        registrationNumber: 'U74999GJ2019LTC32108',
        gstin: '24METRO3344R1Z2',
        pan: 'METRO3344R',
        drugLicense: 'GJ-DL-2020-008901',
        address: '9, Ring Road, Surat',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395002',
        phone: '+91 97250 88990',
        email: 'metro@metrohealthcare.in',
      },
      contact: {
        fullName: 'Ramesh Patel',
        designation: 'Partner',
        phone: '+91 97250 88990',
        email: 'ramesh@metrohealthcare.in',
      },
      documents: [
        doc('registration', 'Business Registration Certificate', 'Uploaded', 'metro-reg-cert.pdf', '16 Aug 2026'),
        doc('gst', 'GST Certificate', 'Uploaded', 'metro-gst-cert.pdf', '16 Aug 2026'),
        doc('pan', 'PAN / Business Tax Document', 'Uploaded', 'metro-pan.pdf', '16 Aug 2026'),
        doc('drug-license', 'Drug / Pharmacy License', 'Pending'),
        doc('address-proof', 'Business Address Proof', 'Pending'),
        doc('other', 'Other Required Regulatory Documents', 'Pending'),
      ],
      signatories: [
        {
          id: 'sig-1',
          fullName: 'Ramesh Patel',
          designation: 'Partner',
          email: 'ramesh@metrohealthcare.in',
          phone: '+91 97250 88990',
          authority: 'Full authority to order and accept invoices',
          status: 'Pending',
        },
      ],
      agreement: {
        version: 'v1.0',
        status: 'Accepted',
        acceptedDate: '16 Aug 2026',
        signatoryName: 'Ramesh Patel',
        signatoryDesignation: 'Partner',
      },
      status: 'Pending',
      submittedDate: '16 Aug',
      submittedAt: '16 Aug 2026, 08:55 AM',
      audit: [
        audit('a1', '16 Aug 2026, 08:55 AM', 'Retailer application submitted.', 'Ramesh Patel'),
      ],
    },
  ];
}
