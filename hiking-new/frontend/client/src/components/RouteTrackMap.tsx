import { useEffect, useRef } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface RouteTrackMapProps {
  coordinates: [number, number, number?][];
  className?: string;
  compact?: boolean;
  activePointIndex?: number | null;
  onHoverIndex?: (index: number | null) => void;
}

const MAPTILER_KEY = String(import.meta.env.VITE_MAPTILER_KEY || '').trim();

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors | Humanitarian OpenStreetMap Team',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

function mapStyle(): string | StyleSpecification {
  if (!MAPTILER_KEY) return FALLBACK_STYLE;
  return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${encodeURIComponent(MAPTILER_KEY)}`;
}

function pointElement(label: string, tone: 'start' | 'end'): HTMLDivElement {
  const element = document.createElement('div');
  const background = tone === 'start' ? '#2f6f55' : '#c96a3d';
  element.textContent = label;
  element.style.cssText = [
    'display:grid',
    'place-items:center',
    'width:26px',
    'height:26px',
    'border-radius:9999px',
    `background:${background}`,
    'border:2px solid #fff',
    'box-shadow:0 2px 8px rgba(15,23,42,.3)',
    'color:#fff',
    'font-size:11px',
    'font-weight:700',
    'line-height:1',
  ].join(';');
  return element;
}

function activeElement(): HTMLDivElement {
  const element = document.createElement('div');
  element.style.cssText = [
    'width:16px',
    'height:16px',
    'border-radius:9999px',
    'background:#c96a3d',
    'border:3px solid #fff',
    'box-shadow:0 1px 7px rgba(15,23,42,.35)',
  ].join(';');
  return element;
}

function arrowImage(): ImageData {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return new ImageData(size, size);
  context.translate(size / 2, size / 2);
  context.fillStyle = '#1f4d3a';
  context.strokeStyle = '#ffffff';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -7);
  context.lineTo(6.5, 7);
  context.lineTo(0, 4);
  context.lineTo(-6.5, 7);
  context.closePath();
  context.fill();
  context.stroke();
  return context.getImageData(0, 0, size, size);
}

const RouteTrackMap = ({
  coordinates,
  className = '',
  compact = false,
  activePointIndex = null,
  onHoverIndex,
}: RouteTrackMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const activeIndexRef = useRef<number | null>(activePointIndex);
  const hoverHandlerRef = useRef<typeof onHoverIndex>(onHoverIndex);

  useEffect(() => {
    hoverHandlerRef.current = onHoverIndex;
  }, [onHoverIndex]);

  useEffect(() => {
    activeIndexRef.current = activePointIndex;
    const map = mapRef.current;
    if (!map) return;
    if (activePointIndex == null || !coordinates[activePointIndex]) {
      activeMarkerRef.current?.remove();
      activeMarkerRef.current = null;
      return;
    }
    const [lng, lat] = coordinates[activePointIndex];
    if (!activeMarkerRef.current) {
      activeMarkerRef.current = new maplibregl.Marker({ element: activeElement() })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      activeMarkerRef.current.setLngLat([lng, lat]);
    }
  }, [activePointIndex, coordinates]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || coordinates.length < 2) return;

    const map = new maplibregl.Map({
      container,
      style: mapStyle(),
      center: [coordinates[0][0], coordinates[0][1]],
      zoom: 11,
      minZoom: 3,
      maxZoom: 18,
      maxPitch: 0,
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: false,
      scrollZoom: false,
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    if (!compact) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      map.addControl(new maplibregl.FullscreenControl(), 'top-left');
    }

    const startMarker = new maplibregl.Marker({
      element: pointElement('起', 'start'),
      anchor: 'center',
    })
      .setLngLat([coordinates[0][0], coordinates[0][1]])
      .addTo(map);
    const endPoint = coordinates[coordinates.length - 1];
    const endMarker = new maplibregl.Marker({
      element: pointElement('终', 'end'),
      anchor: 'center',
    })
      .setLngLat([endPoint[0], endPoint[1]])
      .addTo(map);

    if (activeIndexRef.current != null && coordinates[activeIndexRef.current]) {
      const [lng, lat] = coordinates[activeIndexRef.current];
      activeMarkerRef.current = new maplibregl.Marker({ element: activeElement() })
        .setLngLat([lng, lat])
        .addTo(map);
    }

    const lngs = coordinates.map((point) => point[0]);
    const lats = coordinates.map((point) => point[1]);
    const bounds: maplibregl.LngLatBoundsLike = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];

    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.map(([lng, lat]) => [lng, lat]),
          },
        },
      });

      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-opacity': 0.92,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 6, 14, 10],
        },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#2f6f55',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 5],
        },
      });

      try {
        map.addImage('route-arrow', arrowImage());
        map.addLayer({
          id: 'route-arrows',
          type: 'symbol',
          source: 'route',
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 110,
            'icon-image': 'route-arrow',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.45, 14, 0.7],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        });
      } catch {
        // Direction arrows are decorative; the route remains usable without them.
      }

      map.fitBounds(bounds, {
        padding: compact ? 16 : 34,
        duration: 0,
        maxZoom: 15,
      });
    });

    let lastHoverAt = 0;
    let lastEmitted: number | null = null;
    map.on('mousemove', (event) => {
      const handler = hoverHandlerRef.current;
      if (!handler) return;
      const now = Date.now();
      if (now - lastHoverAt < 40) return;
      lastHoverAt = now;

      let nearest = 0;
      let nearestDistance = Infinity;
      for (let index = 0; index < coordinates.length; index += 1) {
        const projected = map.project([coordinates[index][0], coordinates[index][1]]);
        const dx = projected.x - event.point.x;
        const dy = projected.y - event.point.y;
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      }
      if (nearest !== lastEmitted) {
        lastEmitted = nearest;
        handler(nearest);
      }
    });
    map.on('mouseout', () => {
      lastEmitted = null;
      hoverHandlerRef.current?.(null);
    });
    map.on('error', (event) => {
      if (import.meta.env.DEV) console.warn('[MAP]', event.error?.message || event);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      startMarker.remove();
      endMarker.remove();
      activeMarkerRef.current?.remove();
      activeMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, compact]);

  if (coordinates.length < 2) {
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground ${className}`}>
        该路线暂未上传 GPX 轨迹
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-xl border border-border ${className}`}
    />
  );
};

export default RouteTrackMap;
