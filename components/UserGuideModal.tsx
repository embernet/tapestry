
import React, { useRef, useEffect, useState } from 'react';

interface ModalProps {
  onClose: () => void;
}

type GuideItem = {
    icon: React.ReactNode;
    name: string;
    desc: string;
    color?: string;
    subItems?: GuideItem[];
};

const INTERFACE_ITEMS: GuideItem[] = [
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
    { name: "Kanban", desc: "View nodes as cards in a Kanban board.", icon: <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { name: "Story Mode", desc: "Create presentations by capturing graph views.", icon: <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
    { name: "Table", desc: "Edit nodes and properties in a spreadsheet view.", icon: <path d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /> },
    { name: "Matrix", desc: "View relationships as an adjacency matrix.", icon: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { name: "Grid", desc: "Plot nodes on an X/Y axis based on attributes.", icon: <path d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /> },
    { name: "Markdown", desc: "Edit the graph using text-based markdown.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { name: "JSON", desc: "View/Edit raw JSON data.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { name: "Report", desc: "Generate a readable text report of the model.", icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { name: "History", desc: "View log of AI interactions.", icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: "AI Chat", desc: "Chat with the graph using AI.", icon: <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
    { name: "Settings", desc: "Configure API keys and prompts.", icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    { name: "Zoom Fit", desc: "Center the graph.", icon: <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /> },
];

const TOOLS_DATA: GuideItem[] = [
    {
        name: "Schema",
        color: "text-teal-400",
        desc: "Define visual language.",
        icon: <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
        subItems: [
            { name: "Active Schema", desc: "Switch between color/tag schemes (e.g. Business, Design Thinking).", icon: <path d="M7 7h.01M7 3h5" /> },
            { name: "Edit Schema", desc: "Customize tag colors and relationship definitions.", icon: <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> }
        ]
    },
    {
        name: "Layout",
        color: "text-orange-400",
        desc: "Control graph physics.",
        icon: <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />,
        subItems: [
            { name: "Simulate", desc: "Start physics simulation to auto-arrange nodes.", icon: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> },
            { name: "Spread", desc: "Adjust the target distance between connected nodes.", icon: <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
            { name: "Repel", desc: "Adjust how strongly nodes push away from each other.", icon: <path d="M18 12H6" /> },
            { name: "Shake", desc: "Jiggle nodes to unstuck them.", icon: <path d="M12 8v4l3 3" /> }
        ]
    },
    {
        name: "Analysis",
        color: "text-purple-400",
        desc: "Graph theory stats.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Simulation", desc: "Propagate impact (increase/decrease) through connections.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
            { name: "Highlight/Filter", desc: "Identify Isolated nodes, Hubs, Sources, Sinks, etc.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> }
        ]
    },
    {
        name: "SCAMPER",
        color: "text-cyan-400",
        desc: "Ideation technique.",
        icon: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
        subItems: [
            { name: "S, C, A, M, P, E, R", desc: "Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> }
        ]
    },
    {
        name: "TRIZ",
        color: "text-indigo-400",
        desc: "Inventive Problem Solving.",
        icon: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
        subItems: [
            { name: "Contradiction Matrix", desc: "Solve technical conflicts using 40 principles.", icon: <rect x="4" y="4" width="16" height="16" rx="2" /> },
            { name: "40 Principles", desc: "Apply inventive principles to specific nodes.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /> },
            { name: "ARIZ", desc: "Algorithm for Inventive Problem Solving.", icon: <path d="M19 11H5" /> },
            { name: "Su-Field", desc: "Substance-Field Analysis.", icon: <path d="M13 10V3L4 14" /> },
            { name: "Trends", desc: "Evolution Trends.", icon: <path d="M13 7h8m0 0v8" /> }
        ]
    },
    {
        name: "Lean Six Sigma",
        color: "text-blue-400",
        desc: "Process Improvement.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Project Charter", desc: "Problem, Scope, Goals.", icon: <path d="M9 12h6" /> },
            { name: "SIPOC", desc: "Suppliers, Inputs, Process, Outputs, Customers.", icon: <path d="M8 7h12" /> },
            { name: "VoC", desc: "Voice of Customer analysis.", icon: <path d="M11 5v14" /> },
            { name: "DMAIC", desc: "Define, Measure, Analyze, Improve, Control.", icon: <path d="M4 4v5h.5" /> },
            { name: "5 Whys", desc: "Root Cause Analysis.", icon: <path d="M8 9c.5 0 1" /> },
            { name: "Fishbone", desc: "Ishikawa Diagram.", icon: <path d="M4 12h16" /> }
        ]
    },
    {
        name: "Theory of Constraints",
        color: "text-amber-400",
        desc: "Constraint Management.",
        icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "Current Reality Tree", desc: "Identify Core Constraints.", icon: <path d="M12 9v2" /> },
            { name: "Evaporating Cloud", desc: "Resolve Conflicts.", icon: <path d="M3 15a4 4 0 004 4" /> },
            { name: "Future Reality Tree", desc: "Visualize Solutions.", icon: <path d="M13 10V3" /> }
        ]
    },
    {
        name: "Soft Systems",
        color: "text-cyan-400",
        desc: "Complex Problem Solving.",
        icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />,
        subItems: [
            { name: "Rich Picture", desc: "Explore Relationships & Climate.", icon: <path d="M4 16l4.586-4.586" /> },
            { name: "CATWOE", desc: "Worldview Analysis.", icon: <path d="M3 11H5" /> },
            { name: "Activity Models", desc: "Root Definitions.", icon: <path d="M19 11H5" /> }
        ]
    },
    {
        name: "Strategy",
        color: "text-lime-400",
        desc: "Strategic Frameworks.",
        icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "SWOT", desc: "Strengths, Weaknesses, Opportunities, Threats.", icon: <rect x="4" y="4" width="16" height="16" /> },
            { name: "PESTEL", desc: "Macro-environmental factors.", icon: <path d="M3 11H5" /> },
            { name: "Porter's 5 Forces", desc: "Competitive Analysis.", icon: <path d="M9 12l2 2" /> }
        ]
    },
    {
        name: "Explorer",
        color: "text-yellow-400",
        desc: "Visual Graph Analysis.",
        icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        subItems: [
            { name: "Treemap", desc: "Hierarchical view of structure.", icon: <path d="M4 6h16" /> },
            { name: "Sunburst", desc: "Radial view of relationships.", icon: <path d="M12 3v1" /> },
            { name: "Tag Distribution", desc: "Tag frequency.", icon: <path d="M7 7h.01" /> }
        ]
    },
    {
        name: "Word Cloud",
        color: "text-pink-400",
        desc: "Text Analysis.",
        icon: <path d="M7 7h.01M7 3h5" />,
        subItems: [
            { name: "Tag Cloud", desc: "Tag frequency cloud.", icon: <path d="M7 7h.01" /> },
            { name: "Relationship Cloud", desc: "Connectivity cloud.", icon: <path d="M13 10l-4 4" /> },
            { name: "Full Text", desc: "Analyze content text.", icon: <path d="M19 20H5" /> }
        ]
    },
    {
        name: "Diagrams",
        color: "text-cyan-400",
        desc: "Mermaid.js Editor.",
        icon: <path d="M7 12l3-3 3 3 4-4" />,
        subItems: [
            { name: "Editor", desc: "Text-to-diagram editor supporting Flowcharts, Sequence, etc.", icon: <path d="M4 5h14" /> }
        ]
    },
    {
        name: "Bulk Edit",
        color: "text-pink-400",
        desc: "Mass Tagging.",
        icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
        subItems: [
            { name: "Add/Remove Tags", desc: "Apply tags to nodes by clicking them.", icon: <path d="M7 7h.01" /> }
        ]
    },
    {
        name: "Command",
        color: "text-green-400",
        desc: "Quick Entry.",
        icon: <path d="M8 9l3 3-3 3m5 0h3" />,
        subItems: [
            { name: "Quick Add", desc: "Add nodes/links via text: A -> B.", icon: <path d="M5 20h14" /> }
        ]
    }
];

export const UserGuideModal: React.FC<ModalProps> = ({ onClose }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'interface' | 'tools'>('interface');

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className="bg-gray-900 rounded-lg max-w-5xl w-full h-[85vh] shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">User Guide</h2>
                        <p className="text-sm text-gray-400 mt-1">Reference for tools and interface elements.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 bg-gray-800/50">
                    <button 
                        onClick={() => setActiveTab('interface')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interface' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Interface & Navigation
                    </button>
                    <button 
                        onClick={() => setActiveTab('tools')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tools' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Analysis & Creation Tools
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 bg-gray-900 custom-scrollbar">
                    
                    {activeTab === 'interface' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {INTERFACE_ITEMS.map((item, idx) => (
                                <div key={idx} className="flex items-start p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-500 transition-colors group">
                                    <div className="p-2 bg-gray-700 rounded-lg text-gray-300 group-hover:text-white mr-3 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            {item.icon}
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-200 text-sm mb-1">{item.name}</h3>
                                        <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-8">
                            {TOOLS_DATA.map((tool, idx) => (
                                <div key={idx} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/30">
                                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gray-700 ${tool.color}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                {tool.icon}
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold ${tool.color}`}>{tool.name}</h3>
                                            <p className="text-sm text-gray-400">{tool.desc}</p>
                                        </div>
                                    </div>
                                    
                                    {tool.subItems && tool.subItems.length > 0 && (
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/50">
                                            {tool.subItems.map((sub, sIdx) => (
                                                <div key={sIdx} className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded bg-gray-800 text-gray-400`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            {sub.icon}
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-300">{sub.name}</div>
                                                        <div className="text-xs text-gray-500">{sub.desc}</div>
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
