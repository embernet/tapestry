
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, ColorScheme, RelationshipDirection, ModelMetadata, PanelState, DateFilterState, NodeFilterState, ModelActions, RelationshipDefinition, ScamperSuggestion, SystemPromptConfig, TapestryDocument, TapestryFolder, PanelLayout, TrizToolType, LssToolType, TocToolType, SsmToolType, ExplorerToolType, TagCloudToolType, SwotToolType, MermaidToolType, HistoryEntry, SimulationNodeState, StorySlide, GlobalSettings, MermaidDiagram, CustomStrategyTool, ChatMessage } from './types';
import { DEFAULT_COLOR_SCHEMES, DEFAULT_SYSTEM_PROMPT_CONFIG, AVAILABLE_AI_TOOLS, DEFAULT_TOOL_PROMPTS } from './constants';
import { TOOL_DOCUMENTATION } from './documentation';
import { usePanelDefinitions } from './components/usePanelDefinitions';
import GraphCanvas, { GraphCanvasRef } from './components/GraphCanvas';
import ElementDetailsPanel from './components/ElementDetailsPanel';
import RelationshipDetailsPanel from './components/RelationshipDetailsPanel';
import AddRelationshipPanel from './components/AddRelationshipPanel';
import FilterPanel from './components/FilterPanel';
import ChatPanel from './components/ChatPanel';
import SchemaToolbar from './components/SchemaToolbar';
import AnalysisToolbar from './components/AnalysisToolbar';
import LayoutToolbar from './components/LayoutToolbar';
import BulkEditToolbar from './components/BulkEditToolbar';
import ScamperToolbar from './components/ScamperToolbar';
import ScamperModal from './components/ScamperModal';
import TrizToolbar from './components/TrizToolbar';
import TrizModal from './components/TrizModal';
import LssToolbar from './components/LssToolbar';
import LssModal from './components/LssModal';
import TocToolbar from './components/TocToolbar';
import TocModal from './components/TocModal';
import SsmToolbar from './components/SsmToolbar';
import SsmModal from './components/SsmModal';
import MethodsToolbar from './components/MethodsToolbar';
import ExplorerToolbar from './components/ExplorerToolbar';
import TagCloudToolbar from './components/TagCloudToolbar';
import SwotToolbar from './components/SwotToolbar';
import SwotModal from './components/SwotModal';
import MermaidToolbar from './components/MermaidToolbar';
import CommandBar from './components/CommandBar';
import AiToolbar from './components/AiToolbar';
import RightPanelContainer from './components/RightPanelContainer';
import SettingsModal from './components/SettingsModal';
import { generateUUID, generateMarkdownFromGraph, computeContentHash, isInIframe, generateSelectionReport, callAI, AIConfig, aiLogger } from './utils';
import { TextAnimator, ConflictResolutionModal, ContextMenu, CanvasContextMenu, RelationshipContextMenu, CreateModelModal, SaveAsModal, OpenModelModal, PatternGalleryModal, AboutModal, TapestryBanner, SchemaUpdateModal, SelfTestModal, UserGuideModal, AiDisclaimer, CreatorInfo } from './components/ModalComponents';
import { useModelActions } from './hooks/useModelActions';
import { usePanelState } from './hooks/usePanelState';
import { useTools } from './hooks/useTools';
import { useClickOutside } from './hooks/useClickOutside';
import AppHeader from './components/AppHeader';
import { useSelfTest } from './hooks/useSelfTest';
import { usePersistence } from './hooks/usePersistence';
import { GuidancePanel } from './components/GuidancePanel';
import SearchToolbar from './components/SearchToolbar';
import { DebugPanel } from './components/DebugPanel';

// Explicitly define coordinate type to fix type inference issues
type Coords = { x: number; y: number };

const GLOBAL_SETTINGS_KEY = 'tapestry_global_settings';

// Tools that expand horizontally and should hide others when active
const HORIZONTAL_TOOLS = ['ai', 'search', 'schema', 'layout', 'analysis', 'bulk', 'command', 'mermaid', 'scamper', 'triz', 'lss', 'toc', 'ssm'];

// --- Main App Component ---

