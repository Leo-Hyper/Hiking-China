import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteTrackMapProps {
  coordinates: [number, number, number?][];
  className?: string;
}

const RouteTrackMap = ({ coordinates, className = '' }: RouteTrackMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || coordinates.length < 2) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const latLngs: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);
    const line = L.polyline(latLngs, {
      color: '#2f6f55',
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    L.circleMarker(latLngs[0], {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#2f6f55',
      fillOpacity: 1,
    }).addTo(map).bindTooltip('起点');

    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#c96a3d',
      fillOpacity: 1,
    }).addTo(map).bindTooltip('终点');

    map.fitBounds(line.getBounds(), { padding: [30, 30] });
    const timer = window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.clearTimeout(timer);
      map.remove();
    };
  }, [coordinates]);

  if (coordinates.length < 2) {
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-sm text-muted-foreground ${className}`}>
        该路线暂未上传 GPX 轨迹
      </div>
    );
  }

  return <div ref={containerRef} className={`overflow-hidden rounded-xl border border-border ${className}`} />;
};

export default RouteTrackMap;
