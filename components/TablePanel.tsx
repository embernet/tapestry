
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
}

const TablePanel: React.FC<TablePanelProps> = ({
  elements,
  relationships,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onAddRelationship,
  onDeleteRelationship,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newElementName, setNewElementName] = useState('');
  const [activeRelModalElementId, setActiveRelModalElementId] = useState<string | null>(null);

  const sortedElements = useMemo(() => {
    let filtered = elements;
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = elements.filter(e => 
            e.name.toLowerCase().includes(lower) || 
            e.tags.some(t => t.toLowerCase().includes(lower))
        );
    }
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [elements, searchTerm]);

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

  const handleAddNew = () => {
      if (newElementName.trim()) {
          onAddElement(newElementName.trim());
          setNewElementName('');
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
      {activeRelModalElementId && (
          <RelationshipManagerModal
            element={elements.find(e => e.id === activeRelModalElementId)!}
            relationships={relationships}
            allElements={elements}
            onAdd={onAddRelationship}
            onDelete={onDeleteRelationship}
            onClose={() => setActiveRelModalElementId(null)}
          />
      )}

      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Table View</h2>
        <div className="flex items-center gap-2">
             <input
                type="text"
                placeholder="Search elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
            <div className="border-l border-gray-600 h-6 mx-1"></div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-4">
          <table className="w-full text-left border-collapse">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0 z-10 shadow-sm">
                  <tr>
                      <th className="px-4 py-3 rounded-tl-lg w-1/4">Name</th>
                      <th className="px-4 py-3 w-1/5">Tags</th>
                      <th className="px-4 py-3 w-1/3">Notes</th>
                      <th className="px-4 py-3 text-center w-24">Relations</th>
                      <th className="px-4 py-3 text-center rounded-tr-lg w-16">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                  {sortedElements.map(el => {
                      const relCount = relationships.filter(r => r.source === el.id || r.target === el.id).length;
                      return (
                        <tr key={el.id} className="hover:bg-gray-750 transition-colors group">
                            <td className="px-2 py-2 align-top">
                                <input 
                                    type="text" 
                                    defaultValue={el.name}
                                    onBlur={(e) => handleNameChange(el.id, e.target.value)}
                                    className="w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-white focus:outline-none font-semibold"
                                />
                            </td>
                            <td className="px-2 py-2 align-top">
                                <input 
                                    type="text" 
                                    defaultValue={el.tags.join(', ')}
                                    onBlur={(e) => handleTagsChange(el.id, e.target.value)}
                                    placeholder="tag1, tag2"
                                    className="w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-gray-300 focus:outline-none text-xs"
                                />
                            </td>
                            <td className="px-2 py-2 align-top">
                                <textarea 
                                    defaultValue={el.notes}
                                    onBlur={(e) => handleNotesChange(el.id, e.target.value)}
                                    rows={1}
                                    className="w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-gray-400 focus:outline-none text-xs resize-none focus:h-20 transition-all overflow-hidden focus:overflow-auto"
                                    placeholder="Add notes..."
                                    style={{ minHeight: '30px' }}
                                />
                            </td>
                            <td className="px-2 py-2 align-top text-center">
                                <button 
                                    onClick={() => setActiveRelModalElementId(el.id)}
                                    className="bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white px-2 py-1 rounded text-xs transition-colors min-w-[2rem]"
                                >
                                    {relCount}
                                </button>
                            </td>
                            <td className="px-2 py-2 align-top text-center">
                                <button 
                                    onClick={() => onDeleteElement(el.id)}
                                    className="text-gray-600 hover:text-red-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                                    title="Delete Element"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                      );
                  })}
                  {/* Add Row */}
                  <tr className="bg-gray-700 bg-opacity-30">
                      <td className="px-2 py-2">
                           <input 
                                    type="text" 
                                    value={newElementName}
                                    onChange={(e) => setNewElementName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
                                    placeholder="+ New Element Name"
                                    className="w-full bg-transparent border border-dashed border-gray-500 focus:border-green-500 rounded px-2 py-1 text-white focus:outline-none placeholder-gray-500"
                                />
                      </td>
                      <td colSpan={4} className="px-2 py-2">
                          <button 
                            onClick={handleAddNew}
                            disabled={!newElementName.trim()}
                            className="text-xs text-green-400 hover:text-green-300 uppercase font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              Add
                          </button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default TablePanel;
