import React, { useRef, useEffect } from 'react';
import { TAPESTRY_PATTERNS } from './PatternAssets';

interface ModalProps {
  onClose: () => void;
}

export const PatternGalleryModal: React.FC<ModalProps> = ({ onClose }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className="bg-gray-900 rounded-lg max-w-5xl w-full h-[80vh] p-0 shadow-2xl border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-lg">
                    <h2 className="text-xl font-bold text-white">System Patterns Gallery</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TAPESTRY_PATTERNS.map((pattern, idx) => (
                            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group">
                                <div className="h-32 w-full mb-4 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
                                    <div className="w-16 h-16 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                                        {pattern.svg}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-blue-400 mb-2">{pattern.name}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{pattern.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}