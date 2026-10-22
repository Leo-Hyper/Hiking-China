import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getUserById, listComments } from '@client/src/data/hiking-store';
import { UserAvatar } from '@client/src/components/ui/user-avatar';

// 异步评论数：不阻塞卡片主渲染，加载完成后就地更新
export function CommentCount({ postId, count: providedCount, className = '' }: { postId: number; count?: number; className?: string }) {
  const [count, setCount] = useState<number>(providedCount ?? 0);

  useEffect(() => {
    if (providedCount !== undefined) {
      setCount(providedCount);
      return undefined;
    }
    let mounted = true;
    listComments(postId)
      .then((comments) => {
        if (mounted) setCount(comments.length);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [postId, providedCount]);

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <MessageSquare size={11} />
      {count}
    </span>
  );
}

// 异步作者头像链接：不阻塞卡片主渲染
export function AuthorLink({ userId, name, avatar: providedAvatar }: { userId: number; name: string; avatar?: string }) {
  const [avatar, setAvatar] = useState<string | undefined>(providedAvatar);

  useEffect(() => {
    if (providedAvatar !== undefined) {
      setAvatar(providedAvatar);
      return undefined;
    }
    let mounted = true;
    getUserById(userId)
      .then((user) => {
        if (mounted) setAvatar(user?.avatar);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [userId, providedAvatar]);

  return (
    <Link
      to={`/user/${userId}`}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
      className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-pine-700"
    >
      <UserAvatar
        src={avatar}
        name={name}
        className="h-4 w-4"
        fallbackClassName="text-[8px]"
      />
      <span className="truncate">{name}</span>
    </Link>
  );
}
