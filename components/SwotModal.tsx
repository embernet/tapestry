
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, SwotToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph, generateUUID } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';

interface SwotModalProps {
  isOpen: boolean;
  activeTool: SwotToolType;
  elements: Element[];
  relationships: Relationship[];
  modelActions: ModelActions;
  onClose: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  onOpenHistory?: () => void;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
  modelName?: string;
  initialDoc?: TapestryDocument | null;
  customPrompt?: string;
  activeModel?: string;
}

interface MatrixEntry {
    id: string;
    text: string;
    selected: boolean;
}

interface MatrixCategoryDef {
    id: string;
    label: string;
    tag: string; // The tag to apply to the graph node
    color: string; // Text color class
    borderColor: string; // Border color class
}

interface MatrixConfig {
    title: string;
    description: string;
    basePrompt: string;
    gridCols: string; // Tailwind class e.g., 'grid-cols-2'
    categories: MatrixCategoryDef[];
}

// --- Configurations ---

const MATRIX_CONFIGS: Record<string, MatrixConfig> = {
    matrix: {
        title: "SWOT Matrix",
        description: "Analyze internal Strengths & Weaknesses and external Opportunities & Threats.",
        basePrompt: "Perform a SWOT Analysis. Identify internal Strengths and Weaknesses, and external Opportunities and Threats.",
        gridCols: "grid-cols-2",
        categories: [
            { id: 'strengths', label: 'Strengths', tag: 'Strength', color: 'text-green-400', borderColor: 'border-green-500' },
            { id: 'weaknesses', label: 'Weaknesses', tag: 'Weakness', color: 'text-red-400', borderColor: 'border-red-500' },
            { id: 'opportunities', label: 'Opportunities', tag: 'Opportunity', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'threats', label: 'Threats', tag: 'Threat', color: 'text-orange-400', borderColor: 'border-orange-500' }
        ]
    },
    five_forces: {
        title: "Porter's Five Forces",
        description: "Analyze competitive intensity and market attractiveness.",
        basePrompt: "Analyze Porter's Five Forces. Identify specific factors for each force based on the graph context.",
        gridCols: "grid-cols-3",
        categories: [
            { id: 'rivalry', label: 'Competitive Rivalry', tag: 'Competitor', color: 'text-red-400', borderColor: 'border-red-500' },
            { id: 'new_entrants', label: 'Threat of New Entrants', tag: 'Entrant', color: 'text-orange-400', borderColor: 'border-orange-500' },
            { id: 'substitutes', label: 'Threat of Substitutes', tag: 'Substitute', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
            { id: 'supplier_power', label: 'Supplier Power', tag: 'Supplier', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'buyer_power', label: 'Buyer Power', tag: 'Buyer', color: 'text-green-400', borderColor: 'border-green-500' }
        ]
    }
};

// Fallback info for tools that don't have a matrix config (Legacy/Text-only mode)
const LEGACY_TOOL_INFO = {
    pestel: { title: 'PESTEL Analysis', color: 'text-sky-400', border: 'border-sky-500', desc: 'Analyze Political, Economic, Social, Technological, Environmental, and Legal factors.' },
    steer: { title: 'STEER Analysis', color: 'text-amber-400', border: 'border-amber-500', desc: 'Analyze Socio-cultural, Technological, Economic, Ecological, and Regulatory factors.' },
    destep: { title: 'DESTEP Analysis', color: 'text-purple-400', border: 'border-purple-500', desc: 'Analyze Demographic, Economic, Socio-cultural, Technological, Ecological, and Political factors.' },
    longpest: { title: 'LoNGPEST Analysis', color: 'text-teal-400', border: 'border-teal-500', desc: 'Analyze PEST factors across Local, National, and Global scales.' },
    cage: { title: 'CAGE Distance', color: 'text-orange-400', border: 'border-orange-500', desc: 'Analyze Cultural, Administrative, Geographic, and Economic distances between markets.' },
};

const SwotModal: React.FC<SwotModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, documents, folders, onUpdateDocument, modelName, initialDoc, customPrompt, activeModel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  // --- Generic Matrix State ---
  const [matrixData, setMatrixData] = useState<Record<string, MatrixEntry[]>>({});
  
  const [docTitle, setDocTitle] = useState('Analysis');
  const [promptGuidance, setPromptGuidance] = useState('');
  const [analysisScope, setAnalysisScope] = useState<'model' | 'selection'>('model');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [entryHeight, setEntryHeight] = useState<number>(1);
  
  // Guidance Drafts Ref to store text per tool
  const guidanceDrafts = useRef<Record<string, string>>({});
  
  // Draggable & Resizable Window State
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 1200, height: 800 });
  
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartDim = useRef({ width: 0, height: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });
  
  // Refs for drag and drop of items
  const dragItem = useRef<{ categoryId: string, index: number } | null>(null);
  const dragOverItem = useRef<{ categoryId: string, index: number } | null>(null);

  // Identify current config
  const activeConfig = MATRIX_CONFIGS[activeTool];
  const isLegacyTool = !activeConfig;

  useEffect(() => {
      if (isOpen) {
          if (initialDoc) {
              // Load from document
              setMatrixData(initialDoc.data || {});
              setDocTitle(initialDoc.title);
              setGeneratedDocId(initialDoc.id);
              setPromptGuidance(''); // Reset guidance when loading a doc
          } else if (activeConfig) {
              // Initialize empty matrix based on config
              const initialData: Record<string, MatrixEntry[]> = {};
              activeConfig.categories.forEach(cat => {
                  initialData[cat.id] = [];
              });
              setMatrixData(initialData);
              
              const dateStr = new Date().toLocaleDateString();
              setDocTitle(`${modelName || 'Model'} - ${activeConfig.title} - ${dateStr}`);
              setGeneratedDocId(null);
              
              // Load draft guidance for this specific tool
              setPromptGuidance(guidanceDrafts.current[activeTool] || '');
          }
          setSuggestions([]);
          setAnalysisText('');
      } else {
          setGeneratedDocId(null);
      }
  }, [isOpen, initialDoc, modelName, activeTool, activeConfig]);

  const generatedDoc = useMemo(() => documents.find(d => d.id === generatedDocId), [documents, generatedDocId]);

  // --- Window Drag Handlers ---
  const handleWindowDragStart = (e: React.MouseEvent) => {
      setIsDraggingWindow(true);
      dragStartPos.current = { 
          x: e.clientX - position.x, 
          y: e.clientY - position.y 
      };
  };

  useEffect(() => {
      const handleWindowDragMove = (e: MouseEvent) => {
          if (isDraggingWindow) {
              setPosition({
                  x: e.clientX - dragStartPos.current.x,
                  y: e.clientY - dragStartPos.current.y
              });
          }
      };
      const handleWindowDragEnd = () => {
          setIsDraggingWindow(false);
      };

      if (isDraggingWindow) {
          document.addEventListener('mousemove', handleWindowDragMove);
          document.addEventListener('mouseup', handleWindowDragEnd);
      }
      return () => {
          document.removeEventListener('mousemove', handleWindowDragMove);
          document.removeEventListener('mouseup', handleWindowDragEnd);
      };
  }, [isDraggingWindow]);

  // --- Resize Handlers ---
  const handleResizeStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      resizeStartDim.current = { width: size.width, height: size.height };
      resizeStartMouse.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
      const handleResizeMove = (e: MouseEvent) => {
          if (isResizing) {
              const dx = e.clientX - resizeStartMouse.current.x;
              const dy = e.clientY - resizeStartMouse.current.y;
              setSize({
                  width: Math.max(600, resizeStartDim.current.width + dx), // Minimum width
                  height: Math.max(400, resizeStartDim.current.height + dy) // Minimum height
              });
          }
      };
      const handleResizeEnd = () => {
          setIsResizing(false);
      };

      if (isResizing) {
          document.addEventListener('mousemove', handleResizeMove);
          document.addEventListener('mouseup', handleResizeEnd);
      }
      return () => {
          document.removeEventListener('mousemove', handleResizeMove);
          document.removeEventListener('mouseup', handleResizeEnd);
      };
  }, [isResizing]);


  // --- Matrix Logic ---

  const addEntry = (categoryId: string) => {
      const newEntry: MatrixEntry = { id: generateUUID(), text: '', selected: false };
      setMatrixData(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), newEntry]
      }));
  };

  const updateEntry = (categoryId: string, id: string, text: string) => {
      setMatrixData(prev => ({
          ...prev,
          [categoryId]: prev[categoryId].map(e => e.id === id ? { ...e, text } : e)
      }));
  };

  const toggleSelectEntry = (categoryId: string, id: string) => {
      setMatrixData(prev => ({
          ...prev,
          [categoryId]: prev[categoryId].map(e => e.id === id ? { ...e, selected: !e.selected } : e)
      }));
  };

  const deleteEntry = (categoryId: string, id: string) => {
      setMatrixData(prev => ({
          ...prev,
          [categoryId]: prev[categoryId].filter(e => e.id !== id)
      }));
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, categoryId: string, index: number, id: string) => {
      e.stopPropagation(); // Stop propagation to prevent window drag interference
      dragItem.current = { categoryId, index };
      setDraggingId(id);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: React.DragEvent, categoryId: string, index: number) => {
      e.stopPropagation();
      dragOverItem.current = { categoryId, index };
  };

  const onDragEnd = () => {
      if (dragItem.current && dragOverItem.current) {
          const sourceCat = dragItem.current.categoryId;
          const destCat = dragOverItem.current.categoryId;
          
          const sourceList = [...(matrixData[sourceCat] || [])];
          const destList = sourceCat === destCat ? sourceList : [...(matrixData[destCat] || [])];
          
          const item = sourceList[dragItem.current.index];
          
          if (sourceCat === destCat) {
              sourceList.splice(dragItem.current.index, 1);
              sourceList.splice(dragOverItem.current.index, 0, item);
              setMatrixData(prev => ({ ...prev, [sourceCat]: sourceList }));
          } else {
              sourceList.splice(dragItem.current.index, 1);
              destList.splice(dragOverItem.current.index, 0, item);
              setMatrixData(prev => ({ ...prev, [sourceCat]: sourceList, [destCat]: destList }));
          }
      }
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggingId(null);
  };

  const generateMatrixMarkdown = (data: Record<string, MatrixEntry[]>, onlySelected: boolean = false) => {
      let md = `# ${docTitle}\n\n`;
      
      activeConfig.categories.forEach(cat => {
          const items = (data[cat.id] || []).filter(e => !onlySelected || e.selected);
          
          if (items.length > 0 || !onlySelected) {
             md += `## ${cat.label}\n`;
             if (items.length > 0) {
                 md += `${items.map(e => `- ${e.text}`).join('\n')}\n\n`;
             } else {
                 md += `(None)\n\n`;
             }
          }
      });
      return md;
  };

  const handleSaveToDocuments = () => {
      if (!activeConfig) return;
      
      // Find/Create tool folder
      const folderName = activeConfig.title.split(' ')[0]; // e.g., "SWOT" or "Porter's"
      let toolFolder = folders.find(f => f.name.includes(folderName));
      let folderId = toolFolder?.id;
      
      if (!toolFolder) {
          folderId = modelActions.createFolder(activeConfig.title);
      }

      const content = generateMatrixMarkdown(matrixData);

      if (generatedDocId) {
          onUpdateDocument(generatedDocId, { 
              title: docTitle, 
              content: content,
              data: matrixData,
              folderId: folderId 
          });
      } else {
          const newId = modelActions.createDocument(docTitle, content, 'swot-analysis', matrixData);
          modelActions.moveDocument(newId, folderId!);
          setGeneratedDocId(newId);
      }
      alert('Saved to Documents!');
  };

  const handleSaveReport = (onlySelected: boolean) => {
      if (!activeConfig) return;

      if (onlySelected) {
          const hasSelection = activeConfig.categories.some(cat => (matrixData[cat.id] || []).some(i => i.selected));
          if (!hasSelection) {
              alert("No items selected.");
              return;
          }
      }

      let toolFolder = folders.find(f => f.name.includes(activeConfig.title.split(' ')[0]));
      let folderId = toolFolder?.id;
      
      if (!toolFolder) {
          folderId = modelActions.createFolder(activeConfig.title);
      }

      const content = generateMatrixMarkdown(matrixData, onlySelected);
      const titleSuffix = onlySelected ? ' (Selected Report)' : ' (Report)';
      const title = `${docTitle}${titleSuffix}`;

      const newId = modelActions.createDocument(title, content, 'text');
      modelActions.moveDocument(newId, folderId!);
      
      alert(`Report saved to Documents: ${title}`);
  };

  const handleMatrixAI = async (targetCategoryId?: string) => {
      if (!activeConfig) return;
      setIsLoading(true);
      try {
          const contextElements = elements;
          const contextRels = relationships;
          
          const graphMarkdown = generateMarkdownFromGraph(contextElements, contextRels);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['swot']; // Default fallback or specific
          const prompt = `
          ${systemPromptBase}
          
          Perform a ${activeConfig.title} analysis on the provided knowledge graph.
          ${activeConfig.basePrompt}
          ${promptGuidance ? `USER GUIDANCE: ${promptGuidance}` : ''}
          
          ${targetCategoryId 
            ? `FOCUS ONLY ON THE CATEGORY: "${activeConfig.categories.find(c => c.id === targetCategoryId)?.label}".` 
            : `Analyze ALL categories: ${activeConfig.categories.map(c => c.label).join(', ')}.`}

          Instructions:
          - Identify key factors based on the graph structure and node attributes.
          - Return a structured JSON object where keys are the category IDs: ${activeConfig.categories.map(c => c.id).join(', ')}.
          - CRITICAL: Return arrays of STRINGS. Do not return markdown or nested objects in the array items.
          - Ensure each item is a complete thought/factor.
          
          Example JSON format:
          {
            "${activeConfig.categories[0].id}": ["Point 1", "Point 2"],
            "${activeConfig.categories[1].id}": ["Point A", "Point B"]
          }
          `;

          const schemaProperties: any = {};
          if (targetCategoryId) {
              schemaProperties[targetCategoryId] = { type: Type.ARRAY, items: { type: Type.STRING } };
          } else {
              activeConfig.categories.forEach(cat => {
                  schemaProperties[cat.id] = { type: Type.ARRAY, items: { type: Type.STRING } };
              });
          }

          const response = await ai.models.generateContent({
              model: activeModel || 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }, { text: `GRAPH CONTEXT:\n${graphMarkdown}` }] }],
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: schemaProperties
                  }
              }
          });

          const result = JSON.parse(response.text || "{}");
          
          setMatrixData(prev => {
              const next = { ...prev };
              Object.keys(result).forEach((key) => {
                  if (result[key] && Array.isArray(result[key])) {
                      const newEntries = result[key].map((text: string) => ({
                          id: generateUUID(),
                          text: text,
                          selected: false
                      }));
                      next[key] = [...(next[key] || []), ...newEntries];
                  }
              });
              return next;
          });

      } catch (e) {
          console.error("Matrix AI Error", e);
          alert("Failed to generate analysis.");
      } finally {
          setIsLoading(false);
      }
  };

  const applyToGraph = () => {
      if (!activeConfig) return;
      
      let actionsCount = 0;

      activeConfig.categories.forEach(cat => {
          const items = matrixData[cat.id] || [];
          items.forEach(entry => {
              if (entry.selected) {
                  // Add node
                  const name = entry.text.length > 30 ? entry.text.substring(0, 30) + '...' : entry.text;
                  modelActions.addElement({
                      name: name,
                      tags: [cat.tag], // Use the config tag
                      notes: entry.text
                  });
                  actionsCount++;
              }
          });
      });

      if (actionsCount > 0) {
          alert(`Created ${actionsCount} new nodes from analysis.`);
          onClose();
      } else {
          alert("No entries selected. Tick the checkboxes of the items you want to add to the graph.");
      }
  };

  // --- Legacy Logic for other tools (PESTEL, etc) ---
  const handleLegacyGenerate = async () => {
      if (!selectedNode) return;
      const legacyInfo = (LEGACY_TOOL_INFO as any)[activeTool];
      setIsLoading(true);
      setSuggestions([]);
      setAnalysisText('');
      setGeneratedDocId(null);

      try {
          const graphMarkdown = generateMarkdownFromGraph(elements, relationships);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS[activeTool] || DEFAULT_TOOL_PROMPTS['swot'];
          const systemInstruction = `${systemPromptBase}
          GRAPH CONTEXT:
          ${graphMarkdown}`;

          let userPrompt = `Perform a ${legacyInfo?.title || activeTool} analysis for: "${selectedNode}".`; 
          
          // (Keeping previous logic for prompts)
          if (activeTool === 'pestel') {
               userPrompt = `Perform a PESTEL analysis for the subject: "${selectedNode}".
              1. Analyze Political, Economic, Social, Technological, Environmental, and Legal factors.
              2. Suggest creating new nodes for significant external factors found.
              3. Link these factors to "${selectedNode}".`;
          } else if (activeTool === 'five_forces') {
               // Fallback if not using the matrix version
               userPrompt = `Analyze Porter's Five Forces for: "${selectedNode}".
              1. Identify Threat of New Entrants, Supplier Power, Buyer Power, Threat of Substitutes, Rivalry.
              2. Suggest adding specific nodes for Competitors, Suppliers, Buyers.`;
          }

          const response = await ai.models.generateContent({
              model: activeModel || 'gemini-2.5-flash',
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
          alert("Failed to apply action.");
      }
  };

  const handleCopy = () => {
      if (analysisText) {
          navigator.clipboard.writeText(analysisText);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };

  if (!isOpen) return null;

  // --- Matrix Render ---

  if (activeConfig) {
      return (
        <div className="fixed inset-0 pointer-events-none z-[3000]">
            <div 
                className="absolute bg-gray-900 rounded-lg shadow-2xl border border-blue-500/30 text-white flex flex-col overflow-hidden pointer-events-auto"
                style={{ width: `${size.width}px`, height: `${size.height}px`, left: position.x, top: position.y }}
            >
                {/* Header Bar (Draggable) */}
                <div 
                    className="h-10 bg-gray-800 border-b border-gray-700 flex justify-between items-center px-4 cursor-move select-none"
                    onMouseDown={handleWindowDragStart}
                >
                    <div className="flex items-center gap-2 flex-grow">
                        <span className="text-sm font-bold text-gray-200 uppercase tracking-wider mr-2">{activeConfig.title}:</span>
                        {/* Title Input */}
                        <input 
                            type="text" 
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()} // Allow interacting with input without dragging
                            className="bg-gray-900 border border-gray-600 hover:border-blue-500 focus:border-blue-500 rounded px-2 py-0.5 text-sm font-bold text-white outline-none transition-all w-64"
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
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-grow flex overflow-hidden">
                    {/* Left Sidebar (AI & Controls) */}
                    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col p-4 gap-4 shrink-0 overflow-y-auto">
                        
                        {/* View Options */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Entry Height</label>
                            <div className="flex bg-gray-900 rounded p-1 border border-gray-700 gap-1">
                                <button 
                                    onClick={() => setEntryHeight(1)}
                                    className={`flex-1 py-1 text-xs rounded font-bold transition-colors ${entryHeight === 1 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >1x</button>
                                <button 
                                    onClick={() => setEntryHeight(2)}
                                    className={`flex-1 py-1 text-xs rounded font-bold transition-colors ${entryHeight === 2 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >2x</button>
                                <button 
                                    onClick={() => setEntryHeight(3)}
                                    className={`flex-1 py-1 text-xs rounded font-bold transition-colors ${entryHeight === 3 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >3x</button>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-700 my-1"></div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Analysis Scope</label>
                                <div className="flex bg-gray-900 rounded p-1 border border-gray-700">
                                    <button 
                                        onClick={() => setAnalysisScope('model')}
                                        className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${analysisScope === 'model' ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Whole Model
                                    </button>
                                    <button 
                                        onClick={() => setAnalysisScope('selection')}
                                        className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${analysisScope === 'selection' ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Selection
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">AI Guidance</label>
                                <textarea 
                                    value={promptGuidance}
                                    onChange={e => {
                                        setPromptGuidance(e.target.value);
                                        guidanceDrafts.current[activeTool] = e.target.value;
                                    }}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none h-24 resize-none placeholder-gray-600"
                                    placeholder="E.g., Focus on financial risks and marketing opportunities..."
                                />
                            </div>

                            <button 
                                onClick={() => handleMatrixAI()}
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Generate Analysis'
                                )}
                            </button>
                        </div>

                        <div className="w-full h-full flex-grow"></div> {/* Spacer */}

                        <div className="w-full h-px bg-gray-700 my-1"></div>

                        <button 
                            onClick={applyToGraph}
                            className="w-full bg-gray-700 hover:bg-blue-600 border border-gray-600 text-white font-bold py-2 rounded transition shadow-sm text-xs uppercase tracking-wide mb-2"
                        >
                            Add Selected to Graph
                        </button>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSaveReport(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-bold py-2 rounded transition shadow-sm text-xs uppercase tracking-wide"
                            >
                                Save Report
                            </button>
                        </div>
                    </div>

                    {/* Main Matrix Grid */}
                    <div className={`flex-grow bg-gray-900 p-1 grid gap-1 overflow-hidden ${activeConfig.gridCols} auto-rows-fr`}>
                        {activeConfig.categories.map(category => (
                            <div 
                                key={category.id} 
                                className="bg-gray-800 border border-gray-700 rounded flex flex-col overflow-hidden"
                                onDragOver={(e) => e.preventDefault()} // Allow drop
                            >
                                {/* Category Header */}
                                <div className="p-2 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                                    <h3 className={`font-bold uppercase tracking-wider text-sm ${category.color}`}>
                                        {category.label}
                                    </h3>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleMatrixAI(category.id)}
                                            disabled={isLoading}
                                            className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white" 
                                            title={`Generate only ${category.label}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => addEntry(category.id)}
                                            className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white" 
                                            title="Add Item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Entries List */}
                                <div className="flex-grow overflow-y-auto p-2 space-y-1 bg-gray-800">
                                    {(matrixData[category.id] || []).map((entry, index) => (
                                        <div 
                                            key={entry.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, category.id, index, entry.id)}
                                            onDragEnter={(e) => onDragEnter(e, category.id, index)}
                                            onDragEnd={onDragEnd}
                                            className={`flex items-start gap-2 p-2 rounded border group transition-colors ${
                                                entry.selected ? 'bg-blue-900/20 border-blue-500/50' : 
                                                draggingId === entry.id ? 'bg-gray-700 opacity-50 border-gray-600' : 'bg-gray-750 border-gray-700 hover:border-gray-500'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={entry.selected} 
                                                onChange={() => toggleSelectEntry(category.id, entry.id)}
                                                className="mt-1.5 cursor-pointer rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-0"
                                            />
                                            <textarea 
                                                value={entry.text}
                                                onChange={(e) => updateEntry(category.id, entry.id, e.target.value)}
                                                className="swot-textarea flex-grow bg-transparent border-none text-sm text-gray-300 focus:text-white focus:ring-0 resize-none overflow-hidden outline-none placeholder-gray-600"
                                                rows={entryHeight}
                                                placeholder="Enter point..."
                                            />
                                            <button 
                                                onClick={() => deleteEntry(category.id, entry.id)}
                                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {(!matrixData[category.id] || matrixData[category.id].length === 0) && (
                                        <div className="text-center py-4 text-gray-600 text-xs italic select-none">
                                            Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resizer Handle */}
                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-1"
                    onMouseDown={handleResizeStart}
                >
                    <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-500 opacity-50">
                        <path d="M10 10 L10 0 L0 10 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
      );
  }

  // --- Legacy Render (Standard Modal) for PESTEL, etc. ---
  const toolInfo = LEGACY_TOOL_INFO[activeTool as keyof typeof LEGACY_TOOL_INFO];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[3000] p-4">
      <div className={`bg-gray-900 rounded-lg w-full max-w-6xl shadow-2xl border ${toolInfo?.border || 'border-gray-600'} text-white flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo?.color}`}>
                Strategy / <span className="text-white">{toolInfo?.title || activeTool}</span>
            </h2>
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Left: Controls */}
            <div className="w-1/3 p-6 border-r border-gray-800 overflow-y-auto bg-gray-800/50">
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">{toolInfo?.desc}</p>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject Node</label>
                        <select 
                            className="w-full bg-gray-800 text-white text-sm rounded p-2 border border-gray-600 focus:border-lime-500 outline-none"
                            value={selectedNode}
                            onChange={e => setSelectedNode(e.target.value)}
                        >
                            <option value="">-- Select Node --</option>
                            {elements.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                    </div>
                    <button 
                        disabled={!selectedNode || isLoading}
                        onClick={handleLegacyGenerate}
                        className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold py-3 rounded transition disabled:opacity-50"
                    >
                        {isLoading ? 'Analyzing...' : `Run ${toolInfo?.title || 'Analysis'}`}
                    </button>
                </div>
            </div>

            {/* Right: Results */}
            <div className="w-2/3 p-6 overflow-y-auto flex flex-col gap-6 bg-gray-900 relative">
                {analysisText && (
                    <div className="absolute top-4 right-6 flex gap-2 z-10">
                        <button onClick={handleCopy} className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition" title="Copy">
                            {isCopied ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                        </button>
                    </div>
                )}

                {analysisText ? (
                    <div className="bg-gray-800 p-4 rounded border border-gray-700 pt-10">
                        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed markdown-content">
                            {analysisText}
                        </div>
                    </div>
                ) : !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                        <p>Select a node and run analysis.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lime-400 animate-pulse text-sm">Processing...</p>
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-200 mb-3">Recommended Actions</h3>
                        <div className="space-y-3">
                            {suggestions.map((action, idx) => (
                                <div key={idx} className={`p-3 rounded border flex items-center justify-between ${action.status === 'applied' ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="text-sm text-gray-300">
                                        {action.name}: {JSON.stringify(action.args)}
                                    </div>
                                    {action.status === 'pending' ? (
                                        <button onClick={() => handleApplyAction(idx)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition">Apply</button>
                                    ) : (
                                        <span className="text-green-500 text-xs font-bold">Applied</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SwotModal;
