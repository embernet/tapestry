
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';
import { Element, Relationship, ColorScheme, RelationshipDirection, ModelMetadata, PanelState, DateFilterState, NodeFilterState, ModelActions, RelationshipDefinition, ScamperSuggestion, SystemPromptConfig, TapestryDocument, TapestryFolder, PanelLayout, TrizToolType, LssToolType, TocToolType, SsmToolType, ExplorerToolType, TagCloudToolType, SwotToolType, MermaidToolType, HistoryEntry, SimulationNodeState, StorySlide, GlobalSettings, MermaidDiagram, CustomStrategyTool, ChatMessage, VisualiseToolType, NodeShape, Script, GraphView, TagFilterState } from './types';
import { DEFAULT_COLOR_SCHEMES, DEFAULT_SYSTEM_PROMPT_CONFIG, AVAILABLE_AI_TOOLS, DEFAULT_TOOL_PROMPTS, NODE_MAX_WIDTH, APP_VERSION } from './constants';
import { TOOL_DOCUMENTATION } from './documentation';
import { usePanelDefinitions } from './components/usePanelDefinitions';
import GraphCanvas, { GraphCanvasRef } from './components/GraphCanvas';
import ElementDetailsPanel from './components/ElementDetailsPanel';
import RelationshipDetailsPanel from './components/RelationshipDetailsPanel';
import AddRelationshipPanel from './components/AddRelationshipPanel';
import FilterPanel from './components/FilterPanel';
import ChatPanel from './components/ChatPanel';
import RightPanelContainer from './components/RightPanelContainer';
import { generateUUID, generateMarkdownFromGraph, computeContentHash, isInIframe, generateSelectionReport, callAI, AIConfig, aiLogger, createDefaultView, normalizeTag } from './utils';
import { useModelActions } from './hooks/useModelActions';
import { usePanelState } from './hooks/usePanelState';
import { useTools } from './hooks/useTools';
import { useClickOutside } from './hooks/useClickOutside';
import AppHeader from './components/AppHeader';
import { useSelfTest } from './hooks/useSelfTest';
import { usePersistence } from './hooks/usePersistence';
import { GuidancePanel } from './components/GuidancePanel';
import { DebugPanel } from './components/DebugPanel';
import { RandomWalkPanel } from './components/RandomWalkPanel';
import { promptStore } from './services/PromptStore';
import { NetworkAnalysisPanel } from './components/NetworkAnalysisPanel';
import { useScriptTools } from './hooks/useScriptTools'; 
import { useScripts } from './hooks/useScripts'; 
import { ScriptPanel } from './components/ScriptPanel'; 

// New Extracted Components
import { StartScreen } from './components/StartScreen';
import { ToolsOverlay } from './components/ToolsOverlay';
import { AppModals } from './components/AppModals';
import { ContextMenus } from './components/ContextMenus';
import { StatusBar } from './components/StatusBar';

// New Refactored Hooks & Utils
import { parseMarkdownToGraph } from './utils/markdownParser';
import { useGraphView } from './hooks/useGraphView';
import { useImpactAnalysis } from './hooks/useImpactAnalysis';
import { useGraphLayout } from './hooks/useGraphLayout';
import { useAppSettings } from './hooks/useAppSettings';
import { useViewManagement } from './hooks/useViewManagement';
import { useSelection } from './hooks/useSelection';
import { useHistory } from './hooks/useHistory';
import { useDiagrams } from './hooks/useDiagrams';
import { useWindowManagement } from './hooks/useWindowManagement';
import { useToolHandlers } from './hooks/useToolHandlers';

type Coords = { x: number; y: number };

