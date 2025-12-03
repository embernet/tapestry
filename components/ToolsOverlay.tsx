

import React from 'react';
import AiToolbar from './AiToolbar';
import SearchToolbar from './SearchToolbar';
import VisualiseToolbar from './VisualiseToolbar';
import SchemaToolbar from './SchemaToolbar';
import LayoutToolbar from './LayoutToolbar';
import AnalysisToolbar from './AnalysisToolbar';
import MethodsToolbar from './MethodsToolbar';
import ScamperToolbar from './ScamperToolbar';
import TrizToolbar from './TrizToolbar';
import LssToolbar from './LssToolbar';
import TocToolbar from './TocToolbar';
import SsmToolbar from './SsmToolbar';
import SwotToolbar from './SwotToolbar';
import ExplorerToolbar from './ExplorerToolbar';
import TagCloudToolbar from './TagCloudToolbar';
import MermaidToolbar from './MermaidToolbar';
import BulkEditToolbar from './BulkEditToolbar';
import CommandBar from './CommandBar';
import { Element, Relationship, ColorScheme, CustomStrategyTool, NodeShape } from '../types';

// Tools that expand horizontally and should hide others when active
const HORIZONTAL_TOOLS = ['ai', 'search', 'schema', 'layout', 'analysis', 'bulk', 'command', 'mermaid', 'scamper', 'triz', 'lss', 'toc', 'ssm'];

interface ToolsOverlayProps {
  tools: any;
  panelState: any;
  elements: Element[];
  relationships: Relationship[];
  colorSchemes: ColorScheme[];
  activeSchemeId: string | null;
  activeColorScheme: ColorScheme | undefined;
  defaultTags: string[];
  layoutParams: { linkDistance: number; repulsion: number };
  isPhysicsModeActive: boolean;
  isBulkEditActive: boolean;
  isSimulationMode: boolean;
  nodeShape: NodeShape;
  
  // Handlers
  handleAiToolSelect: (id: string) => void;
  handleSearch: (ids: Set<string>) => void;
  handleFocusSingle: (id: string) => void;
  handleSearchReset: () => void;
  handleVisualiseToolSelect: (tool: any) => void;
  setActiveSchemeId: (id: string) => void;
  handleUpdateDefaultRelationship: (label: string) => void;
  setDefaultTags: (tags: string[]) => void;
  setColorSchemes: (schemes: ColorScheme[]) => void;
  setLayoutParams: (params: any) => void;
  setJiggleTrigger: (cb: (prev: number) => number) => void;
  handleZoomToFit: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleStartPhysicsLayout: () => void;
  handleAcceptLayout: () => void;
  handleRejectLayout: () => void;
  handleScaleLayout: (factor: number) => void;
  handleStaticLayout: () => void;
  setNodeShape: (shape: NodeShape) => void;
  handleBulkTagAction: (ids: string[], tag: string, mode: 'add' | 'remove') => void;
  handleAnalysisHighlight: (map: Map<string, string>) => void;
  handleAnalysisFilter: (mode: string, ids: Set<string>) => void;
  setIsSimulationMode: (cb: (prev: boolean) => boolean) => void;
  setSimulationState: (state: any) => void;
  
  // Specific Tool Handlers
  handleTrizToolSelect: (tool: any) => void;
  handleLssToolSelect: (tool: any) => void;
  handleTocToolSelect: (tool: any) => void;
  handleSsmToolSelect: (tool: any) => void;
  handleSwotToolSelect: (tool: any) => void;
  handleExplorerToolSelect: (tool: any) => void;
  handleTagCloudToolSelect: (tool: any) => void;
  handleMermaidToolSelect: (tool: any) => void;
  setSettingsInitialTab: (tab: any) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  
  // Bulk
  bulkTagsToAdd: string[];
  setBulkTagsToAdd: (tags: string[]) => void;
  bulkTagsToRemove: string[];
  setBulkTagsToRemove: (tags: string[]) => void;
  setIsBulkEditActive: (cb: (prev: boolean) => boolean) => void;
  
  // Command
  handleCommandExecution: (cmd: string) => void;
  handleOpenCommandHistory: () => void;
  
  // Misc
  globalSettings: { customStrategies: CustomStrategyTool[] };
  isDarkMode: boolean;
  selectedElementId: string | null;
}

