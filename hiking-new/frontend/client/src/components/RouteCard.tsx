import { Link } from 'react-router-dom';
import { Clock, MapPin, Route as RouteIcon, Star } from 'lucide-react';
import type { RouteItem } from '@client/src/data/hiking-types';
import { withBasePath } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';

interface RouteCardProps {
  routeData: RouteItem;
}

const getDifficultyTone = (difficulty: string): 'ember' | 'pine' | 'neutral' => {
  if (difficulty === '高级') return 'ember';
  if (difficulty === '中级') return 'pine';
  return 'neutral';
};

const RouteCard = ({ routeData }: RouteCardProps) => {
  return (
    <Link to={routeData.postId ? `/post/${routeData.postId}` : '/routes'} className="group block h-full @container">
      <div className="flex h-full flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={withBasePath(routeData.image)}
            alt={routeData.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
          <span className="absolute left-1.5 top-1.5">
            <TrailTag tone={getDifficultyTone(routeData.difficulty)}>{routeData.difficulty}</TrailTag>
          </span>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-6 font-data text-[10px] text-white">
            <span className="flex items-center gap-1">
              <RouteIcon size={11} />
              {routeData.distance}km
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {routeData.duration}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Star size={11} className="text-ember-400" />
              {routeData.rating}
            </span>
          </div>
        </div>

        <div className="mt-2 min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-pine-700">
            {routeData.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin size={12} className="shrink-0 text-pine-600" />
              <span className="truncate">{routeData.region}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RouteCard;
