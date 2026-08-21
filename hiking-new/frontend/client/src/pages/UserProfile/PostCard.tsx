import { Link } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { PlayCircle } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';
import { CommentCount } from '@client/src/components/PostStats';

export interface FormattedPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  authorId?: number;
  date: string;
  category: string;
  image: string;
  images: string[];
  tags: string[];
  views: number;
}

interface PostCardProps {
  post: FormattedPost;
}

const PostCard = ({ post }: PostCardProps) => {
  const handleAuthorClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.stopPropagation();
  };

  return (
    <Link to={`/post/${post.id}`} className="group block @container">
      <article className="@md:flex @md:items-center @md:gap-5">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted @md:aspect-auto @md:h-36 @md:w-48">
          <Image
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-6 font-data text-[10px] text-white @md:hidden">
            <span className="flex items-center gap-1">
              <PlayCircle size={12} />
              {post.views}
            </span>
            <CommentCount postId={post.id} />
          </div>
        </div>

        <div className="mt-2 min-w-0 flex-1 @md:mt-0">
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-pine-700 @md:line-clamp-1 @md:text-base @md:font-semibold">
            {post.title}
          </h3>
          <p className="mt-1.5 hidden text-sm leading-relaxed text-muted-foreground line-clamp-2 @md:block">
            {post.excerpt}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground @md:mt-2">
            {post.authorId ? (
              <Link
                to={`/user/${post.authorId}`}
                onClick={handleAuthorClick}
                className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-pine-700"
              >
                <span className="h-4 w-4 shrink-0 rounded-full bg-pine-600" />
                <span className="truncate">{post.author}</span>
              </Link>
            ) : (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-4 w-4 shrink-0 rounded-full bg-muted" />
                <span className="truncate">{post.author}</span>
              </span>
            )}
            <span className="ml-auto hidden shrink-0 items-center gap-2 @md:flex">
              <TrailTag tone="pine">{post.category}</TrailTag>
              <span>{post.date}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default PostCard;
