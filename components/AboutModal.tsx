
import React, { useRef, useEffect } from 'react';
import { TapestryAnimator } from './TapestryAnimator';
import { CreatorInfo } from './CreatorInfo';

interface ModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export const AboutModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const headerClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const licenseBg = isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-600';
    const licenseHeader = isDarkMode ? 'text-gray-400' : 'text-gray-800';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className={`${bgClass} rounded-lg max-w-2xl w-full max-h-[90vh] shadow-2xl border flex flex-col relative overflow-hidden`}>
                
                {/* Close X Button */}
                <button onClick={onClose} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} z-10`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <div className="flex items-center gap-6 mb-8">
                        <div className="shrink-0">
                            <TapestryAnimator />
                        </div>
                        <div>
                            <h2 className={`text-4xl font-bold ${headerClass} tracking-tight`}>Tapestry</h2>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Visual Knowledge Graph</p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className={`${textClass} text-lg mb-8 leading-relaxed`}>
                        Tapestry is a tool for creating and exploring knowledge graphs. It helps you understand the relationships between ideas, people, organisations, and actions to find ways to improve situations and plan what to do next. It is a space for reflection, communication, and innovation.
                    </p>

                    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-6`}></div>

                    <CreatorInfo className="mb-8" isDarkMode={isDarkMode} />

                    {/* License */}
                    <div className={`${licenseBg} p-4 rounded border text-xs font-mono leading-relaxed`}>
                        <p className={`font-bold ${licenseHeader} mb-2`}>MIT License</p>
                        <p className="mb-2">Copyright (c) 2025 Mark Burnett</p>
                        <p className="mb-4">
                            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                        </p>
                        <p className="mb-4">
                            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                        </p>
                        <p>
                            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
