import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronRight, Search, SearchX, X } from 'lucide-react';
import { useSearch } from '@client/src/hooks/use-search';
import { useIsMobile } from '@client/src/hooks/use-mobile';
import type { HighlightPart } from '@client/src/hooks/use-search';
import type { SearchItem } from '@client/src/data/hiking-types';
import TrailTag from './visual/TrailTag';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const makePanelVariants = (isMobile: boolean): Variants =>
  isMobile
    ? {
        hidden: { y: '-100%' },
        visible: { y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
      }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.55, ease: EASE_OUT_EXPO, delay: 0.05, staggerChildren: 0.07, delayChildren: 0.12 },
        },
      };

const partVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

const Highlighted = ({ parts }: { parts: HighlightPart[] }) => (
  <>
    {parts.map((part: HighlightPart, i: number) =>
      part.hit ? (
        <mark key={i} className="bg-transparent font-semibold text-ember-600">
          {part.text}
        </mark>
      ) : (
        <span key={i}>{part.text}</span>
      )
    )}
  </>
);

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced: boolean = useReducedMotion() ?? false;
  const isMobile: boolean = useIsMobile();
  const { query, setQuery, isSearching, results, groupedResults, highlightParts, clearSearch } = useSearch();

  useEffect(() => {
    if (isOpen) {
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  const hasQueried: boolean = query.trim().length > 0;

  const close = (): void => {
    onClose();
    clearSearch();
  };

  const navigateFirst = (): void => {
    if (results.length > 0) {
      navigate(results[0].route);
      close();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-ink/40 md:bg-ink/55 flex items-start justify-center pt-24 px-4 max-md:pt-0 max-md:px-0"
      initial={{ opacity: prefersReduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.div
        className="bg-paper rounded-xl border border-border w-full max-w-3xl max-h-[60vh] shadow-xl overflow-hidden flex flex-col max-md:max-w-none max-md:max-h-[85vh] max-md:rounded-t-none max-md:rounded-b-2xl max-md:border-x-0 max-md:border-t-0"
        variants={prefersReduced ? undefined : makePanelVariants(isMobile)}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        <motion.div variants={prefersReduced || isMobile ? undefined : partVariants} className="flex items-center gap-3 px-6 py-5 border-b border-border max-md:gap-2.5 max-md:px-4 max-md:py-2.5">
          <Search size={18} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            type="text"
            placeholder="搜索路线、装备、经验..."
            className="flex-1 min-w-0 bg-transparent text-lg outline-none text-ink placeholder:text-muted-foreground/50 max-md:text-base"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Escape') close();
              if (e.key === 'Enter') {
                e.preventDefault();
                navigateFirst();
              }
            }}
          />
          {hasQueried && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              aria-label="清空搜索"
              className="hidden max-md:flex items-center justify-center p-3 -m-1.5 flex-shrink-0"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <X size={12} />
              </span>
            </button>
          )}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-data text-[10px] text-muted-foreground max-md:hidden">
            ESC
          </kbd>
          <button
            onClick={close}
            className="hidden max-md:inline-flex min-h-11 items-center text-sm font-medium text-pine-700 flex-shrink-0"
          >
            取消
          </button>
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : partVariants} className="overflow-y-auto flex-1 p-6 max-md:p-4">
          {hasQueried && !isSearching && results.length === 0 && (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <SearchX size={40} strokeWidth={1.5} className="mb-4 text-border" />
              <p className="text-sm">
                没有找到匹配 "<strong className="text-ink">{query}</strong>" 的结果
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground/70">
                换个关键词试试，或去论坛逛逛
              </p>
            </div>
          )}

          {hasQueried && (
            <>
              {Object.entries(groupedResults).map(([group, items]: [string, SearchItem[]]) => (
                <div key={group} className="mb-6">
                  <h3 className="text-kicker uppercase text-muted-foreground mb-3">
                    {group} ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((item: SearchItem) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={item.route}
                        onClick={close}
                        className="block p-4 rounded-lg border border-border bg-card md:hover:border-pine-300 md:hover:bg-pine-50/50 active:bg-pine-50 transition-colors group cursor-pointer max-md:p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <TrailTag tone="pine">{item.category}</TrailTag>
                              <span className="font-data text-[10px] text-muted-foreground/70 uppercase">
                                {item.type}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-ink group-hover:text-pine-700 transition-colors">
                              <Highlighted parts={highlightParts(item.title)} />
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              <Highlighted parts={highlightParts(item.excerpt)} />
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              {item.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-[4px]"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-border group-hover:text-pine-500 transition-colors flex-shrink-0 mt-1"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {!hasQueried && (
            <div className="flex flex-col items-center py-12 text-muted-foreground/70">
              <p className="text-sm">输入关键词，检索路线、装备与游记</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : partVariants} className="px-6 py-3 border-t border-border text-[10px] text-muted-foreground flex items-center justify-between max-md:hidden">
          <span className="font-data">{results.length} 个结果</span>
          <span>Enter 跳转 · ESC 关闭</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SearchOverlay;
