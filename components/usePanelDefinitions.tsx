
import React, { useMemo } from 'react';
import { PanelDefinition } from './RightPanelContainer';
import { Element, Relationship, TapestryDocument, TapestryFolder, HistoryEntry, StorySlide, MermaidDiagram, ModelActions, ColorScheme, PanelLayout, ChatMessage, GuidanceContent } from '../types';
import { ReportPanel } from './ReportPanel';
import { DocumentManagerPanel, DocumentEditorPanel } from './DocumentPanel';
import TablePanel from './TablePanel';
import MatrixPanel from './MatrixPanel';
import GridPanel from './GridPanel';
import KanbanPanel from './KanbanPanel';
import PresentationPanel from './PresentationPanel';
import { MermaidPanel } from './MermaidPanel';
import MarkdownPanel from './MarkdownPanel';
import JSONPanel from './JSONPanel';
import HistoryPanel from './HistoryPanel';
import { TreemapPanel, TagDistributionPanel, RelationshipDistributionPanel } from './ExplorerModal';
import { SunburstPanel } from './SunburstPanel';
import { TagCloudPanel } from './TagCloudModal';
import { CirclePackingPanel } from './CirclePackingPanel';
import HistoryItemPanel from './HistoryItemPanel';
import { DebugPanel } from './DebugPanel';
import { GuidancePanel } from './GuidancePanel';
import { generateMarkdownFromGraph, AIConfig } from '../utils';

interface UsePanelDefinitionsProps {
  // State Flags
  isReportPanelOpen: boolean;
  setIsReportPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDocumentPanelOpen: boolean;
  setIsDocumentPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTablePanelOpen: boolean;
  setIsTablePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMatrixPanelOpen: boolean;
  setIsMatrixPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGridPanelOpen: boolean;
  setIsGridPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isKanbanPanelOpen: boolean;
  setIsKanbanPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPresentationPanelOpen: boolean;
  setIsPresentationPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMermaidPanelOpen: boolean;
  setIsMermaidPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMarkdownPanelOpen: boolean;
  setIsMarkdownPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isJSONPanelOpen: boolean;
  setIsJSONPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHistoryPanelOpen: boolean;
  setIsHistoryPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDebugPanelOpen: boolean;
  setIsDebugPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGuidancePanelOpen: boolean;
  setIsGuidancePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  guidanceContent: GuidanceContent | null;
  
  // Explorer State
  isTreemapPanelOpen: boolean;
  setIsTreemapPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTagDistPanelOpen: boolean;
  setIsTagDistPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isRelDistPanelOpen: boolean;
  setIsRelDistPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSunburstPanelOpen: boolean;
  setIsSunburstPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCirclePackingPanelOpen: boolean;
  setIsCirclePackingPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sunburstState: { active: boolean, centerId: string | null, hops: number };
  setSunburstState: React.Dispatch<React.SetStateAction<{ active: boolean, centerId: string | null, hops: number }>>;
  
  // Tag Cloud State
  isConceptCloudOpen: boolean;
  setIsConceptCloudOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isInfluenceCloudOpen: boolean;
  setIsInfluenceCloudOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTextAnalysisOpen: boolean;
  setIsTextAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFullTextAnalysisOpen: boolean;
  setIsFullTextAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Data
  filteredElements: Element[];
  filteredRelationships: Relationship[];
  elements: Element[];
  relationships: Relationship[];
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  openDocIds: string[];
  setOpenDocIds: React.Dispatch<React.SetStateAction<string[]>>;
  mermaidDiagrams: MermaidDiagram[];
  history: HistoryEntry[];
  slides: StorySlide[];
  setSlides: React.Dispatch<React.SetStateAction<StorySlide[]>>;
  detachedHistoryIds: string[];
  setDetachedHistoryIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentModelName: string;
  activeColorScheme: ColorScheme | undefined;
  selectedElementId: string | null;
  multiSelection: Set<string>;
  chatMessages: ChatMessage[];
  