export default function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>(DEFAULT_COLOR_SCHEMES);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(DEFAULT_COLOR_SCHEMES[0]?.id || null);
  const [defaultTags, setDefaultTags] = useState<string[]>([]);
  
  // Notification State
  const [notification, setNotification] = useState<{ x: number; y: number; message: string } | null>(null);

  // --- Version Check ---
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);

  useEffect(() => {
    const lastRunVersion = localStorage.getItem('tapestry_last_run_version');
    if (!lastRunVersion || lastRunVersion !== APP_VERSION) {
      setIsChangelogModalOpen(true);
      localStorage.setItem('tapestry_last_run_version', APP_VERSION);
    }
  }, []);

  // --- Settings & Theme Hook ---
  const {
      globalSettings,
      systemPromptConfig,
      setSystemPromptConfig,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      settingsInitialTab,
      setSettingsInitialTab,
      isDarkMode,
      handleThemeToggle,
      handleGlobalSettingsChange,
      handleCustomStrategiesChange,
      aiConfig,
      getToolPrompt
  } = useAppSettings();

  // --- View Management Hook ---
  const {
      views,
      setViews,
      activeViewId,
      setActiveViewId,
      activeView,
      tagFilter,
      dateFilter,
      nodeFilter,
      handleCreateView: _handleCreateView,
      handleDuplicateView: _handleDuplicateView,
      handleDeleteView,
      handleRenameView,
      handleUpdateActiveView,
      handleHideFromView,
      handleGenerateTapestry,
      isGeneratingTapestry,
      setTagFilter,
      setDateFilter,
      setNodeFilter
  } = useViewManagement({ aiConfig, isDarkMode });
  
  // --- Panels & Tools State ---
  const panelState = usePanelState();
  const tools = useTools(panelState);
  
  // Window Management Hook
  const {
      panelLayouts, setPanelLayouts,
      panelZIndex, setPanelZIndex,
      activeDockedPanelId, setActiveDockedPanelId,
      openPanelAt, bringToFront
  } = useWindowManagement();

  // Sync tools panel default state from global settings on load
  useEffect(() => {
      if (globalSettings.toolsBarOpenByDefault !== undefined) {
          tools.setIsToolsPanelOpen(globalSettings.toolsBarOpenByDefault);
      }
  }, []); // Run once on mount

  // Helper to force View Details panel to open as floating
  const openViewDetails = useCallback(() => {
      const width = 450;
      const height = 650;
      const x = Math.max(50, (window.innerWidth - width) / 2);
      const y = 100;
      
      setPanelLayouts(prev => ({
          ...prev,
          'view-details': {
              x, y, w: width, h: height,
              zIndex: panelZIndex + 1,
              isFloating: true
          }
      }));
      setPanelZIndex(prev => prev + 1);
      panelState.setIsViewDetailsPanelOpen(true);
  }, [setPanelLayouts, setPanelZIndex, panelZIndex, panelState]);

  // View Handler Wrappers to integrate UI (Panel opening)
  const handleCreateView = useCallback(() => {
      _handleCreateView();
      openViewDetails();
  }, [_handleCreateView, openViewDetails]);

  const handleDuplicateView = useCallback(() => {
      if (_handleDuplicateView()) {
          openViewDetails();
      }
  }, [_handleDuplicateView, openViewDetails]);

  // --- Refs ---
  const elementsRef = useRef<Element[]>(elements);
  const relationshipsRef = useRef<Relationship[]>(relationships);
  const graphCanvasRef = useRef<GraphCanvasRef>(null);

  // 1. Layout Hook
  const {
      layoutParams, setLayoutParams, isPhysicsModeActive, setIsPhysicsModeActive,
      originalElements, setOriginalElements, jiggleTrigger, setJiggleTrigger,
      handleStaticLayout, handleStartPhysicsLayout, handleAcceptLayout, handleRejectLayout, handleScaleLayout
  } = useGraphLayout({ elementsRef, relationshipsRef, setElements, graphCanvasRef });

  // 2. Impact Analysis Hook
  const {
      isSimulationMode, setIsSimulationMode, simulationState, setSimulationState, runImpactSimulation
  } = useImpactAnalysis({ relationships });

  const [isBulkEditActive, setIsBulkEditActive] = useState(false);
  const [bulkTagsToAdd, setBulkTagsToAdd] = useState<string[]>([]);
  const [bulkTagsToRemove, setBulkTagsToRemove] = useState<string[]>([]);
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(null);
  const [analysisHighlights, setAnalysisHighlights] = useState<Map<string, string>>(new Map());
  const [analysisFilterState, setAnalysisFilterState] = useState<{ mode: 'hide' | 'hide_others' | 'none', ids: Set<string> }>({ mode: 'none', ids: new Set() });
  const [chatDraftMessage, setChatDraftMessage] = useState('');
  const [chatConversation, setChatConversation] = useState<ChatMessage[]>([]);
  const [nodeShape, setNodeShape] = useState<NodeShape>('rectangle');
  const [isHighlightToolActive, setIsHighlightToolActive] = useState(false);

  // Random Walk State
  const [isRandomWalkOpen, setIsRandomWalkOpen] = useState(false);
  const [walkState, setWalkState] = useState<{
    currentNodeId: string | null;
    visitedIds: Set<string>;
    pathHistory: string[];
    historyIndex: number;
    waitTime: number;
    isPaused: boolean;
    hideDetails: boolean;
    direction: 'forward' | 'backward';
    speedMultiplier: number;
  }>({
    currentNodeId: null,
    visitedIds: new Set(),
    pathHistory: [],
    historyIndex: -1,
    waitTime: 2,
    isPaused: true,
    hideDetails: false,
    direction: 'forward',
    speedMultiplier: 1
  });
  const [preWalkFocusMode, setPreWalkFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');

  const handleToggleNodeHighlight = useCallback((id: string) => {
       setElements(prev => prev.map(e => {
          if (e.id === id) {
              const newMeta = { ...(e.meta || {}) };
              if (newMeta.highlightColor) {
                  delete newMeta.highlightColor;
              } else {
                  newMeta.highlightColor = '#facc15'; 
              }
              return { ...e, meta: newMeta, updatedAt: new Date().toISOString() };
          }
          return e;
      }));
  }, []);

  // 3. Selection & Interaction Hook
  const {
      selectedElementId, setSelectedElementId,
      multiSelection, setMultiSelection,
      selectedRelationshipId, setSelectedRelationshipId,
      panelStateUI, setPanelStateUI,
      focusMode, setFocusMode,
      selectedElement, selectedRelationship, addRelationshipSourceElement,
      handleNodeClick, handleLinkClick, handleCanvasClick, handleNodeConnect, handleNodeConnectToNew,
      handleCompleteAddRelationship, handleCancelAddRelationship, handleToggleFocusMode, handleFocusSingle
  } = useSelection({
      elements, setElements,
      relationships, setRelationships,
      activeView,
      colorSchemes, activeSchemeId, defaultTags,
      isBulkEditActive, bulkTagsToAdd, bulkTagsToRemove,
      isSimulationMode, runImpactSimulation,
      isRandomWalkOpen, setWalkState,
      graphCanvasRef,
      isSunburstPanelOpen: panelState.isSunburstPanelOpen, sunburstState: panelState.sunburstState, setSunburstState: panelState.setSunburstState,
      setOriginalElements, originalElements, setIsPhysicsModeActive,
      isHighlightToolActive,
      handleToggleNodeHighlight
  });
  
  // 4. Graph View Hook (Filtered Data)
  const { filteredElements, filteredRelationships } = useGraphView({
      elements, relationships, activeView, panelState, analysisFilterState
  });

  // 5. History Hook
  const {
      history, setHistory, detachedHistoryIds, setDetachedHistoryIds,
      handleLogHistory, handleDeleteHistory, handleDetachHistory
  } = useHistory({ panelZIndex, setPanelZIndex, setPanelLayouts });

  // 6. Diagrams Hook
  const {
      mermaidDiagrams, setMermaidDiagrams, isMermaidGenerating,
      handleSaveMermaidDiagram, handleDeleteMermaidDiagram, handleGenerateMermaid
  } = useDiagrams({ elements, relationships, aiConfig });

  // 7. Tool Handlers Hook (New)
  const {
      handleTrizToolSelect,
      handleLssToolSelect,
      handleTocToolSelect,
      handleSsmToolSelect,
      handleAnalysisToolSelect,
      handleExplorerToolSelect,
      handleVisualiseToolSelect,
      handleTagCloudToolSelect,
      handleSwotToolSelect,
      handleMermaidToolSelect,
      handleAiToolSelect,
      handleDataToolSelect
  } = useToolHandlers({
      tools,
      panelState,
      windowManagement: { openPanelAt, setPanelZIndex },
      focusMode,
      setFocusMode,
      isRandomWalkOpen,
      setIsRandomWalkOpen,
      setWalkState,
      setPreWalkFocusMode,
      setChatDraftMessage,
      elements,
      selectedElementId,
      promptStore
  });

  // Clipboard & Refs
  const [internalClipboard, setInternalClipboard] = useState<{ elements: Element[], relationships: Relationship[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const currentFileHandleRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const [detailsPanelPosition, setDetailsPanelPosition] = useState<{ x: number, y: number } | null>(null);
  
  // Persistence Refs (for clean saving)
  
  const documentsRef = useRef<TapestryDocument[]>([]);
  const foldersRef = useRef<TapestryFolder[]>([]);
  
  // Effect to sync state to refs
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { relationshipsRef.current = relationships; }, [relationships]);

  const [documents, setDocuments] = useState<TapestryDocument[]>([]);
  useEffect(() => { documentsRef.current = documents; }, [documents]);

  const [folders, setFolders] = useState<TapestryFolder[]>([]);
  useEffect(() => { foldersRef.current = folders; }, [folders]);
  
  const [slides, setSlides] = useState<StorySlide[]>([]);
  const [openDocIds, setOpenDocIds] = useState<string[]>([]);
  
  // Modals State
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPatternGalleryModalOpen, setIsPatternGalleryModalOpen] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  
  // Context Menus State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [relationshipContextMenu, setRelationshipContextMenu] = useState<{ x: number; y: number; relationshipId: string } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Scripting
  const { scripts, createScript, updateScript, deleteScript, setScripts } = useScripts();
  const scriptTools = useScriptTools({
      elementsRef, setElements,
      relationshipsRef, setRelationships,
      documentsRef, setDocuments,
      graphCanvasRef,
      setSelectedElementId,
      setMultiSelection,
      setAnalysisHighlights,
      onOpenDocument: (id) => {
         if (!openDocIds.includes(id)) setOpenDocIds(prev => [...prev, id]);
         // Document logic handled in panel definitions
      }
  });
  
  // Pre-calculate tag counts for Filter and View Details
  const { allTags, tagCounts } = useMemo(() => {
        const counts = new Map<string, number>();
        const tags = new Set<string>();
        elements.forEach(element => { 
            element.tags.forEach(tag => { 
                tags.add(tag);
                counts.set(tag, (counts.get(tag) || 0) + 1); 
            }); 
        });
        return { allTags: Array.from(tags).sort(), tagCounts: counts };
  }, [elements]);

  // Calculate filtered tag counts for Filter tool display
  const filteredTagCounts = useMemo(() => {
      const counts = new Map<string, number>();
      filteredElements.forEach(element => {
          element.tags.forEach(tag => {
              counts.set(tag, (counts.get(tag) || 0) + 1);
          });
      });
      return counts;
  }, [filteredElements]);

  const handleAnalyzeWithChat = useCallback((context: string) => {
      setChatDraftMessage(`Context:\n${context}\n\nQuestion: `);
      panelState.setIsChatPanelOpen(true);
  }, [panelState]);

  useEffect(() => { if (tools.activeTool !== 'bulk') { setIsBulkEditActive(false); } }, [tools.activeTool]);

  const handleDeleteElement = useCallback((elementId: string) => { setElements(prev => prev.filter(f => f.id !== elementId)); setRelationships(prev => prev.filter(r => r.source !== elementId && r.target !== elementId)); if (selectedElementId === elementId) { setSelectedElementId(null); } if (multiSelection.has(elementId)) { const next = new Set(multiSelection); next.delete(elementId); setMultiSelection(next); } }, [selectedElementId, multiSelection]);

  const aiActions: ModelActions = useModelActions({ elementsRef, setElements, relationshipsRef, setRelationships, documentsRef, setDocuments, foldersRef, setFolders, openDocIds, setOpenDocIds, onDeleteElement: handleDeleteElement });

  const persistence = usePersistence({
      setElements, setRelationships, setDocuments, setFolders, setHistory, setSlides, setMermaidDiagrams, setScripts,
      setColorSchemes, setActiveSchemeId, setSystemPromptConfig, setOpenDocIds, setDetachedHistoryIds,
      setPanelLayouts, setAnalysisHighlights, setAnalysisFilterState, setMultiSelection, setSelectedElementId,
      setTagFilter, setDateFilter, currentFileHandleRef,
      setViews, setActiveViewId,
      elementsRef, relationshipsRef, documentsRef, foldersRef,
      colorSchemes, activeSchemeId, systemPromptConfig, history, slides, mermaidDiagrams, scripts, views, activeViewId,
      githubToken: globalSettings.githubToken
  });

  // Global Keyboard Shortcuts (CTRL+S for Save)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              if (persistence.currentModelId) {
                  persistence.handleDiskSave();
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [persistence.handleDiskSave, persistence.currentModelId]);

  const { runSelfTest, isSelfTestModalOpen, setIsSelfTestModalOpen, testLogs, testStatus, handlePlay, handleStop, handleRunSingle, handleSelectStep, executionIndex } = useSelfTest({ 
      panelState, 
      tools, 
      setPanelLayouts,
      persistence,
      modelActions: aiActions,
      setAnalysisHighlights,
      setFocusMode,
      setIsPhysicsModeActive,
      setActiveSchemeId,
      setSelectedElementId,
      setMultiSelection,
      onAutoLayout: handleStaticLayout,
      elements, 
      graphCanvasRef,
      // New props for expanded test coverage
      setIsCsvModalOpen: tools.setIsCsvModalOpen,
      setIsAboutModalOpen,
      setIsPatternGalleryModalOpen,
      setIsUserGuideModalOpen,
      setIsRandomWalkOpen
  });

  useEffect(() => {
      if (persistence.currentModelId) {
          setChatConversation([{ role: 'model', text: "Hello! I'm your AI assistant. Ask me anything about your current model, or ask me to make changes to it." }]);
          setTimeout(() => {
              if (graphCanvasRef.current) {
                  graphCanvasRef.current.zoomToFit();
              }
          }, 150);
      }
  }, [persistence.currentModelId]);

  const handleImportCsv = useCallback((newElements: Element[], newRelationships: Relationship[], mode: 'merge' | 'replace', selectAfterImport?: boolean) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      let count = 0;
      
      newElements.forEach(e => {
          // Ensure imported tags are normalized
          e.tags = e.tags.map(normalizeTag);
          
          if (e.x === undefined) {
             const angle = (count * 0.5) + Math.random();
             const radius = 100 + (5 * count);
             e.x = centerX + radius * Math.cos(angle);
             e.y = centerY + radius * Math.sin(angle);
             e.fx = e.x;
             e.fy = e.y;
             count++;
          }
      });

      if (mode === 'replace') {
          setElements(newElements);
          setRelationships(newRelationships);
          alert(`Imported ${newElements.length} nodes and ${newRelationships.length} relationships (Replaced existing model).`);
      } else {
          setElements(prev => {
              const prevMap = new Map(prev.map(e => [e.id, e]));
              newElements.forEach(e => prevMap.set(e.id, e)); 
              return Array.from(prevMap.values());
          });
          setRelationships(prev => [...prev, ...newRelationships]);
          alert(`Imported/Merged ${newElements.length} nodes and ${newRelationships.length} relationships.`);
      }

      if (selectAfterImport && newElements.length > 0) {
          const newIds = new Set(newElements.map(e => e.id));
          setMultiSelection(newIds);
          setSelectedElementId(null);
      }
  }, []);
  
  // --- Actions ---
  const handleAddElement = useCallback((coords: { x: number; y: number }) => { 
      const now = new Date().toISOString(); 

      // Determine initial tags based on Active View
      let initialTags = [...defaultTags];
      if (activeView) {
          const { included, excluded } = activeView.filters.tags;
          const tagsToAdd = included.filter(t => !initialTags.includes(t));
          initialTags = [...initialTags, ...tagsToAdd];
          if (excluded.length > 0) {
              const excludedSet = new Set(excluded);
              initialTags = initialTags.filter(t => !excludedSet.has(t));
          }
      }
      
      // Normalize all tags
      initialTags = initialTags.map(normalizeTag);

      const newElement: Element = { 
          id: generateUUID(), 
          name: 'New Element', 
          notes: '', 
          tags: initialTags, 
          createdAt: now, 
          updatedAt: now, 
          x: coords.x, 
          y: coords.y, 
          fx: coords.x, 
          fy: coords.y, 
      }; 
      setElements(prev => [...prev, newElement]); 
      setSelectedElementId(newElement.id); 
      setMultiSelection(new Set([newElement.id])); 
      setSelectedRelationshipId(null); 
      setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false }); 
  }, [defaultTags, activeView]);
  
  const handleAddElementFromName = useCallback((name: string) => { const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2; const randomOffset = () => (Math.random() - 0.5) * 100; const now = new Date().toISOString(); const newElement: Element = { id: generateUUID(), name: name, notes: '', tags: defaultTags.map(normalizeTag), createdAt: now, updatedAt: now, x: centerX + randomOffset(), y: centerY + randomOffset(), fx: null, fy: null, }; setElements(prev => [...prev, newElement]); }, [defaultTags]);
  const handleUpdateElement = useCallback((updatedElement: Element) => { setElements(prev => prev.map(f => f.id === updatedElement.id ? { ...updatedElement, updatedAt: new Date().toISOString() } : f)); }, []);
  const handleBulkTagAction = useCallback((elementIds: string[], tag: string, mode: 'add' | 'remove') => { const normTag = normalizeTag(tag); setElements(prev => prev.map(e => { if (elementIds.includes(e.id)) { let newTags = [...e.tags]; if (mode === 'add') { if (!newTags.includes(normTag)) { newTags.push(normTag); } else { return e; } } else { if (newTags.includes(normTag)) { newTags = newTags.filter(t => t !== normTag); } else { return e; } } return { ...e, tags: newTags, updatedAt: new Date().toISOString() }; } return e; })); }, []);
  const handleAddRelationshipDirect = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>) => { const newRel: Relationship = { ...relationship, id: generateUUID(), tags: [] }; setRelationships(prev => [...prev, newRel]); }, []);
  const handleUpdateRelationship = useCallback((updatedRelationship: Relationship) => { setRelationships(prev => prev.map(r => r.id === updatedRelationship.id ? updatedRelationship : r)); }, []);
  const handleDeleteRelationship = useCallback((relationshipId: string) => { setRelationships(prev => prev.filter(r => r.id !== relationshipId)); setSelectedRelationshipId(null); }, []);
  const handleCreateFolder = useCallback((name: string) => { const newFolder: TapestryFolder = { id: generateUUID(), name, parentId: null, createdAt: new Date().toISOString() }; setFolders(prev => [...prev, newFolder]); }, []);
  const handleCreateDocument = useCallback((folderId: string | null, type: string = 'text', data?: any) => { const now = new Date().toISOString(); const newDoc: TapestryDocument = { id: generateUUID(), title: 'Untitled Document', content: '', folderId, createdAt: now, updatedAt: now, type, data }; setDocuments(prev => [...prev, newDoc]); setOpenDocIds(prev => [...prev, newDoc.id]); }, []);
  const handleDeleteDocument = useCallback((docId: string) => { if (confirm("Delete this document?")) { setDocuments(prev => prev.filter(d => d.id !== docId)); setOpenDocIds(prev => prev.filter(id => id !== docId)); } }, []);
  const handleDeleteFolder = useCallback((folderId: string) => { if (confirm("Delete this folder and all its contents?")) { setFolders(prev => prev.filter(f => f.id !== folderId)); setDocuments(prev => prev.filter(d => d.folderId !== folderId)); } }, []);
  const handleUpdateDocument = useCallback((docId: string, updates: Partial<TapestryDocument>) => { setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)); }, []);
  
  const handleOpenDocument = useCallback((docId: string, origin?: string) => {
    setOpenDocIds(prev => {
        if (prev.includes(docId)) return prev;
        return [...prev, docId];
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);
  const handleCloseCanvasContextMenu = useCallback(() => setCanvasContextMenu(null), []);
  const handleCloseRelationshipContextMenu = useCallback(() => setRelationshipContextMenu(null), []);
  
  const handleAnalysisHighlight = useCallback((highlightMap: Map<string, string>) => { setAnalysisHighlights(highlightMap); }, []);
  const handleAnalysisFilter = useCallback((mode: 'hide' | 'hide_others' | 'none', ids: Set<string>) => { setAnalysisFilterState({ mode, ids }); }, []);

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
  
  const handleUpdateDefaultRelationship = (newLabel: string) => { if (!activeSchemeId) return; setColorSchemes(prev => prev.map(s => s.id === activeSchemeId ? { ...s, defaultRelationshipLabel: newLabel } : s)); };
  
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
    // Use the extracted utility
    const { newElements, newRelationships } = parseMarkdownToGraph(markdown, elements, relationships, shouldMerge);
    setElements(newElements);
    setRelationships(newRelationships);
    if (!shouldMerge) panelState.setIsMarkdownPanelOpen(false); 
  };

  const handleAddToKanban = useCallback((ids: string[], coords: {x: number, y: number}) => {
      const attributeKey = 'Status';
      const defaultColumn = 'To Do';
      const targetIds = new Set(ids);

      let added = 0;
      let existing = 0;

      const updates: {id: string, val: string}[] = [];

      elements.forEach(el => {
          if (targetIds.has(el.id)) {
              if (el.attributes && el.attributes[attributeKey]) {
                  existing++;
              } else {
                  added++;
                  updates.push({id: el.id, val: defaultColumn});
              }
          }
      });

      if (added > 0) {
           setElements(prev => prev.map(el => {
               const update = updates.find(u => u.id === el.id);
               if (update) {
                   return {
                       ...el,
                       attributes: { ...el.attributes, [attributeKey]: update.val },
                       updatedAt: new Date().toISOString()
                   };
               }
               return el;
           }));
      }

      let msg = '';
      if (added > 0) {
          msg = `Added ${added} task${added > 1 ? 's' : ''}`;
          if (existing > 0) msg += `. ${existing} already on board`;
      } else if (existing > 0) {
          msg = `${existing} task${existing > 1 ? 's' : ''} already on board`;
      } else {
          msg = "No tasks added";
      }

      setNotification({ x: coords.x, y: coords.y, message: msg });
      setTimeout(() => setNotification(null), 3000);

  }, [elements]);

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

  useEffect(() => {
      if (!isRandomWalkOpen || walkState.isPaused) return;

      const interval = (walkState.waitTime * 1000) / walkState.speedMultiplier;

      const timer = setTimeout(() => {
          const { historyIndex, pathHistory, visitedIds, direction } = walkState;

          if (direction === 'backward') {
              const prevIndex = historyIndex - 1;
              if (prevIndex >= 0) {
                  const prevNodeId = pathHistory[prevIndex];
                  setWalkState(prev => ({
                      ...prev,
                      currentNodeId: prevNodeId,
                      historyIndex: prevIndex
                  }));
              } else {
                  setWalkState(prev => ({ ...prev, isPaused: true }));
              }
          } else {
              const nextIndex = historyIndex + 1;
              if (nextIndex < pathHistory.length) {
                  const nextNodeId = pathHistory[nextIndex];
                  setWalkState(prev => ({
                      ...prev,
                      currentNodeId: nextNodeId,
                      historyIndex: nextIndex
                  }));
              } else {
                  const currentNodeId = walkState.currentNodeId;
                  if (!currentNodeId) return;

                  const outgoing = relationships.filter(r => r.source === currentNodeId);
                  const candidates = outgoing.map(r => r.target as string);
                  const unvisitedCandidates = candidates.filter(id => !visitedIds.has(id));
                  
                  let nextNodeId;
                  
                  if (unvisitedCandidates.length > 0) {
                      const randomIndex = Math.floor(Math.random() * unvisitedCandidates.length);
                      nextNodeId = unvisitedCandidates[randomIndex];
                  } else {
                      const allUnvisited = elements.filter(e => !visitedIds.has(e.id));
                      if (allUnvisited.length > 0) {
                          const randomIndex = Math.floor(Math.random() * allUnvisited.length);
                          nextNodeId = allUnvisited[randomIndex].id;
                      } else {
                          const randomIndex = Math.floor(Math.random() * elements.length);
                          if (elements[randomIndex]) {
                              nextNodeId = elements[randomIndex].id;
                              setWalkState(prev => ({ ...prev, visitedIds: new Set() }));
                          } else {
                              setWalkState(prev => ({ ...prev, isPaused: true }));
                              return;
                          }
                      }
                  }

                  if (nextNodeId) {
                      setWalkState(prev => ({
                          ...prev,
                          currentNodeId: nextNodeId,
                          visitedIds: new Set([...prev.visitedIds, nextNodeId]),
                          pathHistory: [...prev.pathHistory, nextNodeId],
                          historyIndex: nextIndex
                      }));
                  }
              }
          }
      }, interval);

      return () => clearTimeout(timer);
  }, [walkState, isRandomWalkOpen, elements, relationships]);

  useEffect(() => {
      if (isRandomWalkOpen && walkState.currentNodeId) {
           const el = elements.find(e => e.id === walkState.currentNodeId);
           if (el) {
               setSelectedElementId(walkState.currentNodeId);
               setMultiSelection(new Set([walkState.currentNodeId]));
               
               if (graphCanvasRef.current) {
                   graphCanvasRef.current.setCamera(-(el.x || 0) + window.innerWidth/2, -(el.y || 0) + window.innerHeight/2, 1.5);
               }
               
               if (!walkState.hideDetails) {
                   setPanelStateUI({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
               }
           }
      }
  }, [walkState.currentNodeId, isRandomWalkOpen, walkState.hideDetails]);

  useEffect(() => {
    if (isRandomWalkOpen) {
        if (!walkState.isPaused) {
            setFocusMode('zoom');
        } else {
            setFocusMode(preWalkFocusMode);
        }
    }
  }, [walkState.isPaused, isRandomWalkOpen, preWalkFocusMode]);


  const handleCaptureSlide = () => { const camera = graphCanvasRef.current?.getCamera() || { x: 0, y: 0, k: 1 }; const newSlide: StorySlide = { id: generateUUID(), title: `Slide ${slides.length + 1}`, description: '', camera, selectedElementId: selectedElementId }; setSlides(prev => [...prev, newSlide]); };
  const handlePlayPresentation = () => { if (slides.length > 0) { setIsPresenting(true); setCurrentSlideIndex(0); } };
  useEffect(() => { if (isPresenting && currentSlideIndex !== null && slides[currentSlideIndex]) { const slide = slides[currentSlideIndex]; graphCanvasRef.current?.setCamera(slide.camera.x, slide.camera.y, slide.camera.k); setSelectedElementId(slide.selectedElementId); } }, [currentSlideIndex, isPresenting, slides]);

  const handlePanelDragStart = (e: React.MouseEvent) => { if (!panelRef.current) return; const rect = panelRef.current.getBoundingClientRect(); dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }; if (!detailsPanelPosition) { setDetailsPanelPosition({ x: rect.left, y: rect.top }); } const handleMouseMove = (moveEvent: MouseEvent) => { if (dragStartRef.current) { setDetailsPanelPosition({ x: moveEvent.clientX - dragStartRef.current.x, y: moveEvent.clientY - dragStartRef.current.y }); } }; const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); dragStartRef.current = null; }; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); };
  
  const activeColorScheme = useMemo(() => { const current = colorSchemes.find(s => s.id === activeSchemeId); if (!current) return undefined; const defaultScheme = DEFAULT_COLOR_SCHEMES.find(d => d.id === current.id); if (defaultScheme) { const mergedTags = { ...defaultScheme.tagColors, ...current.tagColors }; const currentDefs = current.relationshipDefinitions || []; const defaultDefs = defaultScheme.relationshipDefinitions || []; const combinedDefsMap = new Map<string, RelationshipDefinition>(); defaultDefs.forEach(d => combinedDefsMap.set(d.label, d)); currentDefs.forEach(d => combinedDefsMap.set(d.label, d)); const mergedDefinitions = Array.from(combinedDefsMap.values()); const mergedDefaultLabel = current.defaultRelationshipLabel || defaultScheme.defaultRelationshipLabel; return { ...current, tagColors: mergedTags, relationshipDefinitions: mergedDefinitions, defaultRelationshipLabel: mergedDefaultLabel }; } return current; }, [colorSchemes, activeSchemeId]);
  const activeRelationshipLabels = useMemo(() => { return activeColorScheme?.relationshipDefinitions?.map(d => d.label) || []; }, [activeColorScheme]);
  
  // --- New Command Handlers ---
  const handleOpenCommandHistory = useCallback(() => {
    const cmdFolder = foldersRef.current.find(f => f.name === "CMD" && !f.parentId);
    let folderId = cmdFolder?.id;
    if (!folderId) {
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
          if (data.elements && Array.isArray(data.elements)) setElements(data.elements);
          if (data.relationships && Array.isArray(data.relationships)) setRelationships(data.relationships);
          if (data.colorSchemes && Array.isArray(data.colorSchemes)) setColorSchemes(persistence.migrateLegacySchemes(data.colorSchemes).schemes);
          panelState.setIsJSONPanelOpen(false);
      } catch (e) {
          alert("Failed to apply JSON data");
      }
  }, [persistence, panelState]);

  const handleSaveAsImage = useCallback(() => {
    if (graphCanvasRef.current) {
        const filename = `${persistence.currentModelName.replace(/ /g, '_')}_view.png`;
        const bgColor = isDarkMode ? '#111827' : '#f9fafb'; 
        graphCanvasRef.current.exportAsImage(filename, bgColor);
        setCanvasContextMenu(null);
    }
  }, [persistence.currentModelName, isDarkMode]);

  const handleOpenKanban = useCallback(() => {
      if (!panelState.isKanbanPanelOpen) {
          const width = window.innerWidth * 0.8;
          const height = window.innerHeight * 0.8;
          openPanelAt('kanban', { w: width, h: height, x: (window.innerWidth - width) / 2, y: (window.innerHeight - height) / 2 });
          panelState.setIsKanbanPanelOpen(true);
      } else {
          panelState.setIsKanbanPanelOpen(false);
      }
  }, [panelState, openPanelAt]);

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
    originalElements, 
    setElements,      
    graphCanvasRef,
    aiActions,
    aiConfig,
    activeView,
    onUpdateView: handleUpdateActiveView,
    onGenerateTapestry: handleGenerateTapestry,
    isGeneratingTapestry,
    
    // View Filters
    onTagFilterChange: setTagFilter,
    onDateFilterChange: setDateFilter,
    onNodeFilterChange: setNodeFilter,
    
    // Tag Stats
    allTags,
    tagCounts,

    chatMessages: chatConversation,
    isDarkMode
});

