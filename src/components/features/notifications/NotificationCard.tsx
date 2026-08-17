import { ArrowRight, PackageSearch } from 'lucide-react';
import type { Notification } from '../../../data/mockData';
import { cn, relativeTime } from '../../../lib/utils';
import { folderIcon, folderIconClass, notificationFolder, NotificationFolderBadge } from './NotificationCategory';

interface NotificationCardProps {
  notification: Notification;
  onOpen: (n: Notification) => void;
}

export default function NotificationCard({ notification: n, onOpen }: NotificationCardProps) {
  const folder = notificationFolder(n.category);
  const Icon = folderIcon[folder];

  return (
    <div
      className={cn(
        'group flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-brand-navy/[0.03]',
        !n.read && 'bg-brand-navy/[0.02]',
      )}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', folderIconClass[folder])}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13.5px] font-semibold text-brand-charcoal">{n.title}</p>
          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-status-danger" />}
          <NotificationFolderBadge folder={folder} className="ml-auto" />
        </div>
        <p className="mt-0.5 text-[13px] text-brand-charcoal/60">{n.message}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-brand-charcoal/45">
          {n.ref && (
            <span className="inline-flex items-center gap-1 font-medium text-brand-charcoal/60">
              <PackageSearch size={11} className="text-brand-muted" />
              {n.ref}
            </span>
          )}
          <span>{relativeTime(n.time)}</span>
        </div>
      </div>
      <button
        onClick={() => onOpen(n)}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-brand-navy/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-brand-muted transition-colors hover:border-brand-muted hover:bg-brand-muted/5 hover:text-brand-navy"
      >
        Open <ArrowRight size={13} />
      </button>
    </div>
  );
}
