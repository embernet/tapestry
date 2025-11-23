
import React from 'react';

interface LayoutToolbarProps {
  linkDistance: number;
  repulsion: number;
  onLinkDistanceChange: (val: number) => void;
  onRepulsionChange: (val: number) => void;
  onJiggle: () => void;
  isPhysicsActive: boolean;
  onStartAutoLayout: () => void;
  onAcceptAutoLayout: () => void;
  onRejectAutoLayout: () => void;
  onExpand: () => void;
  onContract: () => void;
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
  onStartAutoLayout,
  onAcceptAutoLayout,
  onRejectAutoLayout,
  onExpand,
  onContract,
  isCollapsed,
  onToggle,
}) => {
  
  const handleInteractionStart = () => {
      if (!isPhysicsActive) {
          onStartAutoLayout();
      }
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 gap-1 flex-shrink-0"
                title={isCollapsed ? "Expand Layout Controls" : "Collapse Layout Controls"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-xs font-bold tracking-wider">LAYOUT</span>
            </button>

            {!isCollapsed && (
                <div className="flex items-center gap-0 p-0 animate-fade-in bg-gray-800 h-20 overflow-hidden rounded-r-lg">
                    
                    {/* Physics Section */}
                    <div className="flex items-center gap-3 px-3 h-full bg-gray-800">
                         {/* Auto Layout Control */}
                        <div className="flex flex-col justify-center items-center min-w-[50px]">
                            {!isPhysicsActive ? (
                                <button 
                                    onClick={onStartAutoLayout} 
                                    className="flex flex-col items-center justify-center bg-gray-700 hover:bg-blue-600 hover:text-white text-blue-400 p-1 rounded border border-gray-600 transition-colors h-10 w-10 shadow-sm" 
                                    title="Start Auto-Layout Simulation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="flex gap-1">
                                    <button 
                                        onClick={onAcceptAutoLayout} 
                                        className="bg-green-600 hover:bg-green-500 text-white p-1 rounded shadow-sm h-8 w-8 flex items-center justify-center" 
                                        title="Accept Layout"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={onRejectAutoLayout} 
                                        className="bg-red-600 hover:bg-red-500 text-white p-1 rounded shadow-sm h-8 w-8 flex items-center justify-center" 
                                        title="Reject Layout"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <span className="text-[9px] font-bold mt-1 text-gray-400 uppercase tracking-wide">SIMULATE</span>
                        </div>

                        <div className="w-px h-12 bg-gray-600 mx-1"></div>

                        {/* Link Distance Slider */}
                        <div className="flex flex-col w-24 justify-center h-full">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">Spread</label>
                                <span className="text-[10px] text-gray-500 font-mono leading-none">{linkDistance}</span>
                            </div>
                            <input 
                                type="range" 
                                min="50" 
                                max="500" 
                                step="10"
                                value={linkDistance} 
                                onPointerDown={handleInteractionStart}
                                onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
                                className="h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                title="Target link distance"
                            />
                        </div>

                        {/* Repulsion Slider */}
                        <div className="flex flex-col w-24 justify-center h-full">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">Repel</label>
                                <span className="text-[10px] text-gray-500 font-mono leading-none">{Math.abs(repulsion)}</span>
                            </div>
                            <input 
                                type="range" 
                                min="100" 
                                max="2000" 
                                step="50"
                                value={Math.abs(repulsion)} 
                                onPointerDown={handleInteractionStart}
                                onChange={(e) => onRepulsionChange(-Number(e.target.value))}
                                className="h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                                title="Node repulsion strength"
                            />
                        </div>

                         {/* Shake Button */}
                         <div className="flex flex-col justify-center items-center">
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">SHAKE</span>
                            <button 
                                onClick={() => {
                                    handleInteractionStart();
                                    onJiggle();
                                }}
                                className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 text-white p-1 rounded border border-gray-600 transition-colors h-8 w-8"
                                title="Shake nodes to unstuck them"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <rect x="7" y="7" width="10" height="10" rx="1" />
                                    <path d="M19 5l2 2" />
                                    <path d="M5 19l-2-2" />
                                    <path d="M5 5l-2 2" />
                                    <path d="M19 19l2-2" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Static Controls Section - Visually Differentiated */}
                    <div className="flex items-center gap-3 px-4 h-full bg-gray-900/80 border-l border-gray-600 shadow-[inset_6px_0_10px_-8px_rgba(0,0,0,0.5)]">
                        <div className="flex flex-col justify-center items-center">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">SPREAD</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={onContract} 
                                    disabled={isPhysicsActive}
                                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-1.5 rounded border border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center"
                                    title="Pack Closer (Contract)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h-6m3-3l3 3l-3 3" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h6m-3-3l-3 3l3 3" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={onExpand} 
                                    disabled={isPhysicsActive}
                                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-1.5 rounded border border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center"
                                    title="Space Out (Expand)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h-3m0 0l3-3m-3 3l3 3" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12h3m0 0l-3-3m3 3l-3 3" />
                                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    </div>
  );
};

export default LayoutToolbar;
