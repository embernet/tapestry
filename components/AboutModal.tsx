
import React, { useRef, useEffect } from 'react';
import { TapestryAnimator } from './TapestryAnimator';
import { CreatorInfo } from './CreatorInfo';

interface ModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
  onUserGuideClick?: () => void;
}

export const AboutModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true, onUserGuideClick }) => {
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
    const hoverClass = isDarkMode ? 'hover:text-white' : 'hover:text-black';
    const svgHoverClass = isDarkMode ? 'group-hover:text-gray-100' : 'group-hover:text-gray-800';

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
                            <h2 className={`text-4xl font-bold ${headerClass} tracking-tight`}>Tapestry Studio</h2>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Visual Knowledge Graph</p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className={`${textClass} text-lg mb-8 leading-relaxed`}>
                        Tapestry Studio is a tool for creating and exploring knowledge graphs. It helps you understand the relationships between ideas, people, organisations, and actions to find ways to improve situations and plan what to do next. It is a space for reflection, communication, and innovation.
                    </p>

                    {onUserGuideClick && (
                        <div className={`p-4 rounded border mb-8 flex items-center justify-between ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className={`font-medium ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>New to Tapestry?</span>
                            </div>
                            <button 
                                onClick={onUserGuideClick}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors"
                            >
                                Open User Guide
                            </button>
                        </div>
                    )}

                    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-6`}></div>
                    <div className={`flex flex-col items-center gap-2 mt-8`}>
                        <p className={`${textClass} font-medium text-sm`}>Created by Mark Burnett (c) 2025</p>
                        <p className={`text-center max-w-lg text-xs leading-relaxed my-2 ${textClass} px-4`}>
                            Tapestry Studio is free to use and copy under the MIT licence. The GitHub link is below if you want to deploy it yourself. Use the settings panel to add your own API key for the AI of your choice.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="https://www.linkedin.com/in/markburnett" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 ${textClass} ${hoverClass} transition-colors group text-sm`}>
                                <svg className="w-5 h-5 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                </svg>
                                <span>LinkedIn</span>
                            </a>
                            <a href="https://github.com/embernet/tapestry" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 ${textClass} ${hoverClass} transition-colors group text-sm`}>
                                <svg className={`w-5 h-5 ${svgHoverClass} transition-colors`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                <span>GitHub</span>
                            </a>
                        </div>
                    </div>
                    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-6`}></div>

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
