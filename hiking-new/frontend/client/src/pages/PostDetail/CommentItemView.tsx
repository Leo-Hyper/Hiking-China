import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addComment,
  deleteComment,
  editComment,
  isCommentLiked,
  toggleLikeComment,
} from '@client/src/data/hiking-store';
import type { HikingComment } from '@client/src/data/hiking-types';
import { useAuth } from '@client/src/hooks/use-hiking';
import { resolveImageUrl } from '@client/src/utils/base-path';
import CommentImageControl from './CommentImageControl';
import CommentReplyItem from './CommentReplyItem';
import CommentModals from './CommentModals';
import { toast } from 'sonner';
import { Image } from '@client/src/components/ui/image';
import { Heart } from 'lucide-react';

const REPLY_LIMIT: number = 2;

const formatDate = (dateStr: string): string =>
  !dateStr ? '' : new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

interface CommentItemViewProps {
  comment: HikingComment;
  postId: number;
  onChanged: () => void;
}

const CommentItemView: React.FC<CommentItemViewProps> = ({ comment, postId, onChanged }) => {
  const { isLoggedIn, user } = useAuth();
  const isCommentAuthor: boolean = !!user && comment.userId === user.id;
  const isTopLevel: boolean = !comment.parentId;
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(comment.likes || 0);

  const [expanded, setExpanded] = useState<boolean>(false);
  const [showReplyInput, setShowReplyInput] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');
  const [replying, setReplying] = useState<boolean>(false);
  const [replyTarget, setReplyTarget] = useState<HikingComment | null>(null);
  const [replyImageUrls, setReplyImageUrls] = useState<string[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<HikingComment | null>(null);
  const [deleteSaving, setDeleteSaving] = useState<boolean>(false);
  const replyTextareaRef: React.RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement | null>(null);

  const replies: HikingComment[] = comment.replies || [];
  const visibleReplies: HikingComment[] = useMemo(
    () => (expanded ? replies : replies.slice(0, REPLY_LIMIT)),
    [replies, expanded]
  );

  const placeholderText: string = replyTarget
    ? `回复 @${replyTarget.username}...`
    : `回复 @${comment.username || '匿名'}...`;

  useEffect(() => {
    if (showReplyInput) replyTextareaRef.current?.focus();
  }, [showReplyInput, replyTarget]);

  useEffect(() => {
    let cancelled = false;
    isCommentLiked(comment.id)
      .then((v: boolean) => {
        if (cancelled) return;
        setLiked(v);
        setLikeCount(comment.likes || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [comment.id, comment.likes]);

  const handleLike = async (): Promise<void> => {
    if (!isLoggedIn) { toast('请先登录'); return; }
    try {
      const next: boolean = await toggleLikeComment(comment.id);
      setLiked(next);
      setLikeCount((c: number) => Math.max(0, c + (next ? 1 : -1)));
    } catch (e) {
      toast((e as Error).message || '请先登录');
    }
  };

  const toggleReply = (): void => {
    if (!isLoggedIn) { toast('请先登录'); return; }
    setShowReplyInput((v: boolean) => !v);
    setReplyTarget(null);
    setReplyImageUrls([]);
    setReplyContent('');
  };

  const startReplyTo = (target: HikingComment): void => {
    if (!isLoggedIn) { toast('请先登录'); return; }
    setShowReplyInput(true);
    setReplyTarget(target);
    setReplyImageUrls([]);
    setReplyContent('');
  };

  const cancelReply = (): void => {
    setShowReplyInput(false);
    setReplyContent('');
    setReplyTarget(null);
    setReplyImageUrls([]);
  };

  const submitReply = async (): Promise<void> => {
    if (!replyContent.trim()) return;
    setReplying(true);
    try {
      const topParentId: number = comment.parentId || comment.id;
      const replyToUserId: number = replyTarget ? replyTarget.userId : comment.userId;
      await addComment({
        postId,
        content: replyContent.trim(),
        parentId: topParentId,
        replyToUserId,
        imageUrl: replyImageUrls[0] || undefined,
      });
      cancelReply();
      onChanged();
    } catch (e) {
      toast((e as Error).message || '回复失败');
    } finally {
      setReplying(false);
    }
  };

  const cancelEdit = (): void => {
    setEditing(false);
    setEditContent('');
  };

  const saveEdit = async (): Promise<void> => {
    if (!editContent.trim()) return;
    setEditSaving(true);
    try {
      await editComment(comment.id, editContent.trim());
      cancelEdit();
      onChanged();
    } catch (e) {
      toast((e as Error).message || '编辑失败');
    } finally {
      setEditSaving(false);
    }
  };

  const doDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      await deleteComment(deleteTarget.id);
      setDeleteTarget(null);
      onChanged();
    } catch (e) {
      toast((e as Error).message || '删除失败');
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <div className="comment-item py-5 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        {comment.userId ? (
          <Link to={`/user/${comment.userId}`} className="flex-shrink-0">
            {comment.avatar ? (
              <Image src={resolveImageUrl(comment.avatar)} className="w-9 h-9 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-pine-600 text-paper flex items-center justify-center font-semibold text-sm">
                {comment.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </Link>
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">?</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {comment.userId ? (
              <Link to={`/user/${comment.userId}`} className="text-sm font-medium text-ink hover:text-pine-700 transition-colors">
                {comment.username || '匿名用户'}
              </Link>
            ) : (
              <span className="text-sm font-medium text-ink">{comment.username || '匿名用户'}</span>
            )}
            {comment.replyToUsername && (
              <span className="text-xs text-pine-600 font-medium">回复 @{comment.replyToUsername}</span>
            )}
            <span className="font-data tabular-nums text-xs text-pine-900/70 md:text-muted-foreground">{formatDate(comment.createdAt)}</span>
          </div>

          {editing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 rounded-lg border border-pine-500 bg-card focus:ring-2 focus:ring-pine-500/20 outline-none transition-all resize-none text-sm"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); saveEdit(); }
                }}
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button onClick={saveEdit} disabled={editSaving}
                  className="px-3 py-1 bg-pine-700 text-paper text-xs font-semibold rounded-lg hover:bg-pine-800 disabled:opacity-50">保存</button>
                <button onClick={cancelEdit} className="px-3 py-1 text-xs text-muted-foreground hover:text-ink">取消</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground leading-relaxed mb-2 whitespace-pre-wrap break-words">{comment.content}</div>
          )}

          {comment.imageUrl && (
            <div className="mb-2">
              <Image src={resolveImageUrl(comment.imageUrl)}
                className="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-border"
                onClick={() => setViewImage(resolveImageUrl(comment.imageUrl))} alt="评论图片" />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-pine-900/70 md:text-muted-foreground">
            <button onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-ember-600' : 'hover:text-pine-700'}`}>
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              <span className="font-data tabular-nums">{likeCount}</span>
            </button>
            <button onClick={toggleReply} className="hover:text-pine-700 transition-colors">回复</button>
            {isCommentAuthor && (
              <>
                <button onClick={() => { setEditing(true); setEditContent(comment.content); }}
                  className="hover:text-pine-700 transition-colors">编辑</button>
                <button onClick={() => setDeleteTarget(comment)} className="hover:text-destructive transition-colors">删除</button>
              </>
            )}
          </div>

          {isTopLevel && replies.length > 0 && (
            <div className="mt-4 pl-5 border-l border-border space-y-4">
              {visibleReplies.map((reply: HikingComment) => (
                <CommentReplyItem key={reply.id} reply={reply} onReply={startReplyTo} onChanged={onChanged}
                  onDelete={setDeleteTarget} onViewImage={setViewImage} />
              ))}
              {replies.length > REPLY_LIMIT && (
                <button onClick={() => setExpanded((v: boolean) => !v)}
                  className="text-xs text-pine-700 hover:text-pine-800 font-medium pl-9">
                  {expanded ? '收起 ▲' : `展开剩余 ${replies.length - REPLY_LIMIT} 条回复 ▼`}
                </button>
              )}
            </div>
          )}

          {showReplyInput && (
            <div className="flex gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-pine-600 text-paper flex items-center justify-center font-semibold text-xs flex-shrink-0">
                {user?.username?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="rounded-lg border border-border bg-card transition-all focus-within:border-pine-500 focus-within:ring-2 focus-within:ring-pine-500/20">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
                    rows={2}
                    placeholder={placeholderText}
                    className="w-full px-3 pt-2 pb-1 bg-transparent outline-none resize-none text-xs"
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); return; }
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); }
                    }}
                  />
                  <div className="flex items-center px-2.5 pb-1.5">
                    <CommentImageControl value={replyImageUrls} onChange={setReplyImageUrls} />
                  </div>
                </div>
                <div className="flex items-center justify-end mt-1.5">
                  <div className="flex gap-2">
                    <button onClick={submitReply} disabled={!replyContent.trim() || replying}
                      className="px-3 py-1 bg-pine-700 text-paper text-xs font-semibold rounded-lg hover:bg-pine-800 transition-colors disabled:opacity-50">
                      {replying ? '发布中...' : '回复'}
                    </button>
                    <button onClick={cancelReply} className="px-3 py-1 text-muted-foreground text-xs hover:text-ink">取消</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CommentModals
        deleteTarget={deleteTarget}
        deleteSaving={deleteSaving}
        onCancelDelete={() => setDeleteTarget(null)}
        onConfirmDelete={doDelete}
        viewImage={viewImage}
        onCloseImage={() => setViewImage(null)}
      />
    </div>
  );
};

export default CommentItemView;
