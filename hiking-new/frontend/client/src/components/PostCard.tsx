import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import type { Post } from '@client/src/data/hiking-types';
import { stripHtml, withCardImage } from '@client/src/utils/base-path';
import MediaFrame from '@client/src/components/MediaFrame';
import TrailTag from '@client/src/components/visual/TrailTag';
import { AuthorLink, CommentCount } from '@client/src/components/PostStats';

export interface PostCardProps {
  post: Post;
  isUserPost?: boolean;
}

const PostCard = ({ post }: PostCardProps) => {
  const plainText: string = stripHtml(post.content || '');
  const excerpt: string = plainText.substring(0, 120) + (plainText.length > 120 ? '...' : '');
  const date: string = new Date(post.createdAt).toLocaleDateString('zh-CN');
  const author: string = post.authorName || '匿名';
  const image: string =
    post.imageUrls && post.imageUrls.length > 0
      ? withCardImage(post.imageUrls[0])
      : withCardImage('/img/徒步装备.avif');

  return (
    <Link to={`/post/${post.id}`} className="group block @container">
      <article className="@md:flex @md:items-center @md:gap-5">
        <MediaFrame
          src={image}
          alt={post.title}
          ratioClassName="aspect-[16/10] @md:aspect-auto"
          className="w-full shrink-0 rounded-lg @md:h-40 @md:w-64"
          position="center 42%"
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        >
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-6 font-data text-[10px] text-white @md:hidden">
            <span className="flex items-center gap-1">
              <PlayCircle size={12} />
              {post.views}
            </span>
            <CommentCount postId={post.id} count={post.commentCount} />
          </div>
        </MediaFrame>

        <div className="mt-2 min-w-0 flex-1 @md:mt-0">
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-pine-700 @md:line-clamp-1 @md:font-display @md:text-lg">
            {post.title}
          </h3>
          <p className="mt-1.5 hidden text-sm leading-relaxed text-muted-foreground line-clamp-2 @md:block">
            {excerpt}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground @md:mt-2.5 @md:flex-wrap @md:gap-y-1.5">
            {post.authorId ? (
              <AuthorLink userId={post.authorId} name={author} avatar={post.authorAvatar} />
            ) : (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-4 w-4 shrink-0 rounded-full bg-muted" />
                <span className="truncate">{author}</span>
              </span>
            )}
            <span className="ml-auto hidden shrink-0 items-center gap-2 @md:flex">
              <TrailTag tone="pine">{post.category}</TrailTag>
              <span>{date}</span>
              <span className="flex items-center gap-1">
                <PlayCircle size={12} />
                {post.views}
              </span>
              <CommentCount postId={post.id} count={post.commentCount} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default PostCard;
