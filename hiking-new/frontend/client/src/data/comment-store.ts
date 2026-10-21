import * as api from '../api';
import { invalidateGetCache } from '../utils/http';
import type { HikingComment } from './hiking-types';
import { mapComment } from './mappers';
import { notify } from './store-runtime';

export async function listComments(postId: number): Promise<HikingComment[]> {
  const data = await api.listComments(postId);
  return (data.comments || []).map(mapComment);
}

export interface AddCommentInput {
  postId: number;
  content: string;
  parentId?: number;
  replyToUserId?: number;
  imageUrl?: string;
}

export async function addComment(input: AddCommentInput): Promise<HikingComment> {
  const data = await api.createComment({
    post_id: input.postId,
    content: input.content,
    parent_id: input.parentId ?? null,
    reply_to_user_id: input.replyToUserId ?? null,
    image_url: input.imageUrl ?? null,
  });
  invalidateGetCache('/api/posts');
  invalidateGetCache('/api/comments');
  notify();
  return mapComment(data.comment);
}

export async function editComment(id: number, content: string): Promise<void> {
  await api.updateComment(id, content);
  invalidateGetCache('/api/comments');
  notify();
}

export async function deleteComment(id: number): Promise<void> {
  await api.deleteComment(id);
  invalidateGetCache('/api/posts');
  invalidateGetCache('/api/comments');
  notify();
}

export async function isCommentLiked(commentId: number): Promise<boolean> {
  const data = await api.checkCommentLike(commentId);
  return data.liked;
}

export async function toggleLikeComment(commentId: number): Promise<boolean> {
  const data = await api.toggleCommentLike(commentId);
  notify();
  return data.liked;
}
