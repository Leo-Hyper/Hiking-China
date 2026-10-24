export type LatLng = [number, number];
export type LngLat = [number, number];

export function latLngToLngLat(points: LatLng[]): LngLat[] {
  return points.map(([lat, lng]) => [lng, lat]);
}

export function lngLatToLatLng(points: LngLat[]): LatLng[] {
  return points.map(([lng, lat]) => [lat, lng]);
}
