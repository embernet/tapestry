import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Element, Relationship, RelationshipDirection, ColorScheme } from '../types';
import ElementEditor from './ElementEditor';

// Define a type for the data needed to create a new element.
type NewElementData = Omit<Element, 'id' | 'createdAt' | 'updatedAt'>;

interface AddRelationshipPanelProps {
  sourceElement: Element;
  allElements: Element[];
  onCreate: (relationship: Omit<Relationship, 'id' | 'tags'>, newElement?: NewElementData) => void;
  onUpdateElement: (element: Element) => void;
  onCancel: () => void;
  targetElementId?: string | null;
  isNewTarget?: boolean;
  suggestedLabels?: string[];
  defaultLabel?: string;
  colorSchemes: ColorScheme[];
  activeSchemeId: string | null;
}

const AddRelationshipPanel: React.FC<AddRelationshipPanelProps> = ({
  sourceElement,
  allElements,
  onCreate,
  onUpdateElement,
  onCancel,
  targetElementId,
  isNewTarget,
  suggestedLabels = [],
  defaultLabel = '',
  colorSchemes,
  activeSchemeId,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetElementId || 'NEW_ELEMENT');
  const [elementEditorData, setElementEditorData] = useState<Partial<Element>>({
    name: '',
    notes: '',
    tags: []
  });
  const [label, setLabel] = useState(defaultLabel);
  const [direction, setDirection] = useState<RelationshipDirection>(RelationshipDirection.To);
  
  const labelInputRef = useRef<HTMLInputElement>(null);
  const newElementNameInputRef = useRef<HTMLInputElement>(null);

  const targetElement = useMemo(() => allElements.find(f => f.id === targetElementId), [allElements, targetElementId]);

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
        if (isNewTarget || selectedTargetId === 'NEW_ELEMENT') {
             newElementNameInputRef.current?.focus();
             newElementNameInputRef.current?.select();
        } else if (targetElementId) {
             labelInputRef.current?.focus();
        }
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, [isNewTarget, targetElementId, selectedTargetId]);

  useEffect(() => {
    if (isNewTarget && targetElement) {
        setElementEditorData(targetElement);
    } else if (selectedTargetId === 'NEW_ELEMENT' && !isNewTarget) {
        setElementEditorData(prev => ({ ...prev, name: '', notes: '', tags: [] }));
    }
  }, [targetElementId, isNewTarget, targetElement, selectedTargetId]);

  const handleSubmit = () => {
    if (!label.trim()) {
        alert("Please provide a label for the relationship.");
        return;
    }

    if (isNewTarget && targetElementId) {
        if (!elementEditorData.name?.trim()) {
            alert("Please provide a name for the new element.");
            return;
        }
        onUpdateElement(elementEditorData as Element);
        onCreate({ source: sourceElement.id, target: targetElementId, label: label.trim(), direction });
    } else if (selectedTargetId === 'NEW_ELEMENT') {
      if (!elementEditorData.name?.trim()) {
        alert("Please provide a name for the new element.");
        return;
      }
      onCreate(
        { source: sourceElement.id, target: 'new-element-placeholder', label: label.trim(), direction },
        { ...elementEditorData, name: elementEditorData.name.trim() } as NewElementData
      );
    } else {
      onCreate(
        { source: sourceElement.id, target: selectedTargetId, label: label.trim(), direction }
      );
    }
  };

  const handleElementEditorChange = (updatedData: Partial<Element>, immediate?: boolean) => {
    setElementEditorData(prev => ({...prev, ...updatedData}));
  };

  const availableTargets = useMemo(() => allElements.filter(f => f.id !== sourceElement.id), [allElements, sourceElement.id]);

  const showElementEditor = isNewTarget || selectedTargetId === 'NEW_ELEMENT';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.target as HTMLElement).tagName.toLowerCase() !== 'textarea') {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === 'Escape') {
      onCancel();
    }
  };
  
  const handleLabelSelect = (l: string) => {
      setLabel(l);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 h-auto max-h-full w-96 rounded-lg shadow-2xl flex flex-col" onKeyDown={handleKeyDown}>
      <div className="p-6 flex flex-col min-h-0">
        <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">Add Relationship</h2>

        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-400">Source Element</label>
            <div className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-300 cursor-not-allowed">
              {sourceElement.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Target Element</label>
            {isNewTarget ? (
               <div className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white font-semibold">
                 New Element (Creating...)
               </div>
            ) : (
                <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="NEW_ELEMENT">+ Create New Element</option>
                {availableTargets.map(element => (
                    <option key={element.id} value={element.id}>{element.name}</option>
                ))}
                </select>
            )}
          </div>

          {showElementEditor && (
             <div className="border-l-2 border-blue-500 pl-4 mt-2">
                 <h3 className="text-sm font-bold text-blue-400 mb-2">New Element Details</h3>
                 <ElementEditor 
                    elementData={elementEditorData} 
                    onDataChange={handleElementEditorChange}
                    nameInputRef={newElementNameInputRef}
                    colorSchemes={colorSchemes}
                    activeSchemeId={activeSchemeId}
                 />
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400">Relationship Label</label>
            <input
              ref={labelInputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., causes, depends on"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {suggestedLabels.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Schema Relationships:</p>
                    <div className="flex flex-wrap gap-1">
                        {suggestedLabels.map(l => {
                            const isSelected = label === l;
                            return (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => handleLabelSelect(l)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                        isSelected 
                                        ? 'bg-blue-600 border-blue-500 text-white' 
                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {l}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
          </div>
          
           <div>
            <label className="block text-sm font-medium text-gray-400">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as RelationshipDirection)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={RelationshipDirection.To}>Forward (→)</option>
              <option value={RelationshipDirection.From}>Reverse (←)</option>
              <option value={RelationshipDirection.None}>None (—)</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-700 flex-shrink-0">
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Cancel</button>
          <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Add Relationship</button>
        </div>
      </div>
    </div>
  );
};

export default AddRelationshipPanel;