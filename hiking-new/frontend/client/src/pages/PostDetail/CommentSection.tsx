import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addComment, listComments } from '@client/src/data/hiking-store';
import type { HikingComment } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import CommentImageControl from './CommentImageControl';
import CommentItemView from './CommentItemView';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import EmptyState from '@client/src/components/visual/EmptyState';

interface CommentSectionProps {
  postId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { isLoggedIn, user } = useAuth();
  const { data: commentsData, loading, reload } = useAsyncData<HikingComment[]>(
    () => listComments(postId),
    [postId]
  );
  const comments: HikingComment[] = commentsData ?? [];

  const totalCommentCount: number = useMemo(
    () => comments.reduce((n: number, c: HikingComment) => n + 1 + (c.replies ? c.replies.length : 0), 0),
    [comments]
  );

  const [newComment, setNewComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [commentImageUrls, setCommentImageUrls] = useState<string[]>([]);

  const submitComment = async (): Promise<void> => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await addComment({ postId, content: newComment.trim(), imageUrl: commentImageUrls[0] || undefined });
      setNewComment('');
      setCommentImageUrls([]);
      reload();
    } catch (e) {
      toast((e as Error).message || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <h3 className="font-display text-h3 text-ink mb-6">
        评论 <span className="font-data tabular-nums text-base text-pine-900/70 md:text-muted-foreground">{totalCommentCount}</span>
      </h3>

      {isLoggedIn ? (
        <div className="flex gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-pine-600 text-paper flex items-center justify-center font-semibold flex-shrink-0">
            {user?.username?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="rounded-lg border border-border bg-card transition-all focus-within:border-pine-500 focus-within:ring-2 focus-within:ring-pine-500/20">
              <textarea
                value={newComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                rows={3}
                placeholder="写下你的想法..."
                className="w-full px-4 pt-3 pb-1 bg-transparent outline-none resize-none text-sm"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); return; }
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
                }}
              />
              <div className="flex items-center px-3 pb-2">
                <CommentImageControl value={commentImageUrls} onChange={setCommentImageUrls} />
              </div>
            </div>
            <div className="flex items-center justify-end mt-2">
              <button onClick={submitComment} disabled={!newComment.trim() || submitting}
                className="px-4 py-2 bg-pine-700 text-paper text-sm font-semibold rounded-lg hover:bg-pine-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? '发布中...' : '发表评论'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 p-6 bg-muted/60 border border-border rounded-xl text-center">
          <p className="text-muted-foreground mb-3">登录后即可评论</p>
          <Link to="/login" className="inline-flex px-4 py-2 bg-pine-700 text-paper text-sm font-semibold rounded-lg hover:bg-pine-800 transition-colors">
            去登录
          </Link>
        </div>
      )}

      <div className="divide-y divide-border">
        {comments.map((c: HikingComment) => (
          <CommentItemView key={c.id} comment={c} postId={postId} onChanged={reload} />
        ))}
      </div>

      {!loading && comments.length === 0 && (
        <EmptyState icon={MessageSquare} title="还没有评论" description="第一个聊聊这段旅程" />
      )}
    </div>
  );
};

export default CommentSection;
