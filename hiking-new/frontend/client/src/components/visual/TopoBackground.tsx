interface TopoBackgroundProps {
  className?: string;
  animated?: boolean;
}

interface RingCluster {
  cx: number;
  cy: number;
  blobCx: number;
  blobCy: number;
  path: string;
  scales: number[];
  peakLabel?: string;
}

const BLOB_MAIN =
  'M400,210 C470,204 532,240 546,296 C560,352 522,412 456,430 C388,448 308,432 270,382 C232,332 244,262 300,230 C332,212 360,213 400,210 Z';
const BLOB_SMALL =
  'M200,168 C252,154 306,176 318,218 C330,262 300,306 250,314 C198,322 146,298 134,254 C122,210 148,182 200,168 Z';

const CLUSTERS: RingCluster[] = [
  {
    cx: 400,
    cy: 322,
    blobCx: 400,
    blobCy: 322,
    path: BLOB_MAIN,
    scales: [0.18, 0.34, 0.5, 0.66, 0.82, 0.98, 1.14, 1.3],
    peakLabel: '5200',
  },
  {
    cx: 692,
    cy: 86,
    blobCx: 224,
    blobCy: 234,
    path: BLOB_SMALL,
    scales: [0.7, 1.0, 1.35, 1.75],
    peakLabel: '3860',
  },
  {
    cx: 84,
    cy: 566,
    blobCx: 224,
    blobCy: 234,
    path: BLOB_SMALL,
    scales: [0.55, 0.9, 1.3],
  },
];

const TopoBackground = ({ className = '', animated = false }: TopoBackgroundProps) => {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 640"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute ${animated ? '-inset-[4%] topo-drift' : 'inset-0'} h-full w-full ${className}`}
    >
      {CLUSTERS.map((cluster: RingCluster, clusterIdx: number) => (
        <g key={`cluster-${clusterIdx}`} stroke="currentColor">
          {cluster.scales.map((scale: number, ringIdx: number) => (
            <path
              key={`ring-${ringIdx}`}
              d={cluster.path}
              vectorEffect="non-scaling-stroke"
              strokeWidth={ringIdx % 3 === 1 ? 1.5 : 1}
              strokeDasharray={ringIdx === cluster.scales.length - 1 ? '3 6' : undefined}
              opacity={Math.max(0.35, 1 - ringIdx * 0.09)}
              transform={`translate(${cluster.cx} ${cluster.cy}) rotate(${ringIdx * 14}) scale(${scale}) translate(${-cluster.blobCx} ${-cluster.blobCy})`}
            />
          ))}
          {cluster.peakLabel && (
            <g>
              <path
                d={`M${cluster.cx - 5} ${cluster.cy - 5} L${cluster.cx + 5} ${cluster.cy + 5} M${cluster.cx - 5} ${cluster.cy + 5} L${cluster.cx + 5} ${cluster.cy - 5}`}
                strokeWidth={1.2}
              />
              <text
                x={cluster.cx + 12}
                y={cluster.cy + 4}
                fontSize={10}
                letterSpacing={2.5}
                fill="currentColor"
                stroke="none"
                className="font-data"
              >
                {cluster.peakLabel}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* 独立测量点 */}
      <g fill="currentColor" stroke="none" opacity={0.9}>
        <circle cx={152} cy={138} r={2} />
        <text x={162} y={142} fontSize={9} letterSpacing={2} className="font-data">
          4150
        </text>
      </g>
    </svg>
  );
};

export default TopoBackground;
