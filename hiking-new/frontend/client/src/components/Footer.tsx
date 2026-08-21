import { Link } from 'react-router-dom';
import { listPosts } from '@client/src/data/hiking-store';
import type { Post } from '@client/src/data/hiking-types';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import TopoBackground from './visual/TopoBackground';

const EXPLORE_LINKS: { path: string; label: string }[] = [
  { path: '/routes', label: '徒步路线' },
  { path: '/gear', label: '装备指南' },
  { path: '/events', label: '活动召集' },
  { path: '/forum', label: '徒步论坛' },
];

const CONTACT_LINES: string[] = ['contact@hikingchina.com', '400-123-4567', '北京市朝阳区'];

const Footer = () => {
  const { data: popularRoutes, loading } = useAsyncData<Post[]>(() => listPosts({ limit: 4 }), []);
  const routes: Post[] = loading ? [] : popularRoutes ?? [];

  return (
    <footer className="relative hidden md:block overflow-hidden bg-pine-950 text-pine-200">
      <TopoBackground className="text-pine-800/60" animated />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 mb-8 md:grid-cols-12 md:gap-x-8 md:gap-y-12 md:mb-14">
          <div className="col-span-1 md:col-span-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-pine-900 ring-1 ring-pine-700">
                <Image
                  src={withBasePath('/img/logo.png')}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display text-base md:text-lg font-bold text-pine-50 tracking-tight">
                徒步<span className="text-ember-400">中国</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-pine-300 line-clamp-2 md:mt-5 md:text-sm md:line-clamp-none">
              一份写给山野的行走手册：路线、装备，与同行的人。推广健康环保的徒步文化。
            </p>
            <p className="mt-3 font-data text-[10px] tracking-wider text-pine-500 md:mt-6 md:text-xs">
              N 40°00′ · E 116°23′ · FIELD GUIDE NO.01
            </p>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-kicker uppercase text-pine-400 mb-2.5 md:mb-4">探索</h4>
            <ul className="space-y-1.5 text-xs md:space-y-2.5 md:text-sm">
              {EXPLORE_LINKS.map((link: { path: string; label: string }) => (
                <li key={link.path}>
                  <Link to={link.path} className="transition-colors hover:text-pine-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="text-kicker uppercase text-pine-400 mb-2.5 md:mb-4">最新游记</h4>
            <ul className="space-y-1.5 text-xs md:space-y-2.5 md:text-sm">
              {routes.map((p: Post) => (
                <li key={p.id}>
                  <Link
                    to={`/post/${p.id}`}
                    className="line-clamp-1 transition-colors hover:text-pine-50"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-kicker uppercase text-pine-400 mb-2.5 md:mb-4">联络</h4>
            <ul className="space-y-1.5 text-xs md:space-y-2.5 md:text-sm">
              {CONTACT_LINES.map((line: string) => (
                <li key={line} className="text-pine-50 md:text-pine-300">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 border-t border-pine-900 pt-4 text-[10px] text-pine-500 md:pt-6 md:text-xs">
          <p>© 2026 徒步中国 · 山野有灵，行路有心</p>
          <p className="font-data tracking-wider">TRAIL CHINA · FIELD GUIDE</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
