import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@client/src/data/hiking-store';
import type { Post } from '@client/src/data/hiking-types';
import EmptyState from '@client/src/components/visual/EmptyState';
import TrailTag from '@client/src/components/visual/TrailTag';
import { toast } from 'sonner';

interface BookmarksTabProps {
  bookmarks: Post[];
  onChanged: () => void;
}

const BookmarksTab = ({ bookmarks, onChanged }: BookmarksTabProps) => {
  const removeBookmark = async (postId: number): Promise<void> => {
    try {
      await toggleBookmark(postId);
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败');
    }
  };

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="还没有收藏任何帖子"
        description="遇到喜欢的路书和故事，点个收藏，随时回来重温"
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((post: Post) => (
        <div key={post.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <TrailTag tone="pine">{post.category}</TrailTag>
                <span className="text-xs text-muted-foreground">作者 {post.authorName}</span>
              </div>
              <Link
                to={`/post/${post.id}`}
                className="font-semibold text-ink transition-colors line-clamp-1 hover:text-pine-700"
              >
                {post.title}
              </Link>
            </div>
            <button
              onClick={() => removeBookmark(post.id)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive ml-4 flex-shrink-0"
            >
              取消收藏
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookmarksTab;
