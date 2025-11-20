
import React, { useState, useEffect, ReactNode } from 'react';

interface RightPanelContainerProps {
  activeModelName: string;
  isReportOpen: boolean;
  isMarkdownOpen: boolean;
  isJSONOpen: boolean;
  isMatrixOpen: boolean;
  isTableOpen: boolean;
  onToggleReport: () => void;
  onToggleMarkdown: () => void;
  onToggleJSON: () => void;
  onToggleMatrix: () => void;
  onToggleTable: () => void;
  children: ReactNode;
}

type ViewType = 'report' | 'markdown' | 'json' | 'matrix' | 'table';

const RightPanelContainer: React.FC<RightPanelContainerProps> = ({
  activeModelName,
  isReportOpen,
  isMarkdownOpen,
  isJSONOpen,
  isMatrixOpen,
  isTableOpen,
  onToggleReport,
  onToggleMarkdown,
  onToggleJSON,
  onToggleMatrix,
  onToggleTable,
  children
}) => {
  const [activeView, setActiveView] = useState<ViewType | null>(null);

  // Automatically set active view when a panel is opened
  useEffect(() => {
    if (isReportOpen) setActiveView('report');
  }, [isReportOpen]);
  
  useEffect(() => {
    if (isMarkdownOpen) setActiveView('markdown');
  }, [isMarkdownOpen]);
  
  useEffect(() => {
    if (isJSONOpen) setActiveView('json');
  }, [isJSONOpen]);
  
  useEffect(() => {
    if (isMatrixOpen) setActiveView('matrix');
  }, [isMatrixOpen]);

  useEffect(() => {
    if (isTableOpen) setActiveView('table');
  }, [isTableOpen]);

  // If the active view is closed, switch to another open one or null
  useEffect(() => {
    if (activeView === 'report' && !isReportOpen) setActiveView(null);
    if (activeView === 'markdown' && !isMarkdownOpen) setActiveView(null);
    if (activeView === 'json' && !isJSONOpen) setActiveView(null);
    if (activeView === 'matrix' && !isMatrixOpen) setActiveView(null);
    if (activeView === 'table' && !isTableOpen) setActiveView(null);
  }, [isReportOpen, isMarkdownOpen, isJSONOpen, isMatrixOpen, isTableOpen, activeView]);

  // Determine if we should show the container at all
  const anyOpen = isReportOpen || isMarkdownOpen || isJSONOpen || isMatrixOpen || isTableOpen;
  if (!anyOpen) return null;

  // Map children to views based on the order they are rendered in App.tsx
  // Order assumed: Report, Markdown, JSON, Matrix, Table
  const childrenArray = React.Children.toArray(children);
  let childIndex = 0;
  const reportComponent = isReportOpen ? childrenArray[childIndex++] : null;
  const markdownComponent = isMarkdownOpen ? childrenArray[childIndex++] : null;
  const jsonComponent = isJSONOpen ? childrenArray[childIndex++] : null;
  const matrixComponent = isMatrixOpen ? childrenArray[childIndex++] : null;
  const tableComponent = isTableOpen ? childrenArray[childIndex++] : null;

  // If activeView is null but something is open, pick the first available
  let currentView = activeView;
  if (!currentView) {
      if (isReportOpen) currentView = 'report';
      else if (isMarkdownOpen) currentView = 'markdown';
      else if (isJSONOpen) currentView = 'json';
      else if (isMatrixOpen) currentView = 'matrix';
      else if (isTableOpen) currentView = 'table';
  }

  return (
    <div className="absolute top-20 right-4 bottom-4 w-[600px] z-30 flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Tab Bar */}
        <div className="flex items-center bg-gray-900 border-b border-gray-700 overflow-x-auto scrollbar-hide">
            {isReportOpen && (
                <button 
                    onClick={() => setActiveView('report')}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${currentView === 'report' ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    Report
                </button>
            )}
            {isTableOpen && (
                <button 
                    onClick={() => setActiveView('table')}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${currentView === 'table' ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    Table
                </button>
            )}
            {isMatrixOpen && (
                <button 
                    onClick={() => setActiveView('matrix')}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${currentView === 'matrix' ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    Matrix
                </button>
            )}
            {isMarkdownOpen && (
                <button 
                    onClick={() => setActiveView('markdown')}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${currentView === 'markdown' ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    Markdown
                </button>
            )}
            {isJSONOpen && (
                <button 
                    onClick={() => setActiveView('json')}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${currentView === 'json' ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    JSON
                </button>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden relative">
            {currentView === 'report' && <div className="absolute inset-0">{reportComponent}</div>}
            {currentView === 'table' && <div className="absolute inset-0">{tableComponent}</div>}
            {currentView === 'matrix' && <div className="absolute inset-0">{matrixComponent}</div>}
            {currentView === 'markdown' && <div className="absolute inset-0">{markdownComponent}</div>}
            {currentView === 'json' && <div className="absolute inset-0">{jsonComponent}</div>}
        </div>
    </div>
  );
};

export default RightPanelContainer;
