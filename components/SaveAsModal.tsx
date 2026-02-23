import React, { useState } from 'react';

interface SaveAsModalProps { 
    currentName: string; 
    currentDesc: string; 
    onSave: (name: string, desc: string) => void; 
    onClose: () => void; 
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({ currentName, currentDesc, onSave, onClose }) => {
    const [name, setName] = useState(`Copy of ${currentName}`);
    const [desc, setDesc] = useState(currentDesc);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            onSave(name, desc);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-600 text-white">
                <h2 className="text-2xl font-bold mb-6">Save As...</h2>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Model Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
                        <textarea 
                            value={desc} 
                            onChange={e => setDesc(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700">Cancel</button>
                    <button 
                        onClick={() => onSave(name, desc)} 
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Copy
                    </button>
                </div>
            </div>
        </div>
    );
}