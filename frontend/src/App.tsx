// frontend/src/App.tsx
import React, { useState } from 'react';
import { fetchTripPlan, type HOSResponse } from './api';
import EldLogGrid from './components/EldLogGrid';
import { type TripPlannerInput } from './types';
import { geocodeAddress, fetchRoute, type RouteData } from './services/mapService';
import RouteMapVisualizer from './components/RouteMapVisualizer';

export default function App() {
  const [formData, setFormData] = useState<TripPlannerInput>({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsed: 0,
  });

  const [loading, setLoading] = useState(false);
  const [hosData, setHosData] = useState<HOSResponse | null>(null);
  const [error, setError] = useState('');

  // Add state for the route map data
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'currentCycleUsed' ? parseFloat(value) || 0 : value,
    }));
  };

const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStatus('Locating addresses...');
    setError('');
    
    try {
      // 1. Geocode the addresses
      const pickupCoords = await geocodeAddress(formData.pickupLocation);
      const dropoffCoords = await geocodeAddress(formData.dropoffLocation);

      // 2. Fetch the real driving route from OSRM
      setLoadingStatus('Calculating route distance...');
      const mapRoute = await fetchRoute(pickupCoords, dropoffCoords);
      setRouteData(mapRoute);

      // 3. Send the REAL calculated data to our Django HOS Engine
      setLoadingStatus('Generating FMCSA compliance logs...');
      const payload = {
        ...formData,
        totalMiles: mapRoute.distanceMiles,
        totalDrivingHours: mapRoute.durationHours,
      };
      
      const hosResponse = await fetchTripPlan(payload);
      setHosData(hosResponse);

    } catch (err: any) {
      setError(err.message || 'An error occurred during calculation.');
    } finally {
      setLoadingStatus('');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#1a1a1a', margin: 0 }}>Automated ELD Log Planner</h1>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <section style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>Trip Parameters</h2>
          <form onSubmit={handleFormSubmission}>
            {/* Same form inputs as before... */}
            <div style={{ marginBottom: '1rem' }}>
               <label>Current Location</label>
               <input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
               <label>Pickup Location</label>
               <input type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
               <label>Drop-off Location</label>
               <input type="text" name="dropoffLocation" value={formData.dropoffLocation} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
               <label>Current Cycle Used (Hrs)</label>
               <input type="number" name="currentCycleUsed" min="0" step="0.25" value={formData.currentCycleUsed} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0066cc', color: '#fff' }}>
              {loading ? 'Calculating Route...' : 'Generate Logs'}
            </button>
          </form>
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </section>

<section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {routeData ? (
             <>
               <RouteMapVisualizer routeData={routeData} />
               {hosData && <EldLogGrid timeline={hosData.timeline} />}
             </>
          ) : (
             <div style={{ border: '2px dashed #ccc', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
               Route map and logs will generate here...
             </div>
          )}
        </section>
      </main>
    </div>
  );
}