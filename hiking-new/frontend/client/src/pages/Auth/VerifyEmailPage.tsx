import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '@client/src/data/hiking-store';

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在验证邮箱...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('验证链接无效');
      return;
    }
    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          setMessage('邮箱验证成功，现在可以正常发帖、评论和报名活动。');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : '邮箱验证失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-2xs md:p-8">
        <p className="text-kicker uppercase text-ember-600">Email Verification</p>
        <h1 className="mt-2 font-display text-xl text-ink md:text-h2">
          {status === 'loading' ? '验证中' : status === 'success' ? '验证完成' : '验证失败'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <Link
          to={status === 'success' ? '/' : '/profile'}
          className="mt-6 inline-flex rounded-lg bg-pine-700 px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800"
        >
          {status === 'success' ? '返回首页' : '前往个人中心'}
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
