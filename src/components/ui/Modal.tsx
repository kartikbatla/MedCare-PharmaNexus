import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-brand-navy/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full animate-fade-in-scale rounded-xl bg-white shadow-panel',
          sizeMap[size],
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-navy/8 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-brand-charcoal">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-brand-charcoal/55">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-charcoal/40 transition-colors hover:bg-brand-navy/5 hover:text-brand-charcoal"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-brand-navy/8 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