const isRightPanelOpen = useMemo(() => {
    return panelDefinitions.some(p => p.isOpen && !panelLayouts[p.id]?.isFloating);
}, [panelDefinitions, panelLayouts]);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col relative">
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
      
      {/* Script Panel */}
      <ScriptPanel 
          isOpen={panelState.isScriptPanelOpen}
          onClose={() => panelState.setIsScriptPanelOpen(false)}
          scripts={scripts}
          onSaveScript={updateScript}
          onCreateScript={createScript}
          onDeleteScript={deleteScript}
          isDarkMode={isDarkMode}
          aiConfig={aiConfig}
      />

      {/* Main Viewport Area */}
      <div className="flex-grow relative w-full overflow-hidden flex flex-col">

        {persistence.currentModelId && !isPresenting && (
            <AppHeader 
                currentModelName={persistence.currentModelName}
                onNewModel={persistence.handleNewModelClick}
                onSaveAs={() => persistence.setIsSaveAsModalOpen(true)}
                onOpenModel={() => persistence.handleImportClick(importFileRef)}
                onSaveDisk={persistence.handleDiskSave}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onOpenCsvTool={() => tools.setIsCsvModalOpen(true)}
                onSaveGist={persistence.handleSaveToGist}
                onSelfTest={runSelfTest}
                
                tools={tools}
                panelState={panelState}
                focusMode={focusMode}
                onToggleFocusMode={handleToggleFocusMode}
                onZoomToFit={handleZoomToFit}
                onAutoLayout={handleStaticLayout}
                onOpenSettings={(tab) => { setSettingsInitialTab(tab || 'general'); setIsSettingsModalOpen(true); }}
                onAbout={() => setIsAboutModalOpen(true)}
                onPatternGallery={() => setIsPatternGalleryModalOpen(true)}
                onUserGuide={() => setIsUserGuideModalOpen(true)}
                isDarkMode={isDarkMode}
                onToggleTheme={handleThemeToggle}
                onToggleDebug={() => panelState.setIsDebugPanelOpen(prev => !prev)}
                onOpenKanban={handleOpenKanban}
                hasUnsavedChanges={persistence.hasUnsavedChanges}
                
                // View Management
                views={views}
                activeViewId={activeViewId}
                onSelectView={setActiveViewId}
                onCreateView={handleCreateView}
                onDuplicateView={handleDuplicateView}
                onRenameView={handleRenameView}
                onDeleteView={handleDeleteView}
                onEditView={openViewDetails}
            />
        )}
        
        {persistence.currentModelId && !isPresenting && (
            <ToolsOverlay 
                tools={tools}
                panelState={panelState}
                elements={elements}
                relationships={relationships}
                colorSchemes={colorSchemes}
                activeSchemeId={activeSchemeId}
                activeColorScheme={activeColorScheme}
                defaultTags={defaultTags}
                layoutParams={layoutParams}
                isPhysicsModeActive={isPhysicsModeActive}
                isBulkEditActive={isBulkEditActive}
                isSimulationMode={isSimulationMode}
                nodeShape={nodeShape}
                handleAiToolSelect={handleAiToolSelect}
                handleSearch={handleSearch}
                handleFocusSingle={handleFocusSingle}
                handleSearchReset={handleSearchReset}
                handleVisualiseToolSelect={handleVisualiseToolSelect}
                setActiveSchemeId={setActiveSchemeId}
                handleUpdateDefaultRelationship={handleUpdateDefaultRelationship}
                setDefaultTags={setDefaultTags}
                setColorSchemes={setColorSchemes}
                setLayoutParams={setLayoutParams}
                setJiggleTrigger={setJiggleTrigger}
                handleZoomToFit={handleZoomToFit}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                handleStartPhysicsLayout={handleStartPhysicsLayout}
                handleAcceptLayout={handleAcceptLayout}
                handleRejectLayout={handleRejectLayout}
                handleScaleLayout={handleScaleLayout}
                handleStaticLayout={handleStaticLayout}
                setNodeShape={setNodeShape}
                handleBulkTagAction={handleBulkTagAction}
                handleAnalysisHighlight={handleAnalysisHighlight}
                handleAnalysisFilter={handleAnalysisFilter}
                setIsSimulationMode={setIsSimulationMode}
                setSimulationState={setSimulationState}
                handleTrizToolSelect={handleTrizToolSelect}
                handleLssToolSelect={handleLssToolSelect}
                handleTocToolSelect={handleTocToolSelect}
                handleSsmToolSelect={handleSsmToolSelect}
                handleSwotToolSelect={handleSwotToolSelect}
                handleExplorerToolSelect={handleExplorerToolSelect}
                handleTagCloudToolSelect={handleTagCloudToolSelect}
                handleMermaidToolSelect={handleMermaidToolSelect}
                handleDataToolSelect={handleDataToolSelect}
                setSettingsInitialTab={setSettingsInitialTab}
                setIsSettingsModalOpen={setIsSettingsModalOpen}
                bulkTagsToAdd={bulkTagsToAdd}
                setBulkTagsToAdd={setBulkTagsToAdd}
                bulkTagsToRemove={bulkTagsToRemove}
                setBulkTagsToRemove={setBulkTagsToRemove}
                setIsBulkEditActive={setIsBulkEditActive}
                handleCommandExecution={handleCommandExecution}
                handleOpenCommandHistory={handleOpenCommandHistory}
                handleCreateScript={createScript}
                globalSettings={globalSettings}
                isDarkMode={isDarkMode}
                selectedElementId={selectedElementId}
                handleAnalysisToolSelect={handleAnalysisToolSelect}
                isHighlightToolActive={isHighlightToolActive}
                setIsHighlightToolActive={setIsHighlightToolActive}
            />
        )}
        
        {/* Floating Filter Panel */}
        {panelState.isFilterPanelOpen && persistence.currentModelId && !isPresenting && (
             <FilterPanel 
                 allTags={allTags}
                 tagCounts={tagCounts}
                 filteredTagCounts={filteredTagCounts}
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

        {/* Network Analysis Panel */}
        {panelState.isNetworkAnalysisOpen && persistence.currentModelId && !isPresenting && (
             <NetworkAnalysisPanel 
                 elements={elements}
                 relationships={relationships}
                 onBulkTag={handleBulkTagAction}
                 onHighlight={handleAnalysisHighlight}
                 onFilter={handleAnalysisFilter}
                 isSimulationMode={isSimulationMode}
                 onToggleSimulation={() => setIsSimulationMode(p => !p)}
                 onResetSimulation={() => setSimulationState({})}
                 onClose={() => panelState.setIsNetworkAnalysisOpen(false)}
                 isDarkMode={isDarkMode}
                 isHighlightToolActive={isHighlightToolActive}
                 setIsHighlightToolActive={setIsHighlightToolActive}
             />
        )}
        
        {/* Guidance Panel */}
        {panelState.isGuidancePanelOpen && persistence.currentModelId && !isPresenting && (
            <div className="fixed left-4 top-40 z-[600] w-[400px] h-[calc(100vh-200px)] shadow-2xl rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
                <GuidancePanel 
                    content={panelState.guidanceContent} 
                    onClose={() => panelState.setIsGuidancePanelOpen(false)} 
                    isDarkMode={isDarkMode}
                />
            </div>
        )}

        {/* Random Walk Panel */}
        {isRandomWalkOpen && persistence.currentModelId && !isPresenting && (
            <RandomWalkPanel 
                currentNodeName={walkState.currentNodeId ? (elements.find(e => e.id === walkState.currentNodeId)?.name || null) : null}
                visitedCount={walkState.visitedIds.size}
                totalCount={elements.length}
                waitTime={walkState.waitTime}
                setWaitTime={(t) => setWalkState(prev => ({...prev, waitTime: t}))}
                isPaused={walkState.isPaused}
                togglePause={() => setWalkState(prev => ({...prev, isPaused: !prev.isPaused, direction: 'forward', speedMultiplier: 1}))}
                onStepBack={() => setWalkState(prev => {
                    const prevIdx = prev.historyIndex - 1;
                    if (prevIdx >= 0) {
                        return { ...prev, isPaused: true, historyIndex: prevIdx, currentNodeId: prev.pathHistory[prevIdx] };
                    }
                    return { ...prev, isPaused: true };
                })}
                onPlayReverse={() => setWalkState(prev => ({ ...prev, isPaused: false, direction: 'backward', speedMultiplier: 4 }))}
                onStepForward={() => setWalkState(prev => {
                    const nextIdx = prev.historyIndex + 1;
                    if (nextIdx < prev.pathHistory.length) {
                        return { ...prev, isPaused: true, historyIndex: nextIdx, currentNodeId: prev.pathHistory[nextIdx] };
                    }
                    return { ...prev, isPaused: false, direction: 'forward', speedMultiplier: 1 };
                })}
                onFastForward={() => setWalkState(prev => ({ ...prev, isPaused: false, direction: 'forward', speedMultiplier: 4 }))}
                onRandomStart={() => {
                    if (elements.length > 0) {
                        const randomEl = elements[Math.floor(Math.random() * elements.length)];
                        setWalkState(prev => ({
                            ...prev,
                            currentNodeId: randomEl.id,
                            pathHistory: [randomEl.id],
                            historyIndex: 0,
                            visitedIds: new Set([randomEl.id]),
                            isPaused: false,
                            direction: 'forward',
                            speedMultiplier: 1,
                            hideDetails: false
                        }));
                    }
                }}
                onSprint={() => {
                    setWalkState(prev => ({ ...prev, isPaused: false, speedMultiplier: 5 }));
                }}
                hideDetails={walkState.hideDetails}
                setHideDetails={(s) => setWalkState(prev => ({...prev, hideDetails: s}))}
                onClose={() => {
                    setIsRandomWalkOpen(false);
                    setFocusMode(preWalkFocusMode);
                }}
                isDarkMode={isDarkMode}
                direction={walkState.direction}
                speedMultiplier={walkState.speedMultiplier}
                onOpenGuidance={() => tools.handleOpenGuidance('random_walk')}
            />
        )}
        
        {/* Kanban Notification Bubble */}
        {notification && (
            <div 
                className="fixed z-[2000] px-4 py-2 rounded-lg shadow-lg text-sm font-bold pointer-events-none transition-opacity duration-300"
                style={{ 
                    left: notification.x + 10, 
                    top: notification.y - 10,
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                    color: isDarkMode ? '#4ade80' : '#15803d', // Green text
                    border: '1px solid ' + (isDarkMode ? '#22c55e' : '#86efac')
                }}
            >
                {notification.message}
            </div>
        )}

        {persistence.currentModelId && !isPresenting && (
            <RightPanelContainer panels={panelDefinitions} layouts={panelLayouts} onLayoutChange={setPanelLayouts} activeDockedId={activeDockedPanelId} onActiveDockedIdChange={setActiveDockedPanelId} globalZIndex={panelZIndex} onGlobalZIndexChange={setPanelZIndex} isDarkMode={isDarkMode} />
        )}

        {persistence.currentModelId && !isPresenting && ((panelStateUI.view === 'addRelationship' && addRelationshipSourceElement) || selectedRelationship || (selectedElement && (!isRandomWalkOpen || !walkState.hideDetails))) && (
            <div ref={panelRef} className={`z-[70] flex flex-col pointer-events-none ${detailsPanelPosition ? 'fixed shadow-2xl rounded-lg' : 'absolute top-24'}`} style={detailsPanelPosition ? { left: detailsPanelPosition.x, top: detailsPanelPosition.y, maxHeight: 'calc(100vh - 2rem)' } : { right: isRightPanelOpen ? '620px' : '16px', maxHeight: 'calc(100vh - 8rem)' }}>
                <div className={`pointer-events-auto flex flex-col h-auto max-h-full shadow-2xl rounded-lg border min-h-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    
                    <div className="rounded-lg overflow-hidden flex flex-col min-h-0 flex-grow">
                        {panelStateUI.view === 'addRelationship' && addRelationshipSourceElement ? (
                            <AddRelationshipPanel 
                                sourceElement={addRelationshipSourceElement} 
                                targetElementId={panelStateUI.targetElementId} 
                                isNewTarget={panelStateUI.isNewTarget} 
                                allElements={elements} 
                                onCreate={handleCompleteAddRelationship} 
                                onUpdateElement={handleUpdateElement} 
                                onCancel={handleCancelAddRelationship} 
                                suggestedLabels={activeRelationshipLabels} 
                                defaultLabel={activeColorScheme?.defaultRelationshipLabel} 
                                colorSchemes={colorSchemes} 
                                activeSchemeId={activeSchemeId} 
                                isDarkMode={isDarkMode} 
                                relationships={relationships} 
                                onUpdateRelationship={handleUpdateRelationship} 
                                onDragStart={handlePanelDragStart}
                            />
                        ) : selectedRelationship ? (
                            <RelationshipDetailsPanel 
                                relationship={selectedRelationship} 
                                elements={elements} 
                                onUpdate={handleUpdateRelationship} 
                                onDelete={handleDeleteRelationship} 
                                suggestedLabels={activeRelationshipLabels} 
                                isDarkMode={isDarkMode}
                                onClose={() => setSelectedRelationshipId(null)}
                                onDragStart={handlePanelDragStart}
                            />
                        ) : selectedElement ? (
                            <ElementDetailsPanel element={selectedElement} allElements={elements} relationships={relationships} onUpdate={handleUpdateElement} onDelete={handleDeleteElement} onClose={() => setSelectedElementId(null)} colorSchemes={colorSchemes} activeSchemeId={activeSchemeId} isDarkMode={isDarkMode} onDragStart={handlePanelDragStart} />
                        ) : null}
                    </div>
                </div>
            </div>
        )}

        <ChatPanel className={(!panelState.isChatPanelOpen || !persistence.currentModelId || isPresenting) ? 'hidden' : ''} isOpen={panelState.isChatPanelOpen} elements={elements} relationships={relationships} colorSchemes={colorSchemes} activeSchemeId={activeSchemeId} onClose={() => panelState.setIsChatPanelOpen(false)} currentModelId={persistence.currentModelId} modelActions={aiActions} onOpenPromptSettings={() => { setSettingsInitialTab('ai_prompts'); setIsSettingsModalOpen(true); }} systemPromptConfig={systemPromptConfig} documents={documents} folders={folders} openDocIds={openDocIds} onLogHistory={handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onOpenTool={tools.handleOpenTool} initialInput={chatDraftMessage} aiConfig={aiConfig} isDarkMode={isDarkMode} messages={chatConversation} setMessages={setChatConversation} />
        {panelState.isDebugPanelOpen && <DebugPanel messages={chatConversation} onClose={() => panelState.setIsDebugPanelOpen(false)} isDarkMode={isDarkMode} />}
        
        <AppModals 
            tools={tools}
            panelState={panelState}
            persistence={persistence}
            elements={elements}
            relationships={relationships}
            selectedElementId={selectedElementId}
            modelActions={aiActions}
            documents={documents}
            folders={folders}
            onUpdateDocument={handleUpdateDocument}
            handleAnalyzeWithChat={handleAnalyzeWithChat}
            handleLogHistory={handleLogHistory}
            defaultTags={defaultTags}
            aiConfig={aiConfig}
            isDarkMode={isDarkMode}
            globalSettings={globalSettings}
            handleGlobalSettingsChange={handleGlobalSettingsChange}
            systemPromptConfig={systemPromptConfig}
            setSystemPromptConfig={setSystemPromptConfig}
            isSettingsModalOpen={isSettingsModalOpen}
            setIsSettingsModalOpen={setIsSettingsModalOpen}
            settingsInitialTab={settingsInitialTab}
            isAboutModalOpen={isAboutModalOpen}
            setIsAboutModalOpen={setIsAboutModalOpen}
            isPatternGalleryModalOpen={isPatternGalleryModalOpen}
            setIsPatternGalleryModalOpen={setIsPatternGalleryModalOpen}
            isUserGuideModalOpen={isUserGuideModalOpen}
            setIsUserGuideModalOpen={setIsUserGuideModalOpen}
            isChangelogModalOpen={isChangelogModalOpen}
            setIsChangelogModalOpen={setIsChangelogModalOpen}
            isCsvModalOpen={tools.isCsvModalOpen}
            setIsCsvModalOpen={tools.setIsCsvModalOpen}
            handleImportCsv={handleImportCsv}
            
            // Self Test Props
            isSelfTestModalOpen={isSelfTestModalOpen}
            setIsSelfTestModalOpen={setIsSelfTestModalOpen}
            testLogs={testLogs}
            testStatus={testStatus}
            onSelfTestPlay={handlePlay}
            onSelfTestStop={handleStop}
            onSelfTestRunSingle={handleRunSingle}
            onSelfTestSelectStep={handleSelectStep}
            selfTestSelectedIndex={executionIndex}

            importFileRef={importFileRef}
            handleCustomStrategiesChange={handleCustomStrategiesChange}
            getToolPrompt={getToolPrompt}
        />

        <div className="flex-grow relative overflow-hidden">
            {persistence.currentModelId ? (
                <>
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
                        setSelectedElementId={setSelectedElementId}
                        multiSelection={multiSelection}
                        setMultiSelection={setMultiSelection}
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
                        nodeShape={nodeShape}
                        isHighlightToolActive={isHighlightToolActive}
                    />
                    <ContextMenus 
                        contextMenu={contextMenu}
                        relationshipContextMenu={relationshipContextMenu}
                        canvasContextMenu={canvasContextMenu}
                        relationships={relationships}
                        panelState={panelState}
                        persistence={persistence}
                        onCloseContextMenu={handleCloseContextMenu}
                        onCloseRelationshipContextMenu={handleCloseRelationshipContextMenu}
                        onCloseCanvasContextMenu={handleCloseCanvasContextMenu}
                        onDeleteElement={handleDeleteElement}
                        onAddRelationshipFromContext={(id) => { setPanelStateUI({ view: 'addRelationship', sourceElementId: id, targetElementId: null, isNewTarget: false }); setSelectedElementId(null); setMultiSelection(new Set()); setSelectedRelationshipId(null); }}
                        onDeleteRelationship={handleDeleteRelationship}
                        onChangeRelationshipDirection={handleChangeRelationshipDirection}
                        onZoomToFit={handleZoomToFit}
                        onAutoLayout={handleStaticLayout}
                        onSaveAsImage={handleSaveAsImage}
                        importFileRef={importFileRef}
                        isDarkMode={isDarkMode}
                        onToggleNodeHighlight={handleToggleNodeHighlight}
                        elements={elements} 
                        
                        onHideFromView={handleHideFromView}
                        
                        multiSelection={multiSelection}
                        onAddToKanban={handleAddToKanban}
                    />
                </>
            ) : (
                <StartScreen 
                    isDarkMode={isDarkMode} 
                    persistence={persistence} 
                    importFileRef={importFileRef} 
                    onAbout={() => setIsAboutModalOpen(true)}
                    onUserGuide={() => setIsUserGuideModalOpen(true)}
                />
            )}
        </div>
      </div>

      {/* Status Bar at the bottom */}
      {persistence.currentModelId && (
          <StatusBar 
            nodeCount={filteredElements.length}
            totalNodeCount={elements.length}
            edgeCount={filteredRelationships.length}
            totalEdgeCount={relationships.length}
            isDarkMode={isDarkMode}
            
            sunburstState={panelState.sunburstState}
            onClearSunburst={() => {
                if (originalElements) setElements(originalElements);
                panelState.setSunburstState(prev => ({ ...prev, active: false, centerId: null, hops: 0 }));
                setIsPhysicsModeActive(false);
                setOriginalElements(null);
                panelState.setIsSunburstPanelOpen(false);
            }}
            centerNodeName={panelState.sunburstState.centerId ? (elements.find(e => e.id === panelState.sunburstState.centerId)?.name || 'Unknown') : null}
            
            nodeFilterState={nodeFilter}
            onClearNodeFilter={() => setNodeFilter(prev => ({ ...prev, active: false }))}
            filterCenterNodeName={nodeFilter.centerId ? (elements.find(e => e.id === nodeFilter.centerId)?.name || 'Unknown') : null}
            
            selectionCount={multiSelection.size}
            onClearSelection={() => {
                setMultiSelection(new Set());
                setSelectedElementId(null);
            }}
            activeViewName={activeView?.name}
            
            tapestrySvg={activeView?.tapestrySvg}
            tapestryVisible={activeView?.tapestryVisible}
            
            activeSchema={activeColorScheme}
            schemes={colorSchemes}
            onSchemaChange={setActiveSchemeId}

            // View Props
            views={views}
            activeViewId={activeViewId}
            onViewChange={setActiveViewId}
          />
      )}
    </div>
  );
}