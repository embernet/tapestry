
import React, { useState, useEffect, useMemo } from 'react';
import { Relationship, Element, RelationshipDirection } from '../types';

interface RelationshipDetailsPanelProps {
  relationship: Relationship;
  elements: Element[];
  onUpdate: (relationship: Relationship) => void;
  onDelete: (relationshipId: string) => void;
}

const RelationshipDetailsPanel: React.FC<RelationshipDetailsPanelProps> = ({ relationship, elements, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Relationship>>(relationship);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    setFormData(relationship);
    setTagsInput(relationship.tags?.join(', ') || '');
  }, [relationship]);
  
  const { sourceElement, targetElement } = useMemo(() => {
      const sourceElement = elements.find(f => f.id === formData.source);
      const targetElement = elements.find(f => f.id === formData.target);
      return { sourceElement, targetElement };
  }, [elements, formData.source, formData.target]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleBlur = () => {
    if (relationship && formData.id && JSON.stringify(formData) !== JSON.stringify(relationship)) {
      onUpdate(formData as Relationship);
    }
  };

  const handleDelete = () => {
    if (relationship) {
        onDelete(relationship.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // When Enter or Escape is pressed inside an input, blur it to trigger save.
    if (event.key === 'Enter' || event.key === 'Escape') {
      (event.target as HTMLElement).blur();
    }
  };

  if (!relationship) return null;

  return (
    <div className="bg-gray-800 border-l border-gray-700 h-full w-96 flex-shrink-0 z-20" onKeyDown={handleKeyDown}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-bold text-white">Relationship Details</h2>
        </div>

        <div className="flex-grow space-y-4 text-gray-300 overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium">Source</label>
            <select
              name="source"
              value={formData.source || ''}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {elements.map(element => (
                <option key={element.id} value={element.id}>
                  {element.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Target</label>
            <select
              name="target"
              value={formData.target || ''}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {elements.map(element => (
                <option key={element.id} value={element.id}>
                  {element.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Label</label>
            <input
              type="text"
              name="label"
              value={formData.label || ''}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Direction</label>
            <select
              name="direction"
              value={formData.direction || RelationshipDirection.To}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={RelationshipDirection.To}>{sourceElement?.name || 'Source'} → {targetElement?.name || 'Target'}</option>
              <option value={RelationshipDirection.From}>{targetElement?.name || 'Target'} → {sourceElement?.name || 'Source'}</option>
              <option value={RelationshipDirection.None}>{sourceElement?.name || 'Source'} — {targetElement?.name || 'Target'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={tagsInput}
              onChange={handleTagsChange}
              onBlur={handleBlur}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-shrink-0 mt-auto pt-6 flex justify-between items-center">
          <p className="text-xs text-center text-gray-500">Changes are saved automatically.</p>
           <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900 bg-opacity-50 px-3 py-1 rounded-md transition"
          >
            Delete Relationship
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipDetailsPanel;
