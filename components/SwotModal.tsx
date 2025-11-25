
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
}

interface SwotEntry {
    id: string;
    text: string;
    selected: boolean;
}

type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

const SwotModal: React.FC<SwotModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, documents, folders, onUpdateDocument, modelName, initialDoc, customPrompt }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  // --- New SWOT Specific State ---
  const [swotData, setSwotData] = useState<Record<SwotCategory, SwotEntry[]>>({
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
  });
  const [docTitle, setDocTitle] = useState('SWOT Analysis');
  const [promptGuidance, setPromptGuidance] = useState('');
  const [analysisScope, setAnalysisScope] = useState<'model' | 'selection'>('model');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [entryHeight, setEntryHeight] = useState<number>(1);
  
  // Draggable & Resizable Window State
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 1200, height: 800 });
  
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartDim = useRef({ width: 0, height: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });
  
  // Refs for drag and drop of items
  const dragItem = useRef<{ category: SwotCategory, index: number } | null>(null);
  const dragOverItem = useRef<{ category: SwotCategory, index: number } | null>(null);

  useEffect(() => {
      if (isOpen) {
          if (initialDoc) {
              // Load from document
              setSwotData(initialDoc.data || { strengths: [], weaknesses: [], opportunities: [], threats: [] });
              setDocTitle(initialDoc.title);
              setGeneratedDocId(initialDoc.id);
          } else {
              // Reset for new analysis
              setSwotData({ strengths: [], weaknesses: [], opportunities: [], threats: [] });
              const dateStr = new Date().toLocaleDateString();
              setDocTitle(`${modelName || 'Model'} - SWOT - ${dateStr}`);
              setGeneratedDocId(null);
          }
          setSuggestions([]);
          setAnalysisText('');
      } else {
          // Reset on close to clean up if reopened
          setGeneratedDocId(null);
      }
  }, [isOpen, initialDoc, modelName]);

  // Reset scroll position when entry height changes
  useEffect(() => {
      const textareas = document.querySelectorAll('.swot-textarea');
      textareas.forEach(el => {
          el.scrollTop = 0;
      });
  }, [entryHeight]);

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


  // --- SWOT Specific Logic ---

  const addEntry = (category: SwotCategory) => {
      const newEntry: SwotEntry = { id: generateUUID(), text: '', selected: false };
      setSwotData(prev => ({
          ...prev,
          [category]: [...prev[category], newEntry]
      }));
  };

  const updateEntry = (category: SwotCategory, id: string, text: string) => {
      setSwotData(prev => ({
          ...prev,
          [category]: prev[category].map(e => e.id === id ? { ...e, text } : e)
      }));
  };

  const toggleSelectEntry = (category: SwotCategory, id: string) => {
      setSwotData(prev => ({
          ...prev,
          [category]: prev[category].map(e => e.id === id ? { ...e, selected: !e.selected } : e)
      }));
  };

  const deleteEntry = (category: SwotCategory, id: string) => {
      setSwotData(prev => ({
          ...prev,
          [category]: prev[category].filter(e => e.id !== id)
      }));
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, category: SwotCategory, index: number, id: string) => {
      e.stopPropagation(); // Stop propagation to prevent window drag interference
      dragItem.current = { category, index };
      setDraggingId(id);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: React.DragEvent, category: SwotCategory, index: number) => {
      e.stopPropagation();
      dragOverItem.current = { category, index };
  };

  const onDragEnd = () => {
      if (dragItem.current && dragOverItem.current) {
          const sourceCat = dragItem.current.category;
          const destCat = dragOverItem.current.category;
          
          if (sourceCat === destCat) {
              const list = [...swotData[sourceCat]];
              const item = list[dragItem.current.index];
              list.splice(dragItem.current.index, 1);
              list.splice(dragOverItem.current.index, 0, item);
              
              setSwotData(prev => ({ ...prev, [sourceCat]: list }));
          } else {
              // Moving between categories
              const sourceList = [...swotData[sourceCat]];
              const destList = [...swotData[destCat]];
              const item = sourceList[dragItem.current.index];
              
              sourceList.splice(dragItem.current.index, 1);
              destList.splice(dragOverItem.current.index, 0, item);
              
              setSwotData(prev => ({ ...prev, [sourceCat]: sourceList, [destCat]: destList }));
          }
      }
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggingId(null);
  };

  const generateSwotMarkdown = (data: Record<SwotCategory, SwotEntry[]>, onlySelected: boolean = false) => {
      let md = `# ${docTitle}\n\n`;
      const categories: SwotCategory[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];
      
      categories.forEach(cat => {
          const items = data[cat].filter(e => !onlySelected || e.selected);
          
          if (items.length > 0 || !onlySelected) {
             md += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n`;
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
      // Find/Create SWOT folder
      let swotFolder = folders.find(f => f.name === 'SWOT');
      let folderId = swotFolder?.id;
      
      if (!swotFolder) {
          folderId = modelActions.createFolder('SWOT');
      }

      const content = generateSwotMarkdown(swotData);

      if (generatedDocId) {
          onUpdateDocument(generatedDocId, { 
              title: docTitle, 
              content: content,
              data: swotData,
              folderId: folderId 
          });
      } else {
          const newId = modelActions.createDocument(docTitle, content, 'swot-analysis', swotData);
          modelActions.moveDocument(newId, folderId!);
          setGeneratedDocId(newId);
      }
      alert('Saved to Documents!');
  };

  const handleSaveReport = (onlySelected: boolean) => {
      // Check if anything selected if onlySelected is true
      if (onlySelected) {
          const categories: SwotCategory[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];
          const hasSelection = categories.some(cat => swotData[cat].some(i => i.selected));
          if (!hasSelection) {
              alert("No items selected.");
              return;
          }
      }

      let swotFolder = folders.find(f => f.name === 'SWOT');
      let folderId = swotFolder?.id;
      
      if (!swotFolder) {
          folderId = modelActions.createFolder('SWOT');
      }

      const content = generateSwotMarkdown(swotData, onlySelected);
      const titleSuffix = onlySelected ? ' (Selected Report)' : ' (Report)';
      const title = `${docTitle}${titleSuffix}`;

      const newId = modelActions.createDocument(title, content, 'text');
      modelActions.moveDocument(newId, folderId!);
      
      alert(`Report saved to Documents: ${title}`);
  };

  const handleSwotAI = async (targetCategory?: SwotCategory) => {
      setIsLoading(true);
      try {
          // Filter graph based on scope
          let contextElements = elements;
          let contextRels = relationships;
          
          if (analysisScope === 'selection') {
              // TODO: Use selection from app context if available
          }

          const graphMarkdown = generateMarkdownFromGraph(contextElements, contextRels);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const systemPromptBase = customPrompt || DEFAULT_TOOL_PROMPTS['swot'];
          const prompt = `
          ${systemPromptBase}
          
          Perform a SWOT Analysis on the provided knowledge graph.
          ${promptGuidance ? `USER GUIDANCE: ${promptGuidance}` : ''}
          
          ${targetCategory 
            ? `FOCUS ONLY ON THE "${targetCategory.toUpperCase()}" CATEGORY.` 
            : 'Analyze ALL four categories: Strengths, Weaknesses, Opportunities, Threats.'}

          Instructions:
          - Identify key factors based on the graph structure and node attributes.
          - Return a structured JSON object.
          - Be concise and specific.
          - CRITICAL: Return arrays of STRINGS. Do not return markdown or nested objects in the array items.
          - Ensure each item is a complete thought/factor. Do not split single points into multiple array items.
          
          Example JSON format:
          {
            "strengths": ["High customer loyalty due to long-term contracts", "Strong patent portfolio in AI technology"],
            "weaknesses": ["High debt ratio compared to industry average", "Low market share in Asia"],
            ...
          }
          `;

          const schemaProperties: any = {};
          if (targetCategory) {
              schemaProperties[targetCategory] = { type: Type.ARRAY, items: { type: Type.STRING } };
          } else {
              schemaProperties.strengths = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.weaknesses = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.opportunities = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.threats = { type: Type.ARRAY, items: { type: Type.STRING } };
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
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
          
          setSwotData(prev => {
              const next = { ...prev };
              Object.keys(result).forEach((key) => {
                  const cat = key as SwotCategory;
                  if (result[key] && Array.isArray(result[key])) {
                      const newEntries = result[key].map((text: string) => ({
                          id: generateUUID(),
                          text: text,
                          selected: false
                      }));
                      next[cat] = [...next[cat], ...newEntries];
                  }
              });
              return next;
          });

      } catch (e) {
          console.error("SWOT AI Error", e);
          alert("Failed to generate SWOT analysis.");
      } finally {
          setIsLoading(false);
      }
  };

  const applySwotToGraph = () => {
      // Gather all selected entries
      const categories: SwotCategory[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];
      let actionsCount = 0;

      categories.forEach(cat => {
          swotData[cat].forEach(entry => {
              if (entry.selected) {
                  // Add node
                  const name = entry.text.length > 30 ? entry.text.substring(0, 30) + '...' : entry.text;
                  const tagMap = {
                      strengths: 'Strength',
                      weaknesses: 'Weakness',
                      opportunities: 'Opportunity',
                      threats: 'Threat'
                  };
                  
                  modelActions.addElement({
                      name: name,
                      tags: [tagMap[cat]],
                      notes: entry.text
                  });
                  actionsCount++;
              }
          });
      });

      if (actionsCount > 0) {
          alert(`Created ${actionsCount} new nodes from SWOT analysis.`);
          onClose();
      } else {
          alert("No entries selected. Tick the checkboxes of the items you want to add to the graph.");
      }
  };

  // --- Legacy Logic for other tools (PESTEL, etc) ---
  const handleLegacyGenerate = async () => {
      if (!selectedNode) return;
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

          let userPrompt = `Perform a ${toolInfo.title} analysis for: "${selectedNode}".`; 
          
          if (activeTool === 'pestel') {
               userPrompt = `Perform a PESTEL analysis for the subject: "${selectedNode}".
              1. Analyze Political, Economic, Social, Technological, Environmental, and Legal factors.
              2. Suggest creating new nodes for significant external factors found.
              3. Link these factors to "${selectedNode}".`;
          } else if (activeTool === 'five_forces') {
               userPrompt = `Analyze Porter's Five Forces for: "${selectedNode}".
              1. Identify Threat of New Entrants, Supplier Power, Buyer Power, Threat of Substitutes, Rivalry.
              2. Suggest adding specific nodes for Competitors, Suppliers, Buyers.`;
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

  // --- Render ---

  if (activeTool === 'matrix') {
      return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <div 
                className="absolute bg-gray-900 rounded-lg shadow-2xl border border-lime-500 text-white flex flex-col overflow-hidden pointer-events-auto"
                style={{ width: `${size.width}px`, height: `${size.height}px`, left: position.x, top: position.y }}
            >
                {/* Header Bar (Draggable) */}
                <div 
                    className="h-10 bg-gray-800 border-b border-gray-700 flex justify-between items-center px-4 cursor-move select-none"
                    onMouseDown={handleWindowDragStart}
                >
                    <div className="flex items-center gap-2 flex-grow">
                        <div className="w-4 h-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <rect x="4" y="4" width="7" height="7" rx="1" className="fill-green-500" />
                                <rect x="13" y="4" width="7" height="7" rx="1" className="fill-red-300" />
                                <rect x="4" y="13" width="7" height="7" rx="1" className="fill-yellow-400" />
                                <rect x="13" y="13" width="7" height="7" rx="1" className="fill-red-700" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-200 uppercase tracking-wider mr-2">SWOT Matrix:</span>
                        {/* Title Input */}
                        <input 
                            type="text" 
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()} // Allow interacting with input without dragging
                            className="bg-gray-900 border border-gray-600 hover:border-lime-500 focus:border-lime-500 rounded px-2 py-0.5 text-sm font-bold text-white outline-none transition-all w-64"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleSaveToDocuments} 
                            className="bg-lime-700 hover:bg-lime-600 text-white text-xs font-bold px-3 py-1 rounded transition shadow-sm flex items-center gap-1"
                            title="Save to Documents folder 'SWOT'"
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
                                    title="Single Line"
                                >
                                    1x
                                </button>
                                <button 
                                    onClick={() => setEntryHeight(2)}
                                    className={`flex-1 py-1 text-xs rounded font-bold transition-colors ${entryHeight === 2 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    title="Double Height"
                                >
                                    2x
                                </button>
                                <button 
                                    onClick={() => setEntryHeight(3)}
                                    className={`flex-1 py-1 text-xs rounded font-bold transition-colors ${entryHeight === 3 ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    title="Triple Height"
                                >
                                    3x
                                </button>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-700 my-1"></div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Analysis Scope</label>
                                <div className="flex bg-gray-900 rounded p-1 border border-gray-700">
                                    <button 
                                        onClick={() => setAnalysisScope('model')}
                                        className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${analysisScope === 'model' ? 'bg-lime-700 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Whole Model
                                    </button>
                                    <button 
                                        onClick={() => setAnalysisScope('selection')}
                                        className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${analysisScope === 'selection' ? 'bg-lime-700 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Selection
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">AI Guidance</label>
                                <textarea 
                                    value={promptGuidance}
                                    onChange={e => setPromptGuidance(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-lime-500 outline-none h-24 resize-none placeholder-gray-600"
                                    placeholder="E.g., Focus on financial risks and marketing opportunities..."
                                />
                            </div>

                            <button 
                                onClick={() => handleSwotAI()}
                                disabled={isLoading}
                                className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold py-2 rounded shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Generate Full SWOT'
                                )}
                            </button>
                        </div>

                        <div className="w-full h-px bg-gray-700 my-1"></div>

                        <button 
                            onClick={applySwotToGraph}
                            className="w-full bg-gray-700 hover:bg-blue-600 border border-gray-600 text-white font-bold py-2 rounded transition shadow-sm text-xs uppercase tracking-wide mb-2"
                        >
                            Add Selected to Graph
                        </button>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSaveReport(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-bold py-2 rounded transition shadow-sm text-xs uppercase tracking-wide"
                                title="Save full report as a text document"
                            >
                                Save Report (All)
                            </button>
                            <button 
                                onClick={() => handleSaveReport(true)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-bold py-2 rounded transition shadow-sm text-xs uppercase tracking-wide"
                                title="Save selected items as a text document"
                            >
                                Save Report (Sel)
                            </button>
                        </div>
                    </div>

                    {/* Main Matrix Grid */}
                    <div className="flex-grow bg-gray-900 p-1 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden">
                        {(['strengths', 'weaknesses', 'opportunities', 'threats'] as SwotCategory[]).map(category => (
                            <div 
                                key={category} 
                                className="bg-gray-800 border border-gray-700 rounded flex flex-col overflow-hidden"
                                onDragOver={(e) => e.preventDefault()} // Allow drop
                            >
                                {/* Category Header */}
                                <div className="p-2 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                                    <h3 className={`font-bold uppercase tracking-wider text-sm ${
                                        category === 'strengths' ? 'text-green-400' :
                                        category === 'weaknesses' ? 'text-red-400' :
                                        category === 'opportunities' ? 'text-blue-400' : 'text-orange-400'
                                    }`}>
                                        {category}
                                    </h3>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleSwotAI(category)}
                                            disabled={isLoading}
                                            className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white" 
                                            title={`Generate only ${category}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => addEntry(category)}
                                            className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white" 
                                            title="Add Item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Entries List */}
                                <div className="flex-grow overflow-y-auto p-2 space-y-1 bg-gray-800">
                                    {swotData[category].map((entry, index) => (
                                        <div 
                                            key={entry.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, category, index, entry.id)}
                                            onDragEnter={(e) => onDragEnter(e, category, index)}
                                            onDragEnd={onDragEnd}
                                            className={`flex items-start gap-2 p-2 rounded border group transition-colors ${
                                                entry.selected ? 'bg-blue-900/20 border-blue-500/50' : 
                                                draggingId === entry.id ? 'bg-gray-700 opacity-50 border-gray-600' : 'bg-gray-750 border-gray-700 hover:border-gray-500'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={entry.selected} 
                                                onChange={() => toggleSelectEntry(category, entry.id)}
                                                className="mt-1.5 cursor-pointer rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-0"
                                            />
                                            <textarea 
                                                value={entry.text}
                                                onChange={(e) => updateEntry(category, entry.id, e.target.value)}
                                                className="swot-textarea flex-grow bg-transparent border-none text-sm text-gray-300 focus:text-white focus:ring-0 resize-none overflow-hidden outline-none placeholder-gray-600"
                                                rows={entryHeight}
                                                placeholder="Enter point..."
                                            />
                                            <button 
                                                onClick={() => deleteEntry(category, entry.id)}
                                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {swotData[category].length === 0 && (
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
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className={`bg-gray-900 rounded-lg w-full max-w-6xl shadow-2xl border ${toolInfo.border} text-white flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${toolInfo.color}`}>
                Strategy / <span className="text-white">{toolInfo.title}</span>
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
                    <p className="text-gray-300 text-sm">{toolInfo.desc}</p>
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
                        {isLoading ? 'Analyzing...' : `Run ${toolInfo.title}`}
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
