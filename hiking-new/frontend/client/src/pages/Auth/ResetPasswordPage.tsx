import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@client/src/data/hiking-store';

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      setMessage(await resetPassword(token, password));
      window.setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center md:p-8">
          <h1 className="font-display text-xl text-ink">重置链接无效</h1>
          <Link to="/forgot-password" className="mt-4 inline-flex text-sm font-semibold text-pine-700">
            重新申请重置链接
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xs md:p-8">
        <p className="text-kicker uppercase text-ember-600">Set New Password</p>
        <h1 className="mt-2 font-display text-xl text-ink md:text-h2">设置新密码</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="block text-sm font-medium text-ink">
            新密码
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`mt-1.5 ${INPUT_CLS}`}
              placeholder="8-72个字符"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            确认新密码
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`mt-1.5 ${INPUT_CLS}`}
              placeholder="再次输入密码"
            />
          </label>
          {message && <p className="rounded-lg bg-pine-50 px-3 py-2.5 text-xs text-pine-800">{message}</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pine-700 px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800 disabled:opacity-50"
          >
            {loading ? '提交中...' : '确认重置'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
