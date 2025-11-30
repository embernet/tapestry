
import React, { useRef, useEffect, useState } from 'react';
import { TOOL_DOCUMENTATION } from '../documentation';

interface ModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

// Keep Interface Items local as they don't share detailed AI guidance logic
const INTERFACE_ITEMS = [
    { name: "New Model", desc: "Start a fresh, empty knowledge graph.", icon: <path d="M12 4v16m8-8H4" /> },
    { name: "Open Model", desc: "Load a previously saved JSON model from your computer.", icon: <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
    { name: "Save to Disk", desc: "Download the current model state as a JSON file.", icon: <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /> },
    { name: "Copy Selection", desc: "Copy selected nodes and relationships to clipboard (as text/internal data).", icon: <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /> },
    { name: "Paste", desc: "Paste nodes from clipboard into the current graph.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { name: "Tools Panel", desc: "Toggle the main toolbar for analysis and editing tools.", icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /> },
    { name: "Filter", desc: "Filter visible nodes by tags or date ranges.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> },
    { name: "Focus Mode", desc: "Toggle between Narrow (Selection only), Wide (Neighbors), and Zoom focus.", icon: <circle cx="12" cy="12" r="3" /> },
    { name: "Diagrams", desc: "Open the Mermaid.js diagram editor.", icon: <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /> },
    { name: "Documents", desc: "Manage text documents and analysis reports.", icon: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { name: "Kanban", desc: "View nodes as cards in a Kanban board.", icon: <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { name: "Story Mode", desc: "Create presentations by capturing graph views.", icon: <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
    { name: "Table", desc: "Edit nodes and properties in a spreadsheet view.", icon: <path d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /> },
    { name: "Matrix", desc: "View relationships as an adjacency matrix.", icon: <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z M12 3v18 M3 12h18" /> },
    { name: "Grid", desc: "Plot nodes on an X/Y axis based on attributes.", icon: <path d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /> },
    { name: "Markdown", desc: "Edit the graph using text-based markdown.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { name: "JSON", desc: "View/Edit raw JSON data.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /> },
    { name: "Report", desc: "Generate a readable text report of the model.", icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { name: "History", desc: "View log of AI interactions.", icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: "AI Chat", desc: "Chat with the graph using AI.", icon: <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
    { name: "Settings", desc: "Configure API keys and prompts.", icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    { name: "Zoom Fit", desc: "Center the graph.", icon: <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /> },
];

export const UserGuideModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'interface' | 'tools'>('interface');

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const tabActive = isDarkMode ? 'border-blue-500 text-white bg-gray-800' : 'border-blue-500 text-black bg-white';
    const tabInactive = isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-800';
    const textHeader = isDarkMode ? 'text-white' : 'text-gray-900';
    const textDesc = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const itemBg = isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm';
    const iconBg = isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';
    const scrollBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
    const groupBg = isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200 shadow-sm';
    const groupHeaderBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const subItemBg = isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50';
    const sectionTitle = isDarkMode ? 'text-blue-400' : 'text-blue-600';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className={`${bgClass} rounded-lg max-w-5xl w-full h-[85vh] shadow-2xl border flex flex-col overflow-hidden`}>
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center ${headerBg}`}>
                    <div>
                        <h2 className={`text-2xl font-bold ${textHeader}`}>User Guide</h2>
                        <p className={`text-sm ${textDesc} mt-1`}>Reference for tools and interface elements.</p>
                    </div>
                    <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-black hover:bg-gray-200'} p-2 rounded-full transition-colors`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <button 
                        onClick={() => setActiveTab('interface')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interface' ? tabActive : tabInactive}`}
                    >
                        Interface & Navigation
                    </button>
                    <button 
                        onClick={() => setActiveTab('tools')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tools' ? tabActive : tabInactive}`}
                    >
                        Analysis & Creation Tools
                    </button>
                </div>

                {/* Content */}
                <div className={`flex-grow overflow-y-auto p-6 custom-scrollbar ${scrollBg}`}>
                    
                    {activeTab === 'interface' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {INTERFACE_ITEMS.map((item, idx) => (
                                <div key={idx} className={`flex items-start p-3 rounded border transition-colors group ${itemBg}`}>
                                    <div className={`p-2 rounded-lg group-hover:text-white mr-3 shrink-0 ${iconBg} ${isDarkMode ? 'group-hover:bg-gray-600' : 'group-hover:bg-gray-500'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            {item.icon}
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.name}</h3>
                                        <p className={`text-xs leading-snug ${textDesc}`}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-8">
                            {TOOL_DOCUMENTATION.filter(t => !t.hideInGuide).map((tool, idx) => (
                                <div key={idx} className={`border rounded-lg overflow-hidden ${groupBg}`}>
                                    <div className={`p-4 border-b flex flex-col gap-3 ${groupHeaderBg}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${tool.color}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {tool.icon}
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-bold ${tool.color}`}>{tool.name}</h3>
                                                <p className={`text-sm ${textDesc}`}>{tool.desc}</p>
                                            </div>
                                        </div>
                                        {tool.summary && (
                                            <p className={`text-xs leading-relaxed opacity-80 pl-11 ${textDesc}`}>
                                                {tool.summary}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Detailed Guidance Rendered Here */}
                                    <div className={`p-4 ${isDarkMode ? 'bg-gray-800/20' : 'bg-gray-50/20'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 opacity-70 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Detailed Guidance</h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {tool.guidance.sections.map((section, sIdx) => (
                                                <div key={sIdx} className="text-xs leading-relaxed">
                                                    {section.title && <h5 className={`font-bold mb-1 ${sectionTitle}`}>{section.title}</h5>}
                                                    {section.text && <p className={`mb-2 ${textDesc}`}>{section.text}</p>}
                                                    {section.items && (
                                                        <ul className={`list-disc pl-4 space-y-1 ${textDesc}`}>
                                                            {section.items.map((it, i) => (
                                                                <li key={i} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {tool.subItems && tool.subItems.length > 0 && (
                                        <div className={`p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${subItemBg}`}>
                                            {tool.subItems.map((sub, sIdx) => (
                                                <div key={sIdx} className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            {sub.icon}
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{sub.name}</div>
                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{sub.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
