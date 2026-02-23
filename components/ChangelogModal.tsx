
import React, { useRef, useEffect } from 'react';
import { APP_VERSION, VERSION_NAME, CHANGELOG } from '../constants';

interface ChangelogModalProps {
    onClose: () => void;
    isDarkMode: boolean;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose, isDarkMode }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const headerClass = isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200';
    const subHeaderClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const entryBg = isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[1400] p-4">
            <div ref={modalRef} className={`${bgClass} rounded-lg max-w-2xl w-full max-h-[85vh] shadow-2xl border flex flex-col relative overflow-hidden`}>
                
                {/* Header */}
                <div className={`p-6 border-b ${headerClass} flex justify-between items-center bg-opacity-50`}>
                    <div>
                        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>What's New</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono bg-blue-600 text-white px-2 py-0.5 rounded">v{APP_VERSION}</span>
                            <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{VERSION_NAME}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {CHANGELOG.map((entry, index) => (
                        <div key={entry.version} className={`relative pl-4 ${index !== CHANGELOG.length - 1 ? 'pb-6 border-l' : ''} ${borderClass}`}>
                            <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${isDarkMode ? 'border-gray-800 bg-blue-500' : 'border-white bg-blue-500'}`}></div>
                            
                            <div className="mb-2 flex items-baseline gap-3">
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>v{entry.version}</h3>
                                <span className={`text-xs ${subHeaderClass}`}>{entry.date}</span>
                            </div>

                            <div className={`p-4 rounded-lg ${entryBg} text-sm leading-relaxed ${textClass}`}>
                                <ul className="list-disc list-inside space-y-1.5 marker:text-blue-500">
                                    {entry.changes.map((change, i) => (
                                        <li key={i}>{change}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t ${borderClass} flex justify-end`}>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors shadow-lg"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};
