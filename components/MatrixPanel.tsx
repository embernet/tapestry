
import React, { useMemo, useState } from 'react';
import { Element, Relationship } from '../types';

interface MatrixPanelProps {
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
  onNodeClick?: (id: string) => void;
  isDarkMode: boolean;
}

const MatrixPanel: React.FC<MatrixPanelProps> = ({ elements, relationships, onClose, onNodeClick, isDarkMode }) => {
  const [hoveredCell, setHoveredCell] = useState<{ source: string, target: string } | null>(null);

  // Sort elements alphabetically for the matrix axes
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => a.name.localeCompare(b.name));
  }, [elements]);

  // Map relationships for O(1) lookup: sourceId -> targetId -> Relationship
  const relMap = useMemo(() => {
    const map = new Map<string, Map<string, Relationship>>();
    relationships.forEach(rel => {
      if (!map.has(rel.source as string)) map.set(rel.source as string, new Map());
      if (!map.has(rel.target as string)) map.set(rel.target as string, new Map());
      
      map.get(rel.source as string)?.set(rel.target as string, rel);
      
      if (rel.direction === 'FROM') {
          map.get(rel.target as string)?.set(rel.source as string, rel);
      } else if (rel.direction === 'NONE') {
          // Undirected: map both ways
          map.get(rel.source as string)?.set(rel.target as string, rel);
          map.get(rel.target as string)?.set(rel.source as string, rel);
      }
    });
    return map;
  }, [relationships]);

  const CELL_SIZE = 20;
  const PADDING = 100; // Space for labels
  
  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const labelTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const canvasBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const selfCellClass = isDarkMode ? 'bg-gray-800' : 'bg-gray-200';
  const emptyCellClass = isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-100';
  const cellBorderClass = isDarkMode ? 'border-gray-800' : 'border-gray-100';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
        <div className={`p-4 flex-shrink-0 flex justify-between items-center border-b ${borderClass}`}>
            <h2 className={`text-xl font-bold ${textClass}`}>Adjacency Matrix</h2>
            <button onClick={onClose} className={`${labelTextClass} hover:text-blue-500`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className={`flex-grow overflow-auto p-4 relative ${canvasBgClass}`}>
            {elements.length === 0 ? (
                <p className={labelTextClass}>No elements to display.</p>
            ) : (
                <div style={{ 
                    position: 'relative', 
                    width: PADDING + sortedElements.length * CELL_SIZE, 
                    height: PADDING + sortedElements.length * CELL_SIZE 
                }}>
                    {/* Column Headers */}
                    {sortedElements.map((el, i) => (
                        <div 
                            key={`col-${el.id}`}
                            onClick={() => onNodeClick && onNodeClick(el.id)}
                            className={`absolute origin-bottom-left transform -rotate-45 text-xs whitespace-nowrap ${labelTextClass} cursor-pointer hover:text-blue-500 transition-colors`}
                            style={{ 
                                left: PADDING + i * CELL_SIZE + 12, 
                                top: PADDING - 5,
                                width: PADDING 
                            }}
                        >
                            {el.name}
                        </div>
                    ))}

                    {/* Rows */}
                    {sortedElements.map((rowEl, i) => (
                        <React.Fragment key={`row-${rowEl.id}`}>
                            {/* Row Header */}
                            <div 
                                onClick={() => onNodeClick && onNodeClick(rowEl.id)}
                                className={`absolute text-xs text-right whitespace-nowrap overflow-hidden ${labelTextClass} cursor-pointer hover:text-blue-500 transition-colors`}
                                style={{ 
                                    left: 0, 
                                    top: PADDING + i * CELL_SIZE, 
                                    width: PADDING - 10, 
                                    height: CELL_SIZE,
                                    lineHeight: `${CELL_SIZE}px`
                                }}
                                title={rowEl.name}
                            >
                                {rowEl.name}
                            </div>

                            {/* Cells */}
                            {sortedElements.map((colEl, j) => {
                                const rel = relMap.get(rowEl.id)?.get(colEl.id);
                                const isSelf = rowEl.id === colEl.id;
                                const isHovered = hoveredCell && (hoveredCell.source === rowEl.id || hoveredCell.target === colEl.id);
                                
                                return (
                                    <div
                                        key={`${rowEl.id}-${colEl.id}`}
                                        onMouseEnter={() => setHoveredCell({ source: rowEl.id, target: colEl.id })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                        className={`absolute border ${cellBorderClass} transition-colors ${
                                            isSelf ? selfCellClass : 
                                            rel ? 'bg-blue-500 hover:bg-blue-400' : 
                                            emptyCellClass
                                        }`}
                                        style={{
                                            left: PADDING + j * CELL_SIZE,
                                            top: PADDING + i * CELL_SIZE,
                                            width: CELL_SIZE,
                                            height: CELL_SIZE,
                                            opacity: hoveredCell && !isHovered ? 0.3 : 1
                                        }}
                                        title={rel ? `${rowEl.name} -> ${colEl.name}: ${rel.label}` : `${rowEl.name} -> ${colEl.name}`}
                                    />
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default MatrixPanel;
