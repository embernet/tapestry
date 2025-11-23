
import React, { useRef, ReactNode, useEffect } from 'react';
import { PanelLayout } from '../types';

export interface PanelDefinition {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

interface RightPanelContainerProps {
  panels: PanelDefinition[];
  layouts: Record<string, PanelLayout>;
  onLayoutChange: (newLayouts: Record<string, PanelLayout>) => void;
  activeDockedId: string | null;
  onActiveDockedIdChange: (id: string | null) => void;
  globalZIndex: number;
  onGlobalZIndexChange: (zIndex: number) => void;
}

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 500;

const RightPanelContainer: React.FC<RightPanelContainerProps> = ({ 
  panels, 
  layouts, 
  onLayoutChange, 
  activeDockedId, 
  onActiveDockedIdChange,
  globalZIndex,
  onGlobalZIndexChange
}) => {
  // Refs for drag/resize operations to avoid closure staleness
  const dragRef = useRef<{
    type: 'move' | 'resize' | 'tab-detach';
    panelId: string;
    startX: number;
    startY: number;
    initialLayout: PanelLayout;
    hasDetached?: boolean;
  } | null>(null);

  // Keep a ref of layouts updated so event listeners can access latest state without re-binding
  const layoutsRef = useRef(layouts);
  useEffect(() => {
      layoutsRef.current = layouts;
  }, [layouts]);

  // --- Synchronization ---

  // Ensure we have an active docked tab if any docked panels are open
  useEffect(() => {
    const openDockedPanels = panels.filter(p => p.isOpen && !layouts[p.id]?.isFloating);
    
    // If the currently active docked ID is not open or no longer docked, switch to the last opened one
    if (openDockedPanels.length > 0) {
        const isActiveValid = openDockedPanels.some(p => p.id === activeDockedId);
        if (!activeDockedId || !isActiveValid) {
            onActiveDockedIdChange(openDockedPanels[openDockedPanels.length - 1].id);
        }
    } else {
        if (activeDockedId !== null) {
            onActiveDockedIdChange(null);
        }
    }
  }, [panels, layouts, activeDockedId, onActiveDockedIdChange]);

  // --- Handlers ---

  const bringToFront = (panelId: string) => {
    const next = globalZIndex + 1;
    onGlobalZIndexChange(next);
    onLayoutChange({
        ...layouts,
        [panelId]: { ...layouts[panelId], zIndex: next }
    });
    return next;
  };

  const handleDock = (panelId: string) => {
    onLayoutChange({
      ...layouts,
      [panelId]: { ...layouts[panelId], isFloating: false }
    });
    onActiveDockedIdChange(panelId);
  };

  const handleFloat = (panelId: string, x: number, y: number) => {
    const nextZ = globalZIndex + 1;
    onGlobalZIndexChange(nextZ);
    
    const newLayout = {
        x,
        y,
        w: layouts[panelId]?.w || DEFAULT_WIDTH,
        h: layouts[panelId]?.h || DEFAULT_HEIGHT,
        zIndex: nextZ,
        isFloating: true
    };

    onLayoutChange({
        ...layouts,
        [panelId]: newLayout
    });
    
    return newLayout;
  };

  // --- Drag & Resize Logic ---

  const handleMouseDown = (e: React.MouseEvent, panelId: string, type: 'move' | 'resize' | 'tab-detach') => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling

    if (type !== 'tab-detach') {
        bringToFront(panelId);
    } else {
        // Activate tab on press (bring to front in dock)
        onActiveDockedIdChange(panelId);
    }

    const currentLayout = layouts[panelId] || { x: 100, y: 100, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT, zIndex: globalZIndex, isFloating: false };

    dragRef.current = {
      type,
      panelId,
      startX: e.clientX,
      startY: e.clientY,
      initialLayout: currentLayout,
      hasDetached: false
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const { type, panelId, startX, startY, hasDetached } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Handle Tab Detach Threshold
    if (type === 'tab-detach' && !hasDetached) {
        // Threshold check (10px)
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            // Calculate float position (centered on mouse)
            const newW = DEFAULT_WIDTH;
            const newH = DEFAULT_HEIGHT;
            const newX = e.clientX - (newW / 2);
            const newY = e.clientY - 20; // offset for header

            // Trigger Float
            const floatLayout = handleFloat(panelId, newX, newY);

            // Manually update ref to avoid race conditions before re-render
            layoutsRef.current[panelId] = floatLayout;

            // Transition drag mode
            dragRef.current.hasDetached = true;
            dragRef.current.type = 'move';
            dragRef.current.initialLayout = floatLayout;
            // Reset start points for smoother drag continuation
            dragRef.current.startX = e.clientX;
            dragRef.current.startY = e.clientY;
        }
        return;
    }

    // Standard Move/Resize
    const initialLayout = dragRef.current.initialLayout;
    const nextLayout = { ...initialLayout };

    if (dragRef.current.type === 'move') {
        // For move, we use the reset startX/Y if we just detached, or original if standard move
        nextLayout.x = initialLayout.x + (e.clientX - dragRef.current.startX);
        nextLayout.y = initialLayout.y + (e.clientY - dragRef.current.startY);
    } else if (dragRef.current.type === 'resize') {
        nextLayout.w = Math.max(300, initialLayout.w + dx);
        nextLayout.h = Math.max(200, initialLayout.h + dy);
    }

    layoutsRef.current[panelId] = nextLayout; 
    onLayoutChange({ ...layoutsRef.current });
  };

