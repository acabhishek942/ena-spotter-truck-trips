// frontend/src/components/EldLogGrid.tsx
import React from 'react';

interface TimelineEvent {
  line: number;
  duration: number;
  location: string;
  description: string;
}

interface EldLogGridProps {
  timeline: TimelineEvent[];
}

export default function EldLogGrid({ timeline }: EldLogGridProps) {
  // SVG Coordinate Math
  const ROW_HEIGHT = 45;
  const HOUR_WIDTH = 60; 
  const TOTAL_HOURS_WIDTH = 24 * HOUR_WIDTH;
  const REMARKS_START_Y = ROW_HEIGHT * 4;
  const REMARKS_AREA_HEIGHT = 220; // Expanded to fit 4 levels of horizontal text
  
  // Padding to prevent any text or lines from clipping the SVG borders
  const PADDING_X = 40;
  const TOTAL_SVG_WIDTH = TOTAL_HOURS_WIDTH + (PADDING_X * 2);

  let currentX = 0;
  const flagCoordinates: { x: number; label: string }[] = [];

  const generatePath = () => {
    let pathString = '';
    currentX = 0;

    timeline.forEach((event, index) => {
      const segmentWidth = event.duration * HOUR_WIDTH;
      const currentY = (event.line - 1) * ROW_HEIGHT + (ROW_HEIGHT / 2);

      if (index === 0) {
        pathString += `M ${currentX} ${currentY} `;
      } else {
        flagCoordinates.push({
          x: currentX,
          label: `${event.location} - ${event.description}`
        });
        pathString += `V ${currentY} `;
      }

      currentX += segmentWidth;
      pathString += `H ${currentX} `;
    });

    return pathString;
  };

  const pathData = generatePath();

  return (
    <div style={{
      overflowX: 'auto',
      background: '#FFFFFF',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #E2E8F0'
    }}>
      <h3 style={{ marginTop: 0, color: '#1A202C', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.5px' }}>
        Record of Duty Status (RODS)
      </h3>
      
      <div style={{ display: 'flex', position: 'relative', marginTop: '1.5rem' }}>
        {/* Row Labels */}
        <div style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', fontWeight: '600', fontSize: '0.85rem', color: '#4A5568' }}>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>1: Off-Duty</div>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>2: Sleeper Berth</div>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>3: Driving</div>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>4: On-Duty</div>
          <div style={{ height: REMARKS_AREA_HEIGHT, display: 'flex', alignItems: 'flex-start', paddingTop: '20px', color: '#A0AEC0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Remarks
          </div>
        </div>

        {/* The SVG Container */}
        <div style={{ position: 'relative', width: TOTAL_SVG_WIDTH }}>
          <svg width={TOTAL_SVG_WIDTH} height={REMARKS_START_Y + REMARKS_AREA_HEIGHT} style={{ backgroundColor: '#F8FAFC', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
            
            {/* We wrap everything inside a <g> (Group) tag and translate it by PADDING_X.
              This acts like CSS padding for SVG, ensuring nothing touches the absolute edges.
            */}
            <g transform={`translate(${PADDING_X}, 0)`}>
              
              {/* Draw Vertical Grid Lines (Hours & 15-min increments) */}
              {[...Array(25)].map((_, i) => (
                <React.Fragment key={`v-${i}`}>
                  <line x1={i * HOUR_WIDTH} y1={0} x2={i * HOUR_WIDTH} y2={REMARKS_START_Y} stroke="#CBD5E0" strokeWidth={1.5} />
                  {i < 24 && [1, 2, 3].map(q => (
                     <line key={`vq-${i}-${q}`} x1={i * HOUR_WIDTH + (q * (HOUR_WIDTH/4))} y1={0} x2={i * HOUR_WIDTH + (q * (HOUR_WIDTH/4))} y2={REMARKS_START_Y} stroke="#E2E8F0" strokeWidth={0.75} />
                  ))}
                  {/* Hour Markers at the bottom of the grid */}
                  <text x={i * HOUR_WIDTH} y={REMARKS_START_Y + 15} fontSize="10" fill="#A0AEC0" textAnchor="middle">
                    {i}
                  </text>
                </React.Fragment>
              ))}

              {/* Draw Horizontal Grid Lines (Rows) */}
              {[1, 2, 3].map((i) => (
                <line key={`h-${i}`} x1={0} y1={i * ROW_HEIGHT} x2={TOTAL_HOURS_WIDTH} y2={i * ROW_HEIGHT} stroke="#CBD5E0" strokeWidth={1.5} />
              ))}

              {/* Draw the HOS Tracking Path */}
              <path d={pathData} fill="none" stroke="#2B6CB0" strokeWidth={4} strokeLinejoin="round" />
              
              {/* Draw the Staggered Horizontal Elbow Remarks */}
              {flagCoordinates.map((flag, index) => {
                // Cycle through 4 different drop depths so horizontal text never overlaps
                const depthLevel = index % 4; 
                const staggerDrop = 40 + (depthLevel * 45); 

                // If the flag is on the right half of the board, draw the elbow pointing left to prevent right-edge clipping
                const isRightSide = flag.x > (TOTAL_HOURS_WIDTH * 0.6);
                const elbowDirection = isRightSide ? -15 : 15;
                const textAnchor = isRightSide ? "end" : "start";
                const textPadding = isRightSide ? -5 : 5;

                return (
                  <g key={`flag-${index}`}>
                    {/* Vertical Drop Line */}
                    <line 
                      x1={flag.x} y1={REMARKS_START_Y} 
                      x2={flag.x} y2={REMARKS_START_Y + staggerDrop} 
                      stroke="#718096" strokeWidth={1.5} strokeDasharray="4,4" 
                    />
                    {/* Horizontal Elbow Connector */}
                    <line 
                      x1={flag.x} y1={REMARKS_START_Y + staggerDrop} 
                      x2={flag.x + elbowDirection} y2={REMARKS_START_Y + staggerDrop} 
                      stroke="#4A5568" strokeWidth={2} 
                    />
                    {/* Horizontal Text Label */}
                    <text
                      x={flag.x + elbowDirection + textPadding}
                      y={REMARKS_START_Y + staggerDrop + 4} // +4 for vertical optical alignment
                      textAnchor={textAnchor}
                      fontSize="11"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="500"
                      fill="#2D3748"
                    >
                      {flag.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}