import React, { useRef, useEffect } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAddRelationship: () => void;
    onDeleteElement: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onAddRelationship, onDeleteElement }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Prevent going off screen
    const style = {
        top: Math.min(y, window.innerHeight - 100),
        left: Math.min(x, window.innerWidth - 150)
    };

    return (
        <div ref={ref} className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 w-48" style={style}>
            <button onClick={onAddRelationship} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white">Add Connection...</button>
            <div className="border-t border-gray-700 my-1"></div>
            <button onClick={onDeleteElement} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-200">Delete Node</button>
        </div>
    );
}