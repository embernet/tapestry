
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, ColorScheme, RelationshipDirection, ModelMetadata, PanelState, DateFilterState, ModelActions, RelationshipDefinition, ScamperSuggestion, SystemPromptConfig, TapestryDocument, TapestryFolder, PanelLayout, TrizToolType, LssToolType, TocToolType, SsmToolType, ExplorerToolType, TagCloudToolType, SwotToolType, MermaidToolType, HistoryEntry, SimulationNodeState, StorySlide, GlobalSettings, MermaidDiagram } from './types';
import { DEFAULT_COLOR_SCHEMES, LINK_DISTANCE, DEFAULT_SYSTEM_PROMPT_CONFIG, TAGLINES, AVAILABLE_AI_TOOLS, DEFAULT_TOOL_PROMPTS } from './constants';
import GraphCanvas, { GraphCanvasRef } from './components/GraphCanvas';
import ElementDetailsPanel from './components/ElementDetailsPanel';
import RelationshipDetailsPanel from './components/RelationshipDetailsPanel';
import AddRelationshipPanel from './components/AddRelationshipPanel';
import MarkdownPanel from './components/MarkdownPanel';
import JSONPanel from './components/JSONPanel';
import FilterPanel from './components/FilterPanel';
import { ReportPanel } from './components/ReportPanel';
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
import ExplorerToolbar from './components/ExplorerToolbar';
import { TreemapPanel, TagDistributionPanel, RelationshipDistributionPanel } from './components/ExplorerModal';
import { SunburstPanel } from './components/SunburstPanel';
import TagCloudToolbar from './components/TagCloudToolbar';
import { TagCloudPanel } from './components/TagCloudModal';
import SwotToolbar from './components/SwotToolbar';
import SwotModal from './components/SwotModal';
import MermaidToolbar from './components/MermaidToolbar';
import MermaidPanel from './components/MermaidPanel';
import CommandBar from './components/CommandBar';
import MatrixPanel from './components/MatrixPanel';
import TablePanel from './components/TablePanel';
import GridPanel from './components/GridPanel';
import KanbanPanel from './components/KanbanPanel';
import PresentationPanel from './components/PresentationPanel';
import RightPanelContainer, { PanelDefinition } from './components/RightPanelContainer';
import SettingsModal from './components/SettingsModal';
import HistoryPanel from './components/HistoryPanel';
import HistoryItemPanel from './components/HistoryItemPanel';
import { DocumentManagerPanel, DocumentEditorPanel } from './components/DocumentPanel';
import { generateUUID, generateMarkdownFromGraph, computeContentHash, isInIframe, generateSelectionReport, callAI, AIConfig } from './utils';
import { TextAnimator, ConflictResolutionModal, ContextMenu, CanvasContextMenu, CreateModelModal, SaveAsModal, OpenModelModal, HelpMenu, PatternGalleryModal, AboutModal, TAPESTRY_PATTERNS, TapestryBanner, SchemaUpdateModal, SelfTestModal, TestLog, UserGuideModal, AiDisclaimer, CreatorInfo } from './components/ModalComponents';

// Explicitly define coordinate type to fix type inference issues
type Coords = { x: number; y: number };

// --- Storage Keys ---
const MODELS_INDEX_KEY = 'tapestry_models_index';
const LAST_OPENED_MODEL_ID_KEY = 'tapestry_last_opened_model_id';
const MODEL_DATA_PREFIX = 'tapestry_model_data_';
const GLOBAL_SETTINGS_KEY = 'tapestry_global_settings';

