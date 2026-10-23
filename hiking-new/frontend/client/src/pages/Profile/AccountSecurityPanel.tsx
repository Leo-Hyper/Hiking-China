import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  cancelAccountDeletion,
  logoutUser,
  requestAccountDeletion,
  sendVerificationEmail,
} from '@client/src/data/hiking-store';
import type { HikingUser } from '@client/src/data/hiking-types';
import { toast } from 'sonner';

interface AccountSecurityPanelProps {
  user: HikingUser;
}

const ROLE_NAMES: Record<string, string> = {
  user: '社区成员',
  moderator: '版主',
  admin: '管理员',
};

const formatDate = (value?: string): string => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const AccountSecurityPanel = ({ user }: AccountSecurityPanelProps) => {
  const navigate = useNavigate();
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const exportData = (): void => {
    const data: Record<string, unknown> = {
      username: user.username,
      email: user.email,
      bio: user.bio,
      location: user.location,
      hikinglevel: user.hikinglevel,
      gear_prefs: user.gearPrefs,
      profile_public: user.profilePublic,
      created_at: user.createdAt,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '个人数据.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = (): void => {
    logoutUser();
    navigate('/login');
  };

  const resendVerification = async (): Promise<void> => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      toast.success('验证邮件已发送');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '验证邮件发送失败');
    } finally {
      setSendingVerification(false);
    }
  };

  const requestDeletion = async (): Promise<void> => {
    if (!user.email) {
      setDeleteMessage('当前账号缺少邮箱，无法自助注销');
      return;
    }
    setDeleteLoading(true);
    setDeleteMessage('');
    try {
      const message = await requestAccountDeletion(user.email, deletePassword);
      setDeleteMessage(message);
      setDeletePassword('');
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : '注销申请失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeletion = async (): Promise<void> => {
    setDeleteLoading(true);
    setDeleteMessage('');
    try {
      const message = await cancelAccountDeletion();
      setDeleteMessage(message);
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : '撤销失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card shadow-2xs" aria-labelledby="account-info-title">
        <header className="border-b border-border px-5 py-5 md:px-6">
          <p className="text-kicker uppercase text-ember-600">Account</p>
          <h2 id="account-info-title" className="mt-1 font-display text-lg text-ink">账号信息</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">查看登录邮箱、社区身份和账号状态。</p>
        </header>
        <dl className="grid gap-px bg-border sm:grid-cols-2">
          <div className="bg-card p-5">
            <dt className="text-xs text-muted-foreground">登录邮箱</dt>
            <dd className="mt-1.5 break-all text-sm font-medium text-ink">{user.email || '未设置'}</dd>
          </div>
          <div className="bg-card p-5">
            <dt className="text-xs text-muted-foreground">邮箱状态</dt>
            <dd className={`mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium ${
              user.emailVerified ? 'text-pine-700' : 'text-ember-700'
            }`}>
              {user.emailVerified ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {user.emailVerified ? '已验证' : '尚未验证'}
            </dd>
          </div>
          <div className="bg-card p-5">
            <dt className="text-xs text-muted-foreground">社区身份</dt>
            <dd className="mt-1.5 text-sm font-medium text-ink">{ROLE_NAMES[user.role || 'user'] || '社区成员'}</dd>
          </div>
          <div className="bg-card p-5">
            <dt className="text-xs text-muted-foreground">加入时间</dt>
            <dd className="mt-1.5 text-sm font-medium text-ink">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-2xs" aria-labelledby="security-actions-title">
        <header className="border-b border-border px-5 py-5 md:px-6">
          <p className="text-kicker uppercase text-ember-600">Security</p>
          <h2 id="security-actions-title" className="mt-1 font-display text-lg text-ink">登录与数据</h2>
        </header>
        <div className="divide-y divide-border">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pine-50 text-pine-700">
                <Mail size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">邮箱验证</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.emailVerified ? '你的邮箱已经验证，可以正常发布内容和报名活动。' : '验证后才能发帖、评论和报名活动。'}
                </p>
              </div>
            </div>
            {!user.emailVerified ? (
              <button
                type="button"
                onClick={() => void resendVerification()}
                disabled={sendingVerification}
                className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-ink hover:border-pine-300 disabled:opacity-50"
              >
                {sendingVerification ? '发送中...' : '发送验证邮件'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-pine-700">
                <ShieldCheck size={14} />
                已完成
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <KeyRound size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">密码管理</p>
                <p className="mt-1 text-xs text-muted-foreground">通过绑定的邮箱获取一次性密码重置链接。</p>
              </div>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-ink hover:border-pine-300"
            >
              重置密码
            </Link>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Download size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">导出个人数据</p>
                <p className="mt-1 text-xs text-muted-foreground">下载当前账号的基础资料和偏好设置。</p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportData}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-ink hover:border-pine-300"
            >
              下载 JSON
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <LogOut size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">退出当前账号</p>
                <p className="mt-1 text-xs text-muted-foreground">退出后需要重新登录才能发布或互动。</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-ink"
            >
              退出登录
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-destructive/25 bg-card shadow-2xs" aria-labelledby="danger-zone-title">
        <header className="border-b border-destructive/15 px-5 py-5 md:px-6">
          <p className="text-kicker uppercase text-destructive">Danger zone</p>
          <h2 id="danger-zone-title" className="mt-1 font-display text-lg text-ink">注销账号</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            提交后进入 7 天冷静期，期间可以撤销。到期后账号信息会匿名化，公开内容默认保留。
          </p>
        </header>
        <div className="p-5 md:p-6">
          <button
            type="button"
            aria-expanded={showDeleteAccount}
            aria-controls="delete-account-form"
            onClick={() => setShowDeleteAccount((value) => !value)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-destructive/30 px-3.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
          >
            <Trash2 size={15} />
            {showDeleteAccount ? '收起注销申请' : '开始注销流程'}
          </button>

          {showDeleteAccount && (
            <div id="delete-account-form" className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <label htmlFor="delete-account-password" className="text-xs font-medium text-ink">
                输入当前密码确认身份
              </label>
              <input
                id="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="当前登录密码"
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-destructive"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void requestDeletion()}
                  disabled={deleteLoading || !deletePassword}
                  className="rounded-lg bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
                >
                  {deleteLoading ? '提交中...' : '提交注销申请'}
                </button>
                <button
                  type="button"
                  onClick={() => void cancelDeletion()}
                  disabled={deleteLoading}
                  className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-ink disabled:opacity-50"
                >
                  撤销注销
                </button>
              </div>
              {deleteMessage && (
                <p role="status" className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {deleteMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AccountSecurityPanel;
