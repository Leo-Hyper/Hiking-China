import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { listRecentViewPosts } from '@client/src/data/hiking-store';
import type { Post } from '@client/src/data/hiking-types';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import EmptyState from '@client/src/components/visual/EmptyState';

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const RecentViewsTab = () => {
  const { data: recentData, loading } = useAsyncData<Post[]>(() => listRecentViewPosts(), []);
  const recentPosts: Post[] = (recentData ?? []).slice(0, 20);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i: number) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (recentPosts.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="暂无浏览记录"
        description="去论坛逛逛，你读过的每一篇路书都会留在这里"
      />
    );
  }

  return (
    <div className="space-y-3">
      {recentPosts.map((post: Post) => {
        const firstImage: string | undefined = post.imageUrls?.[0];
        return (
          <div
            key={post.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Link to={`/post/${post.id}`} className="flex-1 min-w-0 flex items-center gap-3">
              {firstImage && (
                <Image
                  src={withBasePath(firstImage)}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{post.title}</p>
                <p className="font-data text-xs text-muted-foreground mt-0.5">{formatDate(post.createdAt)}</p>
              </div>
            </Link>
            <span className="font-data text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{post.category}</span>
          </div>
        );
      })}
    </div>
  );
};

export default RecentViewsTab;
