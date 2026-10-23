import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Mountain, Route as RouteIcon } from 'lucide-react';
import { getRoute } from '@client/src/api';
import { mapRoute } from '@client/src/data/mappers';
import type { RouteItem } from '@client/src/data/hiking-types';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import RouteTrackMap from '@client/src/components/RouteTrackMap';

interface RouteEmbedCardProps {
  routeId: number;
  className?: string;
}

const RouteEmbedCard = ({ routeId, className = '' }: RouteEmbedCardProps) => {
  const { data, loading } = useAsyncData<RouteItem>(
    async () => mapRoute((await getRoute(routeId)).route),
    [routeId]
  );

  if (loading) {
    return (
      <div className={`animate-pulse overflow-hidden rounded-xl border border-border bg-card ${className}`}>
        <div className="h-[180px] bg-muted" />
        <div className="space-y-2 p-4">
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const route = data;

  return (
    <section className={`overflow-hidden rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-2.5 py-1 text-[11px] font-semibold text-pine-700">
          <RouteIcon size={12} /> 标准路线
        </span>
        <Link
          to={`/routes/${route.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-pine-700 transition-colors hover:text-pine-800"
        >
          查看完整路线 <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="grid gap-0 md:grid-cols-[240px_minmax(0,1fr)]">
        <RouteTrackMap
          coordinates={route.geojson?.coordinates ?? []}
          className="h-[180px] rounded-none border-0 md:h-full md:min-h-[180px]"
          compact
        />
        <div className="p-4 md:p-5">
          <h3 className="font-display text-lg text-ink">{route.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {route.region} · {route.difficulty}
            {route.startPoint ? ` · ${route.startPoint}出发` : ''}
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3 font-data text-sm text-ink">
            <div>
              <dt className="text-[11px] text-muted-foreground">距离</dt>
              <dd className="mt-0.5 tabular-nums">{route.distance}km</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">爬升</dt>
              <dd className="mt-0.5 flex items-center gap-1 tabular-nums">
                <Mountain size={13} className="text-pine-600" />
                {route.ascent == null ? '—' : `${route.ascent}m`}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">耗时</dt>
              <dd className="mt-0.5 flex items-center gap-1">
                <Clock size={13} className="text-pine-600" />
                {route.duration || '—'}
              </dd>
            </div>
          </dl>
          {route.tags && route.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {route.tags.slice(0, 4).map((tag: string) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RouteEmbedCard;
