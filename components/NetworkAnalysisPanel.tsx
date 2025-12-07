
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Element, Relationship } from '../types';

interface NetworkAnalysisPanelProps {
  elements: Element[];
  relationships: Relationship[];
  onBulkTag: (elementIds: string[], tag: string, mode: 'add' | 'remove') => void;
  onHighlight: (highlightMap: Map<string, string>) => void;
  onFilter: (mode: 'hide' | 'hide_others' | 'none', ids: Set<string>) => void;
  isSimulationMode: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onClose: () => void;
  isDarkMode: boolean;
  isHighlightToolActive?: boolean;
  setIsHighlightToolActive?: (active: boolean) => void;
}

const ANALYSIS_CATEGORIES = [
    { id: 'isolated', label: 'Isolated', tag: 'Isolated', color: 'bg-red-300', borderColor: 'border-red-300', textColor: 'text-red-900', hex: '#fca5a5' },
    { id: 'source', label: 'Sources', tag: 'Source', color: 'bg-orange-300', borderColor: 'border-orange-300', textColor: 'text-orange-900', hex: '#fdba74' },
    { id: 'sink', label: 'Sinks', tag: 'Sink', color: 'bg-blue-300', borderColor: 'border-blue-300', textColor: 'text-blue-900', hex: '#93c5fd' },
    { id: 'leaf', label: 'Leaves', tag: 'Leaf', color: 'bg-green-300', borderColor: 'border-green-300', textColor: 'text-green-900', hex: '#86efac' },
    { id: 'hub', label: 'Hubs', tag: 'Hub', color: 'bg-purple-300', borderColor: 'border-purple-300', textColor: 'text-purple-900', hex: '#d8b4fe' },
    { id: 'articulation', label: 'Articulations', tag: 'Articulation', color: 'bg-yellow-300', borderColor: 'border-yellow-300', textColor: 'text-yellow-900', hex: '#fcd34d' }
];

