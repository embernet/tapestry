import React, { useState, useEffect, useRef } from 'react';
import { NodeShape } from '../types';
import { AutoLayoutIcon } from '../icons/AutoLayoutIcon';
import { usePanelDrag } from '../hooks/usePanelDrag';

interface LayoutToolbarProps {
    linkDistance: number;
    repulsion: number;
    onLinkDistanceChange: (val: number) => void;
    onRepulsionChange: (val: number) => void;
    onJiggle: () => void;
    onZoomToFit: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    isPhysicsActive: boolean;
    onStartAutoLayout: () => void;
    onAcceptAutoLayout: () => void;
    onRejectAutoLayout: () => void;
    onStaticLayout: () => void;
    onExpand: () => void;
    onContract: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
    isDarkMode: boolean;
    nodeShape: NodeShape;
    onNodeShapeChange: (shape: NodeShape) => void;
}

// Icons
const ForceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /> {/* Lightning bolt style or graph? Let's use graph style from Visualise if possible or generic network */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
); // Using generic image icon as placeholder or I should define specific ones.
const PhysicsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

const ShapeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SpacingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
);


const ForceDirectedPanel: React.FC<LayoutToolbarProps & { onClose: () => void }> = ({
    linkDistance,
    repulsion,
    onLinkDistanceChange,
    onRepulsionChange,
    onJiggle,
    onZoomToFit,
    onZoomIn,
    onZoomOut,
    isPhysicsActive,
    onStartAutoLayout,
    onAcceptAutoLayout,
    onRejectAutoLayout,
    onClose,
    isDarkMode
}) => {
    const { position, handleMouseDown } = usePanelDrag({
        initialPosition: { x: window.innerWidth / 2 - 150, y: 100 }
    });

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const headerClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
    const iconColor = isDarkMode ? 'text-orange-400' : 'text-orange-500';

    return (
        <div
            className={`fixed z-[1000] rounded-lg shadow-xl border w-72 flex flex-col overflow-hidden pointer-events-auto ${bgClass}`}
            style={{ left: position.x, top: position.y }}
        >
            <div
                className={`p-2 border-b flex justify-between items-center cursor-move text-xs font-bold uppercase tracking-wider ${headerClass} ${textClass}`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <div className={iconColor}><PhysicsIcon /></div>
                    <span>Force Directed Layout</span>
                </div>
                <button onClick={onClose} className="hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-3 flex flex-col gap-3">
                {/* Simulation Controls */}
                <div className="flex justify-between items-center">
                    <span className={`text-xs ${textClass}`}>Simulation</span>
                    {!isPhysicsActive ? (
                        <button
                            onClick={onStartAutoLayout}
                            className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-1 ${isDarkMode ? 'bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}
                        >
                            <AutoLayoutIcon className="w-3 h-3" /> Start
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <button onClick={onAcceptAutoLayout} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-xs font-bold">Save</button>
                            <button onClick={onRejectAutoLayout} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-xs font-bold">Stop</button>
                        </div>
                    )}
                </div>

                {/* Sliders */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                        <span>Spread</span>
                        <span>{linkDistance}</span>
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={linkDistance}
                        onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
                        className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                        <span>Repel</span>
                        <span>{Math.abs(repulsion)}</span>
                    </div>
                    <input
                        type="range"
                        min="100"
                        max="2000"
                        step="50"
                        value={Math.abs(repulsion)}
                        onChange={(e) => onRepulsionChange(-Number(e.target.value))}
                        className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-700/10">
                    <button onClick={onJiggle} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Shake">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[9px] font-bold">SHAKE</span>
                    </button>
                    <button onClick={onZoomToFit} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Fit">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
                        <span className="text-[9px] font-bold">FIT</span>
                    </button>
                    <button onClick={onZoomOut} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Zoom Out">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        <span className="text-[9px] font-bold">OUT</span>
                    </button>
                    <button onClick={onZoomIn} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Zoom In">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-[9px] font-bold">IN</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SpacingControlPanel: React.FC<LayoutToolbarProps & { onClose: () => void }> = ({
    onStaticLayout,
    onExpand,
    onContract,
    onZoomToFit,
    onZoomIn,
    onZoomOut,
    onClose,
    isPhysicsActive,
    isDarkMode
}) => {
    // Offset initial position slightly
    const { position, handleMouseDown } = usePanelDrag({
        initialPosition: { x: window.innerWidth / 2 + 100, y: 150 }
    });

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const headerClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
    const iconColor = isDarkMode ? 'text-orange-400' : 'text-orange-500';

    return (
        <div
            className={`fixed z-[1000] rounded-lg shadow-xl border w-64 flex flex-col overflow-hidden pointer-events-auto ${bgClass}`}
            style={{ left: position.x, top: position.y }}
        >
            <div
                className={`p-2 border-b flex justify-between items-center cursor-move text-xs font-bold uppercase tracking-wider ${headerClass} ${textClass}`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <div className={iconColor}><SpacingIcon /></div>
                    <span>Spacing Controls</span>
                </div>
                <button onClick={onClose} className="hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-3 flex flex-col gap-3">

                {/* Static Layout */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-700/10">
                    <span className={`text-xs ${textClass}`}>Auto-Arrange</span>
                    <button
                        onClick={onStaticLayout}
                        disabled={isPhysicsActive}
                        className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-1 disabled:opacity-50 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <AutoLayoutIcon className="w-3 h-3" /> Layout
                    </button>
                </div>

                {/* Spacing */}
                <div className="flex justify-between items-center">
                    <span className={`text-xs ${textClass}`}>Spacing</span>
                    <div className="flex gap-1">
                        <button onClick={onContract} disabled={isPhysicsActive} className={`p-1.5 rounded border disabled:opacity-50 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`} title="Contract">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h-6m3-3l3 3l-3 3M15 12h6m-3-3l-3 3l3 3" /></svg>
                        </button>
                        <button onClick={onExpand} disabled={isPhysicsActive} className={`p-1.5 rounded border disabled:opacity-50 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`} title="Expand">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h-3m0 0l3-3m-3 3l3 3M18 12h3m0 0l-3-3m3 3l-3 3" /></svg>
                        </button>
                    </div>
                </div>

                {/* View Controls */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700/10">
                    <button onClick={onZoomToFit} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Fit">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
                        <span className="text-[9px] font-bold">FIT</span>
                    </button>
                    <button onClick={onZoomOut} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Zoom Out">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        <span className="text-[9px] font-bold">OUT</span>
                    </button>
                    <button onClick={onZoomIn} className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-500/10 ${textClass}`} title="Zoom In">
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-[9px] font-bold">IN</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const NodeShapePanel: React.FC<LayoutToolbarProps & { onClose: () => void }> = ({
    nodeShape,
    onNodeShapeChange,
    onClose,
    isDarkMode
}) => {
    const { position, handleMouseDown } = usePanelDrag({
        initialPosition: { x: window.innerWidth / 2 + 300, y: 150 }
    });

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const headerClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
    const iconColor = isDarkMode ? 'text-orange-400' : 'text-orange-500';
    const itemHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

    const SHAPES: { value: NodeShape, label: string, icon: React.ReactNode }[] = [
        {
            value: 'rectangle',
            label: 'Rectangle',
            icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="6" width="18" height="12" rx="2" /></svg>
        },
        {
            value: 'oval',
            label: 'Oval',
            icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="12" rx="9" ry="6" /></svg>
        },
        {
            value: 'circle',
            label: 'Circle',
            icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="8" /></svg>
        },
        {
            value: 'point',
            label: 'Point',
            icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="3" /></svg>
        },
        {
            value: 'diamond',
            label: 'Diamond',
            icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3l9 9-9 9-9-9 9-9z" /></svg>
        }
    ];

    return (
        <div
            className={`fixed z-[1000] rounded-lg shadow-xl border w-48 flex flex-col overflow-hidden pointer-events-auto ${bgClass}`}
            style={{ left: position.x, top: position.y }}
        >
            <div
                className={`p-2 border-b flex justify-between items-center cursor-move text-xs font-bold uppercase tracking-wider ${headerClass} ${textClass}`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <div className={iconColor}><ShapeIcon /></div>
                    <span>Node Shape</span>
                </div>
                <button onClick={onClose} className="hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-1 flex flex-col">
                {SHAPES.map(shape => (
                    <button
                        key={shape.value}
                        onClick={() => onNodeShapeChange(shape.value)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 transition-colors rounded mx-1 my-0.5 w-[calc(100%-8px)] ${textClass} ${itemHover} ${nodeShape === shape.value ? (isDarkMode ? 'bg-blue-900/30 text-blue-400 font-bold' : 'bg-blue-50 text-blue-600 font-bold') : ''}`}
                    >
                        {shape.icon}
                        <span>{shape.label}</span>
                        {nodeShape === shape.value && <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </button>
                ))}
            </div>
        </div>
    );
};


const LayoutToolbar: React.FC<LayoutToolbarProps> = (props) => {
    const { isCollapsed, onToggle, isDarkMode } = props;
    const [isForceOpen, setIsForceOpen] = useState(false);
    const [isSpacingOpen, setIsSpacingOpen] = useState(false);
    const [isShapeOpen, setIsShapeOpen] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);

    const bgClass = isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200';
    const buttonBgClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-orange-400' : 'bg-white hover:bg-gray-50 border-gray-200 text-orange-600';
    const dropdownBg = isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-800';
    const itemHover = isDarkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-100'; // Added border-transparent default for item hover in Visualise is border-b.
    const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
    const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

    return (
        <div className="relative pointer-events-auto">
            {/* Toggle Button */}
            <button
                ref={buttonRef}
                onClick={onToggle}
                className={`border rounded-lg w-20 flex flex-col items-center justify-center transition-colors h-20 gap-1 shadow-lg ${buttonBgClass} ${!isCollapsed ? 'ring-2 ring-orange-400' : ''}`}
                title="Layout Tools"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className={`text-xs font-bold tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>LAYOUT</span>
            </button>

            {/* Dropdown Menu */}
            {!isCollapsed && (
                <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-xl z-[990] animate-fade-in-down overflow-hidden ${dropdownBg}`}>

                    {/* Item 1: Force Directed */}
                    <button
                        onClick={() => {
                            setIsForceOpen(true);
                            onToggle(); // Close dropdown
                        }}
                        className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover} w-full`}
                    >
                        <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-orange-400">
                            <PhysicsIcon />
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Force Directed</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Physics-based simulation layout.
                            </p>
                        </div>
                    </button>

                    {/* Item 2: Node Shape */}
                    <button
                        onClick={() => {
                            setIsShapeOpen(true);
                            onToggle();
                        }}
                        className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover} w-full`}
                    >
                        <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-orange-400">
                            <ShapeIcon />
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Node Shape</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Change the visual shape of nodes.
                            </p>
                        </div>
                    </button>

                    {/* Item 3: Spacing Controls */}
                    <button
                        onClick={() => {
                            setIsSpacingOpen(true);
                            onToggle(); // Close dropdown
                        }}
                        className={`flex items-start text-left p-3 transition-colors group ${itemHover} w-full`} // Last item, no border-b usually
                    >
                        <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-orange-400">
                            <SpacingIcon />
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Spacing Controls</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Adjust static layout and spacing.
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* Floating Panels */}
            {isForceOpen && (
                <ForceDirectedPanel {...props} onClose={() => setIsForceOpen(false)} />
            )}

            {isSpacingOpen && (
                <SpacingControlPanel {...props} onClose={() => setIsSpacingOpen(false)} />
            )}

            {isShapeOpen && (
                <NodeShapePanel {...props} onClose={() => setIsShapeOpen(false)} />
            )}

        </div>
    );
};

export default LayoutToolbar;
