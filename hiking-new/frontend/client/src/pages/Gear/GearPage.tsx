import { useMemo, useState } from 'react';
import { Backpack, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { GEAR_ITEMS } from '@client/src/data/hiking-data';
import type { GearItem } from '@client/src/data/hiking-types';
import { withCardImage } from '@client/src/utils/base-path';
import MediaFrame from '@client/src/components/MediaFrame';
import TrailTag from '@client/src/components/visual/TrailTag';
import ListPagination from '@client/src/components/visual/ListPagination';
import EmptyState from '@client/src/components/visual/EmptyState';
import Seo from '@client/src/components/Seo';

const PAGE_SIZE = 4;

const GEAR_GUIDES: {
  title: string;
  routeType: string;
  season: string;
  budget: string;
  weight: string;
  items: string[];
}[] = [
  {
    title: '周末轻装',
    routeType: '10-20km · 1天',
    season: '春秋',
    budget: '轻预算',
    weight: '5-7kg',
    items: ['轻量背包', '防滑徒步鞋', '防风外层', '1.5L 水具'],
  },
  {
    title: '三天两夜',
    routeType: '2-3天 · 住宿补给',
    season: '三季',
    budget: '均衡',
    weight: '9-12kg',
    items: ['38-50L 背包', '睡眠系统', '炊具', '头灯与急救包'],
  },
  {
    title: '高海拔雪线',
    routeType: '雪山 · 长线',
    season: '冬季',
    budget: '安全优先',
    weight: '12kg+',
    items: ['保暖分层', '雪镜与冰爪', '卫星通信', '备用电源'],
  },
];

const optionChipClass = (active: boolean): string =>
  `flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
    active
      ? 'bg-pine-700 font-medium text-paper shadow-2xs'
      : 'bg-muted/60 text-ink/80 hover:bg-pine-50 hover:text-pine-700'
  }`;

const GearPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const gearCategories: string[] = useMemo(
    () => Array.from(new Set(GEAR_ITEMS.map((item: GearItem) => item.category))),
    []
  );

  const categoryOptions: { value: string; label: string }[] = useMemo(
    () => [{ value: '', label: '全部' }, ...gearCategories.map((cat: string) => ({ value: cat, label: cat }))],
    [gearCategories]
  );

  const gearItems: GearItem[] = useMemo(
    () =>
      activeCategory
        ? GEAR_ITEMS.filter((item: GearItem) => item.category === activeCategory)
        : GEAR_ITEMS,
    [activeCategory]
  );
  const pageCount: number = Math.max(1, Math.ceil(gearItems.length / PAGE_SIZE));
  const pagedGearItems: GearItem[] = gearItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectCategory = (value: string): void => {
    setActiveCategory(value);
    setPanelOpen(false);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <Seo
        title="装备指南"
        description="按季节、预算、重量和路线类型整理徒步装备清单。"
        path="/gear"
      />
      {/* 页头 */}
      <div className="mb-8 md:mb-12">
        <p className="text-kicker uppercase text-ember-600">Gear · Field Kit</p>
        <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">装备指南</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">专业的徒步装备推荐与评测，助你轻装上阵</p>
      </div>

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        {GEAR_GUIDES.map((guide) => (
          <article key={guide.title} className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-base text-ink">{guide.title}</h2>
              <TrailTag tone="pine">{guide.weight}</TrailTag>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{guide.routeType}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <TrailTag tone="neutral">{guide.season}</TrailTag>
              <TrailTag tone="neutral">{guide.budget}</TrailTag>
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {guide.items.map((item: string) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-pine-500" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* 筛选栏：吸顶单行触发器 + 下挂选项面板 */}
      <div className="sticky top-11 z-30 -mx-6 bg-paper/95 px-6 backdrop-blur md:top-20 md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        {panelOpen && (
          <button
            aria-label="收起筛选"
            className="fixed inset-0 -z-10 cursor-default bg-ink/20"
            onClick={() => setPanelOpen(false)}
          />
        )}
        <div className="flex h-11 items-center gap-1 overflow-x-auto border-b border-border/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-12 md:rounded-xl md:border md:border-border md:bg-card md:px-2 md:shadow-2xs">
          <SlidersHorizontal size={14} className="mr-1 shrink-0 text-muted-foreground" />
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
          <span className="ml-auto shrink-0 font-data text-[11px] text-muted-foreground">
            共 {gearItems.length} 件
          </span>
          {activeCategory && (
            <button
              onClick={() => selectCategory('')}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-ink"
            >
              <RotateCcw size={13} />
              重置
            </button>
          )}
        </div>
        {panelOpen && (
          <div className="absolute inset-x-0 top-full border-b border-border bg-paper px-6 py-4 shadow-lg md:top-[calc(100%+4px)] md:rounded-xl md:border md:px-4 md:shadow-xl">
            <div className="grid grid-cols-4 gap-2">
              {categoryOptions.map((option: { value: string; label: string }) => (
                <button
                  key={option.value}
                  onClick={() => selectCategory(option.value)}
                  className={optionChipClass(activeCategory === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 装备卡片 */}
      <div className="pt-6 md:pt-10">
        {gearItems.length === 0 ? (
          <EmptyState icon={Backpack} title="暂无装备" description="该分类下还没有装备内容" />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {pagedGearItems.map((item: GearItem) => (
              <div key={item.id} className="group @container">
                <div>
                  <MediaFrame
                    src={withCardImage(item.image)}
                    alt={item.name}
                    ratioClassName="aspect-square"
                    className="w-full rounded-lg"
                    position="center 45%"
                    imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  >
                    <span className="absolute left-1.5 top-1.5">
                      <TrailTag tone="pine">{item.category}</TrailTag>
                    </span>
                  </MediaFrame>
                  <div className="mt-2 min-w-0">
                    <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-pine-700">
                      {item.name}
                    </h3>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <ListPagination
          page={page}
          pageCount={pageCount}
          total={gearItems.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default GearPage;
