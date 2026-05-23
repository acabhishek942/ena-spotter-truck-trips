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
const ROW_Y: Record<number, number> = { 1: 80, 2: 160, 3: 240, 4: 320 };

export default function EldLogGrid({ timeline = [] }: EldLogGridProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const PIXELS_PER_HOUR = 120;
  const PAGE_WIDTH = 24 * PIXELS_PER_HOUR; // Exactly 24 hours per view
  const SVG_HEIGHT = 500;

  // 1. Calculate absolute hours for the entire trip
  const accumulatedEvents = timeline.map((event, i, arr) => {
    const startHour = arr.slice(0, i).reduce((sum, e) => sum + e.duration, 0);
    return { ...event, startHour, endHour: startHour + event.duration };
  });

  const totalHours = accumulatedEvents.length > 0 ? accumulatedEvents[accumulatedEvents.length - 1].endHour : 0;
  const totalPages = Math.ceil(totalHours / 24) || 1;

  // 2. ARCHITECTURAL PIVOT: Slice and clip data for ONLY the current day
  const dayStartHour = currentDayIndex * 24;
  const dayEndHour = dayStartHour + 24;

  const currentDayEvents = accumulatedEvents
    .filter(e => e.startHour < dayEndHour && e.endHour > dayStartHour)
    .map(e => ({
      ...e,
      // Clip events that cross midnight boundaries so they fit perfectly in a 0-24 grid
      displayStart: Math.max(0, e.startHour - dayStartHour),
      displayEnd: Math.min(24, e.endHour - dayStartHour)
    }));

  // 3. Calculate summary specifically for the visible day
  const dailySummary = currentDayEvents.reduce((acc, e) => {
    const duration = e.displayEnd - e.displayStart;
    return { ...acc, [e.line]: (acc[e.line] || 0) + duration };
  }, {} as Record<number, number>);

  // Reset horizontal scroll to Midnight (left edge) whenever the user changes the day
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [currentDayIndex]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative">
      
      {/* --- TOP HEADER & DROPDOWN --- */}
      <div className="bg-[#0a0f1d] p-4 border-b border-slate-800 flex items-center justify-between">
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
          className="bg-slate-800 text-white text-xs px-3 py-1 rounded border border-slate-700 cursor-pointer outline-none"
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <option key={i} value={i}>Day {i + 1}</option>
          ))}
        </select>
      </div>

      {/* --- NAVIGATION BUTTONS --- */}
      <div className="p-2 border-b border-slate-800 flex justify-between bg-[#0a0f1d]">
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

      {/* --- ELD GRAPH (Exactly 24 Hours) --- */}
      {/* The scroll listener is entirely gone. The scroll here is ONLY for panning across the 24 hours of the active day. */}
      <div ref={scrollContainerRef} className="w-full flex-1 overflow-x-auto p-6 scrollbar-thin scrollbar-thumb-blue-600 pl-[180px]">
        
        {/* Y-Axis Labels (Fixed Position) */}
        <div className="absolute left-0 top-[180px] w-[160px] z-10 flex flex-col bg-[#050811]">
          {[1, 2, 3, 4].map(l => (
            <div key={l} className="h-[80px] flex items-center justify-center font-bold text-[11px] text-slate-300 uppercase tracking-widest">
              {ROW_LABELS[l]}
            </div>
          ))}
        </div>
        
        {/* SVG Grid */}
        <div style={{ width: `${PAGE_WIDTH + 100}px`, height: '100%' }}>
          <svg width={PAGE_WIDTH + 100} height={SVG_HEIGHT} style={{ overflow: 'visible' }}>
            
            {/* Draw 24 Vertical Grid Lines */}
            {Array.from({ length: 25 }).map((_, i) => (
              <g key={i}>
                <line x1={i * PIXELS_PER_HOUR} y1="40" x2={i * PIXELS_PER_HOUR} y2="360" stroke="#1e293b" strokeWidth="1" />
                <text x={i * PIXELS_PER_HOUR} y="380" className="text-[10px] fill-slate-500" textAnchor="middle">
                  {`${String(i).padStart(2, '0')}:00`}
                </text>
              </g>
            ))}
            
            {/* Draw 4 Horizontal Status Lines */}
            {[1, 2, 3, 4].map(l => (
              <line key={l} x1="0" y1={ROW_Y[l]} x2={PAGE_WIDTH} y2={ROW_Y[l]} stroke="#475569" strokeWidth="2" strokeDasharray="6 6" />
            ))}
            
            {/* Draw the Blue Action Path */}
            <path d={currentDayEvents.reduce((d, e, i) => {
              const startX = e.displayStart * PIXELS_PER_HOUR;
              const endX = e.displayEnd * PIXELS_PER_HOUR;
              const y = ROW_Y[e.line];
              return d + (i === 0 ? `M ${startX} ${y} L ${endX} ${y}` : ` L ${startX} ${y} L ${endX} ${y}`);
            }, "")} stroke="#38bdf8" strokeWidth="6" fill="none" />
            
            {/* Draw Event Waypoints and Labels */}
            {currentDayEvents.map((e, i) => (
              <g key={i}>
                <circle cx={e.displayStart * PIXELS_PER_HOUR} cy={ROW_Y[e.line]} r="5" fill="#38bdf8" />
                <line x1={e.displayStart * PIXELS_PER_HOUR} y1={ROW_Y[e.line]} x2={e.displayStart * PIXELS_PER_HOUR} y2="420" stroke="#38bdf8" strokeDasharray="4 4" opacity="0.5" />
                <text x={e.displayStart * PIXELS_PER_HOUR + 5} y="440" className="text-[10px] fill-blue-400 font-bold uppercase" transform={`rotate(-45 ${e.displayStart * PIXELS_PER_HOUR + 5} 440)`}>
                  {e.location}
                </text>
                <text x={e.displayStart * PIXELS_PER_HOUR + 5} y="460" className="text-[10px] fill-slate-400 italic" transform={`rotate(-45 ${e.displayStart * PIXELS_PER_HOUR + 5} 460)`}>
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