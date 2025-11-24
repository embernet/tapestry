
import React, { useState, useMemo, useEffect } from 'react';
import { Element, Relationship, SsmToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';

interface SsmModalProps {
  isOpen: boolean;
  activeTool: SsmToolType;
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

const RichPicturePanel: React.FC<{ onGenerate: (topic: string) => void, isLoading: boolean, initialParams?: any }> = ({ onGenerate, isLoading, initialParams }) => {
    const [topic, setTopic] = useState(initialParams?.topic || '');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Rich Pictures explore complex, unstructured problems by mapping stakeholders, concerns, and conflicts.
                Describe the situation or messy problem you want to map. The AI will generate nodes representing actors, feelings, and environment.
            </p>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Problem Situation / Context</label>
                <textarea 
                    className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-cyan-500 outline-none h-24"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., Low morale in the engineering team despite high salaries..."
                />
            </div>
            <button 
                disabled={!topic.trim() || isLoading}
                onClick={() => onGenerate(topic)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Sketching Picture...' : 'Generate Rich Picture Elements'}
            </button>
        </div>
    );
};

const CatwoePanel: React.FC<{ onGenerate: () => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                CATWOE (Customers, Actors, Transformation, Weltanschauung, Owners, Environment) defines the root definition of a system.
                The AI will analyze your graph to see if these elements are present and suggest missing perspectives.
            </p>
            <button 
                disabled={isLoading}
                onClick={onGenerate}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Analyzing Worldview...' : 'Run CATWOE Analysis'}
            </button>
        </div>
    );
};

const ActivityModelsPanel: React.FC<{ onGenerate: (definition: string) => void, isLoading: boolean, initialParams?: any }> = ({ onGenerate, isLoading, initialParams }) => {
    const [rootDef, setRootDef] = useState(initialParams?.definition || '');

    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Activity Models define what the system *must do* to be the system defined in the root definition.
                Enter a "Root Definition" (e.g., "A system to do X by Y in order to Z"). The AI will generate the necessary 'Activity' nodes.
            </p>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Root Definition</label>
                <textarea 
                    className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-pink-500 outline-none h-24"
                    value={rootDef}
                    onChange={e => setRootDef(e.target.value)}
                    placeholder="e.g., A system owned by HR to improve staff retention by implementing flexible hours..."
                />
            </div>
            <button 
                disabled={!rootDef.trim() || isLoading}
                onClick={() => onGenerate(rootDef)}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Building Model...' : 'Generate Activity Model'}
            </button>
        </div>
    );
};

const ComparisonPanel: React.FC<{ onGenerate: () => void, isLoading: boolean }> = ({ onGenerate, isLoading }) => {
    return (
        <div className="space-y-4">
            <p className="text-gray-300 text-sm">
                Compare the conceptual models (Activity Models) with the real-world situation (Current Graph).
                The AI will look for gaps: activities that should exist but don't, or real-world constraints blocking the ideal model.
            </p>
            <button 
                disabled={isLoading}
                onClick={onGenerate}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
                {isLoading ? 'Comparing Models...' : 'Compare & Accommodate'}
            </button>
        </div>
    );
};

const SsmModal: React.FC<SsmModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, onAnalyze, initialParams, documents, folders, onUpdateDocument, customPrompt }) => {
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
          case 'rich_picture': return { title: 'Rich Picture', color: 'text-cyan-400', border: 'border-cyan-500' };
          case 'catwoe': return { title: 'CATWOE Analysis', color: 'text-purple-400', border: 'border-purple-500' };
          case 'activity_models': return { title: 'Activity Models', color: 'text-pink-400', border: 'border-pink-500' };
          case 'comparison': return { title: 'Comparison', color: 'text-green-400', border: 'border-green-500' };
          default: return { title: 'SSM Tool', color: 'text-gray-400', border: 'border-gray-500' };
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
          
          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['ssm'];
          
          let userPrompt = "";
          let subjectName = "";

          if (activeTool === 'rich_picture') {
              subjectName = contextData.length > 30 ? contextData.substring(0, 27) + '...' : contextData;
              userPrompt = `Create a 'Rich Picture' of the situation described as: "${contextData}".
              1. Identify Stakeholders, Structures, Processes, Climate, and Conflicts.
              2. Suggest nodes for each of these (use 'Actor', 'Process', 'Issue', 'Feeling' tags).
              3. Connect them to show relationships and conflicts (crossed swords).`;
          } else if (activeTool === 'catwoe') {
              subjectName = "Worldview Analysis";
              userPrompt = `Perform a CATWOE analysis on the current graph.
              1. Identify Customers, Actors, Transformation, Worldview, Owners, Environment.
              2. If any are missing, suggest adding nodes to represent them.
              3. Ensure the Transformation (Input -> T -> Output) is logically connected.`;
          } else if (activeTool === 'activity_models') {
              subjectName = contextData.length > 30 ? contextData.substring(0, 27) + '...' : contextData;
              userPrompt = `Based on the Root Definition: "${contextData}", build a Conceptual Activity Model.
              1. What activities *must* exist to satisfy this definition?
              2. Add these as 'Activity' nodes.
              3. Link them in a logical dependency order (A enables B).
              4. Add 'Monitor' and 'Control' activities.`;
          } else if (activeTool === 'comparison') {
              subjectName = "Comparison";
              userPrompt = `Compare the current graph (Real World) with a theoretical ideal Activity Model.
              1. Identify gaps: What necessary activities are missing from the real world graph?
              2. Identify constraints: What real-world nodes are blocking the ideal flow?
              3. Suggest 'Accommodation' nodes to bridge the gap.`;
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: userPrompt,
              config: {
                  systemInstruction: `${systemPromptBase}\nGRAPH CONTEXT:\n${graphMarkdown}`,
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
          const toolFolderName = "Soft Systems Methodology";
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

          if (onLogHistory) {
              const actionSummary = actions.map((a: any) => {
                  if (a.name === 'addElement') return `- Add Node: ${a.args.name}`;
                  if (a.name === 'addRelationship') return `- Connect: ${a.args.sourceName} -> ${a.args.targetName}`;
                  return `- ${a.name}`;
              }).join('\n');
              onLogHistory(
                  `SSM: ${toolInfo.title}`, 
                  `${result.analysis}\n\n### Proposed Actions:\n${actionSummary}`, 
                  result.analysis.substring(0, 100) + '...',
                  activeTool,
                  contextData
              );
          }

      } catch (e) {
          console.error("SSM Error", e);
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
                SSM / <span className="text-white">{toolInfo.title}</span>
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
                {activeTool === 'rich_picture' && <RichPicturePanel isLoading={isLoading} onGenerate={handleGenerate} initialParams={initialParams} />}
                {activeTool === 'catwoe' && <CatwoePanel isLoading={isLoading} onGenerate={() => handleGenerate('CATWOE')} />}
                {activeTool === 'activity_models' && <ActivityModelsPanel isLoading={isLoading} onGenerate={handleGenerate} initialParams={initialParams} />}
                {activeTool === 'comparison' && <ComparisonPanel isLoading={isLoading} onGenerate={() => handleGenerate('Comparison')} />}
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
                        <p>Select an SSM tool to explore complex problems.</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-cyan-400 animate-pulse text-sm">Analyzing Soft Systems...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SsmModal;
