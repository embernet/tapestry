import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, TrizToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph, AIConfig, callAI } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';
import { TRIZ_PRINCIPLES_FULL } from '../documentation';
import { promptStore } from '../services/PromptStore';

interface TrizModalProps {
  isOpen: boolean;
  activeTool: TrizToolType;
  elements: Element[];
  relationships: Relationship[];
  modelActions: ModelActions;
  onClose: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  onOpenHistory?: () => void;
  onAnalyze?: (context: string) => void;
  initialParams?: any;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
  customPrompt?: string;
  activeModel?: string;
  aiConfig: AIConfig;
  onOpenGuidance?: () => void;
  isDarkMode: boolean;
}

const PERSPECTIVES = [
    { key: 'general', label: 'General' },
    { key: 'engineering', label: 'Engineering' },
    { key: 'business', label: 'Business' },
    { key: 'software', label: 'Software' },
    { key: 'social', label: 'Social' },
    { key: 'environment', label: 'Environment' },
    { key: 'education', label: 'Education' },
    { key: 'health', label: 'Health' },
    { key: 'arts', label: 'Arts' },
    { key: 'culinary', label: 'Culinary' }
] as const;

const ContradictionPanel: React.FC<{ elements: Element[], onGenerate: (p1: string, p2: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [improvingId, setImprovingId] = useState('');
    const [worseningId, setWorseningId] = useState('');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                A Technical Contradiction occurs when improving one parameter of a system causes another parameter to deteriorate.
                Select two nodes from your graph that represent this conflict.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                    <label className="block text-xs font-bold text-green-400 uppercase mb-2">Improving Feature</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-green-500 outline-none"
                        value={improvingId}
                        onChange={e => setImprovingId(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                    <label className="block text-xs font-bold text-red-400 uppercase mb-2">Worsening Feature</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-red-500 outline-none"
                        value={worseningId}
                        onChange={e => setWorseningId(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
            </div>
            <button 
                disabled={!improvingId || !worseningId || isLoading}
                onClick={() => onGenerate(improvingId, worseningId)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {isLoading ? 'Analyzing...' : 'Identify Contradiction & Suggest Principles'}
            </button>
        </div>
    );
};

const PrinciplesPanel: React.FC<{ elements: Element[], onGenerate: (principleData: string, target: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [selectedPrincipleId, setSelectedPrincipleId] = useState<number>(1);
    const [targetNode, setTargetNode] = useState('');
    const [selectedPerspective, setSelectedPerspective] = useState<string>('general');
    
    const [customName, setCustomName] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    // Use full list from documentation
    const currentPrinciple = useMemo(() => TRIZ_PRINCIPLES_FULL.find(p => p.id === selectedPrincipleId) || TRIZ_PRINCIPLES_FULL[0], [selectedPrincipleId]);

    // Determine current description to show in UI
    const currentDescription = useMemo(() => {
        if (selectedPerspective === 'custom') return customDesc || "Enter a custom description below.";
        // @ts-ignore - dynamic access
        return currentPrinciple[selectedPerspective] || currentPrinciple.general || "General description not available.";
    }, [currentPrinciple, selectedPerspective, customDesc]);

    const handleAutoFillCustom = async () => {
        if (!customName.trim()) {
            alert("Please enter a name for your custom domain (e.g. 'Culinary', 'Military').");
            return;
        }
        setIsAutoFilling(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' }); 
            const prompt = `Explain TRIZ Principle "${currentPrinciple.name}" (${currentPrinciple.engineering}) from the problem domain of "${customName}". Provide a concise 2-3 sentence description/analogy with a British English example.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            if (response.text) {
                setCustomDesc(response.text);
                setSelectedPerspective('custom');
            }
        } catch (e) {
            console.error("Auto-fill failed", e);
            alert("Failed to generate description.");
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleGenerateClick = () => {
        if (!targetNode) return;
        
        let description = "";
        let perspectiveName = "";

        if (selectedPerspective === 'custom') {
            description = customDesc;
            perspectiveName = customName || "Custom";
        } else {
            // @ts-ignore
            description = currentPrinciple[selectedPerspective] || currentPrinciple.general;
            // @ts-ignore
            perspectiveName = PERSPECTIVES.find(p => p.key === selectedPerspective)?.label || selectedPerspective;
        }

        const payload = JSON.stringify({
            name: currentPrinciple.name,
            perspective: perspectiveName,
            description: description
        });

        onGenerate(payload, targetNode);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Principle</label>
                <select 
                    className="w-full bg-gray-800 text-white text-lg font-bold rounded p-3 border border-gray-600 focus:border-violet-500 outline-none"
                    value={selectedPrincipleId}
                    onChange={e => setSelectedPrincipleId(Number(e.target.value))}
                >
                    {TRIZ_PRINCIPLES_FULL.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                
                {/* Dynamic Description Box */}
                <div className="mt-3 bg-gray-800 border border-violet-500/50 rounded p-3 text-sm text-gray-300 italic min-h-[60px]">
                    <span className="text-violet-400 font-bold not-italic mr-2">
                        {selectedPerspective === 'custom' ? (customName || 'Custom') : PERSPECTIVES.find(p => p.key === selectedPerspective)?.label}:
                    </span>
                    {currentDescription}
                </div>
            </div>

            <div className="text-[10px] text-gray-500 font-bold tracking-wide mt-1 text-center uppercase">Choose Problem Domain</div>

            <div className="grid grid-cols-2 gap-2 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {PERSPECTIVES.map(p => (
                    <button 
                        key={p.key}
                        onClick={() => setSelectedPerspective(p.key)}
                        className={`p-2 rounded border text-left transition-all text-xs ${selectedPerspective === p.key ? 'bg-violet-900/40 border-violet-500 text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:text-gray-200'}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="bg-gray-800 p-4 rounded border border-gray-700 flex-shrink-0">
                <div 
                    onClick={() => setSelectedPerspective('custom')}
                    className={`cursor-pointer transition-colors mb-3 flex justify-between items-center ${selectedPerspective === 'custom' ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-gray-300'}`}
                >
                    <span className="text-xs font-bold uppercase tracking-wider">Custom Domain</span>
                    {selectedPerspective === 'custom' && <span>●</span>}
                </div>
                
                <div className="flex gap-3 mb-2">
                    <input 
                        type="text" 
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        onClick={() => setSelectedPerspective('custom')}
                        placeholder="e.g. Culinary, Military, Sports..."
                        className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 flex-grow"
                    />
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAutoFillCustom(); }}
                        disabled={isAutoFilling || !customName.trim()}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-3 py-2 rounded border border-gray-600 disabled:opacity-50 whitespace-nowrap"
                    >
                        {isAutoFilling ? 'Generating...' : 'Auto-Fill'}
                    </button>
                </div>
                <textarea 
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    onClick={() => setSelectedPerspective('custom')}
                    placeholder="Enter description or use Auto-Fill..."
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 h-16 resize-none"
                />
            </div>

            <div className="pt-4 border-t border-gray-700 flex-shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Apply to Target Node</label>
                <div className="flex gap-3">
                    <select 
                        className="flex-grow bg-gray-800 text-white text-sm rounded p-3 border border-gray-600 focus:border-violet-500 outline-none"
                        value={targetNode}
                        onChange={e => setTargetNode(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                    <button 
                        disabled={!targetNode || isLoading}
                        onClick={handleGenerateClick}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 rounded transition disabled:opacity-50 whitespace-nowrap"
                    >
                        {isLoading ? 'Applying...' : 'Apply Principle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArizPanel: React.FC<{ elements: Element[], onGenerate: (problem: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [problem, setProblem] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                ARIZ (Algorithm for Inventive Problem Solving) is a step-by-step method for complex problems.
                Describe the problem situation below.
            </p>
            <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                placeholder="e.g., The metal needs to be hot to forge but cold to handle..."
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-pink-500 outline-none h-24"
            />
            <button 
                disabled={!problem.trim() || isLoading}
                onClick={() => onGenerate(problem)}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Processing ARIZ...' : 'Run ARIZ Simulation'}
            </button>
        </div>
    );
};

const SufieldPanel: React.FC<{ elements: Element[], onGenerate: (subject: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [subject, setSubject] = useState('');
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Su-Field Analysis models systems as two substances and a field. It identifies missing elements or harmful interactions.
                Select a node or describe a relationship to analyze.
            </p>
             <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g., Corrosion of pipe by water..."
                className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-rose-500 outline-none"
            />
            <button 
                disabled={!subject.trim() || isLoading}
                onClick={() => onGenerate(subject)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Analyzing Model...' : 'Perform Su-Field Analysis'}
            </button>
        </div>
    );
};

const TrendsPanel: React.FC<{ elements: Element[], onGenerate: (node: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [selectedNode, setSelectedNode] = useState('');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Trends of Engineering System Evolution predict how systems develop over time.
                Select a system node to forecast its next evolutionary step.
            </p>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select System Node</label>
                <select 
                    className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-teal-500 outline-none"
                    value={selectedNode}
                    onChange={e => setSelectedNode(e.target.value)}
                >
                    <option value="">-- Select Node --</option>
                    {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
            </div>
            <button 
                disabled={!selectedNode || isLoading}
                onClick={() => onGenerate(selectedNode)}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Forecasting...' : 'Predict Future Evolution'}
            </button>
        </div>
    );
};

const TrizModal: React.FC<TrizModalProps> = ({ 
    isOpen, activeTool, elements, relationships, modelActions, onClose, 
    onLogHistory, onOpenHistory, onAnalyze, initialParams, documents, folders, 
    onUpdateDocument, customPrompt, activeModel, aiConfig, onOpenGuidance, isDarkMode 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [analysisText, setAnalysisText] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSuggestions([]);
            setAnalysisText('');
            setGeneratedDocId(null);
        }
    }, [isOpen]);

    const generatedDoc = useMemo(() => documents.find(d => d.id === generatedDocId), [documents, generatedDocId]);

    const toolInfo = useMemo(() => {
        switch(activeTool) {
            case 'contradiction': return { title: 'Contradiction Matrix', color: 'text-indigo-400', border: 'border-indigo-500' };
            case 'principles': return { title: '40 Principles', color: 'text-violet-400', border: 'border-violet-500' };
            case 'ariz': return { title: 'ARIZ', color: 'text-pink-400', border: 'border-pink-500' };
            case 'sufield': return { title: 'Su-Field Analysis', color: 'text-rose-400', border: 'border-rose-500' };
            case 'trends': return { title: 'Evolution Trends', color: 'text-teal-400', border: 'border-teal-500' };
            default: return { title: 'TRIZ Tool', color: 'text-gray-400', border: 'border-gray-500' };
        }
    }, [activeTool]);

    if (!isOpen) return null;

    const handleGenerate = async (arg1: string, arg2: string = "") => {
        setIsLoading(true);
        setSuggestions([]);
        setAnalysisText('');
        setGeneratedDocId(null);

        try {
            const graphMarkdown = generateMarkdownFromGraph(elements, relationships);
            
            const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['triz'];
            let systemInstruction = `${systemPromptBase}
            GRAPH CONTEXT:
            ${graphMarkdown}`;

            // Build Specific Prompt
            let userPrompt = "";
            let subjectName = "";

            if (activeTool === 'contradiction') {
                subjectName = `${arg1} vs ${arg2}`;
                userPrompt = promptStore.get('triz:contradiction:prompt', { arg1, arg2 });
            } else if (activeTool === 'principles') {
                const data = JSON.parse(arg1); // arg1 is JSON payload from panel
                subjectName = `${data.name} on ${arg2}`;
                userPrompt = promptStore.get('triz:principles:prompt', { 
                    name: data.name,
                    target: arg2,
                    perspective: data.perspective,
                    description: data.description
                });
            } else if (activeTool === 'ariz') {
                subjectName = arg1;
                userPrompt = promptStore.get('triz:ariz:prompt', { arg1 });
            } else if (activeTool === 'sufield') {
                subjectName = arg1;
                userPrompt = promptStore.get('triz:sufield:prompt', { arg1 });
            } else if (activeTool === 'trends') {
                subjectName = arg1;
                userPrompt = promptStore.get('triz:trends:prompt', { arg1 });
            }

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    analysis: { type: Type.STRING },
                    actions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                args: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        sourceName: { type: Type.STRING },
                                        targetName: { type: Type.STRING },
                                        label: { type: Type.STRING },
                                        direction: { type: Type.STRING },
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        notes: { type: Type.STRING },
                                        elementName: { type: Type.STRING },
                                        key: { type: Type.STRING },
                                        value: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            const resultRaw = await callAI(
                aiConfig,
                userPrompt,
                systemInstruction,
                undefined,
                responseSchema
            );

            const result = JSON.parse(resultRaw.text || "{}");
            setAnalysisText(result.analysis);
            
            const actions = (result.actions || []).map((a: any, i: number) => ({ ...a, id: i, status: 'pending' }));
            setSuggestions(actions);

            // Document Creation Logic
            const toolFolderName = "TRIZ";
            const subToolName = toolInfo.title;
            
            // 1. Ensure folders exist
            let toolsFolder = folders.find(f => f.name === "Tools" && !f.parentId);
            if (!toolsFolder) {
                const id = modelActions.createFolder("Tools", null);
                toolsFolder = { id, name: "Tools", parentId: null, createdAt: "" };
            }
            
            let specificFolder = folders.find(f => f.name === toolFolderName && f.parentId === toolsFolder?.id);
            if (!specificFolder && toolsFolder) {
                const id = modelActions.createFolder(toolFolderName, toolsFolder.id);
                specificFolder = { id, name: toolFolderName, parentId: toolsFolder.id, createdAt: "" };
            }

            if (specificFolder) {
                const baseTitle = `${subToolName} - ${subjectName}`;
                let title = baseTitle;
                let counter = 1;
                while (documents.some(d => d.folderId === specificFolder!.id && d.title === title)) {
                    title = `${baseTitle} ${counter}`;
                    counter++;
                }

                const newDocId = modelActions.createDocument(title, result.analysis, 'triz-analysis');
                modelActions.moveDocument(newDocId, specificFolder.id);
                setGeneratedDocId(newDocId);
            }

            // Log to history
            if (onLogHistory) {
                const actionSummary = actions.map((a: any) => {
                    if (a.name === 'addElement') return `- Add Node: ${a.args.name}`;
                    if (a.name === 'addRelationship') return `- Connect: ${a.args.sourceName} -> ${a.args.targetName}`;
                    return `- ${a.name}`;
                }).join('\n');
                onLogHistory(
                    `TRIZ: ${toolInfo.title}`, 
                    `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                    result.analysis.substring(0, 100) + '...',
                    activeTool,
                    { arg1, arg2 }
                );
            }

        } catch (e) {
            console.error("TRIZ Error", e);
            setAnalysisText("Error analyzing model. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyAction = (index: number) => {
        const action = suggestions[index];
        if (!action) return;

        try {
            const { name, args } = action;
            if (name === 'addElement') modelActions.addElement(args);
            else if (name === 'addRelationship') modelActions.addRelationship(args.sourceName, args.targetName, args.label, args.direction);
            else if (name === 'deleteElement') modelActions.deleteElement(args.name);
            else if (name === 'setElementAttribute') modelActions.setElementAttribute(args.elementName, args.key, args.value);
            
            setSuggestions(prev => prev.map((s, i) => i === index ? { ...s, status: 'applied' } : s));
        } catch (e) {
            alert("Failed to apply action. Ensure referenced nodes exist.");
        }
    };

    const handleCopy = () => {
        if (analysisText) {
            navigator.clipboard.writeText(analysisText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleChat = () => {
        if (onAnalyze && analysisText) {
            onAnalyze(analysisText);
            onClose();
        }
    };

    const handleDelete = () => {
        setAnalysisText('');
        setSuggestions([]);
        setGeneratedDocId(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className={`bg-gray-900 rounded-lg w-full max-w-6xl shadow-2xl border ${toolInfo.border} text-white flex flex-col max-h-[90vh]`}>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo.color}`}>
                            TRIZ / <span className="text-white">{toolInfo.title}</span>
                        </h2>
                        {onOpenGuidance && (
                            <button 
                                onClick={onOpenGuidance}
                                className="text-gray-500 hover:text-yellow-400 transition-colors p-1"
                                title="Guidance"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {onOpenHistory && (
                            <button onClick={onOpenHistory} className="text-gray-400 hover:text-white mr-2" title="View History">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex flex-grow overflow-hidden">
                    {/* Left: Controls */}
                    <div className="w-1/3 p-6 border-r border-gray-800 overflow-y-auto bg-gray-800/50">
                        {activeTool === 'contradiction' && <ContradictionPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                        {activeTool === 'principles' && <PrinciplesPanel elements={elements} isLoading={isLoading} onGenerate={(payload, target) => handleGenerate(payload, target)} />}
                        {activeTool === 'ariz' && <ArizPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                        {activeTool === 'sufield' && <SufieldPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                        {activeTool === 'trends' && <TrendsPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                    </div>

                    {/* Right: Results */}
                    <div className="w-2/3 p-6 overflow-y-auto flex flex-col gap-6 bg-gray-900 relative">
                        
                        {/* Results UI ... */}
                        {analysisText && (
                            <div className="absolute top-4 right-6 flex gap-2 z-10">
                                <button onClick={handleCopy} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition" title="Copy">
                                    {isCopied ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                </button>
                                <button onClick={handleChat} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-blue-400 transition" title="Ask AI">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </button>
                                <button onClick={handleDelete} className="p-1.5 rounded bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-400 transition" title="Clear">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}

                        {generatedDoc ? (
                            <div className="flex-grow flex flex-col h-full bg-gray-800 rounded border border-gray-700 overflow-hidden">
                                <DocumentEditorPanel 
                                    document={generatedDoc} 
                                    onUpdate={onUpdateDocument} 
                                    onClose={() => setGeneratedDocId(null)} 
                                    initialViewMode="preview"
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        ) : (
                            <>
                                {analysisText && (
                                    <div className="bg-gray-800 p-4 rounded border border-gray-700 pt-10">
                                        <h3 className="text-lg font-bold text-gray-200 mb-2">Analysis</h3>
                                        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed markdown-content">
                                            {analysisText}
                                        </div>
                                    </div>
                                )}

                                {suggestions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-200 mb-3">Recommended Actions</h3>
                                        <div className="space-y-3">
                                            {suggestions.map((action, idx) => (
                                                <div key={idx} className={`p-3 rounded border flex items-center justify-between ${action.status === 'applied' ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-700'}`}>
                                                    <div className="text-sm">
                                                        <div className="font-mono text-xs text-gray-500 uppercase mb-1">{action.name}</div>
                                                        <div className="text-gray-200 font-medium">
                                                            {action.name === 'addElement' && `Add: ${action.args.name}`}
                                                            {action.name === 'addRelationship' && `Link: ${action.args.sourceName} → ${action.args.targetName}`}
                                                            {action.name === 'deleteElement' && `Delete: ${action.args.name}`}
                                                            {action.name === 'setElementAttribute' && `Set: ${action.args.key} = ${action.args.value} on ${action.args.elementName}`}
                                                            {!['addElement', 'addRelationship', 'deleteElement', 'setElementAttribute'].includes(action.name) && JSON.stringify(action.args)}
                                                        </div>
                                                    </div>
                                                    {action.status === 'pending' ? (
                                                        <button 
                                                            onClick={() => handleApplyAction(idx)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition"
                                                        >
                                                            Apply
                                                        </button>
                                                    ) : (
                                                        <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            Applied
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {!analysisText && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                <p>Select a TRIZ tool to innovate.</p>
                            </div>
                        )}
                        
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-indigo-400 animate-pulse text-sm">Applying Inventive Principles...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrizModal;