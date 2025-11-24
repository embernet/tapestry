
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Relationship, Element, RelationshipDirection } from '../types';
import AttributesEditor from './AttributesEditor';

interface RelationshipDetailsPanelProps {
  relationship: Relationship;
  elements: Element[];
  onUpdate: (relationship: Relationship) => void;
  onDelete: (relationshipId: string) => void;
  suggestedLabels?: string[];
}

const RelationshipDetailsPanel: React.FC<RelationshipDetailsPanelProps> = ({ relationship, elements, onUpdate, onDelete, suggestedLabels = [] }) => {
  const [formData, setFormData] = useState<Partial<Relationship>>(relationship);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(relationship);
    
    // Auto-focus and select the label input when the relationship changes
    setTimeout(() => {
        labelInputRef.current?.focus();
        labelInputRef.current?.select();
    }, 50);
    
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

  const handleLabelSelect = (label: string) => {
    const newData = { ...formData, label };
    setFormData(newData);
    if (relationship && formData.id) {
        onUpdate(newData as Relationship);
    }
  };

  const handleAttributesChange = (newAttributes: Record<string, string>) => {
    const newData = { ...formData, attributes: newAttributes };
    setFormData(newData);
    if (relationship && formData.id) {
        onUpdate(newData as Relationship);
    }
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
    if (event.key === 'Enter' || event.key === 'Escape') {
      (event.target as HTMLElement).blur();
    }
  };

  if (!relationship || !sourceElement || !targetElement) {
    return null;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 w-96 flex flex-col h-full min-h-0" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-0 bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-white">Relationship Details</h2>
          <div className="flex items-center text-sm text-gray-400 mt-2 space-x-2 mb-6">
             <span className="bg-gray-700 px-2 py-0.5 rounded">{sourceElement.name}</span>
             <span>→</span>
             <span className="bg-gray-700 px-2 py-0.5 rounded">{targetElement.name}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow space-y-4 text-gray-300 overflow-y-auto px-6 pb-2 custom-scrollbar">
          <div>
            <label className="block text-sm font-medium">Label</label>
            <input
              ref={labelInputRef}
              type="text"
              name="label"
              value={formData.label || ''}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="e.g., works at, is related to"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {suggestedLabels.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Schema Relationships:</p>
                    <div className="flex flex-wrap gap-1">
                        {suggestedLabels.map(label => {
                            const isSelected = formData.label === label;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => handleLabelSelect(label)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                        isSelected 
                                        ? 'bg-blue-600 border-blue-500 text-white' 
                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
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
              <option value={RelationshipDirection.To}>Forward (→)</option>
              <option value={RelationshipDirection.From}>Reverse (←)</option>
              <option value={RelationshipDirection.None}>None (—)</option>
            </select>
          </div>

          <AttributesEditor 
            attributes={formData.attributes || {}} 
            onChange={handleAttributesChange} 
          />
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-700 flex justify-between items-center bg-gray-800 rounded-b-lg">
           <p className="text-xs text-gray-500">Changes saved automatically.</p>
           <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900 bg-opacity-50 px-3 py-1 rounded-md transition"
          >
            Delete Link
          </button>
        </div>
    </div>
  );
};

export default RelationshipDetailsPanel;
