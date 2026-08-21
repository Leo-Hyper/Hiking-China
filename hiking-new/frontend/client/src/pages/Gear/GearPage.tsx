import { useMemo, useState } from 'react';
import { Backpack, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { GEAR_ITEMS } from '@client/src/data/hiking-data';
import type { GearItem } from '@client/src/data/hiking-types';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';
import EmptyState from '@client/src/components/visual/EmptyState';

const optionChipClass = (active: boolean): string =>
  `flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
    active
      ? 'bg-pine-700 font-medium text-paper shadow-2xs'
      : 'bg-muted/60 text-ink/80 hover:bg-pine-50 hover:text-pine-700'
  }`;

const GearPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

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

  const selectCategory = (value: string): void => {
    setActiveCategory(value);
    setPanelOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      {/* 页头 */}
      <div className="mb-8 md:mb-12">
        <p className="text-kicker uppercase text-ember-600">Gear · Field Kit</p>
        <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">装备指南</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">专业的徒步装备推荐与评测，助你轻装上阵</p>
      </div>

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
            {gearItems.map((item: GearItem) => (
              <div key={item.id} className="group @container">
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={withBasePath(item.image)}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <span className="absolute left-1.5 top-1.5">
                      <TrailTag tone="pine">{item.category}</TrailTag>
                    </span>
                  </div>
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
      </div>
    </div>
  );
};

export default GearPage;
