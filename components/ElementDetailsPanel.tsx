import React, { useState, useEffect, useRef } from 'react';
import { Element, Relationship, ColorScheme } from '../types';
import ElementEditor from './ElementEditor';
import { generateElementMarkdown } from '../utils';

interface ElementDetailsPanelProps {
  element: Element | undefined;
  allElements: Element[];
  relationships: Relationship[];
  onUpdate: (element: Element) => void;
  onDelete: (elementId: string) => void;
  onClose: () => void;
  colorSchemes: ColorScheme[];
  activeSchemeId: string | null;
  isDarkMode: boolean;
}

const ElementDetailsPanel: React.FC<ElementDetailsPanelProps> = ({ 
    element, allElements, relationships, onUpdate, onDelete, onClose, 
    colorSchemes, activeSchemeId, isDarkMode 
}) => {
  const [formData, setFormData] = useState<Partial<Element>>({});
  const [isCopied, setIsCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (element) {
      setFormData(element);

      // When a new element is created and selected, focus and select the name input.
      if (element.name === 'New Element' && element.createdAt === element.updatedAt && nameInputRef.current) {
        setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputRef.current?.select();
        }, 50);
      }
    }
  }, [element]);

  const handleDataChange = (updatedData: Partial<Element>, immediate: boolean = false) => {
    setFormData(prev => ({ ...prev, ...updatedData }));
    if (immediate && element) {
        // Immediate update requested (e.g. tag toggle)
        onUpdate({ ...element, ...updatedData } as Element);
    }
  };

  const handleBlur = () => {
    if (element && formData.id && JSON.stringify(formData) !== JSON.stringify(element)) {
      onUpdate(formData as Element);
    }
  };

  const handleDelete = () => {
    if (element) {
      onDelete(element.id);
    }
  };
  
  const handleCopyMarkdown = () => {
    if (!element) return;
    const markdown = generateElementMarkdown(element, relationships, allElements);
    navigator.clipboard.writeText(markdown).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      const target = event.target as HTMLElement;
      // Avoid blurring if inside an input that handles its own Enter (like tag input)
      if (target.tagName.toLowerCase() !== 'textarea' && target.getAttribute('type') !== 'color') {
          target.blur();
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  }

  if (!element) {
    return null;
  }

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  const inputBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-300';

  return (
    <div className={`${bgClass} border ${borderClass} w-96 flex flex-col h-full min-h-0 transition-colors`} onKeyDown={handleKeyDown}>
      {/* Fixed Header Section */}
      <div className={`p-6 pb-0 flex-shrink-0 ${bgClass} z-10 transition-colors`}>
        <div className="flex justify-between items-start mb-4">
          <h2 className={`text-2xl font-bold ${textClass}`}>Element Details</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleCopyMarkdown}
              title={isCopied ? "Copied!" : "Copy as Markdown"}
              className={`${subTextClass} hover:text-blue-500 hover:bg-gray-100 p-1 rounded transition`}
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button 
              onClick={onClose}
              title="Close"
              className={`${subTextClass} hover:text-red-500 hover:bg-gray-100 p-1 rounded transition`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Name Field moved here to be fixed above scroll area */}
        <div className="mb-4">
            <label className={`block text-sm font-medium ${subTextClass} mb-1`}>Name</label>
            <input
                ref={nameInputRef}
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={(e) => handleDataChange({ name: e.target.value })}
                onBlur={handleBlur}
                className={`block w-full ${inputBgClass} border ${inputBorderClass} rounded-md px-3 py-2 ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold`}
            />
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-grow overflow-y-auto px-6 pb-2 custom-scrollbar">
          <ElementEditor
            elementData={formData}
            onDataChange={handleDataChange}
            onBlur={handleBlur}
            colorSchemes={colorSchemes}
            activeSchemeId={activeSchemeId}
            hideName={true} // Name is handled in the fixed header
            isDarkMode={isDarkMode}
          />
          <div className={`text-xs ${subTextClass} pt-4 space-y-1 mt-4 border-t ${borderClass}`}>
              <p>Created: {formatDate(element.createdAt)}</p>
              <p>Last Edited: {formatDate(element.updatedAt)}</p>
          </div>
      </div>
      
      {/* Footer Section */}
      <div className={`flex-shrink-0 p-6 pt-4 border-t ${borderClass} flex justify-between items-center ${bgClass} transition-colors`}>
          <p className={`text-xs ${subTextClass}`}>Changes saved automatically.</p>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition"
          >
            Delete Element
          </button>
      </div>
    </div>
  );
};

export default ElementDetailsPanel;