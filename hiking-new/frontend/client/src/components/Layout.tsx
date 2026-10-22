import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, FileText, Plus, Search } from 'lucide-react';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import SearchOverlay from './SearchOverlay';
import NotificationBell from './NotificationBell';
import { useAuth } from '@client/src/hooks/use-hiking';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import { UserAvatar } from '@client/src/components/ui/user-avatar';
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
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[200] -translate-y-20 rounded-lg bg-pine-700 px-4 py-2 text-sm font-semibold text-paper transition-transform focus:translate-y-0"
      >
        跳到主要内容
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isTransparent
            ? 'border-b border-transparent bg-transparent shadow-none'
            : 'nav-paper bg-paper/95 shadow-sm backdrop-blur-xl'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-[76px]">
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className={`w-8 h-8 md:w-11 md:h-11 rounded-full overflow-hidden transition-all duration-300 ${
                  isTransparent
                    ? 'bg-white/90 ring-1 ring-white/40 shadow-md shadow-ink/10 max-md:bg-paper max-md:ring-border'
                    : 'bg-paper shadow-sm ring-1 ring-border'
                }`}
              >
                <Image
                  src={withBasePath('/img/logo-original.webp')}
                  alt="徒步中国"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <span
                className={`font-display text-[17px] md:text-[19px] font-bold tracking-[0.01em] transition-colors duration-300 ${
                  isTransparent ? 'text-white max-md:text-ink' : 'text-ink'
                }`}
              >
                徒步
                <span className={isTransparent ? 'text-pine-300 max-md:text-pine-700' : 'text-pine-700'}>
                  中国
                </span>
              </span>
            </Link>

            <div
              className={`hidden md:flex items-center rounded-full border p-1 ${
                isTransparent
                  ? 'border-white/15 bg-white/10'
                  : 'border-border/80 bg-white/55 shadow-2xs'
              }`}
            >
              {NAV_ITEMS.map((item: { path: string; label: string }) => {
                const isActive: boolean = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-all duration-300 ${
                      isActive
                        ? isTransparent
                          ? 'bg-white/15 font-semibold text-white shadow-sm'
                          : 'bg-pine-50 font-semibold text-pine-800 shadow-2xs'
                        : isTransparent
                          ? 'font-medium text-white/70 hover:bg-white/10 hover:text-white'
                          : 'font-medium text-muted-foreground hover:bg-white/80 hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className={`grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-full border max-md:border-0 transition-all duration-300 ${
                  isTransparent
                    ? 'border-white/25 bg-white/10 text-white hover:bg-white/15 max-md:bg-transparent max-md:text-muted-foreground'
                    : 'border-border bg-white/70 text-muted-foreground hover:border-pine-300 hover:text-ink'
                }`}
                title="搜索 (Ctrl+K)"
              >
                <Search size={17} strokeWidth={2} />
              </button>
              <NotificationBell />

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
                    <UserAvatar
                      src={user?.avatar}
                      name={user?.username}
                      className="h-7 w-7 md:h-10 md:w-10 ring-1 ring-pine-800/30 transition-opacity hover:opacity-90"
                      fallbackClassName="text-xs md:text-sm"
                    />
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className={`inline-flex min-h-9 md:min-h-0 items-center rounded-full border px-4 text-xs md:text-sm font-semibold transition-all duration-300 md:px-5 md:py-2.5 ${
                    isTransparent
                      ? 'border-white/55 bg-paper text-ink shadow-md shadow-ink/10 hover:bg-white max-md:border-border'
                      : 'border-pine-700 bg-pine-700 text-paper hover:border-pine-800 hover:bg-pine-800'
                  }`}
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </nav>

      </header>

      <main id="main-content" className="pt-11 md:pt-20">
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
