
import React, { useState, useMemo } from 'react';
import { Element, Relationship } from '../types';
import RelationshipManagerModal from './RelationshipManagerModal';

interface TablePanelProps {
  elements: Element[];
  relationships: Relationship[];
  onUpdateElement: (element: Element) => void;
  onDeleteElement: (elementId: string) => void;
  onAddElement: (name: string) => void;
  onAddRelationship: (relationship: Omit<Relationship, 'id' | 'tags'>) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onClose: () => void;
  onNodeClick?: (id: string) => void;
  selectedElementId?: string | null;
  isDarkMode: boolean;
}

type SortKey = 'name' | 'tags' | 'notes' | 'relations';

const TablePanel: React.FC<TablePanelProps> = ({
  elements,
  relationships,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onAddRelationship,
  onDeleteRelationship,
  onClose,
  onNodeClick,
  selectedElementId,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newElementName, setNewElementName] = useState('');
  const [activeRelModalElementId, setActiveRelModalElementId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedElements = useMemo(() => {
    let filtered = elements;
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = elements.filter(e => 
            e.name.toLowerCase().includes(lower) || 
            e.tags.some(t => t.toLowerCase().includes(lower))
        );
    }
    
    return [...filtered].sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortConfig.key === 'tags') {
            valA = a.tags.join(', ').toLowerCase();
            valB = b.tags.join(', ').toLowerCase();
        } else if (sortConfig.key === 'relations') {
            valA = relationships.filter(r => r.source === a.id || r.target === a.id).length;
            valB = relationships.filter(r => r.source === b.id || r.target === b.id).length;
        } else if (sortConfig.key === 'name' || sortConfig.key === 'notes') {
             valA = (a[sortConfig.key] || '').toLowerCase();
             valB = (b[sortConfig.key] || '').toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [elements, searchTerm, sortConfig, relationships]);

  const handleNameChange = (id: string, newName: string) => {
    const element = elements.find(e => e.id === id);
    if (element && newName.trim() !== element.name) {
      onUpdateElement({ ...element, name: newName });
    }
  };

  const handleTagsChange = (id: string, tagsStr: string) => {
    const element = elements.find(e => e.id === id);
    if (element) {
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
      onUpdateElement({ ...element, tags });
    }
  };

  const handleNotesChange = (id: string, newNotes: string) => {
    const element = elements.find(e => e.id === id);
    if (element && newNotes !== element.notes) {
      onUpdateElement({ ...element, notes: newNotes });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newElementName.trim()) {
          onAddElement(newElementName.trim());
          setNewElementName('');
      }
  };

  const activeRelElement = useMemo(() => elements.find(e => e.id === activeRelModalElementId), [elements, activeRelModalElementId]);

  // Theme Classes
  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const headerBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const headerTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const hoverBgClass = isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const inputBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const inputBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const inputFocusRing = 'focus:ring-blue-500';
  const selectedRowBg = isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
  const inputTextClass = isDarkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass} ${textClass}`}>
        <div className={`p-4 border-b ${borderClass} ${headerBgClass} flex justify-between items-center`}>
            <h2 className="text-xl font-bold">Table View</h2>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputBgClass} border ${inputBorderClass} rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 ${inputFocusRing} ${inputTextClass}`}
                />
                <button onClick={onClose} className={`${headerTextClass} hover:text-blue-500`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <div className="flex-grow overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className={`${headerBgClass} ${headerTextClass} text-xs uppercase sticky top-0 z-10`}>
                    <tr>
                        <th className={`p-3 border-b ${borderClass} cursor-pointer hover:text-blue-500`} onClick={() => handleSort('name')}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className={`p-3 border-b ${borderClass} cursor-pointer hover:text-blue-500`} onClick={() => handleSort('tags')}>Tags {sortConfig.key === 'tags' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className={`p-3 border-b ${borderClass} cursor-pointer hover:text-blue-500`} onClick={() => handleSort('relations')}>Rels {sortConfig.key === 'relations' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className={`p-3 border-b ${borderClass} cursor-pointer hover:text-blue-500`} onClick={() => handleSort('notes')}>Notes {sortConfig.key === 'notes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className={`p-3 border-b ${borderClass} text-right`}>Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {sortedElements.map(el => (
                        <tr key={el.id} className={`border-b ${borderClass} ${hoverBgClass} ${selectedElementId === el.id ? selectedRowBg : ''}`}>
                            <td className="p-3">
                                <input 
                                    type="text" 
                                    defaultValue={el.name}
                                    onBlur={(e) => handleNameChange(el.id, e.target.value)}
                                    className={`bg-transparent border border-transparent ${isDarkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'} focus:border-blue-500 rounded px-1 w-full outline-none transition-colors ${inputTextClass}`}
                                />
                            </td>
                            <td className="p-3">
                                <input 
                                    type="text" 
                                    defaultValue={el.tags.join(', ')}
                                    onBlur={(e) => handleTagsChange(el.id, e.target.value)}
                                    className={`bg-transparent border border-transparent ${isDarkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'} focus:border-blue-500 rounded px-1 w-full outline-none transition-colors ${inputTextClass}`}
                                />
                            </td>
                            <td className="p-3">
                                <button 
                                    onClick={() => setActiveRelModalElementId(el.id)}
                                    className="text-blue-500 hover:underline"
                                >
                                    {relationships.filter(r => r.source === el.id || r.target === el.id).length}
                                </button>
                            </td>
                            <td className="p-3">
                                <input 
                                    type="text" 
                                    defaultValue={el.notes}
                                    onBlur={(e) => handleNotesChange(el.id, e.target.value)}
                                    className={`bg-transparent border border-transparent ${isDarkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'} focus:border-blue-500 rounded px-1 w-full outline-none truncate transition-colors ${inputTextClass}`}
                                />
                            </td>
                            <td className="p-3 text-right">
                                <button onClick={() => onDeleteElement(el.id)} className="text-red-400 hover:text-red-300 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <form onSubmit={handleAddSubmit} className={`p-3 ${headerBgClass} border-t ${borderClass} flex gap-2`}>
            <input 
                type="text" 
                value={newElementName}
                onChange={(e) => setNewElementName(e.target.value)}
                placeholder="New Element Name..."
                className={`flex-grow ${inputBgClass} border ${inputBorderClass} rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 ${inputTextClass}`}
            />
            <button type="submit" disabled={!newElementName.trim()} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors">
                Add
            </button>
        </form>

        {activeRelElement && (
            <RelationshipManagerModal 
                element={activeRelElement}
                relationships={relationships}
                allElements={elements}
                onAdd={onAddRelationship}
                onDelete={onDeleteRelationship}
                onClose={() => setActiveRelModalElementId(null)}
            />
        )}
    </div>
  );
};

export default TablePanel;
