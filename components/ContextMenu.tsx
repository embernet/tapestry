
import React, { useRef, useEffect, useState } from 'react';
import { KanbanBoard } from '../types';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAddRelationship: () => void;
    onDeleteElement: () => void;
    onToggleHighlight?: () => void;
    isHighlighted?: boolean;
    onHideFromView?: () => void;

    // New Props for Kanban
    elementId?: string; // Passed from parent if needed specifically
    multiSelection?: Set<string>;
    onAddToKanban?: (ids: string[], coords: { x: number; y: number }, boardId?: string) => void;
    onRemoveFromKanban?: (ids: string[], boardId?: string) => void;
    onMoveToBoard?: (ids: string[], targetBoardId: string) => void;
    onCreateBoardAndMove?: (ids: string[], newBoardName: string) => void;
    onCreateBoardAndAdd?: (ids: string[], newBoardName: string) => void;
    onMoveToColumn?: (ids: string[], column: string, boardId?: string) => void;
    kanbanBoards?: KanbanBoard[];
    activeKanbanBoardId?: string | null;
    belongingBoards?: KanbanBoard[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    x, y, onClose, onAddRelationship, onDeleteElement, onToggleHighlight, isHighlighted, onHideFromView,
    elementId, multiSelection, onAddToKanban, onRemoveFromKanban, onMoveToBoard, onCreateBoardAndMove, onCreateBoardAndAdd, onMoveToColumn, kanbanBoards, activeKanbanBoardId, belongingBoards
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [creatingBoardMode, setCreatingBoardMode] = useState<'move' | 'add' | null>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        }

        // Use capture phase to catch clicks even if propagation is stopped by D3 or other components
        document.addEventListener('mousedown', handleClick, true);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClick, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Prevent going off screen
    const style = {
        top: Math.min(y, window.innerHeight - 300), // Adjusted for extra items
        left: Math.min(x, window.innerWidth - 180)
    };

    const handleAddToKanban = (e: React.MouseEvent, ids: string[], boardId?: string) => {
        if (onAddToKanban) {
            onAddToKanban(ids, { x: e.clientX, y: e.clientY }, boardId);
            onClose();
        }
    };

    return (
        <div ref={ref} className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-[9999] py-1 w-56" style={style}>
            <button onClick={onAddRelationship} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white">Add Connection...</button>

            {onToggleHighlight && (
                <button onClick={onToggleHighlight} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-yellow-600 hover:text-white">
                    {isHighlighted ? "Unhighlight" : "Highlight"}
                </button>
            )}

            {onHideFromView && (
                <button onClick={onHideFromView} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white">
                    Hide from View
                </button>
            )}

            <div className="border-t border-gray-700 my-1"></div>

            {onAddToKanban && (
                <>
                    {/* Add Single Node */}
                    <div className="relative group/kanban">
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white flex justify-between items-center">
                            <span>Add to Kanban</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                        {/* Submenu */}
                        <div className="absolute left-full top-0 w-48 bg-gray-800 border border-gray-600 rounded shadow-xl hidden group-hover/kanban:block">
                            {kanbanBoards && kanbanBoards.length > 0 ? (
                                kanbanBoards.map(board => (
                                    <button
                                        key={board.id}
                                        onClick={(e) => handleAddToKanban(e, elementId ? [elementId] : [], board.id)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white truncate"
                                    >
                                        {board.name} {activeKanbanBoardId === board.id && "(Active)"}
                                    </button>
                                ))
                            ) : (
                                <button
                                    onClick={(e) => handleAddToKanban(e, elementId ? [elementId] : [])}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white"
                                >
                                    Default Board
                                </button>
                            )}

                            {/* Create New Board Option (For Add) */}
                            {onCreateBoardAndAdd && (
                                <>
                                    <div className="border-t border-gray-600 my-1"></div>
                                    {creatingBoardMode === 'add' ? (
                                        <div className="px-2 py-1">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-500 focus:outline-none focus:border-blue-500"
                                                placeholder="Board Name"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = (e.target as HTMLInputElement).value;
                                                        if (val && onCreateBoardAndAdd) {
                                                            onCreateBoardAndAdd(elementId ? [elementId] : [], val);
                                                            onClose();
                                                        }
                                                    } else if (e.key === 'Escape') {
                                                        setCreatingBoardMode(null);
                                                        e.stopPropagation();
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCreatingBoardMode('add');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-600 hover:text-white italic"
                                        >
                                            + Create New Board
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Remove from Board (if applicable) */}
                    {activeKanbanBoardId && belongingBoards?.some(b => b.id === activeKanbanBoardId) && onRemoveFromKanban && (
                        <button
                            onClick={() => {
                                if (onRemoveFromKanban && elementId) {
                                    onRemoveFromKanban([elementId], activeKanbanBoardId);
                                    onClose();
                                }
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-200"
                        >
                            Remove from Board
                        </button>
                    )}
                </>
            )}
            {/* Move to Column (only for active board if element is on it, for quick access) */}
            {activeKanbanBoardId && belongingBoards?.some(b => b.id === activeKanbanBoardId) && onMoveToColumn && (
                <div className="relative group/kanban-col mt-1">
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white flex justify-between items-center">
                        <span>Move to Column</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute left-full top-0 w-48 bg-gray-800 border border-gray-600 rounded shadow-xl hidden group-hover/kanban-col:block">
                        {kanbanBoards?.find(b => b.id === activeKanbanBoardId)?.columns.map(col => (
                            <button
                                key={col}
                                onClick={(e) => {
                                    if (onMoveToColumn) {
                                        onMoveToColumn(elementId ? [elementId] : [], col, activeKanbanBoardId);
                                        onClose();
                                    }
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white truncate"
                            >
                                {col}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Move to Board (if on a board and multiple boards exist) */}
            {belongingBoards && belongingBoards.length > 0 && onMoveToBoard && onCreateBoardAndMove && (
                <div className="relative group/kanban-move mt-1">
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white flex justify-between items-center">
                        <span>Move to Board</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute left-full top-0 w-48 bg-gray-800 border border-gray-600 rounded shadow-xl hidden group-hover/kanban-move:block">
                        {kanbanBoards?.filter(b => !belongingBoards?.some(bb => bb.id === b.id)).map(board => (
                            <button
                                key={board.id}
                                onClick={(e) => {
                                    if (onMoveToBoard) {
                                        onMoveToBoard(elementId ? [elementId] : [], board.id);
                                        onClose();
                                    }
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white truncate"
                            >
                                {board.name}
                            </button>
                        ))}
                        {/* Create New Board Option */}
                        <div className="border-t border-gray-600 my-1"></div>
                        {creatingBoardMode === 'move' ? (
                            <div className="px-2 py-1">
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-2 py-1 text-sm rounded bg-gray-700 text-white border border-gray-500 focus:outline-none focus:border-blue-500"
                                    placeholder="Board Name"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value;
                                            if (val && onCreateBoardAndMove) {
                                                onCreateBoardAndMove(elementId ? [elementId] : [], val);
                                                onClose();
                                            }
                                        } else if (e.key === 'Escape') {
                                            setCreatingBoardMode(null);
                                            e.stopPropagation(); // Prevent shutting down whole menu
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()} // Prevent menu closing
                                />
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCreatingBoardMode('move');
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-green-600 hover:text-white italic"
                            >
                                + Create New Board
                            </button>
                        )}
                    </div>
                </div>
            )}

            {multiSelection && multiSelection.size > 1 && (
                <button onClick={(e) => handleAddToKanban(e, Array.from(multiSelection), activeKanbanBoardId || undefined)} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white">
                    Add {multiSelection.size} selected to Active Board
                </button>
            )}

            <div className="border-t border-gray-700 my-1"></div>

            <button onClick={onDeleteElement} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-200">Delete Node</button>
        </div >
    );
};
