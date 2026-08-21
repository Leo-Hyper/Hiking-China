import * as api from '../api';
import { setToken } from '../utils/http';
import type {
  HikingComment,
  HikingEvent,
  HikingUser,
  Post,
  PostInput,
  UserStats,
} from './hiking-types';

// ===== 本地状态：会话缓存 + 最近浏览（其余数据全部走后端 API）=====
const SESSION_USER_KEY = 'hiking_session_user';
const RECENT_VIEWS_KEY = 'hiking_recent_views';

let storeVersion = 0;
const listeners = new Set<() => void>();

export function subscribeStore(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getStoreVersion(): number {
  return storeVersion;
}

function notify(): void {
  storeVersion += 1;
  listeners.forEach((cb: () => void) => cb());
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw: string | null = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('存储空间不足，请减少图片数量或尺寸后重试');
  }
}

// ===== 字段映射：后端 snake_case → 前端 camelCase =====

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw) return raw.split(',').filter(Boolean);
  return [];
}

function parseImageUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseExtrainfo(raw: unknown): Post['extrainfo'] {
  if (raw && typeof raw === 'object') return raw as Post['extrainfo'];
  if (typeof raw === 'string' && raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function mapUser(raw: Record<string, unknown>): HikingUser {
  return {
    id: Number(raw.id),
    username: String(raw.username || ''),
    email: raw.email !== undefined ? String(raw.email) : undefined,
    avatar: raw.avatar !== undefined && raw.avatar ? String(raw.avatar) : undefined,
    bio: raw.bio !== undefined && raw.bio ? String(raw.bio) : undefined,
    location: raw.location !== undefined && raw.location ? String(raw.location) : undefined,
    hikinglevel: Number(raw.hikinglevel ?? 1),
    gearPrefs: parseTags(raw.gear_prefs ?? raw.gearPrefs),
    profilePublic: raw.profile_public === undefined ? true : Number(raw.profile_public) === 1,
    createdAt: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
  };
}

function mapPost(raw: Record<string, unknown>): Post {
  return {
    id: Number(raw.id),
    title: String(raw.title || ''),
    content: String(raw.content || ''),
    category: String(raw.category || '其他'),
    tags: parseTags(raw.tags),
    imageUrls: parseImageUrls(raw.image_urls),
    authorId: Number(raw.user_id),
    authorName: String(raw.username || ''),
    views: Number(raw.views ?? 0),
    status: Number(raw.status ?? 1),
    createdAt: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
    extrainfo: parseExtrainfo(raw.extrainfo),
    isUserPost: false,
  };
}

function mapComment(raw: Record<string, unknown>): HikingComment {
  return {
    id: Number(raw.id),
    postId: Number(raw.post_id),
    parentId: raw.parent_id == null ? null : Number(raw.parent_id),
    replyToUserId: raw.reply_to_user_id == null ? undefined : Number(raw.reply_to_user_id),
    replyToUsername: raw.reply_to_username ? String(raw.reply_to_username) : undefined,
    userId: Number(raw.user_id),
    username: String(raw.username || ''),
    avatar: raw.avatar ? String(raw.avatar) : undefined,
    content: String(raw.content || ''),
    imageUrl: raw.image_url ? String(raw.image_url) : undefined,
    likes: Number(raw.likes ?? 0),
    createdAt: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
    replies: Array.isArray(raw.replies) ? raw.replies.map((r: unknown) => mapComment(r as Record<string, unknown>)) : undefined,
  };
}

function mapEvent(raw: Record<string, unknown>): HikingEvent {
  return {
    id: Number(raw.id),
    title: String(raw.title || ''),
    eventDate: String(raw.event_date || ''),
    location: String(raw.location || ''),
    difficulty: String(raw.difficulty || '初级'),
    maxParticipants: Number(raw.max_participants ?? 0),
    content: String(raw.content || ''),
    imageUrl: raw.image_url ? String(raw.image_url) : undefined,
    signupDeadline: raw.signup_deadline ? String(raw.signup_deadline) : undefined,
    participants: Number(raw.participant_count ?? 0),
  };
}

// ===== 会话（同步，供 useAuth 使用）=====

export function getCurrentUser(): HikingUser | null {
  return readJson<HikingUser | null>(SESSION_USER_KEY, null);
}

function saveSessionUser(user: HikingUser): void {
  writeJson(SESSION_USER_KEY, user);
}

export async function registerUser(username: string, email: string, password: string): Promise<HikingUser> {
  const data = await api.register({ username, email, password });
  setToken(data.token);
  const user = mapUser(data.user);
  saveSessionUser(user);
  notify();
  return user;
}

export async function loginUser(email: string, password: string): Promise<HikingUser> {
  const data = await api.login({ email, password });
  setToken(data.token);
  const user = mapUser(data.user);
  saveSessionUser(user);
  notify();
  return user;
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem('hiking_token');
  } catch {
    /* ignore */
  }
  notify();
}

export async function updateProfile(patch: Partial<Pick<HikingUser, 'username' | 'bio' | 'location' | 'hikinglevel' | 'gearPrefs' | 'profilePublic' | 'avatar'>>): Promise<HikingUser> {
  const body: Record<string, unknown> = {};
  if (patch.username !== undefined) body.username = patch.username;
  if (patch.avatar !== undefined) body.avatar = patch.avatar;
  if (patch.bio !== undefined) body.bio = patch.bio;
  if (patch.location !== undefined) body.location = patch.location;
  if (patch.hikinglevel !== undefined) body.hikinglevel = patch.hikinglevel;
  if (patch.gearPrefs !== undefined) body.gear_prefs = patch.gearPrefs;
  if (patch.profilePublic !== undefined) body.profile_public = patch.profilePublic ? 1 : 0;
  const data = await api.updateProfile(body);
  const user = mapUser(data.user);
  saveSessionUser(user);
  notify();
  return user;
}

export async function getUserById(id: number): Promise<HikingUser | undefined> {
  try {
    const data = await api.getPublicUser(id);
    return data.user ? mapUser(data.user) : undefined;
  } catch {
    return undefined;
  }
}

// ===== 帖子 =====

export interface ListPostsOptions {
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
  onlyPublished?: boolean;
}

export async function listPosts(opts: ListPostsOptions = {}): Promise<Post[]> {
  const data = await api.listPosts({
    category: opts.category,
    q: opts.q,
    limit: opts.limit,
    offset: opts.offset,
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

export async function listMyPosts(): Promise<Post[]> {
  const data = await api.listMyPosts();
  return (data.posts || []).map((p: Record<string, unknown>) => ({ ...mapPost(p), isUserPost: true }));
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
  return (await getPostById(data.postId))!;
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
  return (await getPostById(id))!;
}

export async function deletePost(id: number): Promise<void> {
  await api.deletePost(id);
  notify();
}

export async function incrementPostViews(id: number): Promise<void> {
  // 后端 GET /api/posts/:id 已自增 views；此函数保留以兼容旧调用
  await api.getPost(id);
}

// ===== 评论 =====

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
  return mapComment(data.comment);
}

export async function editComment(id: number, content: string): Promise<void> {
  await api.updateComment(id, content);
  notify();
}

export async function deleteComment(id: number): Promise<void> {
  await api.deleteComment(id);
  notify();
}

export async function isCommentLiked(commentId: number): Promise<boolean> {
  const data = await api.checkCommentLike(commentId);
  return data.liked;
}

export async function toggleLikeComment(commentId: number): Promise<boolean> {
  const data = await api.toggleCommentLike(commentId);
  return data.liked;
}

// ===== 收藏 =====

export async function toggleBookmark(postId: number): Promise<boolean> {
  const data = await api.toggleBookmark(postId);
  return data.bookmarked;
}

export async function isBookmarked(postId: number): Promise<boolean> {
  const data = await api.checkBookmark(postId);
  return data.bookmarked;
}

export async function listBookmarkedPosts(): Promise<Post[]> {
  const data = await api.listBookmarks();
  return (data.bookmarks || []).map(mapPost);
}

// ===== 关注 =====

export async function toggleFollow(userId: number): Promise<boolean> {
  const data = await api.toggleFollow(userId);
  return data.following;
}

export async function isFollowing(userId: number): Promise<boolean> {
  const data = await api.checkFollow(userId);
  return data.following;
}

// ===== 活动 =====

export async function listEvents(): Promise<HikingEvent[]> {
  const data = await api.listEvents();
  return (data.events || []).map(mapEvent);
}

export async function getEventById(id: number): Promise<HikingEvent | undefined> {
  try {
    const data = await api.getEvent(id);
    return data.event ? mapEvent(data.event) : undefined;
  } catch {
    return undefined;
  }
}

export async function createEvent(input: Omit<HikingEvent, 'id' | 'participants'>): Promise<HikingEvent> {
  const data = await api.createEvent({
    title: input.title,
    content: input.content,
    location: input.location,
    event_date: input.eventDate,
    difficulty: input.difficulty,
    max_participants: input.maxParticipants,
    image_url: input.imageUrl || '',
    signup_deadline: input.signupDeadline || '',
  });
  return (await getEventById(data.id))!;
}

export async function isEventSignedUp(eventId: number): Promise<boolean> {
  const data = await api.checkJoined(eventId);
  return data.joined;
}

export async function toggleEventSignup(eventId: number): Promise<boolean> {
  const { joined } = await api.checkJoined(eventId);
  if (joined) {
    await api.leaveEvent(eventId);
    return false;
  }
  await api.joinEvent(eventId);
  return true;
}

// ===== 最近浏览（本地保留）=====

export function recordView(postId: number): void {
  const list: number[] = readJson<number[]>(RECENT_VIEWS_KEY, []);
  const next: number[] = [postId, ...list.filter((id: number) => id !== postId)].slice(0, 30);
  writeJson(RECENT_VIEWS_KEY, next);
}

export async function listRecentViewPosts(): Promise<Post[]> {
  const ids: number[] = readJson<number[]>(RECENT_VIEWS_KEY, []);
  const posts = await Promise.all(ids.map((id: number) => getPostById(id)));
  return posts.filter((p: Post | undefined): p is Post => !!p);
}

// ===== 统计 =====

export async function getUserStats(userId: number): Promise<UserStats> {
  try {
    const data = await api.getPublicUser(userId);
    return {
      postCount: Number(data.user.post_count ?? 0),
      followersCount: Number(data.user.followers_count ?? 0),
      followingCount: Number(data.user.following_count ?? 0),
    };
  } catch {
    return { postCount: 0, followersCount: 0, followingCount: 0 };
  }
}
