import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import type { Post } from '@client/src/data/hiking-types';
import { stripHtml, withCardImage } from '@client/src/utils/base-path';
import MediaFrame from '@client/src/components/MediaFrame';
import TrailTag from '@client/src/components/visual/TrailTag';
import { AuthorLink, CommentCount } from '@client/src/components/PostStats';

interface ForumPostRowProps {
  post: Post;
}

const ForumPostRow = ({ post }: ForumPostRowProps) => {
  const plainText: string = stripHtml(post.content || '');
  const excerpt: string = plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');
  const image: string = withCardImage(post.imageUrls?.[0] || '/img/徒步装备.avif');

  return (
    <Link
      to={`/post/${post.id}`}
      className="group grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-border py-4 transition-colors last:border-b-0 hover:bg-pine-50/35 md:grid-cols-[150px_minmax(0,1fr)] md:gap-5 md:px-3"
    >
      <MediaFrame
        src={image}
        alt={post.title}
        ratioClassName="aspect-[4/3]"
        className="rounded-lg"
        position="center 42%"
        imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <TrailTag tone="neutral">{post.category}</TrailTag>
          <span className="font-data text-[10px] text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <h3 className="line-clamp-2 font-display text-sm leading-snug text-ink transition-colors group-hover:text-pine-700 md:text-lg">
          {post.title}
        </h3>
        <p className="mt-1.5 hidden text-xs leading-relaxed text-muted-foreground line-clamp-2 md:block">
          {excerpt}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          {post.authorId ? (
            <AuthorLink userId={post.authorId} name={post.authorName} avatar={post.authorAvatar} />
          ) : (
            <span>{post.authorName || '匿名'}</span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Eye size={12} />
            {post.views}
          </span>
          <CommentCount postId={post.id} count={post.commentCount} />
        </div>
      </div>
    </Link>
  );
};

export default ForumPostRow;
