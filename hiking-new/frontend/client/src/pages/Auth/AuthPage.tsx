import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  loginUser,
  registerUser,
  sendVerificationEmail,
  verifyEmailCode,
} from '@client/src/data/hiking-store';
import { withBasePath } from '@client/src/utils/base-path';
import TopoBackground from '@client/src/components/visual/TopoBackground';
import { Image } from '@client/src/components/ui/image';
import { trackEvent } from '@client/src/utils/analytics';

type AuthMode = 'login' | 'register';
type AuthStep = 'form' | 'verify';

interface AuthFormState {
  username: string;
  email: string;
  password: string;
}

interface LocationState {
  from?: { pathname?: string };
}

const LABEL_CLS: string = 'text-sm font-medium text-ink mb-1.5 block';
const INPUT_CLS: string =
  'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<AuthMode>(
    location.pathname === '/register' ? 'register' : 'login'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [step, setStep] = useState<AuthStep>('form');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationCodeSent, setVerificationCodeSent] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [sendingVerification, setSendingVerification] = useState<boolean>(false);
  const [form, setForm] = useState<AuthFormState>({ username: '', email: '', password: '' });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((value: number) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown > 0]);

  const goBackOrHome = (): void => {
    const state: LocationState | null = location.state as LocationState | null;
    const from: string | undefined = state?.from?.pathname;
    navigate(from && from !== '/login' && from !== '/register' ? from : '/');
  };

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await loginUser(form.email, form.password);
      const user = result.user;
      trackEvent('login_success');
      if (!user.emailVerified) {
        setStep('verify');
        setVerificationCode('');
        setVerificationCodeSent(result.verificationSent);
        setResendCooldown(result.verificationSent ? result.retryAfter : 0);
        setSuccessMsg(
          result.verificationSent
            ? '请输入发送到邮箱的 6 位验证码，验证后即可正常使用。'
            : '登录成功，但验证码邮件发送失败。请点击“重新发送验证码”。'
        );
        return;
      }
      goBackOrHome();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await registerUser(form.username, form.email, form.password);
      trackEvent('register_success', { verification_email_sent: result.verificationEmailSent });
      setStep('verify');
      setVerificationCode('');
      setVerificationCodeSent(result.verificationEmailSent);
      setResendCooldown(result.verificationEmailSent ? result.retryAfter : 0);
      setSuccessMsg(
        result.verificationEmailSent
          ? '注册成功。请输入发送到邮箱的 6 位验证码，验证后即可正常使用。'
          : '注册成功，但验证码邮件发送失败。请点击“重新发送验证码”，或联系管理员。'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (): Promise<void> => {
    if (resendCooldown > 0 || sendingVerification) return;
    setSendingVerification(true);
    setErrorMsg('');
    try {
      const retryAfter = await sendVerificationEmail(form.email);
      setVerificationCodeSent(true);
      setResendCooldown(retryAfter || 60);
      setSuccessMsg('新的验证码已发送，请查收。');
    } catch (err) {
      setVerificationCodeSent(false);
      setErrorMsg(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerifyCode = async (): Promise<void> => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setErrorMsg('请输入 6 位数字验证码');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await verifyEmailCode(form.email, verificationCode);
      trackEvent('email_verified');
      setSuccessMsg('邮箱验证成功，正在进入网站...');
      window.setTimeout(goBackOrHome, 500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '验证码验证失败');
    } finally {
      setLoading(false);
    }
  };

  const backToForm = (): void => {
    setStep('form');
    setVerificationCode('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-2">
      {/* 左侧品牌区（移动端隐藏） */}
      <div className="relative hidden overflow-hidden bg-pine-950 md:flex md:flex-col md:justify-between md:px-12 md:py-10 lg:px-16">
        <TopoBackground className="text-pine-800/70" />
        <Link to="/" className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-paper ring-1 ring-white/30">
            <Image
              src={withBasePath('/img/logo-original.webp')}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display text-lg font-bold text-paper">
            徒步<span className="text-pine-300">中国</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-data text-xs tracking-wider text-pine-400">
            N 30°39′ · E 104°04′ · ALT 512 M
          </p>
          <h1 className="mt-6 font-display text-xl md:text-h1 text-paper">
            山野有灵，
            <br />
            行路有心
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-pine-300">
            徒步中国 · 徒步爱好者社区。分享路线攻略、装备评测与山野瞬间，找到与你同路的伙伴。
          </p>
          <p className="mt-10 font-data text-xs tracking-wider text-pine-500">
            TRAIL JOURNAL · FIELD GUIDE
          </p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex min-h-screen flex-col justify-center px-4 py-12 md:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-lg md:text-h2 text-ink">徒步中国</h2>
            <p className="mt-1 text-sm text-muted-foreground">加入徒步爱好者社区</p>

            {/* 登录 / 注册 Tab */}
            {step === 'form' && (
            <div className="mt-6 mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={
                  mode === 'login'
                    ? 'rounded-md bg-pine-700 py-2 text-sm font-semibold text-paper transition-colors'
                    : 'rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-ink'
                }
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={
                  mode === 'register'
                    ? 'rounded-md bg-pine-700 py-2 text-sm font-semibold text-paper transition-colors'
                    : 'rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-ink'
                }
              >
                注册
              </button>
            </div>
            )}

            {step === 'verify' ? (
              <form
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  handleVerifyCode();
                }}
                className="space-y-4"
              >
                <div className="rounded-lg border border-pine-200 bg-pine-50 px-3.5 py-3 text-xs leading-relaxed text-pine-800">
                  <p className="font-semibold">验证邮箱</p>
                  <p className="mt-1 break-all">
                    {verificationCodeSent ? (
                      <>验证码已发送至 <span className="font-medium">{form.email}</span></>
                    ) : (
                      <>验证码邮件暂未发出，请点击下方重新发送</>
                    )}
                  </p>
                </div>
                <div>
                  <label className={LABEL_CLS}>6 位验证码</label>
                  <input
                    value={verificationCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="000000"
                    className={`${INPUT_CLS} text-center font-data text-2xl tracking-[0.45em]`}
                  />
                </div>
                {successMsg && (
                  <div className="rounded-lg border border-pine-200 bg-pine-50 px-3.5 py-3 text-xs leading-relaxed text-pine-800">
                    {successMsg}
                  </div>
                )}
                {errorMsg && <p className="text-xs text-destructive mt-1.5">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-pine-700 hover:bg-pine-800 text-paper rounded-lg px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? '验证中...' : '验证并进入'}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={backToForm}
                    className="font-medium text-muted-foreground transition-colors hover:text-ink"
                  >
                    返回修改邮箱
                  </button>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={sendingVerification || resendCooldown > 0}
                    className="font-medium text-pine-700 transition-colors hover:text-pine-800 disabled:text-muted-foreground disabled:opacity-70"
                  >
                    {sendingVerification
                      ? '发送中...'
                      : resendCooldown > 0
                        ? `${resendCooldown}s 后重发`
                        : '重新发送验证码'}
                  </button>
                </div>
                {!verificationCodeSent && (
                  <p className="text-xs leading-relaxed text-amber-700">
                    验证码邮件未能发送，请先点击“重新发送验证码”。
                  </p>
                )}
              </form>
            ) : mode === 'login' ? (
              <form
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                <div>
                  <label className={LABEL_CLS}>邮箱</label>
                  <input
                    value={form.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    type="email"
                    required
                    placeholder="your@email.com"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>密码</label>
                  <input
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    type="password"
                    required
                    placeholder="请输入密码"
                    className={INPUT_CLS}
                  />
                </div>
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-pine-700 transition-colors hover:text-pine-800"
                  >
                    忘记密码？
                  </Link>
                </div>
                {errorMsg && <p className="text-xs text-destructive mt-1.5">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-pine-700 hover:bg-pine-800 text-paper rounded-lg px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? '登录中...' : '登录'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="space-y-4"
              >
                <div>
                  <label className={LABEL_CLS}>用户名</label>
                  <input
                    value={form.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    type="text"
                    required
                    minLength={2}
                    maxLength={20}
                    placeholder="2-20个字符"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>邮箱</label>
                  <input
                    value={form.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    type="email"
                    required
                    placeholder="your@email.com"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>密码</label>
                  <input
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    placeholder="8-72个字符"
                    className={INPUT_CLS}
                  />
                </div>
                {errorMsg && <p className="text-xs text-destructive mt-1.5">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-pine-700 hover:bg-pine-800 text-paper rounded-lg px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? '注册中...' : '注册'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
