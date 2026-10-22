import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '@client/src/api';
import { useAuth } from '@client/src/hooks/use-hiking';

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  link: string;
  read_at?: string | null;
  created_at: string;
}

const NotificationBell = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async (): Promise<void> => {
    if (!isLoggedIn) {
      setItems([]);
      setUnread(0);
      return;
    }
    try {
      const data = await api.listNotifications();
      setItems((data.notifications || []) as unknown as NotificationItem[]);
      setUnread(Number(data.unread || 0));
    } catch {
      // Notifications are non-critical; keep the rest of the header usable.
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(timer);
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const openItem = async (item: NotificationItem): Promise<void> => {
    if (!item.read_at) {
      await api.markNotificationRead(item.id).catch(() => {});
      setUnread((value) => Math.max(0, value - 1));
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
    }
    setOpen(false);
    navigate(item.link || '/');
  };

  const readAll = async (): Promise<void> => {
    await api.markAllNotificationsRead().catch(() => {});
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="通知"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-white/70 text-muted-foreground transition-colors hover:border-pine-300 hover:text-ink md:h-10 md:w-10"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-ember-500 px-1 font-data text-[9px] text-paper">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[90] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-ink">通知</span>
            <button type="button" onClick={readAll} className="inline-flex items-center gap-1 text-xs text-pine-700 hover:text-pine-800">
              <CheckCheck size={13} />
              全部已读
            </button>
          </div>
          <div className="max-h-[min(420px,70vh)] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">暂无通知</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={`block w-full border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-pine-50/70 ${
                    item.read_at ? 'opacity-70' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.body && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>}
                  <p className="mt-1.5 font-data text-[10px] text-muted-foreground">{item.created_at?.slice(0, 16)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