export const NetworkAnalysisPanel: React.FC<NetworkAnalysisPanelProps> = ({ 
    elements, relationships, onBulkTag, onHighlight, onFilter, 
    isSimulationMode, onToggleSimulation, onResetSimulation, onClose, isDarkMode,
    isHighlightToolActive, setIsHighlightToolActive
}) => {
  const [actionType, setActionType] = useState<'tag' | 'highlight' | 'hide' | 'hide_others'>('highlight');
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set());

  // Window Drag State
  const [position, setPosition] = useState({ x: 20, y: 180 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

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
            if (v === parentMap.get(u)) continue; 

            if (visited.has(v)) {
                lowTime.set(u, Math.min(lowTime.get(u)!, discoveryTime.get(v)!));
            } else {
                children++;
                parentMap.set(v, u);
                findAPs(v);
                lowTime.set(u, Math.min(lowTime.get(u)!, lowTime.get(v)!));
                if (parentMap.get(u) !== null && lowTime.get(v)! >= discoveryTime.get(u)!) {
                    if (!articulationIds.includes(u)) articulationIds.push(u);
                }
            }
        }
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
                      highlightMap.set(id, cat.hex);
                  });
              }
          }
      });

      if (actionType === 'highlight') {
          onHighlight(highlightMap);
          onFilter('none', new Set());
      } else if (actionType === 'hide') {
          onHighlight(new Map()); 
          onFilter('hide', selectedIds);
      } else if (actionType === 'hide_others') {
          onHighlight(new Map());
          if (activeCategoryIds.size === 0) {
              onFilter('none', new Set()); 
          } else {
              onFilter('hide_others', selectedIds);
          }
      } else {
          onHighlight(new Map());
          onFilter('none', new Set());
      }
  }, [activeCategoryIds, actionType, stats, onHighlight, onFilter]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking buttons inside header
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
          ANALYSIS_CATEGORIES.forEach(cat => {
              if (activeCategoryIds.has(cat.id)) {
                  const key = `${cat.id}Ids` as keyof typeof stats;
                  onBulkTag(stats[key] as string[], cat.tag, 'remove');
              }
          });
      }
      setActiveCategoryIds(new Set());
  };

  const bgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const valueClass = isDarkMode ? 'text-blue-300' : 'text-blue-700';
  const selectBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';
  const toggleBtnInactive = isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-100';
  const toggleBtnTextInactive = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div 
        className={`fixed z-[500] w-[350px] rounded-lg shadow-2xl border ${bgClass} overflow-hidden flex flex-col max-h-[calc(100vh-200px)]`}
        style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div 
        className={`p-4 border-b flex justify-between items-center cursor-move select-none ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
        onMouseDown={handleMouseDown}
      >
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="6" cy="18" r="2" />
                  <circle cx="12" cy="6" r="2" />
                  <circle cx="18" cy="18" r="2" />
                  <path d="M6 18 L12 6 L18 18 Z" />
              </svg>
              Network Analysis
          </h2>
          <button onClick={onClose} className={`hover:text-purple-500 ${labelClass}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
      </div>

      <div className="p-4 overflow-y-auto space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center bg-black/10 p-3 rounded">
              <div>
                  <div className={`text-[10px] font-bold uppercase ${labelClass}`}>Nodes</div>
                  <div className={`text-xl font-mono font-bold ${valueClass}`}>{stats.nodeCount}</div>
              </div>
              <div>
                  <div className={`text-[10px] font-bold uppercase ${labelClass}`}>Links</div>
                  <div className={`text-xl font-mono font-bold ${valueClass}`}>{stats.relCount}</div>
              </div>
              <div>
                  <div className={`text-[10px] font-bold uppercase ${labelClass}`}>Avg Conn</div>
                  <div className={`text-xl font-mono font-bold ${valueClass}`}>{stats.avgRels}</div>
              </div>
          </div>

          {/* Tools */}
          <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${labelClass}`}>Interactive Tools</h3>
              <div className="flex gap-2">
                  <button 
                      onClick={onToggleSimulation}
                      className={`flex-grow py-2 rounded text-xs font-bold border transition-colors flex justify-center items-center gap-2 ${isSimulationMode ? 'bg-blue-600 border-blue-500 text-white animate-pulse' : toggleBtnInactive}`}
                  >
                      {isSimulationMode ? 'Simulation Active' : 'Simulation'}
                  </button>
                  {isSimulationMode && (
                      <button 
                          onClick={onResetSimulation}
                          className={`px-3 py-2 rounded text-xs font-bold border transition-colors ${toggleBtnInactive}`}
                      >
                          Reset
                      </button>
                  )}
                  
                  {/* Highlighter Toggle */}
                  {setIsHighlightToolActive && (
                      <button
                          onClick={() => setIsHighlightToolActive(!isHighlightToolActive)}
                          className={`flex-grow py-2 rounded text-xs font-bold border transition-colors flex justify-center items-center gap-2 ${isHighlightToolActive ? 'bg-yellow-500 border-yellow-400 text-black animate-pulse' : toggleBtnInactive}`}
                          title="Manual Highlighter Pen"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 11-6 6v3h3l6-6"/>
                              <path d="m22 2-2.5 2.5"/>
                              <path d="M13.5 6.5 8 12"/>
                          </svg>
                          {isHighlightToolActive ? 'Highlighting' : 'Highlighter'}
                      </button>
                  )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                  Use Simulation to test impact flow, or Highlighter to manually mark nodes.
              </p>
          </div>

          {/* Structural Analysis */}
          <div>
              <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Structure</h3>
                  <div className="flex gap-2">
                    <select 
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value as 'tag' | 'highlight' | 'hide' | 'hide_others')}
                        className={`text-[10px] rounded px-1 py-0.5 border outline-none ${selectBg}`}
                    >
                        <option value="highlight">Highlight</option>
                        <option value="tag">Tag</option>
                        <option value="hide">Hide Selected</option>
                        <option value="hide_others">Hide Others</option>
                    </select>
                    <button 
                        onClick={handleReset}
                        className={`text-[10px] px-2 py-0.5 rounded border ${toggleBtnInactive}`}
                    >
                        Clear
                    </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  {ANALYSIS_CATEGORIES.map(cat => {
                      const isActive = activeCategoryIds.has(cat.id);
                      const count = (stats[`${cat.id}Ids` as keyof typeof stats] as string[]).length;
                      
                      return (
                          <button 
                              key={cat.id}
                              onClick={() => handleToggleCategory(cat.id, cat.tag)}
                              className={`text-xs px-2 py-2 rounded border transition-all flex justify-between items-center ${
                                  isActive 
                                  ? `${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} ${cat.borderColor} border-l-4 shadow-sm` 
                                  : `${toggleBtnInactive} border-l-4 border-transparent`
                              }`}
                          >
                              <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
                                  <span className={`${isActive ? (isDarkMode ? 'text-white' : 'text-gray-900') : toggleBtnTextInactive}`}>
                                      {cat.label}
                                  </span>
                              </div>
                              <span className="text-[10px] font-mono opacity-60">{count}</span>
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};
