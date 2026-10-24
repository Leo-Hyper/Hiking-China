import type { HikingComment, HikingEvent, HikingUser, Post, RouteItem } from './hiking-types';

export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    const value = raw.trim();
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map((tag) => tag.trim()).filter(Boolean);
        }
      } catch {
        return [];
      }
    }
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
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
    role: raw.role === 'admin' || raw.role === 'moderator' ? raw.role : 'user',
    emailVerified: Number(raw.email_verified ?? 0) === 1,
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
    likesCount: Number(raw.likes_count ?? 0),
    views: Number(raw.views ?? 0),
    status: Number(raw.status ?? 1),
    createdAt: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
    extrainfo: parseExtrainfo(raw.extrainfo),
    routeId: raw.route_id == null ? undefined : Number(raw.route_id),
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

function parseGeojson(raw: unknown): RouteItem['geojson'] {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as RouteItem['geojson'];
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as RouteItem['geojson'];
  return null;
}

export function mapRoute(raw: Record<string, unknown>): RouteItem {
  return {
    id: Number(raw.id),
    name: String(raw.name || ''),
    region: String(raw.region || ''),
    difficulty: String(raw.difficulty || '初级'),
    description: String(raw.description || ''),
    distance: Number(raw.distance ?? 0),
    duration: String(raw.duration || ''),
    rating: Number(raw.rating ?? 0),
    image: String(raw.image || ''),
    postId: raw.post_id == null ? undefined : Number(raw.post_id),
    content: String(raw.content || ''),
    tags: parseTags(raw.tags),
    ascent: raw.ascent_m == null ? null : Number(raw.ascent_m),
    descent: raw.descent_m == null ? null : Number(raw.descent_m),
    minElevation: raw.min_elevation == null ? null : Number(raw.min_elevation),
    maxElevation: raw.max_elevation == null ? null : Number(raw.max_elevation),
    startPoint: String(raw.start_point || ''),
    endPoint: String(raw.end_point || ''),
    pointCount: Number(raw.point_count ?? 0),
    geojson: parseGeojson(raw.geojson),
    favoriteCount: Number(raw.favorite_count ?? 0),
    isFavorited: Boolean(raw.is_favorited),
    isSample: Boolean(raw.is_sample),
    dataSource: String(raw.data_source || ''),
    dataVersion: Number(raw.data_version ?? 0),
    authorId: raw.user_id == null ? undefined : Number(raw.user_id),
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