  // Actions
  onNodeClick: (elementId: string, event: MouseEvent) => void;
  onOpenDocument: (docId: string, origin?: 'report') => void;
  onCreateFolder: (name: string) => void;
  onCreateDocument: (folderId: string | null, type?: string, data?: any) => void;
  onDeleteDocument: (docId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onUpdateElement: (element: Element) => void;
  onDeleteElement: (elementId: string) => void;
  onAddElementFromName: (name: string) => void;
  onAddRelationshipDirect: (relationship: Omit<Relationship, 'id' | 'tags'>) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onUpdateDocument: (docId: string, updates: Partial<TapestryDocument>) => void;
  onCaptureSlide: () => void;
  onPlayPresentation: () => void;
  onSaveMermaidDiagram: (diagram: MermaidDiagram) => void;
  onDeleteMermaidDiagram: (id: string) => void;
  onGenerateMermaid: (prompt: string, contextMarkdown?: string) => Promise<string>;
  isMermaidGenerating: boolean;
  onApplyMarkdown: (markdown: string, shouldMerge?: boolean) => void;
  onApplyJSON: (data: any) => void;
  onDetachHistory: (id: string) => void;
  onReopenHistory: (entry: HistoryEntry) => void;
  onAnalyzeWithChat: (context: string) => void;
  onDeleteHistory: (id: string) => void;
  onOpenWordCloudGuidance: () => void;
  onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  
  // Helpers
  panelLayouts: Record<string, PanelLayout>;
  panelZIndex: number;
  setPanelZIndex: React.Dispatch<React.SetStateAction<number>>;
  setPanelLayouts: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
  setIsPhysicsModeActive: React.Dispatch<React.SetStateAction<boolean>>;
  setOriginalElements: React.Dispatch<React.SetStateAction<Element[] | null>>;
  originalElements: Element[] | null;
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  graphCanvasRef: React.RefObject<any>;
  aiActions: ModelActions;
  aiConfig: AIConfig;
  
  // Theme
  isDarkMode: boolean;
}

// Helper to calculate max depth from center node
const calculateMaxDepth = (centerId: string, relationships: Relationship[]) => {
    if (!centerId) return 0;
    
    // Build adjacency list
    const adj = new Map<string, string[]>();
    relationships.forEach(r => {
        const s = r.source as string;
        const t = r.target as string;
        if (!adj.has(s)) adj.set(s, []);
        if (!adj.has(t)) adj.set(t, []);
        adj.get(s)!.push(t);
        adj.get(t)!.push(s);
    });

    let depth = 0;
    let currentLayer = [centerId];
    const visited = new Set<string>([centerId]);

    while (true) {
        const nextLayer: string[] = [];
        for (const nodeId of currentLayer) {
            const neighbors = adj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    nextLayer.push(neighbor);
                }
            }
        }
        
        if (nextLayer.length === 0) break;
        depth++;
        currentLayer = nextLayer;
    }
    
    return depth;
};

