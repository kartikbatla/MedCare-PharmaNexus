import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import Pagination, { pageCount, visibleRange } from '../components/ui/Pagination';
import { useToast } from '../context/ToastContext';
import { notifications as seed } from '../data/mockData';
import NotificationCard from '../components/features/notifications/NotificationCard';
import {
  NOTIFICATION_FOLDERS,
  folderIcon,
  notificationFolder,
  type NotificationFolder,
} from '../components/features/notifications/NotificationCategory';
import { cn } from '../lib/utils';

type FolderFilter = 'All' | NotificationFolder;

export default function Notifications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState(seed);
  const [folder, setFolder] = useState<FolderFilter>('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [folder, unreadOnly]);

  const unread = items.filter((n) => !n.read).length;

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; unread: number }>();
    for (const f of NOTIFICATION_FOLDERS) map.set(f, { total: 0, unread: 0 });
    for (const n of items) {
      const f = notificationFolder(n.category);
      const entry = map.get(f)!;
      entry.total += 1;
      if (!n.read) entry.unread += 1;
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (folder !== 'All') list = list.filter((n) => notificationFolder(n.category) === folder);
    if (unreadOnly) list = list.filter((n) => !n.read);
    return list;
  }, [items, folder, unreadOnly]);

  const pages = pageCount(filtered.length, 10);
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * 10, safePage * 10);
  const range = visibleRange(safePage, 10, filtered.length);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast('success', 'All notifications marked as read');
  };

  const openNotification = (id: string, link: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    navigate(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        subtitle="Actionable alerts across your supply chain — click to open the relevant page"
        action={
          <Button variant="secondary" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck size={15} /> Mark all read
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-white">
              <Bell size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-charcoal">Inbox</p>
              <p className="text-xs text-brand-charcoal/50">
                {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : "You're all caught up"}
              </p>
            </div>
          </div>
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: filtered.length },
              { id: 'unread', label: 'Unread', count: unread },
            ]}
            active={unreadOnly ? 'unread' : 'all'}
            onChange={(id) => setUnreadOnly(id === 'unread')}
          />
        </div>

        <div className="flex flex-col lg:flex-row">
          <aside className="flex gap-1.5 overflow-x-auto border-b border-brand-navy/5 p-3 lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:p-4">
            <button
              onClick={() => setFolder('All')}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                folder === 'All'
                  ? 'bg-brand-navy text-white'
                  : 'text-brand-charcoal/65 hover:bg-brand-navy/5 hover:text-brand-charcoal',
              )}
            >
              <Inbox size={15} />
              <span className="flex-1 text-left">All</span>
              <span className={cn('tabular-nums', folder === 'All' ? 'text-white/70' : 'text-brand-charcoal/40')}>
                {items.length}
              </span>
            </button>

            {NOTIFICATION_FOLDERS.map((f) => {
              const Icon = folderIcon[f];
              const active = folder === f;
              const entry = counts.get(f)!;
              return (
                <button
                  key={f}
                  onClick={() => setFolder(f)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-brand-navy text-white'
                      : 'text-brand-charcoal/65 hover:bg-brand-navy/5 hover:text-brand-charcoal',
                  )}
                >
                  <Icon size={15} />
                  <span className="flex-1 text-left">{f}</span>
                  <span className={cn('tabular-nums', active ? 'text-white/70' : 'text-brand-charcoal/40')}>
                    {entry.total}
                  </span>
                  {entry.unread > 0 && (
                    <span
                      className={cn(
                        'flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                        active ? 'bg-white text-brand-navy' : 'bg-status-danger text-white',
                      )}
                    >
                      {entry.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          <div className="min-w-0 flex-1">
            {paged.length === 0 ? (
              <EmptyState
                title="No notifications"
                message="New alerts about stock-outs, expiry, invoices and approvals will appear here."
                className="py-14"
              />
            ) : (
              <div className="divide-y divide-brand-navy/5">
                {paged.map((n) => (
                  <NotificationCard key={n.id} notification={n} onOpen={(item) => openNotification(item.id, item.link)} />
                ))}
              </div>
            )}

            {filtered.length > 10 && (
              <div className="border-t border-brand-navy/5 px-5 py-3">
                <Pagination page={safePage} pageSize={10} total={filtered.length} onPageChange={setPage} />
              </div>
            )}

            {filtered.length > 0 && (
              <p className="border-t border-brand-navy/5 px-5 py-3 text-[12px] text-brand-charcoal/45">
                Showing {range.from}–{range.to} of {filtered.length} notification{filtered.length === 1 ? '' : 's'}
                {folder !== 'All' ? ` in ${folder}` : ''}
                {unreadOnly ? ' (unread only)' : ''}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
