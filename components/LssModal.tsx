
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, LssToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';

interface LssModalProps {
  isOpen: boolean;
  activeTool: LssToolType;
  elements: Element[];
  relationships: Relationship[];
  modelActions: ModelActions;
  onClose: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  onOpenHistory?: () => void;
  onAnalyze?: (context: string) => void;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
  initialParams?: any;
  customPrompt?: string;
}

// ... (Keep Sub Components DmaicPanel, FiveWhysPanel, FishbonePanel, FmeaPanel, VsmPanel identical) ...
// [Re-declaring for context]

const DmaicPanel: React.FC<{ onGenerate: (phase: string) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const PHASES = [
        { id: 'define', label: 'Define', desc: 'Identify critical problems and goals (CTQs).' },
        { id: 'measure', label: 'Measure', desc: 'Collect data and establish baselines.' },
        { id: 'analyze', label: 'Analyze', desc: 'Identify root causes and verify hypotheses.' },
        { id: 'improve', label: 'Improve', desc: 'Develop and implement solutions.' },
        { id: 'control', label: 'Control', desc: 'Sustain gains with monitoring and standards.' }
    ];

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                DMAIC is a data-driven quality strategy used to improve processes.
                Select a phase to have the AI analyze your graph and suggest appropriate actions.
            </p>
            <div className="space-y-3">
                {PHASES.map(phase => (
                    <button 
                        key={phase.id}
                        onClick={() => onGenerate(phase.label)}
                        disabled={isLoading}
                        className="w-full text-left p-3 bg-gray-700 hover:bg-blue-900/30 border border-gray-600 hover:border-blue-500 rounded transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-blue-400 group-hover:text-blue-300">{phase.label}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider group-hover:text-gray-400">Phase</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">{phase.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const FiveWhysPanel: React.FC<{ elements: Element[], onGenerate: (problemNode: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [selectedNode, setSelectedNode] = useState('');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                The 5 Whys technique explores the cause-and-effect relationships underlying a particular problem.
                Select a problem node to trace backwards and generate root causes.
            </p>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Problem Node</label>
                <select 
                    className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-orange-500 outline-none"
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
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {isLoading ? 'Drilling Down...' : 'Run 5 Whys Analysis'}
            </button>
        </div>
    );
};

const FishbonePanel: React.FC<{ onGenerate: (category: string) => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    const CATEGORIES = [
        "Man (People)", "Machine (Equipment)", "Method (Process)", "Material (Components)", "Measurement (Data)", "Mother Nature (Environment)"
    ];

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Ishikawa Diagram categorizes causes into 6Ms. Select a category to brainstorm potential causes missing from your graph.
            </p>
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => onGenerate(cat)}
                        disabled={isLoading}
                        className="p-3 bg-gray-700 hover:bg-emerald-900/30 border border-gray-600 hover:border-emerald-500 rounded transition-all text-xs font-bold text-emerald-400 hover:text-emerald-300 text-left"
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
};

const FmeaPanel: React.FC<{ elements: Element[], onGenerate: (node: string) => void, isLoading: boolean }> = ({ elements, onGenerate, isLoading }) => {
    const [selectedNode, setSelectedNode] = useState('');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Failure Modes and Effects Analysis (FMEA) identifies potential failures. 
                Select a process step or component to analyze its failure modes, RPN, and mitigations.
            </p>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Component/Step</label>
                <select 
                    className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-red-500 outline-none"
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
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Calculating Risks...' : 'Analyze Failure Modes'}
            </button>
        </div>
    );
};

const VsmPanel: React.FC<{ onGenerate: () => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Value Stream Mapping (VSM) analyzes the flow of materials and information.
                The AI will review your entire graph to identify Non-Value-Added (NVA) steps, bottlenecks, and delays.
            </p>
            <button 
                disabled={isLoading}
                onClick={onGenerate}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Mapping Flow...' : 'Analyze Value Stream'}
            </button>
        </div>
    );
};

// --- Main Modal ---

const LssModal: React.FC<LssModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, onAnalyze, documents, folders, onUpdateDocument, initialParams, customPrompt }) => {
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
          case 'dmaic': return { title: 'DMAIC Cycle', color: 'text-blue-400', border: 'border-blue-500' };
          case '5whys': return { title: '5 Whys', color: 'text-orange-400', border: 'border-orange-500' };
          case 'fishbone': return { title: 'Ishikawa Diagram', color: 'text-emerald-400', border: 'border-emerald-500' };
          case 'fmea': return { title: 'FMEA', color: 'text-red-400', border: 'border-red-500' };
          case 'vsm': return { title: 'Value Stream Mapping', color: 'text-violet-400', border: 'border-violet-500' };
          default: return { title: 'LSS Tool', color: 'text-gray-400', border: 'border-gray-500' };
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
          
          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['lss'];
          let systemInstruction = `${systemPromptBase}
          GRAPH CONTEXT:
          ${graphMarkdown}`;

          let userPrompt = "";
          let subjectName = "";

          if (activeTool === 'dmaic') {
              subjectName = contextData;
              userPrompt = `Perform a ${contextData} phase analysis on the graph.
              1. If Define: Identify Customers and CTQs (Critical to Quality).
              2. If Measure: Suggest what data to collect or nodes representing metrics.
              3. If Analyze: Find patterns of waste or variation.
              4. If Improve: Suggest solutions (Injections).
              5. If Control: Suggest monitoring nodes or standard operating procedures (SOPs).`;
          } else if (activeTool === '5whys') {
              subjectName = contextData;
              userPrompt = `Perform a 5 Whys analysis starting from the problem node: "${contextData}".
              1. Iteratively ask "Why?" to find the root cause.
              2. Generate a chain of cause-and-effect nodes.
              3. Suggest a solution node for the root cause.`;
          } else if (activeTool === 'fishbone') {
              subjectName = contextData;
              userPrompt = `Brainstorm potential causes for problems in the graph using the category: "${contextData}".
              1. Look for missing factors in the graph related to this category (e.g., Method, Material).
              2. Suggest adding these potential causes as nodes linked to relevant problem nodes.`;
          } else if (activeTool === 'fmea') {
              subjectName = contextData;
              userPrompt = `Conduct a Failure Modes and Effects Analysis (FMEA) on: "${contextData}".
              1. Identify potential Failure Modes.
              2. Estimate Severity (S), Occurrence (O), and Detection (D) - add these as attributes to new nodes.
              3. Calculate Risk Priority Number (RPN).
              4. Suggest Recommended Actions to lower RPN.`;
          } else if (activeTool === 'vsm') {
              subjectName = "Value Stream";
              userPrompt = `Analyze the Value Stream of the process defined in the graph.
              1. Identify Value-Added (VA) vs Non-Value-Added (NVA) steps.
              2. Highlight bottlenecks or queues.
              3. Suggest removing NVA steps (Waste) or improving flow.
              4. Tag nodes with {Type="VA"} or {Type="NVA"}.`;
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
          const toolFolderName = "Lean Six Sigma";
          const subToolName = toolInfo.title;
          
          // Ensure folders
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
                  `LSS: ${toolInfo.title}`, 
                  `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                  result.analysis.substring(0, 100) + '...',
                  activeTool,
                  contextData
              );
          }

      } catch (e) {
          console.error("LSS Error", e);
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
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo.color}`}>
                Lean Six Sigma / <span className="text-white">{toolInfo.title}</span>
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
                {activeTool === 'dmaic' && <DmaicPanel isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === '5whys' && <FiveWhysPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'fishbone' && <FishbonePanel isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'fmea' && <FmeaPanel elements={elements} isLoading={isLoading} onGenerate={handleGenerate} />}
                {activeTool === 'vsm' && <VsmPanel isLoading={isLoading} onGenerate={() => handleGenerate('Value Stream')} />}
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
                                                    {action.name === 'setElementAttribute' && `Set: ${action.args.key} = ${action.args.value} on ${action.args.elementName}`}
                                                    {!['addElement', 'addRelationship', 'setElementAttribute'].includes(action.name) && JSON.stringify(action.args)}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>Select a Lean Six Sigma tool to analyze your process.</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-blue-400 animate-pulse text-sm">Analyzing Process Data...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LssModal;
