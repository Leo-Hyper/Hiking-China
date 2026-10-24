import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteExtra } from '@client/src/data/hiking-types';
import { baseRasterLayer } from '@client/src/utils/map-tiles';

interface RouteMapProps {
  /** [lng, lat] pairs, matching GeoJSON order. */
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

    const path: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);
    let centerLat: number = 30.5;
    let centerLng: number = 104.0;
    const zoom: number = 10;
    if (path.length > 0) {
      centerLat = path[0][0];
      centerLng = path[0][1];
    }

    const map: L.Map = L.map(container).setView([centerLat, centerLng], zoom);

    baseRasterLayer().addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    if (path.length > 0) {
      const start: [number, number] = path[0];
      L.marker(start, {
        icon: L.divIcon({
          className: '',
          html: '<div style="background:#2f6f55;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">起</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
    }

    if (path.length > 1) {
      const outline: L.Polyline = L.polyline(path, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.9,
      }).addTo(map);
      const polyline: L.Polyline = L.polyline(path, {
        color: '#2f6f55',
        weight: 4,
        opacity: 0.95,
      }).addTo(map);

      const end: [number, number] = path[path.length - 1];

      if (end) {
        L.marker(end, {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#c96a3d;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">终</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
      }

      map.fitBounds(outline.getBounds(), { padding: [40, 40], maxZoom: 16 });
    } else if (path.length === 1) {
      map.setView(path[0], 13);
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
        <div>
          <h3 className="text-sm font-bold text-charcoal">{title}</h3>
          <p className="text-[11px] text-slate-500">游记轨迹 · 仅用于本帖展示，未进入路线库</p>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-[320px] w-full md:h-[400px]" />
    </div>
  );
};

export default RouteMap;
