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
  isDarkMode: boolean;
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
  isDarkMode
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

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  const inputBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-300';

  return (
    <div className={`${bgClass} border ${borderClass} w-96 flex flex-col h-full min-h-0 transition-colors`} onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className={`p-6 pb-4 flex-shrink-0 ${bgClass} z-10 border-b ${borderClass}`}>
            <h2 className={`text-2xl font-bold ${textClass}`}>Add Relationship</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow space-y-4 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div>
            <label className={`block text-sm font-medium ${subTextClass}`}>Source Element</label>
            <div className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} cursor-not-allowed`}>
              {sourceElement.name}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${subTextClass}`}>Target Element</label>
            {isNewTarget ? (
               <div className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} font-semibold`}>
                 New Element (Creating...)
               </div>
            ) : (
                <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                    // In Add Relationship, we want the name input inside the editor block
                    hideName={false}
                    isDarkMode={isDarkMode} 
                 />
             </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${subTextClass}`}>Relationship Label</label>
            <input
              ref={labelInputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., causes, depends on"
              className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {suggestedLabels.length > 0 && (
                <div className="mt-2">
                    <p className={`text-xs ${subTextClass} mb-1`}>Schema Relationships:</p>
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
                                        : `${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`
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
            <label className={`block text-sm font-medium ${subTextClass}`}>Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as RelationshipDirection)}
              className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value={RelationshipDirection.To}>Forward (→)</option>
              <option value={RelationshipDirection.From}>Reverse (←)</option>
              <option value={RelationshipDirection.None}>None (—)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 pt-4 border-t ${borderClass} flex-shrink-0 flex justify-end space-x-4 ${bgClass} rounded-b-lg`}>
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Cancel</button>
          <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Add Relationship</button>
        </div>
    </div>
  );
};

export default AddRelationshipPanel;