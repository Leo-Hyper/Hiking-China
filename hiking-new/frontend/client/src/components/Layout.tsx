import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, FileText, Plus, Search } from 'lucide-react';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import SearchOverlay from './SearchOverlay';
import { useAuth } from '@client/src/hooks/use-hiking';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@client/src/components/ui/dropdown-menu';

const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/', label: '首页' },
  { path: '/routes', label: '路线' },
  { path: '/gear', label: '装备' },
  { path: '/events', label: '活动' },
  { path: '/forum', label: '论坛' },
];

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isHome: boolean = location.pathname === '/';
  const isTransparent: boolean = isHome && !scrolled;

  return (
    <div className="min-h-screen bg-paper text-ink pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pb-0">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          isTransparent
            ? 'border-b border-transparent max-md:bg-paper max-md:border-border max-md:shadow-2xs'
            : 'nav-paper shadow-2xs'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 md:h-20">
            <Link to="/" className="flex items-center gap-3">
              <div
                className={`w-7 h-7 md:w-10 md:h-10 rounded-full overflow-hidden transition-colors duration-300 ${
                  isTransparent
                    ? 'bg-white/15 ring-1 ring-white/25 max-md:bg-paper max-md:ring-border'
                    : 'bg-paper shadow-2xs ring-1 ring-border'
                }`}
              >
                <Image
                  src="/spark/app/app_17cbgaq6auz/runtime/api/v1/storage/object/bucket_aadkqpc7cfabu_static/static%2Faadkqqkmybuao_ve_miaoda"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className={`font-display text-base md:text-lg font-bold tracking-tight transition-colors duration-300 ${
                  isTransparent ? 'text-white max-md:text-ink' : 'text-ink'
                }`}
              >
                徒步
                <span className={isTransparent ? 'text-pine-300 max-md:text-pine-700' : 'text-pine-700'}>
                  中国
                </span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item: { path: string; label: string }) => {
                const isActive: boolean = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? isTransparent
                          ? 'font-semibold text-white'
                          : 'font-semibold text-ink'
                        : isTransparent
                          ? 'font-medium text-white/70 hover:text-white'
                          : 'font-medium text-muted-foreground hover:text-ink'
                    }`}
                  >
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-ember-500 dot-pop" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className={`grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-lg border max-md:border-0 transition-colors ${
                  isTransparent
                    ? 'border-white/30 text-white hover:bg-white/10 max-md:text-muted-foreground'
                    : 'border-border text-muted-foreground hover:border-pine-300 hover:text-ink'
                }`}
                title="搜索 (Ctrl+K)"
              >
                <Search size={17} strokeWidth={2} />
              </button>

              {isLoggedIn ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-pine-700 px-4 py-2.5 text-sm font-semibold text-paper outline-none transition-colors hover:bg-pine-800 data-[state=open]:bg-pine-800">
                      <Plus size={15} strokeWidth={2.5} />
                      发帖
                      <ChevronDown size={14} strokeWidth={2.5} className="opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-36">
                      <DropdownMenuItem
                        onClick={() => navigate('/publish')}
                        className="cursor-pointer gap-2"
                      >
                        <FileText size={15} />
                        发帖
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/publish-event')}
                        className="cursor-pointer gap-2"
                      >
                        <CalendarDays size={15} />
                        发布活动
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link
                    to="/profile"
                    title="个人中心"
                    className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full"
                  >
                    <span className="flex h-7 w-7 md:h-10 md:w-10 items-center justify-center overflow-hidden rounded-full bg-pine-700 text-xs md:text-sm font-semibold text-paper ring-1 ring-pine-800/40 transition-colors hover:bg-pine-800">
                      {user?.avatar ? (
                        <Image
                          src={withBasePath(user.avatar)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        '我'
                      )}
                    </span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className={`inline-flex min-h-9 md:min-h-0 items-center rounded-lg border px-3 text-xs md:text-sm font-medium transition-colors md:px-4 md:py-2.5 ${
                    isTransparent
                      ? 'border-white/40 text-white hover:bg-white/10 max-md:border-border max-md:text-ink'
                      : 'border-border text-ink hover:border-pine-300'
                  }`}
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </nav>

      </header>

      <main className="pt-11 md:pt-20">
        <Outlet />
      </main>

      <Footer />
      <MobileTabBar />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export { withBasePath };
export default Layout;
