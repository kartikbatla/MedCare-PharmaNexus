import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Building2,
  Store,
} from 'lucide-react';
import BrandMark from '../components/brand/BrandMark';
import { useAuth, type Portal } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

const portals: Array<{
  id: Portal;
  title: string;
  icon: typeof Building2;
  tags: string[];
}> = [
  {
    id: 'admin',
    title: 'Admin / Distributor',
    icon: Building2,
    tags: ['Inventory', 'Procurement', 'Suppliers', 'P2P'],
  },
  {
    id: 'retailer',
    title: 'Retailer',
    icon: Store,
    tags: ['Medicine Ordering', 'Cart', 'Orders', 'Payments'],
  },
];

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoEmail = portal === 'retailer' ? 'rahul@carepluspharmacy.in' : 'anita.sharma@pharmanexus.in';

  const submit = (e: FormEvent, isDemo = false) => {
    e.preventDefault();
    if (!portal) return;
    if (!isDemo && (!email.trim() || !password.trim())) {
      toast('error', 'Missing credentials', 'Enter your login ID and password to continue.');
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      const user = login(isDemo ? demoEmail : email, password, remember, portal);
      toast('success', `Welcome back, ${user.name.split(' ')[0]}`, `Signed in to the ${portal === 'retailer' ? 'Retailer' : 'Admin / Distributor'} portal.`);
      navigate(portal === 'retailer' ? '/retailer' : '/', { replace: true });
    }, 700);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-warm px-5 py-10">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center">
          <BrandMark onDark={false} size="lg" />
          <p className="mt-3 text-center text-[13px] font-medium tracking-wide text-brand-muted">
            Unified procurement · retailer onboarding · intelligent supply chain
          </p>
          <h1 className="mt-10 text-center text-[34px] leading-tight font-semibold tracking-tight text-brand-charcoal">
            Choose Your Portal
          </h1>
          <p className="mt-2 text-center text-[14.5px] text-brand-charcoal/55">Select your workspace</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {portals.map((p) => {
            const Icon = p.icon;
            const isAdmin = p.id === 'admin';
            return (
              <button
                key={p.id}
                onClick={() => setPortal(p.id)}
                className="group flex flex-col rounded-2xl border border-brand-navy/12 bg-white p-8 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-muted/50 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy/[0.05] text-brand-muted transition-colors group-hover:bg-brand-navy group-hover:text-white">
                    <Icon size={24} />
                  </span>
                  {isAdmin && (
                    <span className="badge bg-brand-navy/[0.06] text-brand-navy">Enterprise</span>
                  )}
                </div>

                <h2 className="mt-8 text-[19px] font-semibold tracking-tight text-brand-charcoal">{p.title}</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-brand-navy/10 bg-brand-navy/[0.03] px-3 py-1 text-[12px] font-medium text-brand-charcoal/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <span className="mt-auto flex items-center justify-between border-t border-brand-navy/8 pt-6 mt-10">
                  <span className="text-[14px] font-semibold text-brand-charcoal/70 transition-colors group-hover:text-brand-navy">
                    Continue
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-white transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-[13px] text-brand-charcoal/50">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-status-success" /> Demo environment
          </span>
          <Link to="/signup" className="font-semibold text-brand-muted transition-colors hover:text-brand-navy">
            Sign Up
          </Link>
        </div>
      </div>

      {portal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-panel animate-fade-in-scale">
            <button
              onClick={() => setPortal(null)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-charcoal/55 transition-colors hover:text-brand-navy"
            >
              <ArrowLeft size={14} /> All portals
            </button>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-white">
                {portal === 'retailer' ? <Store size={18} /> : <Building2 size={18} />}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-brand-charcoal">
                  {portal === 'retailer' ? 'Retailer Portal' : 'Admin / Distributor Portal'}
                </p>
              </div>
            </div>

            <h2 className="mt-6 text-[24px] font-semibold tracking-tight text-brand-charcoal">Welcome back</h2>
            <p className="mt-1 text-sm text-brand-charcoal/55">
              Sign in to continue to your {portal === 'retailer' ? 'store' : 'workspace'}.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="login-id" className="label">
                  Email / Login ID
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-charcoal/35" />
                  <input
                    id="login-id"
                    type="email"
                    className="input h-[46px] pl-10"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-pw" className="label">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-charcoal/35" />
                  <input
                    id="login-pw"
                    type={showPw ? 'text' : 'password'}
                    className="input h-[46px] pr-11 pl-10"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-brand-charcoal/35 transition-colors hover:text-brand-charcoal"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-brand-charcoal/70">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-brand-navy/20 accent-brand-navy"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => toast('info', 'Password reset', 'A reset link has been sent to your registered email (demo).')}
                  className="text-[13px] font-medium text-brand-muted transition-colors hover:text-brand-navy"
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-primary h-[46px] w-full text-[14px]">
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                ) : (
                  <>
                    Sign In <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={(e) => submit(e as unknown as FormEvent, true)}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-lg border bg-white py-3 text-[13.5px] font-medium transition-colors',
                portal === 'retailer'
                  ? 'border-brand-muted/40 text-brand-muted hover:bg-brand-muted/5'
                  : 'border-brand-navy/12 text-brand-charcoal/70 hover:border-brand-muted hover:bg-brand-muted/5',
              )}
            >
              <KeyRound size={14} className="text-brand-muted" />
              Quick demo access — continue as {portal === 'retailer' ? 'Rahul Mehta (CarePlus Pharmacy)' : 'Procurement Manager'}
            </button>

            {portal === 'retailer' && (
              <p className="mt-3 text-center text-[12px] leading-relaxed text-brand-charcoal/45">
                Demo retailer accounts: rahul@carepluspharmacy.in (active) · abc@abchealthcare.com (application under
                verification)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
