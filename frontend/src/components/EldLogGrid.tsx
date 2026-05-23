import { useState, useRef, useEffect } from 'react';

export interface BackendTimelineEvent {
  line: number;
  duration: number;
  location: string;
  description: string;
}

interface EldLogGridProps {
  timeline?: BackendTimelineEvent[];
}

const ROW_LABELS: Record<number, string> = {
  1: 'OFF DUTY', 2: 'SLEEPER BERTH', 3: 'DRIVING', 4: 'ON DUTY',
};
// Precise Y coordinates for the 4 rows
const ROW_Y: Record<number, number> = { 1: 60, 2: 140, 3: 220, 4: 300 };
const SVG_HEIGHT = 450;

export default function EldLogGrid({ timeline = [] }: EldLogGridProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  
  // THE FIX: Refs and State to track the exact width of the user's screen
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(800); // Default fallback width

  // Dynamically measure the container so the 24 hours fit exactly without a scrollbar
  useEffect(() => {
    if (!gridContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      // Subtract a small buffer (20px) to ensure no edge bleed
      setGridWidth(entries[0].contentRect.width - 20); 
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Now, 1 hour dynamically shrinks or grows to fit the screen
  const PIXELS_PER_HOUR = gridWidth / 24;

  // 1. Calculate absolute hours for the entire trip
  const accumulatedEvents = timeline.map((event, i, arr) => {
    const startHour = arr.slice(0, i).reduce((sum, e) => sum + e.duration, 0);
    return { ...event, startHour, endHour: startHour + event.duration };
  });

  const totalHours = accumulatedEvents.length > 0 ? accumulatedEvents[accumulatedEvents.length - 1].endHour : 0;
  const totalPages = Math.ceil(totalHours / 24) || 1;

  // 2. Slice and clip data for ONLY the currently selected day
  const dayStartHour = currentDayIndex * 24;
  const dayEndHour = dayStartHour + 24;

  const currentDayEvents = accumulatedEvents
    .filter(e => e.startHour < dayEndHour && e.endHour > dayStartHour)
    .map(e => ({
      ...e,
      displayStart: Math.max(0, e.startHour - dayStartHour),
      displayEnd: Math.min(24, e.endHour - dayStartHour)
    }));

  // 3. Calculate summary specifically for the visible day
  const dailySummary = currentDayEvents.reduce((acc, e) => {
    const duration = e.displayEnd - e.displayStart;
    return { ...acc, [e.line]: (acc[e.line] || 0) + duration };
  }, {} as Record<number, number>);

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      
      {/* --- TOP HEADER & DROPDOWN --- */}
      <div className="bg-[#0a0f1d] p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex gap-6">
          {[1,2,3,4].map(l => (
            <div key={l}>
              <div className="text-[9px] text-slate-500 uppercase">{ROW_LABELS[l]}</div>
              <div className="text-sm font-black text-blue-400">{(dailySummary[l] || 0).toFixed(1)}h</div>
            </div>
          ))}
        </div>
        <select 
          value={currentDayIndex} 
          onChange={(e) => setCurrentDayIndex(Number(e.target.value))} 
          className="bg-slate-800 text-white text-xs px-3 py-1 rounded border border-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <option key={i} value={i}>Day {i + 1}</option>
          ))}
        </select>
      </div>

      {/* --- NAVIGATION BUTTONS --- */}
      <div className="p-2 border-b border-slate-800 flex justify-between bg-[#0a0f1d] shrink-0">
        <button 
          onClick={() => setCurrentDayIndex(p => Math.max(0, p - 1))} 
          disabled={currentDayIndex === 0} 
          className="text-xs bg-slate-800 px-4 py-1.5 rounded text-white font-bold disabled:opacity-30 transition-opacity"
        >
          ← PREV
        </button>
        <span className="text-xs font-bold text-blue-400 flex items-center">DAY {currentDayIndex + 1} / {totalPages}</span>
        <button 
          onClick={() => setCurrentDayIndex(p => Math.min(totalPages - 1, p + 1))} 
          disabled={currentDayIndex >= totalPages - 1} 
          className="text-xs bg-blue-600 px-4 py-1.5 rounded text-white font-bold disabled:opacity-30 transition-opacity"
        >
          NEXT →
        </button>
      </div>

      {/* --- ELD GRAPH (Responsive, Scroll-Free Flex Layout) --- */}
      {/* THE FIX: overflow-hidden strictly forbids scrollbars. */}
      <div className="w-full flex-1 flex overflow-hidden bg-[#050811] p-4">
        
        {/* Left Side: Y-Axis Labels */}
        <div className="w-[120px] shrink-0 relative border-r border-slate-800 mr-4">
          {[1, 2, 3, 4].map(l => (
            <div 
              key={l} 
              style={{ top: `${ROW_Y[l]}px` }}
              className="absolute w-full -translate-y-1/2 pr-4 text-right font-bold text-[10px] text-slate-300 uppercase tracking-widest"
            >
              {ROW_LABELS[l]}
            </div>
          ))}
        </div>
        
        {/* Right Side: The SVG Grid */}
        <div ref={gridContainerRef} className="flex-1 relative h-full">
          <svg width={gridWidth} height={SVG_HEIGHT} style={{ overflow: 'visible' }}>
            
            {/* Draw 25 Vertical Grid Lines (00:00 to 24:00) */}
            {Array.from({ length: 25 }).map((_, i) => (
              <g key={i}>
                <line x1={i * PIXELS_PER_HOUR} y1="20" x2={i * PIXELS_PER_HOUR} y2="340" stroke="#1e293b" strokeWidth="1" />
                <text x={i * PIXELS_PER_HOUR} y="10" className="text-[9px] fill-slate-500 font-mono" textAnchor="middle">
                  {`${String(i).padStart(2, '0')}:00`}
                </text>
              </g>
            ))}
            
            {/* Draw 4 Horizontal Status Lines */}
            {[1, 2, 3, 4].map(l => (
              <line key={l} x1="0" y1={ROW_Y[l]} x2={gridWidth} y2={ROW_Y[l]} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            
            {/* Draw the Blue Action Path */}
            <path d={currentDayEvents.reduce((d, e, i) => {
              const startX = e.displayStart * PIXELS_PER_HOUR;
              const endX = e.displayEnd * PIXELS_PER_HOUR;
              const y = ROW_Y[e.line];
              return d + (i === 0 ? `M ${startX} ${y} L ${endX} ${y}` : ` L ${startX} ${y} L ${endX} ${y}`);
            }, "")} stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Draw Event Waypoints and Labels */}
            {currentDayEvents.map((e, i) => (
              <g key={i}>
                {/* Node Dot */}
                <circle cx={e.displayStart * PIXELS_PER_HOUR} cy={ROW_Y[e.line]} r="4" fill="#050811" stroke="#38bdf8" strokeWidth="2" />
                {/* Vertical Drop Line */}
                <line x1={e.displayStart * PIXELS_PER_HOUR} y1={ROW_Y[e.line]} x2={e.displayStart * PIXELS_PER_HOUR} y2="360" stroke="#38bdf8" strokeDasharray="2 2" opacity="0.3" />
                {/* Location Text */}
                <text x={e.displayStart * PIXELS_PER_HOUR + 5} y="375" className="text-[9px] fill-blue-400 font-bold uppercase" transform={`rotate(-45 ${e.displayStart * PIXELS_PER_HOUR + 5} 375)`}>
                  {e.location}
                </text>
                {/* Description Text */}
                <text x={e.displayStart * PIXELS_PER_HOUR + 5} y="388" className="text-[9px] fill-slate-400 italic" transform={`rotate(-45 ${e.displayStart * PIXELS_PER_HOUR + 5} 388)`}>
                  {e.description}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}