
import React, { useState, useEffect, useRef, useMemo } from 'react';
import mermaid from 'mermaid';
import { MermaidDiagram, Element, Relationship } from '../types';
import { generateUUID, generateMarkdownFromGraph } from '../utils';

interface MermaidPanelProps {
  savedDiagrams: MermaidDiagram[];
  onSaveDiagram: (diagram: MermaidDiagram) => void;
  onDeleteDiagram: (id: string) => void;
  onGenerate: (prompt: string, contextMarkdown?: string) => Promise<string>;
  onClose: () => void;
  isGenerating: boolean;
  elements: Element[];
  relationships: Relationship[];
  multiSelection: Set<string>;
  isDarkMode: boolean;
}

const AI_ACTIONS = [
    { name: "Flowchart", prompt: "Provide mermaid markdown for a flowchart for this" },
    { name: "Mind Map", prompt: "Provide mermaid markdown for a mind map for this" },
    { name: "Use Case", prompt: "Provide mermaid markdown for a use case diagram based on a left to right flowchart diagram that uses stadium-shaped nodes by wrapping the node names in round and square brackets ([node name]) for this" },
    { name: "Decomposition", prompt: "Provide mermaid markdown for a functional decomposition diagram showing functions as boxes. Sub-functions of each function should be shown as subgraphs in their own boxes inside the box for the function they belong to for this" },
    { name: "Sequence", prompt: "Provide mermaid markdown for a sequence diagram for this" },
    { name: "Class Diagram", prompt: "Provide mermaid markdown for a class diagram for this" },
    { name: "Perimeter", prompt: "Provide mermaid markdown for a perimeter diagram showing the perimeter as a box with a dashed line and the components of the system inside connected via firewall to systems outside the perimeter for this" },
    { name: "ER Diagram", prompt: "Provide mermaid markdown for an entity relationship diagram for this" },
    { name: "State Diagram", prompt: "Provide mermaid markdown for a state diagram for this" },
    { name: "Timeline", prompt: "Provide mermaid markdown for a timeline for this" },
    { name: "Gantt Chart", prompt: "Provide mermaid markdown for a Gantt chart breaking it down into phases as appropriate for this" },
];

