import React from 'react';
import { ModelMetadata } from '../types';

interface OpenModelModalProps { 
    models: ModelMetadata[]; 
    onLoad: (id: string) => void; 
    onClose: () => void; 
    onTriggerCreate: () => void; 
}

export const OpenModelModal: React.FC<OpenModelModalProps> = ({ models, onLoad, onClose, onTriggerCreate }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-gray-600 text-white h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Open Model</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                
                <div className="flex-grow overflow-y-auto mb-6 space-y-2">
                    {models.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            <p className="mb-4">No models found in browser storage.</p>
                            <button onClick={onTriggerCreate} className="text-blue-400 underline">Create a new model</button>
                        </div>
                    ) : (
                        models.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => onLoad(m.id)}
                                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 group transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{m.name}</h3>
                                    <span className="text-xs text-gray-400">{new Date(m.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1 truncate">{m.description || "No description"}</p>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button onClick={onTriggerCreate} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold">Create New</button>
                </div>
            </div>
        </div>
    );
}