import React, { useState, useEffect, useRef } from 'react';
import { Element, Relationship } from '../types';
import ElementEditor from './ElementEditor';
import { generateElementMarkdown } from '../utils';

interface ElementDetailsPanelProps {
  element: Element | undefined;
  allElements: Element[];
  relationships: Relationship[];
  onUpdate: (element: Element) => void;
  onDelete: (elementId: string) => void;
  onClose: () => void;
}

const ElementDetailsPanel: React.FC<ElementDetailsPanelProps> = ({ element, allElements, relationships, onUpdate, onDelete, onClose }) => {
  const [formData, setFormData] = useState<Partial<Element>>({});
  const [isCopied, setIsCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (element) {
      setFormData(element);

      // When a new element is created and selected, focus and select the name input.
      // A new element is identified by its default name and identical creation/update timestamps.
      if (element.name === 'New Element' && element.createdAt === element.updatedAt && nameInputRef.current) {
        // Use a short timeout to ensure the element is focusable after the render completes.
        setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputRef.current?.select();
        }, 50);
      }

    }
  }, [element]);

  const handleDataChange = (updatedData: Partial<Element>) => {
    setFormData(updatedData);
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
    // When Enter or Escape is pressed inside an input, blur it to trigger save.
    if (event.key === 'Enter' || event.key === 'Escape') {
      (event.target as HTMLElement).blur();
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  }

  if (!element) {
    return null;
  }

  return (
    <div className="bg-gray-800 border-l border-gray-700 h-full w-96 flex-shrink-0 z-20" onKeyDown={handleKeyDown}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-6 flex justify-between items-start">
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

        <div className="flex-grow overflow-y-auto pr-2">
          <ElementEditor
            elementData={formData}
            onDataChange={handleDataChange}
            onBlur={handleBlur}
            nameInputRef={nameInputRef}
          />
          <div className="text-xs text-gray-500 pt-4 space-y-1 mt-4">
              <p>Created: {formatDate(element.createdAt)}</p>
              <p>Last Edited: {formatDate(element.updatedAt)}</p>
          </div>
        </div>
        
        <div className="flex-shrink-0 mt-auto pt-6 flex justify-between items-center">
          <p className="text-xs text-gray-500">Changes are saved automatically.</p>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900 bg-opacity-50 px-3 py-1 rounded-md transition"
          >
            Delete Element
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElementDetailsPanel;
