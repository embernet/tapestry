
import React, { useState, useRef, useEffect } from 'react';
import { ColorScheme, GraphView } from '../types';

interface StatusBarProps {
    nodeCount: number;
    totalNodeCount: number;
    edgeCount: number;
    totalEdgeCount: number;
    isDarkMode: boolean;

    // Sunburst Mode
    sunburstState: { active: boolean; centerId: string | null; hops: number };
    onClearSunburst: () => void;
    centerNodeName?: string | null;

    // Node Filter Mode
    nodeFilterState: { active: boolean; centerId: string | null; hops: number };
    onClearNodeFilter: () => void;
    filterCenterNodeName?: string | null;

    // Selection Mode
    selectionCount: number;
    onClearSelection: () => void;

    activeViewName?: string;

    // View Decor
    tapestrySvg?: string;
    tapestryVisible?: boolean;

    // Schema
    activeSchema?: ColorScheme;
    schemes?: ColorScheme[];
    onSchemaChange?: (id: string) => void;

    // Views
    views?: GraphView[];
    activeViewId?: string;
    onViewChange?: (id: string) => void;

    // Interactivity
    onNodeCountClick?: (rect: DOMRect) => void;
    onEdgeCountClick?: (rect: DOMRect) => void;
    onDensityClick?: (rect: DOMRect) => void;

