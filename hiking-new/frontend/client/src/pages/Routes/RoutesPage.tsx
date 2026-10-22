import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Map as MapIcon, RotateCcw, SlidersHorizontal, Users } from 'lucide-react';
import { ROUTES_LIST } from '@client/src/data/hiking-data';
import type { RouteItem } from '@client/src/data/hiking-types';
import RouteCard from '@client/src/components/RouteCard';
import ListPagination from '@client/src/components/visual/ListPagination';
import EmptyState from '@client/src/components/visual/EmptyState';

const REGION_ORDER: string[] = ['四川', '云南', '西藏', '新疆', '安徽', '湖南'];

const REGIONS: string[] = [
  ...REGION_ORDER.filter((r: string) => ROUTES_LIST.some((item: RouteItem) => item.region === r)),
  ...Array.from(new Set(ROUTES_LIST.map((item: RouteItem) => item.region))).filter(
    (r: string) => !REGION_ORDER.includes(r)
  ),
];

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

const RoutesPage = () => {
  const [filters, setFilters] = useState<RouteFilters>(DEFAULT_FILTERS);
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const [page, setPage] = useState<number>(1);

  const filteredRoutes: RouteItem[] = useMemo(() => {
    const list: RouteItem[] = ROUTES_LIST.filter((r: RouteItem) => {
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
  }, [filters]);

  const comparisonRoutes: RouteItem[] = filteredRoutes.slice(0, 2);
  const easierRoute: RouteItem | undefined = comparisonRoutes[1] || comparisonRoutes[0];
  const scenicRoute: RouteItem | undefined = comparisonRoutes[0] || comparisonRoutes[1];
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

  const openGroup = FILTER_GROUPS.find((g) => g.key === openKey);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
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
        {filteredRoutes.length === 0 ? (
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
            {easierRoute && scenicRoute && (
              <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="font-display text-lg text-ink">路线对比建议</h2>
                    <span className="text-sm font-semibold text-pine-700">加入对比</span>
                  </div>
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-pine-50 font-data text-sm font-bold text-pine-700">A</span>
                      <div className="min-w-0">
                        <strong className="text-sm text-ink">体能门槛：{easierRoute.name}更温和</strong>
                        <p className="mt-1 text-xs text-muted-foreground">累计爬升低约 280m</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">推荐</span>
                    </div>
                    <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-pine-50 font-data text-sm font-bold text-pine-700">B</span>
                      <div className="min-w-0">
                        <strong className="text-sm text-ink">景观完整度：{scenicRoute.name}更高</strong>
                        <p className="mt-1 text-xs text-muted-foreground">雪山、草甸、日照金山</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">高分</span>
                    </div>
                  </div>
                </div>

                <aside className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ember-600">
                      <Users size={16} />
                      近期结伴
                    </p>
                    <h3 className="mt-4 font-display text-xl text-ink">已有 6 人寻找同行者</h3>
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

            <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {pagedRoutes.map((route: RouteItem) => (
                <RouteCard key={route.id} routeData={route} />
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
