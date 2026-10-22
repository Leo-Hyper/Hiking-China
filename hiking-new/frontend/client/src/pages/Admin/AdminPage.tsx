import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Flag,
  MessageSquare,
  ScrollText,
  Shield,
  ToggleLeft,
  Users,
  FileText,
} from 'lucide-react';
import * as api from '@client/src/api';
import { useAuth } from '@client/src/hooks/use-hiking';
import { toast } from 'sonner';
import AdminUsersPanel from './AdminUsersPanel';

type AdminTab = 'summary' | 'reports' | 'posts' | 'comments' | 'users' | 'events' | 'audit' | 'flags';
type Row = Record<string, unknown>;

const TABS: { key: AdminTab; label: string; icon: typeof Shield }[] = [
  { key: 'summary', label: '概览', icon: Shield },
  { key: 'reports', label: '举报', icon: Flag },
  { key: 'posts', label: '帖子', icon: FileText },
  { key: 'comments', label: '评论', icon: MessageSquare },
  { key: 'users', label: '用户', icon: Users },
  { key: 'events', label: '活动', icon: CalendarDays },
  { key: 'audit', label: '审计', icon: ScrollText },
  { key: 'flags', label: '开关', icon: ToggleLeft },
];

const TAB_PATHS: Record<AdminTab, string> = {
  summary: '/admin',
  reports: '/admin/reports',
  posts: '/admin/posts',
  comments: '/admin/comments',
  users: '/admin/users',
  events: '/admin/events',
  audit: '/admin/audit',
  flags: '/admin/flags',
};

const text = (value: unknown, fallback = '') => String(value ?? fallback);
const number = (value: unknown) => Number(value ?? 0);

const tabFromPath = (pathname: string): AdminTab => {
  const match = TABS.find((tab) => TAB_PATHS[tab.key] === pathname);
  return match?.key || 'summary';
};

