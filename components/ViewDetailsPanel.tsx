
import React, { useState } from 'react';
import { GraphView, Element, DateFilterState, NodeFilterState } from '../types';
import { FilterContent } from './FilterContent';

interface ViewDetailsPanelProps {
    view: GraphView | undefined;
    onUpdateView: (updates: Partial<GraphView>) => void;
    onGenerateTapestry: (prompt: string) => void;
    isGeneratingTapestry: boolean;
    allTags: string[];
    tagCounts: Map<string, number>;
    elements: Element[];
    isDarkMode: boolean;
    onClose: () => void;
}

export const ViewDetailsPanel: React.FC<ViewDetailsPanelProps> = ({
    view,
    onUpdateView,
    onGenerateTapestry,
    isGeneratingTapestry,
    allTags,
    tagCounts,
    elements,
    isDarkMode,
    onClose
}) => {
    const [tapestryInput, setTapestryInput] = useState(view?.tapestryPrompt || '');

    if (!view) return null;

    // Filter Handlers wrapping view updates
    const handleTagFilterChange = (newFilter: { included: Set<string>; excluded: Set<string> }) => {
        onUpdateView({
            filters: {
                ...view.filters,
                tags: {
                    included: Array.from(newFilter.included),
                    excluded: Array.from(newFilter.excluded)
                }
            }
        });
    };

    const handleDateFilterChange = (newFilter: DateFilterState) => {
        onUpdateView({
            filters: { ...view.filters, date: newFilter }
        });
    };

    const handleNodeFilterChange = (newFilter: NodeFilterState) => {
        onUpdateView({
            filters: { ...view.filters, nodeFilter: newFilter }
        });
    };

    const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const inputBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

    return (
        <div className={`w-full h-full flex flex-col ${bgClass}`}>
            {/* Header */}
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    </svg>
                    View Details
                </h2>
                <button onClick={onClose} className={`${subTextClass} hover:text-blue-500`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${subTextClass}`}>View Name</label>
                        <input 
                            type="text" 
                            value={view.name}
                            onChange={(e) => onUpdateView({ name: e.target.value })}
                            className={`w-full p-2 rounded text-sm outline-none border focus:ring-1 focus:ring-blue-500 ${inputBg}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${subTextClass}`}>Description</label>
                        <textarea 
                            value={view.description || ''}
                            onChange={(e) => onUpdateView({ description: e.target.value })}
                            className={`w-full p-2 rounded text-sm outline-none border focus:ring-1 focus:ring-blue-500 resize-none h-20 ${inputBg}`}
                            placeholder="What is this view for?"
                        />
                    </div>
                </div>

                {/* Tapestry Decor */}
                <div className={`p-4 rounded border ${borderClass} ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${textClass}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Room Decor (Tapestry)
                    </h3>
                    <p className={`text-xs mb-3 ${subTextClass}`}>
                        Give this view a visual identity. Describe a theme (e.g., "A cozy library", "Cyberpunk grid", "Zen garden") and AI will generate a decorative runner.
                    </p>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            value={tapestryInput}
                            onChange={(e) => setTapestryInput(e.target.value)}
                            placeholder="Describe the room vibe..."
                            className={`flex-grow p-2 rounded text-sm outline-none border focus:ring-1 focus:ring-purple-500 ${inputBg}`}
                        />
                        <button 
                            onClick={() => onGenerateTapestry(tapestryInput)}
                            disabled={isGeneratingTapestry || !tapestryInput.trim()}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50"
                        >
                            {isGeneratingTapestry ? 'Weaving...' : 'Generate'}
                        </button>
                    </div>
                    {view.tapestrySvg && (
                        <div className="flex items-center gap-2">
                             <div className="h-8 flex-grow bg-black/20 rounded overflow-hidden relative">
                                 <div dangerouslySetInnerHTML={{ __html: view.tapestrySvg }} className="w-full h-full opacity-50" />
                             </div>
                             <button 
                                onClick={() => onUpdateView({ tapestryVisible: !view.tapestryVisible })}
                                className={`text-xs px-2 py-1 rounded border ${view.tapestryVisible ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-700 text-gray-400 border-gray-600'}`}
                             >
                                 {view.tapestryVisible ? 'Visible' : 'Hidden'}
                             </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className={`p-4 rounded border ${borderClass}`}>
                     <h3 className={`text-sm font-bold mb-4 ${textClass}`}>View Filters</h3>
                     <FilterContent 
                        allTags={allTags}
                        tagCounts={tagCounts}
                        tagFilter={{
                            included: new Set(view.filters.tags.included),
                            excluded: new Set(view.filters.tags.excluded)
                        }}
                        dateFilter={view.filters.date}
                        nodeFilter={view.filters.nodeFilter}
                        elements={elements}
                        onTagFilterChange={handleTagFilterChange}
                        onDateFilterChange={handleDateFilterChange}
                        onNodeFilterChange={handleNodeFilterChange}
                        isDarkMode={isDarkMode}
                     />
                </div>
            </div>
        </div>
    );
};
