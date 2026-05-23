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
  const isProgrammaticScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const PIXELS_PER_HOUR = 120;
  const PAGE_WIDTH = 24 * PIXELS_PER_HOUR;
  const SVG_HEIGHT = 500;

  const accumulatedEvents = timeline.map((event, i, arr) => {
    const startHour = arr.slice(0, i).reduce((sum, e) => sum + e.duration, 0);
    return { ...event, startHour, endHour: startHour + event.duration };
  });

  const totalHours = accumulatedEvents.length > 0 ? accumulatedEvents[accumulatedEvents.length - 1].endHour : 0;
  const totalPages = Math.ceil(totalHours / 24) || 1;
  const SVG_WIDTH = Math.max(totalHours * PIXELS_PER_HOUR, PAGE_WIDTH);

  // --- THE FIX: Direct Action Handler ---
  // This completely replaces the useEffect. It safely updates the UI state AND drives the scroll simultaneously.
  const navigateToDay = (newIndex: number) => {
    setCurrentDayIndex(newIndex); // Instantly update buttons and dropdown UI

    if (scrollContainerRef.current) {
      isProgrammaticScrolling.current = true; // Lock the scroll listener
      
      // Perform the smooth animation
      scrollContainerRef.current.scrollTo({ 
        left: newIndex * PAGE_WIDTH, 
        behavior: 'smooth' 
      });

      // Clear any existing timeouts to prevent race conditions
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      
      // Give the browser plenty of time to finish the smooth scroll before unlocking
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrolling.current = false;
      }, 800); 
    }
  };

  // --- Cleaned up Scroll Handler ---
  const handleScroll = () => {
    // If the scroll was triggered by our buttons/dropdown, completely ignore it.
    if (isProgrammaticScrolling.current) return;

    // Otherwise, this is a native manual scroll (like swiping on a trackpad).
    // Calculate which day is currently visible and update the UI.
    if (scrollContainerRef.current) {
      const newIndex = Math.round(scrollContainerRef.current.scrollLeft / PAGE_WIDTH);
      if (newIndex !== currentDayIndex && newIndex >= 0 && newIndex < totalPages) {
        setCurrentDayIndex(newIndex); 
        // Notice: This ONLY updates state now. It no longer triggers a programmatic scroll!
      }
    }
  };

  const summary = timeline.reduce((acc, e) => ({ ...acc, [e.line]: (acc[e.line] || 0) + e.duration }), {} as any);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative">
      <div className="bg-[#0a0f1d] p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex gap-6">
          {[1,2,3,4].map(l => (
            <div key={l}><div className="text-[9px] text-slate-500 uppercase">{ROW_LABELS[l]}</div><div className="text-sm font-black text-blue-400">{(summary[l] || 0).toFixed(1)}h</div></div>
          ))}
        </div>
        {/* MODIFIED: Direct handler call */}
        <select 
          value={currentDayIndex} 
          onChange={(e) => navigateToDay(Number(e.target.value))} 
          className="bg-slate-800 text-white text-xs px-3 py-1 rounded border border-slate-700 cursor-pointer"
        >
          {Array.from({ length: totalPages }).map((_, i) => <option key={i} value={i}>Day {i + 1}</option>)}
        </select>
      </div>

      <div className="p-2 border-b border-slate-800 flex justify-between bg-[#0a0f1d]">
        {/* MODIFIED: Direct handler call */}
        <button 
          onClick={() => navigateToDay(Math.max(0, currentDayIndex - 1))} 
          disabled={currentDayIndex === 0} 
          className="text-xs bg-slate-800 px-4 py-1.5 rounded text-white font-bold disabled:opacity-30"
        >
          ← PREV
        </button>
        <span className="text-xs font-bold text-blue-400 flex items-center">DAY {currentDayIndex + 1} / {totalPages}</span>
        {/* MODIFIED: Direct handler call */}
        <button 
          onClick={() => navigateToDay(Math.min(totalPages - 1, currentDayIndex + 1))} 
          disabled={currentDayIndex >= totalPages - 1} 
          className="text-xs bg-blue-600 px-4 py-1.5 rounded text-white font-bold disabled:opacity-30"
        >
          NEXT →
        </button>
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="w-full flex-1 overflow-x-auto p-6 scrollbar-thin scrollbar-thumb-blue-600 pl-[180px]">
        {/* --- Keep the rest of your exact SVG rendering logic below --- */}
        <div className="absolute left-0 top-[180px] w-[160px] z-10 flex flex-col bg-[#050811]">
          {[1, 2, 3, 4].map(l => <div key={l} className="h-[80px] flex items-center justify-center font-bold text-[11px] text-slate-300 uppercase tracking-widest">{ROW_LABELS[l]}</div>)}
        </div>
        <div style={{ width: `${SVG_WIDTH + 200}px`, height: '100%' }}>
          <svg width={SVG_WIDTH + 200} height={SVG_HEIGHT} style={{ overflow: 'visible' }}>
            {Array.from({ length: Math.ceil(totalHours) + 1 }).map((_, i) => (
              <g key={i}>
                <line x1={i * PIXELS_PER_HOUR} y1="40" x2={i * PIXELS_PER_HOUR} y2="360" stroke="#1e293b" strokeWidth="1" />
                <text x={i * PIXELS_PER_HOUR} y="380" className="text-[10px] fill-slate-500" textAnchor="middle">{`${String(i % 24).padStart(2, '0')}:00`}</text>
              </g>
            ))}
            {[1, 2, 3, 4].map(l => <line key={l} x1="0" y1={ROW_Y[l]} x2={SVG_WIDTH} y2={ROW_Y[l]} stroke="#475569" strokeWidth="2" strokeDasharray="6 6" />)}
            <path d={accumulatedEvents.reduce((d, e, i) => {
              const startX = e.startHour * PIXELS_PER_HOUR, endX = e.endHour * PIXELS_PER_HOUR, y = ROW_Y[e.line];
              return d + (i === 0 ? `M ${startX} ${y} L ${endX} ${y}` : ` L ${startX} ${y} L ${endX} ${y}`);
            }, "")} stroke="#38bdf8" strokeWidth="6" fill="none" />
            {accumulatedEvents.map((e, i) => (
              <g key={i}>
                <circle cx={e.startHour * PIXELS_PER_HOUR} cy={ROW_Y[e.line]} r="5" fill="#38bdf8" />
                <line x1={e.startHour * PIXELS_PER_HOUR} y1={ROW_Y[e.line]} x2={e.startHour * PIXELS_PER_HOUR} y2="420" stroke="#38bdf8" strokeDasharray="4 4" opacity="0.5" />
                <text x={e.startHour * PIXELS_PER_HOUR + 5} y="440" className="text-[10px] fill-blue-400 font-bold uppercase" transform={`rotate(-45 ${e.startHour * PIXELS_PER_HOUR + 5} 440)`}>{e.location}</text>
                <text x={e.startHour * PIXELS_PER_HOUR + 5} y="460" className="text-[10px] fill-slate-400 italic" transform={`rotate(-45 ${e.startHour * PIXELS_PER_HOUR + 5} 460)`}>{e.description}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}