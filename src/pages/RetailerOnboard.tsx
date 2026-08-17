import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Download,
  Eye,
  FileUp,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useRetailers } from '../context/RetailerContext';
import { useToast } from '../context/ToastContext';
import { DocumentBadge, SignatoryBadge, AgreementBadge } from '../components/onboarding/RetailerBadges';
import {
  AGREEMENT_VERSION,
  AGREEMENT_TEXT,
  agreementDownloadContent,
  documentPreviewContent,
  downloadTextFile,
} from '../components/onboarding/helpers';
import {
  defaultAgreement,
  defaultDocuments,
  nextApplicationNumber,
  type AuthorizedSignatory,
  type ChangeIssue,
  type OnboardingDocument,
  type Retailer,
  type RetailerBusiness,
  type RetailerContact,
  type RetailerAgreement,
} from '../data/retailers';
import { cn } from '../lib/utils';

const STEPS = [
  'Business Details',
  'Documents',
  'Authorized Signatories',
  'Agreement',
  'Verification',
  'Review & Approval',
];

const CHANGE_ISSUES: ChangeIssue[] = [
  'Missing document',
  'Invalid document',
  'Business information mismatch',
  'Signatory verification required',
  'Contract issue',
  'Other',
];

const EMPTY_BUSINESS: RetailerBusiness = {
  legalName: '',
  tradeName: '',
  businessType: '',
  registrationNumber: '',
  gstin: '',
  pan: '',
  drugLicense: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
};

const EMPTY_CONTACT: RetailerContact = { fullName: '', designation: '', phone: '', email: '' };

function emptySignatory(): AuthorizedSignatory {
  return {
    id: `sig-${Date.now().toString(36)}`,
    fullName: '',
    designation: '',
    email: '',
    phone: '',
    authority: 'Full authority to order and accept invoices',
    status: 'Pending',
  };
}

function dayLabel(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function nowLabel(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${`${d.getMinutes()}`.padStart(2, '0')} ${ampm}`;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
}

function Field({ label, value, onChange, type = 'text', placeholder, full }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', full && 'sm:col-span-2')}>
      <label className="label">{label}</label>
      <input type={type} className="input h-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function RetailerOnboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { retailers, createApplication } = useRetailers();

  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState<RetailerBusiness>(EMPTY_BUSINESS);
  const [contact, setContact] = useState<RetailerContact>(EMPTY_CONTACT);
  const [documents, setDocuments] = useState<OnboardingDocument[]>(defaultDocuments());
  const [signatories, setSignatories] = useState<AuthorizedSignatory[]>([emptySignatory()]);
  const [agreement, setAgreement] = useState<RetailerAgreement>(defaultAgreement());
  const [accepted, setAccepted] = useState(false);
  const [viewDoc, setViewDoc] = useState<OnboardingDocument | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changeIssue, setChangeIssue] = useState<ChangeIssue>('Missing document');
  const [changeComments, setChangeComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const setBiz = (k: keyof RetailerBusiness) => (v: string) => setBusiness((b) => ({ ...b, [k]: v }));
  const setCon = (k: keyof RetailerContact) => (v: string) => setContact((c) => ({ ...c, [k]: v }));

  const businessComplete = business.legalName && business.tradeName && business.gstin && business.email && business.city;
  const contactComplete = contact.fullName && contact.designation && contact.phone && contact.email;
  const docsUploaded = documents.filter((d) => d.required && d.status === 'Uploaded').length;
  const signatoryComplete = signatories[0]?.fullName && signatories[0]?.designation && signatories[0]?.email;
  const agreementSigned = agreement.status === 'Signed' && accepted;

  const uploadDoc = (id: string) => {
    setDocuments((ds) =>
      ds.map((d) =>
        d.id === id ? { ...d, status: 'Uploaded', fileName: `demo-${id}.pdf`, uploadDate: dayLabel(), reviewerComment: undefined } : d,
      ),
    );
  };

  const toggleRequired = (id: string) => {
    setDocuments((ds) => ds.map((d) => (d.id === id ? { ...d, required: !d.required } : d)));
  };

  const setSignatory = (id: string, k: keyof AuthorizedSignatory, v: string) => {
    setSignatories((ss) => ss.map((s) => (s.id === id ? { ...s, [k]: v } : s)));
  };

  const markSignatoryVerified = (id: string) => {
    setSignatories((ss) => ss.map((s) => (s.id === id ? { ...s, status: 'Verified' } : s)));
  };

  const primarySignatory = signatories[0];

  const buildRetailer = (status: Retailer['status'], extra: Partial<Retailer>): Retailer => {
    const today = dayLabel();
    const now = nowLabel();
    return {
      id: `r-${Date.now().toString(36)}`,
      applicationNumber: nextApplicationNumber(retailers),
      business,
      contact,
      documents,
      signatories,
      agreement: agreementSigned ? { ...agreement, signatoryName: agreement.signatoryName || primarySignatory?.fullName, signatoryDesignation: agreement.signatoryDesignation || primarySignatory?.designation } : agreement,
      status,
      submittedDate: today,
      submittedAt: now,
      audit: [
        { id: 'a1', timestamp: now, action: 'Retailer application submitted.', actor: contact.fullName || 'Admin' },
        ...(extra.audit ?? []),
      ],
      ...extra,
    };
  };

  const doApprove = () => {
    const r = buildRetailer('Active', {
      audit: [
        {
          id: 'a0',
          timestamp: nowLabel(),
          action: 'Retailer approved and account activated — ordering enabled.',
          actor: 'Anita Sharma',
        },
      ],
    });
    createApplication(r);
    toast('success', 'Retailer approved', `${r.business.tradeName} is now an active retailer and can place orders.`);
    navigate(`/retailers/${r.id}`);
  };

  const doRequestChanges = () => {
    const r = buildRetailer('Documents Required', {
      requestedChange: { issue: changeIssue, comments: changeComments, requestedAt: nowLabel() },
      audit: [
        {
          id: 'a0',
          timestamp: nowLabel(),
          action: `Additional information requested: ${changeIssue} — ${changeComments}`,
          actor: 'Anita Sharma',
        },
      ],
    });
    createApplication(r);
    toast('warning', 'Changes requested', 'The retailer will be notified about what needs to be corrected.');
    navigate(`/retailers/${r.id}`);
  };

  const doReject = () => {
    const r = buildRetailer('Rejected', {
      rejectionReason: rejectReason,
      audit: [{ id: 'a0', timestamp: nowLabel(), action: `Retailer application rejected: ${rejectReason}`, actor: 'Anita Sharma' }],
    });
    createApplication(r);
    toast('error', 'Application rejected', `${r.business.tradeName} was not approved.`);
    navigate(`/retailers/${r.id}`);
  };

  const canNext =
    step === 0 ? Boolean(businessComplete && contactComplete) : step === 1 ? docsUploaded > 0 : step === 2 ? Boolean(signatoryComplete) : step === 3 ? agreementSigned : step === 4 ? true : true;

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const back = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigate('/retailers');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Onboard New Retailer"
        subtitle="A structured verification workflow for onboarding a new retailer business."
      />

      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <button
                onClick={() => i < step && setStep(i)}
                className="flex items-center gap-2"
                disabled={i > step}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors',
                    done && 'bg-status-success text-white',
                    active && 'bg-brand-navy text-white',
                    !done && !active && 'border border-brand-navy/20 text-brand-charcoal/40',
                  )}
                >
                  {done ? <Check size={13} /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-[12.5px] font-medium sm:block',
                    active ? 'text-brand-navy' : done ? 'text-brand-charcoal/60' : 'text-brand-charcoal/35',
                  )}
                >
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-2 h-px flex-1', i < step ? 'bg-status-success' : 'bg-brand-navy/15')} />
              )}
            </div>
          );
        })}
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[15px] font-semibold text-brand-charcoal">Business Information</h3>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">Registered details of the retailer business.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Legal Business Name" value={business.legalName} onChange={setBiz('legalName')} placeholder="ABC Healthcare Pvt Ltd" full />
              <Field label="Trade Name" value={business.tradeName} onChange={setBiz('tradeName')} placeholder="ABC Pharmacy" />
              <Field label="Business Type" value={business.businessType} onChange={setBiz('businessType')} placeholder="Retail Pharmacy" />
              <Field label="Business Registration Number" value={business.registrationNumber} onChange={setBiz('registrationNumber')} />
              <Field label="GSTIN" value={business.gstin} onChange={setBiz('gstin')} placeholder="07XXXXXXXXXX1Z8" />
              <Field label="PAN" value={business.pan} onChange={setBiz('pan')} placeholder="ABCDE1234F" />
              <Field label="Pharmacy / Drug License Number" value={business.drugLicense} onChange={setBiz('drugLicense')} placeholder="DL-DL-2020-000000" />
              <Field label="Business Address" value={business.address} onChange={setBiz('address')} full />
              <Field label="City" value={business.city} onChange={setBiz('city')} />
              <Field label="State" value={business.state} onChange={setBiz('state')} />
              <Field label="PIN Code" value={business.pincode} onChange={setBiz('pincode')} />
              <Field label="Business Phone" value={business.phone} onChange={setBiz('phone')} />
              <Field label="Business Email" value={business.email} onChange={setBiz('email')} type="email" />
            </div>

            <div className="border-t border-brand-navy/5 pt-6">
              <h3 className="text-[15px] font-semibold text-brand-charcoal">Contact Person</h3>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                The person PharmaNexus will liaise with for this application.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" value={contact.fullName} onChange={setCon('fullName')} placeholder="Rahul Sharma" />
                <Field label="Designation" value={contact.designation} onChange={setCon('designation')} placeholder="Director" />
                <Field label="Phone Number" value={contact.phone} onChange={setCon('phone')} />
                <Field label="Email Address" value={contact.email} onChange={setCon('email')} type="email" />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-semibold text-brand-charcoal">Business Documents</h3>
                <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                  Required documents are configurable. Uploads are treated as sensitive business records.
                </p>
              </div>
              <span className="badge bg-brand-navy/6 text-brand-muted">{docsUploaded} uploaded</span>
            </div>
            {documents.map((d) => (
              <div key={d.id} className="rounded-xl border border-brand-navy/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-brand-charcoal">
                      {d.label}
                      {!d.required && <span className="badge bg-brand-navy/6 text-brand-charcoal/50">Optional</span>}
                    </p>
                    <p className="mt-1 text-[12px] text-brand-charcoal/50">
                      {d.status === 'Uploaded' ? (
                        <>
                          <Check size={12} className="mr-1 inline text-status-success" />
                          Uploaded · {d.fileName} · {d.uploadDate}
                        </>
                      ) : (
                        'Not yet uploaded'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-brand-charcoal/55">
                      <input
                        type="checkbox"
                        checked={d.required}
                        onChange={() => toggleRequired(d.id)}
                        className="h-3.5 w-3.5 accent-brand-navy"
                      />
                      Required
                    </label>
                    <Button
                      variant={d.status === 'Uploaded' ? 'ghost' : 'primary'}
                      size="sm"
                      icon={d.status === 'Uploaded' ? <Eye size={13} /> : <FileUp size={13} />}
                      onClick={() => (d.status === 'Uploaded' ? setViewDoc(d) : uploadDoc(d.id))}
                    >
                      {d.status === 'Uploaded' ? 'View' : 'Upload'}
                    </Button>
                  </div>
                </div>
                {d.status === 'Uploaded' && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-brand-charcoal/45">
                    <DocumentBadge status={d.status} />
                    <span>Verification will be completed during review.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-brand-charcoal">Authorized Signatories</h3>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                People authorized to represent the retailer and place orders on its behalf.
              </p>
            </div>
            {signatories.map((s, i) => (
              <div key={s.id} className="rounded-xl border border-brand-navy/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-brand-muted">Signatory {i + 1}</p>
                  {signatories.length > 1 && (
                    <button
                      onClick={() => setSignatories((ss) => ss.filter((x) => x.id !== s.id))}
                      className="rounded-lg p-1.5 text-brand-charcoal/40 transition-colors hover:bg-status-dangerBg hover:text-status-danger"
                      aria-label="Remove signatory"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full Name" value={s.fullName} onChange={(v) => setSignatory(s.id, 'fullName', v)} />
                  <Field label="Designation" value={s.designation} onChange={(v) => setSignatory(s.id, 'designation', v)} />
                  <Field label="Official Email" value={s.email} onChange={(v) => setSignatory(s.id, 'email', v)} type="email" />
                  <Field label="Phone Number" value={s.phone} onChange={(v) => setSignatory(s.id, 'phone', v)} />
                  <Field
                    label="Role / Authority"
                    value={s.authority}
                    onChange={(v) => setSignatory(s.id, 'authority', v)}
                    full
                  />
                </div>
              </div>
            ))}
            <Button variant="secondary" icon={<Plus size={14} />} onClick={() => setSignatories((ss) => [...ss, emptySignatory()])}>
              Add Signatory
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[15px] font-semibold text-brand-charcoal">Contract / Agreement</h3>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                The PharmaNexus Retailer Agreement must be accepted by an authorized signatory.
              </p>
            </div>
            <div className="rounded-xl border border-brand-navy/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[14.5px] font-semibold text-brand-charcoal">PharmaNexus Retailer Agreement</p>
                  <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                    Version {AGREEMENT_VERSION} · effective from the date of acceptance
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={<Eye size={13} />} onClick={() => setViewDoc({ id: 'agreement', label: 'PharmaNexus Retailer Agreement', status: agreement.status === 'Not Accepted' ? 'Pending' : agreement.status === 'Signed' ? 'Verified' : 'Uploaded', fileName: 'pharmanexus-retailer-agreement.pdf', uploadDate: dayLabel(), required: true })}>
                    View Agreement
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={() => downloadTextFile('PharmaNexus-Retailer-Agreement.txt', agreementDownloadContent(business.tradeName || 'Retailer', primarySignatory?.fullName || 'Signatory', AGREEMENT_VERSION))}>
                    Download Agreement
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-brand-navy/5 pt-4">
                <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-brand-charcoal/75">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-brand-navy"
                  />
                  <span>
                    I confirm that <span className="font-semibold">{primarySignatory?.fullName || 'the signatory'}</span> (
                    {primarySignatory?.designation || 'designation'}) accepts this agreement on behalf of{' '}
                    {business.tradeName || 'the business'}.
                  </span>
                </label>
                <Button
                  variant={agreement.status === 'Signed' ? 'ghost' : 'primary'}
                  size="sm"
                  icon={agreement.status === 'Signed' ? <Check size={13} /> : <FileUp size={13} />}
                  onClick={() =>
                    setAgreement((a) => ({
                      ...a,
                      status: 'Signed',
                      signedFileName: 'retailer-signed-agreement.pdf',
                      acceptedDate: dayLabel(),
                      signatoryName: a.signatoryName || primarySignatory?.fullName,
                      signatoryDesignation: a.signatoryDesignation || primarySignatory?.designation,
                    }))
                  }
                >
                  {agreement.status === 'Signed' ? 'Signed' : 'Upload Signed Agreement'}
                </Button>
                <div className="flex items-center gap-2">
                  <AgreementBadge status={agreement.status} />
                  {agreement.status === 'Signed' && (
                    <span className="text-[12px] text-brand-charcoal/45">
                      Signed by {agreement.signatoryName} · {agreement.acceptedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-brand-charcoal">Verification</h3>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                Confirm what has been submitted before the application is reviewed.
              </p>
            </div>
            <div className="space-y-2.5">
              <CheckRow ok title="Business details submitted" sub={business.tradeName || '—'} />
              {documents.filter((d) => d.required).map((d) => (
                <CheckRow
                  key={d.id}
                  ok={d.status === 'Uploaded'}
                  title={d.label}
                  sub={d.status === 'Uploaded' ? `Uploaded · ${d.fileName}` : 'Not uploaded'}
                  right={<DocumentBadge status={d.status} />}
                />
              ))}
              <CheckRow ok={Boolean(signatoryComplete)} title="Authorized signatory provided" sub={primarySignatory?.fullName || '—'} />
              <CheckRow ok={agreementSigned} title="Agreement accepted and signed" sub={agreement.status} />
            </div>
            <div className="border-t border-brand-navy/5 pt-4">
              <p className="mb-2 text-[13px] font-semibold text-brand-charcoal">Signatory verification</p>
              {signatories.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-navy/10 p-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold text-brand-charcoal">{s.fullName || 'Signatory'}</p>
                    <p className="text-[12px] text-brand-charcoal/50">{s.designation} · {s.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SignatoryBadge status={s.status} />
                    {s.status !== 'Verified' && (
                      <Button variant="secondary" size="sm" icon={<ShieldCheck size={13} />} onClick={() => markSignatoryVerified(s.id)}>
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[15px] font-semibold text-brand-charcoal">Retailer Verification Summary</h3>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">Final review before the retailer account is activated.</p>
            </div>
            <div className="rounded-xl border border-brand-navy/10">
              <SummaryRow ok title="Business" sub="Business details submitted" />
              <SummaryRow ok={documents.find((d) => d.id === 'gst')?.status === 'Uploaded'} title="GST" sub="Document uploaded" />
              <SummaryRow ok={documents.find((d) => d.id === 'registration')?.status === 'Uploaded'} title="Business Registration" sub="Document uploaded" />
              <SummaryRow ok={documents.find((d) => d.id === 'drug-license')?.status === 'Uploaded'} title="Pharmacy License" sub="Document uploaded" />
              <SummaryRow ok={signatories[0]?.status === 'Verified'} title="Authorized Signatory" sub={signatories[0]?.status === 'Verified' ? 'Verified' : 'Verification pending'} />
              <SummaryRow ok={agreementSigned} title="Retailer Agreement" sub={agreementSigned ? 'Signed' : 'Not signed'} />
            </div>
            <div className="rounded-xl border border-status-success/25 bg-status-successBg/40 p-4 text-center">
              <p className="text-[15px] font-semibold text-status-success">Ready for Approval</p>
              <p className="mt-0.5 text-[12.5px] text-brand-charcoal/55">
                Approving activates the retailer account and enables medicine ordering.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" icon={<ShieldCheck size={15} />} onClick={doApprove}>
                Approve Retailer
              </Button>
              <Button variant="secondary" onClick={() => setRequestOpen(true)}>
                Request Changes
              </Button>
              <Button variant="ghost" className="text-status-danger hover:bg-status-dangerBg" onClick={() => setRejectOpen(true)}>
                Reject Application
              </Button>
            </div>
          </div>
        )}

        {step < STEPS.length - 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-brand-navy/5 pt-5">
            <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={back}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button icon={<ArrowRight size={15} />} disabled={!canNext} onClick={next}>
              Continue
            </Button>
          </div>
        )}
      </Card>

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
          subtitle="Send the retailer a list of corrections required."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button>
              <Button disabled={!changeComments.trim()} onClick={doRequestChanges}>
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
              <Button disabled={!rejectReason.trim()} variant="danger" onClick={doReject}>
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

function CheckRow({ ok, title, sub, right }: { ok: boolean; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-navy/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            ok ? 'bg-status-success text-white' : 'bg-status-warningBg text-status-warning',
          )}
        >
          {ok ? <Check size={13} /> : <Circle size={12} />}
        </span>
        <div>
          <p className="text-[13.5px] font-semibold text-brand-charcoal">{title}</p>
          {sub && <p className="text-[12px] text-brand-charcoal/50">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function SummaryRow({ ok, title, sub }: { ok: boolean; title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-navy/5 px-5 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            ok ? 'bg-status-success text-white' : 'bg-status-warningBg text-status-warning',
          )}
        >
          {ok ? <Check size={13} /> : <Circle size={12} />}
        </span>
        <div>
          <p className="text-[13.5px] font-semibold text-brand-charcoal">{title}</p>
          {sub && <p className="text-[12px] text-brand-charcoal/50">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
