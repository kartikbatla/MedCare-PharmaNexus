import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg';
}

const widthMap = {
  md: 'w-full max-w-[560px]',
  lg: 'w-full max-w-[620px]',
};

export default function Drawer({ open, onClose, title, subtitle, children, footer, width = 'md' }: DrawerProps) {
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
    <div className="fixed inset-0 z-[90]">
      <div className="fixed inset-0 bg-brand-navy/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-[100] flex h-full flex-col bg-white shadow-2xl overflow-hidden animate-slide-in-left',
          widthMap[width],
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
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-5 custom-scrollbar">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-brand-navy/8 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
