
import React, { useState, useEffect, useRef } from 'react';
import { openFile } from '../services/fileOpen';
import { useFileDrop } from './FileChooser';
import { notify } from '../services/dialogs';

interface JSONPanelProps {
  initialData: any;
  onApply: (data: any) => void;
  onClose: () => void;
  modelName: string;
  isDarkMode: boolean;
}

const JSONPanel: React.FC<JSONPanelProps> = ({ initialData, onApply, onClose, modelName, isDarkMode }) => {
  const [text, setText] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  // A file dropped on the panel goes through the file input's onChange.
  const { dropProps: panelDropProps } = useFileDrop(importFileRef);

  useEffect(() => {
    setText(JSON.stringify(initialData, null, 2));
  }, [initialData]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text);
      onApply(parsed);
    } catch (e) {
      notify(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    }
  };

  const handleSave = () => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = modelName && modelName !== 'Loading...' ? `${modelName.replace(/ /g, '_')}.json` : 'tapestry-model.json';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpen = () => {
    // In this click: the file input fallback must open in the same user gesture.
    void openFile({
        input: importFileRef.current,
        startIn: 'documents',
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        title: 'Open JSON',
        message: 'Choose a JSON file from your computer.',
        fileKind: 'JSON file (.json)',
        onPicked: async (file) => setText(await file.text()),
    });
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const fileContent = e.target?.result as string;
            setText(fileContent);
        } catch (error) {
            console.error("JSON import failed:", error);
            notify(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            if (importFileRef.current) {
                importFileRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  };

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textareaBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  return (
    <div {...panelDropProps} className={`w-full h-full flex flex-col ${bgClass}`}>
       <input
        type="file"
        ref={importFileRef}
        onChange={handleImportFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${textClass}`}>JSON View</h2>
        <button onClick={onClose} className={`text-gray-400 hover:${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow p-6 pt-0 flex flex-col">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`w-full h-full flex-grow border rounded-md p-4 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${textareaBg}`}
            spellCheck={false}
          />
      </div>
      
      <div className="flex-shrink-0 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
            <button
                onClick={handleOpen}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 text-sm"
            >
                Open
            </button>
             <button
                onClick={handleSave}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 text-sm"
            >
                Save
            </button>
        </div>
        <div className="flex items-center space-x-4">
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

export default JSONPanel;
