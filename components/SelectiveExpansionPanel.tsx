import React from 'react';

interface SelectiveExpansionPanelProps {
  centerNodeName: string | null;
  expandedCount: number;
  visibleCount: number;
  onRestart: () => void;
  onClose: () => void;
  physicsEnabled: boolean;
  onTogglePhysics: () => void;
}

export const SelectiveExpansionPanel: React.FC<SelectiveExpansionPanelProps> = ({
  centerNodeName,
  expandedCount,
  visibleCount,
  onRestart,
  onClose,
  physicsEnabled,
  onTogglePhysics
}) => {

  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
      <div className="p-3 border-b border-gray-700 bg-gray-900 flex justify-between items-center shrink-0">
        <h2 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Expansion
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 items-center flex-grow text-center overflow-y-auto">
        
        {/* Mode Switch */}
        <div className="bg-gray-900/50 p-2 rounded border border-gray-700 w-full flex items-center justify-between shadow-sm">
            <div className="text-left">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Layout</div>
                <div className="text-[10px] text-gray-500">{physicsEnabled ? 'Dynamic' : 'Static'}</div>
            </div>
            <button 
                onClick={onTogglePhysics}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${physicsEnabled ? 'bg-purple-600' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${physicsEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
        </div>

        {!centerNodeName ? (
            <div className="animate-pulse text-gray-400 py-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="font-semibold text-sm">Select a Node</p>
                <p className="text-xs mt-1 opacity-70">Click canvas to start.</p>
            </div>
        ) : (
            <>
                <div className="w-full">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 text-left">Current Focus</div>
                    <div className="text-sm font-bold text-white bg-gray-700 px-3 py-2 rounded border border-gray-600 truncate shadow-sm text-left">
                        {centerNodeName}
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between gap-2 text-xs">
                        <div className="flex-1 flex flex-col items-center bg-gray-900/50 px-2 py-2 rounded border border-gray-700">
                            <span className="text-lg font-bold text-green-400 leading-none">{expandedCount}</span>
                            <span className="text-[9px] text-gray-400 uppercase mt-1">Active</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center bg-gray-900/50 px-2 py-2 rounded border border-gray-700">
                            <span className="text-lg font-bold text-blue-400 leading-none">{visibleCount}</span>
                            <span className="text-[9px] text-gray-400 uppercase mt-1">Visible</span>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-400 bg-gray-900/30 px-3 py-2 rounded border border-gray-700/50 text-left w-full space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-black border border-gray-500 flex-shrink-0"></span>
                        <span>Black border: Fully explored</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400 border border-gray-500 flex-shrink-0"></span>
                        <span>Gray border: Click to expand</span>
                    </div>
                </div>

                <button 
                    onClick={onRestart}
                    className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold py-2 px-4 rounded transition-colors w-full mt-auto shadow-md"
                >
                    Restart
                </button>
            </>
        )}
      </div>
    </div>
  );
};