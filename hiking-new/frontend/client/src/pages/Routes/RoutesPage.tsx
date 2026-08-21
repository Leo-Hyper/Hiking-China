import { useMemo, useState } from 'react';
import { ChevronDown, Map as MapIcon, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { ROUTES_LIST } from '@client/src/data/hiking-data';
import type { RouteItem } from '@client/src/data/hiking-types';
import RouteCard from '@client/src/components/RouteCard';
import EmptyState from '@client/src/components/visual/EmptyState';

const REGION_ORDER: string[] = ['四川', '云南', '西藏', '新疆', '安徽', '湖南'];

const REGIONS: string[] = [
  ...REGION_ORDER.filter((r: string) => ROUTES_LIST.some((item: RouteItem) => item.region === r)),
  ...Array.from(new Set(ROUTES_LIST.map((item: RouteItem) => item.region))).filter(
    (r: string) => !REGION_ORDER.includes(r)
  ),
];

const DIFFICULTIES: string[] = ['初级', '中级', '高级'];

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
  };

  const resetFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setOpenKey(null);
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {filteredRoutes.map((route: RouteItem) => (
              <RouteCard key={route.id} routeData={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesPage;
