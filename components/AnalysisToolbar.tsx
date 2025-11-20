import React, { useMemo, useState, useEffect } from 'react';
import { Element, Relationship } from '../types';

interface AnalysisToolbarProps {
  elements: Element[];
  relationships: Relationship[];
  onBulkTag: (elementIds: string[], tag: string, mode: 'add' | 'remove') => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const AnalysisToolbar: React.FC<AnalysisToolbarProps> = ({ elements, relationships, onBulkTag, isCollapsed, onToggle }) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  const handleTagAction = (ids: string[], tag: string) => {
      if (ids.length === 0) {
          // Optional: Feedback for empty selection
          // alert("No matching elements found.");
          return;
      }
      const mode = isShiftPressed ? 'remove' : 'add';
      onBulkTag(ids, tag, mode);
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1"
                title={isCollapsed ? "Expand Graph Analysis" : "Collapse Graph Analysis"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs font-bold tracking-wider">STATS</span>
            </button>

             {/* Expanded Content */}
             {!isCollapsed && (
                <div className="flex items-center gap-4 p-3 animate-fade-in bg-gray-800 h-20">
                    {/* Stats List */}
                    <div className="flex flex-col justify-center space-y-1 min-w-[110px] h-full border-r border-gray-600 pr-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-400 tracking-wider text-[10px]">NODES</span>
                            <span className="font-mono text-white font-bold">{stats.nodeCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-400 tracking-wider text-[10px]">LINKS</span>
                            <span className="font-mono text-white font-bold">{stats.relCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-400 tracking-wider text-[10px] whitespace-nowrap">AVG CONN</span>
                            <span className="font-mono text-white font-bold">{stats.avgRels}</span>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-col justify-center h-full">
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isShiftPressed ? 'text-red-400' : 'text-gray-400'}`}>
                            ANALYSIS ACTIONS - {isShiftPressed ? 'UNTAG' : 'TAG'}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleTagAction(stats.isolatedIds, 'Isolated')}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded border border-gray-600 transition-colors flex items-center gap-2"
                                title="Nodes with 0 connections"
                            >
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="font-semibold text-gray-200">Isolated ({stats.isolatedIds.length})</span>
                            </button>
                            
                             <button 
                                onClick={() => handleTagAction(stats.sourceIds, 'Source')}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded border border-gray-600 transition-colors flex items-center gap-2"
                                title="Nodes with Outgoing links only"
                            >
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                <span className="font-semibold text-gray-200">Sources ({stats.sourceIds.length})</span>
                            </button>
                            
                            <button 
                                onClick={() => handleTagAction(stats.sinkIds, 'Sink')}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded border border-gray-600 transition-colors flex items-center gap-2"
                                title="Nodes with Incoming links only"
                            >
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="font-semibold text-gray-200">Sinks ({stats.sinkIds.length})</span>
                            </button>

                            <button 
                                onClick={() => handleTagAction(stats.leafIds, 'Leaf')}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded border border-gray-600 transition-colors flex items-center gap-2"
                                title="Nodes with exactly 1 connection"
                            >
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-semibold text-gray-200">Leaves ({stats.leafIds.length})</span>
                            </button>
                            
                            <button 
                                onClick={() => handleTagAction(stats.hubIds, 'Hub')}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded border border-gray-600 transition-colors flex items-center gap-2"
                                title="Nodes with 5+ connections"
                            >
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                <span className="font-semibold text-gray-200">Hubs ({stats.hubIds.length})</span>
                            </button>

                            <button 
                                onClick={() => handleTagAction(stats.articulationIds, 'Articulation')}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded border border-gray-600 transition-colors flex items-center gap-2"
                                title="Nodes whose removal would disconnect the graph"
                            >
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <span className="font-semibold text-gray-200">Articulations ({stats.articulationIds.length})</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AnalysisToolbar;