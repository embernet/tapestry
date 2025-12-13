
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TOOL_DOCUMENTATION } from '../documentation';
import { PatternGalleryView } from './PatternGalleryModal';

interface ModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

// Interface Items Data
const INTERFACE_ITEMS = [
    { id: 'interface-new', name: "New Model", desc: "Start a fresh, empty knowledge graph.", icon: <path d="M12 4v16m8-8H4" /> },
    { id: 'interface-open', name: "Open Model", desc: "Load a previously saved JSON model from your computer.", icon: <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
    { id: 'interface-save', name: "Save to Disk", desc: "Download the current model state as a JSON file.", icon: <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /> },
    { id: 'interface-copy', name: "Copy Selection", desc: "Copy selected nodes and relationships to clipboard (as text/internal data).", icon: <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /> },
    { id: 'interface-paste', name: "Paste", desc: "Paste nodes from clipboard into the current graph.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { id: 'interface-tools', name: "Tools Panel", desc: "Toggle the main toolbar for analysis and editing tools.", icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /> },
    { id: 'interface-filter', name: "Filter", desc: "Filter visible nodes by tags or date ranges.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> },
    { id: 'interface-focus', name: "Focus Mode", desc: "Toggle between Narrow (Selection only), Wide (Neighbors), and Zoom focus.", icon: <circle cx="12" cy="12" r="3" /> },
    { id: 'interface-diagrams', name: "Diagrams", desc: "Open the Mermaid.js diagram editor.", icon: <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /> },
    { id: 'interface-docs', name: "Documents", desc: "Manage text documents and analysis reports.", icon: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { id: 'interface-kanban', name: "Kanban", desc: "View nodes as cards in a Kanban board.", icon: <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { id: 'interface-story', name: "Story Mode", desc: "Create presentations by capturing graph views.", icon: <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
    { id: 'interface-table', name: "Table", desc: "Edit nodes and properties in a spreadsheet view.", icon: <path d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /> },
    { id: 'interface-matrix', name: "Matrix", desc: "View relationships as an adjacency matrix.", icon: <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z M12 3v18 M3 12h18" /> },
    { id: 'interface-grid', name: "Grid", desc: "Plot nodes on an X/Y axis based on attributes.", icon: <path d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /> },
    { id: 'interface-md', name: "Markdown", desc: "Edit the graph using text-based markdown.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { id: 'interface-json', name: "JSON", desc: "View/Edit raw JSON data.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /> },
    { id: 'interface-report', name: "Report", desc: "Generate a readable text report of the model.", icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { id: 'interface-history', name: "History", desc: "View log of AI interactions.", icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { id: 'interface-chat', name: "AI Chat", desc: "Chat with the graph using AI.", icon: <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
    { id: 'interface-settings', name: "Settings", desc: "Configure API keys and prompts.", icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    { id: 'interface-zoom', name: "Zoom Fit", desc: "Center the graph.", icon: <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /> },
    { id: 'interface-selftest', name: "Self Test", desc: "Run automated diagnostics on the application.", icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
];

const SCENARIOS = [
    {
        title: "System Design & Analysis",
        desc: "Mapping software architecture, supply chains, or organizational structures to identify dependencies and single points of failure."
    },
    {
        title: "Strategic Planning",
        desc: "Using SWOT, PESTEL, or Porter's Five Forces to map external factors against internal capabilities for robust decision making."
    },
    {
        title: "Innovation & Ideation",
        desc: "Applying TRIZ or SCAMPER methodologies to systematically break out of creative blocks and solve technical contradictions."
    },
    {
        title: "Process Improvement",
        desc: "Using Lean Six Sigma or Theory of Constraints (TOC) to identify bottlenecks, waste, and root causes in complex workflows."
    },
    {
        title: "Learning & Curriculum Design",
        desc: "Mapping Knowledge Dependencies & Prerequisites. Visualizing the relationships between concepts, skills, and learning outcomes to design effective educational paths. This allows users to identify \"bottleneck concepts\" (key ideas that must be mastered before progressing) and structure courses or self-learning roadmaps logically."
    },
    {
        title: "Investigative Journalism & Research",
        desc: "Connecting Disparate Data Points. Linking entities (people, organizations, events, locations) extracted from vast amounts of unstructured text or documents. This helps uncover hidden networks, track the flow of money or influence, and verify timelines by cross-referencing sources against a structured graph."
    },
    {
        title: "Conflict Resolution & Negotiation",
        desc: "Stakeholder & Interest Mapping. Modeling the various actors involved in a dispute, their underlying interests (needs, fears, desires), and their stated positions. This visualization helps mediators or negotiators identify \"zones of possible agreement\" (ZOPA) and uncover non-obvious trade-offs or shared interests that can lead to resolution."
    },
    {
        title: "Product Lifecycle Management (PLM)",
        desc: "Tracing Requirements to Implementation. Creating a traceability graph that links high-level business requirements to specific features, code modules, and test cases. This allows teams to instantly visualize the impact of a proposed change (impact analysis) and ensures that every feature developed is directly supporting a business goal."
    },
    {
        title: "Horizon Scanning & Technology Scouting",
        desc: "Tracking Emerging Trends & Signal Convergence. Visualizing weak signals, emerging technologies, and market shifts to anticipate future disruptions. This involves linking seemingly unrelated indicators (e.g., a new patent, a startup funding round, a regulatory change) to identify potential convergence points and assess their maturity levels (e.g., using TRL - Technology Readiness Levels) against strategic goals."
    },
    {
        title: "Futurology & Scenario Planning",
        desc: "Building Alternative Future Worlds. Constructing complex cause-and-effect trees to explore \"what if\" scenarios. By mapping drivers of change (social, technological, economic) against uncertainties, users can model multiple divergent futures (e.g., \"Utopian,\" \"Dystopian,\" \"Business as Usual\") to stress-test current strategies against a range of possible outcomes."
    },
    {
        title: "Scientific Hypothesis Generation",
        desc: "Graphing Biological & Chemical Pathways. Mapping relationships between genes, proteins, chemical compounds, and observed phenotypes to identify potential drug targets or biological mechanisms. This allows researchers to visually trace pathways, spot gaps in current literature, and hypothesize new interactions that can be tested experimentally."
    },
    {
        title: "Mathematical Proof Construction",
        desc: "Visualizing Logic & Theorem Dependencies. Structuring complex mathematical proofs by breaking them down into axioms, lemmas, and theorems. This creates a visual \"dependency graph\" of logic, helping mathematicians ensure circular reasoning is avoided and that every step of a complex proof is supported by established truths or derived statements."
    }
];

export const UserGuideModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true }) => {
    const [activeTab, setActiveTab] = useState<'intro' | 'interface' | 'tools' | 'patterns' | 'scripting' | 'index'>('intro');
    const [searchQuery, setSearchQuery] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { 
           if(modalRef.current && !modalRef.current.contains(e.target as Node)) onClose(); 
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Combine items for index
    const indexItems = useMemo(() => {
        const interfaceEntries = INTERFACE_ITEMS.map(i => ({ ...i, type: 'interface' }));
        const toolEntries = TOOL_DOCUMENTATION.map(t => ({ id: t.id, name: t.name, desc: t.desc, type: 'tools' }));
        
        const combined = [...interfaceEntries, ...toolEntries].sort((a, b) => a.name.localeCompare(b.name));
        
        if (!searchQuery) return combined;
        
        return combined.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.desc.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Group index by letter
    const groupedIndex = useMemo(() => {
        const groups: Record<string, typeof indexItems> = {};
        indexItems.forEach(item => {
            const letter = item.name.charAt(0).toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(item);
        });
        return groups;
    }, [indexItems]);

    // Auto-switch to Index on search
    useEffect(() => {
        if (searchQuery && activeTab !== 'index') {
            setActiveTab('index');
        }
    }, [searchQuery]);

    const handleNavigate = (targetTab: 'interface' | 'tools', targetId: string) => {
        setActiveTab(targetTab);
        // Wait for tab to render before scrolling
        setTimeout(() => {
            const el = document.getElementById(`guide-item-${targetId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: temporary highlight
                el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'), 2000);
            }
        }, 100);
    };

    const renderStyledText = (text: string) => {
        if (!text) return null;
        const regex = /(\*\*.*?\*\*|\[\[.*?\|.*?\]\])/g;
        const parts = text.split(regex);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const content = part.slice(2, -2);
                const [label, target] = content.split('|');
                return (
                    <button
                        key={i}
                        onClick={() => setActiveTab(target as any)}
                        className="text-blue-500 hover:underline font-medium inline bg-transparent border-0 p-0 cursor-pointer"
                    >
                        {label}
                    </button>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    // Theme Classes
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
    const searchBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const highlightText = isDarkMode ? 'text-blue-200' : 'text-blue-900';
    const cardBg = isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50';
    const codeBlockBg = isDarkMode ? 'bg-black text-green-400' : 'bg-gray-800 text-green-300';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-start z-[1500] p-4">
            <div 
                ref={modalRef}
                className={`${bgClass} rounded-lg w-full max-w-6xl max-h-[calc(100vh-8rem)] mt-24 shadow-2xl border flex flex-col relative overflow-hidden`}
            >
                {/* Header */}
                <div 
                    className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${headerBg}`}
                >
                    <div className="flex items-center gap-4 md:gap-6 flex-grow min-w-0">
                        <div className="flex-shrink-0">
                            <h2 className={`text-lg md:text-xl font-bold ${textHeader} truncate`}>User Guide</h2>
                            <p className={`text-xs ${textDesc} hidden md:block`}>Reference for tools and interface.</p>
                        </div>
                        {/* Search Bar */}
                        <div className="relative flex-grow max-w-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textDesc}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className={`w-full pl-9 pr-8 py-1.5 rounded-full text-sm outline-none border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${searchBg}`}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-black hover:bg-gray-200'} p-2 rounded-full transition-colors flex-shrink-0 ml-2`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs - Scrollable on Mobile */}
                <div className={`flex overflow-x-auto border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                     <button 
                        onClick={() => setActiveTab('intro')}
                        className={`px-4 md:px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'intro' ? tabActive : tabInactive}`}
                    >
                        Introduction
                    </button>
                    <button 
                        onClick={() => setActiveTab('patterns')}
                        className={`px-4 md:px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'patterns' ? tabActive : tabInactive}`}
                    >
                        Patterns
                    </button>
                    <button 
                        onClick={() => setActiveTab('index')}
                        className={`px-4 md:px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'index' ? tabActive : tabInactive}`}
                    >
                        Index
                    </button>
                    <button 
                        onClick={() => setActiveTab('interface')}
                        className={`px-4 md:px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'interface' ? tabActive : tabInactive}`}
                    >
                        Interface
                    </button>
                    <button 
                        onClick={() => setActiveTab('tools')}
                        className={`px-4 md:px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tools' ? tabActive : tabInactive}`}
                    >
                        Tools
                    </button>
                    <button 
                        onClick={() => setActiveTab('scripting')}
                        className={`px-4 md:px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'scripting' ? tabActive : tabInactive}`}
                    >
                        Scripting
                    </button>
                </div>

                {/* Content */}
                <div ref={scrollContainerRef} className={`flex-grow overflow-y-auto min-h-0 p-4 md:p-8 custom-scrollbar ${scrollBg}`}>
                    
                    {activeTab === 'intro' && (
                        <div className="max-w-4xl mx-auto space-y-10">
                            {/* Introduction Hero */}
                            <div className="space-y-4 border-b pb-8 border-gray-700/50">
                                <h3 className={`text-3xl font-bold ${textHeader}`}>Welcome to Tapestry Studio</h3>
                                <p className={`text-lg leading-relaxed ${highlightText}`}>
                                    Tapestry Studio is an AI-powered knowledge graph environment designed for systems thinking. 
                                    It combines a flexible node-link canvas with structured analytical frameworks.
                                </p>
                                <div className={`p-4 rounded-lg text-sm leading-relaxed border ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                    <strong>Motivation:</strong> Linear documents and static diagrams often fail to capture the complexity of real-world systems. 
                                    Tapestry was created to bridge this gap, allowing users to model causal relationships and leverage AI to analyze structure, 
                                    detect contradictions, and generate solutions.
                                </div>
                            </div>

                            {/* Scenarios */}
                            <div className="space-y-4">
                                <h4 className={`text-xl font-bold ${textHeader}`}>Common Scenarios</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {SCENARIOS.map((scenario, index) => (
                                        <div key={index} className={`p-4 rounded-lg border ${itemBg}`}>
                                            <h5 className={`font-bold mb-2 ${sectionTitle}`}>{scenario.title}</h5>
                                            <p className={`text-sm ${textDesc}`}>{scenario.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tool Summary Grid */}
                            <div className="space-y-4">
                                <h4 className={`text-xl font-bold ${textHeader}`}>Toolbox Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {TOOL_DOCUMENTATION.filter(t => !t.hideInGuide).map(tool => (
                                        <button 
                                            key={tool.id}
                                            onClick={() => handleNavigate('tools', tool.id)}
                                            className={`p-3 text-left rounded border transition-all group flex flex-col gap-2 ${cardBg} ${isDarkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-blue-300'}`}
                                        >
                                            <div className={`flex items-center gap-2 ${tool.color}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {tool.icon}
                                                </svg>
                                                <span className="font-bold text-xs uppercase tracking-wide">{tool.name}</span>
                                            </div>
                                            <p className={`text-xs leading-snug line-clamp-2 ${textDesc} group-hover:${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                                {tool.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'patterns' && (
                        <PatternGalleryView isDarkMode={isDarkMode} />
                    )}

                    {activeTab === 'index' && (
                         <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                             {Object.keys(groupedIndex).sort().map(letter => (
                                 <div key={letter} className="break-inside-avoid mb-6">
                                     <h3 className={`text-2xl font-bold mb-4 border-b ${isDarkMode ? 'border-gray-700 text-blue-500' : 'border-gray-200 text-blue-600'}`}>{letter}</h3>
                                     <div className="flex flex-col gap-2">
                                         {groupedIndex[letter].map(item => (
                                             <button
                                                key={item.id}
                                                onClick={() => handleNavigate(item.type as 'interface' | 'tools', item.id)}
                                                className={`text-left p-2 rounded hover:bg-opacity-50 transition-colors group flex items-start gap-2 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-white'}`}
                                             >
                                                 <div className="mt-0.5 shrink-0 text-gray-500">
                                                    {item.type === 'interface' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                                                    )}
                                                 </div>
                                                 <div>
                                                     <div className={`font-semibold text-sm group-hover:text-blue-400 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{item.name}</div>
                                                     <div className={`text-xs line-clamp-1 ${textDesc}`}>{item.desc}</div>
                                                 </div>
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                             {indexItems.length === 0 && (
                                 <div className={`text-center py-10 ${textDesc}`}>No results found for "{searchQuery}".</div>
                             )}
                         </div>
                    )}

                    {activeTab === 'interface' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {INTERFACE_ITEMS.map((item, idx) => (
                                <div id={`guide-item-${item.id}`} key={item.id} className={`flex items-start p-3 rounded border transition-colors group ${itemBg}`}>
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
                                <div id={`guide-item-${tool.id}`} key={tool.id} className={`border rounded-lg overflow-hidden ${groupBg}`}>
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
                                            <p className={`text-xs leading-relaxed opacity-80 md:pl-11 ${textDesc}`}>
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
                                                    {section.text && <p className={`mb-2 ${textDesc}`}>{renderStyledText(section.text)}</p>}
                                                    {section.items && (
                                                        <ul className={`list-disc pl-4 space-y-1 ${textDesc}`}>
                                                            {section.items.map((it, i) => (
                                                                <li key={i}>{renderStyledText(it)}</li>
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

                    {activeTab === 'scripting' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                             {/* Intro */}
                            <div className="border-b border-gray-700/50 pb-6">
                                <h3 className={`text-2xl font-bold mb-4 ${textHeader}`}>Tapestry Script (TScript)</h3>
                                <p className={`text-base leading-relaxed mb-4 ${textDesc}`}>
                                    Tapestry Script (TScript) is a domain-specific language based on a strict subset of Python. It allows you to programmatically automate graph operations, analyze connectivity, and build custom workflows. It uses Python-style indentation for blocks (if/else/for) and standard assignment syntax.
                                </p>
                            </div>
                            
                            {/* Syntax Reference */}
                            <div className="space-y-4">
                                <h4 className={`text-xl font-bold ${sectionTitle}`}>Language Syntax</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded border ${itemBg}`}>
                                        <h5 className="font-bold text-sm mb-2 text-green-400">Variables & Assignment</h5>
                                        <pre className={`text-xs font-mono p-2 rounded mb-2 ${codeBlockBg}`}>
{`name = "My Node"
count = 10
count += 5`}
                                        </pre>
                                        <p className={`text-xs ${textDesc}`}>Direct assignment. Supports strings, numbers, lists, and booleans.</p>
                                    </div>
                                    <div className={`p-4 rounded border ${itemBg}`}>
                                        <h5 className="font-bold text-sm mb-2 text-purple-400">Loops</h5>
                                        <pre className={`text-xs font-mono p-2 rounded mb-2 ${codeBlockBg}`}>
{`for node in nodes:
    print(node.name)`}
                                        </pre>
                                        <p className={`text-xs ${textDesc}`}>Iterate over collections. Blocks are defined by indentation.</p>
                                    </div>
                                    <div className={`p-4 rounded border ${itemBg}`}>
                                        <h5 className="font-bold text-sm mb-2 text-orange-400">Control Flow</h5>
                                        <pre className={`text-xs font-mono p-2 rounded mb-2 ${codeBlockBg}`}>
{`if count > 5:
    print("Many")
else:
    print("Few")`}
                                        </pre>
                                        <p className={`text-xs ${textDesc}`}>Conditional logic using standard Python syntax.</p>
                                    </div>
                                    <div className={`p-4 rounded border ${itemBg}`}>
                                        <h5 className="font-bold text-sm mb-2 text-blue-400">Standard Methods</h5>
                                        <pre className={`text-xs font-mono p-2 rounded mb-2 ${codeBlockBg}`}>
{`list.append(item)
str.split(",")
print("Log")
sleep(0.5)`}
                                        </pre>
                                        <p className={`text-xs ${textDesc}`}>Built-in methods for data manipulation and flow control.</p>
                                    </div>
                                </div>
                            </div>

                            {/* API Reference */}
                            <div className="space-y-4">
                                <h4 className={`text-xl font-bold ${sectionTitle}`}>API Reference</h4>
                                
                                <div className={`border rounded-lg overflow-hidden ${groupBg}`}>
                                    <div className={`p-3 font-bold text-sm border-b ${groupHeaderBg} ${textHeader}`}>Graph Operations (graph.*)</div>
                                    <table className={`w-full text-xs text-left ${textDesc}`}>
                                        <tbody className="divide-y divide-gray-700">
                                            <tr><td className="p-2 font-mono text-blue-400">graph.get_all_nodes()</td><td className="p-2">Returns list of all nodes.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.get_node_by_name(name="X")</td><td className="p-2">Finds a single node by name.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.query_nodes(tag="Risk")</td><td className="p-2">Returns nodes matching tag or attributes.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.add_node(name="X", tags="A,B")</td><td className="p-2">Creates a new node. Returns the object.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.delete_node(id="...")</td><td className="p-2">Deletes a node by ID.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.add_edge(source="ID", target="ID")</td><td className="p-2">Connects two nodes.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.get_neighbors(id="...")</td><td className="p-2">Returns directly connected nodes.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.set_attribute(id="...", key="...", value="...")</td><td className="p-2">Updates/Sets a custom attribute.</td></tr>
                                            <tr><td className="p-2 font-mono text-blue-400">graph.set_highlight(id="...", color="#f00")</td><td className="p-2">Sets a persistent highlight color.</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className={`border rounded-lg overflow-hidden ${groupBg}`}>
                                    <div className={`p-3 font-bold text-sm border-b ${groupHeaderBg} ${textHeader}`}>Canvas Operations (canvas.*)</div>
                                    <table className={`w-full text-xs text-left ${textDesc}`}>
                                        <tbody className="divide-y divide-gray-700">
                                            <tr><td className="p-2 font-mono text-green-400">canvas.select_node(id="...")</td><td className="p-2">Selects a node (showing details panel).</td></tr>
                                            <tr><td className="p-2 font-mono text-green-400">canvas.pan_to_node(id="...")</td><td className="p-2">Centers the camera on a node.</td></tr>
                                            <tr><td className="p-2 font-mono text-green-400">canvas.highlight_node(id="...", color="#f00")</td><td className="p-2">Applies a temporary visual highlight (transient).</td></tr>
                                            <tr><td className="p-2 font-mono text-green-400">canvas.clear_highlights()</td><td className="p-2">Removes all transient highlights.</td></tr>
                                            <tr><td className="p-2 font-mono text-green-400">canvas.clear_selection()</td><td className="p-2">Deselects all nodes.</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className={`border rounded-lg overflow-hidden ${groupBg}`}>
                                    <div className={`p-3 font-bold text-sm border-b ${groupHeaderBg} ${textHeader}`}>Document Operations (markdown.*)</div>
                                    <table className={`w-full text-xs text-left ${textDesc}`}>
                                        <tbody className="divide-y divide-gray-700">
                                            <tr><td className="p-2 font-mono text-purple-400">markdown.create_doc(title="T", content="...")</td><td className="p-2">Creates a new text document. Returns ID.</td></tr>
                                            <tr><td className="p-2 font-mono text-purple-400">markdown.open_doc(id="...")</td><td className="p-2">Opens the document editor panel.</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Examples */}
                            <div>
                                <h4 className={`text-xl font-bold mb-4 ${sectionTitle}`}>Examples</h4>
                                
                                <div className={`p-4 rounded border mb-4 ${itemBg}`}>
                                    <h5 className={`font-bold text-sm mb-2 ${textHeader}`}>Walk & Highlight</h5>
                                    <pre className={`text-xs font-mono p-3 rounded overflow-x-auto ${codeBlockBg}`}>
{`target_tag = "Risk"
nodes = graph.query_nodes(tag=target_tag)
print("Found " + nodes.length + " nodes.")

for node in nodes:
    canvas.pan_to_node(id=node.id)
    canvas.highlight_node(id=node.id, color="#facc15")
    sleep(0.8)

canvas.clear_highlights()`}
                                    </pre>
                                </div>

                                <div className={`p-4 rounded border ${itemBg}`}>
                                    <h5 className={`font-bold text-sm mb-2 ${textHeader}`}>Attribute Audit</h5>
                                    <pre className={`text-xs font-mono p-3 rounded overflow-x-auto ${codeBlockBg}`}>
{`required_key = "Owner"
all_nodes = graph.get_all_nodes()
count = 0

for node in all_nodes:
    if node.attributes.Owner == None:
        graph.set_highlight(id=node.id, color="#ef4444")
        print("Missing Owner: " + node.name)
        count += 1

print("Total found: " + count)`}
                                    </pre>
                                </div>
                                
                                <div className={`p-4 rounded border mt-4 ${itemBg}`}>
                                    <h5 className={`font-bold text-sm mb-2 ${textHeader}`}>Generate Report</h5>
                                    <pre className={`text-xs font-mono p-3 rounded overflow-x-auto ${codeBlockBg}`}>
{`report = "# System Analysis Report\\n\\n"
nodes = graph.get_all_nodes()

for n in nodes:
    details = "### " + n.name + "\\n"
    if n.notes:
        details += "- **Notes:** " + n.notes + "\\n"
    report += details + "\\n"

doc_id = markdown.create_doc(title="Full Report", content=report)
markdown.open_doc(id=doc_id)`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
