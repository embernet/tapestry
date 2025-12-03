

import React, { useState } from 'react';

interface AttributesEditorProps {
  attributes: Record<string, string>;
  onChange: (newAttributes: Record<string, string>) => void;
  isDarkMode?: boolean;
}

const AttributesEditor: React.FC<AttributesEditorProps> = ({ attributes, onChange, isDarkMode = true }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim()) {
      onChange({ ...attributes, [newKey.trim()]: newValue });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleDelete = (key: string) => {
    const next = { ...attributes };
    delete next[key];
    onChange(next);
  };

  const handleEditValue = (key: string, val: string) => {
     onChange({ ...attributes, [key]: val });
  };

  const inputBg = isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const keyBg = isDarkMode ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300';
  const containerBg = isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200';
  const labelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const emptyTextColor = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const buttonHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

  return (
    <div className={`space-y-2 pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mt-2`}>
        <label className={`block text-sm font-bold uppercase tracking-wider ${labelColor}`}>Custom Attributes</label>
        
        <div className="space-y-1">
            {Object.entries(attributes || {}).map(([key, val]) => (
                <div key={key} className="flex gap-2 items-center">
                    <div className={`text-xs px-2 py-1.5 rounded w-1/3 border overflow-hidden text-ellipsis whitespace-nowrap ${keyBg}`} title={key}>
                        {key}
                    </div>
                    <input 
                        type="text" 
                        value={val} 
                        onChange={e => handleEditValue(key, e.target.value)} 
                        className={`text-xs px-2 py-1.5 rounded flex-grow border focus:border-blue-500 focus:outline-none ${inputBg}`} 
                    />
                    <button onClick={() => handleDelete(key)} className={`text-red-400 hover:text-red-300 p-1 rounded transition-colors ${buttonHover}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}
            {(!attributes || Object.keys(attributes).length === 0) && (
                <p className={`text-xs italic ${emptyTextColor}`}>No attributes defined.</p>
            )}
        </div>

        <div className={`flex gap-2 items-center mt-2 p-2 rounded border border-dashed ${containerBg}`}>
             <input 
                type="text" 
                placeholder="Key" 
                value={newKey} 
                onChange={e => setNewKey(e.target.value)} 
                className={`text-xs px-2 py-1.5 rounded w-1/3 border focus:border-green-500 focus:outline-none placeholder-gray-500 ${inputBg}`} 
            />
             <input 
                type="text" 
                placeholder="Value" 
                value={newValue} 
                onChange={e => setNewValue(e.target.value)} 
                className={`text-xs px-2 py-1.5 rounded flex-grow border focus:border-green-500 focus:outline-none placeholder-gray-500 ${inputBg}`} 
                onKeyDown={e => e.key === 'Enter' && handleAdd()} 
            />
             <button 
                onClick={handleAdd} 
                disabled={!newKey.trim()} 
                className={`text-green-500 hover:text-green-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors ${buttonHover}`}
                title="Add Attribute"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
             </button>
        </div>
    </div>
  );
};

export default AttributesEditor;