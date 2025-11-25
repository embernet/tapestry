
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

const MermaidPanel: React.FC<MermaidPanelProps> = ({ 
    savedDiagrams, onSaveDiagram, onDeleteDiagram, onGenerate, onClose, isGenerating,
    elements, relationships, multiSelection
}) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'list'>('edit');
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
            theme: 'dark',
            securityLevel: 'loose',
        });
    }, []);

    const zoomToFit = () => {
        if (!renderRef.current || !containerRef.current) return;
        
        const svg = renderRef.current.querySelector('svg');
        if (!svg) return;

        try {
            // Reset transform temporarily to get accurate measurements
            // (Not strictly necessary if we calculate based on unscaled bbox, but safer)
            
            // Get bounding box of content
            const bbox = svg.getBBox();
            const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
            
            if (bbox.width === 0 || bbox.height === 0) return;

            const padding = 40;
            const availableWidth = containerWidth - padding;
            const availableHeight = containerHeight - padding;

            const scaleX = availableWidth / bbox.width;
            const scaleY = availableHeight / bbox.height;
            const newZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 100% by default

            // Center
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
            const { svg } = await mermaid.render(id, code);
            if (renderRef.current) {
                renderRef.current.innerHTML = svg;
                // Small delay to let DOM update before fitting
                setTimeout(zoomToFit, 100);
            }
        } catch (e: any) {
            console.error("Mermaid Render Error:", e);
            setError(e.message || "Syntax error in Mermaid code");
        }
    };

    useEffect(() => {
        if (activeTab === 'edit') {
            const timer = setTimeout(() => {
                renderDiagram();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [code, activeTab]);

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
        alert("Diagram saved!");
    };

    const handleLoad = (diagram: MermaidDiagram) => {
        setTitle(diagram.title);
        setCode(diagram.code);
        setCurrentId(diagram.id);
        setActiveTab('edit');
    };

    const handleCreateNew = () => {
        setTitle('Untitled Diagram');
        setCode('graph TD;\n    A[Start] --> B{Decision};\n    B -->|Yes| C[Do Something];\n    B -->|No| D[End];');
        setCurrentId(null);
        setActiveTab('edit');
        setPan({ x: 0, y: 0 });
        setZoom(1);
    };

    // Helper to get context
    const getGraphContext = () => {
        const hasSelection = multiSelection.size > 1;
        const contextElements = hasSelection
            ? elements.filter(e => multiSelection.has(e.id))
            : elements;
        
        // If filtering, only show relationships where BOTH ends are in selection
        const contextRels = hasSelection
            ? relationships.filter(r => multiSelection.has(r.source as string) && multiSelection.has(r.target as string))
            : relationships;
            
        return generateMarkdownFromGraph(contextElements, contextRels);
    };

    const handleAIRequest = async (promptAction: string) => {
        setIsDropdownOpen(false); // Close immediately
        const context = getGraphContext();
        const result = await onGenerate(promptAction, context);
        if (result) {
            let cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            setCode(cleanCode);
            setTitle(`AI Generated ${new Date().toLocaleTimeString()}`);
            setCurrentId(null);
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

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 border-l border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-cyan-400">Diagrams</h2>
                    <div className="flex bg-gray-800 rounded border border-gray-600 p-0.5">
                        <button 
                            onClick={() => setActiveTab('edit')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'edit' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Editor
                        </button>
                        <button 
                            onClick={() => setActiveTab('list')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'list' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Saved ({savedDiagrams.length})
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {activeTab === 'list' && (
                <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-800">
                    <button 
                        onClick={handleCreateNew}
                        className="w-full bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-700/50 border-dashed rounded p-3 text-cyan-400 font-bold text-sm mb-4 transition-colors"
                    >
                        + Create New Diagram
                    </button>
                    
                    {savedDiagrams.length === 0 ? (
                        <p className="text-center text-gray-500 italic mt-10">No saved diagrams.</p>
                    ) : (
                        savedDiagrams.map(d => (
                            <div key={d.id} className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-3 flex justify-between items-center group cursor-pointer" onClick={() => handleLoad(d)}>
                                <div>
                                    <h3 className="font-bold text-white">{d.title}</h3>
                                    <p className="text-xs text-gray-400">Updated: {new Date(d.updatedAt).toLocaleString()}</p>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteDiagram(d.id); }}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'edit' && (
                <div className="flex-grow flex flex-col min-h-0">
                    {/* Editor Toolbar */}
                    <div className="p-2 bg-gray-800 border-b border-gray-700 flex gap-2 items-center flex-wrap">
                        <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none flex-grow min-w-[150px]"
                            placeholder="Diagram Title"
                        />
                        <button onClick={() => renderDiagram()} className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-1 rounded text-xs font-bold border border-gray-600">
                            Render
                        </button>
                        <button onClick={handleSave} className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">
                            Save
                        </button>
                    </div>

                    {/* Split Content */}
                    <div className="flex-grow flex flex-col lg:flex-row min-h-0">
                        {/* Editor Side */}
                        <div className="w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-700 bg-gray-900">
                            <div className="p-2 bg-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 flex justify-between items-center">
                                <span>Markdown Code</span>
                                <div className="group relative">
                                    <button 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="text-cyan-400 hover:text-white flex items-center gap-1 bg-gray-700 px-2 py-0.5 rounded"
                                    >
                                        AI Templates ▼
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 max-h-64 overflow-y-auto">
                                            {AI_ACTIONS.map(action => (
                                                <button
                                                    key={action.name}
                                                    onClick={() => handleAIRequest(action.prompt)}
                                                    disabled={isGenerating}
                                                    className="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 last:border-0"
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
                                className="flex-grow w-full bg-gray-900 text-gray-300 font-mono text-xs p-3 focus:outline-none resize-none"
                                spellCheck={false}
                            />
                            {/* Command Bar */}
                            <div className="p-2 border-t border-gray-700 bg-gray-800 flex flex-col gap-1">
                                <label className="text-[10px] text-cyan-400 font-bold uppercase">AI Command</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={commandInput}
                                        onChange={(e) => setCommandInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCommandExecute()}
                                        placeholder="e.g. 'Make connections dashed' or 'Add a subgraph for Admin'"
                                        className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                    <button 
                                        onClick={handleCommandExecute}
                                        disabled={isGenerating || !commandInput.trim()}
                                        className="bg-cyan-700 hover:bg-cyan-600 text-white px-2 py-1 rounded text-xs"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="w-full lg:w-2/3 bg-gray-800 flex flex-col relative overflow-hidden">
                            {/* Zoom Controls */}
                            <div className="absolute top-4 right-4 z-10 flex gap-1 bg-gray-800/80 p-1 rounded border border-gray-600 backdrop-blur">
                                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="hover:bg-gray-600 text-white w-6 h-6 rounded flex items-center justify-center">-</button>
                                <button onClick={zoomToFit} className="hover:bg-gray-600 text-white px-2 h-6 rounded text-xs" title="Zoom to Fit">Fit</button>
                                <span className="text-gray-400 text-xs flex items-center px-1 select-none">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="hover:bg-gray-600 text-white w-6 h-6 rounded flex items-center justify-center">+</button>
                            </div>
                            
                            {/* Loading Overlay */}
                            {isGenerating && (
                                <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <h3 className="text-2xl font-bold text-cyan-400 animate-pulse">Generating Diagram...</h3>
                                    <p className="text-gray-400 mt-2 text-sm">Analyzing model structure</p>
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
                                className="flex-grow overflow-hidden bg-gray-800 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] cursor-grab active:cursor-grabbing"
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
                                    className="origin-top-left p-10 inline-block" // Add padding to content
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MermaidPanel;
