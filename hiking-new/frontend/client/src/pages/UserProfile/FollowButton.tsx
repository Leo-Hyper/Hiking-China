import { useEffect, useState } from 'react';
import { useAuth } from '@client/src/hooks/use-hiking';
import { isFollowing, toggleFollow } from '@client/src/data/hiking-store';
import { toast } from 'sonner';

interface FollowButtonProps {
  userId: number;
}

const FollowButton = ({ userId }: FollowButtonProps) => {
  const { isLoggedIn, user } = useAuth();
  const [following, setFollowing] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoggedIn || !user || user.id === userId) {
      setFollowing(false);
      return;
    }
    let cancelled = false;
    isFollowing(userId)
      .then((v: boolean) => {
        if (!cancelled) setFollowing(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, isLoggedIn, user]);

  if (!isLoggedIn || !user || user.id === userId) return null;

  const handleToggleFollow = async (): Promise<void> => {
    try {
      const next: boolean = await toggleFollow(userId);
      setFollowing(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      className={`rounded-lg px-4 py-2 md:px-8 md:py-2.5 text-sm font-medium transition-colors ${
        following
          ? 'border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive'
          : 'bg-pine-700 text-paper hover:bg-pine-800'
      }`}
    >
      {following ? '已关注' : '+ 关注'}
    </button>
  );
};

export default FollowButton;
