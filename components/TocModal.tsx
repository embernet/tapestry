
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, TocToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';

interface TocModalProps {
  isOpen: boolean;
  activeTool: TocToolType;
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
}

// ... (Keep Sub Components CrtPanel, EcPanel, FrtPanel, TtPanel identical) ...
// [Re-declaring for context]

const CrtPanel: React.FC<{ onGenerate: () => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                The Current Reality Tree (CRT) identifies root causes of Undesirable Effects (UDEs).
                The AI will scan your graph for harmful loops, contradictions, and negative clusters to find the core constraint.
            </p>
            <button 
                disabled={isLoading}
                onClick={onGenerate}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Analyzing Reality...' : 'Identify Core Constraints'}
            </button>
        </div>
    );
};

const EcPanel: React.FC<{ elements: Element[], onGenerate: (n1: string, n2: string) => void, isLoading: boolean, initialParams?: any }> = ({ elements, onGenerate, isLoading, initialParams }) => {
    const [node1, setNode1] = useState(initialParams?.n1 || '');
    const [node2, setNode2] = useState(initialParams?.n2 || '');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                The Evaporating Cloud (EC) resolves conflicts. Select two nodes representing conflicting requirements or mutually exclusive conditions.
                The AI will map the underlying assumptions and suggest ways to "evaporate" the conflict.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Requirement A</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"
                        value={node1}
                        onChange={e => setNode1(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Requirement B</label>
                    <select 
                        className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-blue-500 outline-none"
                        value={node2}
                        onChange={e => setNode2(e.target.value)}
                    >
                        <option value="">-- Select Node --</option>
                        {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
            </div>
            <button 
                disabled={!node1 || !node2 || isLoading}
                onClick={() => onGenerate(node1, node2)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Evaporating Conflict...' : 'Build Cloud & Challenge Assumptions'}
            </button>
        </div>
    );
};

const FrtPanel: React.FC<{ elements: Element[], onGenerate: (target: string) => void, isLoading: boolean, initialParams?: any }> = ({ elements, onGenerate, isLoading, initialParams }) => {
    const [targetNode, setTargetNode] = useState(initialParams?.target || '');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                The Future Reality Tree (FRT) visualizes the future state after an intervention.
                Select a target node (Desirable Effect or Goal). The AI will suggest "Injections" (solutions) and map their positive downstream effects.
            </p>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Goal / Node</label>
                <select 
                    className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-emerald-500 outline-none"
                    value={targetNode}
                    onChange={e => setTargetNode(e.target.value)}
                >
                    <option value="">-- Select Node --</option>
                    {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
            </div>
            <button 
                disabled={!targetNode || isLoading}
                onClick={() => onGenerate(targetNode)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Simulating Future...' : 'Generate Injections & Preview'}
            </button>
        </div>
    );
};

const TtPanel: React.FC<{ onGenerate: () => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                The Transition Tree (TT) maps the implementation plan.
                The AI will review your graph for proposed "Injections" or solution nodes and generate a step-by-step action plan (Transition Tree) to achieve them.
            </p>
            <button 
                disabled={isLoading}
                onClick={onGenerate}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Planning Transition...' : 'Generate Transition Plan'}
            </button>
        </div>
    );
};

// --- Main Modal ---

const TocModal: React.FC<TocModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, onAnalyze, initialParams, documents, folders, onUpdateDocument, customPrompt }) => {
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
          case 'crt': return { title: 'Current Reality Tree', color: 'text-amber-400', border: 'border-amber-500' };
          case 'ec': return { title: 'Evaporating Cloud', color: 'text-blue-400', border: 'border-blue-500' };
          case 'frt': return { title: 'Future Reality Tree', color: 'text-emerald-400', border: 'border-emerald-500' };
          case 'tt': return { title: 'Transition Tree', color: 'text-violet-400', border: 'border-violet-500' };
          default: return { title: 'TOC Tool', color: 'text-gray-400', border: 'border-gray-500' };
      }
  }, [activeTool]);

  if (!isOpen) return null;

  const handleGenerate = async (contextData: any) => {
      setIsLoading(true);
      setSuggestions([]);
      setAnalysisText('');
      setGeneratedDocId(null);

      try {
          const graphMarkdown = generateMarkdownFromGraph(elements, relationships);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['toc'];
          let systemInstruction = `${systemPromptBase}
          GRAPH CONTEXT:
          ${graphMarkdown}`;

          let userPrompt = "";
          let subjectName = "";

          if (activeTool === 'crt') {
              subjectName = "Current Reality";
              userPrompt = `Construct a Current Reality Tree logic on this graph.
              1. Identify Undesirable Effects (UDEs) - nodes tagged 'Harmful' or 'Problem'.
              2. Trace back to a Core Driver or Constraint.
              3. Suggest adding missing causal links or intermediate effects to complete the logic.
              4. Tag the constraint node with {Constraint="true"}.`;
          } else if (activeTool === 'ec') {
              subjectName = `${contextData.n1} vs ${contextData.n2}`;
              userPrompt = `Build an Evaporating Cloud to resolve conflict between "${contextData.n1}" and "${contextData.n2}".
              1. Identify the common objective.
              2. Identify the requirements for each side.
              3. Surface assumptions underlying the conflict arrows.
              4. Suggest 'Injection' nodes that invalidate an assumption (evaporate the cloud).`;
          } else if (activeTool === 'frt') {
              subjectName = contextData;
              userPrompt = `Build a Future Reality Tree targeting the goal node: "${contextData}".
              1. Propose specific 'Injection' nodes (new actions/ideas) to achieve this goal.
              2. Map the causal logic from Injection to Desirable Effects.
              3. Check for Negative Branches (potential new problems) and suggest preventative nodes.`;
          } else if (activeTool === 'tt') {
              subjectName = "Transition Plan";
              userPrompt = `Create a Transition Tree (Implementation Plan).
              1. Look for 'Idea' or 'Action' nodes that are not fully connected or implemented.
              2. Break down the steps to achieve them.
              3. Add 'Step' nodes and link them logically (Conditions -> Actions -> Outcomes).`;
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: userPrompt,
              config: {
                  systemInstruction,
                  responseMimeType: "application/json",
                  responseSchema: {
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
                  }
              }
          });

          const result = JSON.parse(response.text || "{}");
          setAnalysisText(result.analysis);
          
          const actions = (result.actions || []).map((a: any, i: number) => ({ ...a, id: i, status: 'pending' }));
          setSuggestions(actions);

          // Document Creation Logic
          const toolFolderName = "Theory of Constraints";
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

              const newDocId = modelActions.createDocument(title, result.analysis);
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
                  `TOC: ${toolInfo.title}`, 
                  `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                  result.analysis.substring(0, 100) + '...',
                  activeTool,
                  contextData
              );
          }

      } catch (e) {
          console.error("TOC Error", e);
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
      <div className={`bg-gray-900 rounded-lg w-full max-w-4xl shadow-2xl border ${toolInfo.border} text-white flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo.color}`}>
                TOC / <span className="text-white">{toolInfo.title}</span>
            </h2>
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
                {activeTool === 'crt' && <CrtPanel isLoading={isLoading} onGenerate={() => handleGenerate('Current Reality')} />}
                {activeTool === 'ec' && <EcPanel elements={elements} isLoading={isLoading} onGenerate={(n1, n2) => handleGenerate({ n1, n2 })} initialParams={initialParams} />}
                {activeTool === 'frt' && <FrtPanel elements={elements} isLoading={isLoading} onGenerate={(target) => handleGenerate(target)} initialParams={initialParams} />}
                {activeTool === 'tt' && <TtPanel isLoading={isLoading} onGenerate={() => handleGenerate('Transition Plan')} />}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p>Select a TOC tool to optimize your system constraints.</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-amber-400 animate-pulse text-sm">Identifying Bottlenecks...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TocModal;
