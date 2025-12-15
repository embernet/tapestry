
import React, { useRef, useEffect } from 'react';

interface CanvasContextMenuProps {
    x: number; y: number; onClose: () => void;
    onZoomToFit: () => void; onAutoLayout: () => void;
    onToggleReport: () => void; onToggleMarkdown: () => void; onToggleJSON: () => void;
    onToggleFilter: () => void; onToggleMatrix: () => void; onToggleTable: () => void; onToggleGrid: () => void;
    onOpenModel: () => void; onSaveModel: () => void; onCreateModel: () => void; onSaveAs: () => void;
    onSaveAsImage: () => void;
    isReportOpen: boolean; isMarkdownOpen: boolean; isJSONOpen: boolean; isFilterOpen: boolean; isMatrixOpen: boolean; isTableOpen: boolean; isGridOpen: boolean;
    isDarkMode: boolean;

    // New Props for Kanban
    multiSelection?: Set<string>;
    onAddToKanban?: (ids: string[], coords: { x: number; y: number }, boardId?: string) => void;
    allElementIds?: string[]; // All visible nodes
    kanbanBoards?: any[];
    activeKanbanBoardId?: string | null;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = (props) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) props.onClose(); }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') props.onClose();
        }

        // Use capture phase to catch clicks even if propagation is stopped
        document.addEventListener('mousedown', handleClick, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClick, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [props.onClose]);

    const style = {
        top: Math.min(props.y, window.innerHeight - 350), // Adjusted height
        left: Math.min(props.x, window.innerWidth - 200)
    };

    const bgClass = props.isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
    const textClass = props.isDarkMode ? 'text-gray-200' : 'text-gray-800';
    const hoverClass = props.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
    const dividerClass = props.isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const labelClass = props.isDarkMode ? 'text-gray-500' : 'text-gray-400';

    const handleKanbanAdd = (e: React.MouseEvent, ids: string[], boardId?: string) => {
        if (props.onAddToKanban) {
            props.onAddToKanban(ids, { x: e.clientX, y: e.clientY }, boardId);
            props.onClose();
        }
    };

    // Determine active board
    const activeBoard = props.kanbanBoards?.find(b => b.id === props.activeKanbanBoardId);

    return (
        <div ref={ref} className={`fixed border rounded shadow-xl z-50 py-1 w-56 ${bgClass}`} style={style}>
            <div className={`px-4 py-1 text-xs font-bold uppercase ${labelClass}`}>View</div>
            <button onClick={props.onZoomToFit} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Zoom to Fit</button>
            <button onClick={props.onAutoLayout} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Auto Layout</button>

            <div className={`border-t my-1 ${dividerClass}`}></div>
            <div className={`px-4 py-1 text-xs font-bold uppercase ${labelClass}`}>Export</div>
            <button onClick={props.onSaveAsImage} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Save as Image</button>

            {props.onAddToKanban && activeBoard && (
                <>
                    <div className={`border-t my-1 ${dividerClass}`}></div>
                    <div className={`px-4 py-1 text-xs font-bold uppercase ${labelClass}`}>Kanban: {activeBoard.name}</div>
                    {props.multiSelection && props.multiSelection.size > 0 && (
                        <button onClick={(e) => handleKanbanAdd(e, Array.from(props.multiSelection!), activeBoard.id)} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>
                            Add Selected to Board
                        </button>
                    )}
                    {props.allElementIds && props.allElementIds.length > 0 && (
                        <button onClick={(e) => handleKanbanAdd(e, props.allElementIds!, activeBoard.id)} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>
                            Add All to Board
                        </button>
                    )}
                </>
            )}

            <div className={`border-t my-1 ${dividerClass}`}></div>
            <div className={`px-4 py-1 text-xs font-bold uppercase ${labelClass}`}>Panels</div>

            <button onClick={props.onToggleReport} className={`flex justify-between w-full text-left px-4 py-1.5 text-sm ${textClass} ${hoverClass}`}>
                <span>Report</span> {props.isReportOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleTable} className={`flex justify-between w-full text-left px-4 py-1.5 text-sm ${textClass} ${hoverClass}`}>
                <span>Table</span> {props.isTableOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleMatrix} className={`flex justify-between w-full text-left px-4 py-1.5 text-sm ${textClass} ${hoverClass}`}>
                <span>Matrix</span> {props.isMatrixOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleGrid} className={`flex justify-between w-full text-left px-4 py-1.5 text-sm ${textClass} ${hoverClass}`}>
                <span>Grid</span> {props.isGridOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleMarkdown} className={`flex justify-between w-full text-left px-4 py-1.5 text-sm ${textClass} ${hoverClass}`}>
                <span>Markdown</span> {props.isMarkdownOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleJSON} className={`flex justify-between w-full text-left px-4 py-1.5 text-sm ${textClass} ${hoverClass}`}>
                <span>JSON</span> {props.isJSONOpen && <span className="text-blue-400">✓</span>}
            </button>

            <div className={`border-t my-1 ${dividerClass}`}></div>
            <div className={`px-4 py-1 text-xs font-bold uppercase ${labelClass}`}>File</div>
            <button onClick={props.onSaveModel} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Save to Disk</button>
            <button onClick={props.onSaveAs} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Save As...</button>
            <button onClick={props.onOpenModel} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Open Model...</button>
            <button onClick={props.onCreateModel} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>New Model...</button>
        </div>
    );
}
