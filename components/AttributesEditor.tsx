
import React, { useState } from 'react';

interface AttributesEditorProps {
  attributes: Record<string, string>;
  onChange: (newAttributes: Record<string, string>) => void;
}

const AttributesEditor: React.FC<AttributesEditorProps> = ({ attributes, onChange }) => {
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

  return (
    <div className="space-y-2 pt-2 border-t border-gray-700 mt-2">
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Custom Attributes</label>
        
        <div className="space-y-1">
            {Object.entries(attributes || {}).map(([key, val]) => (
                <div key={key} className="flex gap-2 items-center">
                    <div className="bg-gray-700 text-gray-400 text-xs px-2 py-1.5 rounded w-1/3 border border-gray-600 overflow-hidden text-ellipsis whitespace-nowrap" title={key}>
                        {key}
                    </div>
                    <input 
                        type="text" 
                        value={val} 
                        onChange={e => handleEditValue(key, e.target.value)} 
                        className="bg-gray-900 text-white text-xs px-2 py-1.5 rounded flex-grow border border-gray-600 focus:border-blue-500 focus:outline-none" 
                    />
                    <button onClick={() => handleDelete(key)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}
            {(!attributes || Object.keys(attributes).length === 0) && (
                <p className="text-xs text-gray-500 italic">No attributes defined.</p>
            )}
        </div>

        <div className="flex gap-2 items-center mt-2 bg-gray-900/50 p-2 rounded border border-gray-700 border-dashed">
             <input 
                type="text" 
                placeholder="Key" 
                value={newKey} 
                onChange={e => setNewKey(e.target.value)} 
                className="bg-gray-800 text-white text-xs px-2 py-1.5 rounded w-1/3 border border-gray-600 focus:border-green-500 focus:outline-none placeholder-gray-500" 
            />
             <input 
                type="text" 
                placeholder="Value" 
                value={newValue} 
                onChange={e => setNewValue(e.target.value)} 
                className="bg-gray-800 text-white text-xs px-2 py-1.5 rounded flex-grow border border-gray-600 focus:border-green-500 focus:outline-none placeholder-gray-500" 
                onKeyDown={e => e.key === 'Enter' && handleAdd()} 
            />
             <button 
                onClick={handleAdd} 
                disabled={!newKey.trim()} 
                className="text-green-500 hover:text-green-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 rounded transition-colors"
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
