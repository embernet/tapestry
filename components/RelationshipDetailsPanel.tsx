
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Relationship, Element, RelationshipDirection } from '../types';
import AttributesEditor from './AttributesEditor';

interface RelationshipDetailsPanelProps {
  relationship: Relationship;
  elements: Element[];
  onUpdate: (relationship: Relationship) => void;
  onDelete: (relationshipId: string) => void;
  suggestedLabels?: string[];
  isDarkMode: boolean;
  onClose?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

const RelationshipDetailsPanel: React.FC<RelationshipDetailsPanelProps> = ({ relationship, elements, onUpdate, onDelete, suggestedLabels = [], isDarkMode, onClose, onDragStart }) => {
  const [formData, setFormData] = useState<Partial<Relationship>>(relationship);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [editingEnd, setEditingEnd] = useState<'source' | 'target' | null>(null);
  const [filterText, setFilterText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  const inputBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const chipBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const headerBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';

  return (
    <div className={`${bgClass} border ${borderClass} w-96 flex flex-col h-full min-h-0 transition-colors`} onKeyDown={handleKeyDown}>
      {/* Standard Header */}
      <div
        className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBgClass} flex-shrink-0 cursor-move select-none`}
        onMouseDown={onDragStart}
      >
        <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
          Relationship Details
        </h2>
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          {onClose && (
            <button onClick={onClose} className={`${subTextClass} hover:text-blue-500`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Source/Target Display */}
      <div className={`flex-shrink-0 p-4 pb-0 ${bgClass} z-20`}>
        <div className={`flex items-center justify-center text-sm ${subTextClass} space-x-2 mb-4 p-2 rounded border border-dashed relative ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-300 bg-gray-50'}`}>

          {/* Source Node */}
          <div className="relative">
            {editingEnd === 'source' ? (
              <div className="min-w-[200px]">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingEnd(null);
                      e.stopPropagation();
                    }
                  }}
                  onBlur={() => {
                    // Small delay to allow click on item to register if needed
                    setTimeout(() => setEditingEnd(null), 200);
                  }}
                  className={`w-full px-2 py-1 text-xs rounded border shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Filter nodes..."
                  autoFocus
                />
                <div className={`absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto z-30 shadow-xl rounded border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                  {elements
                    .filter(el => el.name.toLowerCase().includes(filterText.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(el => (
                      <div
                        key={el.id}
                        className={`px-2 py-1 text-xs cursor-pointer ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-blue-50 text-gray-700'}`}
                        onMouseDown={() => {
                          const newData = { ...formData, source: el.id };
                          setFormData(newData);
                          if (relationship && formData.id) onUpdate(newData as Relationship);
                          setEditingEnd(null);
                        }}
                      >
                        {el.name}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <span
                onClick={() => {
                  setEditingEnd('source');
                  setFilterText('');
                }}
                className={`${chipBgClass} px-2 py-1 rounded text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity border border-transparent hover:border-gray-400`}
              >
                {sourceElement.name}
              </span>
            )}
          </div>

          <span className="text-gray-500">→</span>

          {/* Target Node */}
          <div className="relative">
            {editingEnd === 'target' ? (
              <div className="min-w-[200px]">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingEnd(null);
                      e.stopPropagation();
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setEditingEnd(null), 200);
                  }}
                  className={`w-full px-2 py-1 text-xs rounded border shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Filter nodes..."
                  autoFocus
                />
                <div className={`absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto z-30 shadow-xl rounded border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                  {elements
                    .filter(el => el.name.toLowerCase().includes(filterText.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(el => (
                      <div
                        key={el.id}
                        className={`px-2 py-1 text-xs cursor-pointer ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-blue-50 text-gray-700'}`}
                        onMouseDown={() => {
                          const newData = { ...formData, target: el.id };
                          setFormData(newData);
                          if (relationship && formData.id) onUpdate(newData as Relationship);
                          setEditingEnd(null);
                        }}
                      >
                        {el.name}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <span
                onClick={() => {
                  setEditingEnd('target');
                  setFilterText('');
                }}
                className={`${chipBgClass} px-2 py-1 rounded text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity border border-transparent hover:border-gray-400`}
              >
                {targetElement.name}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Scrollable Content */}
      <div className={`flex-grow space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} overflow-y-auto px-4 pb-2 custom-scrollbar`}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Label</label>
          <input
            ref={labelInputRef}
            type="text"
            name="label"
            value={formData.label || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="e.g., works at, is related to"
            className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />

          {suggestedLabels.length > 0 && (
            <div className="mt-2">
              <p className={`text-[10px] uppercase font-bold tracking-wide ${subTextClass} mb-1`}>Suggestions:</p>
              <div className="flex flex-wrap gap-1">
                {[...suggestedLabels].sort().map(label => {
                  const isSelected = formData.label === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleLabelSelect(label)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${isSelected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : `${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`
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
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Direction</label>
          <select
            name="direction"
            value={formData.direction || RelationshipDirection.To}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`mt-1 block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value={RelationshipDirection.To}>Forward (→)</option>
            <option value={RelationshipDirection.From}>Reverse (←)</option>
            <option value={RelationshipDirection.Both}>Bi-directional (↔)</option>
            <option value={RelationshipDirection.None}>None (—)</option>
          </select>
        </div>

        <AttributesEditor
          attributes={formData.attributes || {}}
          onChange={handleAttributesChange}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Footer */}
      <div className={`flex-shrink-0 p-4 pt-4 border-t ${borderClass} flex justify-between items-center ${bgClass} rounded-b-lg`}>
        <p className={`text-xs ${subTextClass}`}>Changes saved automatically.</p>
        <button
          onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50/10 px-3 py-1.5 rounded-md transition border border-transparent hover:border-red-500/50"
        >
          Delete Link
        </button>
      </div>
    </div>
  );
};

export default RelationshipDetailsPanel;
