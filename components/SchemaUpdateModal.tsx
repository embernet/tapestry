import React from 'react';

interface SchemaUpdateModalProps { 
    changes: string[]; 
    onClose: () => void; 
}

export const SchemaUpdateModal: React.FC<SchemaUpdateModalProps> = ({ changes, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-2xl border border-blue-500/50 text-white flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-blue-400">Schema Updates Applied</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                    The following standard schemas in your model were updated to match the latest system definitions:
                </p>
                <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-60 overflow-y-auto mb-6 text-xs font-mono text-gray-300">
                    <ul className="list-disc list-inside space-y-1">
                        {changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-colors">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}