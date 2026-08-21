import { useEffect, useMemo, useRef, useState } from 'react';
import { SEARCH_INDEX } from '@client/src/data/hiking-data';
import type { SearchItem } from '@client/src/data/hiking-types';
import * as api from '@client/src/api';

export interface HighlightPart {
  text: string;
  hit: boolean;
}

function toSearchItem(r: api.SearchResult): SearchItem {
  return {
    id: r.id,
    type: 'post',
    title: r.title,
    category: r.category,
    date: (r.created_at || '').split('T')[0],
    author: r.author || '',
    tags: r.tags || [],
    excerpt: r.excerpt || '',
    route: r.route || `/post/${r.id}`,
  };
}

function scoreResult(item: SearchItem, tokens: string[]): number {
  if (!tokens.length) return 0;
  let score = 0;
  const searchable: string = [item.title, item.category, item.excerpt, item.tags.join(' ')]
    .join(' ')
    .toLowerCase();
  for (const token of tokens) {
    if (item.title.toLowerCase().includes(token)) score += 10;
    if (item.category.toLowerCase().includes(token)) score += 5;
    if (item.tags.some((t: string) => t.includes(token))) score += 5;
    if (searchable.includes(token)) score += 2;
  }
  return score;
}

export function useSearch() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      const tokens: string[] = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const apiItems: SearchItem[] = await api
        .search(query.trim())
        .then((res: { results: api.SearchResult[] }) => (res.results || []).map(toSearchItem))
        .catch(() => [] as SearchItem[]);
      if (cancelled) return;
      const apiIds: Set<number> = new Set(apiItems.map((i: SearchItem) => i.id));
      const staticItems: SearchItem[] = SEARCH_INDEX.filter((item: SearchItem) => !apiIds.has(item.id));
      const matched: SearchItem[] = [
        ...apiItems,
        ...staticItems
          .map((item: SearchItem) => ({ item, score: scoreResult(item, tokens) }))
          .filter((entry: { score: number }) => entry.score > 0)
          .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
          .map((entry: { item: SearchItem }) => entry.item),
      ];
      setResults(matched);
      setIsSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      const timer: ReturnType<typeof setTimeout> | null = timerRef.current;
      timerRef.current = null;
      if (timer) clearTimeout(timer);
    };
  }, [query]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    results.forEach((r: SearchItem) => {
      const typeLabel: string =
        { post: '帖子详情', forum: '论坛帖子', gear: '装备', route: '路线' }[r.type] || r.type;
      if (!groups[typeLabel]) groups[typeLabel] = [];
      groups[typeLabel].push(r);
    });
    return groups;
  }, [results]);

  function highlightParts(text: string): HighlightPart[] {
    if (!query.trim()) return [{ text, hit: false }];
    const escaped: string = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts: string[] = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts
      .filter((part: string) => part.length > 0)
      .map((part: string) => ({ text: part, hit: part.toLowerCase() === query.trim().toLowerCase() }));
  }

  function clearSearch(): void {
    setQuery('');
    setResults([]);
    setIsSearching(false);
  }

  return { query, setQuery, isSearching, results, groupedResults, highlightParts, clearSearch };
}
