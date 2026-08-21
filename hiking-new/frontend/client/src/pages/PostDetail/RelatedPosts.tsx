import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { listPosts } from '@client/src/data/hiking-store';
import type { Post } from '@client/src/data/hiking-types';
import { resolveFirstImage } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';
import { AuthorLink, CommentCount } from '@client/src/components/PostStats';
import { useAsyncData } from '@client/src/hooks/use-hiking';

interface RelatedPostsProps {
  currentId: number;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentId }) => {
  const { data: relatedData, loading } = useAsyncData<Post[]>(
    () => listPosts({ limit: 20 }),
    []
  );
  const related: Post[] = useMemo<Post[]>(() => {
    const all: Post[] = loading ? [] : relatedData ?? [];
    return all.filter((p: Post) => p.id !== currentId).slice(0, 4);
  }, [currentId, relatedData, loading]);

  if (loading || related.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="font-display text-lg text-ink md:text-h3">相关推荐</h3>
      <div className="h-px bg-border mt-3 mb-6" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
        {related.map((p: Post) => {
          const author: string = p.authorName || '匿名';
          return (
            <Link key={p.id} to={`/post/${p.id}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={resolveFirstImage(p.imageUrls)}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute left-2 top-2">
                  <TrailTag tone="pine">{p.category}</TrailTag>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-6 font-data text-[10px] text-white">
                  <span className="flex items-center gap-1">
                    <PlayCircle size={12} />
                    {p.views}
                  </span>
                  <CommentCount postId={p.id} />
                </div>
              </div>
              <h4 className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-pine-700">
                {p.title}
              </h4>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {p.authorId ? (
                  <AuthorLink userId={p.authorId} name={author} />
                ) : (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-muted" />
                    <span className="truncate">{author}</span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedPosts;
