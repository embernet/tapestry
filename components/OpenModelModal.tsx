import React from 'react';
import { ModelMetadata } from '../types';

interface OpenModelModalProps {
    models: ModelMetadata[];
    onLoad: (id: string) => void;
    onClose: () => void;
    onTriggerCreate: () => void;
    onDelete: (id: string) => void;
    onDeleteAll: () => void;
}

export const OpenModelModal: React.FC<OpenModelModalProps> = ({ models, onLoad, onClose, onTriggerCreate, onDelete, onDeleteAll }) => {
    const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
    const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = React.useState(false);

    const getModelSize = (id: string): string => {
        try {
            const data = localStorage.getItem(`tapestry_model_data_${id}`);
            if (!data) return '0 KB';
            const kb = Math.round(data.length / 1024);
            return `${kb} KB`;
        } catch (e) {
            return 'Unknown';
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmDeleteId(id);
    };

    const confirmDelete = () => {
        if (confirmDeleteId) {
            onDelete(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setConfirmDeleteId(null);
    };

    const handleDeleteAllClick = () => {
        setIsConfirmingDeleteAll(true);
    };

    const confirmDeleteAll = () => {
        onDeleteAll();
        setIsConfirmingDeleteAll(false);
    };

    const cancelDeleteAll = () => {
        setIsConfirmingDeleteAll(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-gray-600 text-white h-[80vh] flex flex-col relative">

                {/* Delete Confirmation Overlay */}
                {confirmDeleteId && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-95 z-10 flex flex-col justify-center items-center rounded-lg p-6 animate-fade-in">
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl max-w-sm w-full text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Delete Model?</h3>
                            <p className="text-gray-300 mb-6">Are you sure you want to permanently delete this recovered model? This cannot be undone.</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete All Confirmation Overlay */}
                {isConfirmingDeleteAll && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-95 z-10 flex flex-col justify-center items-center rounded-lg p-6 animate-fade-in">
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl max-w-sm w-full text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Delete all recovered models?</h3>
                            <p className="text-gray-300 mb-6">Are you sure you want to remove all recovered models from browser local storage? This action does not delete any files from your computer.</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={cancelDeleteAll}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteAll}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                >
                                    Delete All
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Recover Unsaved Model</h2>
                        <p className="text-sm text-gray-400">{models.length} recovered models available</p>
                        <p className="text-xs text-yellow-500 mt-2 max-w-lg">
                            Browser local storage space is limited. If this is exhausted, old models will be automatically purged.
                            So make sure you come back here to save anything you need.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {models.length > 0 && (
                            <button
                                onClick={handleDeleteAllClick}
                                className="text-sm text-red-400 hover:text-red-300 hover:underline transition-colors"
                            >
                                Delete All
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto mb-6 space-y-2">
                    {models.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            <p className="mb-4">No models found in browser storage.</p>
                            <button onClick={onTriggerCreate} className="text-blue-400 underline">Create a new model</button>
                        </div>
                    ) : (
                        models.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(m => (
                            <div
                                key={m.id}
                                onClick={() => onLoad(m.id)}
                                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 group transition-all cursor-pointer relative"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors pr-8">{m.name}</h3>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs text-gray-400">{new Date(m.updatedAt).toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-500 font-mono">{getModelSize(m.id)}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-1 truncate pr-8">{m.description || "No description"}</p>

                                <button
                                    onClick={(e) => handleDeleteClick(e, m.id)}
                                    className="absolute right-4 bottom-4 p-2 text-gray-500 hover:text-red-400 transition-colors rounded hover:bg-black/20"
                                    title="Delete from Recovery"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>


            </div>
        </div>
    );
}