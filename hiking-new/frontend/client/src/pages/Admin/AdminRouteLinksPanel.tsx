import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Loader2, RefreshCw, Route as RouteIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  backfillAdminRouteLinks,
  listAdminRouteLinks,
  listRoutes,
  setAdminPostRoute,
  type AdminRouteLinkPost,
} from '@client/src/api';

interface RouteOption {
  id: number;
  name: string;
  region: string;
}

const CONFIDENCE_CLASS: Record<string, string> = {
  高: 'bg-pine-50 text-pine-700 border-pine-200',
  中: 'bg-amber-50 text-amber-700 border-amber-200',
  低: 'bg-muted text-muted-foreground border-border',
};

const AdminRouteLinksPanel = () => {
  const [posts, setPosts] = useState<AdminRouteLinkPost[]>([]);
  const [pending, setPending] = useState(0);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backfilling, setBackfilling] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);
  const [manualSelection, setManualSelection] = useState<Record<number, number>>({});

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [links, routeData] = await Promise.all([listAdminRouteLinks(), listRoutes()]);
      setPosts(links.posts || []);
      setPending(links.pending || 0);
      setRoutes(
        (routeData.routes || []).map((route: Record<string, unknown>) => ({
          id: Number(route.id),
          name: String(route.name || ''),
          region: String(route.region || ''),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '路线归属数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const routeNames = useMemo(
    () => new Map(routes.map((route) => [route.id, route.name])),
    [routes]
  );

  const handleBackfill = async (): Promise<void> => {
    if (!window.confirm('将从路线库已有的 routes.post_id 回填帖子关联，不会使用任何猜测。确定继续？')) {
      return;
    }
    setBackfilling(true);
    try {
      const result = await backfillAdminRouteLinks();
      toast.success(result.message);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '回填失败');
    } finally {
      setBackfilling(false);
    }
  };

  const handleApply = async (postId: number, routeId: number): Promise<void> => {
    const routeName = routeNames.get(routeId) || '所选路线';
    if (!window.confirm(`确定将这篇帖子关联到「${routeName}」？`)) return;
    setApplying(postId);
    try {
      await setAdminPostRoute(postId, routeId);
      toast.success('路线关联已保存');
      setPosts((current) => current.filter((post) => post.id !== postId));
      setPending((current) => Math.max(0, current - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '关联保存失败');
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" /> 正在分析帖子与路线…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink"
        >
          <RefreshCw size={13} /> 重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-kicker uppercase text-ember-600">Route Links</p>
            <h2 className="mt-1 font-display text-lg text-ink">帖子路线归属</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              先回填路线库中已有的 post_id 关联，再逐条确认其余帖子。系统只给出建议，不会自动写入。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              待归属 <strong className="font-data text-ink">{pending}</strong> 篇
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-ink"
            >
              <RefreshCw size={13} /> 刷新
            </button>
            <button
              type="button"
              onClick={() => void handleBackfill()}
              disabled={backfilling}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-pine-200 bg-pine-50 px-3 text-xs font-semibold text-pine-700 disabled:opacity-50"
            >
              {backfilling ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
              回填已有路线关联
            </button>
          </div>
        </div>
      </section>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <RouteIcon size={28} className="mx-auto text-pine-600" />
          <h3 className="mt-3 font-display text-lg text-ink">所有帖子都已归属路线</h3>
          <p className="mt-1 text-sm text-muted-foreground">没有待处理的帖子。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const tags = String(post.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
            const selected = manualSelection[post.id] || 0;
            return (
              <article key={post.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/post/${post.id}`}
                      className="font-display text-base text-ink transition-colors hover:text-pine-700"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {post.author || '匿名'} · {post.category || '未分类'}
                      {post.created_at ? ` · ${new Date(post.created_at).toLocaleDateString('zh-CN')}` : ''}
                    </p>
                    {post.content && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {String(post.content).replace(/<[^>]+>/g, ' ').slice(0, 180)}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.slice(0, 6).map((tag) => (
                          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/post/${post.id}`}
                    className="shrink-0 text-xs font-semibold text-pine-700 hover:text-pine-800"
                  >
                    查看帖子
                  </Link>
                </div>

                <div className="mt-4 border-t border-border/70 pt-4">
                  {post.suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">暂无高置信度建议，可在下方手动选择路线。</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        建议路线
                      </p>
                      {post.suggestions.map((suggestion) => (
                        <div
                          key={suggestion.routeId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-ink">{suggestion.name}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_CLASS[suggestion.confidence] || CONFIDENCE_CLASS['低']}`}>
                              {suggestion.confidence}置信度 · {suggestion.score}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{suggestion.reason}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleApply(post.id, suggestion.routeId)}
                            disabled={applying === post.id}
                            className="inline-flex h-8 items-center rounded-lg bg-pine-700 px-3 text-xs font-semibold text-paper disabled:opacity-50"
                          >
                            {applying === post.id ? '保存中…' : '采用'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={selected || ''}
                      onChange={(event) =>
                        setManualSelection((current) => ({
                          ...current,
                          [post.id]: Number(event.target.value),
                        }))
                      }
                      className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-card px-3 text-xs text-ink outline-none focus:border-pine-500"
                      aria-label={`为「${post.title}」选择路线`}
                    >
                      <option value="">手动选择路线…</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name} · {route.region}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => selected && void handleApply(post.id, selected)}
                      disabled={!selected || applying === post.id}
                      className="inline-flex h-9 items-center rounded-lg border border-pine-200 bg-pine-50 px-3 text-xs font-semibold text-pine-700 disabled:opacity-50"
                    >
                      关联所选路线
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRouteLinksPanel;
