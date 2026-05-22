// frontend/src/services/mapService.ts

export interface RouteData {
  deadheadDistance: number;
  deadheadDuration: number;
  transitDistance: number;
  transitDuration: number;
  coordinates: [number, number][]; 
  currentCoords: [number, number];
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
export const fetchRoute = async (
  current: [number, number], 
  pickup: [number, number], 
  dropoff: [number, number]
): Promise<RouteData> => {
  // Format: lng,lat;lng,lat;lng,lat
  const coords = `${current[1]},${current[0]};${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}`;
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
  const data = await response.json();

  if (data.code !== 'Ok') throw new Error('Could not calculate a route between these locations.');

  const route = data.routes[0];
  const legs = route.legs;

  // Leg 0: Current to Pickup
  const deadheadDistance = legs[0].distance * 0.000621371;
  const deadheadDuration = legs[0].duration / 3600;

  // Leg 1: Pickup to Dropoff
  const transitDistance = legs[1].distance * 0.000621371;
  const transitDuration = legs[1].duration / 3600;

  const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);

  return {
    deadheadDistance: parseFloat(deadheadDistance.toFixed(2)),
    deadheadDuration: parseFloat(deadheadDuration.toFixed(2)),
    transitDistance: parseFloat(transitDistance.toFixed(2)),
    transitDuration: parseFloat(transitDuration.toFixed(2)),
    coordinates,
    currentCoords: current,
    pickupCoords: pickup,
    dropoffCoords: dropoff,
  };
};