import { Link, useParams } from 'react-router-dom';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import { getUserById, getUserStats, listUserPosts } from '@client/src/data/hiking-store';
import type { HikingUser, Post, UserStats } from '@client/src/data/hiking-types';
import { stripHtml, withBasePath } from '@client/src/utils/base-path';
import PostCard from './PostCard';
import type { FormattedPost } from './PostCard';
import FollowButton from './FollowButton';
import { Image } from '@client/src/components/ui/image';
import EmptyState from '@client/src/components/visual/EmptyState';

const LEVEL_NAMES: string[] = ['', '新手', '进阶', '资深'];
const LEVEL_CLASSES: string[] = ['', 'bg-pine-500', 'bg-mist-500', 'bg-ember-500'];

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatPost = (p: Post): FormattedPost => {
  const images: string[] = (p.imageUrls || []).map((img: string) =>
    img.startsWith('http') ? img : withBasePath(img)
  );
  const text: string = stripHtml(p.content);
  return {
    id: p.id,
    title: p.title,
    excerpt: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
    author: p.authorName || '匿名',
    authorId: p.authorId,
    date: p.createdAt ? p.createdAt.split('T')[0] : '',
    category: p.category || '其他',
    image: images[0] || withBasePath('/img/徒步装备.avif'),
    images,
    tags: Array.isArray(p.tags) ? p.tags : [],
    views: p.views || 0,
  };
};

const UserProfilePage = () => {
  const params = useParams<{ id: string }>();
  const userId: number = Number(params.id);
  const { isLoggedIn, user: currentUser } = useAuth();

  const { data: profileUserData, loading: userLoading } = useAsyncData<HikingUser | undefined>(
    () => (Number.isNaN(userId) ? Promise.resolve(undefined) : getUserById(userId)),
    [userId]
  );
  const profileUser: HikingUser | undefined = profileUserData ?? undefined;

  const { data: statsData } = useAsyncData<UserStats>(
    () =>
      profileUser
        ? getUserStats(profileUser.id)
        : Promise.resolve({ postCount: 0, followersCount: 0, followingCount: 0 }),
    [profileUser?.id]
  );
  const stats: UserStats = statsData ?? { postCount: 0, followersCount: 0, followingCount: 0 };

  const { data: userPostsData, loading: postsLoading } = useAsyncData<Post[]>(
    () => (Number.isNaN(userId) ? Promise.resolve([]) : listUserPosts(userId)),
    [userId]
  );
  const userPosts: Post[] = (userPostsData ?? []).slice(0, 50);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
          <div className="animate-pulse rounded-xl bg-muted h-64" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">用户不存在</p>
          <Link
            to="/forum"
            className="mt-4 inline-flex rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800"
          >
            返回论坛
          </Link>
        </div>
      </div>
    );
  }

  const profileLevel: string = LEVEL_NAMES[profileUser.hikinglevel || 0] || '';
  const levelClass: string = LEVEL_CLASSES[profileUser.hikinglevel || 0] || '';
  const profileGear: string[] = Array.isArray(profileUser.gearPrefs) ? profileUser.gearPrefs : [];
  const isSelf: boolean = isLoggedIn && !!currentUser && currentUser.id === profileUser.id;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        {/* 用户信息卡片 */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            {profileUser.avatar ? (
              <Image
                src={withBasePath(profileUser.avatar)}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-pine-200 mb-4"
                alt=""
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-pine-700 text-paper flex items-center justify-center font-bold text-2xl md:text-4xl mb-4">
                {profileUser.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}

            <h1 className="font-display text-lg md:text-h2 text-ink mb-1">{profileUser.username}</h1>
            {profileLevel && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-paper text-xs font-medium mb-2 ${levelClass}`}
              >
                {profileLevel}
              </span>
            )}
            {profileUser.bio ? (
              <p className="text-sm text-muted-foreground mb-4 max-w-md">{profileUser.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground mb-2">这个人很懒，什么都没写...</p>
            )}
            {profileUser.location ? (
              <p className="text-xs text-muted-foreground mb-4">{profileUser.location}</p>
            ) : (
              <p className="mb-4"></p>
            )}

            {profileGear.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {profileGear.map((g: string) => (
                  <span key={g} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {g}
                  </span>
                ))}
              </div>
            )}
            <div className="font-data text-xs text-muted-foreground mb-4">加入于 {formatDate(profileUser.createdAt)}</div>

            {/* 统计 */}
            <div className="flex items-center gap-8 mb-6">
              <div className="text-center">
                <div className="font-data text-lg text-ink">{stats.postCount || 0}</div>
                <div className="text-xs text-muted-foreground">帖子</div>
              </div>
              <div className="text-center">
                <div className="font-data text-lg text-ink">{stats.followersCount || 0}</div>
                <div className="text-xs text-muted-foreground">粉丝</div>
              </div>
              <div className="text-center">
                <div className="font-data text-lg text-ink">{stats.followingCount || 0}</div>
                <div className="text-xs text-muted-foreground">关注</div>
              </div>
            </div>

            {/* 关注按钮（不给自己显示） */}
            <FollowButton userId={profileUser.id} />

            {isSelf && (
              <Link
                to="/profile"
                className="rounded-lg border border-border bg-card px-4 py-2 md:px-8 md:py-2.5 text-sm font-medium text-ink transition-colors hover:border-pine-300"
              >
                编辑个人资料
              </Link>
            )}
          </div>
        </div>

        {/* 用户帖子 */}
        <div>
          <h2 className="text-lg font-semibold text-ink mb-4">{profileUser.username} 发布的帖子</h2>

          {userPosts.length === 0 ? (
            <EmptyState title="暂无帖子" description="这位伙伴还没有发布路书和故事" />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-1 md:gap-y-4">
              {userPosts.map((post: Post) => (
                <PostCard key={post.id} post={formatPost(post)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
