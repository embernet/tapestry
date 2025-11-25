import React from 'react';
import { ModelMetadata } from '../types';

interface ConflictResolutionModalProps { 
    localMetadata: ModelMetadata;
    diskMetadata: ModelMetadata;
    localData: any;
    diskData: any;
    onCancel: () => void;
    onChooseLocal: () => void;
    onChooseDisk: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ localMetadata, diskMetadata, onCancel, onChooseLocal, onChooseDisk }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
             <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-red-500/50 text-white">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Version Conflict Detected</h2>
                <p className="text-gray-300 mb-6">
                    The file you are importing has a different version history than the one currently in your browser storage.
                    This usually happens if you edited the file on another device or browser.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <h3 className="font-bold text-blue-400 mb-2">Local Browser Version</h3>
                        <p className="text-sm text-gray-400">Updated: {new Date(localMetadata.updatedAt).toLocaleString()}</p>
                    </div>
                     <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <h3 className="font-bold text-green-400 mb-2">File / Disk Version</h3>
                        <p className="text-sm text-gray-400">Updated: {new Date(diskMetadata.updatedAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700 text-gray-300">Cancel Import</button>
                    <button onClick={onChooseLocal} className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white">Keep Browser Version</button>
                    <button onClick={onChooseDisk} className="px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white">Overwrite with File</button>
                </div>
             </div>
        </div>
    );
}