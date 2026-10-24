import L from 'leaflet';

const MAPTILER_KEY = String(import.meta.env.VITE_MAPTILER_KEY || '').trim();

const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Humanitarian OpenStreetMap Team';

export function baseRasterLayer(): L.TileLayer {
  if (!MAPTILER_KEY) {
    return L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
      subdomains: 'abc',
    });
  }
  return L.tileLayer(
    `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${encodeURIComponent(MAPTILER_KEY)}`,
    {
      attribution: MAPTILER_ATTRIBUTION,
      maxZoom: 19,
      crossOrigin: true,
    }
  );
}
