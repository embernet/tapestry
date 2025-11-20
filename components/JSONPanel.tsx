import React, { useState, useEffect, useRef } from 'react';

interface JSONPanelProps {
  initialData: any;
  onApply: (data: any) => void;
  onClose: () => void;
  modelName: string;
}

const JSONPanel: React.FC<JSONPanelProps> = ({ initialData, onApply, onClose, modelName }) => {
  const [text, setText] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(JSON.stringify(initialData, null, 2));
  }, [initialData]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text);
      onApply(parsed);
    } catch (e) {
      alert(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
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

  const handleOpen = async () => {
    // Try File System Access API first for better UX (start in Documents)
    if ('showOpenFilePicker' in window) {
        try {
            const pickerOptions = {
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }],
                startIn: 'documents',
            };
            
            // @ts-ignore - showOpenFilePicker is not yet in all TS definitions
            const [fileHandle] = await window.showOpenFilePicker(pickerOptions);
            const file = await fileHandle.getFile();
            const content = await file.text();
            setText(content);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.warn("File System Access API failed, falling back to input:", err);
                importFileRef.current?.click();
            }
        }
    } else {
        // Fallback for browsers without File System Access API
        importFileRef.current?.click();
    }
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
            alert(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        accept=".json,application/json"
        className="hidden"
      />

      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">JSON View</h2>
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
            className="w-full h-full flex-grow bg-gray-900 border border-gray-600 rounded-md p-4 text-white font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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