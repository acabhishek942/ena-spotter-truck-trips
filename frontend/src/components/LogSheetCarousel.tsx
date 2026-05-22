// frontend/src/components/LogSheetCarousel.tsx
import React, { useState, useMemo } from 'react';
import EldLogGrid from './EldLogGrid';
import { chunkTimelineIntoDays, type TimelineEvent } from '../utils/hosTransformer';

interface LogSheetCarouselProps {
  continuousTimeline: TimelineEvent[];
}

export default function LogSheetCarousel({ continuousTimeline }: LogSheetCarouselProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Memoize the transformation so it only recalculates when new API data arrives
  const dailySheets = useMemo(() => {
    return chunkTimelineIntoDays(continuousTimeline);
  }, [continuousTimeline]);

  if (dailySheets.length === 0) return null;

  const currentSheet = dailySheets[currentDayIndex];
  const isFirstDay = currentDayIndex === 0;
  const isLastDay = currentDayIndex === dailySheets.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <button 
          onClick={() => setCurrentDayIndex(prev => prev - 1)}
          disabled={isFirstDay}
          style={{ padding: '0.5rem 1rem', cursor: isFirstDay ? 'not-allowed' : 'pointer', opacity: isFirstDay ? 0.5 : 1, fontWeight: 'bold' }}
        >
          &larr; Previous Day
        </button>
        
        <h3 style={{ margin: 0, color: '#2D3748' }}>
          Day {currentSheet.dayNumber} of {dailySheets.length}
        </h3>
        
        <button 
          onClick={() => setCurrentDayIndex(prev => prev + 1)}
          disabled={isLastDay}
          style={{ padding: '0.5rem 1rem', cursor: isLastDay ? 'not-allowed' : 'pointer', opacity: isLastDay ? 0.5 : 1, fontWeight: 'bold' }}
        >
          Next Day &rarr;
        </button>
      </div>

      {/* Render the specific 24-hour grid for the selected day */}
      <EldLogGrid timeline={currentSheet.events} />
      
    </div>
  );
}