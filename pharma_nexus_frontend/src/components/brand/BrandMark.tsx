import { cn } from '../../lib/utils';
import PharmaNexusLogo from './PharmaNexusLogo';

interface BrandMarkProps {
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function BrandMark({ onDark = true, size = 'sm', className }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <PharmaNexusLogo
        variant="lockup"
        className={cn(
          'h-auto w-auto text-center',
          size === 'sm' ? 'w-52' : size === 'md' ? 'w-72' : 'w-[360px]',
          onDark ? 'text-white' : 'text-brand-charcoal',
        )}
      />
    </div>
  );
}
