import { Link } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import HeroSection from '@client/src/components/HeroSection';
import PostCard from '@client/src/components/PostCard';
import RouteCard from '@client/src/components/RouteCard';
import SectionHeader from '@client/src/components/visual/SectionHeader';
import CtaBackgroundCarousel from '@client/src/pages/Home/CtaBackgroundCarousel';
import TrailTag from '@client/src/components/visual/TrailTag';
import EmptyState from '@client/src/components/visual/EmptyState';
import CountUpNumber from '@client/src/components/visual/CountUpNumber';
import { HOME_ROUTES } from '@client/src/data/hiking-data';
import { listPosts } from '@client/src/data/hiking-store';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import type { Post, RouteItem } from '@client/src/data/hiking-types';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const sectionReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: EASE_OUT_EXPO },
};

const Home = () => {
  const prefersReduced: boolean = useReducedMotion() ?? false;
  const { data: postsData, loading } = useAsyncData<Post[]>(() => listPosts({ limit: 5 }), []);
  const posts: Post[] = loading ? [] : postsData ?? [];
  const routes: RouteItem[] = HOME_ROUTES;
  const featured: RouteItem | undefined = routes[0];
  const restRoutes: RouteItem[] = routes.slice(1);

  const cardItemVariants: Variants = prefersReduced
    ? {}
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
      };
  const listVariants: Variants = prefersReduced
    ? {}
    : { visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

  return (
    <div>
      <HeroSection />

      {/* 精选帖子 */}
      <motion.section {...sectionReveal} className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-20">
        <SectionHeader
          index="01"
          kicker="Latest"
          title="最新精选"
          className="mb-6 md:mb-12"
          action={
            <Link
              to="/forum"
              className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-pine-700 hover:text-pine-800 transition-colors"
            >
              查看全部
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          }
        />

        {loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:block md:space-y-5">
            {[0, 1, 2, 3, 4].map((i: number) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted h-32 md:h-40" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="暂无帖子"
            description="这里还没有内容。去论坛看看大家都在聊什么，或发布你的第一篇徒步记录。"
            action={
              <Link
                to="/forum"
                className="inline-flex items-center gap-2 rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-medium text-paper hover:bg-pine-800 transition-colors"
              >
                进入论坛
                <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-x-3 gap-y-5 md:block md:space-y-5"
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {posts.map((post: Post) => (
              <motion.div key={post.id} variants={cardItemVariants}>
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* 热门路线：主从布局 */}
      <motion.section {...sectionReveal} className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-20">
        <SectionHeader
          index="02"
          kicker="Routes"
          title="热门路线"
          className="mb-6 md:mb-12"
          action={
            <Link
              to="/routes"
              className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-pine-700 hover:text-pine-800 transition-colors"
            >
              探索更多
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          }
        />

        {/* 通栏特色大卡 */}
        {featured && (
          <Link
            to={`/post/${featured.id}`}
            className="group relative block h-[240px] md:h-[420px] overflow-hidden rounded-xl"
          >
            <Image
              src={withBasePath(featured.image)}
              alt={featured.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-out-expo group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 md:gap-6 md:p-8">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap gap-2">
                  <TrailTag tone="mist">{featured.difficulty}</TrailTag>
                  <TrailTag tone="mist">{featured.region}</TrailTag>
                </div>
                <h3 className="font-display text-lg md:text-h1 text-paper">{featured.name}</h3>
                <p className="mt-2 md:mt-3 font-data text-xs md:text-sm tracking-wide text-paper/85">
                  <CountUpNumber value={featured.distance} /> KM · {featured.duration} · 评分{' '}
                  <CountUpNumber value={featured.rating} decimals={1} />
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-paper sm:inline-flex">
                查看路线
                <ArrowRight
                  size={16}
                  className="transition-transform ease-out-expo group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        )}

        {/* 其余路线（网格恒封面卡，RouteCard 已纯封面化） */}
        {restRoutes.length > 0 && (
          <motion.div
            className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-5 md:gap-6"
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {restRoutes.map((route: RouteItem) => (
              <motion.div key={route.id} variants={cardItemVariants}>
                <RouteCard routeData={route} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* CTA：深松色带 */}
      <motion.section {...sectionReveal} className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-20">
        <div className="relative overflow-hidden rounded-xl px-5 py-10 md:px-12 md:py-20">
          {/* 真实摄影背景轮播 + 暗色遮罩（向左渐隐） */}
          <CtaBackgroundCarousel />
          <div className="relative max-w-2xl">
            <p className="text-kicker uppercase text-ember-400">Next Trail Awaits</p>
            <h2 className="mt-3 font-display text-xl md:text-h2 text-paper">准备好出发了吗</h2>
            <p className="mt-4 text-xs md:text-base text-pine-300 leading-relaxed">
              加入数万名徒步爱好者，发现属于你的下一段旅程。从路线规划到结伴同行，山野之间自有答案。
            </p>
            <div className="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
              <Link
                to="/routes"
                className="group relative inline-flex items-center gap-2 rounded-lg bg-ember-500 hover:bg-ember-600 text-paper px-3 py-1.5 text-xs md:px-6 md:py-3 md:text-base font-medium transition-colors after:absolute after:inset-x-4 md:after:inset-x-6 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-paper/70 after:transition-transform after:duration-500 hover:after:scale-x-100"
              >
                查看路线
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/forum"
                className="inline-flex items-center rounded-lg border border-pine-700 text-pine-100 hover:bg-pine-900 px-3 py-1.5 text-xs md:px-6 md:py-3 md:text-base font-medium transition-colors"
              >
                加入社区
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
