
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Element, Relationship, RelationshipDirection } from '../types';
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
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetElementId || 'NEW_ELEMENT');
  const [elementEditorData, setElementEditorData] = useState<Partial<Element>>({
    name: '',
    notes: '',
    tags: []
  });
  const [label, setLabel] = useState('');
  const [direction, setDirection] = useState<RelationshipDirection>(RelationshipDirection.To);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const targetElement = useMemo(() => allElements.find(f => f.id === targetElementId), [allElements, targetElementId]);

  useEffect(() => {
    // If a target is pre-selected from a drag-connect action, focus the label input.
    if (targetElementId && labelInputRef.current) {
        setTimeout(() => {
            labelInputRef.current?.focus();
        }, 100);
    }

    if (isNewTarget && targetElement) {
        setElementEditorData(targetElement);
    } else {
        setElementEditorData({ name: '', notes: '', tags: [] });
    }
  }, [targetElementId, isNewTarget, targetElement]);

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
        // Update the newly created element, then create the relationship to it
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

  const handleElementEditorChange = (updatedData: Partial<Element>) => {
    setElementEditorData(prev => ({...prev, ...updatedData}));
  };

  const availableTargets = useMemo(() => allElements.filter(f => f.id !== sourceElement.id), [allElements, sourceElement.id]);

  const showElementEditor = isNewTarget || selectedTargetId === 'NEW_ELEMENT';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Pressing Enter in any field (except textarea) should submit the form.
    if (event.key === 'Enter' && (event.target as HTMLElement).tagName.toLowerCase() !== 'textarea') {
      event.preventDefault();
      handleSubmit();
    }
    // Pressing Escape should cancel.
    if (event.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-gray-800 border-l border-gray-700 h-full w-96 flex-shrink-0 z-20" onKeyDown={handleKeyDown}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-bold text-white">Add Relationship</h2>
          <p className="text-gray-400 mt-1">From: <span className="font-semibold text-blue-400">{sourceElement.name}</span></p>
        </div>

        <div className="flex-grow space-y-4 text-gray-300 overflow-y-auto pr-2">
          {/* Relationship Fields */}
          <div>
            <label className="block text-sm font-medium">Label</label>
            <input
              ref={labelInputRef}
              list="relationship-labels"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., works at, is related to"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="relationship-labels">
                {suggestedLabels.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as RelationshipDirection)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={RelationshipDirection.To}>{sourceElement.name} → Target</option>
              <option value={RelationshipDirection.From}>Target → {sourceElement.name}</option>
              <option value={RelationshipDirection.None}>{sourceElement.name} — Target</option>
            </select>
          </div>
          
          {isNewTarget ? (
             <div>
                <label className="block text-sm font-medium">Target</label>
                <p className="mt-1 p-2 bg-gray-700 rounded-md font-semibold">{targetElement?.name}</p>
             </div>
          ) : (
             <div>
              <label className="block text-sm font-medium">Target</label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NEW_ELEMENT">-- Create New Element --</option>
                {availableTargets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          
          {/* New Element Fields (using ElementEditor) */}
          {showElementEditor && (
            <div className="pt-4 mt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {isNewTarget ? `Edit New Element` : `New Element Details`}
              </h3>
              <ElementEditor
                elementData={elementEditorData}
                onDataChange={handleElementEditorChange}
              />
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 mt-auto pt-6 flex justify-end items-center space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRelationshipPanel;
