import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getPostById,
  getUserById,
  incrementPostViews,
  isBookmarked,
  isFollowing,
  listComments,
  recordView,
  toggleBookmark,
  toggleFollow,
} from '@client/src/data/hiking-store';
import type { GearExtra, Post, RouteExtra } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import { resolveImageUrl } from '@client/src/utils/base-path';
import CommentSection from './CommentSection';
import RelatedPosts from './RelatedPosts';
import RouteMap from './RouteMap';
import { toast } from 'sonner';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';
import EmptyState from '@client/src/components/visual/EmptyState';
import {
  ChevronLeft, Clock, Eye, Gauge, Heart, MapPin, MessageCircle,
  Mountain, Pencil, Route, Share2, Star, Tag, type LucideIcon,
} from 'lucide-react';

const STAT_ICONS: Record<string, LucideIcon> = {
  距离: Route,
  爬升: Mountain,
  耗时: Clock,
  使用时长: Clock,
  起点: MapPin,
  终点: MapPin,
  难度: Gauge,
  品牌: Tag,
  型号: Tag,
  价格: Tag,
};

interface ExtrainfoStatItem {
  label: string;
  value: string;
}

interface ExtrainfoStats {
  title: string;
  items: ExtrainfoStatItem[];
}

interface RouteData {
  coordinates: [number, number][];
  title: string;
  info: RouteExtra;
}

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const postId: number = parseInt(id || '0', 10);

  const { isLoggedIn, user } = useAuth();

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isFavorited, setFavorited] = useState<boolean>(false);
  const [authorFollowed, setAuthorFollowed] = useState<boolean>(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | undefined>();
  const [commentsCount, setCommentsCount] = useState<number>(0);

  const { data: postData, loading } = useAsyncData<Post | undefined>(() => getPostById(postId), [postId]);
  const post: Post | undefined = postData ?? undefined;

  // 记录浏览（后端 GET 已自增 views）+ 本地最近浏览
  useEffect(() => {
    if (post) {
      incrementPostViews(postId);
      recordView(postId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const isAuthor: boolean = !!user && !!post && user.id === post.authorId;

  // 收藏状态
  useEffect(() => {
    if (!isLoggedIn) {
      setFavorited(false);
      return;
    }
    let cancelled = false;
    isBookmarked(postId)
      .then((v: boolean) => {
        if (!cancelled) setFavorited(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId, isLoggedIn]);

  // 关注状态
  useEffect(() => {
    if (!post || !post.authorId || !isLoggedIn || user?.id === post.authorId) {
      setAuthorFollowed(false);
      return;
    }
    let cancelled = false;
    isFollowing(post.authorId)
      .then((v: boolean) => {
        if (!cancelled) setAuthorFollowed(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post, isLoggedIn, user]);

  // 作者头像
  useEffect(() => {
    if (!post?.authorId) {
      setAuthorAvatar(undefined);
      return;
    }
    let cancelled = false;
    getUserById(post.authorId)
      .then((u) => {
        if (!cancelled) setAuthorAvatar(u?.avatar);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post]);

  // 评论数（评论区会再拉一次，这里仅用于头部展示）
  useEffect(() => {
    let cancelled = false;
    listComments(postId)
      .then((cs) => {
        if (!cancelled) setCommentsCount(cs.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const date: string = post ? new Date(post.createdAt).toLocaleDateString('zh-CN') : '';

  // 点赞（本地状态，源码语义）
  const toggleLike = (): void => {
    if (!isLoggedIn) { toast('请先登录'); return; }
    const nextLiked: boolean = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((c: number) => c + (nextLiked ? 1 : -1));
  };

  // 收藏
  const toggleFavorite = async (): Promise<void> => {
    if (!isLoggedIn) { toast('请先登录'); return; }
    try {
      const next: boolean = await toggleBookmark(postId);
      setFavorited(next);
    } catch (e) {
      toast((e as Error).message || '请先登录');
    }
  };

  // 关注作者
  const handleFollowAuthor = async (): Promise<void> => {
    if (!post) return;
    try {
      const next: boolean = await toggleFollow(post.authorId);
      setAuthorFollowed(next);
    } catch (e) {
      toast((e as Error).message || '请先登录');
    }
  };

  const copyLink = (url: string): void => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast('链接已复制到剪贴板'))
      .catch(() => toast('分享链接：' + url));
  };

  // 分享
  const sharePost = (): void => {
    const url: string = new URL(`/post/${postId}`, window.location.origin).toString();
    if (navigator.share) {
      navigator.share({ title: post?.title, url }).catch(() => copyLink(url));
    } else {
      copyLink(url);
    }
  };

  const routeData: RouteData | null = useMemo(() => {
    try {
      const ei: Post['extrainfo'] = post?.extrainfo;
      if (!ei || !ei.route) return null;
      const r: RouteExtra = ei.route;
      if (!r.coordinates || r.coordinates.length === 0) return null;
      return {
        coordinates: r.coordinates,
        title: r.start && r.end ? r.start + ' -> ' + r.end : '路线轨迹',
        info: r,
      };
    } catch {
      return null;
    }
  }, [post]);

  const extrainfoStats: ExtrainfoStats | null = useMemo(() => {
    try {
      const ei: Post['extrainfo'] = post?.extrainfo;
      if (!ei) return null;
      if (ei.route) {
        const r: RouteExtra = ei.route;
        const items: ExtrainfoStatItem[] = [];
        if (r.difficulty) {
          items.push({ label: '难度', value: '★'.repeat(r.difficulty) + '★'.repeat(5 - r.difficulty).replace(/★/g, '☆') });
        }
        if (r.duration) items.push({ label: '耗时', value: r.duration });
        if (r.elevationGain) items.push({ label: '爬升', value: r.elevationGain });
        if (r.distance) items.push({ label: '距离', value: `${r.distance}km` });
        if (r.start) items.push({ label: '起点', value: r.start });
        if (r.end) items.push({ label: '终点', value: r.end });
        if (items.length) return { title: '路线信息', items };
      }
      if (ei.gear) {
        const g: GearExtra = ei.gear;
        const items: ExtrainfoStatItem[] = [];
        if (g.brand) items.push({ label: '品牌', value: g.brand });
        if (g.model) items.push({ label: '型号', value: g.model });
        if (g.price) items.push({ label: '价格', value: g.price });
        if (g.usage) items.push({ label: '使用时长', value: g.usage });
        if (items.length) return { title: '装备信息', items };
      }
      return null;
    } catch {
      return null;
    }
  }, [post]);

  const postNotExists: boolean = !loading && !post;
  const coverImage: string = post && post.imageUrls.length > 0 ? post.imageUrls[0] : '';

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <Link to="/forum" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink transition-colors mb-8 group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        返回论坛
      </Link>

      {/* 加载中 */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-pine-200 border-t-pine-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">帖子加载中...</p>
        </div>
      )}

      {/* 帖子不存在 */}
      {!loading && postNotExists && (
        <EmptyState
          title="帖子不存在或已被删除"
          description="返回论坛，看看其他路线记录"
          action={
            <Link to="/forum" className="inline-flex px-4 py-2 md:px-5 md:py-2.5 bg-pine-700 text-paper text-sm font-semibold rounded-lg hover:bg-pine-800 transition-colors">
              返回论坛
            </Link>
          }
        />
      )}

      {/* 帖子内容 */}
      {!loading && post && (
        <article className="max-w-4xl mx-auto">
          {/* 头部信息 */}
          <header className="mb-10">
            <div className="max-w-[70ch] mx-auto">
              <div className="mb-5">
                <TrailTag tone="pine">{post.category}</TrailTag>
              </div>
              <h1 className="font-display text-xl md:text-h1 text-ink mb-6">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {authorAvatar ? (
                  <Image
                    src={resolveImageUrl(authorAvatar)}
                    alt={post.authorName || ''}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-pine-600 text-paper flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {post.authorName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
                {post.authorId ? (
                  <Link to={`/user/${post.authorId}`} className="text-sm font-medium text-ink hover:text-pine-700 transition-colors">
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-ink">{post.authorName}</span>
                )}
                {post.authorId && !isAuthor && (
                  <button onClick={handleFollowAuthor}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${authorFollowed
                      ? 'bg-muted text-muted-foreground hover:bg-accent'
                      : 'bg-pine-700 text-paper hover:bg-pine-800'}`}>
                    {authorFollowed ? '已关注' : '+ 关注'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap mt-5 font-data tabular-nums text-xs text-pine-900/70 md:text-muted-foreground">
                <span>{date}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={14} className="text-pine-600" />
                  {post.views} 阅读
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-pine-600" />
                  {commentsCount} 评论
                </span>
              </div>
              {extrainfoStats && (
                <div className="flex items-center gap-4 flex-wrap mt-4 font-data tabular-nums text-sm text-ink">
                  {extrainfoStats.items.map((item: ExtrainfoStatItem) => {
                    const Icon: LucideIcon | undefined = STAT_ICONS[item.label];
                    return (
                      <span key={item.label} className="inline-flex items-center gap-1.5">
                        {Icon && <Icon size={14} className="text-pine-600" />}
                        {item.value}
                        <span className="text-xs text-pine-900/70 md:text-muted-foreground">{item.label}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="h-px bg-border mt-8" />
          </header>

          {/* 封面图 */}
          {coverImage && (
            <div className="rounded-xl overflow-hidden mb-8 img-container aspect-21/9">
              <Image src={resolveImageUrl(coverImage)} alt={post.title} className="w-full h-full object-cover" loading="eager" />
            </div>
          )}

          {/* 正文 */}
          <div className="max-w-[70ch] mx-auto">
            <div className="prose max-w-none text-[15px] md:text-base leading-[1.9] text-foreground mb-10"
              dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* 路线地图 */}
          {routeData && (
            <RouteMap coordinates={routeData.coordinates} title={routeData.title} routeInfo={routeData.info} />
          )}

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-10 pt-8 border-t border-border">
              {post.tags.map((tag: string) => (
                <Link key={tag} to={`/forum?q=${encodeURIComponent(tag)}`} className="transition-opacity hover:opacity-70">
                  <TrailTag tone="neutral"># {tag}</TrailTag>
                </Link>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 mb-12 pb-8 border-b border-border">
            <button onClick={toggleLike}
              className={`flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors md:min-h-0 ${isLiked ? 'text-ember-600 bg-ember-100' : 'text-muted-foreground'}`}>
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="text-sm font-data">{likeCount || 0}</span>
            </button>
            <button onClick={toggleFavorite}
              className={`flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors md:min-h-0 ${isFavorited ? 'text-ember-500 bg-ember-100' : 'text-muted-foreground'}`}>
              <Star size={18} fill={isFavorited ? 'currentColor' : 'none'} />
              <span className="text-sm font-medium">{isFavorited ? '已收藏' : '收藏'}</span>
            </button>
            <button onClick={sharePost} className="flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors md:min-h-0 text-muted-foreground">
              <Share2 size={18} />
              <span className="text-sm font-medium">分享</span>
            </button>
            {isAuthor && (
              <Link to={`/post/${postId}/edit`} className="flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors md:min-h-0 text-muted-foreground">
                <Pencil size={18} />
                <span className="text-sm font-medium">编辑</span>
              </Link>
            )}
          </div>

          {/* 评论区 */}
          <CommentSection postId={postId} />

          {/* 相关推荐 */}
          <RelatedPosts currentId={postId} />
        </article>
      )}
    </div>
  );
};

export default PostDetailPage;
