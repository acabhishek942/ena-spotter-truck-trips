import React, { useState } from 'react';
import { TripPlannerInput } from './types';

export default function App() {
  const [formData, setFormData] = useState<TripPlannerInput>({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsed: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'currentCycleUsed' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dispatched Telemetry Request to Django Engine:', formData);
    // API Call pipeline integration hooks will insert here smoothly
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#1a1a1a', margin: 0 }}>Automated ELD Log & Route Planner</h1>
        <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>FMCSA 70-Hour / 8-Day Compliant Route Optimization Engine</p>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <section style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem' }}>Trip Parameters</h2>
          <form onSubmit={handleFormSubmission}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Current Location</label>
              <input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pickup Location</label>
              <input type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Drop-off Location</label>
              <input type="text" name="dropoffLocation" value={formData.dropoffLocation} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} required />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Current Cycle Used (Hours)</label>
              <input type="number" name="currentCycleUsed" min="0" max="70" step="0.25" value={formData.currentCycleUsed} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0066cc', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Generate Optimized Route & Logs
            </button>
          </form>
        </section>

        <section style={{ border: '2px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Interactive Map and Programmatic ELD Log Output Layout Preview Pane
        </section>
      </main>
    </div>
  );
}