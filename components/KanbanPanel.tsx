
import React, { useState, useMemo } from 'react';
import { Element, ModelActions } from '../types';

interface KanbanPanelProps {
  elements: Element[];
  modelActions: ModelActions;
  onClose: () => void;
}

const KanbanPanel: React.FC<KanbanPanelProps> = ({ elements, modelActions, onClose }) => {
  const [groupByAttribute, setGroupByAttribute] = useState('Status');
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);

  // Extract all unique attribute keys available in the elements
  const availableAttributes = useMemo(() => {
    const keys = new Set<string>();
    elements.forEach(el => {
      if (el.attributes) {
        Object.keys(el.attributes).forEach(k => keys.add(k));
      }
    });
    // Default "Status" if not present
    if (!keys.has('Status')) keys.add('Status');
    return Array.from(keys).sort();
  }, [elements]);

  // Group elements by the selected attribute
  const groupedData = useMemo(() => {
    const groups: Record<string, Element[]> = {};
    const unassigned: Element[] = [];

    elements.forEach(el => {
        const val = el.attributes?.[groupByAttribute];
        if (val) {
            if (!groups[val]) groups[val] = [];
            groups[val].push(el);
        } else {
            unassigned.push(el);
        }
    });

    // Ensure we have at least some default columns if empty
    if (groupByAttribute === 'Status' && Object.keys(groups).length === 0) {
        groups['To Do'] = [];
        groups['In Progress'] = [];
        groups['Done'] = [];
    }

    return { groups, unassigned };
  }, [elements, groupByAttribute]);

  const columns = Object.keys(groupedData.groups).sort();

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
      setDraggedElementId(elementId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetValue: string) => {
      e.preventDefault();
      if (draggedElementId) {
          const element = elements.find(e => e.id === draggedElementId);
          if (element) {
              if (targetValue === '__UNASSIGNED__') {
                  modelActions.deleteElementAttribute(element.name, groupByAttribute);
              } else {
                  modelActions.setElementAttribute(element.name, groupByAttribute, targetValue);
              }
          }
          setDraggedElementId(null);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  // Helper to add a new column
  const handleAddColumn = () => {
      const name = prompt("Enter new column name:");
      if (name) {
          // We can't really "add a column" without data in it in this derived view, 
          // but we can force it by adding a dummy or just relying on user setting an attribute on a node.
          // For better UX, we could persist column config, but let's stick to data-driven.
          alert("To add a column, select a node and set the attribute value manually, or drag a node here once implemented.");
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">Kanban Board</h2>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Group By:</label>
                    <select 
                        value={groupByAttribute} 
                        onChange={e => setGroupByAttribute(e.target.value)}
                        className="bg-gray-800 text-white text-sm rounded border border-gray-600 px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        {availableAttributes.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex-grow overflow-x-auto overflow-y-hidden p-4 flex gap-4">
            {/* Unassigned Column */}
            <div 
                className="flex-shrink-0 w-72 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, '__UNASSIGNED__')}
            >
                <div className="p-3 border-b border-gray-700 font-bold text-gray-400 flex justify-between items-center">
                    <span>Unassigned</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded text-xs">{groupedData.unassigned.length}</span>
                </div>
                <div className="p-2 flex-grow overflow-y-auto space-y-2">
                    {groupedData.unassigned.map(el => (
                        <div 
                            key={el.id} 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, el.id)}
                            className="bg-gray-800 p-3 rounded border border-gray-700 cursor-move hover:border-blue-500 transition-colors shadow-sm"
                        >
                            <div className="font-semibold text-sm text-gray-200">{el.name}</div>
                            {el.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {el.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{t}</span>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dynamic Columns */}
            {columns.map(col => (
                <div 
                    key={col}
                    className="flex-shrink-0 w-72 bg-gray-900 rounded-lg border border-gray-700 flex flex-col h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                >
                    <div className="p-3 border-b border-gray-700 font-bold text-white flex justify-between items-center bg-gray-800 rounded-t-lg">
                        <span>{col}</span>
                        <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">{groupedData.groups[col].length}</span>
                    </div>
                    <div className="p-2 flex-grow overflow-y-auto space-y-2 bg-gray-900/50">
                        {groupedData.groups[col].map(el => (
                            <div 
                                key={el.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, el.id)}
                                className="bg-gray-800 p-3 rounded border border-gray-700 cursor-move hover:border-blue-500 transition-colors shadow-sm"
                            >
                                <div className="font-semibold text-sm text-gray-200">{el.name}</div>
                                {el.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {el.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{t}</span>)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default KanbanPanel;
