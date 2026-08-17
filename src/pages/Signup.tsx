import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, User, Building2, Lock } from 'lucide-react';
import BrandMark from '../components/brand/BrandMark';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

interface FormState {
  fullName: string;
  email: string;
  mobile: string;
  company: string;
  designation: string;
  department: string;
  loginId: string;
  password: string;
  confirm: string;
  agree: boolean;
}

const initial: FormState = {
  fullName: '',
  email: '',
  mobile: '',
  company: '',
  designation: '',
  department: '',
  loginId: '',
  password: '',
  confirm: '',
  agree: false,
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="input h-[42px]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function Signup() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof FormState) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.company || !form.loginId || !form.password) {
      toast('error', 'Missing information', 'Please complete the required fields marked with *.');
      return;
    }
    if (form.password.length < 8) {
      toast('error', 'Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      toast('error', 'Passwords do not match', 'Please re-enter your password and confirmation.');
      return;
    }
    if (!form.agree) {
      toast('error', 'Terms required', 'Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      signup(form.fullName, form.email, form.loginId);
      setLoading(false);
      setDone(true);
    }, 900);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-warm px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-panel animate-fade-in-scale">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-successBg">
            <CheckCircle2 size={30} className="text-status-success" />
          </span>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-brand-charcoal">
            Account created successfully
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-brand-charcoal/60">
            Welcome to the platform, {form.fullName.split(' ')[0]}. Your organization{' '}
            <span className="font-semibold text-brand-charcoal">{form.company}</span> is ready for
            procurement on the PharmaNexus platform.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="btn-primary mt-8 w-full h-[46px] text-[14px]"
          >
            Continue to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-warm">
      <div className="mx-auto max-w-[720px] px-5 py-10 sm:py-14">
        <div className="flex items-center justify-between">
          <BrandMark onDark={false} />
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-[13px] font-medium text-brand-charcoal/55 transition-colors hover:text-brand-navy"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-panel sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-muted/10 px-3 py-1 text-xs font-medium text-brand-muted">
            <Sparkles size={13} /> Enterprise registration
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-brand-charcoal">
            Create your organization account
          </h1>
          <p className="mt-1.5 text-sm text-brand-charcoal/55">
            Set up access to the PharmaNexus procurement intelligence platform for your company.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-8">
            <section>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-charcoal">
                <User size={15} className="text-brand-muted" /> Personal Information
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="su-name" label="Full Name *" placeholder="e.g. Priya Nair" value={form.fullName} onChange={set('fullName')} />
                <Field id="su-email" label="Work Email *" type="email" placeholder="name@company.com" value={form.email} onChange={set('email')} />
                <div className="sm:col-span-2">
                  <Field id="su-mobile" label="Mobile Number" type="tel" placeholder="+91 98XXX XXXXX" value={form.mobile} onChange={set('mobile')} />
                </div>
              </div>
            </section>

            <section>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-charcoal">
                <Building2 size={15} className="text-brand-muted" /> Organization Information
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="su-company" label="Company Name *" placeholder="e.g. PharmaNexus Pharma Ltd." value={form.company} onChange={set('company')} />
                <Field id="su-designation" label="Designation" placeholder="e.g. Procurement Manager" value={form.designation} onChange={set('designation')} />
                <div className="sm:col-span-2">
                  <label htmlFor="su-dept" className="label">Department</label>
                  <select
                    id="su-dept"
                    className="input h-[42px]"
                    value={form.department}
                    onChange={(e) => set('department')(e.target.value)}
                  >
                    <option value="">Select department…</option>
                    {['Procurement', 'Supply Chain', 'Finance', 'Operations', 'Quality & Compliance', 'IT / Digital'].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-charcoal">
                <Lock size={15} className="text-brand-muted" /> Account Information
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="su-login" label="Create Login ID *" placeholder="e.g. priya.nair" value={form.loginId} onChange={set('loginId')} />
                <Field id="su-pass" label="Password *" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                <div className="sm:col-span-2">
                  <Field id="su-pass2" label="Confirm Password *" type="password" placeholder="Re-enter your password" value={form.confirm} onChange={set('confirm')} />
                </div>
              </div>
            </section>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => set('agree')(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-navy/20 accent-brand-navy"
              />
              <span className="text-[13px] leading-relaxed text-brand-charcoal/70">
                I agree to the <span className="font-medium text-brand-muted">Terms & Conditions</span> and{' '}
                <span className="font-medium text-brand-muted">Privacy Policy</span> of PharmaNexus.
              </span>
            </label>

            <button type="submit" disabled={loading} className={cn('btn-primary h-[46px] w-full text-[14px]')}>
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11.5px] text-brand-charcoal/40">
            <ShieldCheck size={12} /> Enterprise-grade security · your data is encrypted and access-controlled
          </p>
        </div>
      </div>
    </div>
  );
}
