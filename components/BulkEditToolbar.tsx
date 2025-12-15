import React, { useState } from 'react';
import { ScriptEngine, ScriptParser, RuntimeContext } from '../services/ScriptEngine';
import { toolRegistry } from '../services/ToolRegistry';

interface BulkEditToolbarProps {
    onOpenPanel: () => void;
    onOpenCommandPanel: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
    isDarkMode: boolean;
    isActive: boolean; // Reflects if the bulk *functionality* (clicking nodes) is active
}

const BulkEditToolbar: React.FC<BulkEditToolbarProps> = ({
    onOpenPanel,
    onOpenCommandPanel,
    isCollapsed,
    onToggle,
    isDarkMode,
    isActive
}) => {
    const [loadingScript, setLoadingScript] = useState<string | null>(null);

    const runScript = async (filename: string) => {
        setLoadingScript(filename);
        try {
            const response = await fetch(`/system_automations/${filename}`);
            if (!response.ok) throw new Error(`Failed to load script: ${response.statusText}`);
            const code = await response.text();

            // Execute Script
            const engine = new ScriptEngine();
            const parser = ScriptParser.parse(code);

            if (parser.error) {
                console.error("Script Syntax Error:", parser.error);
                alert(`Script Error: ${parser.error}`);
                return;
            }

            const ctx: RuntimeContext = engine.createContext(toolRegistry, {
                log: (msg) => console.log(`[TScript]: ${msg}`),
                highlightLine: () => { }
            });

            // Run synchronously-ish (await steps)
            const program = parser;
            while (ctx.status !== 'completed' && ctx.status !== 'error') {
                await engine.step(program, ctx);
            }

            if (ctx.status === 'error') {
                alert('Script execution failed. Check console for details.');
            }

        } catch (e: any) {
            console.error("Execution Error:", e);
            alert(`Error: ${e.message}`);
        } finally {
            setLoadingScript(null);
            // Close menu after run
            onToggle();
        }
    };

    // Theme Classes
    const bgClass = isDarkMode ? 'bg-gray-800 bg-opacity-90 border-gray-600' : 'bg-white bg-opacity-95 border-gray-200';
    const toggleBtnClass = isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
    const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
    const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
    const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
    const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';
    const iconColor = isDarkMode ? 'text-pink-400' : 'text-pink-500';

    return (
        <div className="relative pointer-events-auto">
            <button
                onClick={onToggle}
                className={`border shadow-lg rounded-lg w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1 ${toggleBtnClass} ${!isCollapsed ? (isDarkMode ? 'ring-2 ring-pink-500' : 'ring-2 ring-pink-400') : ''}`}
                title="Bulk Operations"
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11l2 2m-2-2l2 -2m-2 2l-2 2m2-2l-2 -2" />
                    </svg>
                    {isActive && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    )}
                </div>
                <span className={`text-[10px] font-bold tracking-wider ${textMain}`}>BULK</span>
            </button>

            {/* Dropdown Menu - Opening Downwards */}
            {!isCollapsed && (
                <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-xl z-[990] flex flex-col overflow-hidden animate-fade-in-down ${dropdownBg}`}>

                    {/* 1. Open Floating Panel */}
                    <button
                        onClick={() => { onOpenPanel(); onToggle(); }}
                        className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
                    >
                        <div className={`mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${iconColor}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Interactive Tag Editor</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Click nodes to add or remove tags.
                            </p>
                        </div>
                    </button>

                    {/* 2. Remove Highlights */}
                    <button
                        onClick={() => runScript('remove_highlights.tscript')}
                        disabled={!!loadingScript}
                        className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
                    >
                        <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-yellow-400">
                            {loadingScript === 'remove_highlights.tscript' ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            )}
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Remove Highlights</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Clear all highlighted nodes.
                            </p>
                        </div>
                    </button>

                    {/* 3. Remove Added_by_tapestry */}
                    <button
                        onClick={() => runScript('remove_added_by_tapestry.tscript')}
                        disabled={!!loadingScript}
                        className={`flex items-start text-left p-3 border-b transition-colors group ${itemHover}`}
                    >
                        <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-gray-500">
                            {loadingScript === 'remove_added_by_tapestry.tscript' ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 8c2-2 4-2 6 0s4 2 6 0" />
                                    <path d="M4 12c2-2 4-2 6 0s4 2 6 0" />
                                    <path d="M4 16c2-2 4-2 6 0s4 2 6 0" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Remove 'Added_by_tapestry'</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Clean up system generated tags.
                            </p>
                        </div>
                    </button>

                    {/* 4. Command Window */}
                    <button
                        onClick={() => { onOpenCommandPanel(); onToggle(); }}
                        className={`flex items-start text-left p-3 transition-colors group ${itemHover}`}
                    >
                        <div className={`mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 overflow-visible text-green-500`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Command</div>
                            <p className={`text-xs leading-tight ${textDesc}`}>
                                Open command window.
                            </p>
                        </div>
                    </button>

                </div>
            )}
        </div>
    );
};

export default BulkEditToolbar;
