
import React, { useState, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { HelpMenu } from './HelpMenu';

interface AppHeaderProps {
  currentModelName: string;
  onNewModel: () => void;
  onSaveAs: () => void;
  onOpenModel: () => void;
  onSaveDisk: () => void;
  onCopy: () => void;
  onPaste: () => void;
  
  tools: {
    activeTool: string | null;
    isToolsPanelOpen: boolean;
    setIsToolsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    toggleTool: (toolId: string) => void;
    setActiveTool: React.Dispatch<React.SetStateAction<string | null>>;
  };
  
  panelState: {
    isReportPanelOpen: boolean;
    setIsReportPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConceptCloudOpen: boolean;
    setIsConceptCloudOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSunburstPanelOpen: boolean;
    setIsSunburstPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSunburstState: React.Dispatch<React.SetStateAction<any>>;
    isInfluenceCloudOpen: boolean;
    setIsInfluenceCloudOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isTextAnalysisOpen: boolean;
    setIsTextAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isFullTextAnalysisOpen: boolean;
    setIsFullTextAnalysisOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMermaidPanelOpen: boolean;
    setIsMermaidPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isPresentationPanelOpen: boolean;
    setIsPresentationPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isKanbanPanelOpen: boolean;
    setIsKanbanPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isDocumentPanelOpen: boolean;
    setIsDocumentPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isHistoryPanelOpen: boolean;
    setIsHistoryPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isTablePanelOpen: boolean;
    setIsTablePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMatrixPanelOpen: boolean;
    setIsMatrixPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isGridPanelOpen: boolean;
    setIsGridPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMarkdownPanelOpen: boolean;
    setIsMarkdownPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isJSONPanelOpen: boolean;
    setIsJSONPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isFilterPanelOpen: boolean;
    setIsFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isChatPanelOpen: boolean;
    setIsChatPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };

  focusMode: 'narrow' | 'wide' | 'zoom';
  onToggleFocusMode: () => void;
  onZoomToFit: () => void;
  onOpenSettings: (tab: any) => void;
  
  // Help Handlers
  onAbout: () => void;
  onPatternGallery: () => void;
  onSelfTest: () => void;
  onUserGuide: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleDebug: () => void;
  onOpenKanban: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentModelName,
  onNewModel,
  onSaveAs,
  onOpenModel,
  onSaveDisk,
  onCopy,
  onPaste,
  tools,
  panelState,
  focusMode,
  onToggleFocusMode,
  onZoomToFit,
  onOpenSettings,
  onAbout,
  onPatternGallery,
  onSelfTest,
  onUserGuide,
  isDarkMode,
  onToggleTheme,
  onToggleDebug,
  onOpenKanban
}) => {
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  
  const mainMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(mainMenuRef, () => setIsMainMenuOpen(false));
  useClickOutside(helpMenuRef, () => setIsHelpMenuOpen(false));

  const focusButtonTitle = () => {
    if (focusMode === 'narrow') return 'Switch to Wide Focus';
    if (focusMode === 'wide') return 'Switch to Zoom Focus';
    return 'Switch to Narrow Focus';
  };

  // Theme Classes for Header
  const headerBg = isDarkMode ? 'bg-gray-800 bg-opacity-80' : 'bg-white bg-opacity-95 border border-gray-200 shadow-sm';
  const textClass = isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100';
  const menuBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const menuItemHover = isDarkMode ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-black';
  const dividerClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const labelClass = isDarkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`absolute top-4 left-4 z-[600] p-2 rounded-lg flex items-center space-x-2 ${headerBg}`}>
      
      {/* Main Menu Dropdown */}
      <div className="relative" ref={mainMenuRef}>
        <button 
            onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors outline-none ${textClass}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8c2-2 4-2 6 0s4 2 6 0" />
                <path d="M4 12c2-2 4-2 6 0s4 2 6 0" />
                <path d="M4 16c2-2 4-2 6 0s4 2 6 0" />
            </svg>
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Tapestry Studio</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} transition-transform ${isMainMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        {isMainMenuOpen && (
            <div className={`absolute top-full left-0 mt-2 w-64 border rounded-lg shadow-xl py-2 flex flex-col z-50 text-sm animate-fade-in-down max-h-[80vh] overflow-y-auto ${menuBg}`}>
                {/* File Section */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${labelClass}`}>File</div>
                <button onClick={() => { onNewModel(); setIsMainMenuOpen(false); }} className={`w-full text-left px-4 py-2 flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${menuItemHover}`}>
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Model...
                </button>
                <button onClick={() => { onSaveAs(); setIsMainMenuOpen(false); }} className={`w-full text-left px-4 py-2 flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${menuItemHover}`}>
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save As...
                </button>
                <button onClick={() => { onOpenModel(); setIsMainMenuOpen(false); }} className={`w-full text-left px-4 py-2 flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${menuItemHover}`}>
                    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    Open Model...
                </button>
                <button onClick={() => { onSaveDisk(); setIsMainMenuOpen(false); }} className={`w-full text-left px-4 py-2 flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${menuItemHover}`}>
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save to Disk
                </button>
                
                <div className={`border-t my-2 mx-2 ${dividerClass}`}></div>
                
                {/* Tools Section */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${labelClass}`}>Tools</div>
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
                        onClick={() => { tools.toggleTool(tool.id); tools.setIsToolsPanelOpen(true); setIsMainMenuOpen(false); }} 
                        className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${menuItemHover} ${tools.activeTool === tool.id ? (isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}
                    >
                        <span className={`w-2 h-2 rounded-full bg-current ${tool.color}`}></span>
                        {tool.label}
                        {tools.activeTool === tool.id && <span className="ml-auto text-xs text-blue-400 font-bold">ACTIVE</span>}
                    </button>
                ))}
                
                <div className={`border-t my-2 mx-2 ${dividerClass}`}></div>

                {/* Panels Section */}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${labelClass}`}>Panels</div>
                {[
                    { label: 'Report', state: panelState.isReportPanelOpen, toggle: () => panelState.setIsReportPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                    { label: 'Tag Cloud', state: panelState.isConceptCloudOpen, toggle: () => panelState.setIsConceptCloudOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
                    { label: 'Sunburst', state: panelState.isSunburstPanelOpen, toggle: () => { panelState.setIsSunburstPanelOpen(p => !p); if(panelState.isSunburstPanelOpen) panelState.setSunburstState(prev => ({...prev, active: false})); else panelState.setSunburstState(prev => ({...prev, active: true})); }, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                    { label: 'Relationship Cloud', state: panelState.isInfluenceCloudOpen, toggle: () => panelState.setIsInfluenceCloudOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
                    { label: 'Node Name Analysis', state: panelState.isTextAnalysisOpen, toggle: () => panelState.setIsTextAnalysisOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                    { label: 'Full Text Analysis', state: panelState.isFullTextAnalysisOpen, toggle: () => panelState.setIsFullTextAnalysisOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
                    { label: 'Diagrams', state: panelState.isMermaidPanelOpen, toggle: () => panelState.setIsMermaidPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
                    { label: 'Story Mode', state: panelState.isPresentationPanelOpen, toggle: () => panelState.setIsPresentationPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
                    { label: 'Kanban', state: panelState.isKanbanPanelOpen, toggle: onOpenKanban, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
                    { label: 'Documents', state: panelState.isDocumentPanelOpen, toggle: () => panelState.setIsDocumentPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
                    { label: 'History', state: panelState.isHistoryPanelOpen, toggle: () => panelState.setIsHistoryPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                    { label: 'Table', state: panelState.isTablePanelOpen, toggle: () => panelState.setIsTablePanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg> },
                    { label: 'Matrix', state: panelState.isMatrixPanelOpen, toggle: () => panelState.setIsMatrixPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z M12 3v18 M3 12h18" /></svg> },
                    { label: 'Grid', state: panelState.isGridPanelOpen, toggle: () => panelState.setIsGridPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /></svg> },
                    { label: 'Markdown', state: panelState.isMarkdownPanelOpen, toggle: () => panelState.setIsMarkdownPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
                    { label: 'JSON', state: panelState.isJSONPanelOpen, toggle: () => panelState.setIsJSONPanelOpen(p => !p), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg> }
                ].map((panel, idx) => (
                    <button 
                        key={idx}
                        onClick={() => { panel.toggle(); setIsMainMenuOpen(false); }} 
                        className={`w-full text-left px-4 py-2 flex items-center justify-between group ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${menuItemHover}`}
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

      <div className={`border-l h-6 mx-1 ${dividerClass}`}></div>
        
        {/* Standard Toolbar Buttons */}
        <button onClick={onNewModel} title="New Model..." className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
        <button onClick={onOpenModel} title="Open Model..." className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
        </button>
        <button onClick={onSaveDisk} title="Save to Disk" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
        </button>
        <div className={`border-l h-6 mx-1 ${dividerClass}`}></div>
        
        {/* Copy / Paste */}
        <button onClick={onCopy} title="Copy Selected (Report)" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
        </button>
        <button onClick={onPaste} title="Paste (Add to Model)" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        </button>

        <div className={`border-l h-6 mx-1 ${dividerClass}`}></div>
        <button onClick={() => tools.setIsToolsPanelOpen(p => !p)} title="Toggle Tools Panel" className={`p-2 rounded-md transition ${textClass} ${tools.isToolsPanelOpen ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black') : 'text-blue-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        </button>
        <div className={`border-l h-6 mx-1 ${dividerClass}`}></div>
        <button onClick={() => panelState.setIsFilterPanelOpen((p: boolean) => !p)} title="Filter by Tag" className={`p-2 rounded-md transition ${textClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        </button>
        <button onClick={onToggleFocusMode} title={focusButtonTitle()} className={`p-2 rounded-md transition ${textClass}`}>
            {focusMode === 'narrow' && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /></svg>)}
            {focusMode === 'wide' && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>)}
            {focusMode === 'zoom' && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 6V2h4 M22 6V2h-4 M2 18v4h4 M22 18v4h-4" /></svg>)}
        </button>
        
        <button onClick={() => panelState.setIsMermaidPanelOpen((prev: boolean) => !prev)} title="Diagrams" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
        </button>

        <button onClick={() => panelState.setIsDocumentPanelOpen((prev: boolean) => !prev)} title="Documents" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </button>

        <button onClick={onOpenKanban} title="Kanban Board" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
        </button>

        <button onClick={() => panelState.setIsPresentationPanelOpen((prev: boolean) => !prev)} title="Story Mode" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        </button>

        <button onClick={() => panelState.setIsTablePanelOpen((prev: boolean) => !prev)} title="Table View" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
        </button>
        <button onClick={() => panelState.setIsMatrixPanelOpen((prev: boolean) => !prev)} title="Matrix View" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z M12 3v18 M3 12h18" />
            </svg>
        </button>
        <button onClick={() => panelState.setIsGridPanelOpen((prev: boolean) => !prev)} title="Attribute Grid View" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" />
            </svg>
        </button>
        <button onClick={() => panelState.setIsMarkdownPanelOpen((prev: boolean) => !prev)} title="Markdown View" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
        <button onClick={() => panelState.setIsJSONPanelOpen((prev: boolean) => !prev)} title="JSON View" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
        </button>
        <button onClick={() => panelState.setIsReportPanelOpen((prev: boolean) => !prev)} title="Report View" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </button>
        <button onClick={() => panelState.setIsHistoryPanelOpen((prev: boolean) => !prev)} title="AI History" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <button onClick={() => panelState.setIsChatPanelOpen((prev: boolean) => !prev)} title="AI Assistant" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        </button>
        <button onClick={() => onOpenSettings('general')} title="Settings" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
        </button>
        <button onClick={onZoomToFit} title="Zoom to Fit" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
        </button>
        
        <div className="relative" ref={helpMenuRef}>
            <button onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)} title="Help" className={`p-2 rounded-md transition ${textClass}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            {isHelpMenuOpen && (
                <HelpMenu 
                    onClose={() => setIsHelpMenuOpen(false)} 
                    onAbout={onAbout}
                    onPatternGallery={onPatternGallery}
                    onSelfTest={onSelfTest}
                    onUserGuide={onUserGuide}
                    isDarkMode={isDarkMode}
                />
            )}
        </div>

        <button onClick={onToggleTheme} title={isDarkMode ? "Light Mode" : "Dark Mode"} className={`p-2 rounded-md transition ${textClass}`}>
            {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>

        <button onClick={onToggleDebug} title="Debug Mode" className={`p-2 rounded-md transition ${textClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2C6.5 2 4 4.5 4 7.5c0 1.2.4 2.3 1 3.2-.6.9-1 2-1 3.2 0 2.5 2 4.5 4.5 4.5h.5c.3 2 2 3.5 4 3.5s3.7-1.5 4-3.5h.5c2.5 0 4.5-2 4.5-4.5 0-1.2-.4-2.3-1-3.2.6-.9 1-2 1-3.2C21 4.5 18.5 2 15.5 2c-1.2 0-2.3.4-3.2 1-.9-.6-2-1-3.2-1z" />
            </svg>
        </button>
        
        <div className={`border-l h-6 mx-2 ${dividerClass}`}></div>
        <span className={`text-sm font-semibold pr-2 ${labelClass}`}>Current Model: {currentModelName}</span>
    </div>
  );
};

export default AppHeader;
