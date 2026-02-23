
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, SwotToolType, ModelActions, TapestryDocument, TapestryFolder, CustomStrategyTool, CustomStrategyCategory } from '../types';
import { generateMarkdownFromGraph, generateUUID, callAI } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentEditorPanel } from './DocumentPanel';
import { DEFAULT_TOOL_PROMPTS } from '../constants';
import { promptStore } from '../services/PromptStore';

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
  aiConfig: any;
  isDarkMode: boolean;
  customStrategies?: CustomStrategyTool[];
  onSaveCustomStrategies?: (strategies: CustomStrategyTool[]) => void;
  onOpenGuidance?: () => void;
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
    gridRows?: string; // Tailwind class e.g., 'grid-rows-2'
    categories: MatrixCategoryDef[];
}

// --- Configurations ---

const MATRIX_CONFIGS: Record<string, MatrixConfig> = {
    matrix: {
        title: "SWOT Matrix",
        description: "Analyze internal Strengths & Weaknesses and external Opportunities & Threats.",
        basePrompt: promptStore.get("swot_base:matrix"),
        gridCols: "grid-cols-2",
        gridRows: "grid-rows-2",
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
        basePrompt: promptStore.get("swot_base:five_forces"),
        gridCols: "grid-cols-3",
        gridRows: "grid-rows-2",
        categories: [
            { id: 'rivalry', label: 'Competitive Rivalry', tag: 'Competitor', color: 'text-red-400', borderColor: 'border-red-500' },
            { id: 'new_entrants', label: 'Threat of New Entrants', tag: 'Entrant', color: 'text-orange-400', borderColor: 'border-orange-500' },
            { id: 'substitutes', label: 'Threat of Substitutes', tag: 'Substitute', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
            { id: 'supplier_power', label: 'Supplier Power', tag: 'Supplier', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'buyer_power', label: 'Buyer Power', tag: 'Buyer', color: 'text-green-400', borderColor: 'border-green-500' }
        ]
    },
    pestel: {
        title: "PESTEL Analysis",
        description: "Analyze Political, Economic, Social, Technological, Environmental, and Legal factors.",
        basePrompt: promptStore.get("swot_base:pestel"),
        gridCols: "grid-cols-3",
        gridRows: "grid-rows-2",
        categories: [
            { id: 'political', label: 'Political', tag: 'Political', color: 'text-red-400', borderColor: 'border-red-500' },
            { id: 'economic', label: 'Economic', tag: 'Economic', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
            { id: 'social', label: 'Social', tag: 'Social', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
            { id: 'technological', label: 'Technological', tag: 'Technological', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'environmental', label: 'Environmental', tag: 'Environmental', color: 'text-green-400', borderColor: 'border-green-500' },
            { id: 'legal', label: 'Legal', tag: 'Legal', color: 'text-slate-400', borderColor: 'border-slate-500' }
        ]
    },
    steer: {
        title: "STEER Analysis",
        description: "Analyze Socio-cultural, Technological, Economic, Ecological, and Regulatory factors.",
        basePrompt: promptStore.get("swot_base:steer"),
        gridCols: "grid-cols-3",
        gridRows: "grid-rows-2",
        categories: [
            { id: 'socio_cultural', label: 'Socio-cultural', tag: 'Socio-cultural', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
            { id: 'technological', label: 'Technological', tag: 'Technological', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'economic', label: 'Economic', tag: 'Economic', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
            { id: 'ecological', label: 'Ecological', tag: 'Ecological', color: 'text-green-400', borderColor: 'border-green-500' },
            { id: 'regulatory', label: 'Regulatory', tag: 'Regulatory', color: 'text-red-400', borderColor: 'border-red-500' }
        ]
    },
    destep: {
        title: "DESTEP Analysis",
        description: "Analyze Demographic, Economic, Social, Technological, Ecological, and Political factors.",
        basePrompt: promptStore.get("swot_base:destep"),
        gridCols: "grid-cols-3",
        gridRows: "grid-rows-2",
        categories: [
            { id: 'demographic', label: 'Demographic', tag: 'Demographic', color: 'text-purple-400', borderColor: 'border-purple-500' },
            { id: 'economic', label: 'Economic', tag: 'Economic', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
            { id: 'social', label: 'Social', tag: 'Social', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
            { id: 'technological', label: 'Technological', tag: 'Technological', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'ecological', label: 'Ecological', tag: 'Ecological', color: 'text-green-400', borderColor: 'border-green-500' },
            { id: 'political', label: 'Political', tag: 'Political', color: 'text-red-400', borderColor: 'border-red-500' }
        ]
    },
    longpest: {
        title: "LoNGPEST Analysis",
        description: "Analyze Political, Economic, Social, and Technological factors at Local, National, and Global scales.",
        basePrompt: promptStore.get("swot_base:longpest"),
        gridCols: "grid-cols-3",
        gridRows: "grid-rows-1",
        categories: [
            { id: 'local', label: 'Local PEST', tag: 'Local', color: 'text-teal-400', borderColor: 'border-teal-500' },
            { id: 'national', label: 'National PEST', tag: 'National', color: 'text-blue-400', borderColor: 'border-blue-500' },
            { id: 'global', label: 'Global PEST', tag: 'Global', color: 'text-indigo-400', borderColor: 'border-indigo-500' }
        ]
    },
    cage: {
        title: "CAGE Distance Framework",
        description: "Analyze Cultural, Administrative, Geographic, and Economic distances.",
        basePrompt: promptStore.get("swot_base:cage"),
        gridCols: "grid-cols-2",
        gridRows: "grid-rows-2",
        categories: [
            { id: 'cultural', label: 'Cultural Distance', tag: 'Cultural', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
            { id: 'administrative', label: 'Administrative Distance', tag: 'Administrative', color: 'text-red-400', borderColor: 'border-red-500' },
            { id: 'geographic', label: 'Geographic Distance', tag: 'Geographic', color: 'text-green-400', borderColor: 'border-green-500' },
            { id: 'economic', label: 'Economic Distance', tag: 'Economic', color: 'text-blue-400', borderColor: 'border-blue-500' }
        ]
    }
};

const COLOR_OPTIONS = [
    { name: 'Red', textClass: 'text-red-400', borderClass: 'border-red-500' },
    { name: 'Orange', textClass: 'text-orange-400', borderClass: 'border-orange-500' },
    { name: 'Yellow', textClass: 'text-yellow-400', borderClass: 'border-yellow-500' },
    { name: 'Green', textClass: 'text-green-400', borderClass: 'border-green-500' },
    { name: 'Emerald', textClass: 'text-emerald-400', borderClass: 'border-emerald-500' },
    { name: 'Teal', textClass: 'text-teal-400', borderClass: 'border-teal-500' },
    { name: 'Blue', textClass: 'text-blue-400', borderClass: 'border-blue-500' },
    { name: 'Indigo', textClass: 'text-indigo-400', borderClass: 'border-indigo-500' },
    { name: 'Purple', textClass: 'text-purple-400', borderClass: 'border-purple-500' },
    { name: 'Pink', textClass: 'text-pink-400', borderClass: 'border-pink-500' },
    { name: 'Slate', textClass: 'text-slate-400', borderClass: 'border-slate-500' },
];

const SwotModal: React.FC<SwotModalProps> = ({ 
    isOpen, activeTool, elements, relationships, modelActions, onClose, 
    onLogHistory, onOpenHistory, documents, folders, onUpdateDocument, 
    modelName, initialDoc, customPrompt, activeModel, aiConfig, isDarkMode,
    customStrategies = [], onSaveCustomStrategies, onOpenGuidance
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  // --- Generic Matrix State ---
  const [matrixData, setMatrixData] = useState<Record<string, MatrixEntry[]>>({});
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  
  const [docTitle, setDocTitle] = useState('Analysis');
  const [promptGuidance, setPromptGuidance] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  // Custom Tool Editing State
  const [editingTool, setEditingTool] = useState<CustomStrategyTool | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const activeConfig = useMemo(() => {
      if (!activeTool) return null;
      if (activeTool === 'custom_create') return null;
      if (activeTool.startsWith('custom-strategy-')) {
          const id = activeTool.replace('custom-strategy-', '');
          const custom = customStrategies?.find(s => s.id === id);
          if (custom) {
              return {
                  title: custom.name,
                  description: custom.description,
                  basePrompt: custom.basePrompt,
                  gridCols: custom.gridCols,
                  categories: custom.categories.map(c => ({
                      id: c.id,
                      label: c.label,
                      tag: c.tag,
                      color: c.color,
                      borderColor: c.borderColor
                  }))
              };
          }
      }
      return MATRIX_CONFIGS[activeTool];
  }, [activeTool, customStrategies]);

  // Helper for colors
  const adaptColor = (cls: string) => isDarkMode ? cls : cls.replace('400', '600');

  // Theme variables
  const bgMain = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderMain = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const borderInput = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const headerBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const panelBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100'; // For Matrix columns bg
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'; // For individual items
  const inputBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const hoverBg = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200';
  const columnHeaderBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textInput = isDarkMode ? 'text-gray-200' : 'text-gray-800';

  useEffect(() => {
      if (isOpen) {
          if (activeTool === 'custom_create') {
              setEditingTool({
                  id: generateUUID(),
                  name: 'New Strategy',
                  description: '',
                  basePrompt: 'Analyze the system using the defined categories.',
                  gridCols: 'grid-cols-2',
                  categories: []
              });
          } else if (initialDoc) {
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
              setPromptGuidance(guidanceDrafts.current[activeTool as string] || '');
          }
          setSuggestions([]);
          setAnalysisText('');
      } else {
          setGeneratedDocId(null);
          setEditingTool(null);
      }
  }, [isOpen, initialDoc, modelName, activeTool, activeConfig]);

  // Handle auto-focus for new items
  useEffect(() => {
      if (focusTargetId) {
          const el = document.getElementById(`matrix-input-${focusTargetId}`);
          if (el) {
              el.focus();
              setFocusTargetId(null);
          }
      }
  }, [focusTargetId, matrixData]);

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
      const items = matrixData[categoryId] || [];
      // Check if there is an item with empty text
      const emptyItem = items.find(i => i.text.trim() === '');
      
      if (emptyItem) {
          setFocusTargetId(emptyItem.id);
          return;
      }

      const newId = generateUUID();
      const newEntry: MatrixEntry = { id: newId, text: '', selected: false };
      setMatrixData(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), newEntry]
      }));
      setFocusTargetId(newId);
  };

  const insertEntry = (categoryId: string, index: number) => {
      const items = matrixData[categoryId] || [];
      // Check if there is an item with empty text to prevent duplicates
      const emptyItem = items.find(i => i.text.trim() === '');
      
      if (emptyItem) {
          setFocusTargetId(emptyItem.id);
          return;
      }

      const newId = generateUUID();
      const newEntry: MatrixEntry = { id: newId, text: '', selected: false };
      setMatrixData(prev => {
          const list = [...(prev[categoryId] || [])];
          list.splice(index, 0, newEntry);
          return {
              ...prev,
              [categoryId]: list
          };
      });
      setFocusTargetId(newId);
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

  const handleEntryKeyDown = (e: React.KeyboardEvent, categoryId: string, index: number) => {
      if (e.key === 'Enter') {
          if (!e.shiftKey) {
              e.preventDefault();
              insertEntry(categoryId, index + 1);
          }
          // If Shift+Enter, allow default behavior (newline)
      }
  };

  const generateMatrixMarkdown = (data: Record<string, MatrixEntry[]>, onlySelected: boolean = false) => {
      if (!activeConfig) return '';
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

      // Determine distinct document type for correct re-opening
      let docType = 'text';
      if (activeTool === 'matrix') docType = 'swot-analysis';
      else if (activeTool === 'five_forces') docType = 'five-forces-analysis';
      else if (activeTool === 'pestel') docType = 'pestel-analysis';
      else if (activeTool === 'steer') docType = 'steer-analysis';
      else if (activeTool === 'destep') docType = 'destep-analysis';
      else if (activeTool === 'longpest') docType = 'longpest-analysis';
      else if (activeTool === 'cage') docType = 'cage-analysis';
      else if (activeTool && (activeTool as string).startsWith('custom-strategy-')) {
          docType = activeTool as string;
      }

      const documentData = { ...matrixData };
      // If it's a custom strategy, embed the full definition so it's portable
      if (activeTool && (activeTool as string).startsWith('custom-strategy-') && customStrategies) {
          const id = activeTool.replace('custom-strategy-', '');
          const customDef = customStrategies.find(s => s.id === id);
          if (customDef) {
              (documentData as any).strategyDefinition = customDef;
          }
      }

      if (generatedDocId) {
          onUpdateDocument(generatedDocId, { 
              title: docTitle, 
              content: content,
              data: documentData,
              folderId: folderId 
          });
      } else {
          const newId = modelActions.createDocument(docTitle, content, docType, documentData);
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

          const responseSchema = {
              type: Type.OBJECT,
              properties: schemaProperties
          };

          const aiResponse = await callAI(
              aiConfig,
              [{ role: 'user', parts: [{ text: prompt }, { text: `GRAPH CONTEXT:\n${graphMarkdown}` }] }],
              undefined,
              undefined,
              responseSchema
          );

          const result = JSON.parse(aiResponse.text || "{}");
          
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

          // Log to AI History
          if (onLogHistory) {
              const summaryLines: string[] = [];
              Object.keys(result).forEach(key => {
                  if (result[key] && Array.isArray(result[key]) && result[key].length > 0) {
                      const categoryLabel = activeConfig.categories.find(c => c.id === key)?.label || key;
                      summaryLines.push(`**${categoryLabel}**: ${result[key].length} items`);
                      result[key].slice(0, 3).forEach((item: string) => summaryLines.push(`- ${item}`));
                      if (result[key].length > 3) summaryLines.push(`- ... (+${result[key].length - 3} more)`);
                  }
              });
              
              if (summaryLines.length > 0) {
                  onLogHistory(
                      `Strategy: ${activeConfig.title}`,
                      `Generated Analysis:\n\n${summaryLines.join('\n')}`,
                      `${activeConfig.title} Generation`,
                      activeTool
                  );
              }
          }

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

  // --- Custom Tool Creator Logic ---

  const handleAddCategory = () => {
      if (!editingTool) return;
      const newCat: CustomStrategyCategory = {
          id: generateUUID(),
          label: 'New Category',
          tag: 'Tag',
          colorName: 'Blue',
          color: 'text-blue-400',
          borderColor: 'border-blue-500'
      };
      setEditingTool({ ...editingTool, categories: [...editingTool.categories, newCat] });
  };

  const handleRemoveCategory = (id: string) => {
      if (!editingTool) return;
      setEditingTool({ ...editingTool, categories: editingTool.categories.filter(c => c.id !== id) });
  };

  const handleUpdateCategory = (id: string, updates: Partial<CustomStrategyCategory>) => {
      if (!editingTool) return;
      setEditingTool({
          ...editingTool,
          categories: editingTool.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      });
  };

  const handleColorChange = (id: string, colorName: string) => {
      const option = COLOR_OPTIONS.find(c => c.name === colorName);
      if (option) {
          handleUpdateCategory(id, {
              colorName: colorName,
              color: option.textClass,
              borderColor: option.borderClass
          });
      }
  };

  const handleSaveCustomTool = () => {
      if (!editingTool || !onSaveCustomStrategies || !customStrategies) return;
      if (!editingTool.name.trim()) { alert("Please provide a name for the tool."); return; }
      if (editingTool.categories.length === 0) { alert("Please add at least one category."); return; }

      // Check for updates vs new
      const existingIdx = customStrategies.findIndex(s => s.id === editingTool.id);
      let newStrategies = [...customStrategies];
      if (existingIdx >= 0) {
          newStrategies[existingIdx] = editingTool;
      } else {
          newStrategies.push(editingTool);
      }
      onSaveCustomStrategies(newStrategies);
      onClose();
  };

  const handleExportTool = () => {
      if (!editingTool) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editingTool, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `strategy-${editingTool.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportTool = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              if (json.name && json.categories) {
                  setEditingTool({ ...json, id: generateUUID() }); // Force new ID on import
              } else {
                  alert("Invalid tool definition.");
              }
          } catch (err) {
              alert("Failed to parse JSON.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  if (!isOpen) return null;

  // --- Render Custom Creator ---
  if (activeTool === 'custom_create' && editingTool) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className={`bg-gray-800 rounded-lg w-full max-w-4xl shadow-2xl border border-gray-600 ${textMain} flex flex-col max-h-[90vh]`}>
                <div className={`p-6 border-b border-gray-700 ${headerBg} rounded-t-lg flex justify-between`}>
                    <h2 className="text-2xl font-bold">Create Custom Strategy Tool</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Tool Name</label>
                            <input 
                                type="text" 
                                value={editingTool.name}
                                onChange={e => setEditingTool({...editingTool, name: e.target.value})}
                                className={`w-full ${inputBg} border ${borderInput} rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                                placeholder="My Analysis Framework"
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Grid Layout</label>
                            <select 
                                value={editingTool.gridCols}
                                onChange={e => setEditingTool({...editingTool, gridCols: e.target.value})}
                                className={`w-full ${inputBg} border ${borderInput} rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                            >
                                <option value="grid-cols-1">1 Column</option>
                                <option value="grid-cols-2">2 Columns</option>
                                <option value="grid-cols-3">3 Columns</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>Description</label>
                        <input 
                            type="text" 
                            value={editingTool.description}
                            onChange={e => setEditingTool({...editingTool, description: e.target.value})}
                            className={`w-full ${inputBg} border ${borderInput} rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                            placeholder="Brief description of what this tool analyzes..."
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${textSub}`}>AI Instructions (Base Prompt)</label>
                        <textarea 
                            value={editingTool.basePrompt}
                            onChange={e => setEditingTool({...editingTool, basePrompt: e.target.value})}
                            className={`w-full ${inputBg} border ${borderInput} rounded px-3 py-2 text-sm font-mono h-24 resize-none focus:outline-none focus:border-blue-500`}
                            placeholder="Instruct the AI on how to perform this analysis..."
                        />
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className={`text-xs font-bold uppercase ${textSub}`}>Categories</label>
                            <button onClick={handleAddCategory} className="text-green-500 hover:text-green-400 text-xs font-bold px-2 py-1 border border-green-500 rounded hover:bg-green-900/30">
                                + Add Category
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {editingTool.categories.map((cat, idx) => (
                                <div key={cat.id} className={`flex items-center gap-2 p-2 rounded border ${borderInput} ${bgMain}`}>
                                    <input 
                                        type="text" 
                                        value={cat.label}
                                        onChange={e => handleUpdateCategory(cat.id, { label: e.target.value })}
                                        className={`flex-grow bg-transparent border-b ${borderInput} px-2 py-1 text-sm focus:outline-none focus:border-blue-500`}
                                        placeholder="Label (e.g. Strengths)"
                                    />
                                    <input 
                                        type="text" 
                                        value={cat.tag}
                                        onChange={e => handleUpdateCategory(cat.id, { tag: e.target.value })}
                                        className={`w-32 bg-transparent border-b ${borderInput} px-2 py-1 text-sm focus:outline-none focus:border-blue-500`}
                                        placeholder="Graph Tag"
                                    />
                                    <select 
                                        value={cat.colorName}
                                        onChange={e => handleColorChange(cat.id, e.target.value)}
                                        className={`w-24 bg-transparent border ${borderInput} rounded text-xs px-1 py-1 focus:outline-none ${cat.color}`}
                                    >
                                        {COLOR_OPTIONS.map(opt => (
                                            <option key={opt.name} value={opt.name} className="text-black">{opt.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleRemoveCategory(cat.id)} className="text-red-500 hover:text-red-400 p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                            {editingTool.categories.length === 0 && (
                                <p className="text-center text-gray-500 text-sm italic py-4">No categories defined.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`p-6 border-t border-gray-700 ${headerBg} rounded-b-lg flex justify-between items-center`}>
                    <div className="flex gap-2">
                        <button onClick={handleExportTool} className="text-xs text-blue-400 hover:text-blue-300 underline">Export JSON</button>
                        <span className="text-gray-600">|</span>
                        <label className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer">
                            Import JSON
                            <input type="file" ref={fileInputRef} onChange={handleImportTool} className="hidden" accept=".json" />
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700 text-gray-300">Cancel</button>
                        <button onClick={handleSaveCustomTool} className="px-6 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold">Save Tool</button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- Matrix Render ---

  if (activeConfig) {
      return (
        <div className="fixed inset-0 pointer-events-none z-[1000]">
            <div 
                className={`absolute ${bgMain} rounded-lg shadow-2xl border border-blue-500/30 ${textMain} flex flex-col overflow-hidden pointer-events-auto`}
                style={{ width: `${size.width}px`, height: `${size.height}px`, left: position.x, top: position.y }}
            >
                {/* Header Bar (Draggable) */}
                <div 
                    className={`h-10 ${headerBg} border-b ${borderMain} flex justify-between items-center px-4 cursor-move select-none flex-shrink-0`}
                    onMouseDown={handleWindowDragStart}
                >
                    <div className="flex items-center gap-2 flex-grow">
                        <span className={`text-sm font-bold uppercase tracking-wider mr-2 ${textMain}`}>{activeConfig.title}:</span>
                        {/* Title Input */}
                        <input 
                            type="text" 
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()} // Allow interacting with input without dragging
                            className={`${inputBg} border ${borderInput} hover:border-blue-500 focus:border-blue-500 rounded px-2 py-0.5 text-sm font-bold ${textMain} outline-none transition-all w-64`}
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
                        <button 
                            onClick={() => handleSaveReport(false)} 
                            className={`bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded transition shadow-sm`}
                            title="Save Full Report"
                        >
                            Report
                        </button>
                        
                        {onOpenGuidance && (
                            <button
                                onClick={onOpenGuidance}
                                className={`p-1.5 rounded transition ${textSub} hover:${textMain} hover:${hoverBg}`}
                                title="Guidance & Tips"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                </svg>
                            </button>
                        )}

                        <button onClick={onClose} className={`${textSub} hover:${textMain} p-1 hover:${hoverBg} rounded transition-colors`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Matrix Content */}
                <div className="flex-grow flex overflow-hidden">
                    {/* Main Matrix Grid */}
                    <div className={`flex-grow grid ${activeConfig.gridCols} ${activeConfig.gridRows || ''} gap-1 p-1 ${panelBg} overflow-hidden h-full`}>
                        {activeConfig.categories.map(cat => {
                            const catItems = matrixData[cat.id] || [];
                            const hasEmpty = catItems.some(i => i.text.trim() === '');
                            
                            return (
                                <div 
                                    key={cat.id} 
                                    className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${cat.borderColor} rounded flex flex-col h-full min-h-0`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDragEnd}
                                >
                                    <div className={`p-2 border-b ${cat.borderColor} ${adaptColor(cat.color)} font-bold uppercase tracking-wider text-sm flex justify-between items-center ${columnHeaderBg} flex-shrink-0`}>
                                        <span>{cat.label}</span>
                                        <button 
                                            onClick={() => addEntry(cat.id)} 
                                            disabled={hasEmpty}
                                            className={`p-1 rounded transition-colors ${hasEmpty ? 'opacity-30 cursor-not-allowed text-gray-500' : `hover:${hoverBg} ${textSub} hover:${textMain}`}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                    <div 
                                        className={`p-2 flex-grow space-y-2 overflow-y-auto custom-scrollbar ${hasEmpty ? 'cursor-default' : 'cursor-pointer'}`}
                                        onDragEnter={(e) => onDragEnter(e, cat.id, 0)}
                                        onClick={(e) => {
                                            if (e.target === e.currentTarget && !hasEmpty) {
                                                addEntry(cat.id);
                                            }
                                        }}
                                    >
                                        {(matrixData[cat.id] || []).map((entry, idx) => (
                                            <div 
                                                key={entry.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, cat.id, idx, entry.id)}
                                                onDragEnter={(e) => onDragEnter(e, cat.id, idx)}
                                                className={`p-2 ${cardBg} rounded border ${borderMain} text-sm group relative ${entry.selected ? 'ring-1 ring-blue-500' : ''} ${draggingId === entry.id ? 'opacity-50' : ''} cursor-auto`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <textarea 
                                                    id={`matrix-input-${entry.id}`}
                                                    value={entry.text}
                                                    onChange={(e) => {
                                                        updateEntry(cat.id, entry.id, e.target.value);
                                                        // Auto-expand
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                    }}
                                                    onKeyDown={(e) => handleEntryKeyDown(e, cat.id, idx)}
                                                    rows={entry.text.split('\n').length > 1 ? entry.text.split('\n').length : 1}
                                                    className={`bg-transparent w-full ${textInput} outline-none resize-none overflow-hidden`}
                                                    placeholder="Enter factor..."
                                                />
                                                <div className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 ${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/90'} rounded shadow-sm`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={entry.selected} 
                                                        onChange={() => toggleSelectEntry(cat.id, entry.id)}
                                                        className="cursor-pointer"
                                                        title="Select for Action"
                                                    />
                                                    <button onClick={() => deleteEntry(cat.id, entry.id)} className="text-red-400 hover:text-red-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(matrixData[cat.id] || []).length === 0 && (
                                            <div className={`${textSub} text-xs text-center py-4 italic pointer-events-none select-none`}>Click + or here to add</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sidebar Controls */}
                    <div className={`w-64 ${panelBg} border-l ${borderMain} p-4 flex flex-col gap-4 flex-shrink-0 overflow-y-auto`}>
                        
                        {/* AI Generation */}
                        <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-white shadow-sm'} p-3 rounded border ${borderMain}`}>
                            <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">AI Analysis</h4>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => handleMatrixAI()}
                                    disabled={isLoading}
                                    className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Analyzing...' : 'Analyze All Categories'}
                                </button>
                                <div className={`text-[10px] ${textSub} text-center my-1`}>- OR -</div>
                                {activeConfig.categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleMatrixAI(cat.id)}
                                        disabled={isLoading}
                                        className={`w-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-50 hover:bg-gray-200 text-gray-600'} hover:text-blue-500 text-xs py-1.5 rounded border ${borderMain} transition text-left px-2 truncate`}
                                    >
                                        Analyze {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prompt Guidance */}
                        <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-white shadow-sm'} p-3 rounded border ${borderMain}`}>
                            <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Context / Guidance</h4>
                            <textarea 
                                value={promptGuidance}
                                onChange={e => {
                                    setPromptGuidance(e.target.value);
                                    guidanceDrafts.current[activeTool as string] = e.target.value;
                                }}
                                placeholder="Optional instructions for AI..."
                                className={`w-full ${inputBg} border ${borderInput} rounded p-2 text-xs ${textMain} h-20 resize-none focus:outline-none focus:border-purple-500`}
                            />
                        </div>

                        {/* Apply Actions */}
                        <div className={`mt-auto pt-4 border-t ${borderMain}`}>
                            <button 
                                onClick={applyToGraph}
                                className="w-full bg-green-700 hover:bg-green-600 text-white text-sm font-bold py-2 rounded transition shadow-lg mb-2"
                            >
                                Create Selected Nodes
                            </button>
                            <p className={`text-[10px] ${textSub} text-center`}>
                                Select checkboxes on items to add them to the graph.
                            </p>
                        </div>

                    </div>
                </div>
                
                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5"
                    onMouseDown={handleResizeStart}
                >
                    <svg viewBox="0 0 10 10" className="w-2 h-2 text-gray-500 opacity-50">
                        <path d="M10 10 L10 0 L0 10 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
      );
  }

  return null;
};

export default SwotModal;
