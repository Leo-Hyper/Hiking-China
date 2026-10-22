import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import * as api from '@client/src/api';
import { mapPost } from '@client/src/data/mappers';
import type { Post } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import PostCard from '@client/src/components/PostCard';
import EmptyState from '@client/src/components/visual/EmptyState';
import Seo from '@client/src/components/Seo';

const FeedPage = () => {
  const { isLoggedIn } = useAuth();
  const { data, loading } = useAsyncData<Post[]>(
    () => api.getPersonalizedFeed().then((result) => (result.posts || []).map(mapPost)),
    [isLoggedIn],
  );
  const posts: Post[] = useMemo(() => data ?? [], [data]);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Compass className="mx-auto text-pine-600" size={38} />
        <h1 className="mt-4 font-display text-xl text-ink">登录后查看关注动态</h1>
        <Link to="/login" className="mt-6 inline-flex rounded-lg bg-pine-700 px-5 py-2.5 text-sm font-semibold text-paper">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <Seo title="关注动态" description="查看你关注的徒步作者发布的最新内容。" path="/feed" />
      <div className="mb-8">
        <p className="text-kicker uppercase text-ember-600">Trail Feed</p>
        <h1 className="mt-2 font-display text-xl text-ink md:text-h1">关注动态</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          你关注的作者优先，随后补充社区热门路线和游记。
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="动态还是空的"
          description="关注一些作者，或者去论坛发现新的路线和故事。"
          action={<Link to="/forum" className="inline-flex items-center gap-1 rounded-lg bg-pine-700 px-4 py-2 text-sm font-semibold text-paper">去论坛 <ArrowRight size={14} /></Link>}
        />
      ) : (
        <div className="grid gap-y-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
