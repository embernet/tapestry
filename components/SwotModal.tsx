import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, SwotToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';

interface SwotModalProps {
  isOpen: boolean;
  activeTool: SwotToolType;
  elements: Element[];
  relationships: Relationship[];
  modelActions: ModelActions;
  onClose: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string) => void;
  onOpenHistory?: () => void;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
}

const SwotModal: React.FC<SwotModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, documents, folders, onUpdateDocument }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
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
      switch (activeTool) {
          case 'matrix': return { title: 'SWOT Matrix', color: 'text-lime-400', border: 'border-lime-500', desc: 'Analyze internal Strengths & Weaknesses and external Opportunities & Threats.' };
          case 'pestel': return { title: 'PESTEL Analysis', color: 'text-sky-400', border: 'border-sky-500', desc: 'Analyze Political, Economic, Social, Technological, Environmental, and Legal factors.' };
          case 'steer': return { title: 'STEER Analysis', color: 'text-amber-400', border: 'border-amber-500', desc: 'Analyze Socio-cultural, Technological, Economic, Ecological, and Regulatory factors.' };
          case 'destep': return { title: 'DESTEP Analysis', color: 'text-purple-400', border: 'border-purple-500', desc: 'Analyze Demographic, Economic, Socio-cultural, Technological, Ecological, and Political factors.' };
          case 'longpest': return { title: 'LoNGPEST Analysis', color: 'text-teal-400', border: 'border-teal-500', desc: 'Analyze PEST factors across Local, National, and Global scales.' };
          case 'five_forces': return { title: 'Porter’s Five Forces', color: 'text-red-400', border: 'border-red-500', desc: 'Analyze competitive intensity: Rivalry, New Entrants, Suppliers, Buyers, and Substitutes.' };
          case 'cage': return { title: 'CAGE Distance', color: 'text-orange-400', border: 'border-orange-500', desc: 'Analyze Cultural, Administrative, Geographic, and Economic distances between markets.' };
          default: return { title: 'Strategic Analysis', color: 'text-gray-400', border: 'border-gray-500', desc: 'Select a framework.' };
      }
  }, [activeTool]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
      if (!selectedNode) return;
      setIsLoading(true);
      setSuggestions([]);
      setAnalysisText('');
      setGeneratedDocId(null);

      try {
          const graphMarkdown = generateMarkdownFromGraph(elements, relationships);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const systemInstruction = `You are a Strategic Analyst. Analyze the provided graph model using the ${toolInfo.title} framework.
          GRAPH CONTEXT:
          ${graphMarkdown}
          
          OUTPUT FORMAT:
          Return a JSON object with two fields:
          1. "analysis": A detailed MARKDOWN string explaining your findings, organized by the categories of the framework.
          2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.
          `;

          let userPrompt = "";

          if (activeTool === 'matrix') {
              userPrompt = `Perform a SWOT analysis on the node: "${selectedNode}".
              1. Identify internal Strengths (attributes, positive links) and Weaknesses (gaps, negative links).
              2. Identify external Opportunities (potential connections, growth areas) and Threats (risks, competitors).
              3. For each key point identified, suggest creating a new node (tagged 'Strength', 'Weakness', etc.) and linking it to "${selectedNode}".
              4. Provide a rationale for each action.`;
          } else if (activeTool === 'pestel') {
              userPrompt = `Perform a PESTEL analysis for the subject: "${selectedNode}".
              1. Analyze Political, Economic, Social, Technological, Environmental, and Legal factors affecting "${selectedNode}".
              2. Suggest creating new nodes for significant external factors found (e.g., "New Regulation", "Economic Downturn").
              3. Link these factors to "${selectedNode}" with labels like "impacts", "regulates", "constrains", "enables".`;
          } else if (activeTool === 'steer') {
              userPrompt = `Perform a STEER analysis for: "${selectedNode}".
              1. Analyze Socio-cultural, Technological, Economic, Ecological, and Regulatory factors.
              2. Suggest nodes for key external drivers.
              3. Link them to "${selectedNode}" to show their influence.`;
          } else if (activeTool === 'destep') {
              userPrompt = `Perform a DESTEP analysis for: "${selectedNode}".
              1. Analyze Demographic, Economic, Socio-cultural, Technological, Ecological, and Political factors.
              2. Suggest nodes for these macro-environmental factors.
              3. Connect them to "${selectedNode}".`;
          } else if (activeTool === 'longpest') {
              userPrompt = `Perform a LoNGPEST analysis for: "${selectedNode}".
              1. Analyze PEST factors at Local, National, and Global levels.
              2. Differentiate scale in your analysis.
              3. Suggest nodes representing these factors, using attributes like {Scale="Global"} or tags like "Global Factor".`;
          } else if (activeTool === 'five_forces') {
              userPrompt = `Analyze Porter's Five Forces for the industry/entity: "${selectedNode}".
              1. Identify Threat of New Entrants, Bargaining Power of Suppliers, Bargaining Power of Buyers, Threat of Substitutes, and Rivalry among Existing Competitors.
              2. Suggest adding specific nodes for Competitors, Suppliers, Buyers, or Substitutes if missing.
              3. Link them to "${selectedNode}" (e.g., "Supplier -> supplies -> ${selectedNode}", "${selectedNode} -> competes with -> Competitor").`;
          } else if (activeTool === 'cage') {
              userPrompt = `Perform a CAGE Distance Framework analysis for: "${selectedNode}" (context: international/cross-border expansion).
              1. Analyze Cultural, Administrative, Geographic, and Economic distances.
              2. Identify barriers or differences.
              3. Suggest nodes representing specific distances or barriers (e.g., "Language Barrier", "Different Currency").`;
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
          const toolFolderName = "Strategic Analysis";
          const subToolName = toolInfo.title;
          const subjectName = selectedNode;
          
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

          if (onLogHistory) {
              const actionSummary = actions.map((a: any) => {
                  if (a.name === 'addElement') return `- Add Node: ${a.args.name}`;
                  if (a.name === 'addRelationship') return `- Connect: ${a.args.sourceName} -> ${a.args.targetName}`;
                  return `- ${a.name}`;
              }).join('\n');
              onLogHistory(
                  `${toolInfo.title}`, 
                  `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                  result.analysis.substring(0, 100) + '...',
              );
          }

      } catch (e) {
          console.error("Strategy Tool Error", e);
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
                Strategy / <span className="text-white">{toolInfo.title}</span>
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
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        {toolInfo.desc}
                    </p>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject Node</label>
                        <select 
                            className={`w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:${toolInfo.border.replace('border-', 'border-')} outline-none`}
                            value={selectedNode}
                            onChange={e => setSelectedNode(e.target.value)}
                        >
                            <option value="">-- Select Node --</option>
                            {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                    </div>
                    <button 
                        disabled={!selectedNode || isLoading}
                        onClick={handleGenerate}
                        className={`w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded transition disabled:opacity-50 flex justify-center items-center gap-2 border border-gray-500 hover:border-gray-400`}
                    >
                        {isLoading ? 'Analyzing...' : `Run ${toolInfo.title}`}
                    </button>
                </div>
            </div>

            {/* Right: Results */}
            <div className="w-2/3 p-6 overflow-y-auto flex flex-col gap-6 bg-gray-900 relative">
                {analysisText && (
                    <div className="absolute top-4 right-6 flex gap-2 z-10">
                        <button onClick={handleCopy} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition" title="Copy">
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
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
                                <h3 className="text-lg font-bold text-gray-200 mb-2">Strategic Findings</h3>
                                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed markdown-content">
                                    {analysisText}
                                </div>
                            </div>
                        )}

                        {suggestions.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-200 mb-3">Proposed Graph Updates</h3>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>Select a strategy tool to analyze your model.</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className={`w-10 h-10 border-4 ${toolInfo.border.replace('border', 'border-t-transparent')} rounded-full animate-spin mb-4`}></div>
                        <p className={`${toolInfo.color} animate-pulse text-sm`}>Analyzing Strategy...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SwotModal;