import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { Post } from '@client/src/data/hiking-types';
import EmptyState from '@client/src/components/visual/EmptyState';
import TrailTag from '@client/src/components/visual/TrailTag';

interface MyPostsTabProps {
  posts: Post[];
  onDeleteRequest: (post: Post) => void;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const MyPostsTab = ({ posts, onDeleteRequest }: MyPostsTabProps) => {
  const draftPosts: Post[] = posts.filter((p: Post) => p.status === 0);
  const publishedPosts: Post[] = posts.filter((p: Post) => p.status !== 0);

  if (draftPosts.length + publishedPosts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="你还没有发布过帖子"
        description="写下第一篇路书，把你的徒步故事分享给更多同路人"
        action={
          <Link
            to="/publish"
            className="inline-flex rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800"
          >
            去发帖
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 草稿 */}
      {draftPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-ember-600 mb-3">草稿箱 ({draftPosts.length})</h3>
          <div className="space-y-3">
            {draftPosts.map((post: Post) => (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrailTag tone="ember">草稿</TrailTag>
                      <span className="font-data text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                    </div>
                    <span className="font-semibold text-ink line-clamp-1">
                      {post.title || '未命名草稿'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Link
                      to={`/post/${post.id}/edit`}
                      className="rounded-lg bg-pine-50 px-3 py-1.5 text-xs text-pine-700 transition-colors hover:bg-pine-100"
                    >
                      继续编辑
                    </Link>
                    <button
                      onClick={() => onDeleteRequest(post)}
                      className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已发布 */}
      {publishedPosts.length > 0 && (
        <div>
          {draftPosts.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-3">已发布 ({publishedPosts.length})</h3>
          )}
          <div className="space-y-3">
            {publishedPosts.map((post: Post) => (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrailTag tone="pine">{post.category}</TrailTag>
                      <span className="font-data text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                      <span className="font-data text-xs text-muted-foreground">· {post.views || 0} 浏览</span>
                    </div>
                    <Link
                      to={`/post/${post.id}`}
                      className="font-semibold text-ink transition-colors line-clamp-1 hover:text-pine-700"
                    >
                      {post.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Link
                      to={`/post/${post.id}/edit`}
                      className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-pine-50 hover:text-pine-700"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => onDeleteRequest(post)}
                      className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPostsTab;
