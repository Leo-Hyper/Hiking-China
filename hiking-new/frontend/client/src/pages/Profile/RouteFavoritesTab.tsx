import { Link } from 'react-router-dom';
import { Route as RouteIcon } from 'lucide-react';
import { listRouteFavorites } from '@client/src/api';
import { mapRoute } from '@client/src/data/mappers';
import type { RouteItem } from '@client/src/data/hiking-types';
import { useAsyncData } from '@client/src/hooks/use-hiking';
import { withCardImage } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import EmptyState from '@client/src/components/visual/EmptyState';

const RouteFavoritesTab = () => {
  const { data, loading, error, reload } = useAsyncData<RouteItem[]>(
    async () => {
      const result = await listRouteFavorites();
      return result.routes.map(mapRoute);
    },
    []
  );
  const routes: RouteItem[] = data ?? [];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index: number) => (
          <div key={index} className="animate-pulse rounded-xl border border-border bg-card p-3">
            <div className="aspect-[16/10] rounded-lg bg-muted" />
            <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={RouteIcon}
        title="路线收藏加载失败"
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
    );
  }

  if (routes.length === 0) {
    return (
      <EmptyState
        icon={RouteIcon}
        title="还没有收藏路线"
        description="在路线详情页点击收藏，之后可以从这里快速找到。"
        action={
          <Link
            to="/routes"
            className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
          >
            去发现路线
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((route: RouteItem) => (
        <Link
          key={route.id}
          to={`/routes/${route.id}`}
          className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-pine-300 hover:shadow-md"
        >
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <Image
              src={withCardImage(route.image)}
              alt={route.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="p-4">
            <h3 className="line-clamp-1 font-display text-base text-ink group-hover:text-pine-700">
              {route.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {route.region} · {route.difficulty} · {route.distance}km
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RouteFavoritesTab;
