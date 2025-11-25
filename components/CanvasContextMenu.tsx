import React, { useRef, useEffect } from 'react';

interface CanvasContextMenuProps { 
    x: number; y: number; onClose: () => void;
    onZoomToFit: () => void; onAutoLayout: () => void;
    onToggleReport: () => void; onToggleMarkdown: () => void; onToggleJSON: () => void; 
    onToggleFilter: () => void; onToggleMatrix: () => void; onToggleTable: () => void; onToggleGrid: () => void;
    onOpenModel: () => void; onSaveModel: () => void; onCreateModel: () => void; onSaveAs: () => void;
    isReportOpen: boolean; isMarkdownOpen: boolean; isJSONOpen: boolean; isFilterOpen: boolean; isMatrixOpen: boolean; isTableOpen: boolean; isGridOpen: boolean;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = (props) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) props.onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [props]);

    const style = {
        top: Math.min(props.y, window.innerHeight - 300),
        left: Math.min(props.x, window.innerWidth - 200)
    };

    return (
        <div ref={ref} className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 w-56" style={style}>
            <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase">View</div>
            <button onClick={props.onZoomToFit} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Zoom to Fit</button>
            <button onClick={props.onAutoLayout} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Auto Layout</button>
            
            <div className="border-t border-gray-700 my-1"></div>
            <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase">Panels</div>
            
            <button onClick={props.onToggleReport} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Report</span> {props.isReportOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleTable} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Table</span> {props.isTableOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleMatrix} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Matrix</span> {props.isMatrixOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleGrid} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Grid</span> {props.isGridOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleMarkdown} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Markdown</span> {props.isMarkdownOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleJSON} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>JSON</span> {props.isJSONOpen && <span className="text-blue-400">✓</span>}
            </button>

             <div className="border-t border-gray-700 my-1"></div>
            <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase">File</div>
            <button onClick={props.onSaveModel} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Save to Disk</button>
            <button onClick={props.onSaveAs} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Save As...</button>
            <button onClick={props.onOpenModel} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Open Model...</button>
             <button onClick={props.onCreateModel} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">New Model...</button>
        </div>
    );
}