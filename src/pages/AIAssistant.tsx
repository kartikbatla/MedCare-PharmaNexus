import { useRef } from 'react';
import {
  Bot,
  PackageSearch,
  TrendingUp,
  ClipboardList,
  Truck,
  CalendarClock,
  ScanLine,
  GitCompareArrows,
  BarChart3,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import AIChat, { type AIChatHandle } from '../components/features/ai/AIChat';
import { medicineNameById } from '../data/medicineCatalog';

interface Capability {
  icon: typeof Bot;
  title: string;
  desc: string;
  prompt: string;
}

const capabilities: Capability[] = [
  { icon: PackageSearch, title: 'Check inventory', desc: 'Live stock across locations', prompt: 'Show current inventory levels' },
  { icon: TrendingUp, title: 'Demand forecast', desc: 'Forecast demand signals', prompt: `Show the demand forecast for ${medicineNameById('MED-0001')}` },
  { icon: ClipboardList, title: 'Create request', desc: 'Raise material requests', prompt: `Create a request for 360 ${medicineNameById('MED-0001')} units in Delhi` },
  { icon: Truck, title: 'PO & supplier status', desc: 'Order and delivery tracking', prompt: 'What is the status of PO-10452?' },
  { icon: CalendarClock, title: 'Expiry alerts', desc: 'FEFO and near-expiry items', prompt: 'Show near-expiry items' },
  { icon: ScanLine, title: 'Invoice anomalies', desc: 'OCR + anomaly detection', prompt: 'Why was invoice INV-20452 flagged?' },
  { icon: GitCompareArrows, title: '3-Way matching', desc: 'PO · receipt · invoice', prompt: 'Explain how 3-way matching works' },
  { icon: BarChart3, title: 'P2P analytics', desc: 'Automation and spend insights', prompt: 'Show procure-to-pay analytics' },
];

export default function AIAssistant() {
  const chatRef = useRef<AIChatHandle>(null);

  const ask = (prompt: string) => {
    chatRef.current?.ask(prompt);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistant"
        subtitle="Ask anything about inventory, procurement, invoices or payments — in 8 Indian languages"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="space-y-6 xl:col-span-1">
          <Card>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-white">
                  <Bot size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-charcoal">Capabilities</p>
                  <p className="text-xs text-brand-charcoal/50">Tap to ask</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {capabilities.map((c) => (
                  <button
                    key={c.title}
                    onClick={() => ask(c.prompt)}
                    className="group flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-brand-navy/5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-navy/5 text-brand-muted transition-colors group-hover:bg-brand-navy group-hover:text-white">
                      <c.icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-brand-charcoal">{c.title}</span>
                      <span className="block text-xs text-brand-charcoal/50">{c.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-brand-navy/8 bg-brand-navy/[0.03] p-3 text-xs leading-relaxed text-brand-charcoal/60">
                Ask in <span className="font-semibold text-brand-charcoal">हिन्दी · తెలుగు · தமிழ் · ಕನ್ನಡ · മലയാളം · বাংলা · मराठी</span> — the
                the assistant detects your language automatically.
              </div>
            </div>
          </Card>
        </div>

        <Card className="flex flex-col overflow-hidden xl:col-span-3">
          <AIChat ref={chatRef} variant="page" />
        </Card>
      </div>
    </div>
  );
}
