import { Link, useParams } from 'react-router-dom';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import { getUserById, listUserPosts } from '@client/src/data/hiking-store';
import type { HikingUser, Post, UserStats } from '@client/src/data/hiking-types';
import { stripHtml, withBasePath, withCardImage } from '@client/src/utils/base-path';
import PostCard from './PostCard';
import type { FormattedPost } from './PostCard';
import FollowButton from './FollowButton';
import { UserAvatar } from '@client/src/components/ui/user-avatar';
import EmptyState from '@client/src/components/visual/EmptyState';
import Seo from '@client/src/components/Seo';
import { MessageCircle } from 'lucide-react';

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
    authorAvatar: p.authorAvatar ? withBasePath(p.authorAvatar) : undefined,
    commentCount: p.commentCount,
    date: p.createdAt ? p.createdAt.split('T')[0] : '',
    category: p.category || '其他',
    image: withCardImage(p.imageUrls[0] || '/img/徒步装备.avif'),
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

  const stats: UserStats = {
    postCount: profileUser?.postCount ?? 0,
    followersCount: profileUser?.followersCount ?? 0,
    followingCount: profileUser?.followingCount ?? 0,
  };

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
      <Seo
        title={`${profileUser.username} 的主页`}
        description={profileUser.bio || `查看 ${profileUser.username} 在徒步中国发布的公开游记、路线和户外记录。`}
        path={`/user/${profileUser.id}`}
      />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* 用户信息卡片 */}
        <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:p-8">
            <UserAvatar
              src={profileUser.avatar}
              name={profileUser.username}
              className="w-20 h-20 md:w-24 md:h-24 ring-2 ring-pine-200"
              fallbackClassName="text-2xl md:text-4xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl text-ink md:text-2xl">{profileUser.username}</h1>
                {profileLevel && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-paper text-xs font-medium ${levelClass}`}>
                    {profileLevel}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {profileUser.bio || '这个人很懒，什么都没写...'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {profileUser.location && <span>{profileUser.location}</span>}
                <span className="font-data">加入于 {formatDate(profileUser.createdAt)}</span>
              </div>
              {profileGear.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profileGear.map((g: string) => (
                    <span key={g} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <FollowButton userId={profileUser.id} />
              {isSelf && (
                <Link
                  to="/profile"
                  className="rounded-lg border border-border bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-pine-300"
                >
                  编辑资料
                </Link>
              )}
              {!isSelf && isLoggedIn && (
                <Link
                  to={`/messages?to=${profileUser.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-pine-300"
                >
                  <MessageCircle size={15} />
                  私信
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
            {[
              ['帖子', stats.postCount || 0],
              ['粉丝', stats.followersCount || 0],
              ['关注', stats.followingCount || 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-card px-4 py-4 text-center">
                <div className="font-data text-lg text-ink">{value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 用户帖子 */}
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-kicker uppercase text-ember-600">Public Journal</p>
              <h2 className="mt-1 font-display text-lg text-ink">公开游记</h2>
            </div>
            {postsLoading ? (
              <span className="h-3 w-10 animate-pulse rounded bg-muted" />
            ) : (
              <span className="font-data text-[11px] text-muted-foreground">{userPosts.length} 篇</span>
            )}
          </div>

          {postsLoading ? (
            <div className="space-y-3" aria-label="公开游记加载中">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-card p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : userPosts.length === 0 ? (
            <EmptyState title="暂无帖子" description="这位伙伴还没有发布路书和故事" />
          ) : (
            <div className="grid gap-y-4">
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
