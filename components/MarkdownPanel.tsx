

import React, { useState, useEffect, useRef } from 'react';

interface MarkdownPanelProps {
  initialText: string;
  onApply: (text: string) => void;
  onClose: () => void;
  modelName: string;
}

interface ImportMarkdownModalProps {
  onClose: () => void;
  onSelectFile: (isAppending: boolean) => void;
}

const ImportMarkdownModal: React.FC<ImportMarkdownModalProps> = ({ onClose, onSelectFile }) => {
  const [isAppending, setIsAppending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [onClose]);

  const handleSelect = () => {
    onSelectFile(isAppending);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-xl border border-gray-600 text-white">
        <h2 className="text-2xl font-bold mb-6">Import Options</h2>
        
        <p className="text-gray-400 mb-6">Choose how to import the Markdown file into your model.</p>

        <label className="flex items-center space-x-3 bg-gray-700 p-4 rounded-md cursor-pointer hover:bg-gray-600 transition">
          <input
            type="checkbox"
            checked={isAppending}
            onChange={(e) => setIsAppending(e.target.checked)}
            className="form-checkbox h-5 w-5 rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
          />
          <div>
            <span className="font-semibold">Add to existing model</span>
            <p className="text-sm text-gray-400">Appends the file content to the current text.</p>
          </div>
        </label>
        
        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Cancel
          </button>
          <button onClick={handleSelect} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Select File...
          </button>
        </div>
      </div>
    </div>
  );
};


const MarkdownPanel: React.FC<MarkdownPanelProps> = ({ initialText, onApply, onClose, modelName }) => {
  const [text, setText] = useState(initialText);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const isAppendingRef = useRef(false);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleApply = () => {
    onApply(text);
  };

  const handleExport = () => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = modelName && modelName !== 'Loading...' ? `${modelName.replace(/ /g, '_')}.md` : 'tapestry-export.md';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectFile = (shouldAppend: boolean) => {
    isAppendingRef.current = shouldAppend;
    setIsImportModalOpen(false);
    importFileRef.current?.click();
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const fileContent = e.target?.result as string;
            if (isAppendingRef.current) {
                setText(prev => `${prev}\n${fileContent}`);
            } else {
                setText(fileContent);
            }
        } catch (error) {
            console.error("Markdown import failed:", error);
            alert(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            if (importFileRef.current) {
                importFileRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  };


  return (
    <div className="bg-gray-800 border-r border-gray-700 h-full w-1/3 max-w-lg flex-shrink-0 z-20 flex flex-col">
       <input
        type="file"
        ref={importFileRef}
        onChange={handleImportFileChange}
        accept=".md,.txt,text/markdown"
        className="hidden"
      />
      {isImportModalOpen && (
        <ImportMarkdownModal 
          onClose={() => setIsImportModalOpen(false)}
          onSelectFile={handleSelectFile}
        />
      )}

      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Markdown View</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow p-6 pt-0 flex flex-col">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full flex-grow bg-gray-900 border border-gray-600 rounded-md p-4 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`# This is a comment and will be ignored.\nElement with spaces (Type):tag -[label]-> Another Element\nElement A -[rel]-> Element B; Element C`}
          />
      </div>
      
      <div className="flex-shrink-0 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
            <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 text-sm"
            >
                Import
            </button>
             <button
                onClick={handleExport}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 text-sm"
            >
                Export
            </button>
        </div>
        <div className="flex items-center space-x-4">
            <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
            >
                Cancel
            </button>
            <button
                onClick={handleApply}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
            >
                Apply
            </button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPanel;