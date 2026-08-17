import { useState } from 'react';
import { LifeBuoy, Mail, Phone, Send } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

const faqs: Array<[string, string]> = [
  ['How is demand forecast?', 'The forecasting engine combines 12 weeks of historical sales, seasonal patterns, regional health signals and pending orders to project weekly demand with confidence bands.'],
  ['Why does the system prefer transfers over purchases?', 'Reusing surplus stock from another warehouse costs nothing and avoids new purchases. External procurement happens only after viable internal transfers are exhausted.'],
  ['What is FEFO?', 'First Expiry, First Out — inventory with the earliest expiry date is dispatched first, reducing write-offs and regulatory risk.'],
  ['How does OCR invoice processing work?', 'Invoices are scanned, fields are extracted with confidence scores, then cross-checked against the PO ledger for price, quantity, supplier and duplicate-invoice anomalies.'],
  ['What happens after a 3-way match succeeds?', 'The invoice is automatically routed to payment approval. If a match fails, the exact differences are highlighted for review before payment is released.'],
  ['How do retail store orders flow into procurement?', 'Orders placed by retail stores create material requests in the admin portal, marked as under review until they are approved and fulfilled.'],
];

export default function Help() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', question: '' });
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!form.name || !form.email || !form.subject || !form.question) {
      toast('error', 'Missing fields', 'Please fill in your name, email, subject and question.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Documentation"
        subtitle="Answers to common questions about PharmaNexus"
      />

      <Card>
        <div className="flex items-center gap-2.5 px-5 pt-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-muted">
            <LifeBuoy size={15} />
          </span>
          <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Frequently asked questions</h2>
        </div>
        <div className="divide-y divide-brand-navy/5 px-5 pb-2">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium text-brand-charcoal">
                {q}
                <span className="text-brand-charcoal/30 transition-transform group-open:rotate-90">›</span>
              </summary>
              <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-brand-charcoal/60">{a}</p>
            </details>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <div className="p-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Need More Help?</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/60">
              Reach out to the PharmaNexus support team. Support hours are Monday to Saturday, 9:00 AM to 6:00 PM IST.
            </p>
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2.5 rounded-lg border border-brand-navy/8 px-3.5 py-2.5 text-[13px] text-brand-charcoal/75">
                <Phone size={14} className="shrink-0 text-brand-muted" />
                <span className="truncate">[Official PharmaNexus Support Number]</span>
              </p>
              <p className="flex items-center gap-2.5 rounded-lg border border-brand-navy/8 px-3.5 py-2.5 text-[13px] text-brand-charcoal/75">
                <Mail size={14} className="shrink-0 text-brand-muted" />
                <span className="truncate">[Official PharmaNexus Support Email]</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="p-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Still Have a Question?</h2>
            <p className="mt-1 text-[13px] text-brand-charcoal/60">
              Submit your query and the support team will get back to you.
            </p>

            {submitted ? (
              <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-status-success/25 bg-status-successBg/40 px-6 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-success text-white">
                  <Send size={17} />
                </span>
                <p className="text-[15px] font-semibold text-brand-charcoal">Thank you.</p>
                <p className="text-[13.5px] text-brand-charcoal/65">Your query has been submitted successfully.</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', question: '' }); }}>
                  Submit another query
                </Button>
              </div>
            ) : (
              <form
                className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <div>
                  <label className="label" htmlFor="help-name">Name</label>
                  <input
                    id="help-name"
                    className="input"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="help-email">Email</label>
                  <input
                    id="help-email"
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="help-phone">Phone Number</label>
                  <input
                    id="help-phone"
                    type="tel"
                    className="input"
                    placeholder="+91 …"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="help-subject">Subject</label>
                  <input
                    id="help-subject"
                    className="input"
                    placeholder="What is this about?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="help-question">Your Question</label>
                  <textarea
                    id="help-question"
                    className="input min-h-[100px] resize-none"
                    placeholder="Describe your question in detail…"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">
                    <Send size={15} /> Submit Query
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
