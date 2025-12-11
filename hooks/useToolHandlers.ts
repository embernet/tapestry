
import { useCallback } from 'react';
import { 
    TrizToolType, LssToolType, TocToolType, SsmToolType, 
    ExplorerToolType, TagCloudToolType, SwotToolType, 
    VisualiseToolType, MermaidToolType, DataToolType
} from '../types';

interface UseToolHandlersProps {
    tools: any;
    panelState: any;
    windowManagement: any;
    focusMode: any;
    setFocusMode: any;
    isRandomWalkOpen: boolean;
    setIsRandomWalkOpen: (open: boolean) => void;
    setWalkState: any;
    setPreWalkFocusMode: any;
    setChatDraftMessage: (msg: string) => void;
    elements: any[];
    selectedElementId: string | null;
    promptStore: any;
}

export const useToolHandlers = ({
    tools,
    panelState,
    windowManagement,
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
}: UseToolHandlersProps) => {

    const { openPanelAt, setPanelZIndex } = windowManagement;

    const handleTrizToolSelect = useCallback((tool: TrizToolType) => {
        tools.setActiveTrizTool(tool);
        tools.setIsTrizModalOpen(true);
        tools.setTrizInitialParams(null);
        tools.setActiveTool(null);
    }, [tools]);

    const handleLssToolSelect = useCallback((tool: LssToolType) => {
        tools.setActiveLssTool(tool);
        tools.setIsLssModalOpen(true);
        tools.setLssInitialParams(null);
        tools.setActiveTool(null);
    }, [tools]);

    const handleTocToolSelect = useCallback((tool: TocToolType) => {
        tools.setActiveTocTool(tool);
        tools.setIsTocModalOpen(true);
        tools.setTocInitialParams(null);
        tools.setActiveTool(null);
    }, [tools]);

    const handleSsmToolSelect = useCallback((tool: SsmToolType) => {
        tools.setActiveSsmTool(tool);
        tools.setIsSsmModalOpen(true);
        tools.setSsmInitialParams(null);
        tools.setActiveTool(null);
    }, [tools]);

    const handleAnalysisToolSelect = useCallback((toolId: string) => {
        tools.setActiveTool(null);
        const defaultLayout = { x: 100, y: 160, w: 400, h: 500, isFloating: true };
        
        if (toolId === 'network') {
            panelState.setIsNetworkAnalysisOpen(true);
        } else if (toolId === 'tags') {
            openPanelAt('tag-dist', defaultLayout);
            panelState.setIsTagDistPanelOpen(true);
        } else if (toolId === 'relationships') {
            openPanelAt('rel-dist', defaultLayout);
            panelState.setIsRelDistPanelOpen(true);
        }
    }, [tools, panelState, openPanelAt]);

    const handleDataToolSelect = useCallback((tool: DataToolType) => {
        tools.setActiveTool(null);
        if (tool === 'csv') {
            tools.setIsCsvModalOpen(true);
        } else if (tool === 'markdown') {
            panelState.setIsMarkdownPanelOpen(true);
        } else if (tool === 'json') {
            panelState.setIsJSONPanelOpen(true);
        }
    }, [tools, panelState]);

    const handleExplorerToolSelect = useCallback((tool: ExplorerToolType) => {
        if (tool === 'sunburst') {
            panelState.setIsSunburstPanelOpen((prev: boolean) => !prev);
            panelState.setSunburstState((prev: any) => ({ ...prev, active: true }));
        }
        if (tool === 'matrix') panelState.setIsMatrixPanelOpen((prev: boolean) => !prev);
        if (tool === 'table') panelState.setIsTablePanelOpen((prev: boolean) => !prev);
        
        if (tool === 'random_walk') {
            if (!isRandomWalkOpen) {
                 setPreWalkFocusMode(focusMode);
                 setIsRandomWalkOpen(true);
                 setWalkState((prev: any) => ({ 
                     ...prev, 
                     visitedIds: new Set(), 
                     pathHistory: [], 
                     historyIndex: -1, 
                     currentNodeId: null, 
                     isPaused: true, 
                     direction: 'forward',
                     speedMultiplier: 1,
                     hideDetails: false
                 }));
            } else {
                 setIsRandomWalkOpen(false);
                 setFocusMode(focusMode); // Reset
            }
        }
        tools.setActiveTool(null);
    }, [tools, panelState, isRandomWalkOpen, focusMode, setPreWalkFocusMode, setIsRandomWalkOpen, setWalkState, setFocusMode]);

    const handleVisualiseToolSelect = useCallback((tool: VisualiseToolType) => {
        if (tool === 'grid') {
            panelState.setIsGridPanelOpen((prev: boolean) => !prev);
        } else if (tool === 'treemap') {
            if (!panelState.isTreemapPanelOpen) {
                 openPanelAt('treemap', { w: 800, h: 600, x: Math.max(50, (window.innerWidth - 800) / 2), y: Math.max(50, (window.innerHeight - 600) / 2) });
                 panelState.setIsTreemapPanelOpen(true);
            } else {
                 panelState.setIsTreemapPanelOpen(false);
            }
        } else if (tool === 'circle_packing') {
            if (!panelState.isCirclePackingPanelOpen) {
                 // Calculate dimensions to ensure the canvas area (where circle packing renders) is square.
                 // We add estimated height for Header and Controls (~130px) to the height.
                 const CHROME_HEIGHT = 130;
                 const maxW = window.innerWidth * 0.9;
                 const maxH = window.innerHeight * 0.9;
                 
                 const canvasSize = Math.max(300, Math.min(maxW, maxH - CHROME_HEIGHT));
                 
                 const width = canvasSize;
                 const height = canvasSize + CHROME_HEIGHT;
                 
                 openPanelAt('circle_packing', { 
                     w: width, 
                     h: height, 
                     x: (window.innerWidth - width) / 2, 
                     y: (window.innerHeight - height) / 2 
                 });
                 panelState.setIsCirclePackingPanelOpen(true);
            } else {
                 panelState.setIsCirclePackingPanelOpen(false);
            }
        } else if (tool === 'mermaid') {
            panelState.setIsMermaidPanelOpen(true);
        }
        tools.setActiveTool(null);
    }, [tools, panelState, openPanelAt]);

    const handleTagCloudToolSelect = useCallback((tool: TagCloudToolType) => {
        const width = Math.min(window.innerWidth * 0.8, 1000);
        const height = Math.min(window.innerHeight * 0.8, 800);
        const defaultLayout = { w: width, h: height, x: (window.innerWidth - width) / 2, y: (window.innerHeight - height) / 2, isFloating: true };

        if (tool === 'tags') {
            panelState.setIsConceptCloudOpen((prev: boolean) => !prev);
            if (!panelState.isConceptCloudOpen) openPanelAt('concept-cloud', defaultLayout);
        } else if (tool === 'nodes') {
            panelState.setIsInfluenceCloudOpen((prev: boolean) => !prev);
            if (!panelState.isInfluenceCloudOpen) openPanelAt('influence-cloud', defaultLayout);
        } else if (tool === 'words') {
            panelState.setIsTextAnalysisOpen((prev: boolean) => !prev);
            if (!panelState.isTextAnalysisOpen) openPanelAt('text-cloud', defaultLayout);
        } else if (tool === 'full_text') {
            panelState.setIsFullTextAnalysisOpen((prev: boolean) => !prev);
            if (!panelState.isFullTextAnalysisOpen) openPanelAt('full-text-cloud', defaultLayout);
        }
        tools.setActiveTool(null);
    }, [tools, panelState, openPanelAt]);

    const handleSwotToolSelect = useCallback((tool: SwotToolType) => { 
        tools.setActiveSwotTool(tool); 
        tools.setSwotInitialDoc(null); 
        tools.setIsSwotModalOpen(true); 
        tools.setActiveTool(null); 
    }, [tools]);

    const handleMermaidToolSelect = useCallback((tool: MermaidToolType) => { 
        if (tool === 'editor') panelState.setIsMermaidPanelOpen(true); 
        tools.setActiveTool(null); 
    }, [tools, panelState]);

    const handleAiToolSelect = useCallback((toolId: string) => {
        tools.setActiveTool(null);
        
        if (toolId === 'chat') {
            panelState.setIsChatPanelOpen(true);
        } else if (toolId === 'expand') {
            if (selectedElementId) {
                 const el = elements.find((e: any) => e.id === selectedElementId);
                 if (el) {
                    const prompt = promptStore.get('ai:expand:node', { name: el.name });
                    setChatDraftMessage(prompt);
                 }
            } else {
                 const prompt = promptStore.get('ai:expand:general');
                 setChatDraftMessage(prompt);
            }
            panelState.setIsChatPanelOpen(true);
        } else if (toolId === 'connect') {
            const prompt = promptStore.get('ai:connect');
            setChatDraftMessage(prompt);
            panelState.setIsChatPanelOpen(true);
        } else if (toolId === 'critique') {
            const prompt = promptStore.get('ai:critique');
            setChatDraftMessage(prompt);
            panelState.setIsChatPanelOpen(true);
        } else if (toolId === 'summarise') {
            const prompt = promptStore.get('ai:summarise');
            setChatDraftMessage(prompt);
            panelState.setIsChatPanelOpen(true);
        }
    }, [tools, panelState, selectedElementId, elements, setChatDraftMessage, promptStore]);

    return {
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
    };
};
