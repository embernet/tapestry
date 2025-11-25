
import React, { useState, useEffect } from 'react';
import { ScamperSuggestion, Element, Relationship, ModelActions, TapestryDocument, TapestryFolder, AIConfig } from '../types';
import { generateUUID } from '../utils';
import { Type } from '@google/genai';
import { DEFAULT_TOOL_PROMPTS } from '../constants';
import { generateContent } from '../aiService';
import { DocumentEditorPanel } from './DocumentPanel';

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
  aiConfig: AIConfig;
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
              let sourceEl = elements.find(e => e.id === selectedElementId);
              
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

        const prompt = `${customPrompt}
        
        TASK: Apply the SCAMPER technique '${opLetter} - ${opName}' to the concept: "${sourceElement.name}" (Notes: ${sourceElement.notes}). 
        Generate ${isAppend ? '3-5' : '4-8'} distinct, creative ideas that emerge from applying this operator. 
        ${exclusionText}
        For each idea, provide a name, a short description/rationale, and a short relationship label that connects the original concept to the new idea (e.g. "can be replaced by", "combined with", "adapted to").`;
        
        const response = await generateContent(aiConfig, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      
      // Store data for rehydration
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

  const generatedDoc = documents.find(d => d.id === generatedDocId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl shadow-2xl border border-cyan-500 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-cyan-400">SCAMPER</h2>
                {operator && <span className="text-xl text-gray-400">/ {operator.name}</span>}
                {sourceNodeName && <span className="text-sm bg-gray-700 px-2 py-1 rounded text-gray-300">Source: {sourceNodeName}</span>}
            </div>
            <div className="flex items-center gap-2">
                {suggestions.length > 0 && !generatedDoc && (
                    <button onClick={handleSaveToDocuments} className="text-xs bg-cyan-700 hover:bg-cyan-600 px-3 py-1 rounded text-white font-bold transition">
                        Save to Docs
                    </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 bg-gray-900 relative">
            {generatedDoc ? (
                <DocumentEditorPanel 
                    document={generatedDoc} 
                    onUpdate={onUpdateDocument} 
                    onClose={() => setGeneratedDocId(null)} 
                    initialViewMode="preview"
                />
            ) : (
                <>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-cyan-400 animate-pulse">Generating Ideas...</p>
                        </div>
                    )}

                    {!isLoading && suggestions.length === 0 && (
                        <div className="text-center text-gray-500 py-10">
                            No ideas generated yet. Select a node and a SCAMPER operator to begin.
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div className="space-y-4">
                            {/* Bulk Actions */}
                            <div className="flex justify-end gap-2 mb-4">
                                <button onClick={handleAcceptAll} className="text-xs text-green-400 hover:text-green-300">Accept All Pending</button>
                                <button onClick={handleRejectAll} className="text-xs text-red-400 hover:text-red-300">Reject All Pending</button>
                            </div>

                            {suggestions.map((suggestion) => (
                                <div key={suggestion.id} className={`p-4 rounded border flex flex-col gap-2 ${suggestion.status === 'accepted' ? 'bg-green-900/20 border-green-600' : suggestion.status === 'rejected' ? 'bg-red-900/10 border-red-900 opacity-60' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{suggestion.name}</h3>
                                            <div className="text-xs text-cyan-400 mb-1">{suggestion.relationshipLabel}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {suggestion.status === 'pending' ? (
                                                <>
                                                    <button onClick={() => handleAccept(suggestion.id)} className="p-1 hover:bg-green-900 rounded text-green-400" title="Accept">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                    <button onClick={() => handleReject(suggestion.id)} className="p-1 hover:bg-red-900 rounded text-red-400" title="Reject">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${suggestion.status === 'accepted' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                    {suggestion.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300">{suggestion.description}</p>
                                    {suggestion.actionLog && <div className="text-[10px] text-gray-500 mt-1">{suggestion.actionLog}</div>}
                                </div>
                            ))}

                            <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-800">
                                <button onClick={handleRegenerate} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">Regenerate</button>
                                <button onClick={handleGenerateMore} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white text-sm font-bold">Generate More</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ScamperModal;
