
import React, { useState } from 'react';

interface LayoutToolbarProps {
  linkDistance: number;
  repulsion: number;
  onLinkDistanceChange: (val: number) => void;
  onRepulsionChange: (val: number) => void;
  onJiggle: () => void;
  isPhysicsActive: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  linkDistance,
  repulsion,
  onLinkDistanceChange,
  onRepulsionChange,
  onJiggle,
  isPhysicsActive,
  isCollapsed,
  onToggle,
}) => {
  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 gap-1"
                title={isCollapsed ? "Expand Layout Controls" : "Collapse Layout Controls"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-xs font-bold tracking-wider">LAYOUT</span>
            </button>

            {!isCollapsed && (
                <div className="flex items-center gap-4 p-3 animate-fade-in bg-gray-800 h-20">
                    {/* Link Distance Slider */}
                    <div className="flex flex-col w-32 justify-center h-full">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Spread (Distance)</label>
                             <span className="text-xs text-gray-200 font-mono leading-none">{linkDistance}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="50" 
                            max="500" 
                            step="10"
                            value={linkDistance} 
                            onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
                            className="h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            disabled={!isPhysicsActive}
                        />
                    </div>

                    <div className="w-px h-12 bg-gray-600 mx-1"></div>

                    {/* Repulsion Slider */}
                    <div className="flex flex-col w-32 justify-center h-full">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Repulsion</label>
                             <span className="text-xs text-gray-200 font-mono leading-none">{Math.abs(repulsion)}</span>
                        </div>
                        <input 
                            type="range" 
                            min="100" 
                            max="2000" 
                            step="50"
                            value={Math.abs(repulsion)} 
                            onChange={(e) => onRepulsionChange(-Number(e.target.value))}
                            className="h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                            disabled={!isPhysicsActive}
                        />
                    </div>

                    <div className="w-px h-12 bg-gray-600 mx-1"></div>

                    {/* Jiggle Button */}
                    <button 
                        onClick={onJiggle}
                        disabled={!isPhysicsActive}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 text-white p-1 rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-12 w-14"
                        title="Shake nodes to unstuck them"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                        <span className="text-[10px] leading-none font-semibold">Shake</span>
                    </button>
                </div>
            )}
        </div>
        {!isPhysicsActive && !isCollapsed && (
            <div className="text-[10px] text-orange-400 bg-gray-800 bg-opacity-90 p-1 rounded border border-orange-900 text-center pointer-events-auto">
                Enable Auto-Layout to use these controls
            </div>
        )}
    </div>
  );
};

export default LayoutToolbar;
