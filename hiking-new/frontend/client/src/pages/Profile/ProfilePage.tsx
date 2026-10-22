import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import {
  deletePost,
  getUserStats,
  listBookmarkedPosts,
  listMyPosts,
  sendVerificationEmail,
} from '@client/src/data/hiking-store';
import type { Post, UserStats } from '@client/src/data/hiking-types';
import MyPostsTab from './MyPostsTab';
import BookmarksTab from './BookmarksTab';
import RecentViewsTab from './RecentViewsTab';
import ProfileEditForm from './ProfileEditForm';
import { toast } from 'sonner';
import { UserAvatar } from '@client/src/components/ui/user-avatar';

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
  const [sendingVerification, setSendingVerification] = useState(false);

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

  const resendVerification = async (): Promise<void> => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      toast.success('验证邮件已发送');
    } catch (err) {
      toast(err instanceof Error ? err.message : '验证邮件发送失败');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleModalBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* 头部 */}
        <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:px-8 md:py-7">
            <UserAvatar
              src={user.avatar}
              name={user.username}
              className="w-20 h-20 ring-2 ring-pine-200"
              fallbackClassName="text-xl md:text-3xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl text-ink md:text-2xl">{user.username}</h1>
                {profileLevel && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-paper text-xs font-medium ${levelClass}`}>
                    {profileLevel}
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                {user.bio || '这个人很懒，什么都没写...'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {user.location && <span>{user.location}</span>}
                <span className="font-data">TRAIL CHINA MEMBER</span>
              </div>
              {!user.emailVerified && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-ember-200 bg-ember-50 px-3 py-2 text-xs text-ember-800">
                  <span>邮箱尚未验证，暂时不能发帖、评论或报名活动。</span>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={sendingVerification}
                    className="font-semibold underline decoration-ember-400 underline-offset-2 disabled:opacity-50"
                  >
                    {sendingVerification ? '发送中...' : '重新发送'}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-paper px-4 text-sm font-medium text-ink transition-colors hover:border-pine-300"
            >
              编辑资料
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
            {[
              ['帖子', myPosts.length],
              ['粉丝', stats.followersCount],
              ['关注', stats.followingCount],
              ['收藏', myBookmarks.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-card px-5 py-4 text-center">
                <div className="font-data text-lg text-ink">{value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tab 切换 */}
        <div className="mb-7">
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-2xs">
            {PROFILE_TABS.map((tab: { key: ProfileTabKey; label: string }) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-pine-700 font-semibold text-paper shadow-2xs'
                    : 'text-muted-foreground hover:bg-pine-50 hover:text-ink'
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
