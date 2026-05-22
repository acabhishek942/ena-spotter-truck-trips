// frontend/src/components/RouteMapVisualizer.tsx
import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  routeData: {
    coordinates: [number, number][];
    pickupCoords: [number, number];
    dropoffCoords: [number, number];
  };
}

// Helper component to auto-zoom the map to fit the route bounds
function MapBoundsFitter({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 0) {
      map.fitBounds(coordinates, { padding: [50, 50] });
    }
  }, [map, coordinates]);
  return null;
}

export default function RouteMapVisualizer({ routeData }: RouteMapProps) {
  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
      <MapContainer 
        center={routeData.pickupCoords} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Clean, modern map tiles
        />
        
        {routeData.coordinates.length > 0 && (
          <>
            <MapBoundsFitter coordinates={routeData.coordinates} />
            
            {/* The Driving Route */}
            <Polyline positions={routeData.coordinates} color="#2B6CB0" weight={5} opacity={0.8} />
            
            {/* Pickup Marker */}
            <CircleMarker center={routeData.pickupCoords} radius={8} pathOptions={{ fillColor: '#48BB78', color: '#fff', weight: 2, fillOpacity: 1 }}>
              <Tooltip permanent direction="top">Pickup</Tooltip>
            </CircleMarker>

            {/* Dropoff Marker */}
            <CircleMarker center={routeData.dropoffCoords} radius={8} pathOptions={{ fillColor: '#E53E3E', color: '#fff', weight: 2, fillOpacity: 1 }}>
              <Tooltip permanent direction="top">Drop-off</Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  );
}