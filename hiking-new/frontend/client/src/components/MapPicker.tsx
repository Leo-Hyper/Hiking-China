import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { baseRasterLayer } from '@client/src/utils/map-tiles';

interface MapPickerProps {
  value: [number, number][];
  onChange: (coords: [number, number][]) => void;
}

interface MarkerPoint {
  lat: number;
  lng: number;
}

const DEFAULT_VIEW: [number, number] = [34.0, 104.0];
const DEFAULT_ZOOM = 4;

function samePoints(a: MarkerPoint[], b: MarkerPoint[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (point, index) =>
      Math.abs(point.lat - b[index].lat) < 1e-9 && Math.abs(point.lng - b[index].lng) < 1e-9
  );
}

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange }) => {
  const mapContainerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const mapRef: React.MutableRefObject<L.Map | null> = useRef<L.Map | null>(null);
  const markerLayerRef: React.MutableRefObject<L.LayerGroup | null> = useRef<L.LayerGroup | null>(null);
  const polylineRef: React.MutableRefObject<L.Polyline | null> = useRef<L.Polyline | null>(null);
  const outlineRef: React.MutableRefObject<L.Polyline | null> = useRef<L.Polyline | null>(null);
  const fittedRef: React.MutableRefObject<boolean> = useRef(false);
  const [markers, setMarkers] = useState<MarkerPoint[]>(() =>
    (value || []).map((c: [number, number]) => ({ lat: c[0], lng: c[1] }))
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map: L.Map = L.map(mapContainerRef.current).setView(DEFAULT_VIEW, DEFAULT_ZOOM);
    baseRasterLayer().addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    outlineRef.current = L.polyline([], { color: '#ffffff', weight: 7, opacity: 0.9 }).addTo(map);
    polylineRef.current = L.polyline([], { color: '#2f6f55', weight: 4, opacity: 0.95 }).addTo(map);
    mapRef.current = map;
    window.requestAnimationFrame(() => map.invalidateSize());

    map.on('click', (e: L.LeafletMouseEvent) => {
      setMarkers((prev: MarkerPoint[]) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the picker in sync when the parent loads a draft or an existing post.
  useEffect(() => {
    const incoming = (value || []).map(([lat, lng]) => ({ lat, lng }));
    setMarkers((prev) => (samePoints(prev, incoming) ? prev : incoming));
  }, [value]);

  // Center on existing points the first time they are available.
  useEffect(() => {
    const map: L.Map | null = mapRef.current;
    if (!map || markers.length === 0 || fittedRef.current) return;
    fittedRef.current = true;
    const bounds: L.LatLngBounds = L.latLngBounds(
      markers.map((m: MarkerPoint) => [m.lat, m.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // Redraw markers + sync to model
  useEffect(() => {
    const layer: L.LayerGroup | null = markerLayerRef.current;
    const polyline: L.Polyline | null = polylineRef.current;
    const outline: L.Polyline | null = outlineRef.current;
    if (!layer || !polyline || !outline) return;
    layer.clearLayers();
    const latLngs = markers.map((m: MarkerPoint) => [m.lat, m.lng] as [number, number]);
    outline.setLatLngs(latLngs);
    polyline.setLatLngs(latLngs);

    markers.forEach((m: MarkerPoint, i: number) => {
      const isStart: boolean = i === 0;
      const isEnd: boolean = i === markers.length - 1;
      const color: string = isStart ? '#2f6f55' : isEnd ? '#c96a3d' : '#3b82f6';
      const label: string = isStart ? '起' : isEnd ? '终' : String(i + 1);
      L.marker([m.lat, m.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:${color};color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">${label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(layer);
    });

    onChange(markers.map((m: MarkerPoint) => [m.lat, m.lng] as [number, number]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  const undoLastPoint = (): void => {
    setMarkers((prev: MarkerPoint[]) => prev.slice(0, -1));
  };

  const removePoint = (idx: number): void => {
    setMarkers((prev: MarkerPoint[]) => prev.filter((_: MarkerPoint, i: number) => i !== idx));
  };

  const clearAll = (): void => {
    setMarkers([]);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-[350px]" style={{ cursor: 'crosshair' }} />
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-t border-slate-100">
        <button type="button" onClick={undoLastPoint} disabled={markers.length === 0}
          className="px-2.5 py-1 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg disabled:opacity-30">撤销</button>
        <button type="button" onClick={clearAll} disabled={markers.length === 0}
          className="px-2.5 py-1 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg disabled:opacity-30">清空</button>
        <span className="text-xs text-slate-400 ml-auto">{markers.length} 个标记点</span>
      </div>
      {markers.length > 0 ? (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 max-h-[100px] overflow-y-auto">
          {markers.map((m: MarkerPoint, i: number) => (
            <div key={i} className="flex items-center gap-2 py-0.5 text-xs text-slate-600">
              <span className="font-mono text-forest-600 w-4">#{i + 1}</span>
              <span className="font-mono">{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</span>
              <button type="button" onClick={() => removePoint(i)} className="ml-auto text-slate-300 hover:text-red-400">&times;</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-xs text-slate-400 text-center bg-slate-50 border-t border-slate-100">
          点击地图添加路线标记点
        </div>
      )}
    </div>
  );
};

export default MapPicker;
