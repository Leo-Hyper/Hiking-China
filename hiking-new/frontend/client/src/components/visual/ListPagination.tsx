import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const MAX_VISIBLE_PAGES = 5;

const ListPagination: React.FC<ListPaginationProps> = ({
  page,
  pageCount,
  total,
  onPageChange,
  className = '',
}) => {
  if (pageCount <= 1) return null;

  const start = Math.max(1, Math.min(page - Math.floor(MAX_VISIBLE_PAGES / 2), pageCount - MAX_VISIBLE_PAGES + 1));
  const end = Math.min(pageCount, start + MAX_VISIBLE_PAGES - 1);
  const pages: number[] = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const goTo = (next: number): void => {
    const safePage = Math.min(pageCount, Math.max(1, next));
    if (safePage !== page) onPageChange(safePage);
  };

  return (
    <nav
      aria-label="列表分页"
      className={`mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 ${className}`}
    >
      <span className="font-data text-[11px] text-muted-foreground">
        共 {total} 条 · 第 {page}/{pageCount} 页
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="上一页"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-pine-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((item: number) => (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => goTo(item)}
            className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 font-data text-xs transition-colors ${
              item === page
                ? 'border-pine-700 bg-pine-700 text-paper'
                : 'border-border bg-card text-muted-foreground hover:border-pine-300 hover:text-ink'
            }`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          aria-label="下一页"
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-pine-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
};

export default ListPagination;
