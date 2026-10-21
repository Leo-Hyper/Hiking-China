import type { HikingComment, HikingEvent, HikingUser, Post } from './hiking-types';

export function parseTags(raw: unknown): string[] {
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

export function mapUser(raw: Record<string, unknown>): HikingUser {
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
    postCount: raw.post_count === undefined ? undefined : Number(raw.post_count),
    followersCount: raw.followers_count === undefined ? undefined : Number(raw.followers_count),
    followingCount: raw.following_count === undefined ? undefined : Number(raw.following_count),
  };
}

export function mapPost(raw: Record<string, unknown>): Post {
  return {
    id: Number(raw.id),
    title: String(raw.title || ''),
    content: String(raw.content || ''),
    category: String(raw.category || '其他'),
    tags: parseTags(raw.tags),
    imageUrls: parseImageUrls(raw.image_urls),
    authorId: Number(raw.user_id),
    authorName: String(raw.username || ''),
    authorAvatar: raw.author_avatar ? String(raw.author_avatar) : undefined,
    commentCount: Number(raw.comment_count ?? 0),
    views: Number(raw.views ?? 0),
    status: Number(raw.status ?? 1),
    createdAt: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
    extrainfo: parseExtrainfo(raw.extrainfo),
    isUserPost: false,
  };
}

export function mapComment(raw: Record<string, unknown>): HikingComment {
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
    replies: Array.isArray(raw.replies)
      ? raw.replies.map((reply: unknown) => mapComment(reply as Record<string, unknown>))
      : undefined,
  };
}

export function mapEvent(raw: Record<string, unknown>): HikingEvent {
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
