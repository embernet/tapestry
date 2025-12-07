
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
import BulkEditToolbar from './BulkEditToolbar';
import ScriptsToolbar from './ScriptsToolbar';
import CommandBar from './CommandBar';
import { Element, Relationship, ColorScheme, CustomStrategyTool, NodeShape } from '../types';

// Tools that expand horizontally and should hide others when active
const HORIZONTAL_TOOLS = ['search', 'schema', 'layout', 'bulk', 'command'];

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

  // Scripts
  handleCreateScript: (name: string, code: string) => void;
  
  // Misc
  globalSettings: { customStrategies: CustomStrategyTool[] };
  isDarkMode: boolean;
  selectedElementId: string | null;

  // Analysis
  handleAnalysisToolSelect: (toolId: string) => void;
  
  // Highlighting
  isHighlightToolActive?: boolean;
  setIsHighlightToolActive?: (active: boolean) => void;
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

    // Methods that are now handled by the MethodsToolbar
    const isMethodActive = ['scamper', 'triz', 'lss', 'toc', 'ssm'].includes(tools.activeTool || '');

    const handleMethodToolSelect = (method: string, tool: string) => {
        // Close tool panel by clearing active tool
        tools.setActiveTool(null);

        if (method === 'triz') {
            props.handleTrizToolSelect(tool);
        } else if (method === 'lss') {
            props.handleLssToolSelect(tool);
        } else if (method === 'toc') {
            props.handleTocToolSelect(tool);
        } else if (method === 'ssm') {
            props.handleSsmToolSelect(tool);
        } else if (method === 'scamper') {
            // SCAMPER expects operator name and letter
            // The tool ID from toolbar comes as the LETTER (e.g. 'S', 'C')
            // We need to map letter to full operator for the handler
            const SCAMPER_MAP: Record<string, string> = {
                'S': 'Substitute', 'C': 'Combine', 'A': 'Adapt', 'M': 'Modify',
                'P': 'Put to another use', 'E': 'Eliminate', 'R': 'Reverse'
            };
            const letter = tool;
            const operator = SCAMPER_MAP[letter];
            
            if (operator) {
                tools.setScamperInitialDoc(null);
                tools.setScamperTrigger({ operator, letter });
                tools.setIsScamperModalOpen(true);
            }
        }
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
                
                {isToolVisible('scripts') && (
                    <ScriptsToolbar 
                        onOpenEditor={() => {
                            panelState.setIsScriptPanelOpen(true);
                            tools.setActiveTool(null);
                        }}
                        onLoadExample={(code) => {
                            props.handleCreateScript(`Example ${new Date().toLocaleTimeString()}`, code);
                            panelState.setIsScriptPanelOpen(true);
                            tools.setActiveTool(null);
                        }}
                        isCollapsed={tools.activeTool !== 'scripts'}
                        onToggle={() => tools.toggleTool('scripts')}
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
                    <AnalysisToolbar 
                        onSelectTool={props.handleAnalysisToolSelect}
                        isCollapsed={tools.activeTool !== 'analysis'} 
                        onToggle={() => tools.toggleTool('analysis')} 
                        isDarkMode={isDarkMode} 
                    />
                )}
                
                {/* Methods Toolbar replaces individual method toolbars */}
                {isToolVisible('methods') && (
                    <MethodsToolbar 
                        onSelectTool={handleMethodToolSelect} 
                        isCollapsed={tools.activeTool !== 'methods'} 
                        onToggle={() => tools.toggleTool('methods')}
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
