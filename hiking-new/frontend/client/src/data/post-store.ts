import * as api from '../api';
import { invalidateGetCache } from '../utils/http';
import type { Post, PostInput } from './hiking-types';
import { mapPost } from './mappers';
import { notify, readJson, RECENT_VIEWS_KEY, writeJson } from './store-runtime';

export interface ListPostsOptions {
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
  onlyPublished?: boolean;
}

export async function listPosts(options: ListPostsOptions = {}): Promise<Post[]> {
  const data = await api.listPosts({
    category: options.category,
    q: options.q,
    limit: options.limit,
    offset: options.offset,
  });
  return (data.posts || []).map(mapPost);
}

export async function getPostById(id: number): Promise<Post | undefined> {
  try {
    const data = await api.getPost(id);
    return data.post ? mapPost(data.post) : undefined;
  } catch {
    return undefined;
  }
}

export async function getPostForEdit(id: number): Promise<Post | undefined> {
  try {
    const data = await api.getManagePost(id);
    return data.post ? mapPost(data.post) : undefined;
  } catch {
    return undefined;
  }
}

export async function isPostLiked(postId: number): Promise<boolean> {
  const data = await api.checkPostLike(postId);
  return Boolean(data.liked);
}

export async function togglePostLike(postId: number): Promise<boolean> {
  const data = await api.togglePostLike(postId);
  invalidateGetCache(`/api/posts/${postId}`);
  invalidateGetCache('/api/posts');
  return Boolean(data.liked);
}

export async function listMyPosts(): Promise<Post[]> {
  const data = await api.listMyPosts();
  return (data.posts || []).map((post: Record<string, unknown>) => ({ ...mapPost(post), isUserPost: true }));
}

export async function listUserPosts(userId: number): Promise<Post[]> {
  const data = await api.listUserPosts(userId);
  return (data.posts || []).map(mapPost);
}

export async function createPost(input: PostInput): Promise<Post> {
  const data = await api.createPost({
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags,
    imageUrls: input.imageUrls,
    extrainfo: input.extrainfo ? JSON.stringify(input.extrainfo) : undefined,
    status: input.status,
  });
  const post = await getPostForEdit(data.postId);
  invalidateGetCache('/api/posts');
  if (!post) throw new Error('帖子创建后读取失败');
  return post;
}

export async function updatePost(id: number, patch: Partial<PostInput>): Promise<Post> {
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.content !== undefined) body.content = patch.content;
  if (patch.category !== undefined) body.category = patch.category;
  if (patch.tags !== undefined) body.tags = patch.tags;
  if (patch.imageUrls !== undefined) body.imageUrls = patch.imageUrls;
  if (patch.extrainfo !== undefined) body.extrainfo = patch.extrainfo ? JSON.stringify(patch.extrainfo) : '';
  if (patch.status !== undefined) body.status = patch.status;
  await api.updatePost(id, body);
  const post = await getPostForEdit(id);
  invalidateGetCache('/api/posts');
  if (!post) throw new Error('帖子更新后读取失败');
  return post;
}

export async function deletePost(id: number): Promise<void> {
  await api.deletePost(id);
  invalidateGetCache('/api/posts');
  notify();
}

export function recordView(postId: number): void {
  const views = readJson<number[]>(RECENT_VIEWS_KEY, []);
  const next = [postId, ...views.filter((id) => id !== postId)].slice(0, 30);
  writeJson(RECENT_VIEWS_KEY, next);
}

export async function listRecentViewPosts(): Promise<Post[]> {
  const ids = readJson<number[]>(RECENT_VIEWS_KEY, []);
  if (ids.length === 0) return [];
  const data = await api.getPostsByIds(ids);
  const byId = new Map((data.posts || []).map((post) => [Number(post.id), mapPost(post)]));
  return ids.map((id) => byId.get(id)).filter((post): post is Post => !!post);
}
