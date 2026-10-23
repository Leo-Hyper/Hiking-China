import { useId, useMemo, useState } from 'react';

interface ElevationProfileProps {
  points: [number, number, number?][];
  className?: string;
}

const WIDTH = 800;
const HEIGHT = 220;
const PADDING = { top: 24, right: 18, bottom: 32, left: 48 };

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

const ElevationProfile = ({ points, className = '' }: ElevationProfileProps) => {
  const gradientId = `elevation-${useId().replace(/:/g, '')}`;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const samples = useMemo(() => {
    const withElevation = points.filter(
      (point): point is [number, number, number] => point[2] != null && Number.isFinite(Number(point[2]))
    );
    if (withElevation.length < 2) return [];

    const stride = Math.max(1, Math.ceil(withElevation.length / 240));
    const sampled = withElevation.filter(
      (_, index) => index % stride === 0 || index === withElevation.length - 1
    );

    let distance = 0;
    return sampled.map((point, index) => {
      if (index > 0) distance += haversineKm(sampled[index - 1], point);
      return { distance, elevation: Number(point[2]) };
    });
  }, [points]);

  if (samples.length < 2) {
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-sm text-muted-foreground ${className}`}>
        该路线暂无海拔数据
      </div>
    );
  }

  const minElevation = Math.min(...samples.map((sample) => sample.elevation));
  const maxElevation = Math.max(...samples.map((sample) => sample.elevation));
  const elevationRange = Math.max(1, maxElevation - minElevation);
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (index: number) => PADDING.left + (index / (samples.length - 1)) * innerWidth;
  const yFor = (elevation: number) => PADDING.top + (1 - (elevation - minElevation) / elevationRange) * innerHeight;

  const linePath = samples.map((sample, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(1)},${yFor(sample.elevation).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${xFor(samples.length - 1).toFixed(1)},${HEIGHT - PADDING.bottom} L${xFor(0).toFixed(1)},${HEIGHT - PADDING.bottom} Z`;
  const active = hoverIndex == null ? null : samples[hoverIndex];

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (viewX - PADDING.left) / innerWidth;
    const index = Math.round(ratio * (samples.length - 1));
    setHoverIndex(Math.max(0, Math.min(samples.length - 1, index)));
  };

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full"
        role="img"
        aria-label="路线海拔剖面图"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f6f55" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#2f6f55" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((ratio) => {
          const y = PADDING.top + ratio * innerHeight;
          return (
            <line
              key={ratio}
              x1={PADDING.left}
              y1={y}
              x2={WIDTH - PADDING.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="4 6"
            />
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="#2f6f55" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        <text x={PADDING.left - 8} y={PADDING.top + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
          {Math.round(maxElevation)}m
        </text>
        <text x={PADDING.left - 8} y={HEIGHT - PADDING.bottom} textAnchor="end" className="fill-muted-foreground text-[11px]">
          {Math.round(minElevation)}m
        </text>
        <text x={PADDING.left} y={HEIGHT - 8} className="fill-muted-foreground text-[11px]">0km</text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 8} textAnchor="end" className="fill-muted-foreground text-[11px]">
          {samples[samples.length - 1].distance.toFixed(1)}km
        </text>

        {active && hoverIndex != null && (
          <>
            <line
              x1={xFor(hoverIndex)}
              y1={PADDING.top}
              x2={xFor(hoverIndex)}
              y2={HEIGHT - PADDING.bottom}
              stroke="#2f6f55"
              strokeOpacity="0.35"
              strokeDasharray="3 4"
            />
            <circle cx={xFor(hoverIndex)} cy={yFor(active.elevation)} r="4" fill="#2f6f55" stroke="#fff" strokeWidth="2" />
            <text
              x={Math.min(WIDTH - PADDING.right - 90, Math.max(PADDING.left, xFor(hoverIndex) - 42))}
              y={PADDING.top + 12}
              className="fill-ink text-[11px] font-medium"
            >
              {active.distance.toFixed(1)}km · {Math.round(active.elevation)}m
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export default ElevationProfile;