export const usePanelDefinitions = (props: UsePanelDefinitionsProps) => {
  return useMemo(() => {
    const staticPanels: PanelDefinition[] = [
        { 
            id: 'report', 
            title: 'Report', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, 
            content: <ReportPanel 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onClose={() => props.setIsReportPanelOpen(false)} 
                        onNodeClick={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        documents={props.documents} 
                        folders={props.folders} 
                        onOpenDocument={(id) => props.onOpenDocument(id, 'report')} 
                        isDarkMode={props.isDarkMode}
                        activeColorScheme={props.activeColorScheme}
                     />, 
            isOpen: props.isReportPanelOpen, 
            onToggle: () => props.setIsReportPanelOpen(prev => !prev) 
        },
        { 
            id: 'documents', 
            title: 'Documents', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, 
            content: <DocumentManagerPanel 
                        documents={props.documents} 
                        folders={props.folders} 
                        onOpenDocument={props.onOpenDocument} 
                        onCreateFolder={props.onCreateFolder} 
                        onCreateDocument={props.onCreateDocument} 
                        onDeleteDocument={props.onDeleteDocument} 
                        onDeleteFolder={props.onDeleteFolder} 
                        onClose={() => props.setIsDocumentPanelOpen(false)} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isDocumentPanelOpen, 
            onToggle: () => props.setIsDocumentPanelOpen(prev => !prev) 
        },
        { 
            id: 'table', 
            title: 'Table', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>, 
            content: <TablePanel 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onUpdateElement={props.onUpdateElement} 
                        onDeleteElement={props.onDeleteElement} 
                        onAddElement={props.onAddElementFromName} 
                        onAddRelationship={props.onAddRelationshipDirect} 
                        onDeleteRelationship={props.onDeleteRelationship} 
                        onClose={() => props.setIsTablePanelOpen(false)} 
                        onNodeClick={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        selectedElementId={props.selectedElementId} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isTablePanelOpen, 
            onToggle: () => props.setIsTablePanelOpen(prev => !prev) 
        },
        { 
            id: 'matrix', 
            title: 'Matrix', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z M12 3v18 M3 12h18" /></svg>, 
            content: <MatrixPanel 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onClose={() => props.setIsMatrixPanelOpen(false)}
                        onNodeClick={(id) => props.onNodeClick(id, new MouseEvent('click'))}
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isMatrixPanelOpen, 
            onToggle: () => props.setIsMatrixPanelOpen(prev => !prev) 
        },
        { 
            id: 'grid', 
            title: 'Grid', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /></svg>, 
            content: <GridPanel 
                        elements={props.filteredElements} 
                        activeColorScheme={props.activeColorScheme} 
                        onClose={() => props.setIsGridPanelOpen(false)} 
                        onNodeClick={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isGridPanelOpen, 
            onToggle: () => props.setIsGridPanelOpen(prev => !prev) 
        },
        { 
            id: 'kanban', 
            title: 'Kanban', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>, 
            content: <KanbanPanel 
                        elements={props.filteredElements} 
                        modelActions={props.aiActions} 
                        onClose={() => props.setIsKanbanPanelOpen(false)} 
                        selectedElementId={props.selectedElementId}
                        onNodeClick={(id) => props.onNodeClick(id, new MouseEvent('click'))}
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isKanbanPanelOpen, 
            onToggle: () => props.setIsKanbanPanelOpen(prev => !prev) 
        },
        { 
            id: 'presentation', 
            title: 'Story', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, 
            content: <PresentationPanel 
                        slides={props.slides} 
                        onSlidesChange={props.setSlides} 
                        onCaptureSlide={props.onCaptureSlide} 
                        onPlay={props.onPlayPresentation} 
                        onClose={() => props.setIsPresentationPanelOpen(false)} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isPresentationPanelOpen, 
            onToggle: () => props.setIsPresentationPanelOpen(prev => !prev) 
        },
        { 
            id: 'mermaid', 
            title: 'Diagrams', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>, 
            content: <MermaidPanel 
                        savedDiagrams={props.mermaidDiagrams} 
                        onSaveDiagram={props.onSaveMermaidDiagram} 
                        onDeleteDiagram={props.onDeleteMermaidDiagram} 
                        onGenerate={props.onGenerateMermaid} 
                        onClose={() => props.setIsMermaidPanelOpen(false)} 
                        isGenerating={props.isMermaidGenerating} 
                        elements={props.elements}
                        relationships={props.relationships}
                        multiSelection={props.multiSelection}
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isMermaidPanelOpen, 
            onToggle: () => props.setIsMermaidPanelOpen(prev => !prev) 
        },
        { 
            id: 'markdown', 
            title: 'Markdown', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>, 
            content: <MarkdownPanel 
                        initialText={generateMarkdownFromGraph(props.elements, props.relationships)} 
                        onApply={(md) => props.onApplyMarkdown(md, false)} 
                        onClose={() => props.setIsMarkdownPanelOpen(false)} 
                        modelName={props.currentModelName} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isMarkdownPanelOpen, 
            onToggle: () => props.setIsMarkdownPanelOpen(prev => !prev) 
        },
        { 
            id: 'json', 
            title: 'JSON', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>, 
            content: <JSONPanel 
                        initialData={{ 
                            elements: props.elements, 
                            relationships: props.relationships, 
                            documents: props.documents, 
                            folders: props.folders, 
                            history: props.history, 
                            slides: props.slides, 
                            mermaidDiagrams: props.mermaidDiagrams 
                        }} 
                        onApply={props.onApplyJSON} 
                        onClose={() => props.setIsJSONPanelOpen(false)} 
                        modelName={props.currentModelName} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isJSONPanelOpen, 
            onToggle: () => props.setIsJSONPanelOpen(prev => !prev) 
        },
        { 
            id: 'history', 
            title: 'AI History', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
            content: <HistoryPanel 
                        history={props.history} 
                        onClose={() => props.setIsHistoryPanelOpen(false)} 
                        onDetach={props.onDetachHistory} 
                        onReopen={props.onReopenHistory} 
                        onAnalyze={props.onAnalyzeWithChat} 
                        onDelete={props.onDeleteHistory} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isHistoryPanelOpen, 
            onToggle: () => props.setIsHistoryPanelOpen(prev => !prev) 
        },
        { 
            id: 'debug', 
            title: 'Debug', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2C6.5 2 4 4.5 4 7.5c0 1.2.4 2.3 1 3.2-.6.9-1 2-1 3.2 0 2.5 2 4.5 4.5 4.5h.5c.3 2 2 3.5 4 3.5s3.7-1.5 4-3.5h.5c2.5 0 4.5-2 4.5-4.5 0-1.2-.4-2.3-1-3.2.6-.9 1-2 1-3.2C21 4.5 18.5 2 15.5 2c-1.2 0-2.3.4-3.2 1-.9-.6-2-1-3.2-1z" /></svg>, 
            content: <DebugPanel 
                        messages={props.chatMessages} 
                        onClose={() => props.setIsDebugPanelOpen(false)} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isDebugPanelOpen, 
            onToggle: () => props.setIsDebugPanelOpen(prev => !prev) 
        },
        // --- Explorer Panels ---
        { 
            id: 'treemap', 
            title: 'Treemap', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, 
            content: <TreemapPanel 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onNodeSelect={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        isDarkMode={props.isDarkMode}
                     />, 
            isOpen: props.isTreemapPanelOpen, 
            onToggle: () => props.setIsTreemapPanelOpen(p => !p) 
        },
        { 
            id: 'sunburst', 
            title: 'Sunburst', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
            content: <SunburstPanel
                        centerNodeName={props.elements.find(e => e.id === props.sunburstState.centerId)?.name || null}
                        hops={props.sunburstState.hops}
                        visibleCount={props.filteredElements.length}
                        maxHops={props.sunburstState.centerId ? calculateMaxDepth(props.sunburstState.centerId, props.relationships) : 0}
                        onHopsChange={(newHops) => props.setSunburstState(prev => ({ ...prev, hops: newHops }))}
                        onRestart={() => {
                            if (props.originalElements) {
                                props.setElements(props.originalElements);
                            }
                            props.setSunburstState(prev => ({ ...prev, centerId: null, hops: 0 }));
                            props.setIsPhysicsModeActive(false);
                            props.setOriginalElements(null);
                        }}
                        onReset={() => {
                             props.setSunburstState(prev => ({ ...prev, hops: 0 }));
                             props.graphCanvasRef.current?.setCamera(0,0,1);
                        }}
                        onClose={() => {
                            if (props.originalElements) {
                                props.setElements(props.originalElements);
                            }
                            props.setIsSunburstPanelOpen(false);
                            props.setSunburstState(prev => ({ ...prev, active: false }));
                            props.setIsPhysicsModeActive(false);
                            props.setOriginalElements(null);
                        }}
                        isDarkMode={props.isDarkMode}
                     />,
            isOpen: props.isSunburstPanelOpen,
            onToggle: () => {
                const willOpen = !props.isSunburstPanelOpen;
                props.setIsSunburstPanelOpen(willOpen);
                if (willOpen) {
                    props.setSunburstState(prev => ({ ...prev, active: true }));
                } else {
                    if (props.originalElements) {
                        props.setElements(props.originalElements);
                    }
                    props.setSunburstState(prev => ({ ...prev, active: false }));
                    props.setIsPhysicsModeActive(false);
                    props.setOriginalElements(null);
                }
            }
        },
        { 
            id: 'circle_packing', 
            title: 'Circle Packing', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
            content: <CirclePackingPanel
                        elements={props.filteredElements}
                        relationships={props.filteredRelationships}
                        onNodeClick={(id) => props.onNodeClick(id, new MouseEvent('click'))}
                        onClose={() => props.setIsCirclePackingPanelOpen(false)}
                        isDarkMode={props.isDarkMode}
                        activeColorScheme={props.activeColorScheme}
                     />,
            isOpen: props.isCirclePackingPanelOpen,
            onToggle: () => props.setIsCirclePackingPanelOpen(p => !p)
        },
        { 
            id: 'tag-dist', 
            title: 'Tag Analysis', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
            content: <TagDistributionPanel elements={props.filteredElements} isDarkMode={props.isDarkMode} />, 
            isOpen: props.isTagDistPanelOpen, 
            onToggle: () => props.setIsTagDistPanelOpen(p => !p) 
        },
        { 
            id: 'rel-dist', 
            title: 'Relationship Analysis', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
            content: <RelationshipDistributionPanel relationships={props.filteredRelationships} isDarkMode={props.isDarkMode} />, 
            isOpen: props.isRelDistPanelOpen, 
            onToggle: () => props.setIsRelDistPanelOpen(p => !p) 
        },
        { 
            id: 'concept-cloud', 
            title: 'Tag Cloud', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
            content: <TagCloudPanel 
                        mode='tags' 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onNodeSelect={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        isDarkMode={props.isDarkMode}
                        aiConfig={props.aiConfig}
                        onOpenGuidance={props.onOpenWordCloudGuidance}
                        onLogHistory={props.onLogHistory}
                     />, 
            isOpen: props.isConceptCloudOpen, 
            onToggle: () => props.setIsConceptCloudOpen(p => !p) 
        },
        { 
            id: 'influence-cloud', 
            title: 'Relationship Cloud', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
            content: <TagCloudPanel 
                        mode='nodes' 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onNodeSelect={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        isDarkMode={props.isDarkMode}
                        aiConfig={props.aiConfig}
                        onOpenGuidance={props.onOpenWordCloudGuidance}
                        onLogHistory={props.onLogHistory}
                     />, 
            isOpen: props.isInfluenceCloudOpen, 
            onToggle: () => props.setIsInfluenceCloudOpen(p => !p) 
        },
        { 
            id: 'text-cloud', 
            title: 'Node Name Analysis', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, 
            content: <TagCloudPanel 
                        mode='words' 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onNodeSelect={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        isDarkMode={props.isDarkMode}
                        aiConfig={props.aiConfig}
                        onOpenGuidance={props.onOpenWordCloudGuidance}
                        onLogHistory={props.onLogHistory}
                     />, 
            isOpen: props.isTextAnalysisOpen, 
            onToggle: () => props.setIsTextAnalysisOpen(p => !p) 
        },
        { 
            id: 'full-text-cloud', 
            title: 'Full Text Analysis', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>, 
            content: <TagCloudPanel 
                        mode='full_text' 
                        elements={props.filteredElements} 
                        relationships={props.filteredRelationships} 
                        onNodeSelect={(id) => props.onNodeClick(id, new MouseEvent('click'))} 
                        isDarkMode={props.isDarkMode}
                        aiConfig={props.aiConfig}
                        onOpenGuidance={props.onOpenWordCloudGuidance}
                        onLogHistory={props.onLogHistory}
                     />, 
            isOpen: props.isFullTextAnalysisOpen, 
            onToggle: () => props.setIsFullTextAnalysisOpen(p => !p) 
        }
    ];

    const docPanels: PanelDefinition[] = props.openDocIds.map((id): PanelDefinition | null => {
        const doc = props.documents.find(d => d.id === id);
        if (!doc) return null;
        return { 
            id: `doc-${id}`, 
            title: doc.title, 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, 
            content: <DocumentEditorPanel 
                        document={doc} 
                        onUpdate={props.onUpdateDocument}
                        onClose={() => props.setOpenDocIds(prev => prev.filter(docId => docId !== id))}
                        isDarkMode={props.isDarkMode}
                     />,
            isOpen: true,
            onToggle: () => props.setOpenDocIds(prev => prev.filter(docId => docId !== id))
        };
    }).filter((p): p is PanelDefinition => p !== null);

    const historyPanels: PanelDefinition[] = props.detachedHistoryIds.map((id): PanelDefinition | null => {
        const entry = props.history.find(h => h.id === id);
        if (!entry) return null;
        return {
            id: `history-${id}`,
            title: `History: ${entry.tool}`,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            content: <HistoryItemPanel 
                        entry={entry}
                        onClose={() => props.setDetachedHistoryIds(prev => prev.filter(hid => hid !== id))}
                        onReopen={props.onReopenHistory}
                        onAnalyze={props.onAnalyzeWithChat}
                        onDelete={props.onDeleteHistory}
                     />,
            isOpen: true,
            onToggle: () => props.setDetachedHistoryIds(prev => prev.filter(hid => hid !== id))
        };
    }).filter((p): p is PanelDefinition => p !== null);

    return [...staticPanels, ...docPanels, ...historyPanels];
  }, [props]);
};
