import { useId, useMemo, useRef, useState } from 'react';

interface ElevationProfileProps {
  points: [number, number, number?][];
  className?: string;
  activePointIndex?: number | null;
  onHoverIndex?: (index: number | null) => void;
  compact?: boolean;
  minWidth?: number;
}

interface Sample {
  distance: number;
  elevation: number;
  sourceIndex: number;
  grade: number;
}

const SLOPE_COLORS = {
  descent: '#3b82f6',
  gentle: '#2f6f55',
  moderate: '#d97706',
  steep: '#c2410c',
};

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

function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / power;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * power;
}

function slopeColor(grade: number): string {
  if (grade <= -3) return SLOPE_COLORS.descent;
  if (grade < 5) return SLOPE_COLORS.gentle;
  if (grade < 12) return SLOPE_COLORS.moderate;
  return SLOPE_COLORS.steep;
}

function formatDistance(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(1);
}

const ElevationProfile = ({
  points,
  className = '',
  activePointIndex = null,
  onHoverIndex,
  compact = false,
  minWidth = 0,
}: ElevationProfileProps) => {
  const chartWidth = compact ? 480 : 900;
  const chartHeight = compact ? 220 : 260;
  const padding = compact
    ? { top: 28, right: 18, bottom: 30, left: 58 }
    : { top: 32, right: 24, bottom: 38, left: 56 };
  const gradientId = `elevation-${useId().replace(/:/g, '')}`;
  const [hoverSample, setHoverSample] = useState<number | null>(null);
  const lastEmittedRef = useRef<number | null>(null);

  const data = useMemo(() => {
    const withElevation = points
      .map((point, sourceIndex) => ({ point, sourceIndex }))
      .filter(
        (entry): entry is { point: [number, number, number]; sourceIndex: number } =>
          entry.point[2] != null && Number.isFinite(Number(entry.point[2]))
      );
    if (withElevation.length < 2) return null;

    const cumulativeDistance: number[] = [0];
    let ascent = 0;
    let descent = 0;
    for (let index = 1; index < withElevation.length; index += 1) {
      const previousPoint = withElevation[index - 1].point;
      const currentPoint = withElevation[index].point;
      cumulativeDistance[index] = cumulativeDistance[index - 1] + haversineKm(previousPoint, currentPoint);
      const delta = currentPoint[2] - previousPoint[2];
      if (delta > 3) ascent += delta;
      if (delta < -3) descent += Math.abs(delta);
    }
    const totalDistance = cumulativeDistance[cumulativeDistance.length - 1] || 0;

    const stride = Math.max(1, Math.ceil(withElevation.length / 480));
    const sampled = withElevation.filter(
      (_, index) => index % stride === 0 || index === withElevation.length - 1
    );

    const samples: Sample[] = [];

    for (let index = 0; index < sampled.length; index += 1) {
      const { point, sourceIndex } = sampled[index];
      let grade = 0;
      if (index > 0) {
        const previous = sampled[index - 1];
        const segmentKm = cumulativeDistance[sourceIndex] - cumulativeDistance[previous.sourceIndex];
        const delta = point[2] - previous.point[2];
        if (segmentKm > 0.0005) grade = (delta / (segmentKm * 1000)) * 100;
      }
      samples.push({
        distance: cumulativeDistance[sourceIndex],
        elevation: Number(point[2]),
        sourceIndex,
        grade,
      });
    }

    const elevations = withElevation.map((entry) => entry.point[2]);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const highest = samples.find((sample) => sample.elevation === maxElevation)
      ?? samples.reduce((best, sample) => (sample.elevation > best.elevation ? sample : best), samples[0]);
    const lowest = samples.find((sample) => sample.elevation === minElevation)
      ?? samples.reduce((best, sample) => (sample.elevation < best.elevation ? sample : best), samples[0]);

    return {
      samples,
      totalDistance,
      ascent: Math.round(ascent),
      descent: Math.round(descent),
      minElevation,
      maxElevation,
      highest,
      lowest,
    };
  }, [points]);

  const activeFromParent = useMemo(() => {
    if (!data || activePointIndex == null) return null;
    let nearest = 0;
    let nearestDelta = Infinity;
    data.samples.forEach((sample, index) => {
      const delta = Math.abs(sample.sourceIndex - activePointIndex);
      if (delta < nearestDelta) {
        nearestDelta = delta;
        nearest = index;
      }
    });
    return nearest;
  }, [data, activePointIndex]);

  const activeIndex = hoverSample ?? activeFromParent;

  if (!data) {
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-sm text-muted-foreground ${className}`}>
        该路线暂无海拔数据
      </div>
    );
  }

  const { samples, totalDistance, ascent, descent, minElevation, maxElevation, highest, lowest } = data;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const elevationStep = niceStep(Math.max(10, (maxElevation - minElevation) / (compact ? 2 : 4)));
  const yMin = Math.floor(minElevation / elevationStep) * elevationStep;
  const yMax = Math.ceil(maxElevation / elevationStep) * elevationStep;
  const yRange = Math.max(1, yMax - yMin);

  const xForDistance = (distance: number) =>
    padding.left + (totalDistance <= 0 ? 0 : distance / totalDistance) * innerWidth;
  const xFor = (index: number) => xForDistance(samples[index].distance);
  const yFor = (elevation: number) =>
    padding.top + (1 - (elevation - yMin) / yRange) * innerHeight;

  const linePath = samples
    .map((sample, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(1)},${yFor(sample.elevation).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${xFor(samples.length - 1).toFixed(1)},${chartHeight - padding.bottom} L${xFor(0).toFixed(1)},${chartHeight - padding.bottom} Z`;

  const yTicks: number[] = [];
  for (let value = yMin; value <= yMax + elevationStep / 2; value += elevationStep) {
    yTicks.push(value);
  }
  const xTicks = (compact ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1])
    .map((ratio) => ratio * totalDistance);

  const active = activeIndex == null ? null : samples[activeIndex];

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const ratio = (viewX - padding.left) / innerWidth;
    const targetDistance = Math.max(0, Math.min(totalDistance, ratio * totalDistance));
    let nearest = 0;
    let nearestDelta = Infinity;
    samples.forEach((sample, index) => {
      const delta = Math.abs(sample.distance - targetDistance);
      if (delta < nearestDelta) {
        nearestDelta = delta;
        nearest = index;
      }
    });
    setHoverSample(nearest);
    if (lastEmittedRef.current !== samples[nearest].sourceIndex) {
      lastEmittedRef.current = samples[nearest].sourceIndex;
      onHoverIndex?.(samples[nearest].sourceIndex);
    }
  };

  const handleLeave = () => {
    setHoverSample(null);
    lastEmittedRef.current = null;
    onHoverIndex?.(null);
  };

  return (
    <div className={className}>
      <div className={`mb-3 grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {[
          { label: '总距离', value: `${formatDistance(totalDistance)} km` },
          { label: '累计爬升', value: `${ascent} m` },
          { label: '累计下降', value: `${descent} m` },
          { label: '海拔区间', value: `${Math.round(minElevation)}–${Math.round(maxElevation)} m` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="mt-0.5 font-data text-sm tabular-nums text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="block h-auto w-full"
        style={minWidth > 0 ? { minWidth } : undefined}
        role="img"
        aria-label="路线海拔剖面图"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f6f55" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2f6f55" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={`y-${tick}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 6"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className={`fill-muted-foreground ${compact ? 'text-[13px]' : 'text-[11px]'}`}
              >
                {Math.round(tick)}m
              </text>
            </g>
          );
        })}

        {xTicks.map((tick, index) => {
          const x = xForDistance(tick);
          return (
            <g key={`x-${index}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={chartHeight - padding.bottom}
                stroke="currentColor"
                strokeOpacity="0.06"
              />
              <text
                x={x}
                y={chartHeight - 14}
                textAnchor={index === 0 ? 'start' : index === xTicks.length - 1 ? 'end' : 'middle'}
                className={`fill-muted-foreground ${compact ? 'text-[13px]' : 'text-[11px]'}`}
              >
                {formatDistance(tick)}km
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />

        {samples.slice(1).map((sample, index) => (
          <path
            key={`segment-${index}`}
            d={`M${xFor(index).toFixed(1)},${yFor(samples[index].elevation).toFixed(1)} L${xFor(index + 1).toFixed(1)},${yFor(sample.elevation).toFixed(1)}`}
            fill="none"
            stroke={slopeColor(sample.grade)}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        ))}

        {highest && (() => {
          const highestX = xForDistance(highest.distance);
          const anchor = highestX < padding.left + 70
            ? 'start'
            : highestX > chartWidth - padding.right - 70
              ? 'end'
              : 'middle';
          const labelX = anchor === 'start' ? highestX + 8 : anchor === 'end' ? highestX - 8 : highestX;
          const labelY = Math.max(padding.top + 12, yFor(highest.elevation) - 10);
          return (
            <g>
              <circle cx={highestX} cy={yFor(highest.elevation)} r="4" fill="#c96a3d" stroke="#fff" strokeWidth="2" />
              {!compact && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  className="fill-ink text-[11px] font-semibold"
                >
                  最高 {Math.round(highest.elevation)}m
                </text>
              )}
            </g>
          );
        })()}

        {lowest && (() => {
          const lowestX = xForDistance(lowest.distance);
          const anchor = lowestX < padding.left + 70
            ? 'start'
            : lowestX > chartWidth - padding.right - 70
              ? 'end'
              : 'middle';
          const labelX = anchor === 'start' ? lowestX + 8 : anchor === 'end' ? lowestX - 8 : lowestX;
          const labelY = Math.max(padding.top + 12, yFor(lowest.elevation) - 8);
          return (
            <g>
              <circle cx={lowestX} cy={yFor(lowest.elevation)} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              {!compact && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  className="fill-muted-foreground text-[11px]"
                >
                  最低 {Math.round(lowest.elevation)}m
                </text>
              )}
            </g>
          );
        })()}

        <circle cx={xFor(0)} cy={yFor(samples[0].elevation)} r="4.5" fill="#2f6f55" stroke="#fff" strokeWidth="2" />
        <circle
          cx={xFor(samples.length - 1)}
          cy={yFor(samples[samples.length - 1].elevation)}
          r="4.5"
          fill="#c96a3d"
          stroke="#fff"
          strokeWidth="2"
        />

        {active && activeIndex != null && (
          <g>
            <line
              x1={xFor(activeIndex)}
              y1={padding.top}
              x2={xFor(activeIndex)}
              y2={chartHeight - padding.bottom}
              stroke="#1f4d3a"
              strokeOpacity="0.35"
              strokeDasharray="3 4"
            />
            <circle
              cx={xFor(activeIndex)}
              cy={yFor(active.elevation)}
              r="5"
              fill="#fff"
              stroke="#1f4d3a"
              strokeWidth="2.5"
            />
            {(() => {
              const tooltipWidth = 136;
              const tooltipHeight = 42;
              const rawX = xFor(activeIndex) - tooltipWidth / 2;
              const x = Math.max(padding.left, Math.min(chartWidth - padding.right - tooltipWidth, rawX));
              const y = Math.max(padding.top, Math.min(chartHeight - padding.bottom - tooltipHeight - 6, yFor(active.elevation) - tooltipHeight - 12));
              return (
                <g>
                  <rect x={x} y={y} width={tooltipWidth} height={tooltipHeight} rx="7" fill="#1f2933" opacity="0.94" />
                  <text x={x + 10} y={y + 17} className="fill-white text-[11px] font-medium">
                    {formatDistance(active.distance)}km · {Math.round(active.elevation)}m
                  </text>
                  <text x={x + 10} y={y + 32} className="fill-white/75 text-[10px]">
                    坡度 {active.grade > 0 ? '+' : ''}{active.grade.toFixed(1)}%
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-[#2f6f55]" />平缓 / 上坡</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-[#d97706]" />较陡</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-[#c2410c]" />陡坡</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-[#3b82f6]" />下坡</span>
      </div>
    </div>
  );
};

export default ElevationProfile;