export const MermaidPanel: React.FC<MermaidPanelProps> = ({ 
    savedDiagrams, onSaveDiagram, onDeleteDiagram, onGenerate, onClose, isGenerating,
    elements, relationships, multiSelection, isDarkMode
}) => {
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [title, setTitle] = useState('Untitled Diagram');
    const [code, setCode] = useState('graph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;');
    const [error, setError] = useState<string | null>(null);
    const renderRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Zoom/Pan State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [commandInput, setCommandInput] = useState('');

    // Initialize mermaid
    useEffect(() => {
        mermaid.initialize({ 
            startOnLoad: true, 
            theme: isDarkMode ? 'dark' : 'default',
            securityLevel: 'loose',
        });
    }, [isDarkMode]); // Re-init on theme change

    // Auto-load last opened diagram or most recent
    useEffect(() => {
        const lastId = localStorage.getItem('tapestry_last_diagram_id');
        const target = savedDiagrams.find(d => d.id === lastId);
        
        if (target) {
            loadDiagram(target);
        } else if (savedDiagrams.length > 0) {
            // Load most recent
            const recent = [...savedDiagrams].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            loadDiagram(recent);
        }
    }, []); // Run once on mount

    // Handle deletion of current diagram
    useEffect(() => {
        if (currentId && !savedDiagrams.find(d => d.id === currentId)) {
             const recent = [...savedDiagrams].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
             if (recent) {
                 loadDiagram(recent);
             } else {
                 handleCreateNew();
             }
        }
    }, [savedDiagrams, currentId]);

    const zoomToFit = () => {
        if (!renderRef.current || !containerRef.current) return;
        
        const svg = renderRef.current.querySelector('svg');
        if (!svg) return;

        try {
            const bbox = svg.getBBox();
            const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
            
            if (bbox.width === 0 || bbox.height === 0) return;

            const padding = 40;
            const availableWidth = containerWidth - padding;
            const availableHeight = containerHeight - padding;

            const scaleX = availableWidth / bbox.width;
            const scaleY = availableHeight / bbox.height;
            const newZoom = Math.min(scaleX, scaleY, 1); 

            const newX = (containerWidth - bbox.width * newZoom) / 2 - (bbox.x * newZoom);
            const newY = (containerHeight - bbox.height * newZoom) / 2 - (bbox.y * newZoom);

            setZoom(newZoom);
            setPan({ x: newX, y: newY });
        } catch (e) {
            console.warn("Zoom to fit calculation failed", e);
        }
    };

    const renderDiagram = async () => {
        if (!renderRef.current || !code.trim()) return;
        setError(null);
        try {
            renderRef.current.innerHTML = '';
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            // Re-apply theme just in case
            mermaid.initialize({ theme: isDarkMode ? 'dark' : 'default' });
            
            const { svg } = await mermaid.render(id, code);
            if (renderRef.current) {
                renderRef.current.innerHTML = svg;
            }
        } catch (e: any) {
            console.error("Mermaid Render Error:", e);
            setError(e.message || "Syntax error in Mermaid code");
        }
    };

    // Debounced render
    useEffect(() => {
        const timer = setTimeout(() => {
            renderDiagram();
        }, 800);
        return () => clearTimeout(timer);
    }, [code, isDarkMode]);

    const handleSave = () => {
        const now = new Date().toISOString();
        const diagram: MermaidDiagram = {
            id: currentId || generateUUID(),
            title,
            code,
            createdAt: currentId ? (savedDiagrams.find(d => d.id === currentId)?.createdAt || now) : now,
            updatedAt: now
        };
        onSaveDiagram(diagram);
        setCurrentId(diagram.id);
        localStorage.setItem('tapestry_last_diagram_id', diagram.id);
    };

    const loadDiagram = (d: MermaidDiagram) => {
        setCurrentId(d.id);
        setTitle(d.title);
        setCode(d.code);
        localStorage.setItem('tapestry_last_diagram_id', d.id);
        setTimeout(zoomToFit, 100);
    };

    const handleCreateNew = () => {
        setCurrentId(null);
        setTitle('Untitled Diagram');
        setCode('graph TD;\n    A[Start] --> B{Decision};\n    B -->|Yes| C[Do Something];\n    B -->|No| D[End];');
        localStorage.removeItem('tapestry_last_diagram_id');
        setTimeout(zoomToFit, 100);
    };

    // Helper to get context
    const getGraphContext = () => {
        const hasSelection = multiSelection.size > 1;
        const contextElements = hasSelection
            ? elements.filter(e => multiSelection.has(e.id))
            : elements;
        
        const contextRels = hasSelection
            ? relationships.filter(r => multiSelection.has(r.source as string) && multiSelection.has(r.target as string))
            : relationships;
            
        return generateMarkdownFromGraph(contextElements, contextRels);
    };

    const handleAIRequest = async (promptAction: string) => {
        setIsDropdownOpen(false);
        const context = getGraphContext();
        const result = await onGenerate(promptAction, context);
        if (result) {
            let cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            setCode(cleanCode);
            // Only set title if it's a new unsaved diagram
            if (!currentId) {
                setTitle(`AI Generated ${new Date().toLocaleTimeString()}`);
            }
        }
    };

    const handleCommandExecute = async () => {
        if (!commandInput.trim()) return;
        const context = getGraphContext();
        const prompt = `Modify or create a diagram based on the current request: "${commandInput}".
        Current Code (if any):
        ${code}
        
        Graph Data Context:
        ${context}`;
        
        setCommandInput('');
        const result = await onGenerate(prompt, context);
        if (result) {
            let cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            setCode(cleanCode);
        }
    };

    // --- Pan/Zoom Handlers ---
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.min(Math.max(0.1, z * delta), 5));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const sortedDiagrams = useMemo(() => {
        return [...savedDiagrams].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [savedDiagrams]);

    const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const sidebarBgClass = isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const inputBgClass = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const previewBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

    return (
        <div className={`w-full h-full flex ${bgClass} border-l ${borderClass}`}>
            {/* Left Sidebar: Saved Diagrams */}
            <div className={`w-64 flex-shrink-0 border-r ${borderClass} flex flex-col ${sidebarBgClass}`}>
                <div className={`p-4 border-b ${borderClass} flex-shrink-0`}>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Diagrams</h2>
                        <span className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'} px-1.5 py-0.5 rounded`}>{savedDiagrams.length}</span>
                    </div>
                    <button 
                        onClick={handleCreateNew}
                        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Diagram
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {sortedDiagrams.map(d => (
                        <div 
                            key={d.id} 
                            onClick={() => loadDiagram(d)}
                            className={`p-2 rounded cursor-pointer group flex justify-between items-center transition-colors ${currentId === d.id ? 'bg-cyan-900/40 border border-cyan-700/50 text-cyan-600 font-bold' : `${textClass} hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent`}`}
                        >
                            <div className="truncate flex-grow min-w-0 mr-2">
                                <div className="text-sm truncate">{d.title}</div>
                                <div className="text-[10px] opacity-60">{new Date(d.updatedAt).toLocaleDateString()}</div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteDiagram(d.id); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-gray-300 dark:hover:bg-gray-800 transition-all"
                                title="Delete Diagram"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {sortedDiagrams.length === 0 && (
                        <div className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-xs py-8 italic`}>
                            No saved diagrams.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Content: Editor & Preview */}
            <div className={`flex-grow flex flex-col min-w-0 ${bgClass}`}>
                {/* Header */}
                <div className={`p-2 border-b ${borderClass} flex justify-between items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex-shrink-0`}>
                    <div className="flex gap-2 items-center flex-wrap flex-grow">
                        <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className={`${inputBgClass} rounded px-3 py-1.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none flex-grow min-w-[150px] max-w-md font-bold`}
                            placeholder="Diagram Title"
                        />
                        <button onClick={() => renderDiagram()} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-700'} hover:text-blue-500 px-3 py-1.5 rounded text-xs font-bold border ${borderClass} transition-colors shadow-sm`}>
                            Render
                        </button>
                        <button onClick={handleSave} className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
                            </svg>
                            Save
                        </button>
                    </div>
                    <button onClick={onClose} className={`${textClass} hover:text-blue-500 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Split View */}
                <div className="flex-grow flex flex-col lg:flex-row min-h-0">
                    {/* Editor Side */}
                    <div className={`w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r ${borderClass} ${bgClass}`}>
                        <div className={`p-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'} text-xs font-bold uppercase tracking-wider border-b ${borderClass} flex justify-between items-center`}>
                            <span>Mermaid Code</span>
                            <div className="group relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`text-cyan-600 hover:text-cyan-500 flex items-center gap-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} px-2 py-0.5 rounded transition-colors`}
                                >
                                    Templates ▼
                                </button>
                                {isDropdownOpen && (
                                    <div className={`absolute right-0 top-full mt-1 w-56 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border rounded shadow-xl z-50 max-h-64 overflow-y-auto`}>
                                        {AI_ACTIONS.map(action => (
                                            <button
                                                key={action.name}
                                                onClick={() => handleAIRequest(action.prompt)}
                                                disabled={isGenerating}
                                                className={`block w-full text-left px-4 py-2 text-xs ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'} border-b last:border-0`}
                                            >
                                                {action.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <textarea
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            className={`flex-grow w-full ${inputBgClass} font-mono text-xs p-3 focus:outline-none resize-none border-0`}
                            spellCheck={false}
                        />
                        
                        {/* Command Bar */}
                        <div className={`p-2 border-t ${borderClass} ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex flex-col gap-1`}>
                            <label className="text-[10px] text-cyan-500 font-bold uppercase">AI Command</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={commandInput}
                                    onChange={(e) => setCommandInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCommandExecute()}
                                    placeholder="e.g. 'Make connections dashed'..."
                                    className={`flex-grow ${inputBgClass} rounded px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500 border ${borderClass}`}
                                />
                                <button 
                                    onClick={handleCommandExecute}
                                    disabled={isGenerating || !commandInput.trim()}
                                    className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className={`w-full lg:w-2/3 ${previewBgClass} flex flex-col relative overflow-hidden`}>
                        {/* Zoom Controls */}
                        <div className={`absolute top-4 right-4 z-10 flex gap-1 ${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/80 border-gray-300'} p-1 rounded border backdrop-blur shadow-lg`}>
                            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className={`${textClass} hover:bg-gray-200 dark:hover:bg-gray-600 w-6 h-6 rounded flex items-center justify-center font-bold`}>-</button>
                            <button onClick={zoomToFit} className={`${textClass} hover:bg-gray-200 dark:hover:bg-gray-600 px-2 h-6 rounded text-xs font-bold uppercase`} title="Zoom to Fit">Fit</button>
                            <span className={`${textClass} text-xs flex items-center px-2 select-none font-mono border-x ${borderClass} mx-1`}>{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className={`${textClass} hover:bg-gray-200 dark:hover:bg-gray-600 w-6 h-6 rounded flex items-center justify-center font-bold`}>+</button>
                        </div>
                        
                        {/* Loading Overlay */}
                        {isGenerating && (
                            <div className={`absolute inset-0 z-20 ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in`}>
                                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <h3 className="text-2xl font-bold text-cyan-500 animate-pulse">Generating Diagram...</h3>
                                <p className={`${textClass} mt-2 text-sm`}>Analyzing model structure</p>
                            </div>
                        )}

                        {/* Error Toast */}
                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 border border-red-500 text-white p-3 rounded text-xs font-mono shadow-lg z-20">
                                <strong className="block mb-1 text-red-300">Render Error:</strong>
                                {error}
                            </div>
                        )}

                        {/* Canvas */}
                        <div 
                            ref={containerRef}
                            className={`flex-grow overflow-hidden ${previewBgClass} cursor-grab active:cursor-grabbing`}
                            style={{ 
                                backgroundImage: `radial-gradient(${gridColor} 1px, transparent 1px)`,
                                backgroundSize: '16px 16px'
                            }}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div 
                                ref={renderRef} 
                                style={{ 
                                    transformOrigin: '0 0',
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                }}
                                className="origin-top-left p-10 inline-block"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MermaidPanel;