// Helper Hook for detecting clicks outside an element
const useClickOutside = <T extends HTMLElement,>(ref: React.RefObject<T>, handler: (event: MouseEvent | TouchEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

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
      activeProvider: 'gemini',
      aiConnections: {
          gemini: { provider: 'gemini', apiKey: '', modelId: 'gemini-2.5-flash' },
          openai: { provider: 'openai', apiKey: '', modelId: 'gpt-4o' },
          anthropic: { provider: 'anthropic', apiKey: '', modelId: 'claude-3-5-sonnet-20240620' },
          grok: { provider: 'grok', apiKey: '', modelId: 'grok-beta' },
          ollama: { provider: 'ollama', apiKey: 'ollama', baseUrl: 'http://localhost:11434', modelId: 'llama3' },
          custom: { provider: 'custom', apiKey: '', baseUrl: '', modelId: '' }
      }
  });
  const [systemPromptConfig, setSystemPromptConfig] = useState<SystemPromptConfig>(DEFAULT_SYSTEM_PROMPT_CONFIG);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'prompts'>('general');

  // --- Documents State ---
  const [documents, setDocuments] = useState<TapestryDocument[]>([]);
  const [folders, setFolders] = useState<TapestryFolder[]>([]);
  const [openDocIds, setOpenDocIds] = useState<string[]>([]);

  // --- History State ---
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [detachedHistoryIds, setDetachedHistoryIds] = useState<string[]>([]);

  // --- Layout Parameters State ---
  const [layoutParams, setLayoutParams] = useState({ linkDistance: 250, repulsion: -400 });
  const [jiggleTrigger, setJiggleTrigger] = useState(0);

  // --- Active Tool State ---
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true); // Initial value will be updated by effect

  // --- Chat Context State ---
  const [chatDraftMessage, setChatDraftMessage] = useState<string>('');

  // --- Bulk Edit State ---
  const [isBulkEditActive, setIsBulkEditActive] = useState(false);
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

  // --- TRIZ State ---
  const [activeTrizTool, setActiveTrizTool] = useState<TrizToolType>(null);
  const [isTrizModalOpen, setIsTrizModalOpen] = useState(false);
  const [trizInitialParams, setTrizInitialParams] = useState<any>(null);

  // --- LSS State ---
  const [activeLssTool, setActiveLssTool] = useState<LssToolType>(null);
  const [isLssModalOpen, setIsLssModalOpen] = useState(false);
  const [lssInitialParams, setLssInitialParams] = useState<any>(null);

  // --- TOC State ---
  const [activeTocTool, setActiveTocTool] = useState<TocToolType>(null);
  const [isTocModalOpen, setIsTocModalOpen] = useState(false);
  const [tocInitialParams, setTocInitialParams] = useState<any>(null);

  // --- SSM State ---
  const [activeSsmTool, setActiveSsmTool] = useState<SsmToolType>(null);
  const [isSsmModalOpen, setIsSsmModalOpen] = useState(false);
  const [ssmInitialParams, setSsmInitialParams] = useState<any>(null);

  // --- Explorer State ---
  const [isTreemapPanelOpen, setIsTreemapPanelOpen] = useState(false);
  const [isTagDistPanelOpen, setIsTagDistPanelOpen] = useState(false);
  const [isRelDistPanelOpen, setIsRelDistPanelOpen] = useState(false);
  const [isSunburstPanelOpen, setIsSunburstPanelOpen] = useState(false);
  const [sunburstState, setSunburstState] = useState<{ active: boolean, centerId: string | null, hops: number }>({ active: false, centerId: null, hops: 0 });

  // --- Tag Cloud State ---
  const [isConceptCloudOpen, setIsConceptCloudOpen] = useState(false);
  const [isInfluenceCloudOpen, setIsInfluenceCloudOpen] = useState(false);
  const [isTextAnalysisOpen, setIsTextAnalysisOpen] = useState(false);
  const [isFullTextAnalysisOpen, setIsFullTextAnalysisOpen] = useState(false);

  // --- SWOT State ---
  const [activeSwotTool, setActiveSwotTool] = useState<SwotToolType>(null);
  const [isSwotModalOpen, setIsSwotModalOpen] = useState(false);
  const [swotInitialDoc, setSwotInitialDoc] = useState<TapestryDocument | null>(null);

  // --- SCAMPER State ---
  const [isScamperModalOpen, setIsScamperModalOpen] = useState(false);
  const [scamperTrigger, setScamperTrigger] = useState<{ operator: string, letter: string } | null>(null);
  const [scamperInitialDoc, setScamperInitialDoc] = useState<TapestryDocument | null>(null);

  // --- Mermaid State ---
  const [isMermaidPanelOpen, setIsMermaidPanelOpen] = useState(false);
  const [mermaidDiagrams, setMermaidDiagrams] = useState<MermaidDiagram[]>([]);
  const [isMermaidGenerating, setIsMermaidGenerating] = useState(false);

  // --- Schema Update Notification State ---
  const [schemaUpdateChanges, setSchemaUpdateChanges] = useState<string[]>([]);
  const [isSchemaUpdateModalOpen, setIsSchemaUpdateModalOpen] = useState(false);

  // --- Internal Clipboard for Copy/Paste ---
  const [internalClipboard, setInternalClipboard] = useState<{ elements: Element[], relationships: Relationship[] } | null>(null);

  // --- Self Test State ---
  const [isSelfTestModalOpen, setIsSelfTestModalOpen] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'complete'>('idle');

  // Calculate active configuration for AI calls
  const aiConfig = useMemo<AIConfig>(() => {
      const provider = globalSettings.activeProvider;
      const conn = globalSettings.aiConnections[provider];
      return {
          provider,
          apiKey: conn?.apiKey || '',
          modelId: conn?.modelId || 'gemini-2.5-flash',
          baseUrl: conn?.baseUrl
      };
  }, [globalSettings]);

  // Load Global Settings on Mount
  useEffect(() => {
      try {
          const savedSettings = localStorage.getItem(GLOBAL_SETTINGS_KEY);
          if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              // Merge with defaults to ensure new fields exist
              setGlobalSettings(prev => ({ ...prev, ...parsed }));
              setIsToolsPanelOpen(parsed.toolsBarOpenByDefault ?? true);
          }
      } catch (e) {
          console.error("Failed to load global settings", e);
      }
  }, []);

  // Save Global Settings when changed
  const handleGlobalSettingsChange = (settings: GlobalSettings) => {
      setGlobalSettings(settings);
      localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
  };

  // --- Helper to resolve tool prompts (with subtool fallback) ---
  const getToolPrompt = useCallback((tool: string, subTool?: string | null) => {
      const prompts = systemPromptConfig.toolPrompts || DEFAULT_TOOL_PROMPTS;
      
      // 1. Check for specific subtool override (e.g. "triz:contradiction")
      if (subTool && prompts[`${tool}:${subTool}`]) {
          return prompts[`${tool}:${subTool}`];
      }
      
      // 2. Check for category base prompt (e.g. "triz")
      if (prompts[tool]) {
          return prompts[tool];
      }
      
      // 3. Fallback to default constant
      return DEFAULT_TOOL_PROMPTS[tool];
  }, [systemPromptConfig]);

  const toggleTool = (toolName: string) => {
      setActiveTool(prev => {
          // If closing the bulk tool, ensure mode is reset
          if (prev === 'bulk' && toolName !== 'bulk') {
              setIsBulkEditActive(false);
          }
          return prev === toolName ? null : toolName;
      });
  };

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
      setIsChatPanelOpen(true);
  }, []);

  const handleDetachHistory = useCallback((id: string) => {
      if (!detachedHistoryIds.includes(id)) {
          setDetachedHistoryIds(prev => [...prev, id]);
          // Position new window
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
  }, [detachedHistoryIds]);

  // --- Tool Opening Logic (AI or History) ---
  const handleOpenTool = useCallback((tool: string, subTool?: string) => {
      setIsToolsPanelOpen(true);
      setActiveTool(tool);
      
      if (tool === 'triz') {
          setActiveTrizTool((subTool as TrizToolType) || 'contradiction');
          setIsTrizModalOpen(true);
      } else if (tool === 'lss') {
          setActiveLssTool((subTool as LssToolType) || 'dmaic');
          setIsLssModalOpen(true);
      } else if (tool === 'toc') {
          setActiveTocTool((subTool as TocToolType) || 'crt');
          setIsTocModalOpen(true);
      } else if (tool === 'ssm') {
          setActiveSsmTool((subTool as SsmToolType) || 'rich_picture');
          setIsSsmModalOpen(true);
      } else if (tool === 'scamper') {
          setScamperInitialDoc(null);
          setIsScamperModalOpen(true);
      } else if (tool === 'explorer') {
          if (subTool === 'treemap') setIsTreemapPanelOpen(true);
          else if (subTool === 'tags') setIsTagDistPanelOpen(true);
          else if (subTool === 'relationships') setIsRelDistPanelOpen(true);
          else if (subTool === 'sunburst') setIsSunburstPanelOpen(true);
          else setIsTreemapPanelOpen(true); // Default
      } else if (tool === 'tagcloud') {
          if (subTool === 'tags') setIsConceptCloudOpen(true);
          else if (subTool === 'nodes') setIsInfluenceCloudOpen(true);
          else if (subTool === 'words') setIsTextAnalysisOpen(true);
          else if (subTool === 'full_text') setIsFullTextAnalysisOpen(true);
          else setIsConceptCloudOpen(true);
      } else if (tool === 'swot') {
          setActiveSwotTool((subTool as SwotToolType) || 'matrix');
          setSwotInitialDoc(null); // Clear any doc context if opening fresh
          setIsSwotModalOpen(true);
      } else if (tool === 'mermaid') {
          setIsMermaidPanelOpen(true);
      }
  }, []);

  const handleReopenHistory = useCallback((entry: HistoryEntry) => {
      const toolId = entry.tool.split(':')[0].toLowerCase().trim(); 
      const subTool = entry.subTool;
      const params = entry.toolParams;

      if (toolId.includes('triz')) {
          setActiveTool('triz');
          setActiveTrizTool((subTool as TrizToolType) || null);
          setTrizInitialParams(params);
          setIsTrizModalOpen(true);
      } else if (toolId.includes('lss') || toolId.includes('lean') || toolId.includes('lean six sigma')) {
          setActiveTool('lss');
          setActiveLssTool((subTool as LssToolType) || null);
          setLssInitialParams(params);
          setIsLssModalOpen(true);
      } else if (toolId.includes('toc') || toolId.includes('theory of constraints')) {
          setActiveTool('toc');
          setActiveTocTool((subTool as TocToolType) || null);
          setTocInitialParams(params);
          setIsTocModalOpen(true);
      } else if (toolId.includes('ssm') || toolId.includes('soft systems')) {
          setActiveTool('ssm');
          setActiveSsmTool((subTool as SsmToolType) || null);
          setSsmInitialParams(params);
          setIsSsmModalOpen(true);
      } else if (toolId.includes('scamper')) {
          setActiveTool('scamper');
          if (params) {
              setScamperTrigger({ operator: params.operator, letter: params.letter });
          }
          setIsScamperModalOpen(true);
      } else if (toolId.includes('explorer')) {
          setActiveTool('explorer');
          handleExplorerToolSelect((subTool as ExplorerToolType) || 'treemap');
      } else if (toolId.includes('tagcloud') || toolId.includes('word')) {
          setActiveTool('tagcloud');
          handleTagCloudToolSelect((subTool as TagCloudToolType) || 'tags');
      } else if (toolId.includes('swot') || toolId.includes('strategic')) {
          setActiveTool('swot');
          setActiveSwotTool((subTool as SwotToolType) || 'matrix');
          setSwotInitialDoc(null);
          setIsSwotModalOpen(true);
      } else if (toolId.includes('diagram') || toolId.includes('mermaid')) {
          setActiveTool('mermaid');
          setIsMermaidPanelOpen(true);
      }
      setIsToolsPanelOpen(true);
  }, []);

  const handleTrizToolSelect = (tool: TrizToolType) => {
      setActiveTrizTool(tool);
      setIsTrizModalOpen(true);
      setTrizInitialParams(null); // Reset params on fresh open
  };

  const handleLssToolSelect = (tool: LssToolType) => {
      setActiveLssTool(tool);
      setIsLssModalOpen(true);
      setLssInitialParams(null);
  };

  const handleTocToolSelect = (tool: TocToolType) => {
      setActiveTocTool(tool);
      setIsTocModalOpen(true);
      setTocInitialParams(null);
  };

  const handleSsmToolSelect = (tool: SsmToolType) => {
      setActiveSsmTool(tool);
      setIsSsmModalOpen(true);
      setSsmInitialParams(null);
  };

  const handleExplorerToolSelect = (tool: ExplorerToolType) => {
      if (tool === 'treemap') setIsTreemapPanelOpen(prev => !prev);
      if (tool === 'tags') setIsTagDistPanelOpen(prev => !prev);
      if (tool === 'relationships') setIsRelDistPanelOpen(prev => !prev);
      if (tool === 'sunburst') {
          setIsSunburstPanelOpen(prev => !prev);
          // Reset sunburst state if opening
          setSunburstState(prev => ({ ...prev, active: true }));
      }
      setActiveTool(null); // Close the toolbar
  };

  const handleTagCloudToolSelect = (tool: TagCloudToolType) => {
      if (tool === 'tags') setIsConceptCloudOpen(prev => !prev);
      if (tool === 'nodes') setIsInfluenceCloudOpen(prev => !prev);
      if (tool === 'words') setIsTextAnalysisOpen(prev => !prev);
      if (tool === 'full_text') setIsFullTextAnalysisOpen(prev => !prev);
  };

  const handleSwotToolSelect = (tool: SwotToolType) => {
      setActiveSwotTool(tool);
      setSwotInitialDoc(null);
      setIsSwotModalOpen(true);
      setActiveTool(null); // Close the toolbar
  };

  const handleMermaidToolSelect = (tool: MermaidToolType) => {
      if (tool === 'editor') setIsMermaidPanelOpen(true);
  };

  // Reset bulk mode if tool is closed
  useEffect(() => {
      if (activeTool !== 'bulk') {
          setIsBulkEditActive(false);
      }
  }, [activeTool]);


  // --- State for Refs to allow synchronous access in batched AI actions ---
  const elementsRef = useRef<Element[]>([]);
  const relationshipsRef = useRef<Relationship[]>([]);
  const documentsRef = useRef<TapestryDocument[]>([]);
  const foldersRef = useRef<TapestryFolder[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    relationshipsRef.current = relationships;
  }, [relationships]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  const [modelsIndex, setModelsIndex] = useState<ModelMetadata[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [multiSelection, setMultiSelection] = useState<Set<string>>(new Set()); // New state for multi-selection
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [panelState, setPanelState] = useState<PanelState>({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isOpenModelModalOpen, setIsOpenModelModalOpen] = useState(false);
  const [isMarkdownPanelOpen, setIsMarkdownPanelOpen] = useState(false);
  const [isJSONPanelOpen, setIsJSONPanelOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [isMatrixPanelOpen, setIsMatrixPanelOpen] = useState(false);
  const [isTablePanelOpen, setIsTablePanelOpen] = useState(false);
  const [isGridPanelOpen, setIsGridPanelOpen] = useState(false);
  const [isDocumentPanelOpen, setIsDocumentPanelOpen] = useState(false); // Manager open state
  const [isKanbanPanelOpen, setIsKanbanPanelOpen] = useState(false);
  const [isPresentationPanelOpen, setIsPresentationPanelOpen] = useState(false);
  
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPatternGalleryModalOpen, setIsPatternGalleryModalOpen] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ localMetadata: ModelMetadata, diskMetadata: ModelMetadata, localData: any, diskData: any } | null>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(helpMenuRef, () => setIsHelpMenuOpen(false));
  
  // Main Menu State
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const mainMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(mainMenuRef, () => setIsMainMenuOpen(false));

  const [tagFilter, setTagFilter] = useState<{ included: Set<string>, excluded: Set<string> }>({ included: new Set(), excluded: new Set() });
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPhysicsModeActive, setIsPhysicsModeActive] = useState(false);
  const [originalElements, setOriginalElements] = useState<Element[] | null>(null);
  const graphCanvasRef = useRef<GraphCanvasRef>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const currentFileHandleRef = useRef<any>(null);
  
  // Panel System State (Lifted from RightPanelContainer)
  const [panelLayouts, setPanelLayouts] = useState<Record<string, PanelLayout>>({});
  const [activeDockedPanelId, setActiveDockedPanelId] = useState<string | null>(null);
  const [panelZIndex, setPanelZIndex] = useState(100);

  // Floating Panel State
  const [floatingPanelPos, setFloatingPanelPos] = useState<{x: number, y: number} | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Details Panel State (from User Request: drag details panel)
  const [detailsPanelPosition, setDetailsPanelPosition] = useState<{x: number, y: number} | null>(null);

  // --- Self Test Runner ---
  const runSelfTest = async () => {
      setIsSelfTestModalOpen(true);
      setTestStatus('running');
      setTestLogs([]);
      
      // Reset state: Close everything first
      const resetUI = () => {
          setIsReportPanelOpen(false);
          setIsTablePanelOpen(false);
          setIsMatrixPanelOpen(false);
          setIsGridPanelOpen(false);
          setIsKanbanPanelOpen(false);
          setIsPresentationPanelOpen(false);
          setIsDocumentPanelOpen(false);
          setIsHistoryPanelOpen(false);
          setIsChatPanelOpen(false);
          setIsMarkdownPanelOpen(false);
          setIsJSONPanelOpen(false);
          setIsTreemapPanelOpen(false);
          setIsTagDistPanelOpen(false);
          setIsRelDistPanelOpen(false);
          setIsSunburstPanelOpen(false);
          setIsConceptCloudOpen(false);
          setIsInfluenceCloudOpen(false);
          setIsTextAnalysisOpen(false);
          setIsFullTextAnalysisOpen(false);
          setIsMermaidPanelOpen(false);
          setIsTrizModalOpen(false);
          setIsScamperModalOpen(false);
          setIsLssModalOpen(false);
          setIsTocModalOpen(false);
          setIsSsmModalOpen(false);
          setIsSwotModalOpen(false);
          setActiveTool(null);
          setPanelLayouts({}); // Reset docking/floating
      };
      
      resetUI();
      await new Promise(r => setTimeout(r, 500)); // Wait for clear

      const log = (name: string, status: 'running' | 'ok' | 'error' | 'pending', message?: string) => {
          setTestLogs(prev => {
              // Update existing log entry if it exists (to change running -> ok/error)
              const existingIndex = prev.findIndex(l => l.name === name);
              if (existingIndex >= 0) {
                  const newLogs = [...prev];
                  newLogs[existingIndex] = { ...newLogs[existingIndex], status, message };
                  return newLogs;
              }
              // Add new log
              return [...prev, { id: prev.length + 1, name, status, message }];
          });
      };

      const checkElement = (selector: string) => {
          // Search body text if specific ID not found, or use data-testid
          const el = document.querySelector(selector);
          if (el) return true;
          
          // Fallback: search for text content in body if checking a modal title
          if (selector.startsWith('text:')) {
              return document.body.textContent?.includes(selector.substring(5));
          }
          return false;
      };

      const testPanel = async (name: string, openFn: () => void, closeFn: () => void, checkId: string) => {
          log(name, 'running');
          openFn();
          await new Promise(r => setTimeout(r, 200)); // Render wait
          const success = checkElement(`[data-testid="${checkId}"]`);
          log(name, success ? 'ok' : 'error');
          closeFn();
          await new Promise(r => setTimeout(r, 50));
      };

      // Phase 1: Panels (Dockable)
      const panels = [
          { name: 'Report Panel', open: () => setIsReportPanelOpen(true), close: () => setIsReportPanelOpen(false), id: 'panel-report' },
          { name: 'Table View', open: () => setIsTablePanelOpen(true), close: () => setIsTablePanelOpen(false), id: 'panel-table' },
          { name: 'Matrix View', open: () => setIsMatrixPanelOpen(true), close: () => setIsMatrixPanelOpen(false), id: 'panel-matrix' },
          { name: 'Grid View', open: () => setIsGridPanelOpen(true), close: () => setIsGridPanelOpen(false), id: 'panel-grid' },
          { name: 'Documents', open: () => setIsDocumentPanelOpen(true), close: () => setIsDocumentPanelOpen(false), id: 'panel-documents' },
          { name: 'Kanban', open: () => setIsKanbanPanelOpen(true), close: () => setIsKanbanPanelOpen(false), id: 'panel-kanban' },
          { name: 'Story Mode', open: () => setIsPresentationPanelOpen(true), close: () => setIsPresentationPanelOpen(false), id: 'panel-presentation' },
          { name: 'History', open: () => setIsHistoryPanelOpen(true), close: () => setIsHistoryPanelOpen(false), id: 'panel-history' },
          { name: 'Markdown', open: () => setIsMarkdownPanelOpen(true), close: () => setIsMarkdownPanelOpen(false), id: 'panel-markdown' },
          { name: 'JSON', open: () => setIsJSONPanelOpen(true), close: () => setIsJSONPanelOpen(false), id: 'panel-json' },
          { name: 'Mermaid Diagrams', open: () => setIsMermaidPanelOpen(true), close: () => setIsMermaidPanelOpen(false), id: 'panel-mermaid' },
          { name: 'Treemap', open: () => setIsTreemapPanelOpen(true), close: () => setIsTreemapPanelOpen(false), id: 'panel-treemap' },
          { name: 'Sunburst', open: () => setIsSunburstPanelOpen(true), close: () => setIsSunburstPanelOpen(false), id: 'panel-sunburst' },
          { name: 'Tag Cloud', open: () => setIsConceptCloudOpen(true), close: () => setIsConceptCloudOpen(false), id: 'panel-concept-cloud' },
      ];

      for (const p of panels) {
          await testPanel(p.name, p.open, p.close, p.id);
      }

      // Phase 2: Tools & Modals
      // Strategy: Open Toolbar -> Verify -> Open Modal -> Verify Text -> Close
      const testTool = async (toolId: string, toolName: string, checkText: string, openModal?: () => void, closeModal?: () => void) => {
          log(`${toolName} Toolbar`, 'running');
          setIsToolsPanelOpen(true);
          setActiveTool(toolId);
          await new Promise(r => setTimeout(r, 400)); // Wait for expansion transition
          // Verify toolbar exists by looking for unique tool buttons or headers in DOM (rough check by text)
          // Most toolbars render a header or buttons with specific text.
          // We rely on the user seeing it blink, but programmatically we check if body has the toolbar text
          const toolbarOk = document.body.innerText.includes(toolName.toUpperCase()); 
          log(`${toolName} Toolbar`, toolbarOk ? 'ok' : 'error');

          if (openModal && closeModal) {
              log(`${toolName} Modal`, 'running');
              openModal();
              await new Promise(r => setTimeout(r, 400)); // Modal anim
              const modalOk = document.body.innerText.includes(checkText);
              log(`${toolName} Modal`, modalOk ? 'ok' : 'error', modalOk ? undefined : `Expected text '${checkText}' not found`);
              closeModal();
              await new Promise(r => setTimeout(r, 50));
          }
          setActiveTool(null);
          await new Promise(r => setTimeout(r, 50));
      };

      await testTool('scamper', 'SCAMPER', 'Generating ideas for', () => setIsScamperModalOpen(true), () => setIsScamperModalOpen(false));
      await testTool('triz', 'TRIZ', 'Contradiction Matrix', () => { setActiveTrizTool('contradiction'); setIsTrizModalOpen(true); }, () => setIsTrizModalOpen(false));
      await testTool('lss', 'LSS', 'Project Charter', () => { setActiveLssTool('charter'); setIsLssModalOpen(true); }, () => setIsLssModalOpen(false));
      await testTool('toc', 'TOC', 'Current Reality Tree', () => { setActiveTocTool('crt'); setIsTocModalOpen(true); }, () => setIsTocModalOpen(false));
      await testTool('ssm', 'SSM', 'Rich Picture', () => { setActiveSsmTool('rich_picture'); setIsSsmModalOpen(true); }, () => setIsSsmModalOpen(false));
      await testTool('swot', 'Strategy', 'SWOT Matrix', () => { setActiveSwotTool('matrix'); setIsSwotModalOpen(true); }, () => setIsSwotModalOpen(false));
      
      // Tools without unique modals (just toolbars or re-using panels)
      await testTool('schema', 'Schema', 'Active Schema');
      await testTool('layout', 'Layout', 'Spread');
      await testTool('analysis', 'Analysis', 'Simulation');
      await testTool('bulk', 'Bulk', 'Add Tags');
      await testTool('command', 'CMD', 'Quick Add');

      setTestStatus('complete');
  };

  const allTags = useMemo(() => { const tags = new Set<string>(); elements.forEach(element => { element.tags.forEach(tag => tags.add(tag)); }); return Array.from(tags).sort(); }, [elements]);
  const tagCounts = useMemo(() => { const counts = new Map<string, number>(); elements.forEach(element => { element.tags.forEach(tag => { counts.set(tag, (counts.get(tag) || 0) + 1); }); }); return counts; }, [elements]);
  useEffect(() => { setTagFilter(prevFilter => { const allTagsSet = new Set(allTags); const newIncluded = new Set<string>(); for (const tag of allTags) { const wasPreviouslyIncluded = prevFilter.included.has(tag); const wasPreviouslyExcluded = prevFilter.excluded.has(tag); if (wasPreviouslyIncluded) { newIncluded.add(tag); } else if (!wasPreviouslyExcluded) { newIncluded.add(tag); } } const newExcluded = new Set<string>(); for (const tag of prevFilter.excluded) { if (allTagsSet.has(tag)) { newExcluded.add(tag); } } return { included: newIncluded, excluded: newExcluded }; }); }, [allTags]);
  
  // --- Sunburst Logic ---
  const getSunburstNodes = useCallback((centerId: string, depth: number) => {
      const visibleIds = new Set<string>([centerId]);
      let currentLayer = [centerId];
      
      for (let i = 0; i < depth; i++) {
          const nextLayer: string[] = [];
          currentLayer.forEach(nodeId => {
              relationships.forEach(rel => {
                  if (rel.source === nodeId && !visibleIds.has(rel.target as string)) {
                      visibleIds.add(rel.target as string);
                      nextLayer.push(rel.target as string);
                  }
                  if (rel.target === nodeId && !visibleIds.has(rel.source as string)) {
                      visibleIds.add(rel.source as string);
                      nextLayer.push(rel.source as string);
                  }
              });
          });
          currentLayer = nextLayer;
      }
      return visibleIds;
  }, [relationships]);

  const filteredElements = useMemo(() => { 
      // --- Sunburst Filtering ---
      if (isSunburstPanelOpen && sunburstState.active && sunburstState.centerId) {
          const visibleIds = getSunburstNodes(sunburstState.centerId, sunburstState.hops);
          return elements.filter(e => visibleIds.has(e.id));
      }

      const { included, excluded } = tagFilter; 
      const matchesDate = (element: Element) => { 
          const createdDate = element.createdAt.substring(0, 10); 
          const updatedDate = element.updatedAt.substring(0, 10); 
          if (dateFilter.createdAfter && createdDate < dateFilter.createdAfter) return false; 
          if (dateFilter.createdBefore && createdDate > dateFilter.createdBefore) return false; 
          if (dateFilter.updatedAfter && updatedDate < dateFilter.updatedAfter) return false; 
          if (dateFilter.updatedBefore && updatedDate > dateFilter.updatedBefore) return false; 
          return true; 
      }; 
      
      return elements.filter(element => { 
          if (!matchesDate(element)) return false; 
          
          // Analysis Filters (Hide/Hide Others)
          if (analysisFilterState.mode === 'hide') {
              if (analysisFilterState.ids.has(element.id)) return false;
          } else if (analysisFilterState.mode === 'hide_others') {
              if (!analysisFilterState.ids.has(element.id)) return false;
          }

          // Tag Filters
          if (excluded.size === 0 && included.size === allTags.length) return true; 
          if (element.tags.some(tag => excluded.has(tag))) return false; 
          if (element.tags.length === 0) return true; 
          return element.tags.some(tag => included.has(tag)); 
      }); 
  }, [elements, tagFilter, allTags, dateFilter, analysisFilterState, isSunburstPanelOpen, sunburstState, getSunburstNodes]);

  const filteredRelationships = useMemo(() => { const { included, excluded } = tagFilter; const visibleElementIds = new Set(filteredElements.map(f => f.id)); return relationships.filter(rel => visibleElementIds.has(rel.source as string) && visibleElementIds.has(rel.target as string)); }, [relationships, filteredElements, tagFilter, allTags]);

  const currentModelName = useMemo(() => modelsIndex.find(m => m.id === currentModelId)?.name || 'Loading...', [modelsIndex, currentModelId]);
  
  // Revised migration logic to return changes report
  const migrateLegacySchemes = useCallback((loadedSchemes: ColorScheme[]): { schemes: ColorScheme[], changes: string[] } => {
    const changes: string[] = [];
    const migratedSchemes = loadedSchemes.map(s => {
        const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === s.id);
        
        // Legacy relationship labels migration
        if (s.relationshipLabels && !s.relationshipDefinitions) {
            if (defaultScheme && defaultScheme.relationshipDefinitions) {
                const defaultLabels = new Set(defaultScheme.relationshipDefinitions.map(d => d.label));
                const extraLabels = s.relationshipLabels.filter(l => !defaultLabels.has(l));
                s.relationshipDefinitions = [
                    ...defaultScheme.relationshipDefinitions,
                    ...extraLabels.map(l => ({ label: l, description: '' }))
                ];
            } else {
                s.relationshipDefinitions = s.relationshipLabels.map(l => ({ label: l, description: '' }));
            }
            delete s.relationshipLabels;
            changes.push(`Migrated legacy relationship labels for schema '${s.name}'.`);
        }

        if (defaultScheme) {
            // Check for missing tags and merge
            const currentTagKeys = Object.keys(s.tagColors);
            const defaultTagKeys = Object.keys(defaultScheme.tagColors);
            const missingTags = defaultTagKeys.filter(key => !currentTagKeys.includes(key));

            if (missingTags.length > 0) {
                s.tagColors = { ...defaultScheme.tagColors, ...s.tagColors };
                
                const currentDescs = s.tagDescriptions || {};
                const defaultDescs = defaultScheme.tagDescriptions || {};
                s.tagDescriptions = { ...defaultDescs, ...currentDescs };

                changes.push(`Updated schema '${s.name}': Added missing tags (${missingTags.join(', ')}).`);
            }

            // Check for missing relationship definitions
            if (s.relationshipDefinitions && defaultScheme.relationshipDefinitions) {
                const currentLabels = s.relationshipDefinitions.map(d => d.label);
                const defaultDefs = defaultScheme.relationshipDefinitions;
                const missingDefs = defaultDefs.filter(d => !currentLabels.includes(d.label));

                if (missingDefs.length > 0) {
                    s.relationshipDefinitions = [...s.relationshipDefinitions, ...missingDefs];
                    changes.push(`Updated schema '${s.name}': Added missing relationship types (${missingDefs.map(d => d.label).join(', ')}).`);
                }
            }
        }
        return s;
    });

    return { schemes: migratedSchemes, changes };
  }, []);

  const loadModelData = useCallback((data: any, modelId: string, modelMetadata?: ModelMetadata) => {
    setElements(data.elements || []);
    setRelationships(data.relationships || []);
    setDocuments(data.documents || []);
    setFolders(data.folders || []);
    setHistory(data.history || []);
    setSlides(data.slides || []);
    setMermaidDiagrams(data.mermaidDiagrams || []);
    setOpenDocIds([]); 
    setDetachedHistoryIds([]);
    setPanelLayouts({});
    setAnalysisHighlights(new Map()); // Clear highlights on load
    setAnalysisFilterState({ mode: 'none', ids: new Set() }); // Reset analysis filters
    setMultiSelection(new Set()); // Reset multi selection
    setSelectedElementId(null);
    
    let loadedSchemes = data.colorSchemes || DEFAULT_COLOR_SCHEMES;
    
    // Run migration and check for updates
    const { schemes: migratedSchemes, changes } = migrateLegacySchemes(loadedSchemes);
    
    // Add completely missing default schemes
    const existingSchemeIds = new Set(migratedSchemes.map((s: ColorScheme) => s.id));
    const missingDefaults = DEFAULT_COLOR_SCHEMES.filter(ds => !existingSchemeIds.has(ds.id));
    
    let finalSchemes = migratedSchemes;
    if (missingDefaults.length > 0) {
        finalSchemes = [...migratedSchemes, ...missingDefaults];
        changes.push(`Added ${missingDefaults.length} new standard schemas (${missingDefaults.map(s => s.name).join(', ')}).`);
    }

    setColorSchemes(finalSchemes);
    setActiveSchemeId(data.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null);
    
    // Show notification if changes occurred
    if (changes.length > 0) {
        setSchemaUpdateChanges(changes);
        setIsSchemaUpdateModalOpen(true);
    }

    // Merge loaded prompt config with default structure to ensure new fields (enabledTools, etc.) exist
    if (data.systemPromptConfig) {
        setSystemPromptConfig({ ...DEFAULT_SYSTEM_PROMPT_CONFIG, ...data.systemPromptConfig });
    } else {
        setSystemPromptConfig(DEFAULT_SYSTEM_PROMPT_CONFIG);
    }
    
    setCurrentModelId(modelId);
    localStorage.setItem(LAST_OPENED_MODEL_ID_KEY, modelId);
    setIsOpenModelModalOpen(false);
    setTagFilter({ included: new Set(), excluded: new Set() });
    setDateFilter({ createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' });
    if (modelMetadata && !modelMetadata.filename) {
        currentFileHandleRef.current = null;
    }
    if (modelMetadata) {
        setModelsIndex(prevIndex => {
            const exists = prevIndex.find(m => m.id === modelId);
            if (exists) {
                return prevIndex.map(m => m.id === modelId ? { ...m, ...modelMetadata } : m);
            } else {
                return [...prevIndex, modelMetadata];
            }
        });
    }
  }, [migrateLegacySchemes]);

  const handleLoadModel = useCallback((modelId: string) => { const modelDataString = localStorage.getItem(`${MODEL_DATA_PREFIX}${modelId}`); if (modelDataString) { const data = JSON.parse(modelDataString); currentFileHandleRef.current = null; loadModelData(data, modelId); } }, [loadModelData]);
  useEffect(() => { if (!isInitialLoad) return; try { const indexStr = localStorage.getItem(MODELS_INDEX_KEY); const index = indexStr ? JSON.parse(indexStr) : []; setModelsIndex(index); } catch (error) { console.error("Failed to load models index:", error); setModelsIndex([]); } setIsInitialLoad(false); }, [isInitialLoad]);
  useEffect(() => { if (!isInitialLoad) { localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(modelsIndex)); } }, [modelsIndex, isInitialLoad]);
  useEffect(() => { if (currentModelId && !isInitialLoad) { const modelData = { elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams }; const currentContentHash = computeContentHash(modelData); const currentMeta = modelsIndex.find(m => m.id === currentModelId); if (!currentMeta || currentMeta.contentHash !== currentContentHash) { localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData)); setModelsIndex(prevIndex => { const now = new Date().toISOString(); return prevIndex.map(m => m.id === currentModelId ? { ...m, updatedAt: now, contentHash: currentContentHash } : m); }); } } }, [elements, relationships, documents, folders, colorSchemes, activeSchemeId, currentModelId, isInitialLoad, modelsIndex, systemPromptConfig, history, slides, mermaidDiagrams]);
  
  const handleCreateModel = useCallback((name: string, description: string) => { const now = new Date().toISOString(); const newModelData = { elements: [], relationships: [], documents: [], folders: [], colorSchemes: DEFAULT_COLOR_SCHEMES, activeSchemeId: DEFAULT_COLOR_SCHEMES[0]?.id || null, systemPromptConfig: DEFAULT_SYSTEM_PROMPT_CONFIG, history: [], slides: [], mermaidDiagrams: [] }; const initialHash = computeContentHash(newModelData); const newModel: ModelMetadata = { id: generateUUID(), name, description, createdAt: now, updatedAt: now, filename: `${name.replace(/ /g, '_')}.json`, contentHash: initialHash, }; setModelsIndex(prevIndex => [...prevIndex, newModel]); localStorage.setItem(`${MODEL_DATA_PREFIX}${newModel.id}`, JSON.stringify(newModelData)); currentFileHandleRef.current = null; handleLoadModel(newModel.id); setIsCreateModelModalOpen(false); }, [handleLoadModel]);
  // ... (Rest of actions same as previous, omitted for brevity) ...
  // Re-declaring actions for context
  const handleAddElement = useCallback((coords: { x: number; y: number }) => { const now = new Date().toISOString(); const newElement: Element = { id: generateUUID(), name: 'New Element', notes: '', tags: [...defaultTags], createdAt: now, updatedAt: now, x: coords.x, y: coords.y, fx: coords.x, fy: coords.y, }; setElements(prev => [...prev, newElement]); setSelectedElementId(newElement.id); setMultiSelection(new Set([newElement.id])); setSelectedRelationshipId(null); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); }, [defaultTags]);
  const handleAddElementFromName = useCallback((name: string) => { const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2; const randomOffset = () => (Math.random() - 0.5) * 100; const now = new Date().toISOString(); const newElement: Element = { id: generateUUID(), name: name, notes: '', tags: [...defaultTags], createdAt: now, updatedAt: now, x: centerX + randomOffset(), y: centerY + randomOffset(), fx: null, fy: null, }; setElements(prev => [...prev, newElement]); }, [defaultTags]);
  const handleUpdateElement = useCallback((updatedElement: Element) => { setElements(prev => prev.map(f => f.id === updatedElement.id ? { ...updatedElement, updatedAt: new Date().toISOString() } : f)); }, []);
  const handleDeleteElement = useCallback((elementId: string) => { setElements(prev => prev.filter(f => f.id !== elementId)); setRelationships(prev => prev.filter(r => r.source !== elementId && r.target !== elementId)); if (selectedElementId === elementId) { setSelectedElementId(null); } if (multiSelection.has(elementId)) { const next = new Set(multiSelection); next.delete(elementId); setMultiSelection(next); } }, [selectedElementId, multiSelection]);
  const handleBulkTagAction = useCallback((elementIds: string[], tag: string, mode: 'add' | 'remove') => { setElements(prev => prev.map(e => { if (elementIds.includes(e.id)) { let newTags = [...e.tags]; if (mode === 'add') { if (!newTags.includes(tag)) { newTags.push(tag); } else { return e; } } else { if (newTags.includes(tag)) { newTags = newTags.filter(t => t !== tag); } else { return e; } } return { ...e, tags: newTags, updatedAt: new Date().toISOString() }; } return e; })); }, []);
  const handleAddRelationship = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>, newElementData?: Omit<Element, 'id' | 'createdAt' | 'updatedAt'>) => { let finalRelationship: Relationship = { ...relationship, id: generateUUID(), tags: [] }; if (newElementData) { const now = new Date().toISOString(); const newElement: Element = { ...newElementData, id: generateUUID(), createdAt: now, updatedAt: now, }; setElements(prev => [...prev, newElement]); finalRelationship.target = newElement.id; } setRelationships(prev => [...prev, finalRelationship]); if (newElementData) { setSelectedElementId(panelState.sourceElementId || null); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); } else { setSelectedRelationshipId(finalRelationship.id); setSelectedElementId(null); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); } }, [panelState.sourceElementId]);
  const handleAddRelationshipDirect = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>) => { const newRel: Relationship = { ...relationship, id: generateUUID(), tags: [] }; setRelationships(prev => [...prev, newRel]); }, []);
  const handleCancelAddRelationship = useCallback(() => { if (panelState.isNewTarget && panelState.targetElementId) { handleDeleteElement(panelState.targetElementId); } setSelectedElementId(panelState.sourceElementId || null); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); }, [panelState, handleDeleteElement]);
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

        // Handle Special Document Types
        if (doc.type === 'swot-analysis') {
            setActiveTool('swot');
            setActiveSwotTool('matrix');
            setSwotInitialDoc(doc);
            setIsSwotModalOpen(true);
            return;
        } else if (doc.type === 'five-forces-analysis') {
            setActiveTool('swot');
            setActiveSwotTool('five_forces');
            setSwotInitialDoc(doc);
            setIsSwotModalOpen(true);
            return;
        } else if (doc.type === 'scamper-analysis') {
            setActiveTool('scamper');
            setScamperInitialDoc(doc);
            setIsScamperModalOpen(true);
            return;
        }

        if (!openDocIds.includes(docId)) { setOpenDocIds(prev => [...prev, docId]); }
        
        if (origin === 'report') { 
            const reportLayout = panelLayouts['report']; 
            let x = 100, y = 100; 
            if (reportLayout && reportLayout.isFloating) { x = reportLayout.x + reportLayout.w + 20; y = reportLayout.y; } else if (isReportPanelOpen) { x = window.innerWidth - 600 - 520; y = 100; } 
            if (x < 20) x = 20; if (x > window.innerWidth - 100) x = window.innerWidth - 600; 
            const nextZ = panelZIndex + 1; 
            setPanelZIndex(nextZ); 
            setPanelLayouts(prev => ({ ...prev, [`doc-${docId}`]: { x, y, w: 500, h: 600, zIndex: nextZ, isFloating: true } })); 
        }
  }, [documents, openDocIds, panelLayouts, isReportPanelOpen, panelZIndex]);

  // --- Mermaid Actions ---
  const handleSaveMermaidDiagram = useCallback((diagram: MermaidDiagram) => {
      setMermaidDiagrams(prev => {
          const existingIndex = prev.findIndex(d => d.id === diagram.id);
          if (existingIndex >= 0) {
              const newDiagrams = [...prev];
              newDiagrams[existingIndex] = diagram;
              return newDiagrams;
          } else {
              return [...prev, diagram];
          }
      });
  }, []);

  const handleDeleteMermaidDiagram = useCallback((id: string) => {
      if (confirm("Delete this diagram?")) {
          setMermaidDiagrams(prev => prev.filter(d => d.id !== id));
      }
  }, []);

  const handleGenerateMermaid = useCallback(async (prompt: string, contextMarkdown?: string) => {
      setIsMermaidGenerating(true);
      try {
          // Use provided context, or generate default full graph context
          const graphMarkdown = contextMarkdown || generateMarkdownFromGraph(elements, relationships);
          const fullPrompt = `
          You are an expert in Mermaid.js diagram syntax.
          The user wants you to generate or update a Mermaid diagram based on the following knowledge graph data.
          
          TASK: ${prompt}
          
          GRAPH CONTEXT (Markdown Format):
          ${graphMarkdown}
          
          Instructions:
          1. Analyze the graph context.
          2. Generate valid Mermaid markdown code that visualizes this structure according to the user's specific request (e.g. Flowchart, Mindmap, Sequence, etc.).
          3. ONLY return the mermaid code block (enclosed in \`\`\`mermaid ... \`\`\`). Do not include extra conversational text.
          `;
          
          const response = await callAI(aiConfig, fullPrompt);
          return response.text || "";
      } catch (e) {
          console.error("Mermaid Gen Error", e);
          alert("Failed to generate diagram.");
          return "";
      } finally {
          setIsMermaidGenerating(false);
      }
  }, [elements, relationships, aiConfig]);

  // --- AI Actions Adapter ---
  const aiActions: ModelActions = useMemo(() => {
    const findElementByName = (name: string): Element | undefined => {
      return elementsRef.current.find(e => e.name.toLowerCase() === name.toLowerCase());
    };
    const findDocumentByTitle = (title: string): TapestryDocument | undefined => {
        return documentsRef.current.find(d => d.title.toLowerCase() === title.toLowerCase());
    };
    return {
      addElement: (data) => {
        const now = new Date().toISOString();
        const id = generateUUID();
        const count = elementsRef.current.length;
        const angle = count * 0.5;
        const radius = 50 + (5 * count);
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const newElement: Element = { id, name: data.name, notes: data.notes || '', tags: data.tags || [], attributes: data.attributes || {}, createdAt: now, updatedAt: now, x, y, fx: x, fy: y };
        elementsRef.current = [...elementsRef.current, newElement];
        setElements(prev => [...prev, newElement]);
        return id;
      },
      updateElement: (name, data) => {
        const element = findElementByName(name);
        if (!element) return false;
        const updatedElement = { ...element, ...data, updatedAt: new Date().toISOString() };
        if (data.tags) { updatedElement.tags = Array.from(new Set([...element.tags, ...data.tags])); }
        elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updatedElement : e);
        setElements(prev => prev.map(e => e.id === element.id ? updatedElement : e));
        return true;
      },
      deleteElement: (name) => {
        const element = findElementByName(name);
        if (!element) return false;
        elementsRef.current = elementsRef.current.filter(f => f.id !== element.id);
        relationshipsRef.current = relationshipsRef.current.filter(r => r.source !== element.id && r.target !== element.id);
        handleDeleteElement(element.id);
        return true;
      },
      addRelationship: (sourceName, targetName, label, directionStr) => {
        const source = findElementByName(sourceName);
        const target = findElementByName(targetName);
        if (!source || !target) return false;
        let direction = RelationshipDirection.To;
        if (directionStr) { if (directionStr.toUpperCase() === 'FROM') direction = RelationshipDirection.From; if (directionStr.toUpperCase() === 'NONE') direction = RelationshipDirection.None; }
        const newRel: Relationship = { id: generateUUID(), source: source.id, target: target.id, label: label, direction: direction, tags: [] };
        relationshipsRef.current = [...relationshipsRef.current, newRel];
        setRelationships(prev => [...prev, newRel]);
        return true;
      },
      deleteRelationship: (sourceName, targetName) => {
        const source = findElementByName(sourceName);
        const target = findElementByName(targetName);
        if (!source || !target) return false;
        relationshipsRef.current = relationshipsRef.current.filter(r => { const isMatch = (r.source === source.id && r.target === target.id) || (r.source === target.id && r.target === source.id); return !isMatch; });
        setRelationships(prev => prev.filter(r => { const isMatch = (r.source === source.id && r.target === target.id) || (r.source === target.id && r.target === source.id); return !isMatch; }));
        return true;
      },
      setElementAttribute: (elementName, key, value) => {
          const element = findElementByName(elementName);
          if (!element) return false;
          const attributes = { ...(element.attributes || {}), [key]: value };
          const updated = { ...element, attributes, updatedAt: new Date().toISOString() };
          elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updated : e);
          setElements(prev => prev.map(e => e.id === element.id ? updated : e));
          return true;
      },
      deleteElementAttribute: (elementName, key) => {
          const element = findElementByName(elementName);
          if (!element) return false;
          const attributes = { ...(element.attributes || {}) };
          delete attributes[key];
          const updated = { ...element, attributes, updatedAt: new Date().toISOString() };
          elementsRef.current = elementsRef.current.map(e => e.id === element.id ? updated : e);
          setElements(prev => prev.map(e => e.id === element.id ? updated : e));
          return true;
      },
      setRelationshipAttribute: (sourceName, targetName, key, value) => {
          const source = findElementByName(sourceName);
          const target = findElementByName(targetName);
          if (!source || !target) return false;
          let relIndex = relationshipsRef.current.findIndex(r => r.source === source.id && r.target === target.id);
          if (relIndex === -1) { relIndex = relationshipsRef.current.findIndex(r => r.source === target.id && r.target === source.id); }
          if (relIndex === -1) return false;
          const rel = relationshipsRef.current[relIndex];
          const attributes = { ...(rel.attributes || {}), [key]: value };
          const updated = { ...rel, attributes };
          relationshipsRef.current = [...relationshipsRef.current];
          relationshipsRef.current[relIndex] = updated;
          setRelationships(prev => prev.map(r => r.id === rel.id ? updated : r));
          return true;
      },
      deleteRelationshipAttribute: (sourceName, targetName, key) => {
          const source = findElementByName(sourceName);
          const target = findElementByName(targetName);
          if (!source || !target) return false;
          let relIndex = relationshipsRef.current.findIndex(r => r.source === source.id && r.target === target.id);
          if (relIndex === -1) { relIndex = relationshipsRef.current.findIndex(r => r.source === target.id && r.target === source.id); }
          if (relIndex === -1) return false;
          const rel = relationshipsRef.current[relIndex];
          const attributes = { ...(rel.attributes || {}) };
          delete attributes[key];
          const updated = { ...rel, attributes };
          relationshipsRef.current = [...relationshipsRef.current];
          relationshipsRef.current[relIndex] = updated;
          setRelationships(prev => prev.map(r => r.id === rel.id ? updated : r));
          return true;
      },
      readDocument: (title) => { const doc = findDocumentByTitle(title); return doc ? doc.content : null; },
      createDocument: (title, content = '', type = 'text', data = null) => { 
          const now = new Date().toISOString(); 
          const newDoc: TapestryDocument = { id: generateUUID(), title, content, folderId: null, createdAt: now, updatedAt: now, type, data }; 
          documentsRef.current = [...documentsRef.current, newDoc]; 
          setDocuments(prev => [...prev, newDoc]); 
          if (!openDocIds.includes(newDoc.id)) { setOpenDocIds(prev => [...prev, newDoc.id]); } 
          return newDoc.id; 
      },
      updateDocument: (title, content, mode) => { const doc = findDocumentByTitle(title); if (!doc) return false; let newContent = content; if (mode === 'append') { newContent = doc.content ? `${doc.content}\n\n${content}` : content; } const updatedDoc = { ...doc, content: newContent, updatedAt: new Date().toISOString() }; documentsRef.current = documentsRef.current.map(d => d.id === doc.id ? updatedDoc : d); setDocuments(prev => prev.map(d => d.id === doc.id ? updatedDoc : d)); return true; },
      createFolder: (name, parentId) => {
          const id = generateUUID();
          const newFolder: TapestryFolder = { id, name, parentId: parentId || null, createdAt: new Date().toISOString() };
          foldersRef.current = [...foldersRef.current, newFolder];
          setFolders(prev => [...prev, newFolder]);
          return id;
      },
      moveDocument: (docId, folderId) => {
          const doc = documentsRef.current.find(d => d.id === docId);
          if (!doc) return false;
          const updatedDoc = { ...doc, folderId, updatedAt: new Date().toISOString() };
          documentsRef.current = documentsRef.current.map(d => d.id === docId ? updatedDoc : d);
          setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
          return true;
      }
    };
  }, [handleDeleteElement, openDocIds]);

  // --- SCAMPER Actions ---
  const handleScamperTrigger = (operator: string, letter: string) => {
      if (!selectedElementId) {
          alert("Please select a node first to apply SCAMPER.");
          return;
      }
      setScamperInitialDoc(null);
      setScamperTrigger({ operator, letter });
      setIsScamperModalOpen(true);
  };

  const handleDiskSave = useCallback(async () => {
    // ... (Keep existing implementation)
    if (!currentModelId) { alert("No active model to save."); return; }
    const modelMetadata = modelsIndex.find(m => m.id === currentModelId);
    if (!modelMetadata) { alert("Could not find model metadata to save."); return; }
    const now = new Date().toISOString();
    const modelData = { elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams };
    const currentHash = computeContentHash(modelData);
    const updatedMetadata = { ...modelMetadata, updatedAt: now, filename: modelMetadata.filename || `${modelMetadata.name.replace(/ /g, '_')}.json`, contentHash: currentHash, lastDiskHash: currentHash };
    const exportData = { metadata: updatedMetadata, data: modelData, };
    const jsonString = JSON.stringify(exportData, null, 2);
    try {
        if (!isInIframe() && currentFileHandleRef.current && 'createWritable' in currentFileHandleRef.current) { 
            const writable = await currentFileHandleRef.current.createWritable(); 
            await writable.write(jsonString); 
            await writable.close(); 
        } else if (!isInIframe() && 'showSaveFilePicker' in window) { 
            const options = { suggestedName: updatedMetadata.filename, types: [{ description: 'JSON Files', accept: {'application/json': ['.json']}, }], }; 
            const fileHandle = await (window as any).showSaveFilePicker(options); 
            currentFileHandleRef.current = fileHandle; 
            const writable = await fileHandle.createWritable(); 
            await writable.write(jsonString); 
            await writable.close(); 
        } else { 
            const blob = new Blob([jsonString], { type: 'application/json' }); 
            const url = URL.createObjectURL(blob); 
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = updatedMetadata.filename!; 
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a); 
            URL.revokeObjectURL(url); 
        }
        setModelsIndex(prev => prev.map(m => m.id === currentModelId ? updatedMetadata : m));
        localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(modelsIndex.map(m => m.id === currentModelId ? updatedMetadata : m)));
        localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));
    } catch (err: any) { if (err.name !== 'AbortError') { console.error("Save failed:", err); alert("Failed to save file. You can try using the 'Export' feature in JSON view as a backup."); } }
  }, [currentModelId, modelsIndex, elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams]);

  const handleSaveAs = useCallback((name: string, description: string) => {
    if (!currentModelId) return;
    
    const now = new Date().toISOString();
    const newId = generateUUID();
    
    // Prepare Data (Clone current state)
    const modelData = { 
        elements, relationships, documents, folders, 
        colorSchemes, activeSchemeId, systemPromptConfig, 
        history, slides, mermaidDiagrams 
    };
    const currentHash = computeContentHash(modelData);
    
    // Prepare Metadata
    const newMetadata: ModelMetadata = {
        id: newId,
        name,
        description,
        createdAt: now,
        updatedAt: now,
        filename: `${name.replace(/ /g, '_')}.json`,
        contentHash: currentHash
    };

    // Storage Operations
    try {
        localStorage.setItem(`${MODEL_DATA_PREFIX}${newId}`, JSON.stringify(modelData));
        
        setModelsIndex(prev => {
            const newIndex = [...prev, newMetadata];
            localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(newIndex));
            return newIndex;
        });

        // Switch Context
        setCurrentModelId(newId);
        setIsSaveAsModalOpen(false);
        
        // Reset file handle as this is a new "file" in memory
        currentFileHandleRef.current = null;
        
    } catch (e) {
        console.error("Save As failed", e);
        alert("Failed to save copy. Local storage might be full.");
    }
  }, [currentModelId, elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams]);

  // (Import/Export logic identical to original, omitted for brevity)
  const processImportedData = useCallback((text: string, filename?: string) => {
        try {
            const imported = JSON.parse(text);
            let dataToImport: any = null;
            let nameToUse = 'Imported Model';
            let descToUse = '';
            let existingId: string | null = null;
            let importedHash: string = '';
            if (imported.metadata && imported.data && Array.isArray(imported.data.elements)) { dataToImport = imported.data; nameToUse = imported.metadata.name || nameToUse; descToUse = imported.metadata.description || ''; existingId = imported.metadata.id; importedHash = computeContentHash(dataToImport); } 
            else if (imported.elements && Array.isArray(imported.elements)) { dataToImport = imported; importedHash = computeContentHash(dataToImport); }
            if (!dataToImport) { throw new Error('Invalid file format.'); }
            if (!dataToImport.relationships) dataToImport.relationships = [];
            if (existingId) { const localDataStr = localStorage.getItem(`${MODEL_DATA_PREFIX}${existingId}`); if (localDataStr) { const localIndex = modelsIndex.find(m => m.id === existingId); if (localIndex) { const localHash = localIndex.contentHash || computeContentHash(JSON.parse(localDataStr)); if (localHash !== importedHash) { setPendingImport({ localMetadata: localIndex, diskMetadata: { ...imported.metadata, filename: filename || imported.metadata.filename, contentHash: importedHash, lastDiskHash: importedHash }, localData: JSON.parse(localDataStr), diskData: dataToImport }); return; } } } }
            const now = new Date().toISOString();
            const newModelId = existingId || generateUUID();
            if (!existingId) { let finalModelName = nameToUse; let i = 1; while(modelsIndex.some(m => m.name === finalModelName)) { i++; finalModelName = `${nameToUse} ${i}`; } nameToUse = finalModelName; }
            const newMetadata: ModelMetadata = { id: newModelId, name: nameToUse, description: descToUse, createdAt: imported.metadata?.createdAt || now, updatedAt: imported.metadata?.updatedAt || now, filename: filename, contentHash: importedHash, lastDiskHash: importedHash };
            const newModelData = { elements: dataToImport.elements || [], relationships: dataToImport.relationships || [], documents: dataToImport.documents || [], folders: dataToImport.folders || [], history: dataToImport.history || [], slides: dataToImport.slides || [], mermaidDiagrams: dataToImport.mermaidDiagrams || [], colorSchemes: dataToImport.colorSchemes || DEFAULT_COLOR_SCHEMES, activeSchemeId: dataToImport.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null, systemPromptConfig: dataToImport.systemPromptConfig || DEFAULT_SYSTEM_PROMPT_CONFIG, };
            loadModelData(newModelData, newModelId, newMetadata);
        } catch (error) { const message = error instanceof Error ? error.message : 'An unknown error occurred.'; alert(`Failed to import file: ${message}`); console.error("Import failed:", error); }
  }, [modelsIndex, loadModelData]);

  const handleImportClick = useCallback(async () => { 
      if (!isInIframe() && 'showOpenFilePicker' in window) { 
          try { 
              const pickerOptions = { types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }], }; 
              const [fileHandle] = await (window as any).showOpenFilePicker(pickerOptions); 
              currentFileHandleRef.current = fileHandle; 
              const file = await fileHandle.getFile(); 
              const text = await file.text(); 
              processImportedData(text, file.name); 
              return; 
          } catch (err: any) { 
              if (err.name !== 'AbortError') { 
                  console.warn("File System Access API failed, falling back to input.", err); 
              } else { 
                  return; 
              } 
          } 
      } 
      if (importFileRef.current) { importFileRef.current.value = ''; importFileRef.current.click(); } 
  }, [processImportedData]);
  const handleImportInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; currentFileHandleRef.current = null; const reader = new FileReader(); reader.onload = (e) => { const text = e.target?.result as string; processImportedData(text, file.name); }; reader.readAsText(file); }, [processImportedData]);
  const handleApplyJSON = useCallback((data: any) => { try { if (data.elements && Array.isArray(data.elements)) { setElements(data.elements); } if (data.relationships && Array.isArray(data.relationships)) { setRelationships(data.relationships); } if (data.documents && Array.isArray(data.documents)) { setDocuments(data.documents); } if (data.folders && Array.isArray(data.folders)) { setFolders(data.folders); } if (data.history && Array.isArray(data.history)) { setHistory(data.history); } if (data.slides && Array.isArray(data.slides)) { setSlides(data.slides); } if (data.mermaidDiagrams && Array.isArray(data.mermaidDiagrams)) { setMermaidDiagrams(data.mermaidDiagrams); } if (data.colorSchemes && Array.isArray(data.colorSchemes)) { const { schemes } = migrateLegacySchemes(data.colorSchemes); setColorSchemes(schemes); } if (data.activeSchemeId) { setActiveSchemeId(data.activeSchemeId); } if (data.systemPromptConfig) { setSystemPromptConfig(data.systemPromptConfig); } setIsJSONPanelOpen(false); } catch (e) { alert("Failed to apply JSON data: " + (e instanceof Error ? e.message : String(e))); } }, [migrateLegacySchemes]);
  const handleNewModelClick = useCallback(async () => { if (currentModelId) { const currentMeta = modelsIndex.find(m => m.id === currentModelId); const modelData = { elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams }; const currentHash = computeContentHash(modelData); const isDirty = currentMeta?.lastDiskHash !== currentHash; const isEmpty = elements.length === 0; if (isDirty && !isEmpty) { if (confirm("You have unsaved changes. Do you want to save your current model before creating a new one?")) { await handleDiskSave(); } } } setIsCreateModelModalOpen(true); }, [currentModelId, modelsIndex, elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, handleDiskSave]);

  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);
  const handleCloseCanvasContextMenu = useCallback(() => setCanvasContextMenu(null), []);
  
  const runImpactSimulation = (startNodeId: string) => {
      const newSimState: Record<string, SimulationNodeState> = {};
      const queue: { id: string, state: SimulationNodeState }[] = [];
      
      // Start
      newSimState[startNodeId] = simulationState[startNodeId] === 'increased' ? 'decreased' : 'increased';
      queue.push({ id: startNodeId, state: newSimState[startNodeId] });

      const visited = new Set<string>();
      visited.add(startNodeId);

      // Relationship Logic
      const isPositive = (label: string) => ['causes', 'increases', 'promotes', 'leads to', 'produces', 'enables', 'enhances', 'amplifies', 'reinforces'].some(k => label.toLowerCase().includes(k));
      const isNegative = (label: string) => ['inhibits', 'decreases', 'prevents', 'reduces', 'stops', 'block', 'counteracts'].some(k => label.toLowerCase().includes(k));

      while (queue.length > 0) {
          const { id, state } = queue.shift()!;
          
          // Find outgoing edges
          const outgoing = relationships.filter(r => r.source === id);
          
          outgoing.forEach(rel => {
              const targetId = rel.target as string;
              if (visited.has(targetId)) return;

              let nextState: SimulationNodeState = 'neutral';
              
              if (isPositive(rel.label)) {
                  nextState = state; // Propagate same
              } else if (isNegative(rel.label)) {
                  nextState = state === 'increased' ? 'decreased' : 'increased'; // Flip
              }

              if (nextState !== 'neutral') {
                  newSimState[targetId] = nextState;
                  visited.add(targetId);
                  queue.push({ id: targetId, state: nextState });
              }
          });
      }
      setSimulationState(newSimState);
  };

  const handleAnalysisHighlight = useCallback((highlightMap: Map<string, string>) => {
      setAnalysisHighlights(highlightMap);
  }, []);

  const handleAnalysisFilter = useCallback((mode: 'hide' | 'hide_others' | 'none', ids: Set<string>) => {
      setAnalysisFilterState({ mode, ids });
  }, []);

  const handleNodeClick = useCallback((elementId: string, event: MouseEvent) => { 
      if (isSimulationMode) {
          runImpactSimulation(elementId);
          return;
      }
      
      // Sunburst Activation Logic
      if (isSunburstPanelOpen && sunburstState.active) {
          // 1. Save layout if not saved (and this is the first center selection)
          if (!originalElements && !sunburstState.centerId) {
             setOriginalElements(elements);
          }
          
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;

          // Update elements to center the selected node and free others
          setElements(prev => prev.map(e => {
              if (e.id === elementId) {
                  // Pin center
                  return { ...e, x: cx, y: cy, fx: cx, fy: cy, vx: 0, vy: 0 };
              }
              // Free others
              return { ...e, fx: null, fy: null };
          }));

          // Set as new center, preserve existing hops
          setSunburstState(prev => ({ ...prev, centerId: elementId }));
          
          // Ensure physics is on
          setIsPhysicsModeActive(true);

          // Highlight the new center (Select it)
          setSelectedElementId(elementId);
          setMultiSelection(new Set([elementId]));
          
          // Center camera
          setTimeout(() => {
              if (graphCanvasRef.current) {
                  graphCanvasRef.current.setCamera(0, 0, 1);
              }
          }, 50);
          
          return;
      }

      if (isBulkEditActive) { if (bulkTagsToAdd.length === 0 && bulkTagsToRemove.length === 0) return; setElements(prev => prev.map(el => { if (el.id === elementId) { const currentTags = el.tags; let newTags = [...currentTags]; let changed = false; const lowerToRemove = bulkTagsToRemove.map(t => t.toLowerCase()); const filteredTags = newTags.filter(t => !lowerToRemove.includes(t.toLowerCase())); if (filteredTags.length !== newTags.length) { newTags = filteredTags; changed = true; } const lowerCurrent = newTags.map(t => t.toLowerCase()); const toAdd = bulkTagsToAdd.filter(t => !lowerCurrent.includes(t.toLowerCase())); if (toAdd.length > 0) { newTags = [...newTags, ...toAdd]; changed = true; } if (changed) { return { ...el, tags: newTags, updatedAt: new Date().toISOString() }; } } return el; })); return; } 
      
      // Multi-Selection Logic
      if (event.ctrlKey || event.metaKey) {
          const newMulti = new Set(multiSelection);
          if (newMulti.has(elementId)) {
              newMulti.delete(elementId);
          } else {
              newMulti.add(elementId);
          }
          setMultiSelection(newMulti);
          // If added, set as primary for details panel
          if (newMulti.has(elementId)) {
              setSelectedElementId(elementId);
          } else if (selectedElementId === elementId) {
              // If primary deselected, unset primary or pick another
              setSelectedElementId(newMulti.size > 0 ? Array.from(newMulti).pop() || null : null);
          }
      } else {
          setMultiSelection(new Set([elementId]));
          setSelectedElementId(elementId);
      }

      setSelectedRelationshipId(null); 
      setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
      handleCloseContextMenu(); 
  }, [handleCloseContextMenu, isBulkEditActive, bulkTagsToAdd, bulkTagsToRemove, isSimulationMode, relationships, simulationState, multiSelection, selectedElementId, isSunburstPanelOpen, sunburstState, elements, originalElements]);
  
  const handleLinkClick = useCallback((relationshipId: string) => { setSelectedRelationshipId(relationshipId); setSelectedElementId(null); setMultiSelection(new Set()); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); }, [handleCloseContextMenu]);
  const handleCanvasClick = useCallback(() => { setSelectedElementId(null); setMultiSelection(new Set()); setSelectedRelationshipId(null); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); handleCloseCanvasContextMenu(); setAnalysisHighlights(new Map()); }, [handleCloseContextMenu, handleCloseCanvasContextMenu]);
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, elementId: string) => { event.preventDefault(); setContextMenu({ x: event.clientX, y: event.clientY, elementId }); handleCloseCanvasContextMenu(); }, [handleCloseCanvasContextMenu]);
  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => { event.preventDefault(); setCanvasContextMenu({ x: event.clientX, y: event.clientY }); handleCloseContextMenu(); }, [handleCloseContextMenu]);
  const handleNodeConnect = useCallback((sourceId: string, targetId: string) => { const currentScheme = colorSchemes.find(s => s.id === activeSchemeId); let defaultLabel = ''; if (currentScheme && currentScheme.defaultRelationshipLabel) { defaultLabel = currentScheme.defaultRelationshipLabel; } const newRelId = generateUUID(); const newRel: Relationship = { id: newRelId, source: sourceId, target: targetId, label: defaultLabel, direction: RelationshipDirection.To, tags: [] }; setRelationships(prev => [...prev, newRel]); setSelectedRelationshipId(newRelId); setSelectedElementId(null); setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); handleCloseContextMenu(); }, [activeSchemeId, colorSchemes, handleCloseContextMenu]);
  const handleNodeConnectToNew = useCallback((sourceId: string, coords: { x: number; y: number }) => { const now = new Date().toISOString(); const newElement: Element = { id: generateUUID(), name: 'New Element', notes: '', tags: [...defaultTags], createdAt: now, updatedAt: now, x: coords.x, y: coords.y, fx: coords.x, fy: coords.y, }; setElements(prev => [...prev, newElement]); setPanelState({ view: 'addRelationship', sourceElementId: sourceId, targetElementId: newElement.id, isNewTarget: true }); setSelectedElementId(null); setSelectedRelationshipId(null); handleCloseContextMenu(); }, [defaultTags, handleCloseContextMenu]);
  const handleUpdateDefaultRelationship = (newLabel: string) => { if (!activeSchemeId) return; setColorSchemes(prev => prev.map(s => s.id === activeSchemeId ? { ...s, defaultRelationshipLabel: newLabel } : s)); };
  const handleToggleFocusMode = () => { setFocusMode(prev => { if (prev === 'narrow') return 'wide'; if (prev === 'wide') return 'zoom'; return 'narrow'; }); };
  
  // --- Copy / Paste Handlers ---
  const handleCopy = async () => {
      const idsToCopy = multiSelection.size > 0 ? Array.from(multiSelection) : (selectedElementId ? [selectedElementId] : []);
      if (idsToCopy.length === 0) return;

      const selectedEls = elements.filter(e => idsToCopy.includes(e.id));
      const selectedRels = relationships.filter(r => idsToCopy.includes(r.source as string) && idsToCopy.includes(r.target as string));

      // Format 1: Human-readable Text Report
      const textReport = generateSelectionReport(selectedEls, selectedRels);
      
      // Format 2: Store data in internal clipboard for App pasting
      setInternalClipboard({ 
          elements: selectedEls, 
          relationships: selectedRels 
      });

      try {
          await navigator.clipboard.writeText(textReport);
          alert(`Copied ${selectedEls.length} items to clipboard (Text Report). App-data ready for paste.`);
      } catch (err) {
          console.warn("Copy failed", err);
          alert("Failed to copy text to system clipboard.");
      }
  };

  const handlePaste = () => {
      if (!internalClipboard) {
          alert("Internal clipboard is empty.");
          return;
      }

      const { elements: pastedElements, relationships: pastedRelationships } = internalClipboard;
      
      if (pastedElements.length === 0) return;

      // Process Paste: Remap IDs and Offset Positions
      const idMap = new Map<string, string>();
      const now = new Date().toISOString();
      
      // 1. Map IDs
      pastedElements.forEach((el: Element) => {
          idMap.set(el.id, generateUUID());
      });

      // 2. Create New Elements
      const newElements = pastedElements.map((el: Element) => ({
          ...el,
          id: idMap.get(el.id)!,
          x: (el.x || 0) + 50, // Offset
          y: (el.y || 0) + 50,
          fx: (el.fx ? el.fx + 50 : null), // Only offset fx/fy if they exist
          fy: (el.fy ? el.fy + 50 : null),
          createdAt: now,
          updatedAt: now
      }));

      // 3. Create New Relationships
      const newRelationships = pastedRelationships.map((rel: Relationship) => ({
          ...rel,
          id: generateUUID(),
          source: idMap.get(rel.source as string) || rel.source, // Should map, fallback safe
          target: idMap.get(rel.target as string) || rel.target
      }));

      // 4. Update State
      setElements(prev => [...prev, ...newElements]);
      setRelationships(prev => [...prev, ...newRelationships]);
      
      // 5. Select pasted items
      const newSelection = new Set(newElements.map((e: Element) => e.id));
      setMultiSelection(newSelection);
      if (newElements.length > 0) setSelectedElementId(newElements[0].id);
  };

  const handleApplyMarkdown = (markdown: string, shouldMerge: boolean = false) => { 
    let processedMarkdown = markdown; 
    processedMarkdown = processedMarkdown.replace(/\s*\/>\s*/g, ' -[Counteracts]-> '); 
    processedMarkdown = processedMarkdown.replace(/(?<!\-|\[)>(?!\-|\])/g, ' -[Produces]-> '); 
    const lines = processedMarkdown.split('\n').filter(line => { const trimmed = line.trim(); return trimmed !== '' && !trimmed.startsWith('#'); }); 
    const parsedElements = new Map<string, { tags: string[] }>(); 
    const parsedRels: { sourceName: string, targetName: string, label: string, direction: RelationshipDirection }[] = []; 
    
    function parseElementStr(str: string) { 
      let workStr = str.trim(); 
      if (!workStr) return null; 
      let name: string; 
      let tags: string[] = []; 
      const lastColonIndex = workStr.lastIndexOf(':'); 
      const lastParenOpenIndex = workStr.lastIndexOf('('); 
      if (lastColonIndex > -1 && lastColonIndex > lastParenOpenIndex) { 
        const tagsStr = workStr.substring(lastColonIndex + 1); 
        tags = tagsStr.split(',').map(t => t.trim()).filter(t => !!t); 
        workStr = workStr.substring(0, lastColonIndex).trim(); 
      } 
      if (workStr.endsWith('+')) { 
        workStr = workStr.slice(0, -1).trim(); 
        tags.push('Useful'); 
      } else if (workStr.endsWith('-')) { 
        workStr = workStr.slice(0, -1).trim(); 
        tags.push('Harmful'); 
      } 
      name = workStr; 
      if (name.startsWith('"') && name.endsWith('"')) { 
        name = name.substring(1, name.length - 1); 
      } 
      if (!name) return null; 
      return { name, tags }; 
    }
    
    function updateParsedElement(elementData: { name: string, tags: string[] }) { 
      const existing = parsedElements.get(elementData.name); 
      if (existing) { 
        const newTags = [...new Set([...existing.tags, ...elementData.tags])]; 
        parsedElements.set(elementData.name, { tags: newTags }); 
      } else { 
        parsedElements.set(elementData.name, { tags: elementData.tags }); 
      } 
    }
    
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
        if (relStr.startsWith('<-')) direction = RelationshipDirection.From; 
        else if (relStr.endsWith('->')) direction = RelationshipDirection.To; 
        const targetElementStrs = targetsStr.split(';').map(t => t.trim()).filter(t => !!t); 
        for (const targetElementStr of targetElementStrs) { 
          const targetElementData = parseElementStr(targetElementStr); 
          if (targetElementData) { 
            updateParsedElement(targetElementData); 
            parsedRels.push({ sourceName: sourceElementData.name, targetName: targetElementData.name, label, direction }); 
          } 
        } 
        if (targetElementStrs.length === 1) { 
          currentSourceElementStr = targetElementStrs[0]; 
        } else { break; } 
      } 
    } 
    
    let nextElements: Element[] = []; 
    let nextRelationships: Relationship[] = []; 
    const newElementNames = new Set<string>(); 
    
    if (shouldMerge) { 
      nextElements = [...elements]; 
      nextRelationships = [...relationships]; 
      const existingMap = new Map<string, Element>(); 
      const nameToIdMap = new Map<string, string>(); 
      nextElements.forEach(e => { existingMap.set(e.name.toLowerCase(), e); nameToIdMap.set(e.name.toLowerCase(), e.id); }); 
      parsedElements.forEach(({ tags }, name) => { 
        const lowerName = name.toLowerCase(); 
        const existing = existingMap.get(lowerName); 
        if (existing) { 
          const mergedTags = Array.from(new Set([...existing.tags, ...tags])); 
          if (mergedTags.length !== existing.tags.length || !mergedTags.every(t => existing.tags.includes(t))) { 
            const updated = { ...existing, tags: mergedTags, updatedAt: new Date().toISOString() }; 
            const idx = nextElements.findIndex(e => e.id === existing.id); 
            if (idx !== -1) nextElements[idx] = updated; 
            existingMap.set(lowerName, updated); 
          } 
        } else { 
          const now = new Date().toISOString(); 
          const newId = generateUUID(); 
          const newEl: Element = { id: newId, name, tags, notes: '', createdAt: now, updatedAt: now }; 
          nextElements.push(newEl); 
          existingMap.set(lowerName, newEl); 
          nameToIdMap.set(lowerName, newId); 
          newElementNames.add(name); 
        } 
      }); 
      parsedRels.forEach(rel => { 
        const sId = nameToIdMap.get(rel.sourceName.toLowerCase()); 
        const tId = nameToIdMap.get(rel.targetName.toLowerCase()); 
        if (sId && tId) { 
          const exists = nextRelationships.some(r => r.source === sId && r.target === tId && r.label === rel.label && r.direction === rel.direction); 
          if (!exists) { nextRelationships.push({ id: generateUUID(), source: sId, target: tId, label: rel.label, direction: rel.direction, tags: [] }); } 
        } 
      }); 
    } else { 
      const nameToIdMap = new Map<string, string>(); 
      parsedElements.forEach(({ tags }, name) => { 
        const existing = elements.find(e => e.name.toLowerCase() === name.toLowerCase()); 
        if (existing) { 
          const updated = { ...existing, tags, updatedAt: new Date().toISOString() }; 
          nextElements.push(updated); 
          nameToIdMap.set(name.toLowerCase(), existing.id); 
        } else { 
          const now = new Date().toISOString(); 
          const newId = generateUUID(); 
          const newEl: Element = { id: newId, name, tags, notes: '', createdAt: now, updatedAt: now }; 
          nextElements.push(newEl); 
          nameToIdMap.set(name.toLowerCase(), newId); 
          newElementNames.add(name); 
        } 
      }); 
      parsedRels.forEach(rel => { 
        const sId = nameToIdMap.get(rel.sourceName.toLowerCase()); 
        const tId = nameToIdMap.get(rel.targetName.toLowerCase()); 
        if (sId && tId) { 
          nextRelationships.push({ id: generateUUID(), source: sId, target: tId, label: rel.label, direction: rel.direction, tags: [] }); 
        } 
      }); 
    } 
    
    let placedNewElementsCount = 0; 
    const positionNewElements = () => { 
      nextElements.forEach(element => { 
        if (newElementNames.has(element.name) && element.x === undefined) { 
          let connectedAnchor: Element | undefined; 
          for (const rel of nextRelationships) { 
            let anchorId: string | undefined; 
            if (rel.source === element.id) anchorId = rel.target as string; 
            else if (rel.target === element.id) anchorId = rel.source as string; 
            if (anchorId) { 
              const potentialAnchor = nextElements.find(f => f.id === anchorId && f.x !== undefined); 
              if (potentialAnchor) { connectedAnchor = potentialAnchor; break; } 
            } 
          } 
          if (connectedAnchor && connectedAnchor.x && connectedAnchor.y) { 
            element.x = connectedAnchor.x + (Math.random() - 0.5) * 300; 
            element.y = connectedAnchor.y + (Math.random() - 0.5) * 300; 
          } else { 
            element.x = 200 + (placedNewElementsCount * 50); 
            element.y = 200 + (placedNewElementsCount * 50); 
            placedNewElementsCount++; 
          } 
          element.fx = element.x; 
          element.fy = element.y; 
        } 
      }); 
    }; 
    
    positionNewElements(); 
    positionNewElements(); 
    setElements(nextElements); 
    setRelationships(nextRelationships); 
    if (!shouldMerge) setIsMarkdownPanelOpen(false); 
  };

  const handleStartPhysicsLayout = () => { setOriginalElements(elements); setElements(prev => prev.map(f => ({ ...f, fx: null, fy: null }))); setIsPhysicsModeActive(true); };
  const handleAcceptLayout = () => { const finalPositions = graphCanvasRef.current?.getFinalNodePositions(); if (finalPositions) { const positionsMap = new Map(finalPositions.map((p: { id: string; x: number; y: number; }) => [p.id, p])); setElements(prev => prev.map(element => { const pos = positionsMap.get(element.id); const posEntry = pos as { x: number; y: number } | undefined; return posEntry ? { ...element, x: posEntry.x, y: posEntry.y, fx: posEntry.x, fy: posEntry.y } : element; })); } setIsPhysicsModeActive(false); setOriginalElements(null); };
  const handleRejectLayout = () => { if (originalElements) { setElements(originalElements); } setIsPhysicsModeActive(false); setOriginalElements(null); };
  const handleScaleLayout = useCallback((factor: number) => { if (isPhysicsModeActive) return; setElements(prev => { if (prev.length === 0) return prev; const xs = prev.map(e => e.x || 0); const ys = prev.map(e => e.y || 0); const avgX = xs.reduce((a,b) => a+b, 0) / prev.length; const avgY = ys.reduce((a,b) => a+b, 0) / prev.length; return prev.map(e => { const x = e.x || 0; const y = e.y || 0; const dx = x - avgX; const dy = y - avgY; const newX = avgX + dx * factor; const newY = avgY + dy * factor; return { ...e, x: newX, y: newY, fx: newX, fy: newY, updatedAt: new Date().toISOString() }; }); }); }, [isPhysicsModeActive]);
  const handleZoomToFit = () => { graphCanvasRef.current?.zoomToFit(); };

  // --- Presentation Handlers ---
  const handleCaptureSlide = () => {
      const camera = graphCanvasRef.current?.getCamera() || { x: 0, y: 0, k: 1 };
      const newSlide: StorySlide = {
          id: generateUUID(),
          title: `Slide ${slides.length + 1}`,
          description: '',
          camera,
          selectedElementId: selectedElementId
      };
      setSlides(prev => [...prev, newSlide]);
  };

  const handlePlayPresentation = () => {
      if (slides.length > 0) {
          setIsPresenting(true);
          setCurrentSlideIndex(0);
      }
  };

  useEffect(() => {
      if (isPresenting && currentSlideIndex !== null && slides[currentSlideIndex]) {
          const slide = slides[currentSlideIndex];
          graphCanvasRef.current?.setCamera(slide.camera.x, slide.camera.y, slide.camera.k);
          setSelectedElementId(slide.selectedElementId);
      }
  }, [currentSlideIndex, isPresenting, slides]);

  // --- Panel Dragging Logic ---
  const handlePanelDragStart = (e: React.MouseEvent) => { if (!panelRef.current) return; const rect = panelRef.current.getBoundingClientRect(); dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }; if (!detailsPanelPosition) { setDetailsPanelPosition({ x: rect.left, y: rect.top }); } const handleMouseMove = (moveEvent: MouseEvent) => { if (dragStartRef.current) { setDetailsPanelPosition({ x: moveEvent.clientX - dragStartRef.current.x, y: moveEvent.clientY - dragStartRef.current.y }); } }; const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); dragStartRef.current = null; }; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); };
  const handleResetPanelPosition = () => { setDetailsPanelPosition(null); };

  const selectedElement = useMemo(() => elements.find(f => f.id === selectedElementId), [elements, selectedElementId]);
  const selectedRelationship = useMemo(() => relationships.find(r => r.id === selectedRelationshipId), [relationships, selectedRelationshipId]);
  const addRelationshipSourceElement = useMemo(() => elements.find(f => f.id === panelState.sourceElementId), [elements, panelState.sourceElementId]);
  const activeColorScheme = useMemo(() => { const current = colorSchemes.find(s => s.id === activeSchemeId); if (!current) return undefined; const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === current.id); if (defaultScheme) { const mergedTags = { ...defaultScheme.tagColors, ...current.tagColors }; const currentDefs = current.relationshipDefinitions || []; const defaultDefs = defaultScheme.relationshipDefinitions || []; const combinedDefsMap = new Map<string, RelationshipDefinition>(); defaultDefs.forEach(d => combinedDefsMap.set(d.label, d)); currentDefs.forEach(d => combinedDefsMap.set(d.label, d)); const mergedDefinitions = Array.from(combinedDefsMap.values()); const mergedDefaultLabel = current.defaultRelationshipLabel || defaultScheme.defaultRelationshipLabel; return { ...current, tagColors: mergedTags, relationshipDefinitions: mergedDefinitions, defaultRelationshipLabel: mergedDefaultLabel }; } return current; }, [colorSchemes, activeSchemeId]);
  const activeRelationshipLabels = useMemo(() => { return activeColorScheme?.relationshipDefinitions?.map(d => d.label) || []; }, [activeColorScheme]);
  const isRightPanelOpen = isReportPanelOpen || isMarkdownPanelOpen || isJSONPanelOpen || isMatrixPanelOpen || isTablePanelOpen || isGridPanelOpen || isDocumentPanelOpen || isHistoryPanelOpen || isKanbanPanelOpen || isPresentationPanelOpen || isMermaidPanelOpen || isTreemapPanelOpen || isTagDistPanelOpen || isRelDistPanelOpen || isSunburstPanelOpen || isConceptCloudOpen || isInfluenceCloudOpen || isTextAnalysisOpen || isFullTextAnalysisOpen || openDocIds.length > 0 || detachedHistoryIds.length > 0;

  // --- New Command Handlers ---
  const handleOpenCommandHistory = useCallback(() => {
    const cmdFolder = foldersRef.current.find(f => f.name === "CMD" && !f.parentId);
    let folderId = cmdFolder?.id;
    
    // If folder doesn't exist, create it and the doc
    if (!folderId) {
         folderId = generateUUID();
         const newFolder: TapestryFolder = { id: folderId, name: "CMD", parentId: null, createdAt: new Date().toISOString() };
         setFolders(prev => [...prev, newFolder]);
         foldersRef.current.push(newFolder); // optimistic update for immediate use below
    }
    
    let historyDoc = documentsRef.current.find(d => d.folderId === folderId && d.title === "History");
    let docId = historyDoc?.id;

    if (!historyDoc) {
        docId = generateUUID();
        const newDoc: TapestryDocument = {
            id: docId,
            title: "History",
            content: "# Command History\n",
            folderId: folderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setDocuments(prev => [...prev, newDoc]);
        documentsRef.current.push(newDoc); // optimistic
    }

    if (docId) {
        handleOpenDocument(docId, 'report');
    }
  }, [handleOpenDocument]);

  const handleCommandExecution = useCallback((markdown: string) => {
    // 1. Execute
    handleApplyMarkdown(markdown, true);

    // 2. Log
    const timestamp = new Date().toLocaleString();
    const logEntry = `\n\n[${timestamp}] \`${markdown}\``;

    let cmdFolder = foldersRef.current.find(f => f.name === "CMD" && !f.parentId);
    let folderId = cmdFolder?.id;

    if (!folderId) {
        folderId = generateUUID();
        const newFolder: TapestryFolder = { id: folderId, name: "CMD", parentId: null, createdAt: new Date().toISOString() };
        setFolders(prev => [...prev, newFolder]);
        // We don't strictly need to update ref here if we use functional update for documents that doesn't rely on ref, 
        // but consisteny is good.
        foldersRef.current.push(newFolder);
    }

    setDocuments(prev => {
        const historyDoc = prev.find(d => d.folderId === folderId && d.title === "History");
        if (historyDoc) {
            return prev.map(d => d.id === historyDoc.id ? { ...d, content: (d.content || "") + logEntry, updatedAt: new Date().toISOString() } : d);
        } else {
            return [...prev, {
                id: generateUUID(),
                title: "History",
                content: `# Command History${logEntry}`,
                folderId: folderId!,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }];
        }
    });
  }, [handleApplyMarkdown]);

  // Construct dynamic panel definitions
  const panelDefinitions: PanelDefinition[] = useMemo(() => {
    const staticPanels: PanelDefinition[] = [
        { id: 'report', title: 'Report', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, content: <ReportPanel elements={filteredElements} relationships={filteredRelationships} onClose={() => setIsReportPanelOpen(false)} onNodeClick={(id) => handleNodeClick(id, new MouseEvent('click'))} documents={documents} folders={folders} onOpenDocument={(id) => handleOpenDocument(id, 'report')} />, isOpen: isReportPanelOpen, onToggle: () => setIsReportPanelOpen(prev => !prev) },
        { id: 'documents', title: 'Documents', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, content: <DocumentManagerPanel documents={documents} folders={folders} onOpenDocument={handleOpenDocument} onCreateFolder={handleCreateFolder} onCreateDocument={handleCreateDocument} onDeleteDocument={handleDeleteDocument} onDeleteFolder={handleDeleteFolder} onClose={() => setIsDocumentPanelOpen(false)} />, isOpen: isDocumentPanelOpen, onToggle: () => setIsDocumentPanelOpen(prev => !prev) },
        { id: 'table', title: 'Table', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>, content: <TablePanel elements={filteredElements} relationships={filteredRelationships} onUpdateElement={handleUpdateElement} onDeleteElement={handleDeleteElement} onAddElement={handleAddElementFromName} onAddRelationship={handleAddRelationshipDirect} onDeleteRelationship={handleDeleteRelationship} onClose={() => setIsTablePanelOpen(false)} onNodeClick={(id) => handleNodeClick(id, new MouseEvent('click'))} selectedElementId={selectedElementId} />, isOpen: isTablePanelOpen, onToggle: () => setIsTablePanelOpen(prev => !prev) },
        { id: 'matrix', title: 'Matrix', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, content: <MatrixPanel elements={filteredElements} relationships={filteredRelationships} onClose={() => setIsMatrixPanelOpen(false)} />, isOpen: isMatrixPanelOpen, onToggle: () => setIsMatrixPanelOpen(prev => !prev) },
        { id: 'grid', title: 'Grid', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /></svg>, content: <GridPanel elements={filteredElements} activeColorScheme={activeColorScheme} onClose={() => setIsGridPanelOpen(false)} onNodeClick={(id) => handleNodeClick(id, new MouseEvent('click'))} />, isOpen: isGridPanelOpen, onToggle: () => setIsGridPanelOpen(prev => !prev) },
        { id: 'kanban', title: 'Kanban', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>, content: <KanbanPanel elements={filteredElements} modelActions={aiActions} onClose={() => setIsKanbanPanelOpen(false)} />, isOpen: isKanbanPanelOpen, onToggle: () => setIsKanbanPanelOpen(prev => !prev) },
        { id: 'presentation', title: 'Story', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, content: <PresentationPanel slides={slides} onSlidesChange={setSlides} onCaptureSlide={handleCaptureSlide} onPlay={handlePlayPresentation} onClose={() => setIsPresentationPanelOpen(false)} />, isOpen: isPresentationPanelOpen, onToggle: () => setIsPresentationPanelOpen(prev => !prev) },
        { 
            id: 'mermaid', 
            title: 'Diagrams', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>, 
            content: <MermaidPanel 
                        savedDiagrams={mermaidDiagrams} 
                        onSaveDiagram={handleSaveMermaidDiagram} 
                        onDeleteDiagram={handleDeleteMermaidDiagram} 
                        onGenerate={handleGenerateMermaid} 
                        onClose={() => setIsMermaidPanelOpen(false)} 
                        isGenerating={isMermaidGenerating} 
                        elements={elements}
                        relationships={relationships}
                        multiSelection={multiSelection}
                     />, 
            isOpen: isMermaidPanelOpen, 
            onToggle: () => setIsMermaidPanelOpen(prev => !prev) 
        },
        { id: 'markdown', title: 'Markdown', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>, content: <MarkdownPanel initialText={generateMarkdownFromGraph(elements, relationships)} onApply={(md) => handleApplyMarkdown(md, false)} onClose={() => setIsMarkdownPanelOpen(false)} modelName={currentModelName} />, isOpen: isMarkdownPanelOpen, onToggle: () => setIsMarkdownPanelOpen(prev => !prev) },
        { id: 'json', title: 'JSON', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>, content: <JSONPanel initialData={{ elements, relationships, documents, folders, colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams }} onApply={handleApplyJSON} onClose={() => setIsJSONPanelOpen(false)} modelName={currentModelName} />, isOpen: isJSONPanelOpen, onToggle: () => setIsJSONPanelOpen(prev => !prev) },
        { id: 'history', title: 'History', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, content: <HistoryPanel history={history} onClose={() => setIsHistoryPanelOpen(false)} onDetach={handleDetachHistory} onReopen={handleReopenHistory} onAnalyze={handleAnalyzeWithChat} onDelete={handleDeleteHistory} />, isOpen: isHistoryPanelOpen, onToggle: () => setIsHistoryPanelOpen(prev => !prev) },
        // --- Explorer Panels ---
        { 
            id: 'treemap', 
            title: 'Treemap', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, 
            content: <TreemapPanel elements={filteredElements} relationships={filteredRelationships} onNodeSelect={(id) => handleNodeClick(id, new MouseEvent('click'))} />, 
            isOpen: isTreemapPanelOpen, 
            onToggle: () => setIsTreemapPanelOpen(p => !p) 
        },
        { 
            id: 'sunburst', 
            title: 'Sunburst', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
            content: <SunburstPanel
                        centerNodeName={elements.find(e => e.id === sunburstState.centerId)?.name || null}
                        hops={sunburstState.hops}
                        visibleCount={filteredElements.length}
                        onHopsChange={(newHops) => setSunburstState(prev => ({ ...prev, hops: newHops }))}
                        onRestart={() => {
                            setSunburstState(prev => ({ ...prev, centerId: null, hops: 0 }));
                            setIsPhysicsModeActive(false);
                            // Restore layout
                            if (originalElements) {
                                setElements(originalElements);
                                setOriginalElements(null);
                            }
                        }}
                        onReset={() => {
                             // Reset focus to center node (hops 0)
                             setSunburstState(prev => ({ ...prev, hops: 0 }));
                             // Re-center camera just in case
                             graphCanvasRef.current?.setCamera(0,0,1);
                        }}
                        onClose={() => {
                            setIsSunburstPanelOpen(false);
                            setSunburstState(prev => ({ ...prev, active: false }));
                            setIsPhysicsModeActive(false);
                            // Restore layout
                            if (originalElements) {
                                setElements(originalElements);
                                setOriginalElements(null);
                            }
                        }}
                     />,
            isOpen: isSunburstPanelOpen,
            onToggle: () => {
                const willOpen = !isSunburstPanelOpen;
                setIsSunburstPanelOpen(willOpen);
                
                if (willOpen) {
                    setSunburstState(prev => ({ ...prev, active: true }));
                } else {
                    // Closing
                    setSunburstState(prev => ({ ...prev, active: false }));
                    setIsPhysicsModeActive(false);
                    if (originalElements) {
                        setElements(originalElements);
                        setOriginalElements(null);
                    }
                }
            }
        },
        { 
            id: 'tag-dist', 
            title: 'Tag Distribution', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
            content: <TagDistributionPanel elements={filteredElements} />, 
            isOpen: isTagDistPanelOpen, 
            onToggle: () => setIsTagDistPanelOpen(p => !p) 
        },
        { 
            id: 'rel-dist', 
            title: 'Relationship Types', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
            content: <RelationshipDistributionPanel relationships={filteredRelationships} />, 
            isOpen: isRelDistPanelOpen, 
            onToggle: () => setIsRelDistPanelOpen(p => !p) 
        },
        // --- Tag Cloud Panels ---
        { 
            id: 'concept-cloud', 
            title: 'Tag Cloud', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
            content: <TagCloudPanel mode='tags' elements={filteredElements} relationships={filteredRelationships} onNodeSelect={(id) => handleNodeClick(id, new MouseEvent('click'))} />, 
            isOpen: isConceptCloudOpen, 
            onToggle: () => setIsConceptCloudOpen(p => !p) 
        },
        { 
            id: 'influence-cloud', 
            title: 'Relationship Cloud', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
            content: <TagCloudPanel mode='nodes' elements={filteredElements} relationships={filteredRelationships} onNodeSelect={(id) => handleNodeClick(id, new MouseEvent('click'))} />, 
            isOpen: isInfluenceCloudOpen, 
            onToggle: () => setIsInfluenceCloudOpen(p => !p) 
        },
        { 
            id: 'text-cloud', 
            title: 'Node Name Analysis', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, 
            content: <TagCloudPanel mode='words' elements={filteredElements} relationships={filteredRelationships} onNodeSelect={(id) => handleNodeClick(id, new MouseEvent('click'))} />, 
            isOpen: isTextAnalysisOpen, 
            onToggle: () => setIsTextAnalysisOpen(p => !p) 
        },
        { 
            id: 'full-text-cloud', 
            title: 'Full Text Analysis', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>, 
            content: <TagCloudPanel mode='full_text' elements={filteredElements} relationships={filteredRelationships} onNodeSelect={(id) => handleNodeClick(id, new MouseEvent('click'))} />, 
            isOpen: isFullTextAnalysisOpen, 
            onToggle: () => setIsFullTextAnalysisOpen(p => !p) 
        },
    ];

    const docPanels: PanelDefinition[] = openDocIds.map((id): PanelDefinition | null => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return null;
        return { id: `doc-${id}`, title: doc.title, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, content: <DocumentEditorPanel document={doc} onUpdate={handleUpdateDocument} onClose={() => setOpenDocIds(prev => prev.filter(did => did !== id))} />, isOpen: true, onToggle: () => setOpenDocIds(prev => prev.filter(did => did !== id)) };
    }).filter((p): p is PanelDefinition => p !== null);

    const historyItemPanels: PanelDefinition[] = detachedHistoryIds.map((id): PanelDefinition | null => {
        const entry = history.find(h => h.id === id);
        if (!entry) return null;
        return { id: `history-${id}`, title: `${entry.tool} (${new Date(entry.timestamp).toLocaleTimeString()})`, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, content: <HistoryItemPanel entry={entry} onClose={() => setDetachedHistoryIds(prev => prev.filter(hid => hid !== id))} onReopen={handleReopenHistory} onAnalyze={handleAnalyzeWithChat} onDelete={() => handleDeleteHistory(id)} />, isOpen: true, onToggle: () => setDetachedHistoryIds(prev => prev.filter(hid => hid !== id)) };
    }).filter((p): p is PanelDefinition => p !== null);

    return [...staticPanels, ...docPanels, ...historyItemPanels];
  }, [ isReportPanelOpen, isDocumentPanelOpen, isTablePanelOpen, isMatrixPanelOpen, isGridPanelOpen, isMarkdownPanelOpen, isJSONPanelOpen, isHistoryPanelOpen, isKanbanPanelOpen, isPresentationPanelOpen, isMermaidPanelOpen, isMermaidGenerating, isTreemapPanelOpen, isTagDistPanelOpen, isRelDistPanelOpen, isSunburstPanelOpen, sunburstState, isConceptCloudOpen, isInfluenceCloudOpen, isTextAnalysisOpen, isFullTextAnalysisOpen, filteredElements, filteredRelationships, elements, relationships, documents, folders, openDocIds, currentModelName, activeColorScheme, history, slides, mermaidDiagrams, detachedHistoryIds, handleNodeClick, handleUpdateElement, handleDeleteElement, handleAddElementFromName, handleAddRelationshipDirect, handleDeleteRelationship, handleApplyMarkdown, handleApplyJSON, handleOpenDocument, handleCreateFolder, handleCreateDocument, handleDeleteDocument, handleDeleteFolder, handleUpdateDocument, handleDetachHistory, handleReopenHistory, handleAnalyzeWithChat, handleDeleteHistory, aiActions, handleCaptureSlide, handlePlayPresentation, handleSaveMermaidDiagram, handleDeleteMermaidDiagram, handleGenerateMermaid, selectedElementId, multiSelection, getSunburstNodes ]);

  if (isInitialLoad && !isCreateModelModalOpen) { return ( <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white"> Loading... </div> ); }
  const focusButtonTitle = () => { if (focusMode === 'narrow') return 'Switch to Wide Focus'; if (focusMode === 'wide') return 'Switch to Zoom Focus'; return 'Switch to Narrow Focus'; };

  return (
    <div className="w-screen h-screen overflow-hidden flex relative">
      <input type="file" ref={importFileRef} onChange={handleImportInputChange} accept=".json" className="hidden" />
      
      {isPresenting && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[3000] bg-gray-900/90 border border-gray-600 rounded-lg px-6 py-3 shadow-2xl flex items-center gap-4 text-white animate-fade-in-down">
              <button 
                onClick={() => {
                    if (currentSlideIndex !== null && currentSlideIndex > 0) setCurrentSlideIndex(currentSlideIndex - 1);
                }}
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
                onClick={() => {
                    if (currentSlideIndex !== null && currentSlideIndex < slides.length - 1) setCurrentSlideIndex(currentSlideIndex + 1);
                }}
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

      {currentModelId && !isPresenting && (
          <div className="absolute top-4 left-4 z-[600] bg-gray-800 bg-opacity-80 p-2 rounded-lg flex items-center space-x-2">
                
                {/* Main Menu Dropdown */}
                <div className="relative" ref={mainMenuRef}>
                    <button 
                        onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
                        className="flex items-center space-x-2 text-gray-300 hover:bg-gray-700 p-2 rounded-lg transition-colors outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 8c2-2 4-2 6 0s4 2 6 0" />
                            <path d="M4 12c2-2 4-2 6 0s4 2 6 0" />
                            <path d="M4 16c2-2 4-2 6 0s4 2 6 0" />
                        </svg>
                        <span className="text-xl font-bold">Tapestry</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform ${isMainMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isMainMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-600 rounded-lg shadow-xl py-2 flex flex-col z-50 text-sm animate-fade-in-down max-h-[80vh] overflow-y-auto">
                            {/* File Section */}
                            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">File</div>
                            <button onClick={() => { handleNewModelClick(); setIsMainMenuOpen(false); }} className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                New Model...
                            </button>
                            <button onClick={() => { setIsSaveAsModalOpen(true); setIsMainMenuOpen(false); }} className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                Save As...
                            </button>
                            <button onClick={() => { handleImportClick(); setIsMainMenuOpen(false); }} className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                Open Model...
                            </button>
                            <button onClick={() => { handleDiskSave(); setIsMainMenuOpen(false); }} className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                Save to Disk
                            </button>
                            
                            <div className="border-t border-gray-700 my-2 mx-2"></div>
                            
                            {/* Tools Section */}
                            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Tools</div>
                            {[
                                { id: 'schema', label: 'Schema', color: 'text-teal-400' },
                                { id: 'layout', label: 'Layout', color: 'text-orange-400' },
                                { id: 'analysis', label: 'Analysis', color: 'text-purple-400' },
                                { id: 'scamper', label: 'SCAMPER', color: 'text-cyan-400' },
                                { id: 'triz', label: 'TRIZ', color: 'text-indigo-400' },
                                { id: 'lss', label: 'Lean Six Sigma', color: 'text-blue-400' },
                                { id: 'toc', label: 'Theory of Constraints', color: 'text-amber-400' },
                                { id: 'ssm', label: 'Soft Systems', color: 'text-cyan-400' },
                                { id: 'swot', label: 'Strategic Analysis', color: 'text-lime-400' },
                                { id: 'explorer', label: 'Explorer', color: 'text-yellow-400' },
                                { id: 'tagcloud', label: 'Word Cloud', color: 'text-pink-400' },
                                { id: 'mermaid', label: 'Diagrams', color: 'text-cyan-400' },
                                { id: 'bulk', label: 'Bulk Edit', color: 'text-pink-400' },
                                { id: 'command', label: 'Command Bar', color: 'text-green-400' }
                            ].map(tool => (
                                <button 
                                    key={tool.id}
                                    onClick={() => { toggleTool(tool.id); setIsToolsPanelOpen(true); setIsMainMenuOpen(false); }} 
                                    className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-800 transition-colors ${activeTool === tool.id ? 'bg-gray-800 text-white' : 'text-gray-300'}`}
                                >
                                    <span className={`w-2 h-2 rounded-full bg-current ${tool.color}`}></span>
                                    {tool.label}
                                    {activeTool === tool.id && <span className="ml-auto text-xs text-blue-400 font-bold">ACTIVE</span>}
                                </button>
                            ))}
                            
                            <div className="border-t border-gray-700 my-2 mx-2"></div>

                            {/* Panels Section */}
                            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Panels</div>
                            {[
                                { label: 'Report', state: isReportPanelOpen, toggle: () => setIsReportPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                                { label: 'Tag Cloud', state: isConceptCloudOpen, toggle: () => setIsConceptCloudOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
                                { label: 'Sunburst', state: isSunburstPanelOpen, toggle: () => { setIsSunburstPanelOpen(p => !p); if(isSunburstPanelOpen) setSunburstState(prev => ({...prev, active: false})); else setSunburstState(prev => ({...prev, active: true})); }, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                                { label: 'Relationship Cloud', state: isInfluenceCloudOpen, toggle: () => setIsInfluenceCloudOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
                                { label: 'Node Name Analysis', state: isTextAnalysisOpen, toggle: () => setIsTextAnalysisOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                                { label: 'Full Text Analysis', state: isFullTextAnalysisOpen, toggle: () => setIsFullTextAnalysisOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
                                { label: 'Diagrams', state: isMermaidPanelOpen, toggle: () => setIsMermaidPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
                                { label: 'Story Mode', state: isPresentationPanelOpen, toggle: () => setIsPresentationPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
                                { label: 'Kanban', state: isKanbanPanelOpen, toggle: () => setIsKanbanPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
                                { label: 'Documents', state: isDocumentPanelOpen, toggle: () => setIsDocumentPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
                                { label: 'History', state: isHistoryPanelOpen, toggle: () => setIsHistoryPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                                { label: 'Table', state: isTablePanelOpen, toggle: () => setIsTablePanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg> },
                                { label: 'Matrix', state: isMatrixPanelOpen, toggle: () => setIsMatrixPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
                                { label: 'Grid', state: isGridPanelOpen, toggle: () => setIsGridPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /></svg> },
                                { label: 'Markdown', state: isMarkdownPanelOpen, toggle: () => setIsMarkdownPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
                                { label: 'JSON', state: isJSONPanelOpen, toggle: () => setIsJSONPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg> }
                            ].map((panel, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => { panel.toggle(); setIsMainMenuOpen(false); }} 
                                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="group-hover:text-blue-400">{panel.icon}</div>
                                        {panel.label}
                                    </div>
                                    {panel.state && <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-l border-gray-600 h-6 mx-1"></div>
                 
                 {/* Standard Toolbar Buttons */}
                 <button onClick={handleNewModelClick} title="New Model..." className="p-2 rounded-md hover:bg-gray-700 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
                <button onClick={handleImportClick} title="Open Model..." className="p-2 rounded-md hover:bg-gray-700 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </button>
                <button onClick={handleDiskSave} title="Save to Disk" className="p-2 rounded-md hover:bg-gray-700 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </button>
                <div className="border-l border-gray-600 h-6 mx-1"></div>
                
                {/* Copy / Paste */}
                <button onClick={handleCopy} title="Copy Selected (Report)" className="p-2 rounded-md hover:bg-gray-700 transition text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                </button>
                <button onClick={handlePaste} title="Paste (Add to Model)" className="p-2 rounded-md hover:bg-gray-700 transition text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </button>

                <div className="border-l border-gray-600 h-6 mx-1"></div>
                <button onClick={() => setIsToolsPanelOpen(p => !p)} title="Toggle Tools Panel" className={`p-2 rounded-md hover:bg-gray-700 transition ${isToolsPanelOpen ? 'bg-gray-700 text-white' : 'text-blue-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                </button>
                <div className="border-l border-gray-600 h-6 mx-1"></div>
                <button onClick={() => setIsFilterPanelOpen(prev => !prev)} title="Filter by Tag" className="p-2 rounded-md hover:bg-gray-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                </button>
                <button onClick={handleToggleFocusMode} title={focusButtonTitle()} className="p-2 rounded-md hover:bg-gray-700 transition">
                    {focusMode === 'narrow' && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /></svg>)}
                    {focusMode === 'wide' && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>)}
                    {focusMode === 'zoom' && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 6V2h4 M22 6V2h-4 M2 18v4h4 M22 18v4h-4" /></svg>)}
                </button>
                
                <button onClick={() => setIsMermaidPanelOpen(prev => !prev)} title="Diagrams" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                </button>

                <button onClick={() => setIsDocumentPanelOpen(prev => !prev)} title="Documents" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </button>

                <button onClick={() => setIsKanbanPanelOpen(prev => !prev)} title="Kanban Board" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                </button>

                <button onClick={() => setIsPresentationPanelOpen(prev => !prev)} title="Story Mode" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>

                <button onClick={() => setIsTablePanelOpen(prev => !prev)} title="Table View" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                </button>
                <button onClick={() => setIsMatrixPanelOpen(prev => !prev)} title="Matrix View" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </button>
                <button onClick={() => setIsGridPanelOpen(prev => !prev)} title="Attribute Grid View" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" />
                    </svg>
                </button>
                <button onClick={() => setIsMarkdownPanelOpen(prev => !prev)} title="Markdown View" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </button>
                <button onClick={() => setIsJSONPanelOpen(prev => !prev)} title="JSON View" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                </button>
                <button onClick={() => setIsReportPanelOpen(prev => !prev)} title="Report View" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </button>
                <button onClick={() => setIsHistoryPanelOpen(prev => !prev)} title="History Log" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <button onClick={() => setIsChatPanelOpen(prev => !prev)} title="AI Assistant" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </button>
                <button onClick={() => { setSettingsInitialTab('general'); setIsSettingsModalOpen(true); }} title="Settings" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <button onClick={handleZoomToFit} title="Zoom to Fit" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                    </svg>
                </button>
                <div className="relative" ref={helpMenuRef}>
                <button onClick={() => setIsHelpMenuOpen(p => !p)} title="Help" className="p-2 rounded-md hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                {isHelpMenuOpen && (
                    <HelpMenu 
                        onClose={() => setIsHelpMenuOpen(false)} 
                        onAbout={() => setIsAboutModalOpen(true)}
                        onPatternGallery={() => setIsPatternGalleryModalOpen(true)}
                        onSelfTest={runSelfTest}
                        onUserGuide={() => setIsUserGuideModalOpen(true)}
                    />
                )}
                </div>
                <div className="border-l border-gray-600 h-6 mx-2"></div>
                <span className="text-gray-400 text-sm font-semibold pr-2">Current Model: {currentModelName}</span>
          </div>
      )}
      
      {currentModelId && !isPresenting && (
        <div className={`absolute left-4 z-[500] max-w-[90vw] pointer-events-none transition-all duration-500 ease-in-out ${isToolsPanelOpen ? 'top-20 opacity-100' : 'top-4 opacity-0'}`}>
            <div className="flex flex-wrap items-start gap-2 pointer-events-auto">
                
                {/* Big Spanner Toggle */}
                <button 
                    onClick={() => setIsToolsPanelOpen(false)}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg rounded-lg w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 z-20 gap-1"
                    title="Close Tools Panel"
                >
                     <div className="relative w-8 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-8 h-8 text-blue-400 transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                     </div>
                     <span className="text--[10px] text-gray-400 font-bold tracking-wider">TOOLS</span>
                </button>

                <SchemaToolbar
                    schemes={colorSchemes}
                    activeSchemeId={activeSchemeId}
                    onSchemeChange={setActiveSchemeId}
                    activeColorScheme={activeColorScheme}
                    onDefaultRelationshipChange={handleUpdateDefaultRelationship}
                    defaultTags={defaultTags}
                    onDefaultTagsChange={setDefaultTags}
                    elements={elements}
                    isCollapsed={activeTool !== 'schema'}
                    onToggle={() => toggleTool('schema')}
                    onUpdateSchemes={(newSchemes) => setColorSchemes(newSchemes)}
                />
                <LayoutToolbar
                    linkDistance={layoutParams.linkDistance}
                    repulsion={layoutParams.repulsion}
                    onLinkDistanceChange={(val) => setLayoutParams(p => ({...p, linkDistance: val}))}
                    onRepulsionChange={(val) => setLayoutParams(p => ({...p, repulsion: val}))}
                    onJiggle={() => setJiggleTrigger(prev => prev + 1)}
                    onZoomToFit={handleZoomToFit}
                    isPhysicsActive={isPhysicsModeActive}
                    onStartAutoLayout={handleStartPhysicsLayout}
                    onAcceptAutoLayout={handleAcceptLayout}
                    onRejectAutoLayout={handleRejectLayout}
                    onExpand={() => handleScaleLayout(1.1)}
                    onContract={() => handleScaleLayout(0.9)}
                    isCollapsed={activeTool !== 'layout'}
                    onToggle={() => toggleTool('layout')}
                />
                <AnalysisToolbar 
                    elements={elements} 
                    relationships={relationships}
                    onBulkTag={handleBulkTagAction}
                    onHighlight={handleAnalysisHighlight}
                    onFilter={handleAnalysisFilter}
                    isCollapsed={activeTool !== 'analysis'}
                    onToggle={() => toggleTool('analysis')}
                    isSimulationMode={isSimulationMode}
                    onToggleSimulation={() => setIsSimulationMode(p => !p)}
                    onResetSimulation={() => setSimulationState({})}
                />
                <ScamperToolbar
                    selectedElementId={selectedElementId}
                    onScamper={(operator, letter) => {
                        setScamperInitialDoc(null);
                        setScamperTrigger({ operator, letter });
                        setIsScamperModalOpen(true);
                    }}
                    isCollapsed={activeTool !== 'scamper'}
                    onToggle={() => toggleTool('scamper')}
                    onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }}
                />
                <TrizToolbar
                    activeTool={activeTrizTool}
                    onSelectTool={handleTrizToolSelect}
                    isCollapsed={activeTool !== 'triz'}
                    onToggle={() => toggleTool('triz')}
                    onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }}
                />
                <LssToolbar
                    activeTool={activeLssTool}
                    onSelectTool={handleLssToolSelect}
                    isCollapsed={activeTool !== 'lss'}
                    onToggle={() => toggleTool('lss')}
                    onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }}
                />
                <TocToolbar
                    activeTool={activeTocTool}
                    onSelectTool={handleTocToolSelect}
                    isCollapsed={activeTool !== 'toc'}
                    onToggle={() => toggleTool('toc')}
                    onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }}
                />
                <SsmToolbar
                    activeTool={activeSsmTool}
                    onSelectTool={handleSsmToolSelect}
                    isCollapsed={activeTool !== 'ssm'}
                    onToggle={() => toggleTool('ssm')}
                    onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }}
                />
                <SwotToolbar 
                    activeTool={activeSwotTool}
                    onSelectTool={handleSwotToolSelect}
                    isCollapsed={activeTool !== 'swot'}
                    onToggle={() => toggleTool('swot')}
                    onOpenSettings={() => { setSettingsInitialTab('prompts'); setIsSettingsModalOpen(true); }}
                />
                <ExplorerToolbar
                    onSelectTool={handleExplorerToolSelect}
                    isCollapsed={activeTool !== 'explorer'}
                    onToggle={() => toggleTool('explorer')}
                />
                <TagCloudToolbar
                    onSelectTool={handleTagCloudToolSelect}
                    isCollapsed={activeTool !== 'tagcloud'}
                    onToggle={() => toggleTool('tagcloud')}
                />
                <MermaidToolbar
                    onSelectTool={handleMermaidToolSelect}
                    isCollapsed={activeTool !== 'mermaid'}
                    onToggle={() => toggleTool('mermaid')}
                />
                <BulkEditToolbar
                    activeColorScheme={activeColorScheme}
                    tagsToAdd={bulkTagsToAdd}
                    tagsToRemove={bulkTagsToRemove}
                    onTagsToAddChange={setBulkTagsToAdd}
                    onTagsToRemoveChange={setBulkTagsToRemove}
                    isActive={isBulkEditActive}
                    onToggleActive={() => setIsBulkEditActive(p => !p)}
                    isCollapsed={activeTool !== 'bulk'}
                    onToggle={() => toggleTool('bulk')}
                />
                <CommandBar 
                    onExecute={handleCommandExecution} 
                    isCollapsed={activeTool !== 'command'}
                    onToggle={() => toggleTool('command')}
                    onOpenHistory={handleOpenCommandHistory}
                />
            </div>
        </div>
      )}

      {isFilterPanelOpen && currentModelId && !isPresenting && (
        <FilterPanel
            allTags={allTags}
            tagCounts={tagCounts}
            tagFilter={tagFilter}
            dateFilter={dateFilter}
            onTagFilterChange={setTagFilter}
            onDateFilterChange={setDateFilter}
            onClose={() => setIsFilterPanelOpen(false)}
        />
      )}
      
      {currentModelId && !isPresenting && (
        <RightPanelContainer 
            panels={panelDefinitions} 
            layouts={panelLayouts}
            onLayoutChange={setPanelLayouts}
            activeDockedId={activeDockedPanelId}
            onActiveDockedIdChange={setActiveDockedPanelId}
            globalZIndex={panelZIndex}
            onGlobalZIndexChange={setPanelZIndex}
        />
      )}

      {currentModelId && !isPresenting && ((panelState.view === 'addRelationship' && addRelationshipSourceElement) || selectedRelationship || selectedElement) && (
        <div 
            ref={panelRef}
            className={`z-[70] flex flex-col pointer-events-none ${detailsPanelPosition ? 'fixed shadow-2xl rounded-lg' : 'absolute top-24'}`}
            style={detailsPanelPosition ? { left: detailsPanelPosition.x, top: detailsPanelPosition.y, maxHeight: 'calc(100vh - 2rem)' } : { right: isRightPanelOpen ? '620px' : '16px', maxHeight: 'calc(100vh - 8rem)' }}
        >
            <div className="pointer-events-auto flex flex-col h-auto max-h-full shadow-2xl rounded-lg bg-gray-800 border border-gray-700 min-h-0">
                {/* Drag Header */}
                <div 
                    className="h-6 bg-gray-700 rounded-t-lg flex items-center justify-center cursor-move border-b border-gray-600 group relative flex-shrink-0"
                    onMouseDown={handlePanelDragStart}
                >
                    <div className="w-10 h-1 bg-gray-500 rounded-full group-hover:bg-gray-400 transition-colors"></div>
                    <button 
                        onClick={handleResetPanelPosition}
                        className="absolute right-2 text-gray-400 hover:text-white"
                        title={detailsPanelPosition ? "Dock Panel" : "Unpin/Float Panel"}
                    >
                        {detailsPanelPosition ? (
                            // Dock Icon
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 12V4H8v8L6 14v2h5v6l1 2 1-2v-6h5v-2l-2-2z" />
                            </svg>
                        ) : (
                            // Unpin Icon (Slanted pin)
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4H8v8L6 14v2h5v6l1 2 1-2v-6h5v-2l-2-2z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Panel Content */}
                <div className="rounded-b-lg overflow-hidden flex flex-col min-h-0 flex-grow">
                    {panelState.view === 'addRelationship' && addRelationshipSourceElement ? (
                        <AddRelationshipPanel
                        sourceElement={addRelationshipSourceElement}
                        targetElementId={panelState.targetElementId}
                        isNewTarget={panelState.isNewTarget}
                        allElements={elements}
                        onCreate={handleAddRelationship}
                        onUpdateElement={handleUpdateElement}
                        onCancel={handleCancelAddRelationship}
                        suggestedLabels={activeRelationshipLabels}
                        defaultLabel={activeColorScheme?.defaultRelationshipLabel}
                        colorSchemes={colorSchemes}
                        activeSchemeId={activeSchemeId}
                        />
                    ) : selectedRelationship ? (
                        <RelationshipDetailsPanel
                            relationship={selectedRelationship}
                            elements={elements}
                            onUpdate={handleUpdateRelationship}
                            onDelete={handleDeleteRelationship}
                            suggestedLabels={activeRelationshipLabels}
                        />
                    ) : selectedElement ? (
                        <ElementDetailsPanel
                            element={selectedElement}
                            allElements={elements}
                            relationships={relationships}
                            onUpdate={handleUpdateElement}
                            onDelete={handleDeleteElement}
                            onClose={() => setSelectedElementId(null)}
                            colorSchemes={colorSchemes}
                            activeSchemeId={activeSchemeId}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    )}

      <ChatPanel
          className={(!isChatPanelOpen || !currentModelId || isPresenting) ? 'hidden' : ''}
          isOpen={isChatPanelOpen}
          elements={elements}
          relationships={relationships}
          colorSchemes={colorSchemes}
          activeSchemeId={activeSchemeId}
          onClose={() => setIsChatPanelOpen(false)}
          currentModelId={currentModelId}
          modelActions={aiActions}
          onOpenPromptSettings={() => {
              setSettingsInitialTab('ai_prompts');
              setIsSettingsModalOpen(true);
          }}
          systemPromptConfig={systemPromptConfig}
          documents={documents}
          folders={folders}
          openDocIds={openDocIds}
          onLogHistory={handleLogHistory}
          onOpenHistory={() => setIsHistoryPanelOpen(true)}
          onOpenTool={handleOpenTool}
          initialInput={chatDraftMessage}
          aiConfig={aiConfig}
      />
      
      <ScamperModal
        isOpen={isScamperModalOpen}
        onClose={() => setIsScamperModalOpen(false)}
        
        elements={elements}
        relationships={relationships}
        selectedElementId={selectedElementId}
        modelActions={aiActions}
        
        triggerOp={scamperTrigger}
        onClearTrigger={() => setScamperTrigger(null)}
        
        documents={documents}
        folders={folders}
        onUpdateDocument={handleUpdateDocument}
        modelName={currentModelName}
        initialDoc={scamperInitialDoc}
        
        onLogHistory={handleLogHistory}
        defaultTags={defaultTags}
        aiConfig={aiConfig}
      />

      <TrizModal 
        isOpen={isTrizModalOpen}
        activeTool={activeTrizTool}
        elements={elements}
        relationships={relationships}
        modelActions={aiActions}
        documents={documents}
        folders={folders}
        onUpdateDocument={handleUpdateDocument}
        initialParams={trizInitialParams}
        onClose={() => setIsTrizModalOpen(false)}
        onLogHistory={handleLogHistory}
        onOpenHistory={() => setIsHistoryPanelOpen(true)}
        onAnalyze={handleAnalyzeWithChat}
        customPrompt={getToolPrompt('triz', activeTrizTool)}
        aiConfig={aiConfig}
      />

      <LssModal 
        isOpen={isLssModalOpen}
        activeTool={activeLssTool}
        elements={elements}
        relationships={relationships}
        modelActions={aiActions}
        documents={documents}
        folders={folders}
        onUpdateDocument={handleUpdateDocument}
        initialParams={lssInitialParams}
        onClose={() => setIsLssModalOpen(false)}
        onLogHistory={handleLogHistory}
        onOpenHistory={() => setIsHistoryPanelOpen(true)}
        onAnalyze={handleAnalyzeWithChat}
        customPrompt={getToolPrompt('lss', activeLssTool)}
        aiConfig={aiConfig}
      />

      <TocModal 
        isOpen={isTocModalOpen}
        activeTool={activeTocTool}
        elements={elements}
        relationships={relationships}
        modelActions={aiActions}
        documents={documents}
        folders={folders}
        onUpdateDocument={handleUpdateDocument}
        initialParams={tocInitialParams}
        onClose={() => setIsTocModalOpen(false)}
        onLogHistory={handleLogHistory}
        onOpenHistory={() => setIsHistoryPanelOpen(true)}
        onAnalyze={handleAnalyzeWithChat}
        customPrompt={getToolPrompt('toc', activeTocTool)}
        aiConfig={aiConfig}
      />

      <SsmModal 
        isOpen={isSsmModalOpen}
        activeTool={activeSsmTool}
        elements={elements}
        relationships={relationships}
        modelActions={aiActions}
        documents={documents}
        folders={folders}
        onUpdateDocument={handleUpdateDocument}
        initialParams={ssmInitialParams}
        onClose={() => setIsSsmModalOpen(false)}
        onLogHistory={handleLogHistory}
        onOpenHistory={() => setIsHistoryPanelOpen(true)}
        onAnalyze={handleAnalyzeWithChat}
        customPrompt={getToolPrompt('ssm', activeSsmTool)}
        aiConfig={aiConfig}
      />

      <SwotModal 
        isOpen={isSwotModalOpen}
        activeTool={activeSwotTool}
        elements={elements}
        relationships={relationships}
        modelActions={aiActions}
        documents={documents}
        folders={folders}
        onUpdateDocument={handleUpdateDocument}
        onClose={() => setIsSwotModalOpen(false)}
        onLogHistory={handleLogHistory}
        onOpenHistory={() => setIsHistoryPanelOpen(true)}
        modelName={currentModelName}
        initialDoc={swotInitialDoc}
        aiConfig={aiConfig}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialTab={settingsInitialTab}
        globalSettings={globalSettings}
        onGlobalSettingsChange={handleGlobalSettingsChange}
        modelSettings={systemPromptConfig}
        onModelSettingsChange={setSystemPromptConfig}
      />

      {/* Schema Update Notification Modal */}
      {isSchemaUpdateModalOpen && (
          <SchemaUpdateModal 
            changes={schemaUpdateChanges} 
            onClose={() => setIsSchemaUpdateModalOpen(false)} 
          />
      )}

      {/* Self Test Modal */}
      <SelfTestModal 
          isOpen={isSelfTestModalOpen} 
          onClose={() => setIsSelfTestModalOpen(false)} 
          logs={testLogs}
          status={testStatus}
      />

      {/* User Guide Modal */}
      {isUserGuideModalOpen && (
          <UserGuideModal 
            onClose={() => setIsUserGuideModalOpen(false)} 
          />
      )}

      {currentModelId ? (
        <GraphCanvas
          ref={graphCanvasRef}
          elements={filteredElements}
          relationships={filteredRelationships}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onCanvasClick={handleCanvasClick}
          onCanvasDoubleClick={handleAddElement}
          onNodeContextMenu={handleNodeContextMenu}
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
          simulationState={simulationState}
          analysisHighlights={analysisHighlights}
        />
      ) : (
        <div className="w-full h-full flex-col items-center justify-center bg-gray-900 text-white space-y-10 p-8 flex relative">
             <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4">
                    <TapestryBanner />
                </div>
                <div className="text-xl text-gray-400 font-light tracking-wide min-w-[300px]">
                    <TextAnimator />
                </div>
             </div>
             <div className="flex space-x-8">
                <button onClick={() => setIsCreateModelModalOpen(true)} className="flex flex-col items-center justify-center w-56 h-56 bg-gray-800 border-2 border-gray-700 rounded-2xl hover:border-blue-500 hover:bg-gray-750 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all group">
                    <div className="bg-gray-700 rounded-full p-4 mb-4 group-hover:bg-blue-900 group-hover:bg-opacity-30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-xl font-semibold text-gray-300 group-hover:text-white transition-colors">Create Model</span>
                    <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Start a new blank canvas</span>
                </button>
                <button onClick={handleImportClick} className="flex flex-col items-center justify-center w-56 h-56 bg-gray-800 border-2 border-gray-700 rounded-2xl hover:border-green-500 hover:bg-gray-750 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 transition-all group">
                     <div className="bg-gray-700 rounded-full p-4 mb-4 group-hover:bg-green-900 group-hover:bg-opacity-30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <span className="text-xl font-semibold text-gray-300 group-hover:text-white transition-colors">Open Model</span>
                    <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Open a JSON file from Disk</span>
                </button>
             </div>

             <div className="w-[600px] text-center space-y-4">
                 <p className="font-bold text-blue-400">This project is in Alpha release and is in active development.</p>
                 <p className="text-gray-300 text-lg leading-relaxed">Tapestry is a knowledge graph editor that brings together many engineering, business, creativity, and innovation tools and uses AI to bring them to life.</p>
                 <AiDisclaimer />
             </div>

             {modelsIndex.length > 0 && (
                 <div className="mt-4 w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-semibold text-gray-400">Recent Models (Recovered)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modelsIndex.slice(0, 4).map(model => (
                             <button key={model.id} onClick={() => handleLoadModel(model.id)} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-lg text-left transition group flex flex-col">
                                <span className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{model.name}</span>
                                <span className="text-xs text-gray-500 mt-1">Last updated: {new Date(model.updatedAt).toLocaleDateString()}</span>
                             </button>
                        ))}
                    </div>
                     <div className="text-center mt-4">
                        <button onClick={() => setIsOpenModelModalOpen(true)} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">View All Recovered Models</button>
                     </div>
                 </div>
             )}
             <CreatorInfo className="mt-8" />
        </div>
      )}

      {contextMenu && currentModelId && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onAddRelationship={() => {
            setPanelState({ view: 'addRelationship', sourceElementId: contextMenu.elementId, targetElementId: null, isNewTarget: false });
            setSelectedElementId(null);
            setMultiSelection(new Set());
            setSelectedRelationshipId(null);
            handleCloseContextMenu();
          }}
          onDeleteElement={() => {
             handleDeleteElement(contextMenu.elementId);
             handleCloseContextMenu();
          }}
        />
      )}

      {canvasContextMenu && currentModelId && (
        <CanvasContextMenu
            x={canvasContextMenu.x}
            y={canvasContextMenu.y}
            onClose={handleCloseCanvasContextMenu}
            onZoomToFit={handleZoomToFit}
            onAutoLayout={handleStartPhysicsLayout}
            onToggleReport={() => setIsReportPanelOpen(p => !p)}
            onToggleMarkdown={() => setIsMarkdownPanelOpen(p => !p)}
            onToggleJSON={() => setIsJSONPanelOpen(p => !p)}
            onToggleFilter={() => setIsFilterPanelOpen(p => !p)}
            onToggleMatrix={() => setIsMatrixPanelOpen(p => !p)}
            onToggleTable={() => setIsTablePanelOpen(p => !p)}
            onToggleGrid={() => setIsGridPanelOpen(p => !p)}
            onOpenModel={handleImportClick}
            onSaveModel={handleDiskSave}
            onCreateModel={handleNewModelClick}
            onSaveAs={() => setIsSaveAsModalOpen(true)}
            isReportOpen={isReportPanelOpen}
            isMarkdownOpen={isMarkdownPanelOpen}
            isJSONOpen={isJSONPanelOpen}
            isFilterOpen={isFilterPanelOpen}
            isMatrixOpen={isMatrixPanelOpen}
            isTableOpen={isTablePanelOpen}
            isGridOpen={isGridPanelOpen}
        />
      )}

      {isCreateModelModalOpen && (
        <CreateModelModal
          onCreate={handleCreateModel}
          onClose={() => setIsCreateModelModalOpen(false)}
          isInitialSetup={!modelsIndex || modelsIndex.length === 0}
        />
      )}

      {isSaveAsModalOpen && (
        <SaveAsModal
            currentName={modelsIndex.find(m => m.id === currentModelId)?.name || ''}
            currentDesc={modelsIndex.find(m => m.id === currentModelId)?.description || ''}
            onSave={handleSaveAs}
            onClose={() => setIsSaveAsModalOpen(false)}
        />
      )}

      {isOpenModelModalOpen && (
        <OpenModelModal
          models={modelsIndex}
          onLoad={handleLoadModel}
          onClose={() => setIsOpenModelModalOpen(false)}
          onTriggerCreate={() => {
            setIsOpenModelModalOpen(false);
            setIsCreateModelModalOpen(true);
          }}
        />
      )}
      
      {pendingImport && (
          <ConflictResolutionModal 
            localMetadata={pendingImport.localMetadata}
            diskMetadata={pendingImport.diskMetadata}
            localData={pendingImport.localData}
            diskData={pendingImport.diskData}
            onCancel={() => setPendingImport(null)}
            onChooseLocal={() => {
                handleLoadModel(pendingImport.localMetadata.id);
                setPendingImport(null);
            }}
            onChooseDisk={() => {
                loadModelData(pendingImport.diskData, pendingImport.diskMetadata.id, pendingImport.diskMetadata);
                setPendingImport(null);
            }}
          />
      )}

      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
      {isPatternGalleryModalOpen && <PatternGalleryModal onClose={() => setIsPatternGalleryModalOpen(false)} />}
    </div>
  );
}
