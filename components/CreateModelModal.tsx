
import React, { useState } from 'react';

interface CreateModelModalProps {
    onCreate: (name: string, desc: string) => void;
    onClose: () => void;
    isInitialSetup: boolean;
}

export const CreateModelModal: React.FC<CreateModelModalProps> = ({ onCreate, onClose, isInitialSetup }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            onCreate(name, desc);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-600 text-white">
                <h2 className="text-2xl font-bold mb-6">{isInitialSetup ? 'Welcome to Tapestry Studio' : 'Create New Model'}</h2>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Model Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="My Knowledge Graph"
                            autoFocus
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
                        <textarea 
                            value={desc} 
                            onChange={e => setDesc(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            placeholder="What is this model about?"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    {!isInitialSetup && <button onClick={onClose} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700">Cancel</button>}
                    <button 
                        onClick={() => onCreate(name, desc)} 
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded bg-green-600 hover:bg-green-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Model
                    </button>
                </div>
            </div>
        </div>
    );
}
