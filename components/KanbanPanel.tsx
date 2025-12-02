
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Element, ModelActions } from '../types';

interface KanbanPanelProps {
  elements: Element[];
  modelActions: ModelActions;
  onClose: () => void;
  selectedElementId: string | null;
  onNodeClick: (elementId: string) => void;
  isDarkMode: boolean;
}

const DEFAULT_COLUMNS = ['To Do', 'Doing', 'Blocked', 'Done', 'Not Doing'];
const GROUP_BY_ATTRIBUTE = 'Status';
const KANBAN_ORDER_ATTR = 'kanbanOrder';

export const KanbanPanel: React.FC<KanbanPanelProps> = ({ 
    elements, modelActions, onClose, selectedElementId, onNodeClick, isDarkMode 
}) => {
  // State for dynamic columns (excluding Unassigned which is always first)
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  
  // Combine for rendering: Unassigned + Custom Columns
  const allColumns = useMemo(() => ['Unassigned', ...columns], [columns]);

  // Drag state
  const dragItem = useRef<{ type: 'COLUMN' | 'CARD', id: string, index: number, colId?: string } | null>(null);
  
  // Refs for scrolling columns
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Helper to get order safely
  const getOrder = (el: Element): number => {
      const val = parseFloat(el.attributes?.[KANBAN_ORDER_ATTR] || '0');
      return isNaN(val) ? 0 : val;
  };

  // Group elements
  const groupedData = useMemo(() => {
    const groups: Record<string, Element[]> = {};
    
    // Initialize
    allColumns.forEach(col => groups[col] = []);

    elements.forEach(el => {
        let status = el.attributes?.[GROUP_BY_ATTRIBUTE];
        if (!status || !columns.includes(status)) {
            status = 'Unassigned';
        }
        
        if (groups[status]) {
            groups[status].push(el);
        } else {
            groups['Unassigned'].push(el);
        }
    });

    // Sort cleanly without mutating the element objects
    Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => getOrder(a) - getOrder(b));
    });

    return groups;
  }, [elements, columns, allColumns]);

  // Helper to calculate new order value to sit between two items
  const calculateNewOrder = (prevEl?: Element, nextEl?: Element): number => {
      const p = prevEl ? getOrder(prevEl) : null;
      const n = nextEl ? getOrder(nextEl) : null;
      
      const SPACING = 1000;

      // Case 1: Empty list (shouldn't happen in move context usually, but safe fallback)
      if (p === null && n === null) return 0;

      // Case 2: Inserting at start (no prev)
      if (p === null && n !== null) return n - SPACING;

      // Case 3: Inserting at end (no next)
      if (p !== null && n === null) return p + SPACING;

      // Case 4: Inserting between two items
      if (p !== null && n !== null) {
          if (n <= p) {
              // Collision or bad sort (e.g. both are 0). Force a step up to disambiguate.
              return p + (SPACING / 2);
          }
          return (p + n) / 2;
      }
      
      return 0;
  };

  // Keyboard Shortcuts (Navigation & Movement)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Ignore inputs
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

          // 1. Number Keys (Move to specific column top)
          const key = parseInt(e.key);
          if (!isNaN(key) && selectedElementId) {
              if (key >= 0 && key < allColumns.length) {
                  const targetCol = allColumns[key];
                  moveElementToColumn(selectedElementId, targetCol, true); // true = to top
                  return;
              }
          }

          // 2. Cursor Keys (Navigate / Move)
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElementId) {
              e.preventDefault();
              
              // Find current position
              let currentColIndex = -1;
              let currentCardIndex = -1;
              
              for (let c = 0; c < allColumns.length; c++) {
                  const colName = allColumns[c];
                  const idx = groupedData[colName].findIndex(el => el.id === selectedElementId);
                  if (idx !== -1) {
                      currentColIndex = c;
                      currentCardIndex = idx;
                      break;
                  }
              }

              if (currentColIndex === -1) return; // Should not happen if selected

              const isCtrl = e.ctrlKey || e.metaKey;
              const currentColName = allColumns[currentColIndex];
              const currentList = groupedData[currentColName];

              // --- Move Logic (Ctrl + Arrow) ---
              if (isCtrl) {
                  if (e.key === 'ArrowUp') {
                      if (currentCardIndex > 0) {
                          // Swap with item above. 
                          // Target position: Between (index-2) and (index-1).
                          const prevItem = currentList[currentCardIndex - 2];
                          const nextItem = currentList[currentCardIndex - 1]; // The item we are jumping over
                          
                          const newOrder = calculateNewOrder(prevItem, nextItem);
                          updateCardPosition(selectedElementId, currentColName, newOrder);
                      }
                  } else if (e.key === 'ArrowDown') {
                      if (currentCardIndex < currentList.length - 1) {
                          // Swap with item below.
                          // Target position: Between (index+1) and (index+2).
                          const prevItem = currentList[currentCardIndex + 1]; // The item we are jumping over
                          const nextItem = currentList[currentCardIndex + 2];
                          
                          const newOrder = calculateNewOrder(prevItem, nextItem);
                          updateCardPosition(selectedElementId, currentColName, newOrder);
                      }
                  } else if (e.key === 'ArrowLeft') {
                      if (currentColIndex > 0) {
                          const targetColName = allColumns[currentColIndex - 1];
                          const targetList = groupedData[targetColName];
                          
                          // Insert at approximately the same visual height (index)
                          const targetIndex = Math.min(currentCardIndex, targetList.length);
                          
                          const prevItem = targetIndex > 0 ? targetList[targetIndex - 1] : undefined;
                          const nextItem = targetList[targetIndex];
                          
                          const newOrder = calculateNewOrder(prevItem, nextItem);
                          updateCardPosition(selectedElementId, targetColName, newOrder);
                      }
                  } else if (e.key === 'ArrowRight') {
                      if (currentColIndex < allColumns.length - 1) {
                          const targetColName = allColumns[currentColIndex + 1];
                          const targetList = groupedData[targetColName];
                          
                          const targetIndex = Math.min(currentCardIndex, targetList.length);
                          
                          const prevItem = targetIndex > 0 ? targetList[targetIndex - 1] : undefined;
                          const nextItem = targetList[targetIndex];
                          
                          const newOrder = calculateNewOrder(prevItem, nextItem);
                          updateCardPosition(selectedElementId, targetColName, newOrder);
                      }
                  }
                  return;
              }

              // --- Navigate Logic (Arrow Only) ---
              if (e.key === 'ArrowUp') {
                  if (currentCardIndex > 0) {
                      onNodeClick(currentList[currentCardIndex - 1].id);
                  }
              } else if (e.key === 'ArrowDown') {
                  if (currentCardIndex < currentList.length - 1) {
                      onNodeClick(currentList[currentCardIndex + 1].id);
                  }
              } else if (e.key === 'ArrowLeft') {
                  if (currentColIndex > 0) {
                      const targetList = groupedData[allColumns[currentColIndex - 1]];
                      if (targetList.length > 0) {
                          // Try to maintain row index, else pick last
                          const targetIndex = Math.min(currentCardIndex, targetList.length - 1);
                          onNodeClick(targetList[targetIndex].id);
                      }
                  }
              } else if (e.key === 'ArrowRight') {
                  if (currentColIndex < allColumns.length - 1) {
                      const targetList = groupedData[allColumns[currentColIndex + 1]];
                      if (targetList.length > 0) {
                          const targetIndex = Math.min(currentCardIndex, targetList.length - 1);
                          onNodeClick(targetList[targetIndex].id);
                      }
                  }
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, allColumns, groupedData, onNodeClick, modelActions, elements]);

  const moveElementToColumn = (elementId: string, targetCol: string, toTop: boolean = false) => {
      const targetList = groupedData[targetCol] || [];
      let newOrder = 0;
      
      if (toTop) {
          const nextItem = targetList[0];
          newOrder = calculateNewOrder(undefined, nextItem);
      } else {
          const prevItem = targetList[targetList.length - 1];
          newOrder = calculateNewOrder(prevItem, undefined);
      }

      modelActions.setElementAttribute(elementId, KANBAN_ORDER_ATTR, newOrder.toString());
      const elName = elements.find(e => e.id === elementId)?.name || '';
      
      if (targetCol === 'Unassigned') {
          modelActions.deleteElementAttribute(elName, GROUP_BY_ATTRIBUTE);
      } else {
          modelActions.setElementAttribute(elName, GROUP_BY_ATTRIBUTE, targetCol);
      }
  };

  const updateCardPosition = (elementId: string, colName: string, order: number) => {
      modelActions.setElementAttribute(elementId, KANBAN_ORDER_ATTR, order.toString());
      const elName = elements.find(e => e.id === elementId)?.name || '';
      if (colName === 'Unassigned') {
          modelActions.deleteElementAttribute(elName, GROUP_BY_ATTRIBUTE);
      } else {
          modelActions.setElementAttribute(elName, GROUP_BY_ATTRIBUTE, colName);
      }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, type: 'COLUMN' | 'CARD', id: string, index: number, colId?: string) => {
      e.stopPropagation();
      dragItem.current = { type, id, index, colId };
      e.dataTransfer.effectAllowed = 'move';
      
      // If dragging a card, select it so we can see which one it is easily
      if (type === 'CARD') {
          onNodeClick(id);
      }
  };

  const handleDragOver = (e: React.DragEvent, colName: string) => {
      e.preventDefault();
      e.stopPropagation();

      // Auto-scrolling logic
      const container = columnRefs.current.get(colName);
      if (container) {
          const { top, bottom } = container.getBoundingClientRect();
          const mouseY = e.clientY;
          const threshold = 60; // Distance from edge to start scrolling
          const scrollSpeed = 15; // Pixels per event (roughly)

          if (mouseY < top + threshold) {
              container.scrollTop -= scrollSpeed;
          } else if (mouseY > bottom - threshold) {
              container.scrollTop += scrollSpeed;
          }
      }
  };

  const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDropOnColumn = (e: React.DragEvent, colName: string) => {
      e.stopPropagation();
      
      if (!dragItem.current) return;

      if (dragItem.current.type === 'CARD') {
          const elementId = dragItem.current.id;
          
          // Determine order: Append to end if dropped on the empty part of the column
          const targetList = groupedData[colName] || [];
          const lastItem = targetList[targetList.length - 1];
          const newOrder = calculateNewOrder(lastItem, undefined);

          // Only update if moved to a different column or strictly appending
          // (DropOnCard handles specific insertions, this handles dropping in empty space)
          if (dragItem.current.colId !== colName) {
               updateCardPosition(elementId, colName, newOrder);
          }
      } else if (dragItem.current.type === 'COLUMN') {
          // Reorder columns
          handleColumnReorder(colName);
      }
      
      resetDrag();
  };

  const handleDropOnCard = (e: React.DragEvent, targetElementId: string, targetCol: string, targetIndex: number) => {
      e.stopPropagation();
      if (!dragItem.current || dragItem.current.type !== 'CARD') return;

      const draggedId = dragItem.current.id;
      if (draggedId === targetElementId) return; // Dropped on self

      const targetList = groupedData[targetCol];
      // Determine insertion point based on mouse position relative to the target card
      const targetCard = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dropY = e.clientY;
      const midY = targetCard.top + (targetCard.height / 2);
      
      const insertBefore = dropY < midY;
      
      let newOrder = 0;
      
      if (insertBefore) {
          // Inserting before targetIndex
          const nextItem = targetList[targetIndex]; // This card becomes next
          const prevItem = targetIndex > 0 ? targetList[targetIndex - 1] : undefined;
          newOrder = calculateNewOrder(prevItem, nextItem);
      } else {
          // Inserting after targetIndex
          const prevItem = targetList[targetIndex]; // This card becomes prev
          const nextItem = targetIndex < targetList.length - 1 ? targetList[targetIndex + 1] : undefined;
          newOrder = calculateNewOrder(prevItem, nextItem);
      }

      updateCardPosition(draggedId, targetCol, newOrder);
      resetDrag();
  };

  const handleColumnReorder = (targetColId: string) => {
      if (!dragItem.current || dragItem.current.type !== 'COLUMN') return;
      const sourceCol = dragItem.current.id;
      if (sourceCol === 'Unassigned' || targetColId === 'Unassigned') return; // Cannot reorder Unassigned

      const sourceIdx = columns.indexOf(sourceCol);
      const targetIdx = columns.indexOf(targetColId);
      
      if (sourceIdx !== -1 && targetIdx !== -1) {
          const newCols = [...columns];
          newCols.splice(sourceIdx, 1);
          newCols.splice(targetIdx, 0, sourceCol);
          setColumns(newCols);
      }
  };

  const resetDrag = () => {
      dragItem.current = null;
  };

  const handleAddColumn = () => {
      if (newColumnName.trim() && !columns.includes(newColumnName.trim())) {
          setColumns([...columns, newColumnName.trim()]);
          setNewColumnName('');
          setIsAddingColumn(false);
      }
  };

  const handleDeleteColumn = (colName: string) => {
      if (confirm(`Delete column "${colName}"? Items will return to Unassigned.`)) {
          // Move items to unassigned
          (groupedData[colName] || []).forEach(el => {
              modelActions.deleteElementAttribute(el.name, GROUP_BY_ATTRIBUTE);
          });
          setColumns(columns.filter(c => c !== colName));
      }
  };

  // Theme
  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const headerBgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200';
  const columnBg = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
  const cardBg = isDarkMode ? 'bg-gray-800 border-gray-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400';
  const cardText = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const subText = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
        <div className={`p-4 border-b flex justify-between items-center ${headerBgClass}`}>
            <h2 className={`text-xl font-bold ${textClass}`}>Kanban Board</h2>
            <button onClick={onClose} className={`${subText} hover:text-blue-500`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex-grow overflow-x-auto overflow-y-hidden p-4 flex gap-4">
            
            {allColumns.map((col, colIndex) => {
                const isUnassigned = col === 'Unassigned';
                const items = groupedData[col] || [];

                return (
                    <div 
                        key={col}
                        className={`flex-shrink-0 w-72 rounded-lg border flex flex-col h-full ${columnBg}`}
                        draggable={!isUnassigned}
                        onDragStart={(e) => handleDragStart(e, 'COLUMN', col, colIndex)}
                        onDragOver={(e) => handleDragOver(e, col)}
                        onDrop={(e) => handleDropOnColumn(e, col)}
                        onDragEnter={handleDragEnter}
                    >
                        {/* Column Header */}
                        <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center select-none font-bold cursor-grab active:cursor-grabbing`}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded">{colIndex}</span>
                                <span className={textClass}>{col}</span>
                                <span className={`text-xs font-normal px-2 py-0.5 rounded ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>{items.length}</span>
                            </div>
                            {!isUnassigned && (
                                <button onClick={() => handleDeleteColumn(col)} className="text-gray-500 hover:text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>

                        {/* Drop Zone / Card List */}
                        <div 
                            ref={el => { if (el) columnRefs.current.set(col, el); }}
                            className="flex-grow p-2 overflow-y-auto space-y-2 min-h-0"
                        >
                            {items.map((el, idx) => (
                                <div
                                    key={el.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'CARD', el.id, idx, col)}
                                    onDragOver={(e) => e.preventDefault()} // Allow drop
                                    onDrop={(e) => handleDropOnCard(e, el.id, col, idx)}
                                    onClick={(e) => { e.stopPropagation(); onNodeClick(el.id); }}
                                    className={`p-3 rounded border shadow-sm cursor-move transition-all ${cardBg} ${selectedElementId === el.id ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    <div className={`text-sm font-semibold ${cardText}`}>{el.name}</div>
                                    {el.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {el.tags.slice(0, 3).map(t => (
                                                <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Add Column Button */}
            <div className="flex-shrink-0 w-72 flex flex-col">
                {isAddingColumn ? (
                    <div className={`p-3 rounded border ${columnBg}`}>
                        <input 
                            autoFocus
                            type="text" 
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                            placeholder="New Column..."
                            className={`w-full bg-transparent border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} text-sm focus:outline-none mb-2 ${textClass}`}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAddingColumn(false)} className={`text-xs ${subText} hover:${textClass}`}>Cancel</button>
                            <button onClick={handleAddColumn} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Add</button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingColumn(true)}
                        className={`w-full py-3 rounded border border-dashed ${isDarkMode ? 'border-gray-700 text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50'} transition-colors flex justify-center items-center gap-2`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Column
                    </button>
                )}
            </div>

        </div>
    </div>
  );
};

export default KanbanPanel;
