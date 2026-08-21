import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteExtra } from '@client/src/data/hiking-types';

interface RouteMapProps {
  coordinates: [number, number][];
  title?: string;
  routeInfo?: RouteExtra | null;
}

const RouteMap: React.FC<RouteMapProps> = ({ coordinates, title = '路线轨迹' }) => {
  const mapContainerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const hasData: boolean = coordinates && coordinates.length > 0;
  const coordsKey: string = JSON.stringify(coordinates || []);

  useEffect(() => {
    if (!hasData || !mapContainerRef.current) return;
    const container: HTMLDivElement = mapContainerRef.current;

    let centerLat: number = 30.5;
    let centerLng: number = 104.0;
    const zoom: number = 10;
    if (coordinates.length > 0) {
      centerLat = coordinates[0][0];
      centerLng = coordinates[0][1];
    }

    const map: L.Map = L.map(container).setView([centerLat, centerLng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
      subdomains: 'abc',
    }).addTo(map);

    if (coordinates.length > 1) {
      const polyline: L.Polyline = L.polyline(coordinates, {
        color: '#16a34a',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      const start: [number, number] = coordinates[0];
      const end: [number, number] = coordinates[coordinates.length - 1];

      if (start) {
        L.marker(start, {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#16a34a;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">起</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
      }
      if (end) {
        L.marker(end, {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#ef4444;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">终</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
      }

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, coordsKey]);

  if (!hasData) return null;

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-sm font-bold text-charcoal">{title}</h3>
      </div>
      <div ref={mapContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default RouteMap;
