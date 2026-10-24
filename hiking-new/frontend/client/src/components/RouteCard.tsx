import { Link } from 'react-router-dom';
import { Check, Clock, MapPin, Route as RouteIcon, Scale, Star } from 'lucide-react';
import type { RouteItem } from '@client/src/data/hiking-types';
import { withCardImage } from '@client/src/utils/base-path';
import MediaFrame from '@client/src/components/MediaFrame';
import TrailTag from '@client/src/components/visual/TrailTag';

interface RouteCardProps {
  routeData: RouteItem;
  compareSelected?: boolean;
  compareDisabled?: boolean;
  onToggleCompare?: (routeId: number) => void;
}

const getDifficultyTone = (difficulty: string): 'ember' | 'pine' | 'neutral' => {
  if (difficulty === '高级') return 'ember';
  if (difficulty === '中级') return 'pine';
  return 'neutral';
};

const RouteCard = ({
  routeData,
  compareSelected = false,
  compareDisabled = false,
  onToggleCompare,
}: RouteCardProps) => {
  return (
    <article className="group relative h-full @container">
      <Link
        to={`/routes/${routeData.id}`}
        className="block h-full"
      >
        <div className="flex h-full flex-col">
          <MediaFrame
            src={withCardImage(routeData.image)}
            alt={routeData.name}
            ratioClassName="aspect-[16/10]"
            position="center 42%"
            className="w-full rounded-lg"
            imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          >
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
          </MediaFrame>

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

      {onToggleCompare && (
        <button
          type="button"
          aria-label={compareSelected ? `移出${routeData.name}对比` : `将${routeData.name}加入对比`}
          aria-pressed={compareSelected}
          disabled={compareDisabled && !compareSelected}
          title={
            compareSelected
              ? '移出对比'
              : compareDisabled
                ? '最多选择 2 条路线'
                : '加入路线对比'
          }
          onClick={() => onToggleCompare(routeData.id)}
          className={`absolute right-1.5 top-1.5 z-10 inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-medium backdrop-blur-sm transition-colors ${
            compareSelected
              ? 'border-pine-700 bg-pine-700 text-paper'
              : compareDisabled
                ? 'cursor-not-allowed border-white/50 bg-paper/75 text-muted-foreground'
                : 'border-white/70 bg-paper/85 text-ink hover:border-pine-300 hover:text-pine-700'
          }`}
        >
          {compareSelected ? <Check size={11} /> : <Scale size={11} />}
          {compareSelected ? '已选' : '对比'}
        </button>
      )}
    </article>
  );
};

export default RouteCard;
