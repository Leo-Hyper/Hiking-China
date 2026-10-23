import { useEffect, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Bookmark,
  FileText,
  History,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import {
  deletePost,
  getUserStats,
  listBookmarkedPosts,
  listMyPosts,
} from '@client/src/data/hiking-store';
import type { Post, UserStats } from '@client/src/data/hiking-types';
import MyPostsTab from './MyPostsTab';
import BookmarksTab from './BookmarksTab';
import RecentViewsTab from './RecentViewsTab';
import ProfileEditForm from './ProfileEditForm';
import AccountSecurityPanel from './AccountSecurityPanel';
import { toast } from 'sonner';
import { UserAvatar } from '@client/src/components/ui/user-avatar';
import Seo from '@client/src/components/Seo';

type ProfileTabKey = 'posts' | 'recent' | 'bookmarks' | 'profile' | 'account';

interface ProfileTab {
  key: ProfileTabKey;
  label: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
}

const PROFILE_TABS: ProfileTab[] = [
  { key: 'posts', label: '我的帖子', description: '管理草稿和已发布的路书、攻略与故事。', eyebrow: 'Content library', icon: FileText },
  { key: 'recent', label: '最近浏览', description: '继续阅读你近期打开过的路线和游记。', eyebrow: 'Recent trails', icon: History },
  { key: 'bookmarks', label: '我的收藏', description: '集中整理准备出发前再次查看的内容。', eyebrow: 'Saved trails', icon: Bookmark },
  { key: 'profile', label: '个人资料', description: '编辑公开身份、徒步经验和装备偏好。', eyebrow: 'Public identity', icon: UserRound },
  { key: 'account', label: '账号与安全', description: '管理邮箱、密码、数据导出和账号状态。', eyebrow: 'Account security', icon: ShieldCheck },
];

const LEVEL_NAMES: string[] = ['', '新手', '进阶', '资深'];
const LEVEL_CLASSES: string[] = ['', 'bg-pine-500', 'bg-mist-500', 'bg-ember-500'];
const PROFILE_TAB_KEYS: ProfileTabKey[] = PROFILE_TABS.map((tab) => tab.key);

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const requestedTab = searchParams.get('tab') as ProfileTabKey | null;
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(
    requestedTab && PROFILE_TAB_KEYS.includes(requestedTab) ? requestedTab : 'posts'
  );
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);

  const { data: myPostsData, loading: myPostsLoading, reload: reloadPosts } = useAsyncData<Post[]>(
    () => (user ? listMyPosts() : Promise.resolve([])),
    [user?.id]
  );
  const { data: bookmarksData, loading: bookmarksLoading, reload: reloadBookmarks } = useAsyncData<Post[]>(
    () => (user ? listBookmarkedPosts() : Promise.resolve([])),
    [user?.id]
  );
  const { data: statsData, loading: statsLoading, reload: reloadStats } = useAsyncData<UserStats>(
    () =>
      user
        ? getUserStats(user.id)
        : Promise.resolve({ postCount: 0, followersCount: 0, followingCount: 0 }),
    [user?.id]
  );

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    setActiveTab(requestedTab && PROFILE_TAB_KEYS.includes(requestedTab) ? requestedTab : 'posts');
  }, [requestedTab]);

  const selectTab = (tab: ProfileTabKey): void => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'posts') params.delete('tab');
    else params.set('tab', tab);
    setSearchParams(params, { replace: true });
    window.requestAnimationFrame(() => {
      document.getElementById('profile-content-title')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % PROFILE_TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + PROFILE_TABS.length) % PROFILE_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = PROFILE_TABS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = PROFILE_TABS[nextIndex];
    selectTab(nextTab.key);
    window.requestAnimationFrame(() => {
      document.getElementById(`profile-tab-${nextTab.key}`)?.focus();
    });
  };

  if (!user) return null;

  const myPosts: Post[] = myPostsData ?? [];
  const myBookmarks: Post[] = bookmarksData ?? [];
  const stats: UserStats = statsData ?? { postCount: 0, followersCount: 0, followingCount: 0 };
  const profileLevel: string = LEVEL_NAMES[user.hikinglevel || 0] || '';
  const levelClass: string = LEVEL_CLASSES[user.hikinglevel || 0] || '';
  const statsItems = [
    { label: '帖子', value: myPosts.length, loading: myPostsLoading },
    { label: '粉丝', value: stats.followersCount, loading: statsLoading },
    { label: '关注', value: stats.followingCount, loading: statsLoading },
    { label: '收藏', value: myBookmarks.length, loading: bookmarksLoading },
  ];
  const profileChecklist = [
    { label: '头像', complete: Boolean(user.avatar) },
    { label: '个人简介', complete: Boolean(user.bio?.trim()) },
    { label: '所在地', complete: Boolean(user.location?.trim()) },
    { label: '装备偏好', complete: user.gearPrefs.length > 0 },
  ];
  const completedItems = profileChecklist.filter((item) => item.complete).length;
  const completeness = Math.round((completedItems / profileChecklist.length) * 100);
  const activeTabMeta = PROFILE_TABS.find((tab) => tab.key === activeTab) ?? PROFILE_TABS[0];
  const publishedCount = myPosts.filter((post) => post.status !== 0).length;
  const draftCount = myPosts.filter((post) => post.status === 0).length;

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
      <Seo
        title="个人中心"
        description="管理你的徒步中国公开资料、内容记录和账号安全。"
        path="/profile"
        noIndex
      />
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-8 md:py-12">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-kicker uppercase text-ember-600">Member · Account center</p>
            <h1 className="mt-1.5 font-display text-2xl text-ink md:text-3xl">个人中心</h1>
            <p className="mt-2 text-sm text-muted-foreground">管理公开身份、内容记录与账号安全。</p>
          </div>
          <Link
            to={`/user/${user.id}`}
            className="inline-flex min-h-10 w-fit items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-ink transition-colors hover:border-pine-300 hover:text-pine-700"
          >
            查看公开主页
            <ArrowUpRight size={14} />
          </Link>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
            <section className="rounded-xl border border-border bg-card p-5 shadow-2xs" aria-label="账号概要">
              <div className="flex items-start gap-4">
                <UserAvatar
                  src={user.avatar}
                  name={user.username}
                  className="h-[72px] w-[72px] shrink-0 ring-2 ring-pine-200"
                  fallbackClassName="text-2xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-lg text-ink">{user.username}</h2>
                    {profileLevel && (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium text-paper ${levelClass}`}>
                        {profileLevel}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.location || '尚未填写所在地'}
                  </p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    user.profilePublic ? 'bg-pine-50 text-pine-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.profilePublic ? '主页公开' : '仅自己可见'}
                  </span>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {user.bio || '还没有填写个人简介。补充你的徒步经历，会更容易找到合适的同行者。'}
              </p>

              {!user.emailVerified && (
                <button
                  type="button"
                  onClick={() => selectTab('account')}
                  className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg border border-ember-200 bg-ember-50 px-3 py-2.5 text-left text-[11px] leading-relaxed text-ember-800"
                >
                  <span>邮箱尚未验证，发布与报名受限。</span>
                  <span className="shrink-0 font-semibold">去处理</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => selectTab('profile')}
                className="mt-5 block w-full rounded-lg border border-border bg-paper p-3 text-left transition-colors hover:border-pine-300"
              >
                <span className="flex items-center justify-between gap-2 text-xs font-medium text-ink">
                  资料完成度
                  <span className="font-data text-[11px] text-pine-700">{completeness}%</span>
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-pine-600 transition-[width] duration-300"
                    style={{ width: `${completeness}%` }}
                  />
                </span>
                <span className="mt-2 block text-[10px] leading-relaxed text-muted-foreground">
                  {completeness === 100
                    ? '公开资料已经完善。'
                    : `还需要补充：${profileChecklist.filter((item) => !item.complete).map((item) => item.label).join('、')}`}
                </span>
              </button>

              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                {statsItems.map((item) => (
                  <div key={item.label} className="bg-paper px-3 py-3 text-center">
                    {item.loading ? (
                      <div className="mx-auto h-4 w-7 animate-pulse rounded bg-muted" />
                    ) : (
                      <div className="font-data text-base text-ink">{item.value}</div>
                    )}
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <nav className="rounded-xl border border-border bg-card p-1.5 shadow-2xs" aria-label="个人中心功能">
              <div className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col" role="tablist" aria-label="个人中心">
                {PROFILE_TABS.map((tab, index) => {
                  const Icon = tab.icon;
                  const count = tab.key === 'posts'
                    ? myPosts.length
                    : tab.key === 'bookmarks'
                      ? myBookmarks.length
                      : null;
                  const selected = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      id={`profile-tab-${tab.key}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`profile-panel-${tab.key}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectTab(tab.key)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      className={`flex min-h-10 min-w-fit flex-1 items-center gap-2 rounded-lg px-3 text-left text-xs transition-colors lg:w-full lg:flex-none ${
                        selected
                          ? 'bg-pine-700 font-semibold text-paper shadow-2xs'
                          : 'text-muted-foreground hover:bg-pine-50 hover:text-ink'
                      }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                      {count !== null && (
                        <span className={`ml-auto rounded-full px-1.5 py-0.5 font-data text-[9px] ${
                          selected ? 'bg-white/15 text-paper' : 'bg-muted text-muted-foreground'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          <section className="min-w-0 scroll-mt-24" aria-labelledby="profile-content-title">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-kicker uppercase text-muted-foreground">{activeTabMeta.eyebrow}</p>
                <h2 id="profile-content-title" className="mt-1 scroll-mt-24 font-display text-xl text-ink">{activeTabMeta.label}</h2>
                <p className="mt-1.5 text-xs text-muted-foreground">{activeTabMeta.description}</p>
              </div>
              {activeTab === 'posts' && !myPostsLoading && (
                <p className="font-data text-[10px] text-muted-foreground">
                  已发布 {publishedCount} · 草稿 {draftCount}
                </p>
              )}
            </div>

            <div
              id={`profile-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`profile-tab-${activeTab}`}
            >
              {activeTab === 'posts' && <MyPostsTab posts={myPosts} loading={myPostsLoading} onDeleteRequest={confirmDelete} />}
              {activeTab === 'recent' && <RecentViewsTab />}
              {activeTab === 'bookmarks' && (
                <BookmarksTab bookmarks={myBookmarks} loading={bookmarksLoading} onChanged={reloadBookmarks} />
              )}
              {activeTab === 'profile' && <ProfileEditForm user={user} />}
              {activeTab === 'account' && <AccountSecurityPanel user={user} />}
            </div>
          </section>
        </div>
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
