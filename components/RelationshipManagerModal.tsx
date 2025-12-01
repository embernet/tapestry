
import React, { useState, useMemo } from 'react';
import { Element, Relationship, RelationshipDirection } from '../types';

interface RelationshipManagerModalProps {
  element: Element;
  relationships: Relationship[];
  allElements: Element[];
  onAdd: (relationship: Omit<Relationship, 'id' | 'tags'>) => void;
  onDelete: (relationshipId: string) => void;
  onClose: () => void;
}

const RelationshipManagerModal: React.FC<RelationshipManagerModalProps> = ({ 
  element, 
  relationships, 
  allElements, 
  onAdd, 
  onDelete, 
  onClose 
}) => {
  const [targetId, setTargetId] = useState('');
  const [label, setLabel] = useState('');
  const [direction, setDirection] = useState<RelationshipDirection>(RelationshipDirection.To);

  // Filter relationships relevant to this element
  const elementRels = useMemo(() => {
    return relationships.filter(r => r.source === element.id || r.target === element.id);
  }, [relationships, element.id]);

  const availableTargets = useMemo(() => {
    return allElements.filter(e => e.id !== element.id).sort((a, b) => a.name.localeCompare(b.name));
  }, [allElements, element.id]);

  const handleAdd = () => {
    if (!targetId || !label.trim()) return;
    
    onAdd({
      source: element.id,
      target: targetId,
      label: label.trim(),
      direction: direction
    });
    
    setLabel('');
    // Keep target and direction for potentially adding multiple
  };

  const getPeerName = (rel: Relationship) => {
    const peerId = rel.source === element.id ? rel.target : rel.source;
    return allElements.find(e => e.id === peerId)?.name || 'Unknown';
  };

  const getDirectionDisplay = (rel: Relationship) => {
    if (rel.source === element.id) {
        // We are source
        if (rel.direction === RelationshipDirection.To) return '→';
        if (rel.direction === RelationshipDirection.From) return '←';
        if (rel.direction === RelationshipDirection.Both) return '↔';
        return '—';
    } else {
        // We are target
        if (rel.direction === RelationshipDirection.To) return '←';
        if (rel.direction === RelationshipDirection.From) return '→';
        if (rel.direction === RelationshipDirection.Both) return '↔';
        return '—';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl border border-gray-600 text-white max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-bold">Relationships: <span className="text-blue-400">{element.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto mb-6 pr-2">
           {elementRels.length === 0 ? (
               <p className="text-gray-500 italic">No relationships found.</p>
           ) : (
               <table className="w-full text-sm text-left">
                   <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                       <tr>
                           <th className="px-3 py-2 rounded-l-md">Peer</th>
                           <th className="px-3 py-2 text-center">Dir</th>
                           <th className="px-3 py-2">Label</th>
                           <th className="px-3 py-2 text-right rounded-r-md">Action</th>
                       </tr>
                   </thead>
                   <tbody>
                       {elementRels.map(rel => (
                           <tr key={rel.id} className="border-b border-gray-700 hover:bg-gray-700">
                               <td className="px-3 py-2 font-medium text-white">{getPeerName(rel)}</td>
                               <td className="px-3 py-2 text-center font-mono text-gray-400">{getDirectionDisplay(rel)}</td>
                               <td className="px-3 py-2 text-gray-300">{rel.label}</td>
                               <td className="px-3 py-2 text-right">
                                   <button 
                                    onClick={() => onDelete(rel.id)}
                                    className="text-red-400 hover:text-white bg-transparent hover:bg-red-600 p-1 rounded transition"
                                    title="Delete Relationship"
                                   >
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                       </svg>
                                   </button>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           )}
        </div>

        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Add New Relationship</h3>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="flex-grow">
                        <select 
                            value={targetId} 
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Select Element...</option>
                            {availableTargets.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32">
                         <select 
                            value={direction} 
                            onChange={(e) => setDirection(e.target.value as RelationshipDirection)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value={RelationshipDirection.To}>Output To (→)</option>
                            <option value={RelationshipDirection.From}>Input From (←)</option>
                            <option value={RelationshipDirection.Both}>Bi-directional (↔)</option>
                            <option value={RelationshipDirection.None}>Link (—)</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Label (e.g. depends on)"
                        className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                        onClick={handleAdd}
                        disabled={!targetId || !label.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-1.5 rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default RelationshipManagerModal;