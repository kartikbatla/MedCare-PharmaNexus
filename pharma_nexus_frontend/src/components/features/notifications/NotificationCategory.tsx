import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, AlertTriangle, ClipboardList, Info } from 'lucide-react';
import type { Notification } from '../../../data/mockData';
import { cn } from '../../../lib/utils';

export type NotificationFolder = 'Critical' | 'Warning' | 'Action Required' | 'Informational';

export const NOTIFICATION_FOLDERS: NotificationFolder[] = [
  'Critical',
  'Warning',
  'Action Required',
  'Informational',
];

export function notificationFolder(category: Notification['category']): NotificationFolder {
  switch (category) {
    case 'Critical':
      return 'Critical';
    case 'Warning':
      return 'Warning';
    case 'Invoice':
      return 'Action Required';
    case 'Procurement':
      return 'Informational';
    case 'System':
      return 'Informational';
  }
}

export const folderIcon: Record<NotificationFolder, LucideIcon> = {
  Critical: AlertOctagon,
  Warning: AlertTriangle,
  'Action Required': ClipboardList,
  Informational: Info,
};

export const folderIconClass: Record<NotificationFolder, string> = {
  Critical: 'bg-status-dangerBg text-status-danger',
  Warning: 'bg-status-warningBg text-status-warning',
  'Action Required': 'bg-brand-muted/10 text-brand-muted',
  Informational: 'bg-brand-navy/5 text-brand-charcoal/60',
};

export function NotificationFolderBadge({ folder, className }: { folder: NotificationFolder; className?: string }) {
  const Icon = folderIcon[folder];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold', folderIconClass[folder], className)}
    >
      <Icon size={11} /> {folder}
    </span>
  );
}