export default function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>(DEFAULT_COLOR_SCHEMES);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(DEFAULT_COLOR_SCHEMES[0]?.id || null);
  const [defaultTags, setDefaultTags] = useState<string[]>([]);
  
  // --- Settings State ---
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
      toolsBarOpenByDefault: true,
      theme: 'dark',
      activeProvider: 'gemini',
      aiConnections: {
          gemini: { provider: 'gemini', apiKey: '', modelId: 'gemini-2.5-flash' },
          openai: { provider: 'openai', apiKey: '', modelId: 'gpt-4o' },
          anthropic: { provider: 'anthropic', apiKey: '', modelId: 'claude-3-5-sonnet-20240620' },
          grok: { provider: 'grok', apiKey: '', modelId: 'grok-beta' },
          ollama: { provider: 'ollama', apiKey: 'ollama', baseUrl: 'http://localhost:11434', modelId: 'llama3' },
          custom: { provider: 'custom', apiKey: '', baseUrl: '', modelId: '' }
      },
      customStrategies: [],
      language: 'British English'
  });
  const [systemPromptConfig, setSystemPromptConfig] = useState<SystemPromptConfig>(DEFAULT_SYSTEM_PROMPT_CONFIG);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'prompts'>('general');

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
      try {
          const saved = localStorage.getItem(GLOBAL_SETTINGS_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              return parsed.theme === 'light' ? false : true;
          }
      } catch(e) {}
      return true;
  });

  // --- Documents State ---
  const [documents, setDocuments] = useState<TapestryDocument[]>([]);
  const [folders, setFolders] = useState<TapestryFolder[]>([]);
  const [openDocIds, setOpenDocIds] = useState<string[]>([]);

  // --- History State ---
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [detachedHistoryIds, setDetachedHistoryIds] = useState<string[]>([]);

  // --- Layout Parameters State ---
  const [layoutParams, setLayoutParams] = useState({ linkDistance: 250, repulsion: -400 });
  const [jiggleTrigger, setJiggleTrigger] = useState(0);

  // --- Panel State Hook ---
  const panelState = usePanelState();
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);

  // --- Tools State Hook ---
  const tools = useTools(panelState);
  const { isBulkEditActive, setIsBulkEditActive } = tools;

  // --- Chat & Debug State ---
  // chatConversation: For the AI Assistant UI (persists only for session, shows User <-> AI chat)
  const [chatConversation, setChatConversation] = useState<ChatMessage[]>([]);
  // debugLog: For the Debug Panel (shows raw traffic from ALL tools via aiLogger)
  const [debugLog, setDebugLog] = useState<ChatMessage[]>([]);
  // chatDraftMessage: To prepopulate chat from other tools
  const [chatDraftMessage, setChatDraftMessage] = useState('');

  // --- Bulk Edit State ---
  const [bulkTagsToAdd, setBulkTagsToAdd] = useState<string[]>([]);
  const [bulkTagsToRemove, setBulkTagsToRemove] = useState<string[]>([]);

  // --- Simulation State ---
  const [simulationState, setSimulationState] = useState<Record<string, SimulationNodeState>>({});
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  
  // --- Analysis Highlights & Filtering ---
  const [analysisHighlights, setAnalysisHighlights] = useState<Map<string, string>>(new Map());
  const [analysisFilterState, setAnalysisFilterState] = useState<{ mode: 'hide' | 'hide_others' | 'none', ids: Set<string> }>({ mode: 'none', ids: new Set() });

  // --- Story/Presentation State ---
  const [slides, setSlides] = useState<StorySlide[]>([]);
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(null);

  // --- Mermaid State ---
  const [mermaidDiagrams, setMermaidDiagrams] = useState<MermaidDiagram[]>([]);
  const [isMermaidGenerating, setIsMermaidGenerating] = useState(false);

  // --- Internal Clipboard for Copy/Paste ---
  const [internalClipboard, setInternalClipboard] = useState<{ elements: Element[], relationships: Relationship[] } | null>(null);

  // --- Selection State ---
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [multiSelection, setMultiSelection] = useState<Set<string>>(new Set()); 
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
  const [relationshipContextMenu, setRelationshipContextMenu] = useState<{ x: number, y: number, relationshipId: string } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [panelStateUI, setPanelStateUI] = useState<PanelState>({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  
  // --- Modal States ---
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPatternGalleryModalOpen, setIsPatternGalleryModalOpen] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  
  const [tagFilter, setTagFilter] = useState<{ included: Set<string>, excluded: Set<string> }>({ included: new Set(), excluded: new Set() });
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' });
  const [nodeFilter, setNodeFilter] = useState<NodeFilterState>({ centerId: null, hops: 1, active: false });
  
  const [isPhysicsModeActive, setIsPhysicsModeActive] = useState(false);
  const [originalElements, setOriginalElements] = useState<Element[] | null>(null);
  
  // --- Refs ---
  const graphCanvasRef = useRef<GraphCanvasRef>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const currentFileHandleRef = useRef<any>(null);
  
  // --- Panel System State ---
  const [panelLayouts, setPanelLayouts] = useState<Record<string, PanelLayout>>({});
  const [activeDockedPanelId, setActiveDockedPanelId] = useState<string | null>(null);
  const [panelZIndex, setPanelZIndex] = useState(100);

  // Floating Panel State
  const [floatingPanelPos, setFloatingPanelPos] = useState<{x: number, y: number} | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [detailsPanelPosition, setDetailsPanelPosition] = useState<{x: number, y: number} | null>(null);

  // --- Refs for Synchronous Access in Hooks ---
  const elementsRef = useRef<Element[]>([]);
  const relationshipsRef = useRef<Relationship[]>([]);
  const documentsRef = useRef<TapestryDocument[]>([]);
  const foldersRef = useRef<TapestryFolder[]>([]);

  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { relationshipsRef.current = relationships; }, [relationships]);
  useEffect(() => { documentsRef.current = documents; }, [documents]);
  useEffect(() => { foldersRef.current = folders; }, [folders]);

  // --- Logger Subscription ---
  useEffect(() => {
      const unsubscribe = aiLogger.subscribe((msg: ChatMessage) => {
          // Log to Debug Panel only
          setDebugLog(prev => [...prev, msg]);
      });
      return unsubscribe;
  }, []);

  // --- Load Global Settings ---
  useEffect(() => {
      try {
          const savedSettings = localStorage.getItem(GLOBAL_SETTINGS_KEY);
          if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              // Ensure customStrategies is initialized even if not in old save
              if (!parsed.customStrategies) parsed.customStrategies = [];
              if (!parsed.theme) parsed.theme = 'dark'; // Ensure theme exists
              if (!parsed.language) parsed.language = 'British English'; // Ensure language exists
              setGlobalSettings(prev => ({ ...prev, ...parsed }));
              tools.setIsToolsPanelOpen(parsed.toolsBarOpenByDefault ?? true);
              setIsDarkMode(parsed.theme === 'dark');
          }
      } catch (e) {
          console.error("Failed to load global settings", e);
      }
  }, []);

  const handleGlobalSettingsChange = (settings: GlobalSettings) => {
      setGlobalSettings(settings);
      setIsDarkMode(settings.theme === 'dark');
      localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
  };

  const handleThemeToggle = () => {
      const newTheme = isDarkMode ? 'light' : 'dark';
      const newSettings: GlobalSettings = { ...globalSettings, theme: newTheme };
      handleGlobalSettingsChange(newSettings);
  };

  const handleCustomStrategiesChange = (strategies: CustomStrategyTool[]) => {
      handleGlobalSettingsChange({ ...globalSettings, customStrategies: strategies });
  };

  const aiConfig = useMemo<AIConfig>(() => {
      const provider = globalSettings.activeProvider;
      const conn = globalSettings.aiConnections[provider];
      return {
          provider,
          apiKey: conn?.apiKey || '',
          modelId: conn?.modelId || 'gemini-2.5-flash',
          baseUrl: conn?.baseUrl,
          language: globalSettings.language || 'British English'
      };
  }, [globalSettings]);

  // --- Helpers ---
  const getToolPrompt = useCallback((tool: string, subTool?: string | null) => {
      const prompts = systemPromptConfig.toolPrompts || DEFAULT_TOOL_PROMPTS;
      if (subTool && prompts[`${tool}:${subTool}`]) {
          return prompts[`${tool}:${subTool}`];
      }
      if (prompts[tool]) {
          return prompts[tool];
      }
      return DEFAULT_TOOL_PROMPTS[tool];
  }, [systemPromptConfig]);

  const handleLogHistory = useCallback((tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => {
      const now = new Date().toISOString();
      const newEntry: HistoryEntry = {
          id: generateUUID(),
          tool,
          subTool,
          toolParams,
          timestamp: now,
          content,
          summary
      };
      setHistory(prev => [newEntry, ...prev]);
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
      setHistory(prev => prev.filter(h => h.id !== id));
      setDetachedHistoryIds(prev => prev.filter(did => did !== id));
  }, []);

  const handleAnalyzeWithChat = useCallback((context: string) => {
      setChatDraftMessage(`Context:\n${context}\n\nQuestion: `);
      panelState.setIsChatPanelOpen(true);
  }, [panelState]);

  const handleDetachHistory = useCallback((id: string) => {
      if (!detachedHistoryIds.includes(id)) {
          setDetachedHistoryIds(prev => [...prev, id]);
          const nextZ = panelZIndex + 1;
          setPanelZIndex(nextZ);
          setPanelLayouts(prev => ({
              ...prev,
              [`history-${id}`]: {
                  x: window.innerWidth / 2 - 250,
                  y: window.innerHeight / 2 - 200,
                  w: 500,
                  h: 400,
                  zIndex: nextZ,
                  isFloating: true
              }
          }));
      }
  }, [detachedHistoryIds, panelZIndex]);

  // --- Tool Handlers ---
  const handleTrizToolSelect = (tool: TrizToolType) => { tools.setActiveTrizTool(tool); tools.setIsTrizModalOpen(true); tools.setTrizInitialParams(null); tools.setActiveTool(null); };
  const handleLssToolSelect = (tool: LssToolType) => { tools.setActiveLssTool(tool); tools.setIsLssModalOpen(true); tools.setLssInitialParams(null); tools.setActiveTool(null); };
  const handleTocToolSelect = (tool: TocToolType) => { tools.setActiveTocTool(tool); tools.setIsTocModalOpen(true); tools.setTocInitialParams(null); tools.setActiveTool(null); };
  const handleSsmToolSelect = (tool: SsmToolType) => { tools.setActiveSsmTool(tool); tools.setIsSsmModalOpen(true); tools.setSsmInitialParams(null); tools.setActiveTool(null); };
  const handleExplorerToolSelect = (tool: ExplorerToolType) => {
      if (tool === 'treemap') panelState.setIsTreemapPanelOpen(prev => !prev);
      if (tool === 'tags') panelState.setIsTagDistPanelOpen(prev => !prev);
      if (tool === 'relationships') panelState.setIsRelDistPanelOpen(prev => !prev);
      if (tool === 'sunburst') {
          panelState.setIsSunburstPanelOpen(prev => !prev);
          panelState.setSunburstState(prev => ({ ...prev, active: true }));
      }
      if (tool === 'matrix') panelState.setIsMatrixPanelOpen(prev => !prev);
      if (tool === 'table') panelState.setIsTablePanelOpen(prev => !prev);
      tools.setActiveTool(null); 
  };
  const handleTagCloudToolSelect = (tool: TagCloudToolType) => {
      // Create a large default centered layout for Cloud tools if not present
      const width = Math.min(window.innerWidth * 0.8, 1000);
      const height = Math.min(window.innerHeight * 0.8, 800);
      const x = (window.innerWidth - width) / 2;
      const y = (window.innerHeight - height) / 2;
      
      const defaultLayout = { 
          x, 
          y, 
          w: width, 
          h: height, 
          zIndex: panelZIndex + 1, 
          isFloating: true 
      };

      setPanelZIndex(prev => prev + 1);

      if (tool === 'tags') {
          panelState.setIsConceptCloudOpen(prev => !prev);
          if (!panelLayouts['concept-cloud']) setPanelLayouts(prev => ({ ...prev, 'concept-cloud': defaultLayout }));
      } else if (tool === 'nodes') {
          panelState.setIsInfluenceCloudOpen(prev => !prev);
          if (!panelLayouts['influence-cloud']) setPanelLayouts(prev => ({ ...prev, 'influence-cloud': defaultLayout }));
      } else if (tool === 'words') {
          panelState.setIsTextAnalysisOpen(prev => !prev);
          if (!panelLayouts['text-cloud']) setPanelLayouts(prev => ({ ...prev, 'text-cloud': defaultLayout }));
      } else if (tool === 'full_text') {
          panelState.setIsFullTextAnalysisOpen(prev => !prev);
          if (!panelLayouts['full-text-cloud']) setPanelLayouts(prev => ({ ...prev, 'full-text-cloud': defaultLayout }));
      }
      tools.setActiveTool(null);
  };
  const handleSwotToolSelect = (tool: SwotToolType) => { tools.setActiveSwotTool(tool); tools.setSwotInitialDoc(null); tools.setIsSwotModalOpen(true); tools.setActiveTool(null); };
  const handleMermaidToolSelect = (tool: MermaidToolType) => { if (tool === 'editor') panelState.setIsMermaidPanelOpen(true); tools.setActiveTool(null); };

  const handleAiToolSelect = useCallback((toolId: string) => {
    tools.setActiveTool(null); // Close dropdown
    
    if (toolId === 'chat') {
        panelState.setIsChatPanelOpen(true);
    } else if (toolId === 'expand') {
        if (selectedElementId) {
             const el = elements.find(e => e.id === selectedElementId);
             if (el) setChatDraftMessage(`Suggest 5 related concepts to "${el.name}" and add them to the graph.`);
        } else {
             setChatDraftMessage(`Suggest 5 new concepts related to the current graph and add them.`);
        }
        panelState.setIsChatPanelOpen(true);
    } else if (toolId === 'connect') {
        setChatDraftMessage(`Analyze the current graph nodes and suggest meaningful relationships between them that are currently missing.`);
        panelState.setIsChatPanelOpen(true);
    } else if (toolId === 'critique') {
        setChatDraftMessage(`Critique the current graph model. Identify logical gaps, circular reasoning, ambiguities, or missing key perspectives.`);
        panelState.setIsChatPanelOpen(true);
    }
}, [elements, selectedElementId, panelState, tools]);


  useEffect(() => { if (tools.activeTool !== 'bulk') { setIsBulkEditActive(false); } }, [tools.activeTool]);

  // --- Use Hooks ---
  const { runSelfTest, isSelfTestModalOpen, setIsSelfTestModalOpen, testLogs, testStatus } = useSelfTest({ panelState, tools, setPanelLayouts });
  
  const persistence = usePersistence({
      setElements, setRelationships, setDocuments, setFolders, setHistory, setSlides, setMermaidDiagrams,
      setColorSchemes, setActiveSchemeId, setSystemPromptConfig, setOpenDocIds, setDetachedHistoryIds,
      setPanelLayouts, setAnalysisHighlights, setAnalysisFilterState, setMultiSelection, setSelectedElementId,
      setTagFilter, setDateFilter, currentFileHandleRef,
      elementsRef, relationshipsRef, documentsRef, foldersRef,
      colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams
  });

  // --- Reset Chat on new model ---
  useEffect(() => {
      if (persistence.currentModelId) {
          setChatConversation([{ role: 'model', text: "Hello! I'm your AI assistant. Ask me anything about your current model, or ask me to make changes to it." }]);
      }
  }, [persistence.currentModelId]);

  const allTags = useMemo(() => { const tags = new Set<string>(); elements.forEach(element => { element.tags.forEach(tag => tags.add(tag)); }); return Array.from(tags).sort(); }, [elements]);
  const tagCounts = useMemo(() => { const counts = new Map<string, number>(); elements.forEach(element => { element.tags.forEach(tag => { counts.set(tag, (counts.get(tag) || 0) + 1); }); }); return counts; }, [elements]);
  useEffect(() => { setTagFilter(prevFilter => { const allTagsSet = new Set(allTags); const newIncluded = new Set<string>(); for (const tag of allTags) { const wasPreviouslyIncluded = prevFilter.included.has(tag); const wasPreviouslyExcluded = prevFilter.excluded.has(tag); if (wasPreviouslyIncluded) { newIncluded.add(tag); } else if (!wasPreviouslyExcluded) { newIncluded.add(tag); } } const newExcluded = new Set<string>(); for (const tag of prevFilter.excluded) { if (allTagsSet.has(tag)) { newExcluded.add(tag); } } return { included: newIncluded, excluded: newExcluded }; }); }, [allTags]);
  
  // --- Sunburst & Filter Logic ---
  const getSunburstNodes = useCallback((centerId: string, depth: number) => {
      const visibleIds = new Set<string>([centerId]);
      let currentLayer = [centerId];
      for (let i = 0; i < depth; i++) {
          const nextLayer: string[] = [];
          currentLayer.forEach(nodeId => {
              relationships.forEach(rel => {
                  if (rel.source === nodeId && !visibleIds.has(rel.target as string)) { visibleIds.add(rel.target as string); nextLayer.push(rel.target as string); }
                  if (rel.target === nodeId && !visibleIds.has(rel.source as string)) { visibleIds.add(rel.source as string); nextLayer.push(rel.source as string); }
              });
          });
          currentLayer = nextLayer;
      }
      return visibleIds;
  }, [relationships]);

  const filteredElements = useMemo(() => { 
      // Handle Sunburst Panel View
      if (panelState.isSunburstPanelOpen && panelState.sunburstState.active && panelState.sunburstState.centerId) {
          const visibleIds = getSunburstNodes(panelState.sunburstState.centerId, panelState.sunburstState.hops);
          return elements.filter(e => visibleIds.has(e.id));
      }

      // Handle Standard Filtering
      let currentElements = elements;

      // 1. Date Filter
      const matchesDate = (element: Element) => { 
          const createdDate = element.createdAt.substring(0, 10); 
          const updatedDate = element.updatedAt.substring(0, 10); 
          if (dateFilter.createdAfter && createdDate < dateFilter.createdAfter) return false; 
          if (dateFilter.createdBefore && createdDate > dateFilter.createdBefore) return false; 
          if (dateFilter.updatedAfter && updatedDate < dateFilter.updatedAfter) return false; 
          if (dateFilter.updatedBefore && updatedDate > dateFilter.updatedBefore) return false; 
          return true; 
      };
      
      currentElements = currentElements.filter(matchesDate);

      // 2. Node Hops Filter (New)
      if (nodeFilter.active && nodeFilter.centerId) {
          const visibleIds = getSunburstNodes(nodeFilter.centerId, nodeFilter.hops);
          currentElements = currentElements.filter(e => visibleIds.has(e.id));
      }

      // 3. Analysis Filter (Hide/Hide Others)
      if (analysisFilterState.mode === 'hide') {
          currentElements = currentElements.filter(e => !analysisFilterState.ids.has(e.id));
      } else if (analysisFilterState.mode === 'hide_others') {
          currentElements = currentElements.filter(e => analysisFilterState.ids.has(e.id));
      }

      // 4. Tag Filter
      const { included, excluded } = tagFilter;
      currentElements = currentElements.filter(element => { 
          if (excluded.has(element.tags.find(t => excluded.has(t)) || '')) return false; // Optimization? No, simple logic:
          if (element.tags.some(tag => excluded.has(tag))) return false; 
          
          // If no tags are explicitly excluded and all tags are included (default state), show everything
          if (excluded.size === 0 && included.size === allTags.length) return true; 
          
          // If node has no tags, show it (unless hidden by other means) - mimicking default behavior where untagged are usually visible unless strictly filtering for specific tags
          if (element.tags.length === 0) return true; 
          
          return element.tags.some(tag => included.has(tag)); 
      }); 

      return currentElements;
  }, [elements, tagFilter, allTags, dateFilter, analysisFilterState, panelState.isSunburstPanelOpen, panelState.sunburstState, getSunburstNodes, nodeFilter]);

  const filteredRelationships = useMemo(() => { 
      const visibleElementIds = new Set(filteredElements.map(f => f.id)); 
      return relationships.filter(rel => visibleElementIds.has(rel.source as string) && visibleElementIds.has(rel.target as string)); 
  }, [relationships, filteredElements]);

  const handleDeleteElement = useCallback((elementId: string) => { setElements(prev => prev.filter(f => f.id !== elementId)); setRelationships(prev => prev.filter(r => r.source !== elementId && r.target !== elementId)); if (selectedElementId === elementId) { setSelectedElementId(null); } if (multiSelection.has(elementId)) { const next = new Set(multiSelection); next.delete(elementId); setMultiSelection(next); } }, [selectedElementId, multiSelection]);
  
  // --- Actions ---
  const handleAddElement = useCallback((coords: { x: number; y: number }) => { const now = new Date().toISOString(); const newElement: Element = { id: generateUUID(), name: 'New Element', notes: '', tags: [...defaultTags], createdAt: now, updatedAt: now, x: coords.x, y: coords.y, fx: coords.x, fy: coords.x, }; setElements(prev => [...prev, newElement]); setSelectedElementId(newElement.id); setMultiSelection(new Set([newElement.id])); setSelectedRelationshipId(null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); }, [defaultTags]);
  const handleAddElementFromName = useCallback((name: string) => { const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2; const randomOffset = () => (Math.random() - 0.5) * 100; const now = new Date().toISOString(); const newElement: Element = { id: generateUUID(), name: name, notes: '', tags: [...defaultTags], createdAt: now, updatedAt: now, x: centerX + randomOffset(), y: centerY + randomOffset(), fx: null, fy: null, }; setElements(prev => [...prev, newElement]); }, [defaultTags]);
  const handleUpdateElement = useCallback((updatedElement: Element) => { setElements(prev => prev.map(f => f.id === updatedElement.id ? { ...updatedElement, updatedAt: new Date().toISOString() } : f)); }, []);
  const handleBulkTagAction = useCallback((elementIds: string[], tag: string, mode: 'add' | 'remove') => { setElements(prev => prev.map(e => { if (elementIds.includes(e.id)) { let newTags = [...e.tags]; if (mode === 'add') { if (!newTags.includes(tag)) { newTags.push(tag); } else { return e; } } else { if (newTags.includes(tag)) { newTags = newTags.filter(t => t !== tag); } else { return e; } } return { ...e, tags: newTags, updatedAt: new Date().toISOString() }; } return e; })); }, []);
  const handleAddRelationship = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>, newElementData?: Omit<Element, 'id' | 'createdAt' | 'updatedAt'>) => { let finalRelationship: Relationship = { ...relationship, id: generateUUID(), tags: [] }; if (newElementData) { const now = new Date().toISOString(); const newElement: Element = { ...newElementData, id: generateUUID(), createdAt: now, updatedAt: now, }; setElements(prev => [...prev, newElement]); finalRelationship.target = newElement.id; } setRelationships(prev => [...prev, finalRelationship]); if (newElementData) { setSelectedElementId(panelStateUI.sourceElementId || null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); } else { setSelectedRelationshipId(finalRelationship.id); setSelectedElementId(null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); } }, [panelStateUI.sourceElementId]);
  const handleAddRelationshipDirect = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>) => { const newRel: Relationship = { ...relationship, id: generateUUID(), tags: [] }; setRelationships(prev => [...prev, newRel]); }, []);
  const handleCancelAddRelationship = useCallback(() => { if (panelStateUI.isNewTarget && panelStateUI.targetElementId) { handleDeleteElement(panelStateUI.targetElementId); } setSelectedElementId(panelStateUI.sourceElementId || null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); }, [panelStateUI, handleDeleteElement]);
  const handleUpdateRelationship = useCallback((updatedRelationship: Relationship) => { setRelationships(prev => prev.map(r => r.id === updatedRelationship.id ? updatedRelationship : r)); }, []);
  const handleDeleteRelationship = useCallback((relationshipId: string) => { setRelationships(prev => prev.filter(r => r.id !== relationshipId)); setSelectedRelationshipId(null); }, []);
  const handleCreateFolder = useCallback((name: string) => { const newFolder: TapestryFolder = { id: generateUUID(), name, parentId: null, createdAt: new Date().toISOString() }; setFolders(prev => [...prev, newFolder]); }, []);
  const handleCreateDocument = useCallback((folderId: string | null, type: string = 'text', data?: any) => { const now = new Date().toISOString(); const newDoc: TapestryDocument = { id: generateUUID(), title: 'Untitled Document', content: '', folderId, createdAt: now, updatedAt: now, type, data }; setDocuments(prev => [...prev, newDoc]); setOpenDocIds(prev => [...prev, newDoc.id]); }, []);
  const handleDeleteDocument = useCallback((docId: string) => { if (confirm("Delete this document?")) { setDocuments(prev => prev.filter(d => d.id !== docId)); setOpenDocIds(prev => prev.filter(id => id !== docId)); } }, []);
  const handleDeleteFolder = useCallback((folderId: string) => { if (confirm("Delete this folder and all its contents?")) { setFolders(prev => prev.filter(f => f.id !== folderId)); setDocuments(prev => prev.filter(d => d.folderId !== folderId)); } }, []);
  const handleUpdateDocument = useCallback((docId: string, updates: Partial<TapestryDocument>) => { setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)); }, []);
  
  const handleOpenDocument = useCallback((docId: string, origin?: 'report') => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;
        if (doc.type === 'swot-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('matrix'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; } 
        else if (doc.type === 'five-forces-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('five_forces'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; } 
        else if (doc.type === 'pestel-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('pestel'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; } 
        else if (doc.type === 'steer-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('steer'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; }
        else if (doc.type === 'destep-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('destep'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; }
        else if (doc.type === 'longpest-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('longpest'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; }
        else if (doc.type === 'cage-analysis') { tools.setActiveTool('swot'); tools.setActiveSwotTool('cage'); tools.setSwotInitialDoc(doc); tools.setIsSwotModalOpen(true); return; }
        else if (doc.type && doc.type.startsWith('custom-strategy-')) { 
            // Handle Custom Strategy Document
            const strategyId = doc.type.replace('custom-strategy-', '');
            
            // Check if the strategy definition is embedded in the document
            if (doc.data && doc.data.strategyDefinition) {
                // Ensure the strategy exists in global settings, or add it
                const existing = globalSettings.customStrategies.find(s => s.id === strategyId);
                if (!existing) {
                    handleCustomStrategiesChange([...globalSettings.customStrategies, doc.data.strategyDefinition]);
                }
            }
            
            tools.setActiveTool('swot'); 
            tools.setActiveSwotTool(`custom-strategy-${strategyId}`); 
            tools.setSwotInitialDoc(doc); 
            tools.setIsSwotModalOpen(true); 
            return; 
        }
        else if (doc.type === 'scamper-analysis') { tools.setActiveTool('scamper'); tools.setScamperInitialDoc(doc); tools.setIsScamperModalOpen(true); return; }
        else if (doc.type === 'triz-analysis') { tools.setActiveTool('triz'); tools.setTrizInitialParams(null); tools.setIsTrizModalOpen(true); return; } 
        
        if (!openDocIds.includes(docId)) { setOpenDocIds(prev => [...prev, docId]); }
        if (origin === 'report') { 
            const reportLayout = panelLayouts['report']; 
            let x = 100, y = 100; 
            if (reportLayout && reportLayout.isFloating) { x = reportLayout.x + reportLayout.w + 20; y = reportLayout.y; } else if (panelState.isReportPanelOpen) { x = window.innerWidth - 600 - 520; y = 100; } 
            if (x < 20) x = 20; if (x > window.innerWidth - 100) x = window.innerWidth - 600; 
            const nextZ = panelZIndex + 1; 
            setPanelZIndex(nextZ); 
            setPanelLayouts(prev => ({ ...prev, [`doc-${docId}`]: { x, y, w: 500, h: 600, zIndex: nextZ, isFloating: true } })); 
        }
  }, [documents, openDocIds, panelLayouts, panelState.isReportPanelOpen, panelZIndex, tools, globalSettings.customStrategies]);

  const handleSaveMermaidDiagram = useCallback((diagram: MermaidDiagram) => { setMermaidDiagrams(prev => { const existingIndex = prev.findIndex(d => d.id === diagram.id); if (existingIndex >= 0) { const newDiagrams = [...prev]; newDiagrams[existingIndex] = diagram; return newDiagrams; } else { return [...prev, diagram]; } }); }, []);
  const handleDeleteMermaidDiagram = useCallback((id: string) => { if (confirm("Delete this diagram?")) { setMermaidDiagrams(prev => prev.filter(d => d.id !== id)); } }, []);
  const handleGenerateMermaid = useCallback(async (prompt: string, contextMarkdown?: string) => { setIsMermaidGenerating(true); try { const graphMarkdown = contextMarkdown || generateMarkdownFromGraph(elements, relationships); const fullPrompt = `You are an expert in Mermaid.js diagram syntax. The user wants you to generate or update a Mermaid diagram based on the following knowledge graph data. TASK: ${prompt} GRAPH CONTEXT (Markdown Format): ${graphMarkdown} Instructions: 1. Analyze the graph context. 2. Generate valid Mermaid markdown code that visualizes this structure according to the user's specific request. 3. ONLY return the mermaid code block (enclosed in \`\`\`mermaid ... \`\`\`).`; const response = await callAI(aiConfig, fullPrompt); return response.text || ""; } catch (e) { console.error("Mermaid Gen Error", e); alert("Failed to generate diagram."); return ""; } finally { setIsMermaidGenerating(false); } }, [elements, relationships, aiConfig]);

  const aiActions: ModelActions = useModelActions({ elementsRef, setElements, relationshipsRef, setRelationships, documentsRef, setDocuments, foldersRef, setFolders, openDocIds, setOpenDocIds, onDeleteElement: handleDeleteElement });

  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);
  const handleCloseCanvasContextMenu = useCallback(() => setCanvasContextMenu(null), []);
  const handleCloseRelationshipContextMenu = useCallback(() => setRelationshipContextMenu(null), []);
  
  const runImpactSimulation = (startNodeId: string) => {
      const newSimState: Record<string, SimulationNodeState> = {};
      const queue: { id: string, state: SimulationNodeState }[] = [];
      newSimState[startNodeId] = simulationState[startNodeId] === 'increased' ? 'decreased' : 'increased';
      queue.push({ id: startNodeId, state: newSimState[startNodeId] });
      const visited = new Set<string>();
      visited.add(startNodeId);
      const isPositive = (label: string) => ['causes', 'increases', 'promotes', 'leads to', 'produces', 'enables', 'enhances', 'amplifies', 'reinforces'].some(k => label.toLowerCase().includes(k));
      const isNegative = (label: string) => ['inhibits', 'decreases', 'prevents', 'reduces', 'stops', 'block', 'counteracts'].some(k => label.toLowerCase().includes(k));
      while (queue.length > 0) {
          const { id, state } = queue.shift()!;
          const outgoing = relationships.filter(r => r.source === id);
          outgoing.forEach(rel => {
              const targetId = rel.target as string;
              if (visited.has(targetId)) return;
              let nextState: SimulationNodeState = 'neutral';
              if (isPositive(rel.label)) { nextState = state; } else if (isNegative(rel.label)) { nextState = state === 'increased' ? 'decreased' : 'increased'; }
              if (nextState !== 'neutral') { newSimState[targetId] = nextState; visited.add(targetId); queue.push({ id: targetId, state: nextState }); }
          });
      }
      setSimulationState(newSimState);
  };

  const handleAnalysisHighlight = useCallback((highlightMap: Map<string, string>) => { setAnalysisHighlights(highlightMap); }, []);
  const handleAnalysisFilter = useCallback((mode: 'hide' | 'hide_others' | 'none', ids: Set<string>) => { setAnalysisFilterState({ mode, ids }); }, []);

  const handleNodeClick = useCallback((elementId: string, event: MouseEvent) => { 
      if (isSimulationMode) { runImpactSimulation(elementId); return; }
      if (panelState.isSunburstPanelOpen && panelState.sunburstState.active) {
          if (!originalElements && !panelState.sunburstState.centerId) { setOriginalElements(elements); }
          const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
          setElements(prev => prev.map(e => { if (e.id === elementId) { return { ...e, x: cx, y: cy, fx: cx, fy: cy, vx: 0, vy: 0 }; } return { ...e, fx: null, fy: null }; }));
          panelState.setSunburstState(prev => ({ ...prev, centerId: elementId }));
          setIsPhysicsModeActive(true);
          setSelectedElementId(elementId);
          setMultiSelection(new Set([elementId]));
          setTimeout(() => { if (graphCanvasRef.current) { graphCanvasRef.current.setCamera(0, 0, 1); } }, 50);
          return;
      }
      if (isBulkEditActive) { if (bulkTagsToAdd.length === 0 && bulkTagsToRemove.length === 0) return; setElements(prev => prev.map(el => { if (el.id === elementId) { const currentTags = el.tags; let newTags = [...currentTags]; let changed = false; const lowerToRemove = bulkTagsToRemove.map(t => t.toLowerCase()); const filteredTags = newTags.filter(t => !lowerToRemove.includes(t.toLowerCase())); if (filteredTags.length !== newTags.length) { newTags = filteredTags; changed = true; } const lowerCurrent = newTags.map(t => t.toLowerCase()); const toAdd = bulkTagsToAdd.filter(t => !lowerCurrent.includes(t.toLowerCase())); if (toAdd.length > 0) { newTags = [...newTags, ...toAdd]; changed = true; } if (changed) { return { ...el, tags: newTags, updatedAt: new Date().toISOString() }; } } return el; })); return; } 
      if (event.ctrlKey || event.metaKey) { const newMulti = new Set(multiSelection); if (newMulti.has(elementId)) { newMulti.delete(elementId); } else { newMulti.add(elementId); } setMultiSelection(newMulti); if (newMulti.has(elementId)) { setSelectedElementId(elementId); } else if (selectedElementId === elementId) { setSelectedElementId(newMulti.size > 0 ? Array.from(newMulti).pop() || null : null); } } else { setMultiSelection(new Set([elementId])); setSelectedElementId(elementId); }
      setSelectedRelationshipId(null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); handleCloseRelationshipContextMenu();
  }, [handleCloseContextMenu, isBulkEditActive, bulkTagsToAdd, bulkTagsToRemove, isSimulationMode, relationships, simulationState, multiSelection, selectedElementId, panelState.isSunburstPanelOpen, panelState.sunburstState, elements, originalElements, panelState, handleCloseRelationshipContextMenu]);
  
  const handleLinkClick = useCallback((relationshipId: string) => { setSelectedRelationshipId(relationshipId); setSelectedElementId(null); setMultiSelection(new Set()); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); handleCloseRelationshipContextMenu(); }, [handleCloseContextMenu, handleCloseRelationshipContextMenu]);
  const handleCanvasClick = useCallback(() => { setSelectedElementId(null); setMultiSelection(new Set()); setSelectedRelationshipId(null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); handleCloseCanvasContextMenu(); handleCloseRelationshipContextMenu(); setAnalysisHighlights(new Map()); }, [handleCloseContextMenu, handleCloseCanvasContextMenu, handleCloseRelationshipContextMenu]);
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, elementId: string) => { event.preventDefault(); setContextMenu({ x: event.clientX, y: event.clientY, elementId }); handleCloseCanvasContextMenu(); handleCloseRelationshipContextMenu(); }, [handleCloseCanvasContextMenu, handleCloseRelationshipContextMenu]);
  
  const handleLinkContextMenu = useCallback((event: React.MouseEvent, relationshipId: string) => {
      event.preventDefault();
      setRelationshipContextMenu({ x: event.clientX, y: event.clientY, relationshipId });
      handleCloseContextMenu();
      handleCloseCanvasContextMenu();
  }, [handleCloseContextMenu, handleCloseCanvasContextMenu]);

  const handleChangeRelationshipDirection = useCallback((relationshipId: string, direction: RelationshipDirection) => {
      setRelationships(prev => prev.map(r => r.id === relationshipId ? { ...r, direction } : r));
  }, []);

  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => { event.preventDefault(); setCanvasContextMenu({ x: event.clientX, y: event.clientY }); handleCloseContextMenu(); handleCloseRelationshipContextMenu(); }, [handleCloseContextMenu, handleCloseRelationshipContextMenu]);
  const handleNodeConnect = useCallback((sourceId: string, targetId: string) => { const currentScheme = colorSchemes.find(s => s.id === activeSchemeId); let defaultLabel = ''; if (currentScheme && currentScheme.defaultRelationshipLabel) { defaultLabel = currentScheme.defaultRelationshipLabel; } const newRelId = generateUUID(); const newRel: Relationship = { id: newRelId, source: sourceId, target: targetId, label: defaultLabel, direction: RelationshipDirection.To, tags: [] }; setRelationships(prev => [...prev, newRel]); setSelectedRelationshipId(newRelId); setSelectedElementId(null); setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); }, [activeSchemeId, colorSchemes, handleCloseContextMenu]);
  const handleNodeConnectToNew = useCallback((sourceId: string, coords: { x: number; y: number }) => { 
      const now = new Date().toISOString(); 
      const newElement: Element = { id: generateUUID(), name: 'New Element', notes: '', tags: [...defaultTags], createdAt: now, updatedAt: now, x: coords.x, y: coords.y, fx: coords.x, fy: coords.y, }; 
      setElements(prev => [...prev, newElement]); 
      
      // Auto-create relationship immediately
      const currentScheme = colorSchemes.find(s => s.id === activeSchemeId);
      const defaultLabel = currentScheme?.defaultRelationshipLabel || '';
      
      const newRel: Relationship = {
          id: generateUUID(),
          source: sourceId,
          target: newElement.id,
          label: defaultLabel,
          direction: RelationshipDirection.To,
          tags: []
      };
      setRelationships(prev => [...prev, newRel]);
      
      setPanelStateUI({ view: 'addRelationship', sourceElementId: sourceId, targetElementId: newElement.id, isNewTarget: true }); 
      setSelectedElementId(null); 
      setSelectedRelationshipId(null); 
      handleCloseContextMenu(); 
  }, [defaultTags, handleCloseContextMenu, colorSchemes, activeSchemeId]);

  const handleUpdateDefaultRelationship = (newLabel: string) => { if (!activeSchemeId) return; setColorSchemes(prev => prev.map(s => s.id === activeSchemeId ? { ...s, defaultRelationshipLabel: newLabel } : s)); };
  const handleToggleFocusMode = () => { setFocusMode(prev => { if (prev === 'narrow') return 'wide'; if (prev === 'wide') return 'zoom'; return 'narrow'; }); };
  
  const handleCopy = async () => {
      const idsToCopy = multiSelection.size > 0 ? Array.from(multiSelection) : (selectedElementId ? [selectedElementId] : []);
      if (idsToCopy.length === 0) return;
      const selectedEls = elements.filter(e => idsToCopy.includes(e.id));
      const selectedRels = relationships.filter(r => idsToCopy.includes(r.source as string) && idsToCopy.includes(r.target as string));
      const textReport = generateSelectionReport(selectedEls, selectedRels);
      setInternalClipboard({ elements: selectedEls, relationships: selectedRels });
      try { await navigator.clipboard.writeText(textReport); alert(`Copied ${selectedEls.length} items to clipboard (Text Report). App-data ready for paste.`); } catch (err) { console.warn("Copy failed", err); alert("Failed to copy text to system clipboard."); }
  };

  const handlePaste = () => {
      if (!internalClipboard) { alert("Internal clipboard is empty."); return; }
      const { elements: pastedElements, relationships: pastedRelationships } = internalClipboard;
      if (pastedElements.length === 0) return;
      const idMap = new Map<string, string>();
      const now = new Date().toISOString();
      pastedElements.forEach((el: Element) => { idMap.set(el.id, generateUUID()); });
      const newElements = pastedElements.map((el: Element) => ({ ...el, id: idMap.get(el.id)!, x: (el.x || 0) + 50, y: (el.y || 0) + 50, fx: (el.fx ? el.fx + 50 : null), fy: (el.fy ? el.fy + 50 : null), createdAt: now, updatedAt: now }));
      const newRelationships = pastedRelationships.map((rel: Relationship) => ({ ...rel, id: generateUUID(), source: idMap.get(rel.source as string) || rel.source, target: idMap.get(rel.target as string) || rel.target }));
      setElements(prev => [...prev, ...newElements]);
      setRelationships(prev => [...prev, ...newRelationships]);
      const newSelection = new Set(newElements.map((e: Element) => e.id));
      setMultiSelection(newSelection);
      if (newElements.length > 0) setSelectedElementId(newElements[0].id);
  };

  const handleApplyMarkdown = (markdown: string, shouldMerge: boolean = false) => { 
    // Logic for markdown parsing (abbreviated for brevity as requested to minimize changes if possible, but this needs to be here)
    // Reusing the existing parser logic
    let processedMarkdown = markdown.replace(/\s*\/>\s*/g, ' -[Counteracts]-> ').replace(/(?<!\-|\[)>(?!\-|\])/g, ' -[Produces]-> '); 
    const lines = processedMarkdown.split('\n').filter(line => { const trimmed = line.trim(); return trimmed !== '' && !trimmed.startsWith('#'); }); 
    const parsedElements = new Map<string, { tags: string[] }>(); 
    const parsedRels: { sourceName: string, targetName: string, label: string, direction: RelationshipDirection }[] = []; 
    function parseElementStr(str: string) { let workStr = str.trim(); if (!workStr) return null; let name: string; let tags: string[] = []; const lastColonIndex = workStr.lastIndexOf(':'); const lastParenOpenIndex = workStr.lastIndexOf('('); if (lastColonIndex > -1 && lastColonIndex > lastParenOpenIndex) { const tagsStr = workStr.substring(lastColonIndex + 1); tags = tagsStr.split(',').map(t => t.trim()).filter(t => !!t); workStr = workStr.substring(0, lastColonIndex).trim(); } if (workStr.endsWith('+')) { workStr = workStr.slice(0, -1).trim(); tags.push('Useful'); } else if (workStr.endsWith('-')) { workStr = workStr.slice(0, -1).trim(); tags.push('Harmful'); } name = workStr; if (name.startsWith('"') && name.endsWith('"')) { name = name.substring(1, name.length - 1); } if (!name) return null; return { name, tags }; }
    function updateParsedElement(elementData: { name: string, tags: string[] }) { const existing = parsedElements.get(elementData.name); if (existing) { const newTags = [...new Set([...existing.tags, ...elementData.tags])]; parsedElements.set(elementData.name, { tags: newTags }); } else { parsedElements.set(elementData.name, { tags: elementData.tags }); } }
    for (const line of lines) { 
        const relSeparatorRegex = /(<?-\[.*?]->?)/g; 
        const parts = line.split(relSeparatorRegex); 
        const tokens = parts.map(p => p.trim()).filter(t => !!t); 
        if (tokens.length === 0) continue; 
        if (tokens.length === 1) { 
            const element = parseElementStr(tokens[0]); 
            if (element) { updateParsedElement(element); } 
            continue; 
        } 
        let currentSourceElementStr = tokens.shift(); 
        while (tokens.length > 0) { 
            const relStr = tokens.shift(); 
            const targetsStr = tokens.shift(); 
            if (!currentSourceElementStr || !relStr || !targetsStr) break; 
            const sourceElementData = parseElementStr(currentSourceElementStr); 
            if (!sourceElementData) break; 
            updateParsedElement(sourceElementData); 
            const singleRelRegex = /<?-\[(.*?)]->?/; 
            const relMatch = relStr.match(singleRelRegex); 
            if (!relMatch) break; 
            const label = relMatch[1]; 
            let direction = RelationshipDirection.None; 
            if (relStr.startsWith('<-') && relStr.endsWith('->')) direction = RelationshipDirection.Both; // Handle Bi-directional
            else if (relStr.startsWith('<-')) direction = RelationshipDirection.From; 
            else if (relStr.endsWith('->')) direction = RelationshipDirection.To; 
            const targetElementStrs = targetsStr.split(';').map(t => t.trim()).filter(t => !!t); 
            for (const targetElementStr of targetElementStrs) { 
                const targetElementData = parseElementStr(targetElementStr); 
                if (targetElementData) { 
                    updateParsedElement(targetElementData); 
                    parsedRels.push({ sourceName: sourceElementData.name, targetName: targetElementData.name, label, direction }); 
                } 
            } 
            if (targetElementStrs.length === 1) { currentSourceElementStr = targetElementStrs[0]; } else { break; } 
        } 
    } 
    let nextElements: Element[] = []; let nextRelationships: Relationship[] = []; const newElementNames = new Set<string>(); 
    if (shouldMerge) { nextElements = [...elements]; nextRelationships = [...relationships]; const existingMap = new Map<string, Element>(); const nameToIdMap = new Map<string, string>(); nextElements.forEach(e => { existingMap.set(e.name.toLowerCase(), e); nameToIdMap.set(e.name.toLowerCase(), e.id); }); parsedElements.forEach(({ tags }, name) => { const lowerName = name.toLowerCase(); const existing = existingMap.get(lowerName); if (existing) { const mergedTags = Array.from(new Set([...existing.tags, ...tags])); if (mergedTags.length !== existing.tags.length || !mergedTags.every(t => existing.tags.includes(t))) { const updated = { ...existing, tags: mergedTags, updatedAt: new Date().toISOString() }; const idx = nextElements.findIndex(e => e.id === existing.id); if (idx !== -1) nextElements[idx] = updated; existingMap.set(lowerName, updated); } } else { const now = new Date().toISOString(); const newId = generateUUID(); const newEl: Element = { id: newId, name, tags, notes: '', createdAt: now, updatedAt: now }; nextElements.push(newEl); existingMap.set(lowerName, newEl); nameToIdMap.set(lowerName, newId); newElementNames.add(name); } }); parsedRels.forEach(rel => { const sId = nameToIdMap.get(rel.sourceName.toLowerCase()); const tId = nameToIdMap.get(rel.targetName.toLowerCase()); if (sId && tId) { const exists = nextRelationships.some(r => r.source === sId && r.target === tId && r.label === rel.label && r.direction === rel.direction); if (!exists) { nextRelationships.push({ id: generateUUID(), source: sId, target: tId, label: rel.label, direction: rel.direction, tags: [] }); } } }); } else { const nameToIdMap = new Map<string, string>(); parsedElements.forEach(({ tags }, name) => { const existing = elements.find(e => e.name.toLowerCase() === name.toLowerCase()); if (existing) { const updated = { ...existing, tags, updatedAt: new Date().toISOString() }; nextElements.push(updated); nameToIdMap.set(name.toLowerCase(), existing.id); } else { const now = new Date().toISOString(); const newId = generateUUID(); const newEl: Element = { id: newId, name, tags, notes: '', createdAt: now, updatedAt: now }; nextElements.push(newEl); nameToIdMap.set(name.toLowerCase(), newId); newElementNames.add(name); } }); parsedRels.forEach(rel => { const sId = nameToIdMap.get(rel.sourceName.toLowerCase()); const tId = nameToIdMap.get(rel.targetName.toLowerCase()); if (sId && tId) { nextRelationships.push({ id: generateUUID(), source: sId, target: tId, label: rel.label, direction: rel.direction, tags: [] }); } }); } 
    let placedNewElementsCount = 0; const positionNewElements = () => { nextElements.forEach(element => { if (newElementNames.has(element.name) && element.x === undefined) { let connectedAnchor: Element | undefined; for (const rel of nextRelationships) { let anchorId: string | undefined; if (rel.source === element.id) anchorId = rel.target as string; else if (rel.target === element.id) anchorId = rel.source as string; if (anchorId) { const potentialAnchor = nextElements.find(f => f.id === anchorId && f.x !== undefined); if (potentialAnchor) { connectedAnchor = potentialAnchor; break; } } } if (connectedAnchor && connectedAnchor.x && connectedAnchor.y) { element.x = connectedAnchor.x + (Math.random() - 0.5) * 300; element.y = connectedAnchor.y + (Math.random() - 0.5) * 300; } else { element.x = 200 + (placedNewElementsCount * 50); element.y = 200 + (placedNewElementsCount * 50); placedNewElementsCount++; } element.fx = element.x; element.fy = element.y; } }); }; 
    positionNewElements(); positionNewElements(); setElements(nextElements); setRelationships(nextRelationships); if (!shouldMerge) panelState.setIsMarkdownPanelOpen(false); 
  };

  const handleStartPhysicsLayout = () => { setOriginalElements(elements); setElements(prev => prev.map(f => ({ ...f, fx: null, fy: null }))); setIsPhysicsModeActive(true); };
  const handleAcceptLayout = () => { const finalPositions = graphCanvasRef.current?.getFinalNodePositions(); if (finalPositions) { const positionsMap = new Map(finalPositions.map((p: { id: string; x: number; y: number; }) => [p.id, p])); setElements(prev => prev.map(element => { const pos = positionsMap.get(element.id); const posEntry = pos as { x: number; y: number } | undefined; return posEntry ? { ...element, x: posEntry.x, y: posEntry.y, fx: posEntry.x, fy: posEntry.y } : element; })); } setIsPhysicsModeActive(false); setOriginalElements(null); };
  const handleRejectLayout = () => { if (originalElements) { setElements(originalElements); } setIsPhysicsModeActive(false); setOriginalElements(null); };
  const handleScaleLayout = useCallback((factor: number) => { if (isPhysicsModeActive) return; setElements(prev => { if (prev.length === 0) return prev; const xs = prev.map(e => e.x || 0); const ys = prev.map(e => e.y || 0); const avgX = xs.reduce((a,b) => a+b, 0) / prev.length; const avgY = ys.reduce((a,b) => a+b, 0) / prev.length; return prev.map(e => { const x = e.x || 0; const y = e.y || 0; const dx = x - avgX; const dy = y - avgY; const newX = avgX + dx * factor; const newY = avgY + dy * factor; return { ...e, x: newX, y: newY, fx: newX, fy: newY, updatedAt: new Date().toISOString() }; }); }); }, [isPhysicsModeActive]);
  
  const handleZoomIn = useCallback(() => {
      if (graphCanvasRef.current) {
          const { x, y, k } = graphCanvasRef.current.getCamera();
          const factor = 1.2;
          const newK = k * factor;
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const newX = cx - (cx - x) * factor;
          const newY = cy - (cy - y) * factor;
          graphCanvasRef.current.setCamera(newX, newY, newK);
      }
  }, []);

  const handleZoomOut = useCallback(() => {
      if (graphCanvasRef.current) {
          const { x, y, k } = graphCanvasRef.current.getCamera();
          const factor = 1 / 1.2;
          const newK = k * factor;
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const newX = cx - (cx - x) * factor;
          const newY = cy - (cy - y) * factor;
          graphCanvasRef.current.setCamera(newX, newY, newK);
      }
  }, []);

  const handleZoomToFit = () => { graphCanvasRef.current?.zoomToFit(); };

  // --- Search Handlers ---
  const handleSearch = useCallback((matchIds: Set<string>) => {
      const map = new Map<string, string>();
      // Use Neon Green for match highlights
      matchIds.forEach(id => map.set(id, '#00ff00')); 
      setAnalysisHighlights(map);
  }, []);

  const [searchInitialCamera, setSearchInitialCamera] = useState<{x: number, y: number, k: number} | null>(null);

  useEffect(() => {
      if (tools.activeTool === 'search' && graphCanvasRef.current) {
          setSearchInitialCamera(graphCanvasRef.current.getCamera());
      }
  }, [tools.activeTool]);

  const handleSearchReset = useCallback(() => {
      if (searchInitialCamera && graphCanvasRef.current) {
          graphCanvasRef.current.setCamera(searchInitialCamera.x, searchInitialCamera.y, searchInitialCamera.k);
      }
      setAnalysisHighlights(new Map());
  }, [searchInitialCamera]);

  const handleFocusSingle = useCallback((elementId: string) => {
      // Simulate click to open panel
      handleNodeClick(elementId, new MouseEvent('click'));
      
      // Center camera
      const element = elements.find(e => e.id === elementId);
      if (element && element.x !== undefined && element.y !== undefined && graphCanvasRef.current) {
          graphCanvasRef.current.setCamera(-element.x + window.innerWidth/2, -element.y + window.innerHeight/2, 1.5);
      }
  }, [elements, handleNodeClick]);

  // --- Presentation Handlers ---
  const handleCaptureSlide = () => { const camera = graphCanvasRef.current?.getCamera() || { x: 0, y: 0, k: 1 }; const newSlide: StorySlide = { id: generateUUID(), title: `Slide ${slides.length + 1}`, description: '', camera, selectedElementId: selectedElementId }; setSlides(prev => [...prev, newSlide]); };
  const handlePlayPresentation = () => { if (slides.length > 0) { setIsPresenting(true); setCurrentSlideIndex(0); } };
  useEffect(() => { if (isPresenting && currentSlideIndex !== null && slides[currentSlideIndex]) { const slide = slides[currentSlideIndex]; graphCanvasRef.current?.setCamera(slide.camera.x, slide.camera.y, slide.camera.k); setSelectedElementId(slide.selectedElementId); } }, [currentSlideIndex, isPresenting, slides]);

  // --- Panel Dragging Logic ---
  const handlePanelDragStart = (e: React.MouseEvent) => { if (!panelRef.current) return; const rect = panelRef.current.getBoundingClientRect(); dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }; if (!detailsPanelPosition) { setDetailsPanelPosition({ x: rect.left, y: rect.top }); } const handleMouseMove = (moveEvent: MouseEvent) => { if (dragStartRef.current) { setDetailsPanelPosition({ x: moveEvent.clientX - dragStartRef.current.x, y: moveEvent.clientY - dragStartRef.current.y }); } }; const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); dragStartRef.current = null; }; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); };
  const handleResetPanelPosition = () => { setDetailsPanelPosition(null); };

  const selectedElement = useMemo(() => elements.find(f => f.id === selectedElementId), [elements, selectedElementId]);
  const selectedRelationship = useMemo(() => relationships.find(r => r.id === selectedRelationshipId), [relationships, selectedRelationshipId]);
  const addRelationshipSourceElement = useMemo(() => elements.find(f => f.id === panelStateUI.sourceElementId), [elements, panelStateUI.sourceElementId]);
  const activeColorScheme = useMemo(() => { const current = colorSchemes.find(s => s.id === activeSchemeId); if (!current) return undefined; const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === current.id); if (defaultScheme) { const mergedTags = { ...defaultScheme.tagColors, ...current.tagColors }; const currentDefs = current.relationshipDefinitions || []; const defaultDefs = defaultScheme.relationshipDefinitions || []; const combinedDefsMap = new Map<string, RelationshipDefinition>(); defaultDefs.forEach(d => combinedDefsMap.set(d.label, d)); currentDefs.forEach(d => combinedDefsMap.set(d.label, d)); const mergedDefinitions = Array.from(combinedDefsMap.values()); const mergedDefaultLabel = current.defaultRelationshipLabel || defaultScheme.defaultRelationshipLabel; return { ...current, tagColors: mergedTags, relationshipDefinitions: mergedDefinitions, defaultRelationshipLabel: mergedDefaultLabel }; } return current; }, [colorSchemes, activeSchemeId]);
  const activeRelationshipLabels = useMemo(() => { return activeColorScheme?.relationshipDefinitions?.map(d => d.label) || []; }, [activeColorScheme]);
  const isRightPanelOpen = panelState.isReportPanelOpen || panelState.isMarkdownPanelOpen || panelState.isJSONPanelOpen || panelState.isMatrixPanelOpen || panelState.isTablePanelOpen || panelState.isGridPanelOpen || panelState.isDocumentPanelOpen || panelState.isHistoryPanelOpen || panelState.isKanbanPanelOpen || panelState.isPresentationPanelOpen || panelState.isMermaidPanelOpen || panelState.isTreemapPanelOpen || panelState.isTagDistPanelOpen || panelState.isRelDistPanelOpen || panelState.isSunburstPanelOpen || panelState.isConceptCloudOpen || panelState.isInfluenceCloudOpen || panelState.isTextAnalysisOpen || panelState.isFullTextAnalysisOpen || openDocIds.length > 0 || detachedHistoryIds.length > 0 || isDebugPanelOpen;

  // --- New Command Handlers ---
  const handleOpenCommandHistory = useCallback(() => {
    const cmdFolder = foldersRef.current.find(f => f.name === "CMD" && !f.parentId);
    let folderId = cmdFolder?.id;
    if (!folderId) {
         // Create CMD folder manually since handleCreateModel switches context
         const id = generateUUID();
         const newFolder: TapestryFolder = { id, name: "CMD", parentId: null, createdAt: new Date().toISOString() };
         setFolders(prev => [...prev, newFolder]);
         foldersRef.current.push(newFolder);
         folderId = id;
    }
    let historyDoc = documentsRef.current.find(d => d.folderId === folderId && d.title === "History");
    let docId = historyDoc?.id;
    if (!historyDoc) {
        docId = generateUUID();
        const newDoc: TapestryDocument = { id: docId, title: "History", content: "# Command History\n", folderId: folderId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setDocuments(prev => [...prev, newDoc]);
        documentsRef.current.push(newDoc);
    }
    if (docId) { handleOpenDocument(docId, 'report'); }
  }, [handleOpenDocument]);

  const handleCommandExecution = useCallback((markdown: string) => {
    handleApplyMarkdown(markdown, true);
    const timestamp = new Date().toLocaleString();
    const logEntry = `\n\n[${timestamp}] \`${markdown}\``;
    let cmdFolder = foldersRef.current.find(f => f.name === "CMD" && !f.parentId);
    let folderId = cmdFolder?.id;
    if (!folderId) {
        folderId = generateUUID();
        const newFolder: TapestryFolder = { id: folderId, name: "CMD", parentId: null, createdAt: new Date().toISOString() };
        setFolders(prev => [...prev, newFolder]);
        foldersRef.current.push(newFolder);
    }
    setDocuments(prev => {
        const historyDoc = prev.find(d => d.folderId === folderId && d.title === "History");
        if (historyDoc) {
            return prev.map(d => d.id === historyDoc.id ? { ...d, content: (d.content || "") + logEntry, updatedAt: new Date().toISOString() } : d);
        } else {
            return [...prev, { id: generateUUID(), title: "History", content: `# Command History${logEntry}`, folderId: folderId!, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
        }
    });
  }, [handleApplyMarkdown]);

  const handleImportInputChangeWrapper = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      persistence.handleImportInputChange(event);
  }, [persistence]);

  const handleApplyJSONWrapper = useCallback((data: any) => {
      try {
          // Manually apply because persistence.loadModelData is complex and resets IDs usually
          // For Apply JSON panel, we want to just set state
          if (data.elements && Array.isArray(data.elements)) setElements(data.elements);
          if (data.relationships && Array.isArray(data.relationships)) setRelationships(data.relationships);
          // ... (rest of simple setters)
          if (data.colorSchemes && Array.isArray(data.colorSchemes)) setColorSchemes(persistence.migrateLegacySchemes(data.colorSchemes).schemes);
          panelState.setIsJSONPanelOpen(false);
      } catch (e) {
          alert("Failed to apply JSON data");
      }
  }, [persistence, panelState]);

  const handleSaveAsImage = useCallback(() => {
    if (graphCanvasRef.current) {
        const filename = `${persistence.currentModelName.replace(/ /g, '_')}_view.png`;
        const bgColor = isDarkMode ? '#111827' : '#f9fafb'; // gray-900 or gray-50
        graphCanvasRef.current.exportAsImage(filename, bgColor);
        setCanvasContextMenu(null);
    }
  }, [persistence.currentModelName, isDarkMode]);

  // Helper to determine if a tool should hide others
  const isToolVisible = (toolId: string) => {
      if (!tools.activeTool) return true;
      // If active tool is horizontal, hide all others except itself
      if (HORIZONTAL_TOOLS.includes(tools.activeTool)) {
          return tools.activeTool === toolId;
      }
      // If active tool is dropdown, show all
      return true;
  };

  const handleCompleteAddRelationship = useCallback(() => {
      if (panelStateUI.targetElementId) {
          setSelectedElementId(panelStateUI.targetElementId);
      } else {
          setSelectedElementId(panelStateUI.sourceElementId || null);
      }
      setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  }, [panelStateUI]);

  // Handler to open Kanban board in a floating window (80% of screen)
  const handleOpenKanban = useCallback(() => {
      if (!panelState.isKanbanPanelOpen) {
          const width = window.innerWidth * 0.8;
          const height = window.innerHeight * 0.8;
          const x = (window.innerWidth - width) / 2;
          const y = (window.innerHeight - height) / 2;
          
          const nextZ = panelZIndex + 1;
          setPanelZIndex(nextZ);
          
          setPanelLayouts(prev => ({
              ...prev,
              'kanban': {
                  x,
                  y,
                  w: width,
                  h: height,
                  zIndex: nextZ,
                  isFloating: true
              }
          }));
          panelState.setIsKanbanPanelOpen(true);
      } else {
          panelState.setIsKanbanPanelOpen(false);
      }
  }, [panelState, panelZIndex]);

  // Construct dynamic panel definitions using props from usePanelState and local state
  const panelDefinitions = usePanelDefinitions({
    ...panelState,
    filteredElements, filteredRelationships,
    elements, relationships,
    documents, folders,
    openDocIds, setOpenDocIds,
    mermaidDiagrams,
    history,
    slides, setSlides,
    detachedHistoryIds, setDetachedHistoryIds,
    currentModelName: persistence.currentModelName,
    activeColorScheme,
    selectedElementId,
    multiSelection,
    onNodeClick: (id, e) => handleNodeClick(id, e),
    onOpenDocument: handleOpenDocument,
    onCreateFolder: handleCreateFolder,
    onCreateDocument: handleCreateDocument,
    onDeleteDocument: handleDeleteDocument,
    onDeleteFolder: handleDeleteFolder,
    onUpdateElement: handleUpdateElement,
    onDeleteElement: handleDeleteElement,
    onAddElementFromName: handleAddElementFromName,
    onAddRelationshipDirect: handleAddRelationshipDirect,
    onDeleteRelationship: handleDeleteRelationship,
    onUpdateDocument: handleUpdateDocument,
    onCaptureSlide: handleCaptureSlide,
    onPlayPresentation: handlePlayPresentation,
    onSaveMermaidDiagram: handleSaveMermaidDiagram,
    onDeleteMermaidDiagram: handleDeleteMermaidDiagram,
    onGenerateMermaid: handleGenerateMermaid,
    isMermaidGenerating,
    onApplyMarkdown: handleApplyMarkdown,
    onApplyJSON: handleApplyJSONWrapper,
    onDetachHistory: handleDetachHistory,
    onReopenHistory: tools.handleReopenHistory,
    onAnalyzeWithChat: handleAnalyzeWithChat,
    onDeleteHistory: handleDeleteHistory,
    onOpenWordCloudGuidance: () => tools.handleOpenGuidance('wordcloud'),
    panelLayouts,
    panelZIndex, setPanelZIndex,
    setPanelLayouts,
    setIsPhysicsModeActive,
    setOriginalElements,
    originalElements, // Added
    setElements,      // Added
    graphCanvasRef,
    aiActions,
    isDarkMode, // Passed for styling child panels
    isDebugPanelOpen,
    setIsDebugPanelOpen,
    chatMessages: chatConversation, // Pass local chat history
    aiConfig // Pass AI Config for AI features inside panels
});

  return (
    <div className="w-screen h-screen overflow-hidden flex relative">
      <input type="file" ref={importFileRef} onChange={handleImportInputChangeWrapper} accept=".json" className="hidden" />
      
      {isPresenting && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[3000] bg-gray-900/90 border border-gray-600 rounded-lg px-6 py-3 shadow-2xl flex items-center gap-4 text-white animate-fade-in-down">
              <button 
                onClick={() => { if (currentSlideIndex !== null && currentSlideIndex > 0) setCurrentSlideIndex(currentSlideIndex - 1); }}
                disabled={currentSlideIndex === 0}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="text-center min-w-[200px]">
                  <h2 className="text-xl font-bold">{slides[currentSlideIndex!]?.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">{slides[currentSlideIndex!]?.description}</p>
              </div>

              <button 
                onClick={() => { if (currentSlideIndex !== null && currentSlideIndex < slides.length - 1) setCurrentSlideIndex(currentSlideIndex + 1); }}
                disabled={currentSlideIndex === slides.length - 1}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <div className="border-l border-gray-600 h-8 mx-2"></div>
              
              <button onClick={() => setIsPresenting(false)} className="text-red-400 hover:text-red-300 text-sm font-bold uppercase tracking-wider">
                  Exit
              </button>
          </div>
      )}

      {persistence.currentModelId && !isPresenting && (
          <AppHeader 
            currentModelName={persistence.currentModelName}
            onNewModel={persistence.handleNewModelClick}
            onSaveAs={() => persistence.setIsSaveAsModalOpen(true)}
            onOpenModel={() => persistence.handleImportClick(importFileRef)}
            onSaveDisk={persistence.handleDiskSave}
            onCopy={handleCopy}
            onPaste={handlePaste}
            tools={tools}
            panelState={panelState}
            focusMode={focusMode}
            onToggleFocusMode={handleToggleFocusMode}
            onZoomToFit={handleZoomToFit}
            onOpenSettings={(tab) => { setSettingsInitialTab(tab || 'general'); setIsSettingsModalOpen(true); }}
            onAbout={() => setIsAboutModalOpen(true)}
            onPatternGallery={() => setIsPatternGalleryModalOpen(true)}
            onSelfTest={runSelfTest}
            onUserGuide={() => setIsUserGuideModalOpen(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={handleThemeToggle}
            onToggleDebug={() => setIsDebugPanelOpen(prev => !prev)}
            onOpenKanban={handleOpenKanban}
          />
      )}
      
      {persistence.currentModelId && !isPresenting && (
        <div className={`absolute left-4 z-[500] max-w-[90vw] pointer-events-none transition-all duration-500 ease-in-out ${tools.isToolsPanelOpen ? 'top-20 opacity-100' : 'top-4 opacity-0'}`}>
            <div className="flex flex-wrap items-start gap-2 pointer-events-auto">
                <button 
                    onClick={() => {
                        tools.setIsToolsPanelOpen(false);
                        tools.setActiveTool(null);
                    }} 
                    className={`border shadow-lg rounded-lg w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 z-20 gap-1 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200'}`} 
                    title="Close Tools Panel"
                >
                        <div className="relative w-8 h-8"><svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-8 h-8 text-blue-400 transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></div>
                        <span className={`text-[10px] font-bold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>TOOLS</span>
                </button>

                {isToolVisible('ai') && (
                    <AiToolbar 
                        onSelectTool={handleAiToolSelect}
                        isCollapsed={tools.activeTool !== 'ai'}
                        onToggle={() => tools.toggleTool('ai')}
                        isDarkMode={isDarkMode}
                    />
                )}

                {isToolVisible('search') && (
                    <SearchToolbar 
                        elements={elements} 
                        onSearch={handleSearch} 
                        onFocusSingle={handleFocusSingle} 
                        isCollapsed={tools.activeTool !== 'search'} 
                        onToggle={() => tools.toggleTool('search')} 
                        isDarkMode={isDarkMode} 
                        onReset={handleSearchReset}
                    />
                )}
                {isToolVisible('schema') && (
                    <SchemaToolbar schemes={colorSchemes} activeSchemeId={activeSchemeId} onSchemeChange={setActiveSchemeId} activeColorScheme={activeColorScheme} onDefaultRelationshipChange={handleUpdateDefaultRelationship} defaultTags={defaultTags} onDefaultTagsChange={setDefaultTags} elements={elements} isCollapsed={tools.activeTool !== 'schema'} onToggle={() => tools.toggleTool('schema')} onUpdateSchemes={(newSchemes) => setColorSchemes(newSchemes)} isDarkMode={isDarkMode} />
                )}
                {isToolVisible('layout') && (
                    <LayoutToolbar 
                        linkDistance={layoutParams.linkDistance} 
                        repulsion={layoutParams.repulsion} 
                        onLinkDistanceChange={(val) => setLayoutParams(p => ({...p, linkDistance: val}))} 
                        onRepulsionChange={(val) => setLayoutParams(p => ({...p, repulsion: val}))} 
                        onJiggle={() => setJiggleTrigger(prev => prev + 1)} 
                        onZoomToFit={handleZoomToFit}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut} 
                        isPhysicsActive={isPhysicsModeActive} 
                        onStartAutoLayout={handleStartPhysicsLayout} 
                        onAcceptAutoLayout={handleAcceptLayout} 
                        onRejectAutoLayout={handleRejectLayout} 
                        onExpand={() => handleScaleLayout(1.1)} 
                        onContract={() => handleScaleLayout(0.9)} 
                        isCollapsed={tools.activeTool !== 'layout'} 
                        onToggle={() => tools.toggleTool('layout')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {isToolVisible('analysis') && (
                    <AnalysisToolbar elements={elements} relationships={relationships} onBulkTag={handleBulkTagAction} onHighlight={handleAnalysisHighlight} onFilter={handleAnalysisFilter} isCollapsed={tools.activeTool !== 'analysis'} onToggle={() => tools.toggleTool('analysis')} isSimulationMode={isSimulationMode} onToggleSimulation={() => setIsSimulationMode(p => !p)} onResetSimulation={() => setSimulationState({})} isDarkMode={isDarkMode} />
                )}
                
                {/* Methods Tool - Always visible unless another tool hides it */}
                {isToolVisible('methods') && (
                    <MethodsToolbar 
                        onSelectMethod={(method) => tools.setActiveTool(method)} 
                        isCollapsed={tools.activeTool !== 'methods'} 
                        onToggle={() => tools.toggleTool('methods')}
                        isDarkMode={isDarkMode}
                    />
                )}

                {/* Sub Tools - Only visible if they are the active tool */}
                {tools.activeTool === 'scamper' && (
                    <ScamperToolbar selectedElementId={selectedElementId} onScamper={(operator, letter) => { tools.setScamperInitialDoc(null); tools.setScamperTrigger({ operator, letter }); tools.setIsScamperModalOpen(true); tools.setActiveTool(null); }} isCollapsed={tools.activeTool !== 'scamper'} onToggle={() => tools.toggleTool('scamper')} onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }} isDarkMode={isDarkMode} />
                )}
                {tools.activeTool === 'triz' && (
                    <TrizToolbar 
                        activeTool={tools.activeTrizTool} 
                        onSelectTool={(tool) => { handleTrizToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'triz'} 
                        onToggle={() => tools.toggleTool('triz')} 
                        onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                        onOpenGuidance={() => tools.handleOpenGuidance('triz')}
                    />
                )}
                {tools.activeTool === 'lss' && (
                    <LssToolbar 
                        activeTool={tools.activeLssTool} 
                        onSelectTool={(tool) => { handleLssToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'lss'} 
                        onToggle={() => tools.toggleTool('lss')} 
                        onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {tools.activeTool === 'toc' && (
                    <TocToolbar 
                        activeTool={tools.activeTocTool} 
                        onSelectTool={(tool) => { handleTocToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'toc'} 
                        onToggle={() => tools.toggleTool('toc')} 
                        onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {tools.activeTool === 'ssm' && (
                    <SsmToolbar 
                        activeTool={tools.activeSsmTool} 
                        onSelectTool={(tool) => { handleSsmToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'ssm'} 
                        onToggle={() => tools.toggleTool('ssm')} 
                        onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                    />
                )}

                {isToolVisible('swot') && (
                    <SwotToolbar 
                        activeTool={tools.activeSwotTool} 
                        onSelectTool={(tool) => { handleSwotToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'swot'} 
                        onToggle={() => tools.toggleTool('swot')} 
                        onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                        customStrategies={globalSettings.customStrategies} 
                        onOpenGuidance={() => tools.handleOpenGuidance('strategy')}
                    />
                )}
                {isToolVisible('explorer') && (
                    <ExplorerToolbar 
                        onSelectTool={(tool) => { handleExplorerToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'explorer'} 
                        onToggle={() => tools.toggleTool('explorer')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {isToolVisible('tagcloud') && (
                    <TagCloudToolbar 
                        onSelectTool={(tool) => { handleTagCloudToolSelect(tool); tools.setActiveTool(null); }} 
                        isCollapsed={tools.activeTool !== 'tagcloud'} 
                        onToggle={() => tools.toggleTool('tagcloud')} 
                        isDarkMode={isDarkMode} 
                        onOpenGuidance={() => tools.handleOpenGuidance('wordcloud')}
                    />
                )}
                {isToolVisible('mermaid') && (
                    <MermaidToolbar 
                        onSelectTool={(tool) => { handleMermaidToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'mermaid'} 
                        onToggle={() => tools.toggleTool('mermaid')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {isToolVisible('bulk') && (
                    <BulkEditToolbar activeColorScheme={activeColorScheme} tagsToAdd={bulkTagsToAdd} tagsToRemove={bulkTagsToRemove} onTagsToAddChange={setBulkTagsToAdd} onTagsToRemoveChange={setBulkTagsToRemove} isActive={isBulkEditActive} onToggleActive={() => setIsBulkEditActive(p => !p)} isCollapsed={tools.activeTool !== 'bulk'} onToggle={() => tools.toggleTool('bulk')} isDarkMode={isDarkMode} />
                )}
                {isToolVisible('command') && (
                    <CommandBar onExecute={handleCommandExecution} isCollapsed={tools.activeTool !== 'command'} onToggle={() => tools.toggleTool('command')} onOpenHistory={handleOpenCommandHistory} isDarkMode={isDarkMode} />
                )}
            </div>
        </div>
      )}

      {panelState.isFilterPanelOpen && persistence.currentModelId && !isPresenting && (
        <FilterPanel 
            allTags={allTags} 
            tagCounts={tagCounts} 
            tagFilter={tagFilter} 
            dateFilter={dateFilter} 
            nodeFilter={nodeFilter}
            elements={elements}
            onTagFilterChange={setTagFilter} 
            onDateFilterChange={setDateFilter} 
            onNodeFilterChange={setNodeFilter}
            onClose={() => panelState.setIsFilterPanelOpen(false)} 
            isDarkMode={isDarkMode} 
        />
      )}
      
      {/* 
        DESIGN DECISION: Guidance Panel is rendered explicitly here as a fixed/absolute positioned element
        on the LEFT side of the screen (distinct from the right-hand dock). This allows the user to view 
        the guidance documentation simultaneously with the tool interface or canvas on the right.
      */}
      {panelState.isGuidancePanelOpen && persistence.currentModelId && !isPresenting && (
        <div className="fixed left-4 top-40 z-[600] w-[400px] h-[calc(100vh-200px)] shadow-2xl rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
            <GuidancePanel 
                content={panelState.guidanceContent} 
                onClose={() => panelState.setIsGuidancePanelOpen(false)} 
                isDarkMode={isDarkMode}
            />
        </div>
      )}

      {persistence.currentModelId && !isPresenting && (
        <RightPanelContainer panels={panelDefinitions} layouts={panelLayouts} onLayoutChange={setPanelLayouts} activeDockedId={activeDockedPanelId} onActiveDockedIdChange={setActiveDockedPanelId} globalZIndex={panelZIndex} onGlobalZIndexChange={setPanelZIndex} isDarkMode={isDarkMode} />
      )}

      {persistence.currentModelId && !isPresenting && ((panelStateUI.view === 'addRelationship' && addRelationshipSourceElement) || selectedRelationship || selectedElement) && (
        <div ref={panelRef} className={`z-[70] flex flex-col pointer-events-none ${detailsPanelPosition ? 'fixed shadow-2xl rounded-lg' : 'absolute top-24'}`} style={detailsPanelPosition ? { left: detailsPanelPosition.x, top: detailsPanelPosition.y, maxHeight: 'calc(100vh - 2rem)' } : { right: isRightPanelOpen ? '620px' : '16px', maxHeight: 'calc(100vh - 8rem)' }}>
            <div className={`pointer-events-auto flex flex-col h-auto max-h-full shadow-2xl rounded-lg border min-h-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`h-6 rounded-t-lg flex items-center justify-center cursor-move border-b group relative flex-shrink-0 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`} onMouseDown={handlePanelDragStart}>
                    <div className={`w-10 h-1 rounded-full transition-colors ${isDarkMode ? 'bg-gray-500 group-hover:bg-gray-400' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
                    <button onClick={handleResetPanelPosition} className={`absolute right-2 hover:text-blue-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} title={detailsPanelPosition ? "Dock Panel" : "Unpin/Float Panel"}>
                        {detailsPanelPosition ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4H8v8L6 14v2h5v6l1 2 1-2v-6h5v-2l-2-2z" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4H8v8L6 14v2h5v6l1 2 1-2v-6h5v-2l-2-2z" /></svg>)}
                    </button>
                </div>
                <div className="rounded-b-lg overflow-hidden flex flex-col min-h-0 flex-grow">
                    {panelStateUI.view === 'addRelationship' && addRelationshipSourceElement ? (
                        <AddRelationshipPanel 
                            sourceElement={addRelationshipSourceElement} 
                            targetElementId={panelStateUI.targetElementId} 
                            isNewTarget={panelStateUI.isNewTarget} 
                            allElements={elements} 
                            onCreate={handleCompleteAddRelationship} // Renamed action for auto-save flow
                            onUpdateElement={handleUpdateElement} 
                            onCancel={handleCancelAddRelationship} 
                            suggestedLabels={activeRelationshipLabels} 
                            defaultLabel={activeColorScheme?.defaultRelationshipLabel} 
                            colorSchemes={colorSchemes} 
                            activeSchemeId={activeSchemeId} 
                            isDarkMode={isDarkMode} 
                            relationships={relationships} // New
                            onUpdateRelationship={handleUpdateRelationship} // New
                        />
                    ) : selectedRelationship ? (
                        <RelationshipDetailsPanel relationship={selectedRelationship} elements={elements} onUpdate={handleUpdateRelationship} onDelete={handleDeleteRelationship} suggestedLabels={activeRelationshipLabels} isDarkMode={isDarkMode} />
                    ) : selectedElement ? (
                        <ElementDetailsPanel element={selectedElement} allElements={elements} relationships={relationships} onUpdate={handleUpdateElement} onDelete={handleDeleteElement} onClose={() => setSelectedElementId(null)} colorSchemes={colorSchemes} activeSchemeId={activeSchemeId} isDarkMode={isDarkMode} />
                    ) : null}
                </div>
            </div>
        </div>
    )}

      <ChatPanel className={(!panelState.isChatPanelOpen || !persistence.currentModelId || isPresenting) ? 'hidden' : ''} isOpen={panelState.isChatPanelOpen} elements={elements} relationships={relationships} colorSchemes={colorSchemes} activeSchemeId={activeSchemeId} onClose={() => panelState.setIsChatPanelOpen(false)} currentModelId={persistence.currentModelId} modelActions={aiActions} onOpenPromptSettings={() => { setSettingsInitialTab('ai_prompts'); setIsSettingsModalOpen(true); }} systemPromptConfig={systemPromptConfig} documents={documents} folders={folders} openDocIds={openDocIds} onLogHistory={handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onOpenTool={tools.handleOpenTool} initialInput={chatDraftMessage} aiConfig={aiConfig} isDarkMode={isDarkMode} messages={chatConversation} setMessages={setChatConversation} />
      {isDebugPanelOpen && <DebugPanel messages={debugLog} onClose={() => setIsDebugPanelOpen(false)} isDarkMode={isDarkMode} />}
      <ScamperModal isOpen={tools.isScamperModalOpen} onClose={() => tools.setIsScamperModalOpen(false)} elements={elements} relationships={relationships} selectedElementId={selectedElementId} modelActions={aiActions} triggerOp={tools.scamperTrigger} onClearTrigger={() => tools.setScamperTrigger(null)} documents={documents} folders={folders} onUpdateDocument={handleUpdateDocument} modelName={persistence.currentModelName} initialDoc={tools.scamperInitialDoc} onLogHistory={handleLogHistory} defaultTags={defaultTags} aiConfig={aiConfig} />
      <TrizModal 
        isOpen={tools.isTrizModalOpen} 
        activeTool={tools.activeTrizTool} 
        elements={elements} 
        relationships={relationships} 
        modelActions={aiActions} 
        documents={documents} 
        folders={folders} 
        onUpdateDocument={handleUpdateDocument} 
        initialParams={tools.trizInitialParams} 
        onClose={() => tools.setIsTrizModalOpen(false)} 
        onLogHistory={handleLogHistory} 
        onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} 
        onAnalyze={handleAnalyzeWithChat} 
        customPrompt={getToolPrompt('triz', tools.activeTrizTool)} 
        aiConfig={aiConfig} 
        onOpenGuidance={() => tools.handleOpenGuidance('triz-' + tools.activeTrizTool)}
      />
      <LssModal isOpen={tools.isLssModalOpen} activeTool={tools.activeLssTool} elements={elements} relationships={relationships} modelActions={aiActions} documents={documents} folders={folders} onUpdateDocument={handleUpdateDocument} initialParams={tools.lssInitialParams} onClose={() => tools.setIsLssModalOpen(false)} onLogHistory={handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onAnalyze={handleAnalyzeWithChat} customPrompt={getToolPrompt('lss', tools.activeLssTool)} aiConfig={aiConfig} />
      <TocModal isOpen={tools.isTocModalOpen} activeTool={tools.activeTocTool} elements={elements} relationships={relationships} modelActions={aiActions} documents={documents} folders={folders} onUpdateDocument={handleUpdateDocument} initialParams={tools.tocInitialParams} onClose={() => tools.setIsTocModalOpen(false)} onLogHistory={handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onAnalyze={handleAnalyzeWithChat} customPrompt={getToolPrompt('toc', tools.activeTocTool)} aiConfig={aiConfig} />
      <SsmModal isOpen={tools.isSsmModalOpen} activeTool={tools.activeSsmTool} elements={elements} relationships={relationships} modelActions={aiActions} documents={documents} folders={folders} onUpdateDocument={handleUpdateDocument} initialParams={tools.ssmInitialParams} onClose={() => tools.setIsSsmModalOpen(false)} onLogHistory={handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onAnalyze={handleAnalyzeWithChat} customPrompt={getToolPrompt('ssm', tools.activeSsmTool)} aiConfig={aiConfig} />
      <SwotModal 
        isOpen={tools.isSwotModalOpen} 
        activeTool={tools.activeSwotTool} 
        elements={elements} 
        relationships={relationships} 
        modelActions={aiActions} 
        documents={documents} 
        folders={folders} 
        onUpdateDocument={handleUpdateDocument} 
        onClose={() => tools.setIsSwotModalOpen(false)} 
        onLogHistory={handleLogHistory} 
        onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} 
        modelName={persistence.currentModelName} 
        initialDoc={tools.swotInitialDoc} 
        aiConfig={aiConfig} 
        isDarkMode={isDarkMode} 
        customStrategies={globalSettings.customStrategies} 
        onSaveCustomStrategies={handleCustomStrategiesChange} 
        onOpenGuidance={() => tools.handleOpenGuidance('strategy')}
      />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} initialTab={settingsInitialTab} globalSettings={globalSettings} onGlobalSettingsChange={handleGlobalSettingsChange} modelSettings={systemPromptConfig} onModelSettingsChange={setSystemPromptConfig} isDarkMode={isDarkMode} />
      {persistence.isSchemaUpdateModalOpen && <SchemaUpdateModal changes={persistence.schemaUpdateChanges} onClose={() => persistence.setIsSchemaUpdateModalOpen(false)} />}
      <SelfTestModal isOpen={isSelfTestModalOpen} onClose={() => setIsSelfTestModalOpen(false)} logs={testLogs} status={testStatus} isDarkMode={isDarkMode} />
      {isUserGuideModalOpen && <UserGuideModal onClose={() => setIsUserGuideModalOpen(false)} isDarkMode={isDarkMode} />}

      {persistence.currentModelId ? (
        <GraphCanvas 
            ref={graphCanvasRef} 
            elements={filteredElements} 
            relationships={filteredRelationships} 
            onNodeClick={handleNodeClick} 
            onLinkClick={handleLinkClick} 
            onCanvasClick={handleCanvasClick} 
            onCanvasDoubleClick={handleAddElement} 
            onNodeContextMenu={handleNodeContextMenu} 
            onLinkContextMenu={handleLinkContextMenu}
            onCanvasContextMenu={handleCanvasContextMenu} 
            onNodeConnect={handleNodeConnect} 
            onNodeConnectToNew={handleNodeConnectToNew} 
            activeColorScheme={activeColorScheme} 
            selectedElementId={selectedElementId} 
            multiSelection={multiSelection} 
            selectedRelationshipId={selectedRelationshipId} 
            focusMode={focusMode} 
            setElements={setElements} 
            isPhysicsModeActive={isPhysicsModeActive} 
            layoutParams={layoutParams} 
            onJiggleTrigger={jiggleTrigger} 
            isBulkEditActive={isBulkEditActive} 
            isSimulationMode={isSimulationMode}
            simulationState={simulationState} 
            analysisHighlights={analysisHighlights} 
            isDarkMode={isDarkMode} 
        />
      ) : (
        <div className={`w-full h-full flex-col items-center justify-center space-y-10 p-8 flex relative ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
             <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4"><TapestryBanner /></div>
                <div className="text-xl text-gray-400 font-light tracking-wide min-w-[300px]"><TextAnimator /></div>
             </div>
             <div className="flex space-x-8">
                <button onClick={() => persistence.setIsCreateModelModalOpen(true)} className={`flex flex-col items-center justify-center w-56 h-56 border-2 rounded-2xl hover:border-blue-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all group ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`rounded-full p-4 mb-4 group-hover:bg-blue-900 group-hover:bg-opacity-30 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
                    <span className={`text-xl font-semibold group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Create Model</span>
                    <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Start a new blank canvas</span>
                </button>
                <button onClick={() => persistence.handleImportClick(importFileRef)} className={`flex flex-col items-center justify-center w-56 h-56 border-2 rounded-2xl hover:border-green-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 transition-all group ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                     <div className={`rounded-full p-4 mb-4 group-hover:bg-green-900 group-hover:bg-opacity-30 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
                    <span className={`text-xl font-semibold group-hover:text-green-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Open Model</span>
                    <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Open a JSON file from Disk</span>
                </button>
             </div>
             <div className="w-[600px] text-center space-y-4">
                 <p className="font-bold text-blue-400">This project is in Alpha release and is in active development.</p>
                 <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tapestry Studio is an AI-powered knowledge graph editor, creativity, and problem solving tool that brings together many Science, Engineering, Business, and Innovation tools and uses AI to bring them to life.</p>
                 <AiDisclaimer isDarkMode={isDarkMode} />
             </div>
             {persistence.modelsIndex.length > 0 && (
                 <div className="mt-4 w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-4 px-2"><h3 className="text-lg font-semibold text-gray-400">Recent Models (Recovered)</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {persistence.modelsIndex.slice(0, 4).map(model => (
                             <button key={model.id} onClick={() => persistence.handleLoadModel(model.id)} className={`border p-4 rounded-lg text-left transition group flex flex-col ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                                <span className={`font-medium group-hover:text-blue-400 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{model.name}</span>
                                <span className="text-xs text-gray-500 mt-1">Last updated: {new Date(model.updatedAt).toLocaleDateString()}</span>
                             </button>
                        ))}
                    </div>
                     <div className="text-center mt-4"><button onClick={() => persistence.setIsOpenModelModalOpen(true)} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">View All Recovered Models</button></div>
                 </div>
             )}
             <CreatorInfo className="mt-8" isDarkMode={isDarkMode} onAboutClick={() => setIsAboutModalOpen(true)} />
        </div>
      )}

      {contextMenu && persistence.currentModelId && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleCloseContextMenu} onDeleteElement={() => { handleDeleteElement(contextMenu.elementId); handleCloseContextMenu(); }} onAddRelationship={() => { setPanelStateUI({ view: 'addRelationship', sourceElementId: contextMenu.elementId, targetElementId: null, isNewTarget: false }); setSelectedElementId(null); setMultiSelection(new Set()); setSelectedRelationshipId(null); handleCloseContextMenu(); }} />
      )}

      {relationshipContextMenu && persistence.currentModelId && (
          <RelationshipContextMenu
              x={relationshipContextMenu.x}
              y={relationshipContextMenu.y}
              relationship={relationships.find(r => r.id === relationshipContextMenu.relationshipId)!}
              onClose={handleCloseRelationshipContextMenu}
              onDelete={() => { handleDeleteRelationship(relationshipContextMenu.relationshipId); handleCloseRelationshipContextMenu(); }}
              onChangeDirection={(dir) => handleChangeRelationshipDirection(relationshipContextMenu.relationshipId, dir)}
              isDarkMode={isDarkMode}
          />
      )}

      {canvasContextMenu && persistence.currentModelId && (
        <CanvasContextMenu x={canvasContextMenu.x} y={canvasContextMenu.y} onClose={handleCloseCanvasContextMenu} onZoomToFit={handleZoomToFit} onAutoLayout={handleStartPhysicsLayout} onToggleReport={() => panelState.setIsReportPanelOpen(p => !p)} onToggleMarkdown={() => panelState.setIsMarkdownPanelOpen(p => !p)} onToggleJSON={() => panelState.setIsJSONPanelOpen(p => !p)} onToggleFilter={() => panelState.setIsFilterPanelOpen(p => !p)} onToggleMatrix={() => panelState.setIsMatrixPanelOpen(p => !p)} onToggleTable={() => panelState.setIsTablePanelOpen(p => !p)} onToggleGrid={() => panelState.setIsGridPanelOpen(p => !p)} onOpenModel={() => persistence.handleImportClick(importFileRef)} onSaveModel={persistence.handleDiskSave} onCreateModel={persistence.handleNewModelClick} onSaveAs={() => persistence.setIsSaveAsModalOpen(true)} onSaveAsImage={handleSaveAsImage} isReportOpen={panelState.isReportPanelOpen} isMarkdownOpen={panelState.isMarkdownPanelOpen} isJSONOpen={panelState.isJSONPanelOpen} isFilterOpen={panelState.isFilterPanelOpen} isMatrixOpen={panelState.isMatrixPanelOpen} isTableOpen={panelState.isTablePanelOpen} isGridOpen={panelState.isGridPanelOpen} isDarkMode={isDarkMode} />
      )}

      {persistence.isCreateModelModalOpen && <CreateModelModal onCreate={persistence.handleCreateModel} onClose={() => persistence.setIsCreateModelModalOpen(false)} isInitialSetup={false} />}
      {persistence.isSaveAsModalOpen && <SaveAsModal currentName={persistence.modelsIndex.find(m => m.id === persistence.currentModelId)?.name || ''} currentDesc={persistence.modelsIndex.find(m => m.id === persistence.currentModelId)?.description || ''} onSave={persistence.handleSaveAs} onClose={() => persistence.setIsSaveAsModalOpen(false)} />}
      {persistence.isOpenModelModalOpen && <OpenModelModal models={persistence.modelsIndex} onLoad={persistence.handleLoadModel} onClose={() => persistence.setIsOpenModelModalOpen(false)} onTriggerCreate={() => { persistence.setIsOpenModelModalOpen(false); persistence.setIsCreateModelModalOpen(true); }} />}
      {persistence.pendingImport && (
          <ConflictResolutionModal localMetadata={persistence.pendingImport.localMetadata} diskMetadata={persistence.pendingImport.diskMetadata} localData={persistence.pendingImport.localData} diskData={persistence.pendingImport.diskData} onCancel={() => persistence.setPendingImport(null)} onChooseLocal={() => { persistence.handleLoadModel(persistence.pendingImport!.localMetadata.id); persistence.setPendingImport(null); }} onChooseDisk={() => { persistence.loadModelData(persistence.pendingImport!.diskData, persistence.pendingImport!.diskMetadata.id, persistence.pendingImport!.diskMetadata); persistence.setPendingImport(null); }} />
      )}
      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} onUserGuideClick={() => { setIsAboutModalOpen(false); setIsUserGuideModalOpen(true); }} isDarkMode={isDarkMode} />}
      {isPatternGalleryModalOpen && <PatternGalleryModal onClose={() => setIsPatternGalleryModalOpen(false)} isDarkMode={isDarkMode} />}
    </div>
  );
}
