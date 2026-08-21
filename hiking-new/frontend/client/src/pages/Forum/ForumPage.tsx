import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, MessagesSquare, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { getCurrentUser, listPosts } from '@client/src/data/hiking-store';
import { POST_CATEGORIES } from '@client/src/data/hiking-data';
import type { Post } from '@client/src/data/hiking-types';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import { Input } from '@client/src/components/ui/input';
import PostCard from '@client/src/components/PostCard';
import EmptyState from '@client/src/components/visual/EmptyState';

const PAGE_LIMIT: number = 20;

const categories: string[] = POST_CATEGORIES;

const optionChipClass = (active: boolean): string =>
  `flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
    active
      ? 'bg-pine-700 font-medium text-paper shadow-2xs'
      : 'bg-muted/60 text-ink/80 hover:bg-pine-50 hover:text-pine-700'
  }`;

const ForumPage = () => {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') ?? '');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_LIMIT);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const isLoggedIn: boolean = getCurrentUser() !== null;

  const { data: filteredData, loading } = useAsyncData<Post[]>(
    () =>
      listPosts({
        category: activeCategory || undefined,
        q: searchQuery || undefined,
      }),
    [activeCategory, searchQuery]
  );

  const filteredPosts: Post[] = filteredData ?? [];
  const posts: Post[] = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMore: boolean = filteredPosts.length > visibleCount;

  const selectCategory = (cat: string): void => {
    setActiveCategory(cat);
    setSearchQuery('');
    setVisibleCount(PAGE_LIMIT);
    setPanelOpen(false);
  };

  const onSearchInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setVisibleCount(PAGE_LIMIT);
  };

  const clearSearch = (): void => {
    setSearchQuery('');
    setVisibleCount(PAGE_LIMIT);
  };

  const loadMore = (): void => {
    setLoadingMore(true);
    setVisibleCount((c: number) => c + PAGE_LIMIT);
    setLoadingMore(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* 页头 */}
      <div className="mb-8 md:mb-12">
        <p className="text-kicker uppercase text-ember-600">Forum · Trail Talk</p>
        <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">徒步论坛</h1>
        <p className="mt-3 text-muted-foreground">与徒步爱好者们分享经验、交流心得</p>
      </div>

      {/* 筛选栏：吸顶单行——分类触发器 + 内联搜索 */}
      <div className="sticky top-11 z-30 -mx-6 bg-paper/95 px-6 backdrop-blur md:top-20 md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        {panelOpen && (
          <button
            aria-label="收起筛选"
            className="fixed inset-0 -z-10 cursor-default bg-ink/20"
            onClick={() => setPanelOpen(false)}
          />
        )}
        <div className="flex h-11 items-center gap-2 border-b border-border/80 md:h-12 md:rounded-xl md:border md:border-border md:bg-card md:px-2 md:shadow-2xs">
          <SlidersHorizontal size={14} className="shrink-0 text-muted-foreground" />
          <button
            onClick={() => setPanelOpen((prev: boolean) => !prev)}
            className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[13px] transition-colors ${
              panelOpen
                ? 'bg-pine-700 font-medium text-paper'
                : activeCategory
                  ? 'bg-pine-50 font-medium text-pine-700'
                  : 'text-ink/80 hover:bg-muted hover:text-ink'
            }`}
          >
            {activeCategory || '分类'}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div className="relative min-w-0 flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={onSearchInput}
              placeholder="搜索帖子..."
              className="h-9 rounded-full border-transparent bg-muted/60 pl-8 pr-8 text-[13px] focus-visible:bg-card focus-visible:border-pine-500 focus-visible:ring-pine-500/20"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                aria-label="清空搜索"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-ink"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {activeCategory && (
            <button
              onClick={() => selectCategory('')}
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-2 text-[13px] text-muted-foreground transition-colors hover:text-ink"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
        {panelOpen && (
          <div className="absolute inset-x-0 top-full border-b border-border bg-paper px-6 py-4 shadow-lg md:top-[calc(100%+4px)] md:rounded-xl md:border md:px-4 md:shadow-xl">
            <div className="grid grid-cols-4 gap-2">
              {['', ...categories].map((cat: string) => (
                <button
                  key={cat || 'all'}
                  onClick={() => selectCategory(cat)}
                  className={optionChipClass(activeCategory === cat)}
                >
                  {cat || '全部'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {searchQuery && (
        <p className="mt-4 text-xs text-muted-foreground md:mt-6">搜索「{searchQuery}」的结果</p>
      )}

      {/* 加载中 */}
      <div className="pt-6 md:pt-10">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pine-200 border-t-pine-700"></div>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        ) : posts.length > 0 ? (
          /* 帖子列表 */
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-1">
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* 空状态 */
          <EmptyState
            icon={MessagesSquare}
            title={
              activeCategory
                ? '该分类下暂无帖子'
                : searchQuery
                  ? `没有找到与 '${searchQuery}' 相关的帖子`
                  : '还没有帖子'
            }
            description={
              activeCategory || searchQuery
                ? '试试换个关键词或分类'
                : '成为第一个分享山野故事的人'
            }
            action={
              isLoggedIn ? (
                <Link
                  to="/publish"
                  className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
                >
                  立即发帖
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
                >
                  登录后发帖
                </Link>
              )
            }
          />
        )}

        {/* 加载更多 */}
        {hasMore && !loading && (
          <div className="mt-10 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-lg border border-border bg-card px-4 py-2 md:px-8 md:py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-pine-300 hover:text-ink disabled:opacity-50"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPage;
