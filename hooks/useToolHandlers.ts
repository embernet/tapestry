
import { useCallback } from 'react';

interface UseToolHandlersProps {
    tools: any;
    panelState: any;
    windowManagement: {
        openPanelAt: (id: string, layout: any) => void;
        setPanelZIndex: React.Dispatch<React.SetStateAction<number>>;
    };
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

    const { openPanelAt } = windowManagement;

    const handleVisualiseToolSelect = useCallback((tool: string) => {
        // Clear active tool from toolbar
        tools.setActiveTool(null);

        let width = Math.min(window.innerWidth * 0.8, 1000);
        let availableHeight = window.innerHeight - 180 - 20; 
        let height = Math.min(availableHeight, 800); 
        let x = (window.innerWidth - width) / 2;
        let y = 180;
        
        if (tool === 'circle_packing') {
            const chromeHeight = 135; // Header (~65px) + Controls (~70px)
            const topMargin = 180; // Adjusted to clear tools bar
            const bottomMargin = 20;
            const maxWidth = Math.min(window.innerWidth * 0.9, 1200);
            const maxAvailableHeight = window.innerHeight - topMargin - bottomMargin;
            
            // We want canvas to be square: canvasW = canvasH
            // windowW = canvasW
            // windowH = canvasH + chromeHeight
            
            // Constraints:
            // windowW <= maxWidth
            // windowH <= maxAvailableHeight  -> canvasH + chrome <= maxAvailableHeight -> canvasH <= maxAvailableHeight - chrome
            
            const maxCanvasSize = Math.min(maxWidth, maxAvailableHeight - chromeHeight);
            const canvasSize = Math.max(300, maxCanvasSize); // Enforce minimum
            
            width = canvasSize;
            height = canvasSize + chromeHeight;
            x = (window.innerWidth - width) / 2;
            y = topMargin;
        }

        const defaultLayout = { 
           w: width, 
           h: height, 
           x: x, 
           y: y, 
           isFloating: true 
        };

        if (tool === 'matrix') {
             if (!panelState.isMatrixPanelOpen) openPanelAt('matrix', defaultLayout);
             panelState.setIsMatrixPanelOpen((prev: boolean) => !prev);
        }
        else if (tool === 'table') {
             if (!panelState.isTablePanelOpen) openPanelAt('table', defaultLayout);
             panelState.setIsTablePanelOpen((prev: boolean) => !prev);
        }
        else if (tool === 'grid') {
             if (!panelState.isGridPanelOpen) openPanelAt('grid', defaultLayout);
             panelState.setIsGridPanelOpen((prev: boolean) => !prev);
        }
        else if (tool === 'treemap') {
             if (!panelState.isTreemapPanelOpen) openPanelAt('treemap', defaultLayout);
             panelState.setIsTreemapPanelOpen((prev: boolean) => !prev);
        }
        else if (tool === 'circle_packing') {
             if (!panelState.isCirclePackingPanelOpen) openPanelAt('circle_packing', defaultLayout);
             panelState.setIsCirclePackingPanelOpen((prev: boolean) => !prev);
        }
        else if (tool === 'mermaid') {
             tools.handleOpenTool('mermaid');
        }
    }, [tools, panelState, openPanelAt]);

    const handleExplorerToolSelect = useCallback((tool: string) => {
        tools.setActiveTool(null);
        
        if (tool === 'random_walk') {
            if (!isRandomWalkOpen) {
                setPreWalkFocusMode(focusMode);
                // If an element is selected, start from there
                if (selectedElementId) {
                    setWalkState((prev: any) => ({
                        ...prev,
                        currentNodeId: selectedElementId,
                        pathHistory: [selectedElementId],
                        historyIndex: 0,
                        visitedIds: new Set([selectedElementId]),
                        isPaused: true // Start paused so user can hit play
                    }));
                } else {
                     // Reset if nothing selected
                     setWalkState((prev: any) => ({
                        ...prev,
                        currentNodeId: null,
                        visitedIds: new Set(),
                        pathHistory: [],
                        historyIndex: -1,
                        isPaused: true
                    }));
                }
                setIsRandomWalkOpen(true);
            } else {
                setIsRandomWalkOpen(false);
                setFocusMode((prev: any) => prev === 'zoom' ? 'narrow' : prev); // Reset focus if needed
            }
        } else if (tool === 'sunburst') {
             const width = Math.min(window.innerWidth * 0.8, 1000);
             const availableHeight = window.innerHeight - 180 - 20; 
             const height = Math.min(availableHeight, 800); 
             
             const defaultLayout = { 
                w: width, 
                h: height, 
                x: (window.innerWidth - width) / 2, 
                y: 180, 
                isFloating: true 
             };

             if (!panelState.isSunburstPanelOpen) {
                 openPanelAt('sunburst', defaultLayout);
                 panelState.setSunburstState((prev: any) => ({ ...prev, active: true }));
                 panelState.setIsSunburstPanelOpen(true);
             }
        } else {
             if (tool === 'matrix') handleVisualiseToolSelect('matrix');
             else if (tool === 'table') handleVisualiseToolSelect('table');
             else tools.handleOpenTool('explorer', tool);
        }
    }, [tools, isRandomWalkOpen, setIsRandomWalkOpen, setPreWalkFocusMode, focusMode, selectedElementId, setWalkState, setFocusMode, handleVisualiseToolSelect, panelState, openPanelAt]);

