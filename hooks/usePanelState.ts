
import { useState } from 'react';
import { GuidanceContent } from '../types';

export const usePanelState = () => {
  // --- Standard Panels ---
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [isTablePanelOpen, setIsTablePanelOpen] = useState(false);
  const [isMatrixPanelOpen, setIsMatrixPanelOpen] = useState(false);
  const [isGridPanelOpen, setIsGridPanelOpen] = useState(false);
  const [isKanbanPanelOpen, setIsKanbanPanelOpen] = useState(false);
  const [isPresentationPanelOpen, setIsPresentationPanelOpen] = useState(false);
  const [isDocumentPanelOpen, setIsDocumentPanelOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isMarkdownPanelOpen, setIsMarkdownPanelOpen] = useState(false);
  const [isJSONPanelOpen, setIsJSONPanelOpen] = useState(false);
  const [isMermaidPanelOpen, setIsMermaidPanelOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isGuidancePanelOpen, setIsGuidancePanelOpen] = useState(false);
  const [guidanceContent, setGuidanceContent] = useState<GuidanceContent | null>(null);
  
  // --- New Script Panel ---
  const [isScriptPanelOpen, setIsScriptPanelOpen] = useState(false);

  // --- Analysis Panels ---
  const [isNetworkAnalysisOpen, setIsNetworkAnalysisOpen] = useState(false);

  // --- Explorer Panels ---
  const [isTreemapPanelOpen, setIsTreemapPanelOpen] = useState(false);
  const [isTagDistPanelOpen, setIsTagDistPanelOpen] = useState(false);
  const [isRelDistPanelOpen, setIsRelDistPanelOpen] = useState(false);
  const [isSunburstPanelOpen, setIsSunburstPanelOpen] = useState(false);
  const [isCirclePackingPanelOpen, setIsCirclePackingPanelOpen] = useState(false);
  const [sunburstState, setSunburstState] = useState<{ active: boolean, centerId: string | null, hops: number }>({ active: false, centerId: null, hops: 0 });

  // --- Tag Cloud Panels ---
  const [isConceptCloudOpen, setIsConceptCloudOpen] = useState(false);
  const [isInfluenceCloudOpen, setIsInfluenceCloudOpen] = useState(false);
  const [isTextAnalysisOpen, setIsTextAnalysisOpen] = useState(false);
  const [isFullTextAnalysisOpen, setIsFullTextAnalysisOpen] = useState(false);

  const closeAllPanels = () => {
    setIsReportPanelOpen(false);
    setIsTablePanelOpen(false);
    setIsMatrixPanelOpen(false);
    setIsGridPanelOpen(false);
    setIsKanbanPanelOpen(false);
    setIsPresentationPanelOpen(false);
    setIsDocumentPanelOpen(false);
    setIsHistoryPanelOpen(false);
    setIsMarkdownPanelOpen(false);
    setIsJSONPanelOpen(false);
    setIsMermaidPanelOpen(false);
    setIsFilterPanelOpen(false);
    setIsChatPanelOpen(false);
    setIsGuidancePanelOpen(false);
    setIsScriptPanelOpen(false);
    setIsNetworkAnalysisOpen(false);
    setIsTreemapPanelOpen(false);
    setIsTagDistPanelOpen(false);
    setIsRelDistPanelOpen(false);
    setIsSunburstPanelOpen(false);
    setIsCirclePackingPanelOpen(false);
    setIsConceptCloudOpen(false);
    setIsInfluenceCloudOpen(false);
    setIsTextAnalysisOpen(false);
    setIsFullTextAnalysisOpen(false);
  };

  return {
    isReportPanelOpen, setIsReportPanelOpen,
    isTablePanelOpen, setIsTablePanelOpen,
    isMatrixPanelOpen, setIsMatrixPanelOpen,
    isGridPanelOpen, setIsGridPanelOpen,
    isKanbanPanelOpen, setIsKanbanPanelOpen,
    isPresentationPanelOpen, setIsPresentationPanelOpen,
    isDocumentPanelOpen, setIsDocumentPanelOpen,
    isHistoryPanelOpen, setIsHistoryPanelOpen,
    isMarkdownPanelOpen, setIsMarkdownPanelOpen,
    isJSONPanelOpen, setIsJSONPanelOpen,
    isMermaidPanelOpen, setIsMermaidPanelOpen,
    isFilterPanelOpen, setIsFilterPanelOpen,
    isChatPanelOpen, setIsChatPanelOpen,
    
    isGuidancePanelOpen, setIsGuidancePanelOpen,
    guidanceContent, setGuidanceContent,
    
    isScriptPanelOpen, setIsScriptPanelOpen,
    
    isNetworkAnalysisOpen, setIsNetworkAnalysisOpen,

    isTreemapPanelOpen, setIsTreemapPanelOpen,
    isTagDistPanelOpen, setIsTagDistPanelOpen,
    isRelDistPanelOpen, setIsRelDistPanelOpen,
    isSunburstPanelOpen, setIsSunburstPanelOpen,
    isCirclePackingPanelOpen, setIsCirclePackingPanelOpen,
    sunburstState, setSunburstState,
    
    isConceptCloudOpen, setIsConceptCloudOpen,
    isInfluenceCloudOpen, setIsInfluenceCloudOpen,
    isTextAnalysisOpen, setIsTextAnalysisOpen,
    isFullTextAnalysisOpen, setIsFullTextAnalysisOpen,

    closeAllPanels
  };
};
