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
  const ROW_HEIGHT = 40;
  const HOUR_WIDTH = 40; // 24 hours = 960px total width
  const TOTAL_WIDTH = 24 * HOUR_WIDTH;

  // Generate the path coordinates for the continuous line
  const generatePath = () => {
    let currentX = 0;
    let pathString = '';

    timeline.forEach((event, index) => {
      const segmentWidth = event.duration * HOUR_WIDTH;
      // Lines are 1-indexed (1=Off-Duty, 4=On-Duty), so we offset for the Y coordinate
      const currentY = (event.line - 1) * ROW_HEIGHT + (ROW_HEIGHT / 2);

      if (index === 0) {
        // Start the path
        pathString += `M ${currentX} ${currentY} `;
      } else {
        // Draw vertical transition line to the new row before drawing the horizontal line
        pathString += `V ${currentY} `;
      }

      // Draw horizontal line for the duration of the event
      currentX += segmentWidth;
      pathString += `H ${currentX} `;
    });

    return pathString;
  };

  return (
    <div style={{ overflowX: 'auto', background: '#fff', padding: '1rem', border: '1px solid #ccc' }}>
      <h3 style={{ marginTop: 0 }}>Automated Driver's Daily Log (RODS)</h3>
      
      <div style={{ display: 'flex' }}>
        {/* Row Labels */}
        <div style={{ width: '120px', display: 'flex', flexDirection: 'column', fontWeight: 'bold', fontSize: '0.85rem', color: '#333' }}>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>1: Off-Duty</div>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>2: Sleeper Berth</div>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>3: Driving</div>
          <div style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>4: On-Duty</div>
        </div>

        {/* The SVG Grid and Graph */}
        <svg width={TOTAL_WIDTH} height={ROW_HEIGHT * 4} style={{ border: '2px solid #333', backgroundColor: '#fdfdfd' }}>
          
          {/* Draw Grid Lines (Hours) */}
          {[...Array(25)].map((_, i) => (
            <line key={`v-${i}`} x1={i * HOUR_WIDTH} y1={0} x2={i * HOUR_WIDTH} y2={ROW_HEIGHT * 4} stroke="#e0e0e0" strokeWidth={1} />
          ))}

          {/* Draw Grid Lines (Rows) */}
          {[1, 2, 3].map((i) => (
            <line key={`h-${i}`} x1={0} y1={i * ROW_HEIGHT} x2={TOTAL_WIDTH} y2={i * ROW_HEIGHT} stroke="#e0e0e0" strokeWidth={1} />
          ))}

          {/* Draw the HOS Tracking Path */}
          <path d={generatePath()} fill="none" stroke="#0000cc" strokeWidth={4} strokeLinejoin="round" />
        </svg>
      </div>

      {/* Render the Remarks/Geo-Tags Below */}
      <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
        <strong>Remarks & Geo-Tags:</strong>
        <ul style={{ paddingLeft: '1.2rem', color: '#555' }}>
          {timeline.map((event, i) => (
            <li key={i}>
              <em>{event.duration}hrs on Line {event.line}:</em> {event.location} - {event.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}