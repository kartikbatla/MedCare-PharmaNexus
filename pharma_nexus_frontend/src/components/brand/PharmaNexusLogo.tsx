import { cn } from '../../lib/utils';

interface PharmaNexusLogoProps {
  variant?: 'badge' | 'lockup';
  className?: string;
  showText?: boolean;
}

export default function PharmaNexusLogo({ variant: _variant = 'badge', className, showText = false }: PharmaNexusLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt="PharmaNexus Logo"
        className="h-9 w-auto max-w-[150px] object-contain rounded-lg shadow-xs bg-white p-0.5 border border-brand-navy/10"
        onError={(e) => {
          // Fallback if image path varies
          (e.target as HTMLImageElement).src = '/logo.jpeg';
        }}
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight text-brand-navy flex items-center gap-0.5">
          Pharma<span className="text-brand-muted">Nexus</span>
        </span>
      )}
    </div>
  );
}