const AdminPage = () => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const tab: AdminTab = tabFromPath(location.pathname);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async (): Promise<void> => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError('');
    try {
      if (tab === 'summary') {
        const data = await api.getAdminSummary();
        setSummary(data.summary || {});
        setRows([]);
      } else if (tab === 'reports') {
        const data = await api.listAdminReports();
        setRows(data.reports || []);
      } else if (tab === 'posts') {
        const data = await api.listAdminPosts();
        setRows(data.posts || []);
      } else if (tab === 'comments') {
        const data = await api.listAdminComments();
        setRows(data.comments || []);
      } else if (tab === 'users') {
        setRows([]);
      } else if (tab === 'events') {
        const data = await api.listAdminEvents();
        setRows(data.events || []);
      } else if (tab === 'audit') {
        const data = await api.listAdminAuditLogs();
        setRows(data.logs || []);
      } else {
        const data = await api.listAdminFeatureFlags();
        setRows(data.flags || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '管理数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, tab]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Shield className="mx-auto text-ember-500" size={36} />
        <h1 className="mt-4 font-display text-xl text-ink">无权访问管理后台</h1>
        <p className="mt-2 text-sm text-muted-foreground">当前账号没有审核或管理员权限。</p>
        <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-pine-700">
          返回首页
        </Link>
      </div>
    );
  }

  const runAction = async (action: () => Promise<unknown>, success: string): Promise<void> => {
    try {
      await action();
      toast.success(success);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-kicker uppercase text-ember-600">Operations Console</p>
          <h1 className="mt-2 font-display text-xl text-ink md:text-h1">管理后台</h1>
          <p className="mt-2 text-sm text-muted-foreground">内容审核、举报处理、用户权限和功能开关。</p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          {user.username} · {user.role}
        </span>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = item.key === tab;
          const visible = ['audit', 'flags', 'users'].includes(item.key) ? user.role === 'admin' : true;
          if (!visible) return null;
          return (
            <Link
              key={item.key}
              to={TAB_PATHS[item.key]}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                active ? 'bg-pine-700 text-paper' : 'text-muted-foreground hover:bg-pine-50 hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {loading && <p className="py-10 text-center text-sm text-muted-foreground">加载中...</p>}
      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {!loading && !error && tab === 'summary' && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['用户', summary.users || 0],
            ['帖子', summary.posts || 0],
            ['评论', summary.comments || 0],
            ['活动', summary.events || 0],
            ['待处理举报', summary.open_reports || 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-border bg-card p-5 shadow-2xs">
              <div className="font-data text-2xl text-ink">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && tab === 'reports' && (
        <AdminTable
          rows={rows}
          columns={['ID', '对象', '原因', '举报人', '状态', '时间', '操作']}
          render={(row) => (
            <>
              <span className="font-data">#{text(row.id)}</span>
              <span>{text(row.target_type)} #{text(row.target_id)}</span>
              <span>{text(row.reason)}</span>
              <span>{text(row.reporter_name, '匿名')}</span>
              <StatusBadge value={text(row.status)} />
              <span className="text-xs text-muted-foreground">{text(row.created_at).slice(0, 16)}</span>
              <span className="flex gap-2">
                <button className="action-link" onClick={() => runAction(() => api.resolveAdminReport(number(row.id), { status: 'resolved' }), '举报已处理')}>处理</button>
                <button className="action-link" onClick={() => runAction(() => api.resolveAdminReport(number(row.id), { status: 'dismissed' }), '举报已忽略')}>忽略</button>
              </span>
            </>
          )}
        />
      )}

      {!loading && !error && tab === 'posts' && (
        <AdminTable
          rows={rows}
          columns={['ID', '标题', '作者', '状态', '时间', '操作']}
          render={(row) => (
            <>
              <span className="font-data">#{text(row.id)}</span>
              <span className="max-w-xs truncate">{text(row.title)}</span>
              <span>{text(row.author_name)}</span>
              <StatusBadge value={text(row.status)} />
              <span className="text-xs text-muted-foreground">{text(row.created_at).slice(0, 16)}</span>
              <span className="flex gap-2">
                <button className="action-link" onClick={() => runAction(() => api.setAdminPostStatus(number(row.id), 0), '帖子已隐藏')}>隐藏</button>
                <button className="action-link" onClick={() => runAction(() => api.setAdminPostStatus(number(row.id), 1), '帖子已恢复')}>恢复</button>
              </span>
            </>
          )}
        />
      )}

      {!loading && !error && tab === 'comments' && (
        <AdminTable
          rows={rows}
          columns={['ID', '内容', '作者', '状态', '时间', '操作']}
          render={(row) => (
            <>
              <span className="font-data">#{text(row.id)}</span>
              <span className="max-w-xs truncate">{text(row.content)}</span>
              <span>{text(row.author_name)}</span>
              <StatusBadge value={text(row.status)} />
              <span className="text-xs text-muted-foreground">{text(row.created_at).slice(0, 16)}</span>
              <span className="flex gap-2">
                <button className="action-link" onClick={() => runAction(() => api.setAdminCommentStatus(number(row.id), 0), '评论已隐藏')}>隐藏</button>
                <button className="action-link" onClick={() => runAction(() => api.setAdminCommentStatus(number(row.id), 1), '评论已恢复')}>恢复</button>
              </span>
            </>
          )}
        />
      )}

      {!loading && !error && tab === 'users' && (
        <AdminUsersPanel currentUserId={Number(user.id)} />
      )}

      {!loading && !error && tab === 'events' && (
        <AdminTable
          rows={rows}
          columns={['ID', '标题', '作者', '状态', '日期', '操作']}
          render={(row) => (
            <>
              <span className="font-data">#{text(row.id)}</span>
              <span className="max-w-xs truncate">{text(row.title)}</span>
              <span>{text(row.author_name)}</span>
              <StatusBadge value={text(row.status)} />
              <span>{text(row.event_date)}</span>
              <span className="flex gap-2">
                <button className="action-link" onClick={() => runAction(() => api.setAdminEventStatus(number(row.id), 'hidden'), '活动已隐藏')}>隐藏</button>
                <button className="action-link" onClick={() => runAction(() => api.setAdminEventStatus(number(row.id), 'active'), '活动已恢复')}>恢复</button>
              </span>
            </>
          )}
        />
      )}

      {!loading && !error && tab === 'audit' && (
        <AdminTable
          rows={rows}
          columns={['ID', '操作', '对象', '操作人', '时间']}
          render={(row) => (
            <>
              <span className="font-data">#{text(row.id)}</span>
              <span>{text(row.action)}</span>
              <span>{text(row.target_type)} #{text(row.target_id)}</span>
              <span>{text(row.actor_name, '系统')}</span>
              <span className="text-xs text-muted-foreground">{text(row.created_at).slice(0, 16)}</span>
            </>
          )}
        />
      )}

      {!loading && !error && tab === 'flags' && (
        <AdminTable
          rows={rows}
          columns={['开关', '状态', '说明', '操作']}
          render={(row) => (
            <>
              <span className="font-data">{text(row.key)}</span>
              <StatusBadge value={number(row.enabled) === 1 ? 'on' : 'off'} />
              <span>{text(row.description)}</span>
              <button className="action-link" onClick={() => runAction(() => api.setAdminFeatureFlag(text(row.key), number(row.enabled) !== 1), '功能开关已更新')}>
                {number(row.enabled) === 1 ? '关闭' : '开启'}
              </button>
            </>
          )}
        />
      )}
    </div>
  );
};

const StatusBadge = ({ value }: { value: string }) => {
  const tone = value === 'open' || value === 'suspended' || value === 'hidden'
    ? 'bg-ember-100 text-ember-700'
    : value === 'resolved' || value === 'active' || value === 'on'
      ? 'bg-pine-100 text-pine-700'
      : 'bg-muted text-muted-foreground';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${tone}`}>{value}</span>;
};

const AdminTable = ({
  rows,
  columns,
  render,
}: {
  rows: Row[];
  columns: string[];
  render: (row: Row) => ReactNode;
}) => (
  <div className="overflow-x-auto rounded-xl border border-border bg-card">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
        <tr>
          {columns.map((column) => (
            <th key={column} className="px-4 py-3 font-medium">{column}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={String(row.id || row.key)} className="align-middle">
            {render(row)}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
              暂无数据
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default AdminPage;
