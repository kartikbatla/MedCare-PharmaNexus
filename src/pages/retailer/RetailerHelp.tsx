import { useState } from 'react';
import { LifeBuoy, Mail, Phone, Send } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const faqs: Array<[string, string]> = [
  ['How do I place an order?', 'Add medicines to your cart, complete the checkout with your delivery address and payment method, and submit. Your order is created as a material request in the PharmaNexus portal and goes under review before dispatch.'],
  ['How do I track my order?', 'Open My Orders from the top navigation. Each order shows its live status — Submitted, Under Review, Approved, Shipped and Delivered.'],
  ['How long does delivery take?', 'Approved orders are typically delivered within 2–4 business days, depending on your delivery location.'],
  ['How do I reorder a previous order?', 'Go to My Orders, find a delivered order and use the reorder icon. The same medicines are added back to your cart.'],
  ['How is the price determined?', 'Prices shown are indicative demo values from the PharmaNexus dataset. Final pricing depends on the order, pack size and approved supplier rate.'],
  ['What payment methods are accepted?', 'UPI, Card, Net Banking, Business Account and Credit / Invoice options are available during checkout.'],
  ['Can I return or cancel an order?', 'Orders under review can be cancelled. For delivered orders, contact support with your Order ID for return assistance.'],
];

export default function RetailerHelp() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', orderId: '', subject: '', question: '' });
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
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <LifeBuoy size={20} /> Help & Support
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">
          Answers to common questions about ordering on the PharmaNexus Retail Portal.
        </p>
      </div>

      <Card>
        <div className="px-5 pt-5">
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
            <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Need Help?</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-charcoal/60">
              Talk to the PharmaNexus retail support team. Support hours are Monday to Saturday, 9:00 AM to 6:00 PM IST.
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
            <h2 className="text-[15px] font-semibold tracking-tight text-brand-charcoal">Ask Us a Question</h2>
            <p className="mt-1 text-[13px] text-brand-charcoal/60">
              Submit your question and our team will get back to you.
            </p>

            {submitted ? (
              <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-status-success/25 bg-status-successBg/40 px-6 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-success text-white">
                  <Send size={17} />
                </span>
                <p className="text-[15px] font-semibold text-brand-charcoal">Thank you.</p>
                <p className="text-[13.5px] text-brand-charcoal/65">Your query has been submitted successfully.</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', orderId: '', subject: '', question: '' }); }}>
                  Ask another question
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
                  <label className="label" htmlFor="rh-name">Name</label>
                  <input
                    id="rh-name"
                    className="input"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="rh-email">Email</label>
                  <input
                    id="rh-email"
                    type="email"
                    className="input"
                    placeholder="you@store.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="rh-order">Order ID</label>
                  <input
                    id="rh-order"
                    className="input"
                    placeholder="e.g. ORD 20453"
                    value={form.orderId}
                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="rh-subject">Subject</label>
                  <input
                    id="rh-subject"
                    className="input"
                    placeholder="What is this about?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="rh-question">Question</label>
                  <textarea
                    id="rh-question"
                    className="input min-h-[100px] resize-none"
                    placeholder="Describe your question in detail…"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">
                    <Send size={15} /> Submit
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
