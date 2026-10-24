import { useMemo, useState } from 'react';

interface ElevationStripProps {
  points: [number, number, number?][];
  activePointIndex?: number | null;
  onHoverIndex?: (index: number | null) => void;
  onOpen?: () => void;
  className?: string;
}

interface Sample {
  distance: number;
  elevation: number;
  sourceIndex: number;
}

const WIDTH = 300;
const HEIGHT = 78;
const PADDING = 6;

function haversineKm(a: [number, number, number], b: [number, number, number]): number {
  const radius = 6371.0088;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = lat2 - lat1;
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

const ElevationStrip = ({
  points,
  activePointIndex = null,
  onHoverIndex,
  onOpen,
  className = '',
}: ElevationStripProps) => {
  const [hoverSample, setHoverSample] = useState<number | null>(null);

  const samples = useMemo(() => {
    const withElevation = points
      .map((point, sourceIndex) => ({ point, sourceIndex }))
      .filter(
        (entry): entry is { point: [number, number, number]; sourceIndex: number } =>
          entry.point[2] != null && Number.isFinite(Number(entry.point[2]))
      );
    if (withElevation.length < 2) return [];
    const stride = Math.max(1, Math.ceil(withElevation.length / 160));
    const sampled = withElevation.filter(
      (_, index) => index % stride === 0 || index === withElevation.length - 1
    );
    let distance = 0;
    return sampled.map((entry, index) => {
      if (index > 0) distance += haversineKm(sampled[index - 1].point, entry.point);
      return {
        distance,
        elevation: Number(entry.point[2]),
        sourceIndex: entry.sourceIndex,
      };
    });
  }, [points]);

  const activeFromParent = useMemo(() => {
    if (activePointIndex == null || samples.length === 0) return null;
    let nearest = 0;
    let nearestDelta = Infinity;
    samples.forEach((sample, index) => {
      const delta = Math.abs(sample.sourceIndex - activePointIndex);
      if (delta < nearestDelta) {
        nearestDelta = delta;
        nearest = index;
      }
    });
    return nearest;
  }, [activePointIndex, samples]);

  if (samples.length < 2) {
    return (
      <div className={`rounded-xl border border-dashed border-border bg-card/95 px-3 py-2 text-[11px] text-muted-foreground ${className}`}>
        暂未上传 GPX 轨迹
      </div>
    );
  }

  const minElevation = Math.min(...samples.map((sample) => sample.elevation));
  const maxElevation = Math.max(...samples.map((sample) => sample.elevation));
  const range = Math.max(1, maxElevation - minElevation);
  const innerWidth = WIDTH - PADDING * 2;
  const innerHeight = HEIGHT - PADDING * 2;
  const totalDistance = samples[samples.length - 1].distance || 1;
  const xFor = (index: number) =>
    PADDING + (samples[index].distance / totalDistance) * innerWidth;
  const yFor = (elevation: number) =>
    PADDING + (1 - (elevation - minElevation) / range) * innerHeight;
  const line = samples
    .map((sample, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(1)},${yFor(sample.elevation).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${WIDTH - PADDING},${HEIGHT - PADDING} L${PADDING},${HEIGHT - PADDING} Z`;
  const activeIndex = hoverSample ?? activeFromParent;
  const active = activeIndex == null ? null : samples[activeIndex];

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.max(0, Math.min(1, (viewX - PADDING) / innerWidth));
    const target = ratio * totalDistance;
    let nearest = 0;
    let delta = Infinity;
    samples.forEach((sample, index) => {
      const nextDelta = Math.abs(sample.distance - target);
      if (nextDelta < delta) {
        delta = nextDelta;
        nearest = index;
      }
    });
    setHoverSample(nearest);
    onHoverIndex?.(samples[nearest].sourceIndex);
  };

  const handleLeave = () => {
    setHoverSample(null);
    onHoverIndex?.(null);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/70 bg-card/95 shadow-[0_6px_20px_rgba(15,23,42,.16)] backdrop-blur ${className}`}
    >
      <div className="flex items-center justify-between px-3 pt-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-ink">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember-500" />
          海拔
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full bg-pine-50 px-2 py-0.5 font-semibold text-pine-700"
        >
          展开完整剖面
        </button>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-1 block h-[58px] w-full cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label="查看完整海拔剖面"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onOpen?.();
        }}
      >
        <path d={area} fill="#2f6f55" opacity="0.12" />
        <path d={line} fill="none" stroke="#2f6f55" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
        <circle cx={xFor(0)} cy={yFor(samples[0].elevation)} r="2.4" fill="#2f6f55" />
        <circle cx={xFor(samples.length - 1)} cy={yFor(samples[samples.length - 1].elevation)} r="2.4" fill="#c96a3d" />
        {active && activeIndex != null && (
          <>
            <line
              x1={xFor(activeIndex)}
              y1={2}
              x2={xFor(activeIndex)}
              y2={HEIGHT - 2}
              stroke="#c96a3d"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={xFor(activeIndex)} cy={yFor(active.elevation)} r="3" fill="#fff" stroke="#c96a3d" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
    </div>
  );
};

export default ElevationStrip;
