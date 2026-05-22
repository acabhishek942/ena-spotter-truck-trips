import React, { useState } from 'react';
import { geocodeAddress, fetchRoute, type RouteData } from './services/mapService';
import { fetchTripPlan } from './api';
import RouteMapVisualizer from './components/RouteMapVisualizer';
import EldLogGrid from './components/EldLogGrid';
import TruckerLoader from './components/TruckerLoader';

export default function App() {
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [hosData, setHosData] = useState<any>(null);
  
  // Exact coordinates for the map markers
  const [pinCoords, setPinCoords] = useState<{start: [number, number], pickup: [number, number], drop: [number, number]} | null>(null);

  // COMPLETELY DYNAMIC INITIAL STATE: No hardcoded cities
  const [formData, setFormData] = useState({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsed: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'currentCycleUsed' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStatus('Geocoding logistics coordinates...');
    setError('');
    
    try {
      const currentCoords = await geocodeAddress(formData.currentLocation);
      const pickupCoords = await geocodeAddress(formData.pickupLocation);
      const dropoffCoords = await geocodeAddress(formData.dropoffLocation);

      // Save the exact dynamic coordinates
      setPinCoords({
        start: currentCoords,
        pickup: pickupCoords,
        drop: dropoffCoords
      });

      setLoadingStatus('Routing optimal interstate path...');
      const mapRoute = await fetchRoute(currentCoords, pickupCoords, dropoffCoords);
      setRouteData(mapRoute);

      setLoadingStatus('Compiling FMCSA 24-Hour Logs...');
      const response = await fetchTripPlan({
        ...formData,
        deadheadMiles: mapRoute.deadheadDistance,
        deadheadHours: mapRoute.deadheadDuration,
        transitMiles: mapRoute.transitDistance,
        transitHours: mapRoute.transitDuration,
      });
      
      setHosData(response);
      setIsFormExpanded(false);

    } catch (err: any) {
      setError(err.message || 'Routing computation failed.');
    } finally {
      setLoadingStatus('');
    }
  };

  return (
    <div className="absolute inset-0 m-0 p-0 overflow-hidden bg-slate-950 text-slate-200 flex flex-col font-sans">
      {loadingStatus && <TruckerLoader statusText={loadingStatus} />}

      <header className="bg-[#0b0f19] border-b border-slate-800 shadow-2xl z-20 flex-shrink-0 w-full">
        {isFormExpanded ? (
          <div className="p-6 w-full mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-black text-white tracking-wide uppercase">ELD Fleet Logbook Engine</h1>
                <p className="text-xs text-blue-400 font-mono mt-0.5">Telemetry Operational Configuration</p>
              </div>
              {hosData && (
                <button type="button" onClick={() => setIsFormExpanded(false)} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Cancel Edit ✕
                </button>
              )}
            </div>
            
            <form onSubmit={handleFormSubmission} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end w-full">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 tracking-wider">Current Location</label>
                <input type="text" name="currentLocation" placeholder="e.g. Dallas, TX" value={formData.currentLocation} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 tracking-wider">Pickup Location</label>
                <input type="text" name="pickupLocation" placeholder="e.g. Austin, TX" value={formData.pickupLocation} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 tracking-wider">Drop Location</label>
                <input type="text" name="dropoffLocation" placeholder="e.g. Chicago, IL" value={formData.dropoffLocation} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 tracking-wider">Pre-Used Cycle (Hrs)</label>
                <input type="number" name="currentCycleUsed" min="0" max="70" step="0.25" value={formData.currentCycleUsed} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500" required />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white rounded-lg shadow-lg tracking-wide transition-all duration-150 cursor-pointer">
                Compute Route Matrix
              </button>
            </form>
            {error && <div className="mt-3 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg font-mono">{error}</div>}
          </div>
        ) : (
          <div className="px-6 py-4 flex items-center justify-between bg-[#0b0f19] w-full">
            <div className="flex items-center gap-6">
              <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Telemetry Stream
              </h1>
              <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-white font-bold">{formData.pickupLocation.toUpperCase()}</span>
                <span className="text-slate-600">→</span>
                <span className="text-white font-bold">{formData.dropoffLocation.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-xs font-mono text-slate-400">
                CYCLE HOURS STACKED: <span className="text-blue-400 font-black">{hosData?.cycle_remaining?.toFixed(2) || '0.00'} hrs</span>
              </div>
              <button type="button" onClick={() => setIsFormExpanded(true)} className="text-xs px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md font-semibold text-slate-200 transition-all cursor-pointer">
                Modify Metrics
              </button>
            </div>
          </div>
        )}
      </header>

      {!hosData ? (
         <div className="flex-1 w-full flex flex-col items-center justify-center text-slate-500 bg-[#060913] font-mono text-xs tracking-wider gap-2">
            <span className="animate-pulse">▲ Ingest parameter fields above to activate analytical layers ▲</span>
         </div>
      ) : (
        <main className="flex-1 w-full flex flex-col xl:flex-row overflow-hidden min-h-0 min-w-0">
          <section className="h-2/5 xl:h-full xl:w-[40%] border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-950 relative min-h-0 w-full">
             
             {/* PASSED DYNAMIC LOCATIONS TO MAP COMPONENT */}
             <RouteMapVisualizer 
                routeData={routeData} 
                pinCoords={pinCoords} 
                locations={{
                  start: formData.currentLocation,
                  pickup: formData.pickupLocation,
                  drop: formData.dropoffLocation
                }}
              />
          
          </section>
          <section className="h-3/5 xl:h-full xl:w-[60%] flex flex-col bg-[#060912] p-6 overflow-hidden min-h-0 min-w-0 w-full">
             <EldLogGrid timeline={hosData.timeline} />
          </section>
        </main>
      )}
    </div>
  );
}