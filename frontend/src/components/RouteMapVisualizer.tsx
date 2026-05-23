import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface RouteData {
  coordinates: Array<[number, number]>; 
  deadheadDistance: number;
  deadheadDuration: number;
  transitDistance: number;
  transitDuration: number;
}

interface RouteMapVisualizerProps {
  routeData: RouteData | null;
  pinCoords: {start: [number, number], pickup: [number, number], drop: [number, number]} | null;
  locations: {start: string, pickup: string, drop: string}; // Receives dynamic text from App
}

const createPin = (color: string) => L.divIcon({
  html: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${color}"></path>
           <circle cx="12" cy="10" r="3" fill="black"></circle>
         </svg>`,
  className: 'custom-map-pin',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapBoundsUpdater({ coordinates }: { coordinates: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      map.fitBounds(coordinates, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  return null;
}

export default function RouteMapVisualizer({ routeData, pinCoords, locations }: RouteMapVisualizerProps) {
  const hasCoordinates = routeData && routeData.coordinates && routeData.coordinates.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#070b14] overflow-hidden">
      <div className="w-full flex-1 relative min-h-0 z-10">
        
        {/* Only renders Map if pinCoords are present, anchoring cleanly to the dynamic start coordinate */}
        {pinCoords && (
          <MapContainer 
            center={pinCoords.start} 
            zoom={4} 
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {hasCoordinates && (
              <>
                <Polyline 
                  positions={routeData.coordinates} 
                  pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9 }} 
                />
                
                <Marker position={pinCoords.start} icon={createPin('#10b981')}>
                  <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
                    START: {locations.start.toUpperCase()}
                  </Tooltip>
                </Marker>
                
                <Marker position={pinCoords.pickup} icon={createPin('#f59e0b')}>
                  <Tooltip direction="bottom" offset={[0, 10]} opacity={1} permanent>
                    PICKUP: {locations.pickup.toUpperCase()}
                  </Tooltip>
                </Marker>
                
                <Marker position={pinCoords.drop} icon={createPin('#ef4444')}>
                  <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
                    DROP: {locations.drop.toUpperCase()}
                  </Tooltip>
                </Marker>

                <MapBoundsUpdater coordinates={routeData.coordinates} />
              </>
            )}
          </MapContainer>
        )}
      </div>

      <div className="p-4 bg-[#0a0f1d] border-t border-slate-800/80 grid grid-cols-2 gap-4 font-mono text-left flex-shrink-0">
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deadhead Freight</div>
          <div className="text-base font-black text-slate-100 mt-1">{(routeData?.deadheadDistance || 0).toFixed(1)} km</div>
          <div className="text-[11px] text-blue-400 font-medium mt-0.5">{(routeData?.deadheadDuration || 0).toFixed(2)} hrs</div>
        </div>
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Transit Voyage</div>
          <div className="text-base font-black text-slate-100 mt-1">{(routeData?.transitDistance || 0).toFixed(1)} km</div>
          <div className="text-[11px] text-blue-400 font-medium mt-0.5">{(routeData?.transitDuration || 0).toFixed(2)} hrs</div>
        </div>
      </div>
    </div>
  );
}