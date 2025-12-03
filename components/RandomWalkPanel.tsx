
import React from 'react';

interface RandomWalkPanelProps {
  currentNodeName: string | null;
  visitedCount: number;
  totalCount: number;
  waitTime: number;
  setWaitTime: (time: number) => void;
  isPaused: boolean;
  togglePause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onPlayReverse: () => void;
  onFastForward: () => void;
  onRandomStart: () => void;
  onSprint: () => void;
  hideDetails: boolean;
  setHideDetails: (hide: boolean) => void;
  onClose: () => void;
  isDarkMode: boolean;
  direction: 'forward' | 'backward';
  speedMultiplier: number;
  onOpenGuidance?: () => void;
}

export const RandomWalkPanel: React.FC<RandomWalkPanelProps> = ({
  currentNodeName,
  visitedCount,
  totalCount,
  waitTime,
  setWaitTime,
  isPaused,
  togglePause,
  onStepBack,
  onStepForward,
  onPlayReverse,
  onFastForward,
  onRandomStart,
  onSprint,
  hideDetails,
  setHideDetails,
  onClose,
  isDarkMode,
  direction,
  speedMultiplier,
  onOpenGuidance
}) => {
  const bgClass = isDarkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/95 border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const buttonClass = isDarkMode 
    ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-200' 
    : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-800';
  const activeBtnClass = 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500';

  const handleTimeChange = (delta: number) => {
      setWaitTime(Math.max(1, Math.min(10, waitTime + delta)));
  };

  return (
    <div className={`fixed bottom-8 left-24 z-50 w-80 rounded-lg shadow-2xl border p-4 backdrop-blur-sm transition-colors ${bgClass}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
           </svg>
           Random Walk
        </h3>
        <div className="flex items-center gap-2">
            {onOpenGuidance && (
                <button 
                    onClick={onOpenGuidance} 
                    className={`hover:text-yellow-400 ${subTextClass} transition-colors`}
                    title="Why use Random Walk?"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                </button>
            )}
            <button onClick={onClose} className={`hover:text-rose-500 ${subTextClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Display */}
        <div className={`p-3 rounded border text-center ${isDarkMode ? 'bg-black/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            {currentNodeName ? (
                <div className="animate-fade-in">
                    <div className={`text-[10px] uppercase font-bold mb-1 ${subTextClass}`}>Current Node</div>
                    <div className={`text-lg font-bold truncate ${textClass} ${!isPaused ? 'animate-pulse' : ''}`}>{currentNodeName}</div>
                </div>
            ) : (
                <div className={`text-sm italic ${subTextClass}`}>
                    Click a start node or press Play to start
                </div>
            )}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs">
            <span className={subTextClass}>Unique Visited</span>
            <span className={`font-mono font-bold ${textClass}`}>{visitedCount} / {totalCount}</span>
        </div>
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div 
                className="bg-rose-500 h-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (visitedCount / Math.max(1, totalCount)) * 100)}%` }}
            ></div>
        </div>

        {/* VCR Controls */}
        <div className="flex justify-between gap-1">
             <button 
                onClick={onPlayReverse} 
                className={`p-2 rounded flex-1 flex justify-center ${!isPaused && direction === 'backward' ? activeBtnClass : buttonClass}`} 
                title="Reverse Play (Fast)"
             >
                 <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" /></svg>
             </button>
             <button onClick={onStepBack} className={`p-2 rounded flex-1 flex justify-center ${buttonClass}`} title="Step Back">
                 <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
             </button>
             
             <button 
                onClick={() => !currentNodeName ? onRandomStart() : togglePause()}
                className={`p-2 rounded flex-1 flex justify-center ${!isPaused && direction === 'forward' && speedMultiplier === 1 ? activeBtnClass : buttonClass}`}
                title={!currentNodeName ? "Start Random Walk" : (isPaused ? "Play" : "Pause")}
             >
                 {isPaused || !currentNodeName ? (
                     <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                 ) : (
                     <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                 )}
             </button>

             <button onClick={onStepForward} className={`p-2 rounded flex-1 flex justify-center ${buttonClass}`} title="Step Forward">
                 <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
             </button>
             <button 
                onClick={onFastForward} 
                className={`p-2 rounded flex-1 flex justify-center ${!isPaused && direction === 'forward' && speedMultiplier > 1 ? activeBtnClass : buttonClass}`} 
                title="Fast Forward"
             >
                 <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 19V5l9 7-9 7zm9 0V5l9 7-9 7z" /></svg>
             </button>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
             <button 
                onClick={onRandomStart}
                className={`py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${buttonClass}`}
             >
                 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 Random Start
             </button>
             <button 
                onClick={onSprint}
                className={`py-2 px-3 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${buttonClass}`}
                title="Move 5 steps instantly"
             >
                 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 Sprint (5x)
             </button>
        </div>

        {/* Settings */}
        <div className="space-y-3 pt-2 border-t border-dashed border-gray-600/50">
            <div className="flex justify-between items-center">
                <label className={`text-xs font-bold ${subTextClass}`}>Wait Time</label>
                <span className={`text-xs font-mono ${textClass}`}>{waitTime}s</span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => handleTimeChange(-1)} className={`w-6 h-6 flex items-center justify-center rounded border ${buttonClass}`}>-</button>
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={waitTime} 
                    onChange={(e) => setWaitTime(Number(e.target.value))}
                    className="flex-grow h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <button onClick={() => handleTimeChange(1)} className={`w-6 h-6 flex items-center justify-center rounded border ${buttonClass}`}>+</button>
            </div>
            
            <div className="flex items-center gap-2">
                 <input 
                    type="checkbox" 
                    id="hideDetails" 
                    checked={hideDetails} 
                    onChange={(e) => setHideDetails(e.target.checked)}
                    className="rounded border-gray-500 text-rose-500 focus:ring-rose-500 bg-transparent"
                 />
                 <label htmlFor="hideDetails" className={`text-xs cursor-pointer ${subTextClass}`}>Hide Element Details Panel</label>
            </div>
        </div>
      </div>
    </div>
  );
};
