import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, Send, Sparkles, UserRound } from 'lucide-react';
import { medicineById, popularMedicines } from '../../data/medicines';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';

interface Msg {
  role: 'user' | 'ai';
  text: string;
  to?: string;
  toLabel?: string;
}

const canned = (q: string): Msg => {
  const s = q.toLowerCase();
  if (s.includes('reorder') || s.includes('restock')) {
    return {
      role: 'ai',
      text: 'Based on your order history, your most-reordered medicine is the top item below. I can add the full set to your cart for a quick reorder.',
      to: '/retailer/quick-reorder',
      toLabel: 'Open Quick Reorder',
    };
  }
  if (s.includes('order') || s.includes('track')) {
    return {
      role: 'ai',
      text: 'Your latest orders are under My Orders with live status — Submitted → Under Review → Approved → Shipped → Delivered.',
      to: '/retailer/orders',
      toLabel: 'My Orders',
    };
  }
  if (s.includes('price') || s.includes('cost')) {
    return {
      role: 'ai',
      text: 'Prices shown in the catalogue are indicative demo values. For a live quotation, request pricing from PharmaNexus sales.',
      to: '/retailer/medicines',
      toLabel: 'Browse Medicines',
    };
  }
  return {
    role: 'ai',
    text: 'I can help you find medicines, reorder fast-movers, track orders, and check indicative prices. Try asking: "what should I reorder?"',
  };
};

export default function RetailerAiAssistant() {
  const navigate = useNavigate();
  const { orders } = useCart();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: 'Hi! I’m the PharmaNexus retail assistant. How can I help you today?' },
  ]);

  const suggestions = useMemo(() => {
    const freq = new Map<string, number>();
    orders
      .filter((o) => o.status !== 'Cancelled')
      .forEach((o) => o.items.forEach((i) => freq.set(i.medicineId, (freq.get(i.medicineId) ?? 0) + i.qty)));
    const items = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => medicineById(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    const filled = [...items];
    popularMedicines.forEach((m) => {
      if (!filled.some((f) => f.id === m.id)) filled.push(m);
    });
    return filled.slice(0, 4);
  }, [orders]);

  const submit = () => {
    const q = input.trim();
    if (!q) return;
    setMessages((msgs) => [...msgs, { role: 'user', text: q }, canned(q)]);
    setInput('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <Sparkles size={20} /> Assistant
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">
          Demo assistant over your order history — not a clinical or medical advisor.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Chat" subtitle="Ask about reordering, orders, or prices" icon={<Sparkles size={15} />} />
          <div className="space-y-3 px-5 pb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'ai' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-white">
                    <Sparkles size={14} />
                  </span>
                )}
                <div
                  className={
                    m.role === 'ai'
                      ? 'max-w-[80%] rounded-2xl rounded-tl-sm bg-brand-navy/[0.04] px-4 py-3 text-[13px] leading-relaxed text-brand-charcoal/80'
                      : 'max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-navy px-4 py-3 text-[13px] leading-relaxed text-white'
                  }
                >
                  {m.text}
                  {m.to && (
                    <button
                      onClick={() => navigate(m.to!)}
                      className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-brand-navy hover:text-brand-muted"
                    >
                      {m.toLabel} <ArrowRight size={13} />
                    </button>
                  )}
                </div>
                {m.role === 'user' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                    <UserRound size={14} />
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-brand-navy/5 px-5 py-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="e.g. What should I reorder?"
                className="w-full rounded-xl border border-brand-navy/10 bg-white px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-navy/10"
              />
              <Button onClick={submit}>
                <Send size={15} />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-brand-charcoal/40">Demo responses — generated from local rules.</p>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Suggested Reorder" subtitle="Based on order frequency" icon={<RotateCcw size={15} />} />
          <div className="space-y-1 px-3 pb-4">
            {suggestions.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/retailer/medicines/${m.id}`)}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-brand-navy/5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-brand-charcoal">{m.name}</span>
                  <span className="block text-[11.5px] text-brand-charcoal/50">{m.strength} · {m.packSize}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-brand-charcoal/25 transition-colors group-hover:text-brand-muted" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
