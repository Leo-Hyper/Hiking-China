import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@client/src/data/hiking-store';

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      setMessage(await requestPasswordReset(email));
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xs md:p-8">
        <p className="text-kicker uppercase text-ember-600">Account Recovery</p>
        <h1 className="mt-2 font-display text-xl text-ink md:text-h2">找回密码</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          输入注册邮箱，我们会发送一封 30 分钟内有效的重置邮件。
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="block text-sm font-medium text-ink">
            邮箱
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`mt-1.5 ${INPUT_CLS}`}
              placeholder="your@email.com"
            />
          </label>
          {message && <p className="rounded-lg bg-pine-50 px-3 py-2.5 text-xs text-pine-800">{message}</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pine-700 px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800 disabled:opacity-50"
          >
            {loading ? '发送中...' : '发送重置邮件'}
          </button>
        </form>
        <Link to="/login" className="mt-5 inline-flex text-xs font-medium text-pine-700 hover:text-pine-800">
          返回登录
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
