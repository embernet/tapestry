
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PanelLayout } from '../types';

export interface PanelDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

interface RightPanelContainerProps {
  panels: PanelDefinition[];
  layouts: Record<string, PanelLayout>;
  onLayoutChange: React.Dispatch<React.SetStateAction<Record<string, PanelLayout>>>;
  activeDockedId: string | null;
  onActiveDockedIdChange: React.Dispatch<React.SetStateAction<string | null>>;
  globalZIndex: number;
  onGlobalZIndexChange: React.Dispatch<React.SetStateAction<number>>;
  isDarkMode: boolean;
}

const RightPanelContainer: React.FC<RightPanelContainerProps> = ({
  panels,
  layouts,
  onLayoutChange,
  activeDockedId,
  onActiveDockedIdChange,
  globalZIndex,
  onGlobalZIndexChange,
  isDarkMode
}) => {
  // --- State ---
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize' | 'tab-detach';
    panelId: string;
    startX: number;
    startY: number;
    initialLayout?: PanelLayout;
    initialMouseX?: number; // For converting tab to floating at mouse pos
    initialMouseY?: number;
  } | null>(null);

  // --- Filtering ---
  const dockedPanels = useMemo(() =>
    panels.filter(p => p.isOpen && (!layouts[p.id] || !layouts[p.id].isFloating)),
    [panels, layouts]);

  const floatingPanels = useMemo(() =>
    panels.filter(p => p.isOpen && layouts[p.id]?.isFloating),
    [panels, layouts]);

  // --- Effects ---

  // Ensure active docked ID is valid
  useEffect(() => {
    if (dockedPanels.length === 0) {
      if (activeDockedId !== null) onActiveDockedIdChange(null);
    } else {
      // If current active is not in docked list, switch to the last one (most recently opened/valid)
      if (!activeDockedId || !dockedPanels.find(p => p.id === activeDockedId)) {
        onActiveDockedIdChange(dockedPanels[dockedPanels.length - 1].id);
      }
    }
  }, [dockedPanels.map(p => p.id).join(','), activeDockedId]);

  // Handle Global Mouse Events for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;
      e.preventDefault();

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.type === 'move' && dragState.initialLayout) {
        onLayoutChange(prev => ({
          ...prev,
          [dragState.panelId]: {
            ...prev[dragState.panelId],
            x: dragState.initialLayout!.x + dx,
            y: Math.max(0, dragState.initialLayout!.y + dy)
          }
        }));
      } else if (dragState.type === 'resize' && dragState.initialLayout) {
        onLayoutChange(prev => ({
          ...prev,
          [dragState.panelId]: {
            ...prev[dragState.panelId],
            w: Math.max(300, dragState.initialLayout!.w + dx),
            h: Math.max(200, dragState.initialLayout!.h + dy)
          }
        }));
      } else if (dragState.type === 'tab-detach') {
        // Threshold to detach
        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
          const panelId = dragState.panelId;
          const nextZ = globalZIndex + 1;
          onGlobalZIndexChange(nextZ);

          // Convert to floating layout at mouse position
          const width = 400;
          const height = 500;
          const x = e.clientX - width / 2;
          const y = e.clientY - 20;

          onLayoutChange(prev => ({
            ...prev,
            [panelId]: {
              x, y, w: width, h: height,
              zIndex: nextZ,
              isFloating: true
            }
          }));

          // Switch drag state to 'move' immediately for the new floating window
          setDragState({
            type: 'move',
            panelId,
            startX: e.clientX,
            startY: e.clientY,
            initialLayout: { x, y, w: width, h: height, zIndex: nextZ, isFloating: true }
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onLayoutChange, globalZIndex, onGlobalZIndexChange]);


  // --- Handlers ---

  const handleMouseDown = (e: React.MouseEvent, panelId: string, type: 'move' | 'resize' | 'tab-detach') => {
    // Stop propagation to prevent canvas drag
    e.stopPropagation();

    // Bring to front if floating
    if (type !== 'tab-detach') {
      const nextZ = globalZIndex + 1;
      onGlobalZIndexChange(nextZ);
      onLayoutChange(prev => ({
        ...prev,
        [panelId]: { ...prev[panelId], zIndex: nextZ }
      }));
    }

    setDragState({
      type,
      panelId,
      startX: e.clientX,
      startY: e.clientY,
      initialLayout: layouts[panelId] ? { ...layouts[panelId] } : undefined
    });
  };

  const handleCloseDock = (e: React.MouseEvent) => {
    e.stopPropagation();
    dockedPanels.forEach(p => p.onToggle());
  };

  const handleDockPanel = (panelId: string) => {
    onLayoutChange(prev => {
      const next = { ...prev };
      if (next[panelId]) {
        next[panelId] = { ...next[panelId], isFloating: false };
      }
      return next;
    });
    onActiveDockedIdChange(panelId);
  };

  // --- Styles ---
  const containerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200';
  const tabClass = (isActive: boolean) => isActive
    ? (isDarkMode ? 'bg-gray-800 text-blue-400 border-b-transparent' : 'bg-white text-blue-600 border-b-transparent')
    : (isDarkMode ? 'bg-gray-900 text-gray-500 hover:bg-gray-800 hover:text-gray-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-50');

  return (
    <>
      {/* --- DOCKED CONTAINER --- */}
      {dockedPanels.length > 0 && (
        <div className={`absolute top-4 right-4 bottom-4 w-[600px] z-30 flex flex-col border rounded-lg shadow-2xl overflow-hidden transition-all pointer-events-auto ${containerClass}`}>

          {/* Dock Toolbar */}
          <div className={`flex items-center justify-between h-8 px-3 border-b select-none ${headerClass}`}>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              Dock
            </div>
            <button
              onClick={handleCloseDock}
              className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-opacity-10 hover:bg-black"
              title="Close Dock (closes all docked tabs)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Bar */}
          <div className={`flex overflow-x-auto border-b w-full custom-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
            {dockedPanels.map(panel => (
              <div
                key={panel.id}
                className={`group relative flex items-center h-10 px-4 py-2 cursor-pointer select-none border-r min-w-[120px] max-w-[200px] flex-shrink-0 transition-colors border-b-2 ${isDarkMode ? 'border-r-gray-700' : 'border-r-gray-300'} ${tabClass(panel.id === activeDockedId)}`}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    onActiveDockedIdChange(panel.id);
                    handleMouseDown(e, panel.id, 'tab-detach');
                  }
                }}
                title="Click to activate, Drag to detach"
              >
                <span className={`mr-2 opacity-70 ${panel.id === activeDockedId ? 'text-blue-500' : ''}`}>{panel.icon}</span>
                <span className="text-xs font-bold truncate flex-grow">{panel.title}</span>

                {/* Close X (small) */}
                <button
                  onClick={(e) => { e.stopPropagation(); panel.onToggle(); }}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className={`flex-grow overflow-hidden relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {dockedPanels.map(panel => (
              <div
                key={panel.id}
                className={`absolute inset-0 flex flex-col ${panel.id === activeDockedId ? 'block' : 'hidden'}`}
              >
                {panel.content}
              </div>
            ))}
            {dockedPanels.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                No active panels
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FLOATING PANELS --- */}
      {floatingPanels.map(panel => {
        const layout = layouts[panel.id];
        if (!layout) return null;

        return (
          <div
            key={panel.id}
            className={`absolute flex flex-col rounded-lg shadow-2xl overflow-hidden border pointer-events-auto ${containerClass}`}
            style={{
              left: layout.x,
              top: layout.y,
              width: layout.w,
              height: layout.h,
              zIndex: layout.zIndex
            }}
            onMouseDown={() => {
              const nextZ = globalZIndex + 1;
              onGlobalZIndexChange(nextZ);
              onLayoutChange(prev => ({ ...prev, [panel.id]: { ...prev[panel.id], zIndex: nextZ } }));
            }}
          >
            {/* Floating Header */}
            <div
              className={`h-9 flex items-center justify-between px-3 cursor-move select-none border-b ${headerClass}`}
              onMouseDown={(e) => handleMouseDown(e, panel.id, 'move')}
              onDoubleClick={() => handleDockPanel(panel.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-gray-500">{panel.icon}</span>
                <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{panel.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDockPanel(panel.id)}
                  className="p-1 text-gray-400 hover:text-blue-500 rounded"
                  title="Dock Panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={panel.onToggle}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden relative">
              {panel.content}
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5"
              onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize')}
            >
              <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-500 opacity-50">
                <path d="M10 10 L10 0 L0 10 Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default RightPanelContainer;
