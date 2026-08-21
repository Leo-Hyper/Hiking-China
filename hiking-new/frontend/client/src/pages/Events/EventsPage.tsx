import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  isEventSignedUp,
  listEvents,
  toggleEventSignup,
} from '@client/src/data/hiking-store';
import type { HikingEvent } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import EmptyState from '@client/src/components/visual/EmptyState';
import EventCard, { isEventEnded } from './EventCard';
import { toast } from 'sonner';

type EventFilterKey = 'status' | 'difficulty' | 'location' | 'sort';

interface EventFilters {
  status: string;
  difficulty: string;
  location: string;
  sort: string;
}

const DEFAULT_FILTERS: EventFilters = { status: '', difficulty: '', location: '', sort: 'overall' };

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  key: EventFilterKey;
  title: string;
  cols: number;
  options: FilterOption[];
}

const optionChipClass = (active: boolean): string =>
  `flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
    active
      ? 'bg-pine-700 font-medium text-paper shadow-2xs'
      : 'bg-muted/60 text-ink/80 hover:bg-pine-50 hover:text-pine-700'
  }`;

type EventTab = 'all' | 'mine';

const tabClass = (active: boolean): string =>
  `rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
    active
      ? 'bg-pine-700 text-paper shadow-2xs'
      : 'bg-muted/60 text-ink/80 hover:bg-pine-50 hover:text-pine-700'
  }`;

const EventsPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { data: eventsData, loading } = useAsyncData<HikingEvent[]>(() => listEvents(), [isLoggedIn]);
  const events: HikingEvent[] = useMemo(() => eventsData ?? [], [eventsData]);
  const [signedUpMap, setSignedUpMap] = useState<Record<number, boolean>>({});

  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [openKey, setOpenKey] = useState<EventFilterKey | null>(null);
  const [tab, setTab] = useState<EventTab>('all');

  // 批量拉取已报名状态（仅登录时）
  useEffect(() => {
    if (!isLoggedIn) {
      setSignedUpMap({});
      return;
    }
    let cancelled = false;
    Promise.all(
      events.map((e: HikingEvent) =>
        isEventSignedUp(e.id).then((v: boolean) => [e.id, v] as const)
      )
    )
      .then((pairs) => {
        if (!cancelled) setSignedUpMap(Object.fromEntries(pairs));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [events, isLoggedIn]);

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'status',
        title: '状态',
        cols: 4,
        options: [
          { value: '', label: '全部' },
          { value: 'upcoming', label: '报名中' },
          { value: 'ended', label: '已结束' },
        ],
      },
      {
        key: 'difficulty',
        title: '难度',
        cols: 4,
        options: [
          { value: '', label: '全部' },
          { value: '初级', label: '初级' },
          { value: '中级', label: '中级' },
          { value: '高级', label: '高级' },
        ],
      },
      {
        key: 'location',
        title: '地区',
        cols: 4,
        options: [
          { value: '', label: '全部' },
          ...Array.from(new Set(events.map((e: HikingEvent) => e.location))).map(
            (loc: string) => ({ value: loc, label: loc })
          ),
        ],
      },
      {
        key: 'sort',
        title: '综合排序',
        cols: 2,
        options: [
          { value: 'overall', label: '综合排序' },
          { value: 'recent', label: '时间最近' },
          { value: 'popular', label: '热度优先' },
        ],
      },
    ],
    [events]
  );

  const filteredEvents: HikingEvent[] = useMemo(() => {
    const list: HikingEvent[] = events.filter((e: HikingEvent) => {
      if (filters.status === 'upcoming' && isEventEnded(e.eventDate)) return false;
      if (filters.status === 'ended' && !isEventEnded(e.eventDate)) return false;
      if (filters.difficulty && e.difficulty !== filters.difficulty) return false;
      if (filters.location && e.location !== filters.location) return false;
      return true;
    });
    if (filters.sort === 'recent') {
      list.sort((a: HikingEvent, b: HikingEvent) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    }
    if (filters.sort === 'popular') {
      list.sort((a: HikingEvent, b: HikingEvent) => b.participants - a.participants);
    }
    return list;
  }, [events, filters]);

  const visibleEvents: HikingEvent[] = useMemo(
    () =>
      tab === 'mine'
        ? filteredEvents.filter((e: HikingEvent) => signedUpMap[e.id])
        : filteredEvents,
    [filteredEvents, tab, signedUpMap]
  );

  const hasActive: boolean =
    filters.status !== '' || filters.difficulty !== '' || filters.location !== '' || filters.sort !== 'overall';

  const isActive = (key: EventFilterKey): boolean => filters[key] !== DEFAULT_FILTERS[key];

  const triggerLabel = (key: EventFilterKey, title: string): string => {
    if (!isActive(key)) return title;
    const group = filterGroups.find((g) => g.key === key);
    return group?.options.find((o: FilterOption) => o.value === filters[key])?.label ?? title;
  };

  const selectOption = (key: EventFilterKey, value: string): void => {
    setFilters((prev: EventFilters) => ({ ...prev, [key]: value }));
    setOpenKey(null);
  };

  const resetFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setOpenKey(null);
  };

  const handleSignup = async (event: HikingEvent): Promise<void> => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      const next: boolean = await toggleEventSignup(event.id);
      setSignedUpMap((prev: Record<number, boolean>) => ({ ...prev, [event.id]: next }));
      toast.success(next ? '报名成功' : '已取消报名');
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败，请重试');
    }
  };

  const openGroup = filterGroups.find((g) => g.key === openKey);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* 页头 */}
      <div className="mb-8 md:mb-12">
        <p className="text-kicker uppercase text-ember-600">Events · Trail Meetups</p>
        <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">活动召集</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">参加线下徒步活动，结识志同道合的朋友</p>
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
          {filterGroups.map((group) => (
            <button
              key={group.key}
              onClick={() => setOpenKey((prev: EventFilterKey | null) => (prev === group.key ? null : group.key))}
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
          <span className="ml-auto shrink-0 font-data text-[11px] text-muted-foreground">
            共 {filteredEvents.length} 场
          </span>
          {hasActive && (
            <button
              onClick={resetFilters}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-ink"
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

      {/* 分段切换 */}
      <div className="flex items-center gap-2 pt-6 md:pt-10">
        <button onClick={() => setTab('all')} className={tabClass(tab === 'all')}>
          全部活动
        </button>
        <button onClick={() => setTab('mine')} className={tabClass(tab === 'mine')}>
          我的报名
        </button>
      </div>

      {/* 活动列表 */}
      <div className="max-w-4xl space-y-4 pt-4 md:pt-6">
        {loading ? (
          <div className="space-y-4 pt-4">
            {[0, 1, 2].map((i: number) => (
              <div key={i} className="animate-pulse rounded-xl bg-muted h-40" />
            ))}
          </div>
        ) : visibleEvents.length === 0 &&
          (tab === 'mine' ? (
            <EmptyState
              icon={CalendarDays}
              title="还没有报名的活动"
              description="去全部活动里看看，找到感兴趣的路线"
              action={
                <button
                  onClick={() => setTab('all')}
                  className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
                >
                  浏览全部活动
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={events.length === 0 ? '暂无活动' : '没有符合条件的活动'}
              description={events.length === 0 ? '目前没有召集中的活动，去发起一场徒步聚会吧' : '试试调整筛选条件'}
              action={
                events.length === 0 ? (
                  <Link
                    to="/publish-event"
                    className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
                  >
                    发起活动
                  </Link>
                ) : hasActive ? (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
                  >
                    重置筛选
                  </button>
                ) : undefined
              }
            />
          ))}
        {visibleEvents.map((event: HikingEvent) => (
          <EventCard
            key={event.id}
            event={event}
            signedUp={signedUpMap[event.id] ?? false}
            onSignup={handleSignup}
          />
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
