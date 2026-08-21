import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import {
  deletePost,
  getUserStats,
  listBookmarkedPosts,
  listMyPosts,
} from '@client/src/data/hiking-store';
import type { Post, UserStats } from '@client/src/data/hiking-types';
import { withBasePath } from '@client/src/utils/base-path';
import MyPostsTab from './MyPostsTab';
import BookmarksTab from './BookmarksTab';
import RecentViewsTab from './RecentViewsTab';
import ProfileEditForm from './ProfileEditForm';
import { toast } from 'sonner';
import { Image } from '@client/src/components/ui/image';

type ProfileTabKey = 'posts' | 'recent' | 'bookmarks' | 'profile';

const PROFILE_TABS: { key: ProfileTabKey; label: string }[] = [
  { key: 'posts', label: '我的帖子' },
  { key: 'recent', label: '最近浏览' },
  { key: 'bookmarks', label: '我的收藏' },
  { key: 'profile', label: '个人资料' },
];

const LEVEL_NAMES: string[] = ['', '新手', '进阶', '资深'];
const LEVEL_CLASSES: string[] = ['', 'bg-pine-500', 'bg-mist-500', 'bg-ember-500'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);

  const { data: myPostsData, reload: reloadPosts } = useAsyncData<Post[]>(
    () => (user ? listMyPosts() : Promise.resolve([])),
    [user?.id]
  );
  const { data: bookmarksData, reload: reloadBookmarks } = useAsyncData<Post[]>(
    () => (user ? listBookmarkedPosts() : Promise.resolve([])),
    [user?.id]
  );
  const { data: statsData, reload: reloadStats } = useAsyncData<UserStats>(
    () =>
      user
        ? getUserStats(user.id)
        : Promise.resolve({ postCount: 0, followersCount: 0, followingCount: 0 }),
    [user?.id]
  );

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const myPosts: Post[] = myPostsData ?? [];
  const myBookmarks: Post[] = bookmarksData ?? [];
  const stats: UserStats = statsData ?? { postCount: 0, followersCount: 0, followingCount: 0 };
  const profileLevel: string = LEVEL_NAMES[user.hikinglevel || 0] || '';
  const levelClass: string = LEVEL_CLASSES[user.hikinglevel || 0] || '';

  const confirmDelete = (post: Post): void => {
    setDeleteTarget(post);
  };

  const doDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id);
      setDeleteTarget(null);
      reloadPosts();
      reloadStats();
    } catch (err) {
      toast(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleModalBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* 头部 */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            {user.avatar ? (
              <Image
                src={withBasePath(user.avatar)}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-pine-200"
                alt=""
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-pine-700 text-paper flex items-center justify-center font-bold text-xl md:text-3xl">
                {user.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h1 className="font-display text-lg md:text-h2 text-ink">{user.username}</h1>
          {profileLevel && (
            <p className="text-xs mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-paper text-xs font-medium ${levelClass}`}
              >
                {profileLevel}
              </span>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">{user.bio || '这个人很懒，什么都没写...'}</p>
          {user.location && <p className="text-xs text-muted-foreground mt-0.5">{user.location}</p>}

          {/* 统计栏 */}
          <div className="flex items-center justify-center gap-8 mt-5">
            <div className="text-center">
              <div className="font-data text-lg text-ink">{myPosts.length}</div>
              <div className="text-xs text-muted-foreground">帖子</div>
            </div>
            <div className="text-center">
              <div className="font-data text-lg text-ink">{stats.followersCount}</div>
              <div className="text-xs text-muted-foreground">粉丝</div>
            </div>
            <div className="text-center">
              <div className="font-data text-lg text-ink">{stats.followingCount}</div>
              <div className="text-xs text-muted-foreground">关注</div>
            </div>
            <div className="text-center">
              <div className="font-data text-lg text-ink">{myBookmarks.length}</div>
              <div className="text-xs text-muted-foreground">收藏</div>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="mb-8 border-b border-border">
          <div className="mx-auto flex max-w-md justify-center gap-8">
            {PROFILE_TABS.map((tab: { key: ProfileTabKey; label: string }) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-pine-700 font-semibold text-ink'
                    : 'border-transparent text-muted-foreground hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'posts' && <MyPostsTab posts={myPosts} onDeleteRequest={confirmDelete} />}
        {activeTab === 'recent' && <RecentViewsTab />}
        {activeTab === 'bookmarks' && (
          <BookmarksTab bookmarks={myBookmarks} onChanged={reloadBookmarks} />
        )}
        {activeTab === 'profile' && <ProfileEditForm user={user} />}
      </div>

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="rounded-xl border border-border bg-card p-6 max-w-sm w-full shadow-md">
            <h3 className="text-lg font-semibold text-ink mb-2">确认删除</h3>
            <p className="text-sm text-muted-foreground mb-4">
              确定要删除帖子「{deleteTarget.title}」吗？此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-ink transition-colors hover:border-pine-300"
              >
                取消
              </button>
              <button
                onClick={doDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground transition-colors hover:opacity-90"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
