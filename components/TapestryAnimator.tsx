import React, { useState, useEffect } from 'react';
import { TAPESTRY_PATTERNS } from './PatternAssets';

export const TapestryAnimator = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TAPESTRY_PATTERNS.length);
    }, 4000); // 4 seconds
    return () => clearInterval(timer);
  }, []);

  const currentPattern = TAPESTRY_PATTERNS[index];

  return (
    <div className="w-20 h-20 relative flex items-center justify-center bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg" title={currentPattern.name}>
      <div className="w-full h-full p-2 opacity-80 transition-all duration-1000 ease-in-out key={index}">
         {currentPattern.svg}
      </div>
    </div>
  );
};