  const onMouseUp = () => {
    dragRef.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // --- Categorize Panels ---
  
  const openPanels = panels.filter(p => p.isOpen);
  const floatingPanels = openPanels.filter(p => layouts[p.id]?.isFloating);
  const dockedPanels = openPanels.filter(p => !layouts[p.id]?.isFloating);

  const handleCloseDock = () => {
    // Only close docked panels, leave floating ones alone
    dockedPanels.forEach(panel => {
        if (panel.isOpen) {
            panel.onToggle();
        }
    });
  };

  return (
    <>
      {/* --- DOCKED CONTAINER --- */}
      {dockedPanels.length > 0 && (
        <div className="absolute top-20 right-4 bottom-4 w-[600px] z-30 flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden transition-all">
          
          {/* Dock Toolbar */}
          <div className="flex items-center justify-between h-8 px-3 bg-gray-900 border-b border-gray-700 select-none">
             <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
                Dock
             </div>
             <button 
                onClick={handleCloseDock}
                className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-gray-800"
                title="Close Dock (closes all docked tabs)"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto scrollbar-hide h-10">
            {dockedPanels.map(panel => (
              <div
                key={panel.id}
                className={`group relative flex items-center h-full px-4 py-2 cursor-pointer select-none border-r border-gray-700 min-w-[100px] transition-colors ${
                  panel.id === activeDockedId 
                    ? 'bg-gray-800 text-blue-400 border-t-2 border-t-blue-400' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200 bg-gray-900/50'
                }`}
                onMouseDown={(e) => handleMouseDown(e, panel.id, 'tab-detach')}
                title="Click to activate, Drag to detach"
              >
                <span className="mr-2 opacity-70">{panel.icon}</span>
                <span className="text-sm font-semibold whitespace-nowrap">{panel.title}</span>
                
                {/* Close X (small) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); panel.onToggle(); }}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-0.5 rounded"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-grow overflow-hidden relative bg-gray-800">
            {dockedPanels.map(panel => (
                <div 
                    key={panel.id} 
                    className={`absolute inset-0 ${panel.id === activeDockedId ? 'block' : 'hidden'}`}
                >
                    {panel.content}
                </div>
            ))}
          </div>
        </div>
      )}

      {/* --- FLOATING WINDOWS --- */}
      {floatingPanels.map(panel => {
        const layout = layouts[panel.id];
        if (!layout) return null;

        return (
          <div
            key={panel.id}
            className="fixed flex flex-col bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden"
            style={{
              left: layout.x,
              top: layout.y,
              width: layout.w,
              height: layout.h,
              zIndex: layout.zIndex
            }}
            onMouseDown={() => bringToFront(panel.id)}
          >
            {/* Floating Header */}
            <div
              className="flex items-center justify-between h-8 px-2 bg-gray-900 border-b border-gray-700 cursor-move select-none"
              onMouseDown={(e) => handleMouseDown(e, panel.id, 'move')}
            >
              <div className="flex items-center space-x-2 text-gray-300">
                <span className="scale-75 opacity-70">{panel.icon}</span>
                <span className="text-xs font-bold">{panel.title}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Pin/Dock Button */}
                <button
                  onClick={() => handleDock(panel.id)}
                  title="Unpin (Dock back to tabs)"
                  className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
                {/* Close Button */}
                <button
                  onClick={panel.onToggle}
                  title="Close"
                  className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden relative bg-gray-800">
                {panel.content}
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5"
              onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize')}
            >
                <svg viewBox="0 0 10 10" className="w-2 h-2 text-gray-500 opacity-50">
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
