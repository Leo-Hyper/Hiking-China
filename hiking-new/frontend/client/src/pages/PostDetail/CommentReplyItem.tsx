import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { editComment, isCommentLiked, toggleLikeComment } from '@client/src/data/hiking-store';
import type { HikingComment } from '@client/src/data/hiking-types';
import { useAuth } from '@client/src/hooks/use-hiking';
import { resolveImageUrl } from '@client/src/utils/base-path';
import { toast } from 'sonner';
import { Image } from '@client/src/components/ui/image';
import { Heart } from 'lucide-react';

const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d: Date = new Date(dateStr);
  const diff: number = Date.now() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

interface CommentReplyItemProps {
  reply: HikingComment;
  onReply: (target: HikingComment) => void;
  onChanged: () => void;
  onDelete: (target: HikingComment) => void;
  onViewImage: (url: string) => void;
}

const CommentReplyItem: React.FC<CommentReplyItemProps> = ({ reply, onReply, onChanged, onDelete, onViewImage }) => {
  const { isLoggedIn, user } = useAuth();
  const isReplyAuthor: boolean = !!user && reply.userId === user.id;

  const [editing, setEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(reply.likes || 0);

  useEffect(() => {
    let cancelled = false;
    isCommentLiked(reply.id)
      .then((v: boolean) => {
        if (cancelled) return;
        setLiked(v);
        setLikeCount(reply.likes || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reply.id, reply.likes]);

  const handleLike = async (): Promise<void> => {
    if (!isLoggedIn) { toast('请先登录'); return; }
    try {
      const next: boolean = await toggleLikeComment(reply.id);
      setLiked(next);
      setLikeCount((c: number) => Math.max(0, c + (next ? 1 : -1)));
    } catch (e) {
      toast((e as Error).message || '请先登录');
    }
  };

  const saveEdit = async (): Promise<void> => {
    if (!editContent.trim()) return;
    setEditSaving(true);
    try {
      await editComment(reply.id, editContent.trim());
      setEditing(false);
      setEditContent('');
      onChanged();
    } catch (e) {
      toast((e as Error).message || '编辑失败');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="flex gap-2.5">
      {reply.userId ? (
        <Link to={`/user/${reply.userId}`} className="flex-shrink-0">
          {reply.avatar ? (
            <Image src={resolveImageUrl(reply.avatar)} className="w-7 h-7 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-pine-600 text-paper flex items-center justify-center font-semibold text-xs">
              {reply.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </Link>
      ) : (
        <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">?</div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {reply.userId ? (
            <Link to={`/user/${reply.userId}`} className="text-xs font-medium text-ink hover:text-pine-700 transition-colors">
              {reply.username || '匿名'}
            </Link>
          ) : (
            <span className="text-xs font-medium text-ink">{reply.username || '匿名'}</span>
          )}
          {reply.replyToUsername && <span className="text-xs text-pine-600">回复 @{reply.replyToUsername}</span>}
          <span className="font-data tabular-nums text-xs text-pine-900/70 md:text-muted-foreground">{formatShortDate(reply.createdAt)}</span>
        </div>

        {editing ? (
          <div className="mb-1">
            <textarea
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              rows={2}
              maxLength={2000}
              className="w-full px-2 py-1.5 rounded-lg border border-pine-500 bg-card focus:ring-2 focus:ring-pine-500/20 outline-none transition-all resize-none text-xs"
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); saveEdit(); }
              }}
            />
            <div className="flex items-center gap-2 mt-1">
              <button onClick={saveEdit} disabled={editSaving}
                className="px-2.5 py-1 bg-pine-700 text-paper text-xs font-semibold rounded-lg hover:bg-pine-800 disabled:opacity-50">保存</button>
              <button onClick={() => { setEditing(false); setEditContent(''); }}
                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-ink">取消</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
        )}

        {reply.imageUrl && (
          <Image src={resolveImageUrl(reply.imageUrl)}
            className="mt-1.5 max-w-[160px] max-h-[160px] rounded-lg object-cover cursor-pointer hover:opacity-90 border border-border"
            onClick={() => onViewImage(resolveImageUrl(reply.imageUrl))} alt="" />
        )}

        <div className="flex items-center gap-3 mt-1.5 text-xs text-pine-900/70 md:text-muted-foreground">
          <button onClick={handleLike}
            className={`flex items-center gap-0.5 transition-colors ${liked ? 'text-ember-600' : 'hover:text-pine-700'}`}>
            <Heart size={12} fill={liked ? 'currentColor' : 'none'} />
            <span className="font-data tabular-nums">{likeCount}</span>
          </button>
          <button onClick={() => onReply(reply)} className="hover:text-pine-700 transition-colors">回复</button>
          {isReplyAuthor && (
            <>
              <button onClick={() => { setEditing(true); setEditContent(reply.content); }}
                className="hover:text-pine-700 transition-colors">编辑</button>
              <button onClick={() => onDelete(reply)} className="hover:text-destructive transition-colors">删除</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentReplyItem;
