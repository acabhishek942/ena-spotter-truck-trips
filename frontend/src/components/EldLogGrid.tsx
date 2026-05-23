import { useState } from 'react';

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
const ROW_COLORS: Record<number, string> = {
  1: '#64748b', 2: '#8b5cf6', 3: '#38bdf8', 4: '#f59e0b',
};
const ROWS = [1, 2, 3, 4];

const COL_W   = 48;
const SVG_W   = 24 * COL_W;
const ROW_H   = 56;
const TOP_PAD = 32;
const SVG_H   = TOP_PAD + ROWS.length * ROW_H + 24;
const rowMid  = (ri: number) => TOP_PAD + ri * ROW_H + ROW_H / 2;

export default function EldLogGrid({ timeline = [] }: EldLogGridProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; ev: typeof accumulated[0] } | null>(null);

  // Build accumulated events
  const accumulated = (() => {
    const result: (BackendTimelineEvent & { startHour: number; endHour: number })[] = [];
    let cursor = 0;
    for (const ev of timeline) {
      result.push({ ...ev, startHour: cursor, endHour: cursor + ev.duration });
      cursor += ev.duration;
    }
    return result;
  })();

  const totalHours = accumulated.length > 0 ? accumulated[accumulated.length - 1].endHour : 0;
  const totalDays  = Math.ceil(totalHours / 24) || 1;

  const summary = timeline.reduce(
    (acc, e) => ({ ...acc, [e.line]: (acc[e.line] || 0) + e.duration }),
    {} as Record<number, number>
  );

  const dayStart   = currentDay * 24;
  const dayEnd     = dayStart + 24;
  const dayEvents  = accumulated.filter(e => e.endHour > dayStart && e.startHour < dayEnd);

  // Build step-graph path
  const stepPath = (() => {
    const pts: string[] = [];
    for (const e of dayEvents) {
      const cs  = Math.max(e.startHour, dayStart) - dayStart;
      const ce  = Math.min(e.endHour,   dayEnd)   - dayStart;
      const ri  = ROWS.indexOf(e.line);
      const y   = rowMid(ri);
      const x1  = cs * COL_W;
      const x2  = ce * COL_W;
      pts.length === 0 ? pts.push(`M ${x1} ${y}`) : pts.push(`L ${x1} ${y}`);
      pts.push(`L ${x2} ${y}`);
    }
    return pts.join(' ');
  })();

  return (
    <div className="w-full flex flex-col bg-[#050811] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#0a0f1d] px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4 flex-wrap">
          {ROWS.map(l => (
            <div key={l} className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">{ROW_LABELS[l]}</span>
              <span className="text-sm font-bold font-mono" style={{ color: ROW_COLORS[l] }}>
                {(summary[l] || 0).toFixed(1)}h
              </span>
            </div>
          ))}
        </div>
        <select
          value={currentDay}
          onChange={e => setCurrentDay(Number(e.target.value))}
          className="bg-slate-800 text-white text-xs font-mono px-3 py-1 rounded border border-slate-700 cursor-pointer outline-none hover:border-sky-400"
        >
          {Array.from({ length: totalDays }, (_, i) => (
            <option key={i} value={i}>Day {i + 1}</option>
          ))}
        </select>
      </div>

      {/* Nav */}
      <div className="bg-[#0a0f1d] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setCurrentDay(d => Math.max(0, d - 1))}
          disabled={currentDay === 0}
          className="text-xs font-mono font-bold bg-slate-800 px-4 py-1.5 rounded border border-slate-700 text-white
                     hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          ← PREV
        </button>
        <span className="text-xs font-mono font-bold text-sky-400 tracking-widest">
          DAY {currentDay + 1} / {totalDays}
        </span>
        <button
          onClick={() => setCurrentDay(d => Math.min(totalDays - 1, d + 1))}
          disabled={currentDay >= totalDays - 1}
          className="text-xs font-mono font-bold bg-blue-700 px-4 py-1.5 rounded border border-blue-600 text-white
                     hover:bg-blue-600 hover:border-sky-400 disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          NEXT →
        </button>
      </div>

      {/* Grid */}
      <div className="p-4 overflow-x-auto relative">
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: 'block' }}
        >
          {/* Row backgrounds */}
          {ROWS.map((_, ri) => (
            <rect
              key={ri}
              x={0} y={TOP_PAD + ri * ROW_H}
              width={SVG_W} height={ROW_H}
              fill={ri % 2 === 0 ? '#090f1e' : '#07091a'}
            />
          ))}

          {/* Hour lines + labels */}
          {Array.from({ length: 25 }, (_, h) => {
            const x = h * COL_W;
            const isMajor = h % 6 === 0;
            return (
              <g key={h}>
                <line
                  x1={x} y1={TOP_PAD - 6} x2={x} y2={TOP_PAD + ROWS.length * ROW_H}
                  stroke={isMajor ? '#334155' : '#1e293b'}
                  strokeWidth={isMajor ? 1.5 : 1}
                />
                {h < 25 && (
                  <text
                    x={x + 2} y={TOP_PAD - 10}
                    fill={isMajor ? '#94a3b8' : '#475569'}
                    fontSize={isMajor ? 10 : 8}
                    fontFamily="Courier New, monospace"
                    fontWeight={isMajor ? 700 : 400}
                  >
                    {String(h).padStart(2, '0')}:00
                  </text>
                )}
              </g>
            );
          })}

          {/* Row separators */}
          {ROWS.map((_, ri) => (
            <line key={ri}
              x1={0} y1={TOP_PAD + ri * ROW_H} x2={SVG_W} y2={TOP_PAD + ri * ROW_H}
              stroke="#1e293b" strokeWidth={1}
            />
          ))}

          {/* Step-graph path */}
          {stepPath && (
            <path d={stepPath} stroke="#38bdf8" strokeWidth={3} fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Event bars */}
          {dayEvents.map((e, i) => {
            const cs    = Math.max(e.startHour, dayStart) - dayStart;
            const ce    = Math.min(e.endHour,   dayEnd)   - dayStart;
            const ri    = ROWS.indexOf(e.line);
            const y     = TOP_PAD + ri * ROW_H;
            const x     = cs * COL_W;
            const w     = (ce - cs) * COL_W;
            const color = ROW_COLORS[e.line];
            const maxChars = Math.floor(w / 6);
            const label = e.location.length > maxChars
              ? e.location.slice(0, maxChars - 1) + '…'
              : e.location;

            return (
              <g key={i}>
                <rect x={x} y={y + 4} width={w} height={ROW_H - 8}
                  fill={color} opacity={0.12} rx={3} />
                <rect x={x} y={y + 4} width={w} height={2}
                  fill={color} opacity={0.6} rx={1} />
                {e.startHour >= dayStart && (
                  <circle cx={cs * COL_W} cy={rowMid(ri)} r={4} fill={color} />
                )}
                {w > 40 && (
                  <text
                    x={x + w / 2} y={rowMid(ri)}
                    textAnchor="middle" dominantBaseline="central"
                    fill={color} fontSize={9} fontFamily="Courier New, monospace"
                    fontWeight={700} opacity={0.9}
                  >
                    {label}
                  </text>
                )}
                {/* Faded row label */}
                <text
                  x={SVG_W - 4} y={rowMid(ri)}
                  textAnchor="end" dominantBaseline="central"
                  fill={color} fontSize={8} fontFamily="Courier New, monospace"
                  fontWeight={700} opacity={0.35} letterSpacing="0.08em"
                >
                  {ROW_LABELS[e.line]}
                </text>
                {/* Hover hit area */}
                <rect
                  x={x} y={y} width={w} height={ROW_H}
                  fill="transparent" style={{ cursor: 'pointer' }}
                  onMouseEnter={ev => setTooltip({ x: ev.clientX, y: ev.clientY, ev: e })}
                  onMouseMove={ev => setTooltip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : null)}
                  onMouseLeave={() => setTooltip(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-[#0f172a] border border-sky-400 rounded px-3 py-2 text-xs font-mono text-slate-400 pointer-events-none whitespace-nowrap"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
          >
            <span className="text-sky-400 font-bold">{tooltip.ev.location}</span>
            <br />
            {tooltip.ev.description} — {tooltip.ev.duration.toFixed(1)}h
          </div>
        )}
      </div>
    </div>
  );
}