    // Quick Defaults
    defaultTags?: string[];
    defaultRelationOverride?: string | null;
    onClearQuickDefaults?: () => void;
    onOpenQuickDefaults?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    nodeCount,
    totalNodeCount,
    edgeCount,
    totalEdgeCount,
    isDarkMode,
    sunburstState,
    onClearSunburst,
    centerNodeName,
    nodeFilterState,
    onClearNodeFilter,
    filterCenterNodeName,
    selectionCount,
    onClearSelection,
    activeViewName,
    tapestrySvg,
    tapestryVisible,
    activeSchema,
    schemes,
    onSchemaChange,
    views,
    activeViewId,
    onViewChange,
    onNodeCountClick,
    onEdgeCountClick,
    onDensityClick,
    defaultTags,
    defaultRelationOverride,
    onClearQuickDefaults,
    onOpenQuickDefaults
}) => {
    const [isSchemaMenuOpen, setIsSchemaMenuOpen] = useState(false);
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const schemaMenuRef = useRef<HTMLDivElement>(null);
    const viewMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (schemaMenuRef.current && !schemaMenuRef.current.contains(event.target as Node)) {
                setIsSchemaMenuOpen(false);
            }
            if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
                setIsViewMenuOpen(false);
            }
        };
        if (isSchemaMenuOpen || isViewMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSchemaMenuOpen, isViewMenuOpen]);

    const bgClass = isDarkMode ? 'bg-gray-900 border-t border-gray-800 text-gray-400' : 'bg-white border-t border-gray-200 text-gray-600';
    const activeModeClass = isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200';

    const displayNodeCount = nodeCount === totalNodeCount ? nodeCount : `${nodeCount} / ${totalNodeCount}`;
    const displayEdgeCount = edgeCount === totalEdgeCount ? edgeCount : `${edgeCount} / ${totalEdgeCount}`;

    return (
        <div className={`h-8 w-full flex items-center px-4 text-xs select-none z-[500] flex-shrink-0 ${bgClass}`}>

            {/* Left: Stats */}
            <div className="flex items-center gap-4 flex-shrink-0">

                {/* View Selector */}
                {views && activeViewId && onViewChange ? (
                    <div className="relative" ref={viewMenuRef}>
                        <button
                            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                            className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-800 hover:text-black'}`}
                            title="Change Active View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            {views.find(v => v.id === activeViewId)?.name || activeViewName || 'Unknown View'}
                        </button>

                        {isViewMenuOpen && (
                            <div className={`absolute bottom-full left-0 mb-2 w-48 rounded shadow-xl border overflow-hidden z-[1000] ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider opacity-50 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    Select View
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {views.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                onViewChange(v.id);
                                                setIsViewMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs font-medium truncate flex items-center justify-between ${v.id === activeViewId
                                                ? (isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                                                : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                                                }`}
                                        >
                                            {v.name}
                                            {v.id === activeViewId && <span className="text-[10px] opacity-70">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeViewName ? (
                    <div className={`font-bold flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        {activeViewName}
                    </div>
                ) : null}

                {/* Schema Selector */}
                {activeSchema && schemes && onSchemaChange && (
                    <>
                        <div className="w-px h-3 bg-gray-600 mx-2"></div>
                        <div className="relative" ref={schemaMenuRef}>
                            <button
                                onClick={() => setIsSchemaMenuOpen(!isSchemaMenuOpen)}
                                className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-800 hover:text-black'}`}
                                title="Change Active Schema"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {activeSchema.name}
                            </button>

                            {isSchemaMenuOpen && (
                                <div className={`absolute bottom-full left-0 mb-2 w-48 rounded shadow-xl border overflow-hidden z-[1000] ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider opacity-50 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        Select Schema
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {schemes.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    onSchemaChange(s.id);
                                                    setIsSchemaMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs font-medium truncate flex items-center justify-between ${s.id === activeSchema.id
                                                    ? (isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                                                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                                                    }`}
                                            >
                                                {s.name}
                                                {s.id === activeSchema.id && <span className="text-[10px] opacity-70">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="w-px h-3 bg-gray-600 mx-2"></div>
                <div
                    className="status-bar-trigger flex items-center gap-1 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                    title="Visible / Total Nodes"
                    onClick={(e) => onNodeCountClick && onNodeCountClick(e.currentTarget.getBoundingClientRect())}
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s-8-1.79-8-4" /></svg>
                    <span className="font-mono font-bold">{displayNodeCount}</span>
                    <span>Nodes</span>
                </div>
                <div
                    className="status-bar-trigger flex items-center gap-1 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                    title="Visible / Total Edges"
                    onClick={(e) => onEdgeCountClick && onEdgeCountClick(e.currentTarget.getBoundingClientRect())}
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    <span className="font-mono font-bold">{displayEdgeCount}</span>
                    <span>Edges</span>
                </div>

                <div className="w-px h-3 bg-gray-600 mx-2"></div>
                <div
                    className="status-bar-trigger flex items-center gap-1 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                    title="Graph Density (Edges / Possible Edges)"
                    onClick={(e) => onDensityClick && onDensityClick(e.currentTarget.getBoundingClientRect())}
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
                    <span className="font-mono font-bold">{
                        (nodeCount > 1)
                            ? (edgeCount / (nodeCount * (nodeCount - 1))).toFixed(2)
                            : '0.00'
                    }</span>
                    <span>Density</span>
                </div>
                {selectionCount > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500 font-bold cursor-pointer hover:text-yellow-400 transition-colors" onClick={onClearSelection} title="Clear Selection">
                        <span>{selectionCount} Selected</span>
                        <span className="text-[9px] bg-gray-700 px-1 rounded ml-1 text-white">ESC</span>
                    </div>
                )}
            </div>

            {/* Center: Tapestry Runner */}
            <div className="flex-grow h-full mx-4 relative overflow-hidden flex items-center justify-center opacity-30 pointer-events-none">
                {tapestryVisible && tapestrySvg && (
                    <div
                        className="w-full h-full flex items-center"
                        dangerouslySetInnerHTML={{ __html: tapestrySvg }}
                    />
                )}
            </div>

            {/* Right: Modes */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {sunburstState.active && (
                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${activeModeClass}`}>
                        <span className="uppercase font-bold tracking-wider text-[10px]">Sunburst Mode</span>
                        <span className="opacity-70">| {centerNodeName || 'Unknown'} ({sunburstState.hops} hops)</span>
                        <button onClick={onClearSunburst} className="hover:text-red-400 ml-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {nodeFilterState.active && (
                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${activeModeClass}`}>
                        <span className="uppercase font-bold tracking-wider text-[10px]">Neighborhood Filter</span>
                        <span className="opacity-70">| {filterCenterNodeName || 'Unknown'} ({nodeFilterState.hops} hops)</span>
                        <button onClick={onClearNodeFilter} className="hover:text-red-400 ml-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {((defaultTags && defaultTags.length > 0) || defaultRelationOverride) && (
                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${isDarkMode ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                        <span className="uppercase font-bold tracking-wider text-[10px] cursor-pointer" onClick={() => onOpenQuickDefaults && onOpenQuickDefaults()}>Quick Defaults Active</span>
                        <button onClick={onClearQuickDefaults} className="hover:text-red-400 ml-1" title="Clear Quick Defaults">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
