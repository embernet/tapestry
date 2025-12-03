
import React, { useState, useEffect, useMemo } from 'react';
import { ScamperSuggestion, Element, Relationship, ModelActions, TapestryDocument, TapestryFolder, RelationshipDirection } from '../types';
import { generateUUID, callAI } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DEFAULT_TOOL_PROMPTS } from '../constants';
import { promptStore } from '../services/PromptStore';

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
  activeModel?: string;
  aiConfig: any;
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
  defaultTags = [],
  activeModel,
  aiConfig
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
                  setOperator({ name: triggerOp.operator, letter: triggerOp.letter });
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
        const customPrompt = DEFAULT_TOOL_PROMPTS[`scamper:${opLetter}`] || DEFAULT_TOOL_PROMPTS['scamper'];
        
        let exclusionText = "";
        if (isAppend && suggestions.length > 0) {
            exclusionText = `Do NOT suggest the following ideas again: ${suggestions.map(s => s.name).join(', ')}.`;
        }

        const prompt = promptStore.get('scamper:generate', {
            basePrompt: customPrompt,
            letter: opLetter,
            operator: opName,
            sourceName: sourceElement.name,
            sourceNotes: sourceElement.notes,
            count: isAppend ? '3-5' : '4-8',
            exclusion: exclusionText
        });
        
        const responseSchema = { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { 
                    name: { type: Type.STRING, description: "The name of the new idea node." }, 
                    description: { type: Type.STRING, description: "Rationale or explanation." }, 
                    relationshipLabel: { type: Type.STRING, description: "Label for the link from original node to this new node." } 
                } 
            } 
        };

        const aiResponse = await callAI(
            aiConfig,
            prompt,
            undefined,
            undefined,
            responseSchema
        );
        
        const results = JSON.parse(aiResponse.text || "[]");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[1000] p-4">
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
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Left: Suggestions List */}
            <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto bg-gray-800/50 flex flex-col gap-4">
                {suggestions.length === 0 && !isLoading && (
                    <div className="text-gray-500 text-sm text-center italic mt-10">
                        Select a node and click a SCAMPER letter in the toolbar to generate ideas.
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-cyan-400 text-sm animate-pulse">Generating Ideas...</span>
                    </div>
                )}

                {suggestions.map((s) => (
                    <div key={s.id} className={`p-3 rounded border border-gray-600 bg-gray-700/50 text-sm ${s.status === 'accepted' ? 'border-green-500/50 bg-green-900/20' : ''} ${s.status === 'rejected' ? 'opacity-50' : ''}`}>
                        <div className="font-bold text-cyan-300 mb-1">{s.name}</div>
                        <div className="text-gray-300 text-xs mb-2">{s.description}</div>
                        <div className="text-gray-500 text-[10px] mb-2 italic">{s.relationshipLabel}</div>
                        
                        {s.status === 'pending' && (
                            <div className="flex justify-end gap-2 mt-2 border-t border-gray-600 pt-2">
                                <button onClick={() => handleReject(s.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1">Reject</button>
                                <button onClick={() => handleAccept(s.id)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow">Accept</button>
                            </div>
                        )}
                        {s.status === 'accepted' && <div className="text-xs text-green-500 font-bold text-right">Accepted</div>}
                        {s.status === 'rejected' && <div className="text-xs text-red-500 font-bold text-right">Rejected</div>}
                    </div>
                ))}

                {suggestions.some(s => s.status === 'pending') && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700 sticky bottom-0 bg-gray-800/90 pb-2">
                        <button onClick={handleAcceptAll} className="flex-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs py-2 rounded border border-green-800">Accept All</button>
                        <button onClick={handleRejectAll} className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs py-2 rounded border border-red-800">Reject All</button>
                    </div>
                )}
                
                {operator && !isLoading && (
                   <div className="mt-2 flex gap-2">
                        <button onClick={handleRegenerate} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded border border-gray-600">Regenerate</button>
                        <button onClick={handleGenerateMore} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded border border-gray-600">Generate More</button>
                   </div>
                )}
            </div>

            {/* Right: Preview */}
            <div className="w-2/3 bg-gray-900 relative flex flex-col">
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">{generateScamperMarkdown()}</pre>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end">
                    <button 
                        onClick={handleSaveToDocuments} 
                        disabled={!operator}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Report to Documents
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScamperModal;
