import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getUserById, listComments } from '@client/src/data/hiking-store';
import { resolveImageUrl } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';

// 异步评论数：不阻塞卡片主渲染，加载完成后就地更新
export function CommentCount({ postId, className = '' }: { postId: number; className?: string }) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    listComments(postId)
      .then((comments) => {
        if (mounted) setCount(comments.length);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [postId]);

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <MessageSquare size={11} />
      {count}
    </span>
  );
}

// 异步作者头像链接：不阻塞卡片主渲染
export function AuthorLink({ userId, name }: { userId: number; name: string }) {
  const [avatar, setAvatar] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    getUserById(userId)
      .then((user) => {
        if (mounted) setAvatar(user?.avatar);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <Link
      to={`/user/${userId}`}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
      className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-pine-700"
    >
      {avatar ? (
        <Image
          src={resolveImageUrl(avatar)}
          alt=""
          className="h-4 w-4 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full bg-pine-600" />
      )}
      <span className="truncate">{name}</span>
    </Link>
  );
}
