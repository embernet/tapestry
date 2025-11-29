
import React, { useMemo, useState, useEffect } from 'react';
import { Element, Relationship } from '../types';

interface AnalysisToolbarProps {
  elements: Element[];
  relationships: Relationship[];
  onBulkTag: (elementIds: string[], tag: string, mode: 'add' | 'remove') => void;
  onHighlight: (highlightMap: Map<string, string>) => void;
  onFilter: (mode: 'hide' | 'hide_others' | 'none', ids: Set<string>) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isSimulationMode: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  isDarkMode: boolean;
}

const ANALYSIS_CATEGORIES = [
    { id: 'isolated', label: 'Isolated', tag: 'Isolated', color: 'bg-red-300', borderColor: 'border-red-300', textColor: 'text-red-900', hex: '#fca5a5' },
    { id: 'source', label: 'Sources', tag: 'Source', color: 'bg-orange-300', borderColor: 'border-orange-300', textColor: 'text-orange-900', hex: '#fdba74' },
    { id: 'sink', label: 'Sinks', tag: 'Sink', color: 'bg-blue-300', borderColor: 'border-blue-300', textColor: 'text-blue-900', hex: '#93c5fd' },
    { id: 'leaf', label: 'Leaves', tag: 'Leaf', color: 'bg-green-300', borderColor: 'border-green-300', textColor: 'text-green-900', hex: '#86efac' },
    { id: 'hub', label: 'Hubs', tag: 'Hub', color: 'bg-purple-300', borderColor: 'border-purple-300', textColor: 'text-purple-900', hex: '#d8b4fe' },
    { id: 'articulation', label: 'Articulations', tag: 'Articulation', color: 'bg-yellow-300', borderColor: 'border-yellow-300', textColor: 'text-yellow-900', hex: '#fcd34d' }
];

