import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import AIChat from './AIChat';
import { onOpenAIPanel } from '../../../lib/aiPanel';

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  useEffect(() => onOpenAIPanel(() => setOpen(true)), []);

  return (
    <>
      {open && (
        <div
          className="fixed right-4 bottom-24 z-40 flex w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-brand-navy/12 bg-white shadow-2xl animate-fade-in-up sm:right-6 sm:bottom-28"
          style={{ height: 'min(620px, calc(100vh - 9rem))' }}
          role="dialog"
          aria-label="Assistant"
        >
          <AIChat variant="widget" onClose={() => setOpen(false)} />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 bottom-5 z-40 flex items-center justify-center rounded-full bg-brand-navy text-white shadow-xl shadow-brand-navy/30 transition-all hover:-translate-y-0.5 hover:bg-brand-muted sm:right-6"
        style={{ width: 52, height: 52 }}
        aria-label="Open assistant"
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
        {!open && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-status-success" />}
      </button>
    </>
  );
}
