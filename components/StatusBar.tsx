
import React from 'react';

interface StatusBarProps {
  nodeCount: number;
  totalNodeCount: number;
  edgeCount: number;
  totalEdgeCount: number;
  isDarkMode: boolean;
  
  // Sunburst Mode
  sunburstState: { active: boolean; centerId: string | null; hops: number };
  onClearSunburst: () => void;
  centerNodeName?: string | null;

  // Node Filter Mode
  nodeFilterState: { active: boolean; centerId: string | null; hops: number };
  onClearNodeFilter: () => void;
  filterCenterNodeName?: string | null;
  
  // Selection Mode
  selectionCount: number;
  onClearSelection: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  nodeCount,
  totalNodeCount,
  edgeCount,
  totalEdgeCount,
  isDarkMode,
  sunburstState,
  onClearSunburst,
  centerNodeName,
  nodeFilterState,
  onClearNodeFilter,
  filterCenterNodeName,
  selectionCount,
  onClearSelection
}) => {
  const bgClass = isDarkMode ? 'bg-gray-900 border-t border-gray-800 text-gray-400' : 'bg-white border-t border-gray-200 text-gray-600';
  const activeModeClass = isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200';

  const displayNodeCount = nodeCount === totalNodeCount ? nodeCount : `${nodeCount} / ${totalNodeCount}`;
  const displayEdgeCount = edgeCount === totalEdgeCount ? edgeCount : `${edgeCount} / ${totalEdgeCount}`;

  return (
    <div className={`h-8 w-full flex items-center justify-between px-4 text-xs select-none z-[500] flex-shrink-0 ${bgClass}`}>
      
      {/* Left: Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1" title="Visible / Total Nodes">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            <span className="font-mono font-bold">{displayNodeCount}</span>
            <span>Nodes</span>
        </div>
        <div className="flex items-center gap-1" title="Visible / Total Edges">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            <span className="font-mono font-bold">{displayEdgeCount}</span>
            <span>Edges</span>
        </div>
        {selectionCount > 0 && (
             <div className="flex items-center gap-1 text-yellow-500 font-bold cursor-pointer hover:text-yellow-400 transition-colors" onClick={onClearSelection} title="Clear Selection">
                <span>{selectionCount} Selected</span>
                <span className="text-[9px] bg-gray-700 px-1 rounded ml-1 text-white">ESC</span>
             </div>
        )}
      </div>

      {/* Center/Right: Modes */}
      <div className="flex items-center gap-2">
          {sunburstState.active && (
              <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${activeModeClass}`}>
                  <span className="uppercase font-bold tracking-wider text-[10px]">Sunburst Mode</span>
                  <span className="opacity-70">| {centerNodeName || 'Unknown'} ({sunburstState.hops} hops)</span>
                  <button onClick={onClearSunburst} className="hover:text-red-400 ml-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
          )}
          
          {nodeFilterState.active && (
              <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${activeModeClass}`}>
                  <span className="uppercase font-bold tracking-wider text-[10px]">Neighborhood Filter</span>
                   <span className="opacity-70">| {filterCenterNodeName || 'Unknown'} ({nodeFilterState.hops} hops)</span>
                  <button onClick={onClearNodeFilter} className="hover:text-red-400 ml-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};