const AnalysisToolbar: React.FC<AnalysisToolbarProps> = ({ elements, relationships, onBulkTag, onHighlight, onFilter, isCollapsed, onToggle, isSimulationMode, onToggleSimulation, onResetSimulation, isDarkMode }) => {
  const [actionType, setActionType] = useState<'tag' | 'highlight' | 'hide' | 'hide_others'>('highlight');
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    const nodeCount = elements.length;
    const relCount = relationships.length;
    const avgRels = nodeCount > 0 ? (relCount / nodeCount).toFixed(1) : '0';
    
    // 1. Build Adjacency Maps
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>(); // Undirected adjacency for articulation points
    
    elements.forEach(e => {
        inDegree.set(e.id, 0);
        outDegree.set(e.id, 0);
        adjList.set(e.id, []);
    });

    relationships.forEach(r => {
        const src = r.source as string;
        const tgt = r.target as string;
        
        // Degrees
        outDegree.set(src, (outDegree.get(src) || 0) + 1);
        inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
        
        // Adjacency (Undirected for connectivity)
        adjList.get(src)?.push(tgt);
        adjList.get(tgt)?.push(src);
    });

    const isolatedIds: string[] = [];
    const leafIds: string[] = [];
    const hubIds: string[] = [];
    const sourceIds: string[] = [];
    const sinkIds: string[] = [];

    elements.forEach(e => {
        const id = e.id;
        const inD = inDegree.get(id) || 0;
        const outD = outDegree.get(id) || 0;
        const totalDegree = inD + outD;

        if (totalDegree === 0) isolatedIds.push(id);
        if (totalDegree === 1) leafIds.push(id);
        if (totalDegree >= 5) hubIds.push(id);
        
        // Source: No incoming, but has outgoing (not isolated)
        if (inD === 0 && outD > 0) sourceIds.push(id);
        
        // Sink: Has incoming, but no outgoing (not isolated)
        if (inD > 0 && outD === 0) sinkIds.push(id);
    });

    // 2. Calculate Articulation Points (Cut Vertices)
    // Using Tarjan's/Hopcroft-Tarjan algorithm (DFS)
    const articulationIds: string[] = [];
    const visited = new Set<string>();
    const discoveryTime = new Map<string, number>();
    const lowTime = new Map<string, number>();
    const parentMap = new Map<string, string | null>();
    let time = 0;

    const findAPs = (u: string) => {
        let children = 0;
        visited.add(u);
        time++;
        discoveryTime.set(u, time);
        lowTime.set(u, time);

        const neighbors = adjList.get(u) || [];
        for (const v of neighbors) {
            if (v === parentMap.get(u)) continue; // Don't go back to parent in DFS tree

            if (visited.has(v)) {
                // Back edge
                lowTime.set(u, Math.min(lowTime.get(u)!, discoveryTime.get(v)!));
            } else {
                // Tree edge
                children++;
                parentMap.set(v, u);
                findAPs(v);

                // Check if subtree rooted at v has a connection back to one of u's ancestors
                lowTime.set(u, Math.min(lowTime.get(u)!, lowTime.get(v)!));

                // Articulation point check
                if (parentMap.get(u) !== null && lowTime.get(v)! >= discoveryTime.get(u)!) {
                    if (!articulationIds.includes(u)) articulationIds.push(u);
                }
            }
        }

        // Root check
        if (parentMap.get(u) === null && children > 1) {
            if (!articulationIds.includes(u)) articulationIds.push(u);
        }
    };

    elements.forEach(e => {
        if (!visited.has(e.id)) {
            parentMap.set(e.id, null);
            findAPs(e.id);
        }
    });

    return { 
        nodeCount, relCount, avgRels, 
        isolatedIds, leafIds, hubIds, 
        sourceIds, sinkIds, articulationIds 
    };
  }, [elements, relationships]);

  // Effect to update highlights/filters whenever active categories or mode changes
  useEffect(() => {
      const selectedIds = new Set<string>();
      const highlightMap = new Map<string, string>();

      ANALYSIS_CATEGORIES.forEach(cat => {
          if (activeCategoryIds.has(cat.id)) {
              const key = `${cat.id}Ids` as keyof typeof stats;
              const ids = stats[key] as string[];
              if (Array.isArray(ids)) {
                  ids.forEach(id => {
                      selectedIds.add(id);
                      // Apply colors in order of definition (later overrides earlier if node is in multiple sets)
                      highlightMap.set(id, cat.hex);
                  });
              }
          }
      });

      if (actionType === 'highlight') {
          onHighlight(highlightMap);
          onFilter('none', new Set());
      } else if (actionType === 'hide') {
          onHighlight(new Map()); // Clear highlights when filtering
          onFilter('hide', selectedIds);
      } else if (actionType === 'hide_others') {
          onHighlight(new Map()); // Clear highlights when filtering
          // If nothing is selected in 'Hide Others', strict interpretation means everything is hidden.
          if (activeCategoryIds.size === 0) {
              onFilter('none', new Set()); // To avoid "blank screen shock", behave like 'none' if nothing selected
          } else {
              onFilter('hide_others', selectedIds);
          }
      } else {
          // Tag mode
          onHighlight(new Map());
          onFilter('none', new Set());
      }
  }, [activeCategoryIds, actionType, stats, onHighlight, onFilter]);

  const handleToggleCategory = (catId: string, tagLabel: string) => {
      const newSet = new Set(activeCategoryIds);
      const isActive = newSet.has(catId);
      
      if (isActive) {
          newSet.delete(catId);
          if (actionType === 'tag') {
              const key = `${catId}Ids` as keyof typeof stats;
              onBulkTag(stats[key] as string[], tagLabel, 'remove');
          }
      } else {
          newSet.add(catId);
          if (actionType === 'tag') {
              const key = `${catId}Ids` as keyof typeof stats;
              onBulkTag(stats[key] as string[], tagLabel, 'add');
          }
      }
      setActiveCategoryIds(newSet);
  };

  const handleReset = () => {
      if (actionType === 'tag') {
          // Remove all tags related to analysis from all nodes
          ANALYSIS_CATEGORIES.forEach(cat => {
              if (activeCategoryIds.has(cat.id)) {
                  const key = `${cat.id}Ids` as keyof typeof stats;
                  onBulkTag(stats[key] as string[], cat.tag, 'remove');
              }
          });
      }
      
      setActiveCategoryIds(new Set());
      // The useEffect will clear filters/highlights automatically when activeCategoryIds becomes empty
  };

  // Styles
  const bgClass = isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200';
  const buttonBgClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-purple-400' : 'bg-white hover:bg-gray-50 border-gray-200 text-purple-600';
  const contentBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueClass = isDarkMode ? 'text-white' : 'text-gray-800';
  const buttonResetBg = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300 hover:text-white' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-600 hover:text-black';
  const selectBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';
  const toggleBtnInactive = isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-100';
  const toggleBtnTextInactive = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <div className={`flex items-stretch gap-0 rounded-lg border shadow-lg pointer-events-auto overflow-hidden ${bgClass}`}>
            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className={`border-r w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1 ${buttonBgClass}`}
                title={isCollapsed ? "Expand Graph Analysis" : "Collapse Graph Analysis"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className={`text-[10px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>ANALYSIS</span>
            </button>

             {/* Expanded Content */}
             {!isCollapsed && (
                <div className={`flex items-center gap-4 p-3 animate-fade-in h-20 ${contentBgClass}`}>
                    {/* Stats List */}
                    <div className={`flex flex-col justify-center space-y-1 min-w-[110px] h-full border-r pr-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-center text-xs">
                            <span className={`font-bold tracking-wider text-[10px] ${labelClass}`}>NODES</span>
                            <span className={`font-mono font-bold ${valueClass}`}>{stats.nodeCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className={`font-bold tracking-wider text-[10px] ${labelClass}`}>LINKS</span>
                            <span className={`font-mono font-bold ${valueClass}`}>{stats.relCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className={`font-bold tracking-wider text-[10px] whitespace-nowrap ${labelClass}`}>AVG CONN</span>
                            <span className={`font-mono font-bold ${valueClass}`}>{stats.avgRels}</span>
                        </div>
                    </div>

                    {/* Simulation Section */}
                    <div className={`flex flex-col justify-center h-full px-2 border-r pr-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            SIMULATION
                        </span>
                        <div className="flex gap-2 items-center">
                            <button 
                                onClick={onToggleSimulation}
                                className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${isSimulationMode ? 'bg-blue-600 border-blue-500 text-white' : `${toggleBtnInactive} ${toggleBtnTextInactive}`}`}
                                title="Toggle Impact Simulation Mode"
                            >
                                {isSimulationMode ? (
                                    <>
                                        <span className="animate-pulse">●</span> Active
                                    </>
                                ) : (
                                    <>
                                        <span>▶</span> Play
                                    </>
                                )}
                            </button>
                            {isSimulationMode && (
                                <button 
                                    onClick={onResetSimulation}
                                    className={`text-xs px-2 py-1.5 rounded border transition-colors ${buttonResetBg}`}
                                    title="Reset Simulation"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-col justify-center h-full pl-2">
                        <div className="flex items-center justify-between mb-2 gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>
                                ACTIONS
                            </span>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value as 'tag' | 'highlight' | 'hide' | 'hide_others')}
                                    className={`border text-[10px] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase font-bold max-w-[100px] ${selectBg}`}
                                >
                                    <option value="highlight">Highlight</option>
                                    <option value="tag">Tag</option>
                                    <option value="hide">Hide</option>
                                    <option value="hide_others">Hide Others</option>
                                </select>
                                <button 
                                    onClick={handleReset}
                                    className={`text-[10px] border px-2 py-0.5 rounded transition-colors ${buttonResetBg}`}
                                    title={`Reset ${actionType}`}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            {ANALYSIS_CATEGORIES.map(cat => {
                                const isActive = activeCategoryIds.has(cat.id);
                                const count = (stats[`${cat.id}Ids` as keyof typeof stats] as string[]).length;
                                
                                return (
                                    <button 
                                        key={cat.id}
                                        onClick={() => handleToggleCategory(cat.id, cat.tag)}
                                        className={`text-xs px-3 py-1.5 rounded border transition-all flex items-center gap-2 ${
                                            isActive 
                                            ? `${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} ${cat.borderColor} border-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]` 
                                            : `${toggleBtnInactive}`
                                        }`}
                                        title={`Toggle ${cat.label} (${count})`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
                                        <span className={`font-semibold ${isActive ? (isDarkMode ? 'text-white' : 'text-gray-900') : toggleBtnTextInactive}`}>
                                            {cat.label} ({count})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AnalysisToolbar;
