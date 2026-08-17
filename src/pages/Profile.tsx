import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Bell, LogOut, Save } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: 'Anita Sharma',
    role: 'Procurement Manager',
    email: 'anita.sharma@pharmanexus.in',
    department: 'Procurement & Supply Chain',
    location: 'Delhi NCR',
    phone: '+91 98765 43210',
  });

  const [prefs, setPrefs] = useState({
    criticalAlerts: true,
    expiryWarnings: true,
    invoiceAnomalies: true,
    dailyDigest: false,
    poUpdates: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Profile"
        subtitle="Account settings and notification preferences"
        action={
          <>
            <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={15} /> Sign out
            </Button>
            <Button onClick={() => toast('success', 'Profile saved', 'Your changes have been updated.')}>
              <Save size={15} /> Save Changes
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Account Details" subtitle="Information shown to your team" />
          <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-4 rounded-xl bg-brand-navy/[0.03] p-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-lg font-semibold text-white">
                  AS
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-brand-charcoal">{profile.name}</p>
                  <p className="text-[13px] text-brand-charcoal/55">{profile.role}</p>
                </div>
              </div>
            </div>
            {[
              ['name', 'Full name', 'text'],
              ['role', 'Role', 'text'],
              ['email', 'Email', 'text'],
              ['department', 'Department', 'text'],
              ['location', 'Location', 'text'],
              ['phone', 'Phone', 'text'],
            ].map(([key, label, _type]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  value={profile[key as keyof typeof profile]}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Notification Preferences" subtitle="Choose what you receive" icon={<Bell size={15} />} />
            <div className="space-y-3 px-5 pb-5">
              {(
                [
                  ['criticalAlerts', 'Critical alerts', 'Stock-outs and urgent risks'],
                  ['expiryWarnings', 'Expiry warnings', 'Near-expiry FEFO notices'],
                  ['invoiceAnomalies', 'Invoice anomalies', 'Fraud and price mismatches'],
                  ['poUpdates', 'PO updates', 'Creation, approval and receipt'],
                  ['dailyDigest', 'Daily digest', 'Morning supply chain summary'],
                ] as Array<[keyof typeof prefs, string, string]>
              ).map(([key, label, desc]) => (
                <button key={key} onClick={() => toggle(key)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-brand-navy/[0.03]">
                  <span>
                    <span className="block text-[13.5px] font-medium text-brand-charcoal">{label}</span>
                    <span className="block text-xs text-brand-charcoal/50">{desc}</span>
                  </span>
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${prefs[key] ? 'bg-brand-navy' : 'bg-brand-navy/15'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${prefs[key] ? 'left-[18px]' : 'left-0.5'}`}
                    />
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-brand-navy/10 bg-brand-navy">
            <div className="flex items-center gap-3 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
                <ShieldCheck size={16} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Verified Enterprise User</p>
                <p className="text-[13px] text-white/60">2FA enabled · access: Finance + Procurement</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
