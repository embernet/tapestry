
import React from 'react';

interface ExitConfirmationModalProps {
    onSaveAndExit: () => void;
    onDiscardAndExit: () => void;
    onCancel: () => void;
    isDarkMode: boolean;
    title?: string;
    message?: string;
    saveLabel?: string;
    discardLabel?: string;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
    onSaveAndExit,
    onDiscardAndExit,
    onCancel,
    isDarkMode,
    title = "Unsaved Changes",
    message = "You have unsaved changes in your current model. How would you like to proceed?",
    saveLabel = "Save & Exit",
    discardLabel = "Discard Changes & Exit"
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[9000] p-4 animate-fade-in">
            <div className={`${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'} rounded-lg max-w-md w-full p-6 shadow-2xl border flex flex-col gap-6`}>
                <div>
                    <h2 className="text-xl font-bold mb-2">{title}</h2>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {message}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onSaveAndExit}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {saveLabel}
                    </button>

                    <button
                        onClick={onDiscardAndExit}
                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {discardLabel}
                    </button>

                    <button
                        onClick={onCancel}
                        className={`w-full py-2 px-4 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-md font-medium transition-colors mt-2`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
