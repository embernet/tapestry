
import React from 'react';
import { NodeShape } from '../types';

interface LayoutToolbarProps {
  linkDistance: number;
  repulsion: number;
  onLinkDistanceChange: (val: number) => void;
  onRepulsionChange: (val: number) => void;
  onJiggle: () => void;
  onZoomToFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isPhysicsActive: boolean;
  onStartAutoLayout: () => void;
  onAcceptAutoLayout: () => void;
  onRejectAutoLayout: () => void;
  onStaticLayout: () => void;
  onExpand: () => void;
  onContract: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  nodeShape: NodeShape;
  onNodeShapeChange: (shape: NodeShape) => void;
}

const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  linkDistance,
  repulsion,
  onLinkDistanceChange,
  onRepulsionChange,
  onJiggle,
  onZoomToFit,
  onZoomIn,
  onZoomOut,
  isPhysicsActive,
  onStartAutoLayout,
  onAcceptAutoLayout,
  onRejectAutoLayout,
  onStaticLayout,
  onExpand,
  onContract,
  isCollapsed,
  onToggle,
  isDarkMode,
  nodeShape,
  onNodeShapeChange
}) => {
  
  const handleInteractionStart = () => {
      if (!isPhysicsActive) {
          onStartAutoLayout();
      }
  };

  const handleToggle = () => {
      if (!isCollapsed && isPhysicsActive) {
          onAcceptAutoLayout();
      }
      onToggle();
  };

  const bgClass = isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200';
  const buttonBgClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-orange-400' : 'bg-white hover:bg-gray-50 border-gray-200 text-orange-600';
  const controlBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const actionButtonBg = isDarkMode ? 'bg-gray-700 hover:bg-blue-600 hover:text-white border-gray-600' : 'bg-white hover:bg-blue-500 hover:text-white border-gray-200';
  const staticControlBg = isDarkMode ? 'bg-gray-900/80 border-gray-600' : 'bg-gray-50/80 border-gray-200';
  const iconButtonBg = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueClass = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const selectBgClass = isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <div className={`flex items-stretch gap-0 rounded-lg border shadow-lg pointer-events-auto overflow-hidden ${bgClass}`}>
            {/* Collapse Toggle */}
            <button 
                onClick={handleToggle}
                className={`border-r w-20 flex flex-col items-center justify-center transition-colors h-20 gap-1 flex-shrink-0 ${buttonBgClass}`}
                title={isCollapsed ? "Expand Layout Controls" : "Collapse Layout Controls"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className={`text-xs font-bold tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>LAYOUT</span>
            </button>

            {!isCollapsed && (
                <div className={`flex items-center gap-0 p-0 animate-fade-in h-20 overflow-hidden rounded-r-lg ${controlBgClass}`}>
                    
                    {/* Physics Section */}
                    <div className="flex items-center gap-3 px-3 h-full">
                         {/* Auto Layout Control */}
                        <div className="flex flex-col justify-center items-center min-w-[50px]">
                            {!isPhysicsActive ? (
                                <button 
                                    onClick={onStartAutoLayout} 
                                    className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-10 w-10 shadow-sm ${actionButtonBg} ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} 
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
                            <span className={`text-[9px] font-bold mt-1 uppercase tracking-wide ${labelClass}`}>SIMULATE</span>
                        </div>

                        <div className={`w-px h-12 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

                        {/* Link Distance Slider */}
                        <div className="flex flex-col w-24 justify-center h-full">
                            <div className="flex justify-between items-center mb-1">
                                <label className={`text-[9px] font-bold uppercase tracking-wider leading-none ${labelClass}`}>Spread</label>
                                <span className={`text-[10px] font-mono leading-none ${valueClass}`}>{linkDistance}</span>
                            </div>
                            <input 
                                type="range" 
                                min="50" 
                                max="500" 
                                step="10"
                                value={linkDistance} 
                                onPointerDown={handleInteractionStart}
                                onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
                                className={`h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                                title="Target link distance"
                            />
                        </div>

                        {/* Repulsion Slider */}
                        <div className="flex flex-col w-24 justify-center h-full">
                            <div className="flex justify-between items-center mb-1">
                                <label className={`text-[9px] font-bold uppercase tracking-wider leading-none ${labelClass}`}>Repel</label>
                                <span className={`text-[10px] font-mono leading-none ${valueClass}`}>{Math.abs(repulsion)}</span>
                            </div>
                            <input 
                                type="range" 
                                min="100" 
                                max="2000" 
                                step="50"
                                value={Math.abs(repulsion)} 
                                onPointerDown={handleInteractionStart}
                                onChange={(e) => onRepulsionChange(-Number(e.target.value))}
                                className={`h-1.5 rounded-lg appearance-none cursor-pointer accent-red-500 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                                title="Node repulsion strength"
                            />
                        </div>

                         {/* Fit Button */}
                         <div className="flex flex-col justify-center items-center">
                             <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>FIT</span>
                            <button 
                                onClick={onZoomToFit}
                                className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-8 w-8 ${iconButtonBg}`}
                                title="Zoom to Fit"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                                </svg>
                            </button>
                        </div>

                        {/* Zoom Buttons */}
                        <div className="flex flex-col justify-center items-center">
                             <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>ZOOM</span>
                             <div className="flex gap-1">
                                <button 
                                    onClick={onZoomOut}
                                    className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-8 w-8 ${iconButtonBg}`}
                                    title="Zoom Out"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={onZoomIn}
                                    className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-8 w-8 ${iconButtonBg}`}
                                    title="Zoom In"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h5V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                             </div>
                        </div>

                         {/* Shake Button */}
                         <div className="flex flex-col justify-center items-center">
                             <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>SHAKE</span>
                            <button 
                                onClick={() => {
                                    handleInteractionStart();
                                    onJiggle();
                                }}
                                className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-8 w-8 ${iconButtonBg}`}
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
                    <div className={`flex items-center gap-3 px-4 h-full border-l shadow-[inset_6px_0_10px_-8px_rgba(0,0,0,0.5)] ${staticControlBg}`}>
                        
                        {/* Spread Controls */}
                        <div className="flex flex-col justify-center items-center">
                            <span className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${labelClass}`}>SPREAD</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={onContract} 
                                    disabled={isPhysicsActive}
                                    className={`p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-300'}`}
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
                                    className={`p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed transition-colors h-8 w-8 flex items-center justify-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-300'}`}
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

                         {/* Auto Layout (Static) */}
                        <div className="flex flex-col justify-center items-center ml-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>AUTO</span>
                             <button 
                                onClick={onStaticLayout}
                                disabled={isPhysicsActive}
                                className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-8 w-8 disabled:opacity-30 ${iconButtonBg}`}
                                title="Auto-Arrange Nodes (Static)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>
                        </div>

                         {/* Node Shape Control */}
                         <div className="flex flex-col justify-center items-center ml-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>SHAPE</span>
                            <select
                                value={nodeShape}
                                onChange={(e) => onNodeShapeChange(e.target.value as NodeShape)}
                                className={`border rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 h-8 w-24 ${selectBgClass}`}
                            >
                                <option value="rectangle">Rectangle</option>
                                <option value="oval">Oval</option>
                                <option value="circle">Circle</option>
                                <option value="point">Point</option>
                            </select>
                        </div>

                    </div>

                </div>
            )}
        </div>
    </div>
  );
};

export default LayoutToolbar;
