import React, { useState, useEffect, useRef } from 'react';
import { Fact } from '../types';
import FactEditor from './FactEditor';

interface FactDetailsPanelProps {
  fact: Fact | undefined;
  onUpdate: (fact: Fact) => void;
  onDelete: (factId: string) => void;
}

const FactDetailsPanel: React.FC<FactDetailsPanelProps> = ({ fact, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Fact>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fact) {
      setFormData(fact);

      // When a new fact is created and selected, focus and select the name input.
      // A new fact is identified by its default name and identical creation/update timestamps.
      if (fact.name === 'New Fact' && fact.createdAt === fact.updatedAt && nameInputRef.current) {
        // Use a short timeout to ensure the element is focusable after the render completes.
        setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputRef.current?.select();
        }, 50);
      }

    }
  }, [fact]);

  const handleDataChange = (updatedData: Partial<Fact>) => {
    setFormData(updatedData);
  };

  const handleBlur = () => {
    if (fact && formData.id && JSON.stringify(formData) !== JSON.stringify(fact)) {
      onUpdate(formData as Fact);
    }
  };

  const handleDelete = () => {
    if (fact) {
      onDelete(fact.id);
    }
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

  if (!fact) {
    return (
      <div className="bg-gray-800 border-l border-gray-700 h-full w-96 flex-shrink-0 flex items-center justify-center p-6 text-gray-500">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <p className="mt-4 text-lg">Select a fact</p>
          <p className="text-sm">Click on a fact in the graph to view and edit its details here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-l border-gray-700 h-full w-96 flex-shrink-0 z-20" onKeyDown={handleKeyDown}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-bold text-white">Fact Details</h2>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <FactEditor
            factData={formData}
            onDataChange={handleDataChange}
            onBlur={handleBlur}
            nameInputRef={nameInputRef}
          />
          <div className="text-xs text-gray-500 pt-4 space-y-1 mt-4">
              <p>Created: {formatDate(fact.createdAt)}</p>
              <p>Last Edited: {formatDate(fact.updatedAt)}</p>
          </div>
        </div>
        
        <div className="flex-shrink-0 mt-auto pt-6 flex justify-between items-center">
          <p className="text-xs text-gray-500">Changes are saved automatically.</p>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900 bg-opacity-50 px-3 py-1 rounded-md transition"
          >
            Delete Fact
          </button>
        </div>
      </div>
    </div>
  );
};

export default FactDetailsPanel;