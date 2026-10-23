import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  Download,
  Heart,
  MapPin,
  Mountain,
  Route as RouteIcon,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { checkRouteFavorite, getRoute, toggleRouteFavorite } from '@client/src/api';
import { mapRoute } from '@client/src/data/mappers';
import type { RouteItem } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import { apiUrl } from '@client/src/utils/http';
import { sanitizeRichText } from '@client/src/utils/sanitize-html';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import RouteTrackMap from '@client/src/components/RouteTrackMap';
import ElevationProfile from '@client/src/components/ElevationProfile';
import EmptyState from '@client/src/components/visual/EmptyState';
import Seo from '@client/src/components/Seo';

const RouteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const routeId = Number(id);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [favorited, setFavorited] = useState<boolean>(false);
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);

  const { data, loading, error, reload } = useAsyncData<RouteItem>(
    async () => mapRoute((await getRoute(routeId)).route),
    [routeId]
  );
  const route = data;
  const coordinates = route?.geojson?.coordinates ?? [];
  const content = useMemo(
    () => sanitizeRichText(route?.content || route?.description || ''),
    [route?.content, route?.description]
  );

  useEffect(() => {
    setFavoriteCount(route?.favoriteCount || 0);
    if (!route || !isLoggedIn) {
      setFavorited(false);
      return;
    }
    let active = true;
    checkRouteFavorite(route.id)
      .then((result) => {
        if (active) setFavorited(result.favorited);
      })
      .catch(() => {
        if (active) setFavorited(false);
      });
    return () => {
      active = false;
    };
  }, [route?.id, isLoggedIn]);

  const handleFavorite = async (): Promise<void> => {
    if (!route) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: `/routes/${route.id}` } } });
      return;
    }
    setFavoriteLoading(true);
    try {
      const result = await toggleRouteFavorite(route.id);
      setFavorited(result.favorited);
      setFavoriteCount((count: number) => Math.max(0, count + (result.favorited ? 1 : -1)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '收藏操作失败');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (!Number.isInteger(routeId) || routeId <= 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <EmptyState icon={RouteIcon} title="路线不存在" description="链接可能已经失效" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
      {route && (
        <Seo
          title={route.name}
          description={route.description}
          path={`/routes/${route.id}`}
          image={route.image}
        />
      )}

      <Link
        to="/routes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        返回路线
      </Link>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-[320px] rounded-2xl bg-muted" />
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      ) : error ? (
        <EmptyState
          icon={RouteIcon}
          title="路线加载失败"
          description={error}
          action={
            <button
              onClick={reload}
              className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
            >
              重新加载
            </button>
          }
        />
      ) : route ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative overflow-hidden rounded-2xl bg-pine-950 lg:h-[380px]">
              <Image
                src={withBasePath(route.image)}
                alt={route.name}
                className="h-[320px] w-full object-cover opacity-80 md:h-[380px] lg:h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pine-950/90 via-pine-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-paper/15 px-2.5 py-1 text-[11px] font-medium text-paper backdrop-blur">
                    {route.region}
                  </span>
                  <span className="rounded-full bg-ember-500/90 px-2.5 py-1 text-[11px] font-medium text-white">
                    {route.difficulty}
                  </span>
                  {route.tags?.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-paper/10 px-2.5 py-1 text-[11px] text-paper/85 backdrop-blur">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="font-display text-2xl text-paper md:text-4xl">{route.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/75 md:text-base">
                  {route.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 font-data text-xs text-paper/80">
                  <span className="flex items-center gap-1.5"><RouteIcon size={14} />{route.distance}km</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} />{route.duration || '未标注'}</span>
                  <span className="flex items-center gap-1.5"><Star size={14} className="text-ember-300" />{route.rating.toFixed(1)}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{route.startPoint || '起点未标注'}</span>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-4">
              {[
                { label: '累计爬升', value: route.ascent == null ? '—' : `${route.ascent}m`, icon: TrendingUp },
                { label: '累计下降', value: route.descent == null ? '—' : `${route.descent}m`, icon: TrendingDown },
                { label: '最高海拔', value: route.maxElevation == null ? '—' : `${route.maxElevation}m`, icon: Mountain },
                { label: '轨迹点数', value: route.pointCount ? String(route.pointCount) : '—', icon: RouteIcon },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex flex-col justify-center rounded-xl border border-border bg-card p-4">
                    <Icon size={16} className="text-pine-700" />
                    <p className="mt-3 font-data text-lg text-ink">{item.value}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{item.label}</p>
                  </div>
                );
              })}
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ember-600">Track</p>
                    <h2 className="mt-1 font-display text-lg text-ink">路线轨迹</h2>
                  </div>
                  {route.geojson && (
                    <a
                      href={apiUrl(`/api/routes/${route.id}/export.gpx`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-pine-300 hover:text-pine-700"
                    >
                      <Download size={13} />
                      导出 GPX
                    </a>
                  )}
                </div>
                <RouteTrackMap coordinates={coordinates} className="h-[360px]" />
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-ember-600">Elevation</p>
                <h2 className="mb-4 mt-1 font-display text-lg text-ink">海拔剖面</h2>
                <ElevationProfile points={coordinates} className="h-[220px]" />
              </section>

              <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-lg text-ink">路线说明</h2>
                <div
                  className="prose prose-sm mt-4 max-w-none text-ink/80"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </section>
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <button
                  onClick={handleFavorite}
                  disabled={favoriteLoading}
                  className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                    favorited
                      ? 'border-ember-200 bg-ember-50 text-ember-600'
                      : 'border-pine-700 bg-pine-700 text-paper hover:bg-pine-800'
                  }`}
                >
                  <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
                  {favorited ? '已收藏' : '收藏路线'}
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {favoriteCount} 人收藏
                </p>
                {route.postId && (
                  <Link
                    to={`/post/${route.postId}`}
                    className="mt-4 flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-ink transition-colors hover:border-pine-300 hover:text-pine-700"
                  >
                    查看相关游记
                  </Link>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-base text-ink">路线信息</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">地区</dt>
                    <dd className="font-medium text-ink">{route.region}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">难度</dt>
                    <dd className="font-medium text-ink">{route.difficulty}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">起点</dt>
                    <dd className="font-medium text-ink">{route.startPoint || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">终点</dt>
                    <dd className="font-medium text-ink">{route.endPoint || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">最低海拔</dt>
                    <dd className="font-medium text-ink">{route.minElevation == null ? '—' : `${route.minElevation}m`}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <EmptyState icon={RouteIcon} title="路线不存在" description="链接可能已经失效" />
      )}
    </div>
  );
};

export default RouteDetailPage;
