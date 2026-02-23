
import React, { useRef, useState, useEffect } from 'react';
import { Element, Relationship, ColorScheme } from '../types';

interface SketchPanelProps {
    elements: Element[];
    relationships: Relationship[];
    onClose: () => void;
    isDarkMode: boolean;
    colorSchemes: ColorScheme[];
    activeSchemeId: string | null;
}

export const SketchPanel: React.FC<SketchPanelProps> = ({ 
    elements, 
    relationships, 
    onClose, 
    isDarkMode,
    colorSchemes,
    activeSchemeId
}) => {
    // -- Window State --
    const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
    const [windowPos, setWindowPos] = useState({ x: 50, y: 50 });
    const [isMovingWindow, setIsMovingWindow] = useState(false);
    const [isResizingWindow, setIsResizingWindow] = useState(false);
    
    // Refs for window manipulation
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialDimRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

    // -- Canvas State --
    const containerRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanningCanvas, setIsPanningCanvas] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    // Initialize Window Size (80% of screen) and Center it
    useEffect(() => {
        const w = window.innerWidth * 0.8;
        const h = window.innerHeight * 0.8;
        setWindowSize({ width: w, height: h });
        setWindowPos({ 
            x: (window.innerWidth - w) / 2, 
            y: (window.innerHeight - h) / 2 
        });
    }, []);

    // Auto-fit content within the new window dimensions
    useEffect(() => {
        if (elements.length > 0) {
             const minX = Math.min(...elements.map(e => e.x || 0));
             const maxX = Math.max(...elements.map(e => e.x || 0));
             const minY = Math.min(...elements.map(e => e.y || 0));
             const maxY = Math.max(...elements.map(e => e.y || 0));
             
             const contentW = maxX - minX + 400;
             const contentH = maxY - minY + 400;
             
             // Fit into the 80% window size
             const scale = Math.min(windowSize.width / contentW, windowSize.height / contentH, 1);
             setZoom(scale);
             setPan({ 
                 x: windowSize.width / 2 - ((minX + maxX)/2) * scale, 
                 y: windowSize.height / 2 - ((minY + maxY)/2) * scale 
             });
        }
    }, [elements]);

    // --- Window Interaction Handlers ---

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        setIsMovingWindow(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialDimRef.current = { ...windowSize, ...windowPos };
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizingWindow(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialDimRef.current = { ...windowSize, ...windowPos };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isMovingWindow) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setWindowPos({
                    x: initialDimRef.current.x + dx,
                    y: initialDimRef.current.y + dy
                });
            }
            if (isResizingWindow) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setWindowSize({
                    width: Math.max(400, initialDimRef.current.width + dx),
                    height: Math.max(300, initialDimRef.current.height + dy)
                });
            }
        };

        const handleMouseUp = () => {
            setIsMovingWindow(false);
            setIsResizingWindow(false);
        };

        if (isMovingWindow || isResizingWindow) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMovingWindow, isResizingWindow]);

    // --- Canvas Interaction Handlers ---

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.min(Math.max(0.1, z * delta), 5));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsPanningCanvas(true);
            panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isPanningCanvas) {
            setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
        }
    };

    const handleCanvasMouseUp = () => setIsPanningCanvas(false);

    // --- Styling Constants ---
    const strokeColor = isDarkMode ? '#e5e7eb' : '#1f2937'; // gray-200 : gray-800
    const textHex = isDarkMode ? '#f3f4f6' : '#111827';
    const strokeWidth = 5; // Thicker brush for marker style
    const secondaryStrokeWidth = 2;

    // Node Dimensions
    const nodeW = 180;
    const nodeH = 90;
    const radiusX = nodeW / 2;
    const radiusY = nodeH / 2;

    // Window Theme
    const winBg = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const headerBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    const shadowClass = 'shadow-2xl';

    // Resolve Node Color
    const getNodeFill = (el: Element) => {
        const scheme = colorSchemes.find(s => s.id === activeSchemeId);
        if (scheme) {
            for (const tag of el.tags) {
                // Case insensitive lookup for tag color
                const key = Object.keys(scheme.tagColors).find(k => k.toLowerCase() === tag.toLowerCase());
                if (key) return scheme.tagColors[key];
            }
        }
        // Default fill
        return isDarkMode ? '#1f2937' : '#ffffff';
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <div 
                className={`absolute flex flex-col rounded-lg border ${winBg} ${shadowClass} pointer-events-auto overflow-hidden`}
                style={{ 
                    width: windowSize.width, 
                    height: windowSize.height,
                    left: windowPos.x,
                    top: windowPos.y
                }}
            >
                {/* Header */}
                <div 
                    className={`p-4 border-b flex justify-between items-center flex-shrink-0 cursor-move select-none ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${headerBg}`}
                    onMouseDown={handleHeaderMouseDown}
                >
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} font-['Patrick_Hand'] tracking-wider flex items-center gap-2`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Sketch View
                    </h2>
                    <div className="flex items-center gap-4" onMouseDown={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded p-1">
                            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200">-</button>
                            <span className="text-xs w-10 text-center font-mono text-gray-700 dark:text-gray-200">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200">+</button>
                        </div>
                        <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div 
                    ref={containerRef}
                    className="flex-grow overflow-hidden cursor-grab active:cursor-grabbing relative bg-white/5"
                    onWheel={handleWheel}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                >
                    <svg width="100%" height="100%" className="block">
                        <defs>
                            {/* Smooth Marker for arrows */}
                            <marker id="sketch-arrow" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} fillOpacity="0.8" />
                            </marker>
                            
                            {/* Simple Blur Filter for Marker Effect - Eliminates Jaggedness */}
                            <filter id="sketch-marker">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                            </filter>
                        </defs>

                        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                            {/* Links */}
                            {relationships.map(rel => {
                                const source = elements.find(e => e.id === rel.source);
                                const target = elements.find(e => e.id === rel.target);
                                if (!source || !target) return null;

                                const sx = source.x || 0;
                                const sy = source.y || 0;
                                const tx = target.x || 0;
                                const ty = target.y || 0;

                                // Calculate intersection with ellipse
                                const angle = Math.atan2(ty - sy, tx - sx);
                                
                                // Start point on Source Oval perimeter
                                const x1 = sx + Math.cos(angle) * radiusX;
                                const y1 = sy + Math.sin(angle) * radiusY;
                                
                                // End point on Target Oval perimeter
                                const x2 = tx - Math.cos(angle) * radiusX;
                                const y2 = ty - Math.sin(angle) * radiusY;

                                // Midpoint for label
                                const mx = (x1 + x2) / 2;
                                const my = (y1 + y2) / 2;

                                // Add a slight curve to lines for hand-drawn feel
                                const cpX = (x1 + x2) / 2 + (Math.random() * 10 - 5);
                                const cpY = (y1 + y2) / 2 + (Math.random() * 10 - 5);

                                return (
                                    <g key={rel.id} className="sketch-link">
                                        {/* Main Stroke - Blurred Marker Style */}
                                        <path 
                                            d={`M${x1},${y1} Q${cpX},${cpY} ${x2},${y2}`} 
                                            stroke={strokeColor} 
                                            strokeWidth={strokeWidth} 
                                            strokeOpacity={0.6}
                                            strokeLinecap="round"
                                            fill="none"
                                            filter="url(#sketch-marker)"
                                            markerEnd="url(#sketch-arrow)"
                                        />
                                        {/* Second Stroke - Thinner Core for Definition */}
                                        <path 
                                            d={`M${x1},${y1} Q${cpX},${cpY} ${x2},${y2}`} 
                                            stroke={strokeColor} 
                                            strokeWidth={1} 
                                            strokeOpacity={0.8}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        {rel.label && (
                                            <text 
                                                x={mx} 
                                                y={my - 10} 
                                                textAnchor="middle" 
                                                fill={textHex} 
                                                className="font-['Patrick_Hand'] text-lg"
                                                style={{ textShadow: isDarkMode ? '0 0 4px #000' : '0 0 4px #fff' }}
                                            >
                                                {rel.label}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Nodes - Drawn as Ovals */}
                            {elements.map(el => {
                                const fillColor = getNodeFill(el);
                                
                                return (
                                    <g key={el.id} transform={`translate(${el.x || 0},${el.y || 0})`}>
                                        {/* Background fill */}
                                        <ellipse 
                                            cx={0} cy={0} rx={radiusX} ry={radiusY}
                                            fill={fillColor} 
                                            stroke="none"
                                            filter="url(#sketch-marker)"
                                        />

                                        {/* Outline Pass 1 - Thick Blur Marker */}
                                        <ellipse 
                                            cx={0} cy={0} rx={radiusX} ry={radiusY}
                                            fill="none" 
                                            stroke={strokeColor} 
                                            strokeWidth={strokeWidth} 
                                            strokeOpacity={0.6}
                                            filter="url(#sketch-marker)" 
                                        />

                                        {/* Outline Pass 2 - Thinner/Darker Core */}
                                        <ellipse 
                                            cx={0} cy={0} rx={radiusX} ry={radiusY}
                                            fill="none" 
                                            stroke={strokeColor} 
                                            strokeWidth={secondaryStrokeWidth} 
                                            strokeOpacity={0.9}
                                        />
                                        
                                        <foreignObject x={-radiusX + 10} y={-radiusY + 10} width={nodeW - 20} height={nodeH - 20}>
                                            <div 
                                                className="w-full h-full flex items-center justify-center text-center font-['Patrick_Hand'] text-xl leading-tight select-none p-2"
                                                style={{ color: textHex }}
                                            >
                                                {el.name}
                                            </div>
                                        </foreignObject>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>

                {/* Resize Handle */}
                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-50"
                    onMouseDown={handleResizeMouseDown}
                >
                    <svg viewBox="0 0 10 10" className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <path d="M10 10 L10 2 L2 10 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
