import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Map as MapIcon, RotateCcw, Scale, SlidersHorizontal, Users } from 'lucide-react';
import { listRoutes } from '@client/src/api';
import { mapRoute } from '@client/src/data/mappers';
import type { RouteItem } from '@client/src/data/hiking-types';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import RouteCard from '@client/src/components/RouteCard';
import ListPagination from '@client/src/components/visual/ListPagination';
import EmptyState from '@client/src/components/visual/EmptyState';
import Seo from '@client/src/components/Seo';

const REGION_ORDER: string[] = ['四川', '云南', '西藏', '新疆', '安徽', '湖南'];

const REGIONS: string[] = REGION_ORDER;

const DIFFICULTIES: string[] = ['初级', '中级', '高级'];
const PAGE_SIZE = 6;

type FilterKey = 'sort' | 'region' | 'difficulty' | 'distance';

interface RouteFilters {
  sort: string;
  region: string;
  difficulty: string;
  distance: string;
}

const DEFAULT_FILTERS: RouteFilters = { sort: 'recommend', region: '', difficulty: '', distance: '' };

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  key: FilterKey;
  title: string;
  cols: number;
  options: FilterOption[];
}

const SORT_OPTIONS: FilterOption[] = [
  { value: 'recommend', label: '综合排序' },
  { value: 'rating', label: '评分最高' },
  { value: 'distanceAsc', label: '距离短优先' },
  { value: 'distanceDesc', label: '距离长优先' },
];

const DISTANCE_OPTIONS: FilterOption[] = [
  { value: '', label: '全部' },
  { value: 'short', label: '10km内 轻装' },
  { value: 'medium', label: '10-20km 进阶' },
  { value: 'long', label: '20km+ 挑战' },
];

const FILTER_GROUPS: FilterGroup[] = [
  { key: 'sort', title: '综合排序', cols: 2, options: SORT_OPTIONS },
  {
    key: 'region',
    title: '地区',
    cols: 4,
    options: [{ value: '', label: '全部' }, ...REGIONS.map((r: string) => ({ value: r, label: r }))],
  },
  {
    key: 'difficulty',
    title: '难度',
    cols: 4,
    options: [{ value: '', label: '全部' }, ...DIFFICULTIES.map((d: string) => ({ value: d, label: d }))],
  },
  { key: 'distance', title: '距离', cols: 2, options: DISTANCE_OPTIONS },
];

const optionChipClass = (active: boolean): string =>
  `flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
    active
      ? 'bg-pine-700 font-medium text-paper shadow-2xs'
      : 'bg-muted/60 text-ink/80 hover:bg-pine-50 hover:text-pine-700'
  }`;

const difficultyRank = (difficulty: string): number => {
  if (difficulty === '高级') return 3;
  if (difficulty === '中级') return 2;
  return 1;
};