    const handleTagCloudToolSelect = useCallback((tool: string) => {
        tools.setActiveTool(null);

        const width = Math.min(window.innerWidth * 0.8, 1000);
        const availableHeight = window.innerHeight - 180 - 20; 
        const height = Math.min(availableHeight, 800); 
        
        const defaultLayout = { 
           w: width, 
           h: height, 
           x: (window.innerWidth - width) / 2, 
           y: 180, 
           isFloating: true 
        };

        if (tool === 'tags') {
            if (!panelState.isConceptCloudOpen) openPanelAt('concept-cloud', defaultLayout);
            panelState.setIsConceptCloudOpen((prev: boolean) => !prev);
        } else if (tool === 'nodes') {
            if (!panelState.isInfluenceCloudOpen) openPanelAt('influence-cloud', defaultLayout);
            panelState.setIsInfluenceCloudOpen((prev: boolean) => !prev);
        } else if (tool === 'words') {
            if (!panelState.isTextAnalysisOpen) openPanelAt('text-cloud', defaultLayout);
            panelState.setIsTextAnalysisOpen((prev: boolean) => !prev);
        } else if (tool === 'full_text') {
             if (!panelState.isFullTextAnalysisOpen) openPanelAt('full-text-cloud', defaultLayout);
             panelState.setIsFullTextAnalysisOpen((prev: boolean) => !prev);
        } else {
             tools.handleOpenTool('tagcloud', tool);
        }
    }, [tools, panelState, openPanelAt]);

    const handleAiToolSelect = useCallback((toolId: string) => {
        tools.setActiveTool(null);
        
        if (toolId === 'chat') {
            panelState.setIsChatPanelOpen(true);
        } else {
            // summarize, expand, connect, critique
            // Set prompt in chat panel
            const promptKey = `ai:${toolId}`;
            const promptTemplate = promptStore.get(promptKey);
            
            if (promptTemplate) {
                 // For Expand, we might want to replace {{name}} if a node is selected
                 let prompt = promptTemplate;
                 if (toolId === 'expand') {
                     if (selectedElementId) {
                         const el = elements.find(e => e.id === selectedElementId);
                         if (el) {
                             prompt = promptStore.get('ai:expand:node', { name: el.name });
                         } else {
                             prompt = promptStore.get('ai:expand:general');
                         }
                     } else {
                         prompt = promptStore.get('ai:expand:general');
                     }
                 }
                 
                 setChatDraftMessage(prompt);
                 panelState.setIsChatPanelOpen(true);
            }
        }
    }, [tools, panelState, selectedElementId, elements, promptStore, setChatDraftMessage]);

    const handleAnalysisToolSelect = useCallback((tool: string) => {
        tools.setActiveTool(null);
        if (tool === 'network') {
            panelState.setIsNetworkAnalysisOpen(true);
        } else if (tool === 'tags') {
            panelState.setIsTagDistPanelOpen(true);
        } else if (tool === 'relationships') {
            panelState.setIsRelDistPanelOpen(true);
        }
    }, [tools, panelState]);

    // Simple wrappers for other tools that primarily use modals/panels managed by useTools
    const handleTrizToolSelect = (tool: string) => tools.handleOpenTool('triz', tool);
    const handleLssToolSelect = (tool: string) => tools.handleOpenTool('lss', tool);
    const handleTocToolSelect = (tool: string) => tools.handleOpenTool('toc', tool);
    const handleSsmToolSelect = (tool: string) => tools.handleOpenTool('ssm', tool);
    const handleSwotToolSelect = (tool: string) => tools.handleOpenTool('swot', tool);
    const handleMermaidToolSelect = (tool: string) => tools.handleOpenTool('mermaid', tool);
    const handleDataToolSelect = (tool: string) => tools.handleOpenTool('data', tool);

    return {
        handleVisualiseToolSelect,
        handleExplorerToolSelect,
        handleTagCloudToolSelect,
        handleAiToolSelect,
        handleTrizToolSelect,
        handleLssToolSelect,
        handleTocToolSelect,
        handleSsmToolSelect,
        handleSwotToolSelect,
        handleMermaidToolSelect,
        handleDataToolSelect,
        handleAnalysisToolSelect
    };
};
