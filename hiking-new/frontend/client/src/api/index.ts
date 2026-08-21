// API 聚合层：对应后端 Express 8 组路由（auth/posts/comments/events/follow/bookmarks/search/upload）
// 统一走 utils/http.ts（自动携带 JWT、401 清会话）。返回后端原始 snake_case 字段，
// 字段映射（snake_case → 前端 camelCase）在 data/hiking-store.ts 完成。
import { http } from '../utils/http';

// ---------- auth ----------
export interface AuthResponse {
  message: string;
  token: string;
  user: Record<string, unknown>;
}

export function register(input: { username: string; email: string; password: string }): Promise<AuthResponse> {
  return http.post<AuthResponse>('/api/auth/register', input);
}

export function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return http.post<AuthResponse>('/api/auth/login', input);
}

export function getMe(): Promise<{ user: Record<string, unknown> }> {
  return http.get<{ user: Record<string, unknown> }>('/api/auth/me');
}

export function updateProfile(patch: Record<string, unknown>): Promise<{ message: string; user: Record<string, unknown> }> {
  return http.put<{ message: string; user: Record<string, unknown> }>('/api/auth/profile', patch);
}

export function getPublicUser(userId: number): Promise<{ user: Record<string, unknown> }> {
  return http.get<{ user: Record<string, unknown> }>(`/api/auth/users/${userId}`);
}

// ---------- posts ----------
export interface ListPostsParams {
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function listPosts(params: ListPostsParams = {}): Promise<{ posts: Record<string, unknown>[] }> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return http.get<{ posts: Record<string, unknown>[] }>(`/api/posts${query ? `?${query}` : ''}`);
}

export function getPost(postId: number): Promise<{ post: Record<string, unknown> }> {
  return http.get<{ post: Record<string, unknown> }>(`/api/posts/${postId}`);
}

export function createPost(input: Record<string, unknown>): Promise<{ message: string; postId: number }> {
  return http.post<{ message: string; postId: number }>('/api/posts', input);
}

export function updatePost(postId: number, patch: Record<string, unknown>): Promise<{ message: string }> {
  return http.put<{ message: string }>(`/api/posts/${postId}`, patch);
}

export function deletePost(postId: number): Promise<{ message: string }> {
  return http.delete<{ message: string }>(`/api/posts/${postId}`);
}

export function listMyPosts(): Promise<{ posts: Record<string, unknown>[]; total: number }> {
  return http.get<{ posts: Record<string, unknown>[]; total: number }>('/api/posts/my');
}

export function listUserPosts(userId: number): Promise<{ posts: Record<string, unknown>[] }> {
  return http.get<{ posts: Record<string, unknown>[] }>(`/api/posts/user/${userId}`);
}

export function togglePostLike(postId: number): Promise<{ liked: boolean }> {
  return http.post<{ liked: boolean }>(`/api/posts/like/toggle/${postId}`);
}

export function checkPostLike(postId: number): Promise<{ liked: boolean }> {
  return http.get<{ liked: boolean }>(`/api/posts/like/check/${postId}`);
}

// ---------- comments ----------
export function listComments(postId: number): Promise<{ comments: Record<string, unknown>[] }> {
  return http.get<{ comments: Record<string, unknown>[] }>(`/api/comments?post_id=${postId}`);
}

export function createComment(input: {
  post_id: number;
  content: string;
  parent_id?: number | null;
  reply_to_user_id?: number | null;
  image_url?: string | null;
}): Promise<{ comment: Record<string, unknown> }> {
  return http.post<{ comment: Record<string, unknown> }>('/api/comments', input);
}

export function updateComment(commentId: number, content: string): Promise<{ message: string }> {
  return http.put<{ message: string }>(`/api/comments/${commentId}`, { content });
}

export function deleteComment(commentId: number): Promise<{ message: string }> {
  return http.delete<{ message: string }>(`/api/comments/${commentId}`);
}

export function toggleCommentLike(commentId: number): Promise<{ liked: boolean }> {
  return http.post<{ liked: boolean }>(`/api/comments/${commentId}/like`);
}

export function checkCommentLike(commentId: number): Promise<{ liked: boolean }> {
  return http.get<{ liked: boolean }>(`/api/comments/${commentId}/like/check`);
}

// ---------- events ----------
export function listEvents(): Promise<{ events: Record<string, unknown>[] }> {
  return http.get<{ events: Record<string, unknown>[] }>('/api/events');
}

export function getEvent(eventId: number): Promise<{ event: Record<string, unknown> }> {
  return http.get<{ event: Record<string, unknown> }>(`/api/events/${eventId}`);
}

export function createEvent(input: Record<string, unknown>): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/events', input);
}

export function updateEvent(eventId: number, patch: Record<string, unknown>): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/events/${eventId}`, patch);
}

export function deleteEvent(eventId: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/events/${eventId}`);
}

export function joinEvent(eventId: number): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>(`/api/events/${eventId}/join`);
}

export function leaveEvent(eventId: number): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>(`/api/events/${eventId}/leave`);
}

export function checkJoined(eventId: number): Promise<{ joined: boolean }> {
  return http.get<{ joined: boolean }>(`/api/events/${eventId}/check`);
}

// ---------- follow ----------
export function toggleFollow(userId: number): Promise<{ following: boolean }> {
  return http.post<{ following: boolean }>(`/api/follow/toggle/${userId}`);
}

export function checkFollow(userId: number): Promise<{ following: boolean }> {
  return http.get<{ following: boolean }>(`/api/follow/check/${userId}`);
}

// ---------- bookmarks ----------
export function toggleBookmark(postId: number): Promise<{ bookmarked: boolean; message: string }> {
  return http.post<{ bookmarked: boolean; message: string }>(`/api/bookmarks/toggle/${postId}`);
}

export function checkBookmark(postId: number): Promise<{ bookmarked: boolean }> {
  return http.get<{ bookmarked: boolean }>(`/api/bookmarks/check/${postId}`);
}

export function listBookmarks(): Promise<{ bookmarks: Record<string, unknown>[] }> {
  return http.get<{ bookmarks: Record<string, unknown>[] }>('/api/bookmarks');
}

// ---------- search ----------
export interface SearchResult {
  id: number;
  type: string;
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  route: string;
  created_at?: string;
  date?: string;
  author?: string;
}

export function search(q: string): Promise<{ results: SearchResult[] }> {
  return http.get<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`);
}

// ---------- upload ----------
export function upload(files: File[]): Promise<{ urls: string[]; message: string }> {
  return http.upload<{ urls: string[]; message: string }>('/api/upload', files);
}