const RoutesPage = () => {
  const [filters, setFilters] = useState<RouteFilters>(DEFAULT_FILTERS);
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const [page, setPage] = useState<number>(1);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const { data, loading, error, reload } = useAsyncData<RouteItem[]>(
    async () => {
      const result = await listRoutes();
      return result.routes.map(mapRoute);
    },
    []
  );
  const routes: RouteItem[] = data ?? [];

  const filteredRoutes: RouteItem[] = useMemo(() => {
    const list: RouteItem[] = routes.filter((r: RouteItem) => {
      if (filters.region && r.region !== filters.region) return false;
      if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
      if (filters.distance === 'short' && r.distance >= 10) return false;
      if (filters.distance === 'medium' && (r.distance < 10 || r.distance > 20)) return false;
      if (filters.distance === 'long' && r.distance <= 20) return false;
      return true;
    });
    if (filters.sort === 'rating') list.sort((a: RouteItem, b: RouteItem) => b.rating - a.rating);
    if (filters.sort === 'distanceAsc') list.sort((a: RouteItem, b: RouteItem) => a.distance - b.distance);
    if (filters.sort === 'distanceDesc') list.sort((a: RouteItem, b: RouteItem) => b.distance - a.distance);
    return list;
  }, [filters, routes]);

  useEffect(() => {
    setCompareIds((prev: number[]) => {
      const next = prev.filter((id: number) => filteredRoutes.some((route: RouteItem) => route.id === id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredRoutes]);

  const comparisonRoutes: RouteItem[] = compareIds
    .map((id: number) => filteredRoutes.find((route: RouteItem) => route.id === id))
    .filter((route): route is RouteItem => Boolean(route));
  const comparisonReady: boolean = comparisonRoutes.length === 2;
  const easierRoute: RouteItem | undefined = comparisonReady
    ? [...comparisonRoutes].sort(
        (a: RouteItem, b: RouteItem) =>
          difficultyRank(a.difficulty) - difficultyRank(b.difficulty) || a.distance - b.distance
      )[0]
    : undefined;
  const higherRatedRoute: RouteItem | undefined = comparisonReady
    ? [...comparisonRoutes].sort(
        (a: RouteItem, b: RouteItem) =>
          b.rating - a.rating || difficultyRank(a.difficulty) - difficultyRank(b.difficulty)
      )[0]
    : undefined;
  const pageCount: number = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));
  const pagedRoutes: RouteItem[] = filteredRoutes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActive: boolean =
    filters.region !== '' || filters.difficulty !== '' || filters.distance !== '' || filters.sort !== 'recommend';

  const isActive = (key: FilterKey): boolean => filters[key] !== DEFAULT_FILTERS[key];

  const triggerLabel = (key: FilterKey, title: string): string => {
    if (!isActive(key)) return title;
    const group = FILTER_GROUPS.find((g) => g.key === key);
    return group?.options.find((o: FilterOption) => o.value === filters[key])?.label ?? title;
  };

  const selectOption = (key: FilterKey, value: string): void => {
    setFilters((prev: RouteFilters) => ({ ...prev, [key]: value }));
    setOpenKey(null);
    setPage(1);
  };

  const resetFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setOpenKey(null);
    setPage(1);
  };

  const toggleCompare = (routeId: number): void => {
    setCompareIds((prev: number[]) => {
      if (prev.includes(routeId)) return prev.filter((id: number) => id !== routeId);
      if (prev.length >= 2) return prev;
      return [...prev, routeId];
    });
  };

  const handleCompareHeaderClick = (): void => {
    if (comparisonRoutes.length > 0) {
      setCompareIds([]);
      return;
    }
    document.getElementById('route-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openGroup = FILTER_GROUPS.find((g) => g.key === openKey);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <Seo
        title="徒步路线"
        description="按地区、难度和距离探索中国经典徒步路线。"
        path="/routes"
      />
      {/* 页头 */}
      <div className="mb-8 md:mb-12">
        <p className="text-kicker uppercase text-ember-600">Routes · Trail Map</p>
        <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">徒步路线</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          从中国的最北端到最西南，探索每一条被大自然眷顾的路径
        </p>
      </div>

      {/* 筛选栏：吸顶单行触发器 + 下挂选项面板 */}
      <div className="sticky top-11 z-30 -mx-6 bg-paper/95 px-6 backdrop-blur md:top-20 md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        {openKey && (
          <button
            aria-label="收起筛选"
            className="fixed inset-0 -z-10 cursor-default bg-ink/20"
            onClick={() => setOpenKey(null)}
          />
        )}
        <div className="flex h-11 items-center gap-1 overflow-x-auto border-b border-border/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-12 md:rounded-xl md:border md:border-border md:bg-card md:px-2 md:shadow-2xs">
          <SlidersHorizontal size={14} className="mr-1 shrink-0 text-muted-foreground" />
          {FILTER_GROUPS.map((group) => (
            <button
              key={group.key}
              onClick={() => setOpenKey((prev: FilterKey | null) => (prev === group.key ? null : group.key))}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[13px] transition-colors ${
                openKey === group.key
                  ? 'bg-pine-700 font-medium text-paper'
                  : isActive(group.key)
                    ? 'bg-pine-50 font-medium text-pine-700'
                    : 'text-ink/80 hover:bg-muted hover:text-ink'
              }`}
            >
              {triggerLabel(group.key, group.title)}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${openKey === group.key ? 'rotate-180' : ''}`}
              />
            </button>
          ))}
          {hasActive && (
            <button
              onClick={resetFilters}
              className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-ink"
            >
              <RotateCcw size={13} />
              重置
            </button>
          )}
        </div>
        {openGroup && (
          <div className="absolute inset-x-0 top-full border-b border-border bg-paper px-6 py-4 shadow-lg md:top-[calc(100%+4px)] md:rounded-xl md:border md:px-4 md:shadow-xl">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${openGroup.cols}, minmax(0, 1fr))` }}
            >
              {openGroup.options.map((option: FilterOption) => (
                <button
                  key={option.value}
                  onClick={() => selectOption(openGroup.key, option.value)}
                  className={optionChipClass(filters[openGroup.key] === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 路线网格 */}
      <div className="pt-6 md:pt-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index: number) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[16/10] rounded-lg bg-muted" />
                <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={MapIcon}
            title="路线加载失败"
            description={error}
            action={
              <button
                onClick={reload}
                className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
              >
                重新加载
              </button>
            }
          />
        ) : filteredRoutes.length === 0 ? (
          <EmptyState
            icon={MapIcon}
            title="没有符合条件的路线"
            description="试试调整筛选条件"
            action={
              <button
                onClick={resetFilters}
                className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
              >
                重置筛选
              </button>
            }
          />
        ) : (
          <>
            {filteredRoutes.length > 0 && (
              <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
                  <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <Scale size={16} className="shrink-0 text-pine-700" />
                      <h2 className="font-display text-lg text-ink">路线对比</h2>
                      <span className="font-data text-[10px] tabular-nums text-muted-foreground">
                        {comparisonRoutes.length}/2
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCompareHeaderClick}
                      className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold text-pine-700 transition-colors hover:bg-pine-50 hover:text-pine-800"
                    >
                      {comparisonRoutes.length > 0 ? '清空对比' : '加入对比'}
                    </button>
                  </div>
                  {comparisonRoutes.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm font-medium text-ink">选择两条路线开始对比</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        点击路线卡片右上角的“对比”按钮，最多选择 2 条。
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 p-4 sm:grid-cols-2">
                        {comparisonRoutes.map((route: RouteItem, index: number) => (
                          <article
                            key={route.id}
                            className="rounded-lg border border-border/70 bg-muted/30 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-pine-50 font-data text-xs font-bold text-pine-700">
                                {index === 0 ? 'A' : 'B'}
                              </span>
                              <button
                                type="button"
                                aria-label={`移出${route.name}对比`}
                                onClick={() => toggleCompare(route.id)}
                                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-paper hover:text-ink"
                              >
                                ×
                              </button>
                            </div>
                            <h3 className="mt-3 line-clamp-2 font-display text-base leading-snug text-ink">
                              {route.name}
                            </h3>
                            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
                              <div>
                                <dt className="text-muted-foreground">地区</dt>
                                <dd className="mt-1 font-medium text-ink">{route.region}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">难度</dt>
                                <dd className="mt-1 font-medium text-ink">{route.difficulty}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">距离</dt>
                                <dd className="mt-1 font-data tabular-nums font-medium text-ink">
                                  {route.distance}km
                                </dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">耗时</dt>
                                <dd className="mt-1 font-medium text-ink">{route.duration}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">评分</dt>
                                <dd className="mt-1 font-data tabular-nums font-medium text-ink">
                                  {route.rating.toFixed(1)}
                                </dd>
                              </div>
                            </dl>
                          </article>
                        ))}
                      </div>
                      {comparisonReady && easierRoute && higherRatedRoute && (
                        <div className="space-y-1 border-t border-border px-5 py-4 text-xs">
                          <p className="text-muted-foreground">
                            更易上手：<strong className="font-medium text-ink">{easierRoute.name}</strong>
                            <span className="font-data tabular-nums"> · {easierRoute.difficulty} · {easierRoute.distance}km</span>
                          </p>
                          <p className="text-muted-foreground">
                            评分更高：<strong className="font-medium text-ink">{higherRatedRoute.name}</strong>
                            <span className="font-data tabular-nums"> · {higherRatedRoute.rating.toFixed(1)} 分</span>
                          </p>
                        </div>
                      )}
                      {!comparisonReady && (
                        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                          再选择一条路线即可查看对比结论。
                        </div>
                      )}
                    </>
                  )}
                </div>

                <aside className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ember-600">
                      <Users size={16} />
                      近期结伴
                    </p>
                    <h3 className="mt-4 font-body text-xl text-ink">
                      已有 <span className="font-data tabular-nums">6</span> 人寻找同行者
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      按日期、路线和集合地点匹配，减少私聊确认成本。
                    </p>
                  </div>
                  <Link
                    to="/forum?q=结伴"
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-pine-700 px-5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800"
                  >
                    查看结伴
                  </Link>
                </aside>
              </section>
            )}

            <div
              id="route-grid"
              className="grid scroll-mt-28 grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 md:scroll-mt-36"
            >
              {pagedRoutes.map((route: RouteItem) => (
                <RouteCard
                  key={route.id}
                  routeData={route}
                  compareSelected={compareIds.includes(route.id)}
                  compareDisabled={compareIds.length >= 2 && !compareIds.includes(route.id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>

            <ListPagination
              page={page}
              pageCount={pageCount}
              total={filteredRoutes.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RoutesPage;
