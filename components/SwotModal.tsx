
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, SwotToolType, ModelActions, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph, generateUUID } from '../utils';
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

interface SwotEntry {
    id: string;
    text: string;
    selected: boolean;
}

type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

const SwotModal: React.FC<SwotModalProps> = ({ isOpen, activeTool, elements, relationships, modelActions, onClose, onLogHistory, onOpenHistory, documents, folders, onUpdateDocument }) => {
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
      if (!isOpen) {
          setSuggestions([]);
          setAnalysisText('');
          setGeneratedDocId(null);
          // Reset SWOT data on close/open
          setSwotData({ strengths: [], weaknesses: [], opportunities: [], threats: [] });
      } else {
          // Center on open if not set (simple heuristic)
          if (position.x === 100 && position.y === 100) {
              setPosition({ 
                  x: Math.max(20, (window.innerWidth - 1200) / 2), 
                  y: Math.max(20, (window.innerHeight - 800) / 2) 
              });
          }
      }
  }, [isOpen]);

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

  const handleSwotAI = async (targetCategory?: SwotCategory) => {
      setIsLoading(true);
      try {
          // Filter graph based on scope
          let contextElements = elements;
          let contextRels = relationships;
          
          if (analysisScope === 'selection') {
              // Simplistic selection check - ideally we'd pass selected IDs from parent, 
              // but relying on what's passed to modal via props if selection is active elsewhere.
              // Assuming 'selectedNode' prop usage or similar.
              // For this implementation, we'll assume 'elements' passed are ALL elements.
              // If we want selection specific, we rely on the prompt instruction mainly, 
              // or the parent needs to pass selection state.
              // Let's use the existing 'selectedNode' state if set for focus, else warn.
          }

          const graphMarkdown = generateMarkdownFromGraph(contextElements, contextRels);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const prompt = `
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
                          selected: false // Default to not selected? Or select new ones? Let's keep unselected.
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
                  
                  const nodeId = modelActions.addElement({
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
          
          const systemInstruction = `You are a Strategic Analyst. Analyze the provided graph model using the ${toolInfo.title} framework.
          GRAPH CONTEXT:
          ${graphMarkdown}
          
          OUTPUT FORMAT:
          Return a JSON object with two fields:
          1. "analysis": A detailed MARKDOWN string explaining your findings, organized by the categories of the framework.
          2. "actions": An array of suggested graph modifications. Each action must be a function call object: { name: "addElement" | "addRelationship" | "deleteElement" | "setElementAttribute", args: { ... } }.
          `;

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
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">SWOT Matrix</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
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
                                className="w-full bg-lime-700 hover:bg-lime-600 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="animate-spin">⟳</span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 5a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1V8a1 1 0 011-1zm5-5a1 1 0 011 1v15a1 1 0 11-2 0V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                )}
                                Auto-Populate All
                            </button>

                            <div className="border-t border-gray-700 pt-4 mt-2">
                                <p className="text-xs text-gray-500 mb-2">
                                    Select entries in the grid, then apply to create them as nodes in your graph.
                                </p>
                                <button 
                                    onClick={applySwotToGraph}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition"
                                >
                                    Apply Selected to Graph
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main 2x2 Grid */}
                    <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-4 p-4 bg-gray-900 overflow-hidden">
                        
                        {/* Reusable Quadrant Component */}
                        {[
                            { id: 'strengths' as SwotCategory, title: 'Strengths', color: 'text-green-400', border: 'border-green-900/50' },
                            { id: 'weaknesses' as SwotCategory, title: 'Weaknesses', color: 'text-red-400', border: 'border-red-900/50' },
                            { id: 'opportunities' as SwotCategory, title: 'Opportunities', color: 'text-blue-400', border: 'border-blue-900/50' },
                            { id: 'threats' as SwotCategory, title: 'Threats', color: 'text-orange-400', border: 'border-orange-900/50' }
                        ].map((quad) => (
                            <div 
                                key={quad.id} 
                                className={`bg-gray-800 rounded-lg border ${quad.border} flex flex-col overflow-hidden relative`}
                            >
                                {/* Quadrant Header */}
                                <div className="p-3 bg-gray-800/80 border-b border-gray-700 flex justify-between items-center">
                                    <h3 className={`font-bold uppercase tracking-wider ${quad.color}`}>{quad.title}</h3>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => addEntry(quad.id)}
                                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                            title="Add Entry"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleSwotAI(quad.id)}
                                            disabled={isLoading}
                                            className="p-1 text-gray-400 hover:text-lime-400 hover:bg-gray-700 rounded disabled:opacity-30"
                                            title="Auto-Populate Category"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 5a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1V8a1 1 0 011-1zm5-5a1 1 0 011 1v15a1 1 0 11-2 0V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div 
                                    className="flex-grow overflow-y-auto p-2 space-y-2"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        // If dragging over the container background (not an item),
                                        // set the drop target to the end of the current category's list.
                                        // This allows moving items between categories easily by dropping in empty space.
                                        if (e.currentTarget === e.target) {
                                            dragOverItem.current = { category: quad.id, index: swotData[quad.id].length };
                                        }
                                    }}
                                    onDrop={onDragEnd}
                                >
                                    {swotData[quad.id].map((entry, idx) => (
                                        <div 
                                            key={entry.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, quad.id, idx, entry.id)}
                                            onDragEnter={(e) => onDragEnter(e, quad.id, idx)}
                                            onDragEnd={onDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            className={`flex items-start gap-2 p-2 rounded border group transition-colors ${
                                                entry.selected 
                                                ? 'bg-yellow-900/30 border-yellow-600/50' 
                                                : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                                            } ${draggingId === entry.id ? 'opacity-50' : 'opacity-100'}`}
                                        >
                                            {/* Drag Handle */}
                                            <div className="cursor-grab text-gray-500 hover:text-gray-300 mt-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" /></svg>
                                            </div>

                                            {/* Checkbox */}
                                            <input 
                                                type="checkbox" 
                                                checked={entry.selected} 
                                                onChange={() => toggleSelectEntry(quad.id, entry.id)}
                                                className="w-4 h-4 mt-1.5 rounded bg-gray-900 border-gray-600 text-yellow-600 focus:ring-yellow-600 focus:ring-offset-gray-800 cursor-pointer"
                                            />

                                            {/* Text Area */}
                                            <textarea 
                                                value={entry.text}
                                                onChange={(e) => updateEntry(quad.id, entry.id, e.target.value)}
                                                rows={entryHeight}
                                                className="swot-textarea bg-transparent border-none text-sm text-white focus:ring-0 flex-grow w-full min-w-0 placeholder-gray-500 resize-none leading-relaxed"
                                                placeholder="Enter text..."
                                            />

                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => deleteEntry(quad.id, entry.id)}
                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {swotData[quad.id].length === 0 && (
                                        <div 
                                            onClick={() => addEntry(quad.id)}
                                            className="text-center text-gray-500 text-xs py-4 italic border-2 border-dashed border-gray-700 rounded cursor-pointer hover:bg-gray-800 hover:text-gray-400 hover:border-gray-500 transition-all"
                                        >
                                            Empty (Click to add)
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resize Handle */}
                <div 
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5"
                    onMouseDown={handleResizeStart}
                >
                    <svg viewBox="0 0 10 10" className="w-2 h-2 text-gray-500">
                        <path d="M10 10 L10 0 L0 10 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
      );
  }

  // --- Fallback for Legacy Tools (PESTEL, etc) ---
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
                        onClick={handleLegacyGenerate}
                        className={`w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded transition disabled:opacity-50 flex justify-center items-center gap-2 border border-gray-500 hover:border-gray-400`}
                    >
                        {isLoading ? 'Analyzing...' : `Run ${toolInfo.title}`}
                    </button>
                </div>
            </div>

            {/* Right: Results */}
            <div className="w-2/3 p-6 overflow-y-auto flex flex-col gap-6 bg-gray-900 relative">
                {/* Reuse existing result rendering logic... */}
                {analysisText && (
                    <div className="bg-gray-800 p-4 rounded border border-gray-700">
                        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed markdown-content">
                            {analysisText}
                        </div>
                    </div>
                )}
                
                {suggestions.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-200 mb-3">Proposed Actions</h3>
                        <div className="space-y-3">
                            {suggestions.map((action, idx) => (
                                <div key={idx} className={`p-3 rounded border flex items-center justify-between ${action.status === 'applied' ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="text-sm">
                                        <div className="font-mono text-xs text-gray-500 uppercase mb-1">{action.name}</div>
                                        <div className="text-gray-200 font-medium">
                                            {action.name === 'addElement' && `Add: ${action.args.name}`}
                                            {/* ... other action types ... */}
                                        </div>
                                    </div>
                                    {action.status === 'pending' && (
                                        <button 
                                            onClick={() => handleApplyAction(idx)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition"
                                        >
                                            Apply
                                        </button>
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
