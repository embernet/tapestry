
import { useState, useCallback } from 'react';
import { 
    TrizToolType, LssToolType, TocToolType, SsmToolType, 
    ExplorerToolType, TagCloudToolType, SwotToolType, 
    MermaidToolType, HistoryEntry, TapestryDocument 
} from '../types';

export const useTools = (panelState?: any) => {
  // General Tool State
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);
  const [isBulkEditActive, setIsBulkEditActive] = useState(false);

  // --- Tool Specific States ---
  
  // TRIZ
  const [activeTrizTool, setActiveTrizTool] = useState<TrizToolType>(null);
  const [isTrizModalOpen, setIsTrizModalOpen] = useState(false);
  const [trizInitialParams, setTrizInitialParams] = useState<any>(null);

  // LSS
  const [activeLssTool, setActiveLssTool] = useState<LssToolType>(null);
  const [isLssModalOpen, setIsLssModalOpen] = useState(false);
  const [lssInitialParams, setLssInitialParams] = useState<any>(null);

  // TOC
  const [activeTocTool, setActiveTocTool] = useState<TocToolType>(null);
  const [isTocModalOpen, setIsTocModalOpen] = useState(false);
  const [tocInitialParams, setTocInitialParams] = useState<any>(null);

  // SSM
  const [activeSsmTool, setActiveSsmTool] = useState<SsmToolType>(null);
  const [isSsmModalOpen, setIsSsmModalOpen] = useState(false);
  const [ssmInitialParams, setSsmInitialParams] = useState<any>(null);

  // SWOT
  const [activeSwotTool, setActiveSwotTool] = useState<SwotToolType>(null);
  const [isSwotModalOpen, setIsSwotModalOpen] = useState(false);
  const [swotInitialDoc, setSwotInitialDoc] = useState<TapestryDocument | null>(null);

  // SCAMPER
  const [isScamperModalOpen, setIsScamperModalOpen] = useState(false);
  const [scamperTrigger, setScamperTrigger] = useState<{ operator: string, letter: string } | null>(null);
  const [scamperInitialDoc, setScamperInitialDoc] = useState<TapestryDocument | null>(null);

  const toggleTool = (toolName: string) => {
      setActiveTool(prev => {
          if (prev === 'bulk' && toolName !== 'bulk') {
              setIsBulkEditActive(false);
          }
          return prev === toolName ? null : toolName;
      });
  };

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
      } else if (tool === 'swot') {
          setActiveSwotTool((subTool as SwotToolType) || 'matrix');
          setSwotInitialDoc(null); 
          setIsSwotModalOpen(true);
      } else if (tool === 'mermaid' && panelState) {
          panelState.setIsMermaidPanelOpen(true);
      } else if (tool === 'explorer' && panelState) {
          if (subTool === 'treemap') panelState.setIsTreemapPanelOpen(true);
          else if (subTool === 'tags') panelState.setIsTagDistPanelOpen(true);
          else if (subTool === 'relationships') panelState.setIsRelDistPanelOpen(true);
          else if (subTool === 'sunburst') {
              panelState.setIsSunburstPanelOpen(true);
              panelState.setSunburstState((prev: any) => ({ ...prev, active: true }));
          }
          else panelState.setIsTreemapPanelOpen(true); 
      } else if (tool === 'tagcloud' && panelState) {
          if (subTool === 'tags') panelState.setIsConceptCloudOpen(true);
          else if (subTool === 'nodes') panelState.setIsInfluenceCloudOpen(true);
          else if (subTool === 'words') panelState.setIsTextAnalysisOpen(true);
          else if (subTool === 'full_text') panelState.setIsFullTextAnalysisOpen(true);
          else panelState.setIsConceptCloudOpen(true);
      }
  }, [panelState]);

  const handleReopenHistory = useCallback((entry: HistoryEntry) => {
      const toolId = entry.tool.split(':')[0].toLowerCase().trim(); 
      const subTool = entry.subTool;
      const params = entry.toolParams;

      if (toolId.includes('triz')) {
          setActiveTool('triz');
          setActiveTrizTool((subTool as TrizToolType) || null);
          setTrizInitialParams(params);
          setIsTrizModalOpen(true);
      } else if (toolId.includes('lss') || toolId.includes('lean')) {
          setActiveTool('lss');
          setActiveLssTool((subTool as LssToolType) || null);
          setLssInitialParams(params);
          setIsLssModalOpen(true);
      } else if (toolId.includes('toc')) {
          setActiveTool('toc');
          setActiveTocTool((subTool as TocToolType) || null);
          setTocInitialParams(params);
          setIsTocModalOpen(true);
      } else if (toolId.includes('ssm')) {
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
      } else if (toolId.includes('swot')) {
          setActiveTool('swot');
          setActiveSwotTool((subTool as SwotToolType) || 'matrix');
          setSwotInitialDoc(null);
          setIsSwotModalOpen(true);
      } else if (toolId.includes('explorer') && panelState) {
          setActiveTool('explorer');
          // Basic mapping, assuming standard types
          if (subTool === 'treemap') panelState.setIsTreemapPanelOpen(true);
          // ... other mapping logic can be duplicated from handleOpenTool if needed
      } 
      // Add other history reopen logic here
      
      setIsToolsPanelOpen(true);
  }, [panelState]);

  return {
    activeTool, setActiveTool,
    isToolsPanelOpen, setIsToolsPanelOpen,
    isBulkEditActive, setIsBulkEditActive,
    
    // TRIZ
    activeTrizTool, setActiveTrizTool,
    isTrizModalOpen, setIsTrizModalOpen,
    trizInitialParams, setTrizInitialParams,

    // LSS
    activeLssTool, setActiveLssTool,
    isLssModalOpen, setIsLssModalOpen,
    lssInitialParams, setLssInitialParams,

    // TOC
    activeTocTool, setActiveTocTool,
    isTocModalOpen, setIsTocModalOpen,
    tocInitialParams, setTocInitialParams,

    // SSM
    activeSsmTool, setActiveSsmTool,
    isSsmModalOpen, setIsSsmModalOpen,
    ssmInitialParams, setSsmInitialParams,

    // SWOT
    activeSwotTool, setActiveSwotTool,
    isSwotModalOpen, setIsSwotModalOpen,
    swotInitialDoc, setSwotInitialDoc,

    // SCAMPER
    isScamperModalOpen, setIsScamperModalOpen,
    scamperTrigger, setScamperTrigger,
    scamperInitialDoc, setScamperInitialDoc,

    // Actions
    toggleTool,
    handleOpenTool,
    handleReopenHistory
  };
};
