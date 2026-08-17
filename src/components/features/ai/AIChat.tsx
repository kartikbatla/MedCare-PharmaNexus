import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  User,
  PackageSearch,
  ClipboardList,
  Truck,
  ScanLine,
  GitCompareArrows,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  Languages,
  X,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useControlTower } from '../../../context/ControlTowerContext';
import { LANGUAGES, craftReply, initialGreeting, CHAT_SUGGESTIONS, type Lang, type AiReply } from './aiEngine';
import { medicineNameById } from '../../../data/medicineCatalog';
import { cn } from '../../../lib/utils';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  buttons?: Array<{ label: string; action: string }>;
}

interface AIChatProps {
  variant?: 'page' | 'widget';
  onClose?: () => void;
}

const buttonIcon = (label: string) => {
  if (label === 'Create Request') return <ClipboardList size={12} />;
  if (label === 'View Inventory' || label === 'Open Inventory') return <PackageSearch size={12} />;
  if (label === 'View PO') return <Truck size={12} />;
  if (label === 'Review Invoice') return <ScanLine size={12} />;
  if (label === 'Open Matching') return <GitCompareArrows size={12} />;
  if (label === 'Demand Chart' || label === 'View Replenishment') return <TrendingUp size={12} />;
  return <CheckCircle2 size={12} />;
};

export interface AIChatHandle {
  ask: (text: string) => void;
}

const AIChat = forwardRef<AIChatHandle, AIChatProps>(function AIChat(
  { variant = 'page', onClose }: AIChatProps,
  ref,
) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('en');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ role: 'ai', text: initialGreeting('en') }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  useImperativeHandle(ref, () => ({ ask: send }));

  const changeLanguage = (next: Lang) => {
    if (next === lang) return;
    setLang(next);
    setMessages((prev) => [
      ...prev,
      { role: 'ai', text: `🌐 ${LANGUAGES.find((l) => l.code === next)?.native}` },
    ]);
  };

  const { sendChatQuery } = useControlTower();

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setTyping(true);

    try {
      const backendAns = await sendChatQuery(text);
      setMessages((prev) => [...prev, { role: 'ai', text: backendAns }]);
    } catch {
      const reply: AiReply = craftReply(text, lang);
      setMessages((prev) => [...prev, { role: 'ai', ...reply }]);
    } finally {
      setTyping(false);
    }
  };

  const handleButton = (action: string) => {
    switch (action) {
      case 'create-request':
        toast('success', 'Request created', `MR-1035 created for 360 ${medicineNameById('MED-0001')} units in Delhi.`);
        break;
      case 'view-inventory':
      case 'view-demand':
        navigate('/demand-inventory');
        break;
      case 'view-replenishment':
        navigate('/replenishment');
        break;
      case 'view-po':
        navigate('/purchase-orders');
        break;
      case 'send-po':
        toast('success', 'PO-10452 sent', 'Order dispatched to Aurobindo Pharma Limited.');
        break;
      case 'view-expiry':
        navigate('/expiry');
        break;
      case 'dispatch':
        toast('success', 'Dispatch prioritized', `${medicineNameById('MED-0002')} batch FX-2281 flagged under FEFO.`);
        break;
      case 'view-invoice':
        navigate('/payments');
        break;
      case 'review-invoice':
        toast('info', 'Escalated', 'INV-20448 forwarded to the finance controller.');
        break;
      case 'view-matching':
        navigate('/purchase-orders');
        break;
      case 'batch-match':
        toast('info', 'Batch matching', '3-way matching running on all open invoices.');
        break;
      case 'view-suppliers':
        navigate('/suppliers');
        break;
      case 'view-payments':
        navigate('/payments');
        break;
      case 'view-analytics':
        navigate('/analytics');
        break;
      case 'view-notifications':
        navigate('/notifications');
        break;
      case 'cancel':
        toast('info', 'Cancelled', 'No request created.');
        break;
      default:
        break;
    }
    if (variant === 'widget') onClose?.();
  };

  const suggestions = variant === 'widget' ? CHAT_SUGGESTIONS.slice(0, 3) : CHAT_SUGGESTIONS;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-brand-navy/8 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-white">
            <Sparkles size={14} />
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-status-success" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-charcoal">Assistant</p>
            <p className="text-xs text-status-success">Online · connected to platform data</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="relative">
            <Languages size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-brand-charcoal/40" />
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as Lang)}
              aria-label="Assistant language"
              className="h-8 cursor-pointer appearance-none rounded-lg border border-brand-navy/12 bg-white pr-7 pl-8 text-[12.5px] font-medium text-brand-charcoal outline-none transition-colors hover:border-brand-muted"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} — {l.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setMessages([{ role: 'ai', text: initialGreeting(lang) }]);
              toast('info', 'Conversation reset', 'Started a fresh session.');
            }}
            className="rounded-lg p-2 text-brand-charcoal/50 transition-colors hover:bg-brand-navy/5 hover:text-brand-charcoal"
            title="New session"
            aria-label="New session"
          >
            <RotateCcw size={14} />
          </button>
          {variant === 'widget' && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-brand-charcoal/50 transition-colors hover:bg-brand-navy/5 hover:text-brand-charcoal"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn('flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5', variant === 'page' ? 'h-[520px]' : 'h-[340px]')}
      >
        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'ai' && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-white">
                <Bot size={13} />
              </span>
            )}
            <div className={cn('max-w-[82%]', m.role === 'user' ? 'order-first' : '')}>
              <div
                className={cn(
                  'rounded-xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-line',
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-brand-navy text-white'
                    : 'rounded-tl-sm border border-brand-navy/8 bg-brand-navy/[0.03] text-brand-charcoal/85',
                )}
              >
                {m.text}
              </div>
              {m.buttons && m.buttons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.buttons.map((b) => (
                    <button
                      key={b.label}
                      onClick={() => handleButton(b.action)}
                      className="flex items-center gap-1.5 rounded-lg border border-brand-navy/15 bg-white px-3 py-1.5 text-[12.5px] font-medium text-brand-navy shadow-sm transition-colors hover:border-brand-muted hover:bg-brand-muted/5"
                    >
                      {buttonIcon(b.label)}
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-white">
                <User size={13} />
              </span>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-white">
              <Bot size={13} />
            </span>
            <div className="flex items-center gap-1.5 rounded-xl border border-brand-navy/8 bg-brand-navy/[0.03] px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-brand-navy/8 px-4 py-3 sm:px-5">
        {suggestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-brand-navy/12 bg-white px-3 py-1.5 text-[12px] font-medium text-brand-charcoal/70 transition-colors hover:border-brand-muted hover:bg-brand-muted/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2.5">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask me about inventory, POs, suppliers, invoices…"
            className="input min-h-[46px] flex-1 resize-none py-3"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || typing}
            className="btn-primary h-[46px] px-4"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default AIChat;
