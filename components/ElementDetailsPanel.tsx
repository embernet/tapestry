
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
}

const ElementDetailsPanel: React.FC<ElementDetailsPanelProps> = ({ 
    element, allElements, relationships, onUpdate, onDelete, onClose, 
    colorSchemes, activeSchemeId 
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

  return (
    <div className="bg-gray-800 border border-gray-700 w-96 flex flex-col h-full min-h-0" onKeyDown={handleKeyDown}>
      {/* Fixed Header Section */}
      <div className="p-6 pb-0 flex-shrink-0 bg-gray-800 z-10">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">Element Details</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleCopyMarkdown}
              title={isCopied ? "Copied!" : "Copy as Markdown"}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded transition"
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
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Name Field moved here to be fixed above scroll area */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input
                ref={nameInputRef}
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={(e) => handleDataChange({ name: e.target.value })}
                onBlur={handleBlur}
                className="block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
          />
          <div className="text-xs text-gray-500 pt-4 space-y-1 mt-4 border-t border-gray-700">
              <p>Created: {formatDate(element.createdAt)}</p>
              <p>Last Edited: {formatDate(element.updatedAt)}</p>
          </div>
      </div>
      
      {/* Footer Section */}
      <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-700 flex justify-between items-center bg-gray-800">
          <p className="text-xs text-gray-500">Changes saved automatically.</p>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900 bg-opacity-50 px-3 py-1 rounded-md transition"
          >
            Delete Element
          </button>
      </div>
    </div>
  );
};

export default ElementDetailsPanel;
