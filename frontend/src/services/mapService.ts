// frontend/src/services/mapService.ts

export interface RouteData {
  distanceMiles: number;
  durationHours: number;
  coordinates: [number, number][]; // Array of [lat, lng] for drawing the polyline
  pickupCoords: [number, number];
  dropoffCoords: [number, number];
}

// 1. Geocoding using OpenStreetMap's free Nominatim API
export const geocodeAddress = async (query: string): Promise<[number, number]> => {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!data || data.length === 0) throw new Error(`Could not find coordinates for: ${query}`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
};

// 2. Routing using the free Open Source Routing Machine (OSRM)
export const fetchRoute = async (pickup: [number, number], dropoff: [number, number]): Promise<RouteData> => {
  // OSRM expects coordinates in [Longitude, Latitude] format
  const coords = `${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}`;
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
  const data = await response.json();

  if (data.code !== 'Ok') throw new Error('Could not calculate a driving route between these locations.');

  const route = data.routes[0];
  
  // Convert meters to miles and seconds to hours
  const distanceMiles = route.distance * 0.000621371;
  const durationHours = route.duration / 3600;

  // OSRM returns GeoJSON [lng, lat], but Leaflet maps expect [lat, lng]
  const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

  return {
    distanceMiles: parseFloat(distanceMiles.toFixed(2)),
    durationHours: parseFloat(durationHours.toFixed(2)),
    coordinates,
    pickupCoords: pickup,
    dropoffCoords: dropoff,
  };
};