export const ToolsOverlay: React.FC<ToolsOverlayProps> = (props) => {
    const { tools, panelState, isDarkMode } = props;

    const isToolVisible = (toolId: string) => {
        if (!tools.activeTool) return true;
        if (HORIZONTAL_TOOLS.includes(tools.activeTool)) {
            return tools.activeTool === toolId;
        }
        return true;
    };

    return (
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
                        onSelectTool={props.handleAiToolSelect}
                        isCollapsed={tools.activeTool !== 'ai'}
                        onToggle={() => tools.toggleTool('ai')}
                        isDarkMode={isDarkMode}
                    />
                )}

                {isToolVisible('search') && (
                    <SearchToolbar 
                        elements={props.elements} 
                        onSearch={props.handleSearch} 
                        onFocusSingle={props.handleFocusSingle} 
                        isCollapsed={tools.activeTool !== 'search'} 
                        onToggle={() => tools.toggleTool('search')} 
                        isDarkMode={isDarkMode} 
                        onReset={props.handleSearchReset}
                    />
                )}
                {isToolVisible('visualise') && (
                    <VisualiseToolbar 
                        onSelectTool={props.handleVisualiseToolSelect} 
                        isCollapsed={tools.activeTool !== 'visualise'} 
                        onToggle={() => tools.toggleTool('visualise')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {isToolVisible('schema') && (
                    <SchemaToolbar schemes={props.colorSchemes} activeSchemeId={props.activeSchemeId} onSchemeChange={props.setActiveSchemeId} activeColorScheme={props.activeColorScheme} onDefaultRelationshipChange={props.handleUpdateDefaultRelationship} defaultTags={props.defaultTags} onDefaultTagsChange={props.setDefaultTags} elements={props.elements} isCollapsed={tools.activeTool !== 'schema'} onToggle={() => tools.toggleTool('schema')} onUpdateSchemes={props.setColorSchemes} isDarkMode={isDarkMode} />
                )}
                {isToolVisible('layout') && (
                    <LayoutToolbar 
                        linkDistance={props.layoutParams.linkDistance} 
                        repulsion={props.layoutParams.repulsion} 
                        onLinkDistanceChange={(val) => props.setLayoutParams((p:any) => ({...p, linkDistance: val}))} 
                        onRepulsionChange={(val) => props.setLayoutParams((p:any) => ({...p, repulsion: val}))} 
                        onJiggle={() => props.setJiggleTrigger(prev => prev + 1)} 
                        onZoomToFit={props.handleZoomToFit}
                        onZoomIn={props.handleZoomIn}
                        onZoomOut={props.handleZoomOut} 
                        isPhysicsActive={props.isPhysicsModeActive} 
                        onStartAutoLayout={props.handleStartPhysicsLayout} 
                        onAcceptAutoLayout={props.handleAcceptLayout} 
                        onRejectAutoLayout={props.handleRejectLayout}
                        onStaticLayout={props.handleStaticLayout}
                        onExpand={() => props.handleScaleLayout(1.1)} 
                        onContract={() => props.handleScaleLayout(0.9)} 
                        isCollapsed={tools.activeTool !== 'layout'} 
                        onToggle={() => tools.toggleTool('layout')} 
                        isDarkMode={isDarkMode} 
                        nodeShape={props.nodeShape}
                        onNodeShapeChange={props.setNodeShape}
                    />
                )}
                {isToolVisible('analysis') && (
                    <AnalysisToolbar elements={props.elements} relationships={props.relationships} onBulkTag={props.handleBulkTagAction} onHighlight={props.handleAnalysisHighlight} onFilter={props.handleAnalysisFilter} isCollapsed={tools.activeTool !== 'analysis'} onToggle={() => tools.toggleTool('analysis')} isSimulationMode={props.isSimulationMode} onToggleSimulation={() => props.setIsSimulationMode(p => !p)} onResetSimulation={() => props.setSimulationState({})} isDarkMode={isDarkMode} />
                )}
                
                {isToolVisible('methods') && (
                    <MethodsToolbar 
                        onSelectMethod={(method) => tools.setActiveTool(method)} 
                        isCollapsed={tools.activeTool !== 'methods'} 
                        onToggle={() => tools.toggleTool('methods')}
                        isDarkMode={isDarkMode}
                    />
                )}

                {tools.activeTool === 'scamper' && (
                    <ScamperToolbar selectedElementId={props.selectedElementId} onScamper={(operator, letter) => { tools.setScamperInitialDoc(null); tools.setScamperTrigger({ operator, letter }); tools.setIsScamperModalOpen(true); tools.setActiveTool(null); }} isCollapsed={tools.activeTool !== 'scamper'} onToggle={() => tools.toggleTool('scamper')} onOpenSettings={() => { props.setSettingsInitialTab('prompts'); props.setIsSettingsModalOpen(true); }} isDarkMode={isDarkMode} />
                )}
                {tools.activeTool === 'triz' && (
                    <TrizToolbar 
                        activeTool={tools.activeTrizTool} 
                        onSelectTool={(tool) => { props.handleTrizToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'triz'} 
                        onToggle={() => tools.toggleTool('triz')} 
                        onOpenSettings={() => { props.setSettingsInitialTab('prompts'); props.setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                        onOpenGuidance={() => tools.handleOpenGuidance('triz-' + tools.activeTrizTool)}
                    />
                )}
                {tools.activeTool === 'lss' && (
                    <LssToolbar 
                        activeTool={tools.activeLssTool} 
                        onSelectTool={(tool) => { props.handleLssToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'lss'} 
                        onToggle={() => tools.toggleTool('lss')} 
                        onOpenSettings={() => { props.setSettingsInitialTab('prompts'); props.setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {tools.activeTool === 'toc' && (
                    <TocToolbar 
                        activeTool={tools.activeTocTool} 
                        onSelectTool={(tool) => { props.handleTocToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'toc'} 
                        onToggle={() => tools.toggleTool('toc')} 
                        onOpenSettings={() => { props.setSettingsInitialTab('prompts'); props.setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {tools.activeTool === 'ssm' && (
                    <SsmToolbar 
                        activeTool={tools.activeSsmTool} 
                        onSelectTool={(tool) => { props.handleSsmToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'ssm'} 
                        onToggle={() => tools.toggleTool('ssm')} 
                        onOpenSettings={() => { props.setSettingsInitialTab('prompts'); props.setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                    />
                )}

                {isToolVisible('swot') && (
                    <SwotToolbar 
                        activeTool={tools.activeSwotTool} 
                        onSelectTool={(tool) => { props.handleSwotToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'swot'} 
                        onToggle={() => tools.toggleTool('swot')} 
                        onOpenSettings={() => { props.setSettingsInitialTab('prompts'); props.setIsSettingsModalOpen(true); }} 
                        isDarkMode={isDarkMode} 
                        customStrategies={props.globalSettings.customStrategies} 
                        onOpenGuidance={() => tools.handleOpenGuidance('strategy')}
                    />
                )}
                {isToolVisible('explorer') && (
                    <ExplorerToolbar 
                        onSelectTool={(tool) => { props.handleExplorerToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'explorer'} 
                        onToggle={() => tools.toggleTool('explorer')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {isToolVisible('tagcloud') && (
                    <TagCloudToolbar 
                        onSelectTool={(tool) => { props.handleTagCloudToolSelect(tool); tools.setActiveTool(null); }} 
                        isCollapsed={tools.activeTool !== 'tagcloud'} 
                        onToggle={() => tools.toggleTool('tagcloud')} 
                        isDarkMode={isDarkMode} 
                        onOpenGuidance={() => tools.handleOpenGuidance('wordcloud')}
                    />
                )}
                {isToolVisible('mermaid') && (
                    <MermaidToolbar 
                        onSelectTool={(tool) => { props.handleMermaidToolSelect(tool); tools.setActiveTool(null); }}
                        isCollapsed={tools.activeTool !== 'mermaid'} 
                        onToggle={() => tools.toggleTool('mermaid')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                {isToolVisible('bulk') && (
                    <BulkEditToolbar activeColorScheme={props.activeColorScheme} tagsToAdd={props.bulkTagsToAdd} tagsToRemove={props.bulkTagsToRemove} onTagsToAddChange={props.setBulkTagsToAdd} onTagsToRemoveChange={props.setBulkTagsToRemove} isActive={props.isBulkEditActive} onToggleActive={() => props.setIsBulkEditActive(p => !p)} isCollapsed={tools.activeTool !== 'bulk'} onToggle={() => tools.toggleTool('bulk')} isDarkMode={isDarkMode} />
                )}
                {isToolVisible('command') && (
                    <CommandBar onExecute={props.handleCommandExecution} isCollapsed={tools.activeTool !== 'command'} onToggle={() => tools.toggleTool('command')} onOpenHistory={props.handleOpenCommandHistory} isDarkMode={isDarkMode} />
                )}
            </div>
        </div>
    );
}
