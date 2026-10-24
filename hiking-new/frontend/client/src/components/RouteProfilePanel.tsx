import { useEffect, useState, type ReactNode } from 'react';
import { Link2, Maximize2, Route as RouteIcon, X } from 'lucide-react';
import type { RouteItem } from '@client/src/data/hiking-types';
import RouteTrackMap from '@client/src/components/RouteTrackMap';
import ElevationProfile from '@client/src/components/ElevationProfile';
import ElevationStrip from '@client/src/components/ElevationStrip';

interface RouteProfilePanelProps {
  route: RouteItem;
  coordinates: [number, number, number?][];
  className?: string;
  actions?: ReactNode;
}

function sourceLabel(route: RouteItem): string {
  if (route.dataSource === 'osm+srtm') return 'OSM + SRTM';
  if (route.dataSource === 'gpx') return 'GPX 实测';
  if (route.isSample) return '示例轨迹';
  return '未上传 GPX';
}

const RouteProfilePanel = ({ route, coordinates, className = '', actions }: RouteProfilePanelProps) => {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasTrack = coordinates.length >= 2;

  useEffect(() => {
    if (!fullscreen && !sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreen(false);
        setSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen, sheetOpen]);

  const header = (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      <span className="font-display text-base text-ink">轨迹与剖面</span>
      <span className="rounded-full bg-pine-50 px-2 py-0.5 text-[10px] font-semibold text-pine-700">
        {sourceLabel(route)}
      </span>
      <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:flex">
        <Link2 size={12} className="text-ember-500" />
        地图 ↔ 剖面已联动
      </span>
      {actions}
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="hidden min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-ink transition-colors hover:border-pine-300 hover:text-pine-700 md:inline-flex"
      >
        <Maximize2 size={12} /> 全屏并排
      </button>
    </div>
  );

  if (!hasTrack) {
    return (
      <section className={`overflow-hidden rounded-xl border border-border bg-card ${className}`}>
        {header}
        <div className="grid place-items-center px-6 py-14 text-center">
          <RouteIcon size={28} className="text-pine-600" />
          <h3 className="mt-3 font-display text-lg text-ink">该路线暂未上传 GPX 轨迹</h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            上传或关联真实 GPX 后，这里会从起点到终点绘制完整轨迹和海拔剖面。
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={`overflow-hidden rounded-xl border border-border bg-card ${className}`}>
        {header}

        <div className="relative">
          <RouteTrackMap
            coordinates={coordinates}
            className="h-[300px] w-full rounded-none border-0 md:h-[340px]"
            activePointIndex={activePointIndex}
            onHoverIndex={setActivePointIndex}
          />
          <ElevationStrip
            points={coordinates}
            activePointIndex={activePointIndex}
            onHoverIndex={setActivePointIndex}
            onOpen={() => setSheetOpen(true)}
            className="absolute inset-x-3 bottom-3 md:hidden"
          />
        </div>

        <div className="hidden border-t border-border p-4 md:block">
          <ElevationProfile
            points={coordinates}
            activePointIndex={activePointIndex}
            onHoverIndex={setActivePointIndex}
          />
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-left text-[11px] text-muted-foreground md:hidden"
        >
          <span>点击地图底部海拔条查看完整剖面</span>
          <span className="font-semibold text-pine-700">展开</span>
        </button>
      </section>

      {fullscreen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-paper p-3 md:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-display text-lg text-ink">{route.name}</span>
            <span className="rounded-full bg-pine-50 px-2 py-0.5 text-[10px] font-semibold text-pine-700">
              {sourceLabel(route)}
            </span>
            <span className="hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:flex">
              <Link2 size={12} className="text-ember-500" /> 地图 ↔ 剖面已联动
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-paper"
            >
              <X size={14} /> 关闭
            </button>
          </div>
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[58%_42%]">
            <div className="min-h-[280px] overflow-hidden rounded-xl border border-border bg-card">
              <RouteTrackMap
                coordinates={coordinates}
                className="h-full min-h-[280px] w-full rounded-none border-0"
                activePointIndex={activePointIndex}
                onHoverIndex={setActivePointIndex}
              />
            </div>
            <div className="min-h-0 overflow-auto rounded-xl border border-border bg-card p-4">
              <ElevationProfile
                points={coordinates}
                activePointIndex={activePointIndex}
                onHoverIndex={setActivePointIndex}
                compact
                minWidth={620}
              />
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                <div>
                  <dt className="text-[10px] text-muted-foreground">起点</dt>
                  <dd className="mt-1 font-medium text-ink">{route.startPoint || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted-foreground">终点</dt>
                  <dd className="mt-1 font-medium text-ink">{route.endPoint || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted-foreground">最低海拔</dt>
                  <dd className="mt-1 font-data text-ink">
                    {route.minElevation == null ? '—' : `${route.minElevation}m`}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted-foreground">轨迹点数</dt>
                  <dd className="mt-1 font-data text-ink">{route.pointCount || coordinates.length}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                当前剖面严格使用这份 GPX 从起点绘制到终点，未生成返程。
              </p>
            </div>
          </div>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="完整海拔剖面">
          <button
            type="button"
            aria-label="关闭海拔剖面"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[84dvh] overflow-y-auto rounded-t-2xl bg-card p-4 pb-8 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ember-600">Elevation</p>
                <h3 className="font-display text-lg text-ink">完整海拔剖面</h3>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-ink"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>
            <ElevationProfile
              points={coordinates}
              activePointIndex={activePointIndex}
              onHoverIndex={setActivePointIndex}
              compact
              minWidth={0}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RouteProfilePanel;
