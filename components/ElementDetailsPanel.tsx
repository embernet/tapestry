
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
  onDragStart?: (e: React.MouseEvent) => void;
}

const ElementDetailsPanel: React.FC<ElementDetailsPanelProps> = ({ 
    element, allElements, relationships, onUpdate, onDelete, onClose, 
    colorSchemes, activeSchemeId, isDarkMode, onDragStart 
}) => {
  const [formData, setFormData] = useState<Partial<Element>>({});
  const [isCopied, setIsCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Developer Note: If any new data types (like customLists) are added to the Element interface,
  // ensure that the ReportPanel (both visual and markdown generation), Markdown export, and JSON output
  // are updated to reflect these changes to avoid data loss or visibility issues in reports.

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
    const activeScheme = colorSchemes.find(s => s.id === activeSchemeId);
    const markdown = generateElementMarkdown(element, relationships, allElements, activeScheme);
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
  const headerBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';

  return (
    <div className={`${bgClass} border ${borderClass} w-96 flex flex-col h-full min-h-0 transition-colors`} onKeyDown={handleKeyDown}>
      {/* Standard Header Section */}
      <div 
        className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBgClass} flex-shrink-0 cursor-move select-none`}
        onMouseDown={onDragStart}
      >
        <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Element Details
        </h2>
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
            <button 
              onClick={handleCopyMarkdown}
              title={isCopied ? "Copied!" : "Copy as Markdown"}
              className={`${subTextClass} hover:text-green-500 p-1 rounded transition`}
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button onClick={onClose} className={`${subTextClass} hover:text-blue-500`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>

      {/* Name Field - Pinned */}
      <div className={`p-4 pb-0 flex-shrink-0 ${bgClass} z-10 transition-colors`}>
        <div className="mb-4">
            <label className={`block text-xs font-bold uppercase tracking-wider ${subTextClass} mb-1`}>Name</label>
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
      <div className="flex-grow overflow-y-auto px-4 pb-2 custom-scrollbar">
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
      <div className={`flex-shrink-0 p-4 pt-4 border-t ${borderClass} flex justify-between items-center ${bgClass} transition-colors`}>
          <p className={`text-xs ${subTextClass}`}>Changes saved automatically.</p>
          <button
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50/10 px-3 py-1.5 rounded-md transition border border-transparent hover:border-red-500/50"
          >
            Delete Element
          </button>
      </div>
    </div>
  );
};

export default ElementDetailsPanel;
