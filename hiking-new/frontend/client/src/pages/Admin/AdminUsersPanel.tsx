import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import * as api from '@client/src/api';
import { toast } from 'sonner';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  hikinglevel?: number;
  profile_public?: number;
  role: string;
  account_status: string;
  email_verified: number;
  created_at: string;
  updated_at?: string;
  stats?: {
    posts: number;
    comments: number;
    events: number;
    followers: number;
    following: number;
  };
}

type UserForm = {
  username: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  location: string;
  hikinglevel: number;
  role: 'user' | 'moderator' | 'admin';
  account_status: 'active' | 'suspended' | 'pending_deletion' | 'deleted';
  email_verified: boolean;
  profile_public: boolean;
};

const EMPTY_FORM: UserForm = {
  username: '',
  email: '',
  password: '',
  avatar: '',
  bio: '',
  location: '',
  hikinglevel: 1,
  role: 'user',
  account_status: 'active',
  email_verified: false,
  profile_public: true,
};

const inputClass =
  'w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';

const statusTone = (value: string): string => {
  if (value === 'active') return 'bg-pine-100 text-pine-700';
  if (value === 'suspended' || value === 'pending_deletion') return 'bg-ember-100 text-ember-700';
  return 'bg-muted text-muted-foreground';
};

const AdminUsersPanel = ({ currentUserId }: { currentUserId: number }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [queryDraft, setQueryDraft] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listAdminUsers({
        q: filters.q || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
        page,
        pageSize,
      });
      setUsers((data.users || []) as unknown as AdminUser[]);
      setTotal(Number(data.total || 0));
      setPageSize(Number(data.pageSize || pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户列表加载失败');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = (): void => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormMode('create');
  };

  const openEdit = async (user: AdminUser): Promise<void> => {
    try {
      const data = await api.getAdminUser(user.id);
      const detail = data.user as unknown as AdminUser;
      setSelected(detail);
      setForm({
        username: detail.username || '',
        email: detail.email || '',
        password: '',
        avatar: detail.avatar || '',
        bio: detail.bio || '',
        location: detail.location || '',
        hikinglevel: Number(detail.hikinglevel || 1),
        role: (detail.role as UserForm['role']) || 'user',
        account_status: (detail.account_status as UserForm['account_status']) || 'active',
        email_verified: Number(detail.email_verified) === 1,
        profile_public: Number(detail.profile_public) !== 0,
      });
      setFormMode('edit');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '用户详情加载失败');
    }
  };

  const saveUser = async (): Promise<void> => {
    setSaving(true);
    try {
      if (formMode === 'create') {
        await api.createAdminUser({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          email_verified: form.email_verified ? 1 : 0,
        });
        toast.success('用户已创建');
      } else if (formMode === 'edit' && selected) {
        await api.updateAdminUser(selected.id, {
          username: form.username.trim(),
          email: form.email.trim(),
          avatar: form.avatar.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          hikinglevel: form.hikinglevel,
          role: form.role,
          account_status: form.account_status,
          email_verified: form.email_verified ? 1 : 0,
          profile_public: form.profile_public ? 1 : 0,
        });
        toast.success('用户资料已更新');
      }
      setFormMode(null);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const runUserAction = async (action: () => Promise<unknown>, success: string): Promise<void> => {
    try {
      await action();
      toast.success(success);
      await loadUsers();
      if (selected) {
        const data = await api.getAdminUser(selected.id);
        setSelected(data.user as unknown as AdminUser);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const deleteUser = async (mode: 'soft' | 'anonymize'): Promise<void> => {
    if (!selected || selected.id === currentUserId) return;
    const label = mode === 'anonymize' ? '匿名化并删除' : '软删除';
    if (!window.confirm(`确定要${label}用户“${selected.username}”吗？`)) return;
    await runUserAction(() => api.deleteAdminUser(selected.id, mode), `用户已${label}`);
    setFormMode(null);
    setSelected(null);
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          className="relative min-w-[180px] flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setFilters((prev) => ({ ...prev, q: queryDraft.trim() }));
          }}
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            placeholder="搜索用户名或邮箱"
            className={`${inputClass} pl-8`}
          />
        </form>
        <select
          value={filters.role}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, role: event.target.value }));
          }}
          className={`${inputClass} w-auto min-w-28`}
        >
          <option value="">全部角色</option>
          <option value="user">user</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </select>
        <select
          value={filters.status}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, status: event.target.value }));
          }}
          className={`${inputClass} w-auto min-w-28`}
        >
          <option value="">全部状态</option>
          <option value="active">active</option>
          <option value="suspended">suspended</option>
          <option value="pending_deletion">pending_deletion</option>
          <option value="deleted">deleted</option>
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-pine-700 px-4 text-sm font-semibold text-paper hover:bg-pine-800"
        >
          <Plus size={15} />
          新建用户
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">加载中...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {['用户', '邮箱', '角色', '状态', '验证', '统计', '操作'].map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-pine-600 text-xs font-semibold text-paper">
                        {user.username?.charAt(0) || '?'}
                      </span>
                      <div>
                        <div className="font-medium text-ink">{user.username}</div>
                        <div className="font-data text-[10px] text-muted-foreground">#{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-xs">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${statusTone(user.account_status)}`}>
                      {user.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{Number(user.email_verified) === 1 ? '已验证' : '未验证'}</td>
                  <td className="px-4 py-3 font-data text-[10px] text-muted-foreground">
                    {user.stats ? `帖 ${user.stats.posts} · 评 ${user.stats.comments}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" className="action-link" onClick={() => void openEdit(user)}>
                        <Pencil size={13} /> 编辑
                      </button>
                      <button
                        type="button"
                        className="action-link"
                        onClick={() => void runUserAction(() => api.forceLogoutAdminUser(user.id), '已强制下线')}
                      >
                        <LogOut size={13} /> 下线
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    没有符合条件的用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>共 {total} 个用户 · 第 {page}/{pageCount} 页</span>
        <div className="flex gap-1">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded border border-border disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded border border-border disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {formMode && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-kicker uppercase text-ember-600">User Management</p>
                <h2 className="mt-1 font-display text-xl text-ink">{formMode === 'create' ? '新建用户' : `编辑 ${selected?.username}`}</h2>
                {selected?.stats && (
                  <p className="mt-2 font-data text-[11px] text-muted-foreground">
                    帖 {selected.stats.posts} · 评 {selected.stats.comments} · 活动 {selected.stats.events} · 粉丝 {selected.stats.followers} · 关注 {selected.stats.following}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setFormMode(null)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-ink">
                用户名
                <input className={`${inputClass} mt-1.5`} value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} />
              </label>
              <label className="text-xs font-medium text-ink">
                邮箱
                <input type="email" className={`${inputClass} mt-1.5`} value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </label>
              {formMode === 'create' && (
                <label className="text-xs font-medium text-ink sm:col-span-2">
                  初始密码
                  <input type="password" minLength={8} maxLength={72} className={`${inputClass} mt-1.5`} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
                </label>
              )}
              <label className="text-xs font-medium text-ink">
                角色
                <select className={`${inputClass} mt-1.5`} value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserForm['role'] }))}>
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label className="text-xs font-medium text-ink">
                账号状态
                <select className={`${inputClass} mt-1.5`} value={form.account_status} onChange={(e) => setForm((prev) => ({ ...prev, account_status: e.target.value as UserForm['account_status'] }))}>
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="pending_deletion">pending_deletion</option>
                  <option value="deleted">deleted</option>
                </select>
              </label>
              <label className="text-xs font-medium text-ink">
                徒步等级
                <select className={`${inputClass} mt-1.5`} value={form.hikinglevel} onChange={(e) => setForm((prev) => ({ ...prev, hikinglevel: Number(e.target.value) }))}>
                  <option value={1}>新手</option>
                  <option value={2}>进阶</option>
                  <option value={3}>资深</option>
                </select>
              </label>
              <label className="text-xs font-medium text-ink">
                所在地
                <input className={`${inputClass} mt-1.5`} value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
              </label>
              <label className="text-xs font-medium text-ink sm:col-span-2">
                头像地址
                <input className={`${inputClass} mt-1.5`} value={form.avatar} onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))} />
              </label>
              <label className="text-xs font-medium text-ink sm:col-span-2">
                个人简介
                <textarea rows={3} className={`${inputClass} mt-1.5 resize-none`} value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
              </label>
              <label className="flex items-center gap-2 text-xs text-ink">
                <input type="checkbox" checked={form.email_verified} onChange={(e) => setForm((prev) => ({ ...prev, email_verified: e.target.checked }))} />
                邮箱已验证
              </label>
              <label className="flex items-center gap-2 text-xs text-ink">
                <input type="checkbox" checked={form.profile_public} onChange={(e) => setForm((prev) => ({ ...prev, profile_public: e.target.checked }))} />
                公开个人主页
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {formMode === 'edit' && selected && selected.id !== currentUserId && (
                <>
                  <button type="button" onClick={() => void runUserAction(() => api.sendAdminUserPasswordReset(selected.id), '重置邮件已发送')} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-ink">
                    <Mail size={13} /> 发送重置邮件
                  </button>
                  <button type="button" onClick={() => void deleteUser('soft')} className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs text-destructive">
                    <Trash2 size={13} /> 软删除
                  </button>
                  <button type="button" onClick={() => void deleteUser('anonymize')} className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground">
                    <ShieldAlert size={13} /> 匿名化
                  </button>
                </>
              )}
              <button type="button" onClick={() => setFormMode(null)} className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-ink">取消</button>
              <button type="button" onClick={() => void saveUser()} disabled={saving} className="rounded-lg bg-pine-700 px-4 py-2 text-xs font-semibold text-paper disabled:opacity-50">
                {saving ? '保存中...' : '保存用户'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPanel;
