
import React, { useRef, useEffect } from 'react';

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
    onAddToKanban?: (ids: string[], coords: { x: number; y: number }) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
    x, y, onClose, onAddRelationship, onDeleteElement, onToggleHighlight, isHighlighted, onHideFromView,
    elementId, multiSelection, onAddToKanban
}) => {
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { 
            if(ref.current && !ref.current.contains(e.target as Node)) {
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
    
    const handleAddToKanban = (e: React.MouseEvent, ids: string[]) => {
        if (onAddToKanban) {
            onAddToKanban(ids, { x: e.clientX, y: e.clientY });
            onClose();
        }
    };

    return (
        <div ref={ref} className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 w-56" style={style}>
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
                    <button onClick={(e) => handleAddToKanban(e, elementId ? [elementId] : [])} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white">
                        Add this node to Kanban
                    </button>
                    {multiSelection && multiSelection.size > 1 && (
                         <button onClick={(e) => handleAddToKanban(e, Array.from(multiSelection))} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white">
                            Add {multiSelection.size} selected to Kanban
                        </button>
                    )}
                    <div className="border-t border-gray-700 my-1"></div>
                </>
            )}

            <button onClick={onDeleteElement} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-200">Delete Node</button>
        </div>
    );
}
