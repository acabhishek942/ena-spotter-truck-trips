import React, { useState } from 'react';
import EldLogGrid, { type BackendTimelineEvent } from './EldLogGrid';

interface LogSheetCarouselProps {
  continuousTimeline: BackendTimelineEvent[];
}

export default function LogSheetCarousel({ continuousTimeline = [] }: LogSheetCarouselProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!continuousTimeline || continuousTimeline.length === 0) {
    return <EldLogGrid timeline={[]} />;
  }

  // Group timeline chunks into dedicated day frames (6 events per page layout threshold)
  const segmentPageCapacity = 6;
  const computedTotalPages = Math.ceil(continuousTimeline.length / segmentPageCapacity);

  const extractActiveTimelineChunk = () => {
    const trackingOffsetStart = currentPageIndex * segmentPageCapacity;
    return continuousTimeline.slice(trackingOffsetStart, trackingOffsetStart + segmentPageCapacity);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      
      {/* INTERNAL PAGINATION BAR CAROUSEL CONTROLLER */}
      <div className="w-full bg-[#0d1324] border border-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-lg flex-shrink-0">
        <button 
          type="button"
          onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
          disabled={currentPageIndex === 0}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all disabled:opacity-20 cursor-pointer select-none"
        >
          ← PREV SHEET
        </button>
        
        <div className="text-center">
          <span className="text-sm font-bold text-white tracking-wide">
            LOG SHEET PAGE {currentPageIndex + 1} <span className="text-slate-500 font-normal">/</span> {computedTotalPages || 1}
          </span>
        </div>

        <button 
          type="button"
          onClick={() => setCurrentPageIndex(prev => Math.min(computedTotalPages - 1, prev + 1))}
          disabled={currentPageIndex >= computedTotalPages - 1}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all disabled:opacity-20 cursor-pointer select-none"
        >
          NEXT SHEET →
        </button>
      </div>

      {/* DYNAMIC CANVAS WRAPPER PASSING TRANSFORMED VALUES */}
      <div className="w-full flex-1 min-h-0">
        <EldLogGrid timeline={extractActiveTimelineChunk()} />
      </div>

    </div>
  );
}