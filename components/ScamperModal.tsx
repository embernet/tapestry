
import React, { useState, useEffect, useMemo } from 'react';
import { ScamperSuggestion, Element, Relationship, ModelActions, TapestryDocument, TapestryFolder, RelationshipDirection } from '../types';
import { generateUUID } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DEFAULT_TOOL_PROMPTS } from '../constants';

interface ScamperModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Context
  elements: Element[];
  relationships: Relationship[];
  selectedElementId: string | null;
  modelActions: ModelActions;
  
  // Triggering
  triggerOp?: { operator: string, letter: string } | null;
  onClearTrigger?: () => void;

  // Documents
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
  modelName?: string;
  initialDoc?: TapestryDocument | null;

  // History
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  
  // Settings
  defaultTags?: string[];
}

const ScamperModal: React.FC<ScamperModalProps> = ({
  isOpen,
  onClose,
  elements,
  relationships,
  selectedElementId,
  modelActions,
  triggerOp,
  onClearTrigger,
  documents,
  folders,
  onUpdateDocument,
  modelName,
  initialDoc,
  onLogHistory,
  defaultTags = []
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ScamperSuggestion[]>([]);
  const [operator, setOperator] = useState<{ name: string, letter: string } | null>(null);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [sourceNodeName, setSourceNodeName] = useState<string>('');
  
  const [docTitle, setDocTitle] = useState('SCAMPER Analysis');
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  // Initialization Effect
  useEffect(() => {
      if (isOpen) {
          if (initialDoc) {
              // Load from document
              const data = initialDoc.data || {};
              const loadedSuggestions = data.suggestions || [];
              
              // Reconcile with current model
              const reconciled = loadedSuggestions.map((s: ScamperSuggestion) => {
                  if (s.status === 'pending') {
                      // Check if already exists in model
                      const exists = elements.some(e => e.name.toLowerCase() === s.name.toLowerCase());
                      if (exists) {
                          return { 
                              ...s, 
                              status: 'accepted', 
                              actionLog: `Marked as applied: Found "${s.name}" in current model.` 
                          };
                      }
                  }
                  return s;
              });

              setSuggestions(reconciled);
              setOperator(data.operator || null);
              setSourceNodeId(data.sourceNodeId || null);
              setSourceNodeName(data.sourceNodeName || '');
              setDocTitle(initialDoc.title);
              setGeneratedDocId(initialDoc.id);
          } else if (triggerOp) {
              // Trigger new generation
              // Use selectedElementId if available, otherwise try to find by sourceNodeId state if valid
              let sourceEl = elements.find(e => e.id === selectedElementId);
              
              // Safety check: if selectedElementId is missing but we have a trigger, we can't run.
              // However, React state updates might be async.
              if (sourceEl) {
                  setSourceNodeId(sourceEl.id);
                  setSourceNodeName(sourceEl.name);
                  setOperator(triggerOp);
                  setDocTitle(`${sourceEl.name} - SCAMPER ${triggerOp.operator} - ${new Date().toLocaleDateString()}`);
                  setGeneratedDocId(null);
                  handleScamperGenerate(triggerOp.operator, triggerOp.letter, sourceEl);
                  if (onClearTrigger) onClearTrigger();
              }
          } else {
              // No doc, no trigger. 
              // Only reset if we have no existing context, to avoid wiping state when triggerOp is cleared
              if (!operator && !sourceNodeName && !generatedDocId) {
                  setSuggestions([]);
                  setOperator(null);
                  setSourceNodeId(null);
                  setSourceNodeName('');
                  setGeneratedDocId(null);
              }
          }
      }
  }, [isOpen, initialDoc, triggerOp, selectedElementId]);

  const handleScamperGenerate = async (opName: string, opLetter: string, sourceElement: Element, isAppend: boolean = false) => {
      setIsLoading(true);
      if (!isAppend) setSuggestions([]);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const customPrompt = DEFAULT_TOOL_PROMPTS[`scamper:${opLetter}`] || DEFAULT_TOOL_PROMPTS['scamper'];
        
        let exclusionText = "";
        if (isAppend && suggestions.length > 0) {
            exclusionText = `Do NOT suggest the following ideas again: ${suggestions.map(s => s.name).join(', ')}.`;
        }

        const prompt = `${customPrompt}
        
        TASK: Apply the SCAMPER technique '${opLetter} - ${opName}' to the concept: "${sourceElement.name}" (Notes: ${sourceElement.notes}). 
        Generate ${isAppend ? '3-5' : '4-8'} distinct, creative ideas that emerge from applying this operator. 
        ${exclusionText}
        For each idea, provide a name, a short description/rationale, and a short relationship label that connects the original concept to the new idea (e.g. "can be replaced by", "combined with", "adapted to").`;
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: { 
                            name: { type: Type.STRING, description: "The name of the new idea node." }, 
                            description: { type: Type.STRING, description: "Rationale or explanation." }, 
                            relationshipLabel: { type: Type.STRING, description: "Label for the link from original node to this new node." } 
                        } 
                    } 
                } 
            } 
        });
        
        const results = JSON.parse(response.text || "[]");
        const newSuggestions: ScamperSuggestion[] = results.map((r: any) => ({ 
            id: generateUUID(), 
            name: r.name, 
            description: r.description, 
            relationshipLabel: r.relationshipLabel, 
            status: 'pending' 
        }));
        
        setSuggestions(prev => isAppend ? [...prev, ...newSuggestions] : newSuggestions);
        
        if (onLogHistory) {
            onLogHistory(
                'SCAMPER', 
                `Generated ${newSuggestions.length} ideas for '${sourceElement.name}' using operator ${opName}.\n\n` + newSuggestions.map(s => `- **${s.name}** (${s.relationshipLabel}): ${s.description}`).join('\n'), 
                `SCAMPER: ${opName}`, 
                opName, 
                { letter: opLetter, operator: opName, sourceNodeName: sourceElement.name }
            );
        }

      } catch (e) { 
          console.error("SCAMPER generation failed", e); 
          alert("Failed to generate ideas. Please try again."); 
      } finally { 
          setIsLoading(false); 
      }
  };

  const handleAccept = (id: string) => {
      const suggestion = suggestions.find(s => s.id === id);
      const sourceElement = elements.find(e => e.id === sourceNodeId) || elements.find(e => e.name === sourceNodeName);
      
      if (suggestion) {
          const now = new Date();
          const timestamp = now.toLocaleString();

          // Create Node
          const newId = modelActions.addElement({
              name: suggestion.name,
              notes: suggestion.description,
              tags: ['Idea', ...defaultTags]
          });
          
          // Create Relationship if source exists
          if (sourceElement) {
              modelActions.addRelationship(
                  sourceElement.name,
                  suggestion.name,
                  suggestion.relationshipLabel,
                  'TO'
              );
          }

          setSuggestions(prev => prev.map(s => s.id === id ? { 
              ...s, 
              status: 'accepted', 
              actionLog: `Created on ${timestamp}` 
          } : s));
      }
  };

  const handleReject = (id: string) => { 
      const now = new Date();
      const timestamp = now.toLocaleString();
      setSuggestions(prev => prev.map(s => s.id === id ? { 
          ...s, 
          status: 'rejected',
          actionLog: `Rejected on ${timestamp}`
      } : s)); 
  };
  
  const handleAcceptAll = () => { 
      suggestions.forEach(s => { if (s.status === 'pending') handleAccept(s.id); }); 
  };
  
  const handleRejectAll = () => { 
      const now = new Date();
      const timestamp = now.toLocaleString();
      setSuggestions(prev => prev.map(s => s.status === 'pending' ? { 
          ...s, 
          status: 'rejected',
          actionLog: `Rejected on ${timestamp}`
      } : s)); 
  };

  const handleRegenerate = () => {
      if (operator && sourceNodeName) {
          const sourceEl = elements.find(e => e.id === sourceNodeId) || elements.find(e => e.name === sourceNodeName);
          if (sourceEl) {
              handleScamperGenerate(operator.name, operator.letter, sourceEl, false);
          } else {
              alert("Original source node not found in current model. Cannot regenerate.");
          }
      }
  };

  const handleGenerateMore = () => {
      if (operator && sourceNodeName) {
          const sourceEl = elements.find(e => e.id === sourceNodeId) || elements.find(e => e.name === sourceNodeName);
          if (sourceEl) {
              handleScamperGenerate(operator.name, operator.letter, sourceEl, true);
          } else {
              alert("Original source node not found. Cannot generate more.");
          }
      }
  };

  const generateScamperMarkdown = () => {
      if (!operator) return '';
      let md = `# ${docTitle}\n\n`;
      md += `**Technique:** SCAMPER (${operator.letter} - ${operator.name})\n`;
      md += `**Source:** ${sourceNodeName}\n\n`;
      md += `## Ideas Generated\n`;
      suggestions.forEach(s => {
          md += `### ${s.name}\n`;
          md += `* **Status:** ${s.status}\n`;
          md += `* **Relation:** ${s.relationshipLabel}\n`;
          md += `* **Description:** ${s.description}\n`;
          if (s.actionLog) md += `* **Log:** ${s.actionLog}\n`;
          md += '\n';
      });
      return md;
  };

  const handleSaveToDocuments = () => {
      let toolFolder = folders.find(f => f.name === 'SCAMPER');
      let folderId = toolFolder?.id;
      
      if (!toolFolder) {
          folderId = modelActions.createFolder('SCAMPER');
      }

      const content = generateScamperMarkdown();
      const data = {
          suggestions,
          operator,
          sourceNodeId,
          sourceNodeName
      };

      if (generatedDocId) {
          onUpdateDocument(generatedDocId, { 
              title: docTitle, 
              content: content,
              data: data,
              folderId: folderId 
          });
      } else {
          const newId = modelActions.createDocument(docTitle, content, 'scamper-analysis', data);
          modelActions.moveDocument(newId, folderId!);
          setGeneratedDocId(newId);
      }
      alert('Saved to Documents!');
  };

  if (!isOpen) return null;

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl shadow-2xl border border-gray-600 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
            <div className="flex items-center gap-4 flex-grow">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">SCAMPER</span>
                    {operator && (
                        <>
                            <span className="text-gray-500 text-lg">/</span>
                            <span className="text-white">{operator.name}</span>
                        </>
                    )}
                </h2>
                {/* Title Input */}
                <input 
                    type="text" 
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="bg-gray-800 border border-gray-600 hover:border-blue-500 focus:border-blue-500 rounded px-2 py-1 text-sm font-bold text-white outline-none transition-all w-64"
                />
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleSaveToDocuments} 
                    className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded transition shadow-sm flex items-center gap-1"
                    title="Save to Documents"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>
                    Save
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Sub-header Info */}
        <div className="px-6 py-2 bg-gray-800 border-b border-gray-700">
             <p className="text-sm text-gray-400">
                Generating ideas for: <span className="text-blue-400 font-semibold">{sourceNodeName || 'Loading...'}</span>
            </p>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-gray-800">
            {isLoading && suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
                    <p className="text-gray-400 animate-pulse">Brainstorming...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {suggestions.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500 py-10 italic">
                            No ideas generated. Select a node and run SCAMPER from the toolbar.
                        </div>
                    )}
                    {suggestions.map((s) => (
                        <div 
                            key={s.id} 
                            className={`p-4 rounded-lg border flex items-start gap-4 transition-all ${
                                s.status === 'accepted' ? 'bg-green-900/20 border-green-500/50' :
                                s.status === 'rejected' ? 'bg-red-900/10 border-red-500/20 opacity-50' :
                                'bg-gray-700 border-gray-600 hover:border-gray-500'
                            }`}
                        >
                            <div className="flex-grow">
                                <h3 className={`font-bold text-lg ${s.status === 'accepted' ? 'text-green-400' : 'text-white'}`}>
                                    {s.name}
                                </h3>
                                <p className="text-sm text-gray-300 mt-1">{s.description}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="inline-block bg-gray-900 px-2 py-0.5 rounded text-xs text-gray-500 border border-gray-700">
                                        Link: {s.relationshipLabel}
                                    </div>
                                    {s.actionLog && (
                                        <div className="text-[10px] text-gray-500 italic">
                                            {s.actionLog}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {s.status === 'pending' && (
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleAccept(s.id)}
                                        className="p-2 bg-green-600 hover:bg-green-500 text-white rounded shadow-md transition-colors"
                                        title="Add this idea"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => handleReject(s.id)}
                                        className="p-2 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded shadow-md transition-colors"
                                        title="Discard"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            
                            {s.status === 'accepted' && (
                                <div className="flex items-center justify-center w-10 h-full text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && suggestions.length > 0 && (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-900 rounded-b-lg flex justify-between items-center">
            <div className="flex gap-3">
                <button 
                    onClick={handleRegenerate}
                    disabled={isLoading || !operator}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                </button>
                <div className="border-l border-gray-700 h-6"></div>
                <button 
                    onClick={handleGenerateMore}
                    disabled={isLoading || !operator}
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate More
                </button>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={handleRejectAll}
                    disabled={isLoading || pendingCount === 0}
                    className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 text-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Reject Remaining
                </button>
                <button 
                    onClick={handleAcceptAll}
                    disabled={isLoading || pendingCount === 0}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Accept All ({pendingCount})
                </button>
                {pendingCount === 0 && (
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg"
                    >
                        Done
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScamperModal;
