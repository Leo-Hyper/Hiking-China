import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteTrackMapProps {
  coordinates: [number, number, number?][];
  className?: string;
  compact?: boolean;
  activePointIndex?: number | null;
  onHoverIndex?: (index: number | null) => void;
}

function bearingDegrees(from: [number, number], to: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);
  const dLon = toRad(to[0] - from[0]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function pointIcon(label: string, tone: 'start' | 'end'): L.DivIcon {
  const background = tone === 'start' ? '#2f6f55' : '#c96a3d';
  return L.divIcon({
    className: 'hiking-map-point',
    html: `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:9999px;background:${background};border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.28);color:#fff;font-size:11px;font-weight:700;line-height:1">${label}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function arrowIcon(degrees: number): L.DivIcon {
  return L.divIcon({
    className: 'hiking-map-arrow',
    html: `<div style="transform:rotate(${degrees.toFixed(0)}deg);width:16px;height:16px;display:grid;place-items:center">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M7 1.5 L11.5 11 L7 8.8 L2.5 11 Z" fill="#1f4d3a" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const RouteTrackMap = ({
  coordinates,
  className = '',
  compact = false,
  activePointIndex = null,
  onHoverIndex,
}: RouteTrackMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.CircleMarker | null>(null);
  const activeIndexRef = useRef<number | null>(activePointIndex);
  const hoverHandlerRef = useRef<typeof onHoverIndex>(onHoverIndex);

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
      activeMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 6,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#c96a3d',
        fillOpacity: 1,
      }).addTo(map);
    } else {
      activeMarkerRef.current.setLatLng([lat, lng]);
    }
    activeMarkerRef.current.bringToFront();
  }, [activePointIndex, coordinates]);

  useEffect(() => {
    hoverHandlerRef.current = onHoverIndex;
  }, [onHoverIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || coordinates.length < 2) return;

    const map = L.map(container, {
      scrollWheelZoom: false,
      zoomControl: !compact,
      attributionControl: true,
      dragging: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; OpenStreetMap contributors | Humanitarian OpenStreetMap Team',
      maxZoom: 19,
      subdomains: 'abc',
    }).addTo(map);

    const latLngs: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);

    L.polyline(latLngs, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.85,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    const line = L.polyline(latLngs, {
      color: '#2f6f55',
      weight: 4,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    if (latLngs.length >= 6) {
      const arrowCount = Math.min(9, Math.max(3, Math.floor(latLngs.length / 60)));
      for (let index = 1; index <= arrowCount; index += 1) {
        const pointIndex = Math.floor((index / (arrowCount + 1)) * (latLngs.length - 1));
        const nextIndex = Math.min(latLngs.length - 1, pointIndex + 1);
        if (pointIndex === nextIndex) continue;
        L.marker(latLngs[pointIndex], {
          icon: arrowIcon(bearingDegrees(latLngs[pointIndex], latLngs[nextIndex])),
          interactive: false,
          keyboard: false,
        }).addTo(map);
      }
    }

    L.marker(latLngs[0], { icon: pointIcon('起', 'start'), keyboard: false })
      .addTo(map)
      .bindTooltip('起点', { direction: 'top', offset: [0, -12] });
    L.marker(latLngs[latLngs.length - 1], { icon: pointIcon('终', 'end'), keyboard: false })
      .addTo(map)
      .bindTooltip('终点', { direction: 'top', offset: [0, -12] });

    if (activeIndexRef.current != null && coordinates[activeIndexRef.current]) {
      const [lng, lat] = coordinates[activeIndexRef.current];
      activeMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 6,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#c96a3d',
        fillOpacity: 1,
      }).addTo(map);
    }

    map.fitBounds(line.getBounds(), { padding: compact ? [16, 16] : [34, 34] });
    if (!compact) L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    if (!compact && typeof container.requestFullscreen === 'function') {
      const FullscreenControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd() {
          const button = L.DomUtil.create(
            'button',
            'leaflet-bar hiking-map-fullscreen'
          ) as HTMLButtonElement;
          button.type = 'button';
          button.title = '全屏查看';
          button.setAttribute('aria-label', '全屏查看轨迹地图');
          button.innerHTML = '⛶';
          L.DomEvent.disableClickPropagation(button);
          L.DomEvent.on(button, 'click', () => {
            if (document.fullscreenElement) {
              void document.exitFullscreen();
            } else {
              void container.requestFullscreen();
            }
          });
          return button;
        },
      });
      map.addControl(new FullscreenControl());
    }

    let lastHoverAt = 0;
    let lastEmitted: number | null = null;
    map.on('mousemove', (event: L.LeafletMouseEvent) => {
      const handler = hoverHandlerRef.current;
      if (!handler) return;
      const now = Date.now();
      if (now - lastHoverAt < 40) return;
      lastHoverAt = now;
      let nearest = 0;
      let nearestDistance = Infinity;
      for (let index = 0; index < latLngs.length; index += 1) {
        const point = map.latLngToContainerPoint(latLngs[index]);
        const dx = point.x - event.containerPoint.x;
        const dy = point.y - event.containerPoint.y;
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

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);
    const onFullscreenChange = () => {
      window.setTimeout(() => map.invalidateSize(), 120);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    const timer = window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      resizeObserver.disconnect();
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
    <>
      <div ref={containerRef} className={`overflow-hidden rounded-xl border border-border ${className}`} />
      <style>{`
        .hiking-map-fullscreen {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #1f4d3a;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          border: 0;
        }
        .hiking-map-fullscreen:hover { background: #f0f6f2; }
        .leaflet-container:fullscreen { border-radius: 0; }
      `}</style>
    </>
  );
};

export default RouteTrackMap;
