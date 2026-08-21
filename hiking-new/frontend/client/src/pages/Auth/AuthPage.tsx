import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '@client/src/data/hiking-store';
import { withBasePath } from '@client/src/utils/base-path';
import TopoBackground from '@client/src/components/visual/TopoBackground';
import { Image } from '@client/src/components/ui/image';

type AuthMode = 'login' | 'register';

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
  const [form, setForm] = useState<AuthFormState>({ username: '', email: '', password: '' });

  const goBackOrHome = (): void => {
    const state: LocationState | null = location.state as LocationState | null;
    const from: string | undefined = state?.from?.pathname;
    navigate(from && from !== '/login' && from !== '/register' ? from : '/');
  };

  const handleLogin = async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    try {
      await loginUser(form.email, form.password);
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
    try {
      await registerUser(form.username, form.email, form.password);
      goBackOrHome();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-2">
      {/* 左侧品牌区（移动端隐藏） */}
      <div className="relative hidden overflow-hidden bg-pine-950 md:flex md:flex-col md:justify-between md:px-12 md:py-10 lg:px-16">
        <TopoBackground className="text-pine-800/70" />
        <Link to="/" className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/25">
            <Image
              src={withBasePath('/img/logo.png')}
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

            {mode === 'login' ? (
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
                    minLength={6}
                    placeholder="至少6个字符"
                    className={INPUT_CLS}
                  />
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
                    minLength={6}
                    placeholder="至少6个字符"
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
