import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, { icon: typeof Info; iconClass: string; bar: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-status-success',
    bar: 'bg-status-success',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-status-danger',
    bar: 'bg-status-danger',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-status-warning',
    bar: 'bg-status-warning',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-muted',
    bar: 'bg-brand-muted',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, description }]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const style = toastStyles[t.type];
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto animate-toast-in overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-panel"
            >
              <div className="flex items-start gap-3 p-3.5">
                <span className={cn('relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full', style.bar, 'bg-opacity-10')}>
                  <Icon size={16} className={cn('relative', style.iconClass)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-charcoal">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[13px] leading-snug text-brand-charcoal/60">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded p-0.5 text-brand-charcoal/40 transition-colors hover:bg-brand-navy/5 hover:text-brand-charcoal"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
