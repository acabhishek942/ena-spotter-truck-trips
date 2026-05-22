import React, { useState, useEffect } from 'react';

interface TruckerLoaderProps {
  statusText: string;
}

const FUNNY_MESSAGES = [
  "Fastening the seatbelts...",
  "Monster truck ignition ON... 🚚🔥",
  "Checking mirror scales and fuzzy dice...",
  "Waking up the backend hamsters...",
  "Loading the heavy cargo slots...",
  "Checking for highway state troopers..."
];

export default function TruckerLoader({ statusText }: TruckerLoaderProps) {
  const [funMessage, setFunMessage] = useState(FUNNY_MESSAGES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
      setFunMessage(randomMsg);
    }, 800); // Cycles every 800ms to keep it dynamic
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
      {/* Custom Animated Truck SVG Grid */}
      <div className="relative mb-6 animate-bounce duration-1000">
        <svg className="w-24 h-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M16.5 18.75h-6m6 0a3 3 0 0 0 3-3V9.75m0 0A3 3 0 0 0 16.5 6.75H12v6.75h6.75m-6.75-6.75H8.25a3 3 0 0 0-3 3v5.25m3.75-10.5H12" />
        </svg>
        <div className="absolute bottom-1 left-2 w-16 h-1 bg-blue-400 opacity-70 animate-pulse"></div>
      </div>

      {/* Main Orchestration Status */}
      <h3 className="text-xl font-bold text-white tracking-wide">{statusText}</h3>
      
      {/* Whimsical Rotating Message */}
      <p className="text-sm text-slate-400 mt-2 italic animate-pulse">
        {funMessage}
      </p>
    </div>
  );
}