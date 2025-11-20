
import React, { useState, useMemo } from 'react';
import { ColorScheme, Element } from '../types';

interface SchemaToolbarProps {
  schemes: ColorScheme[];
  activeSchemeId: string | null;
  onSchemeChange: (id: string) => void;
  activeColorScheme: ColorScheme | undefined;
  onDefaultRelationshipChange: (label: string) => void;
  defaultTags: string[];
  onDefaultTagsChange: (tags: string[]) => void;
  elements: Element[];
  isCollapsed: boolean;
  onToggle: () => void;
}

const SchemaToolbar: React.FC<SchemaToolbarProps> = ({
  schemes,
  activeSchemeId,
  onSchemeChange,
  activeColorScheme,
  onDefaultRelationshipChange,
  defaultTags,
  onDefaultTagsChange,
  elements,
  isCollapsed,
  onToggle,
}) => {
  const [tagInput, setTagInput] = useState('');

  // Compute available schema tags for suggestions
  const schemaTags = activeColorScheme ? Object.keys(activeColorScheme.tagColors) : [];
  const relationshipLabels = activeColorScheme?.relationshipDefinitions?.map(d => d.label) || [];
  const currentDefaultRel = activeColorScheme?.defaultRelationshipLabel || '';

  // Calculate Tag Counts
  const tagCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      elements.forEach(el => {
          el.tags.forEach(tag => {
              counts[tag] = (counts[tag] || 0) + 1;
          });
      });
      return counts;
  }, [elements]);

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = tagInput.trim();
      if (val && !defaultTags.includes(val)) {
        onDefaultTagsChange([...defaultTags, val]);
        setTagInput('');
      }
    }
  };

  const toggleTag = (tag: string) => {
    if (defaultTags.includes(tag)) {
      onDefaultTagsChange(defaultTags.filter(t => t !== tag));
    } else {
      onDefaultTagsChange([...defaultTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
      onDefaultTagsChange(defaultTags.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 gap-1"
                title={isCollapsed ? "Expand Schema Settings" : "Collapse Schema Settings"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-xs font-bold tracking-wider">SCHEMA</span>
            </button>

            {!isCollapsed && (
                <div className="flex items-center gap-3 p-3 animate-fade-in bg-gray-800 h-20">
                    {/* Schema Selector */}
                    <div className="flex flex-col justify-center h-full">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Schema</label>
                        <select
                            value={activeSchemeId || ''}
                            onChange={(e) => onSchemeChange(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                        >
                            {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="w-px h-12 bg-gray-600 mx-1"></div>

                    {/* Default Relationship Selector */}
                    <div className="flex flex-col justify-center h-full">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Default Relation</label>
                        <select
                            value={currentDefaultRel}
                            onChange={(e) => onDefaultRelationshipChange(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                        >
                            <option value="">-- None --</option>
                            {relationshipLabels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div className="w-px h-12 bg-gray-600 mx-1"></div>

                    {/* Default Tags Section */}
                    <div className="flex flex-col justify-center h-full">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">New Element Tags</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleTagInputKeyDown}
                                placeholder="Add default tag..."
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                            />
                            {/* Active Default Tags Display */}
                            <div className="flex gap-1 overflow-x-auto max-w-[180px] scrollbar-thin scrollbar-thumb-gray-600 items-center h-7 px-1">
                                {defaultTags.length > 0 ? defaultTags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-blue-200 font-bold ml-0.5">×</button>
                                    </span>
                                )) : (
                                    <span className="text-xs text-gray-500 italic">No tags selected</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {/* Quick Schema Tag Picker (Pills) - Only show when expanded */}
        {!isCollapsed && schemaTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pointer-events-auto pl-24 animate-fade-in-down max-w-[600px]">
                {schemaTags.map(tag => {
                    const isActive = defaultTags.includes(tag);
                    const color = activeColorScheme?.tagColors[tag];
                    const count = tagCounts[tag] || 0;
                    return (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`text-[10px] px-2.5 py-1 rounded-full border shadow-sm transition-all flex items-center gap-1.5 ${
                                isActive 
                                ? 'brightness-110 font-bold ring-1 ring-white scale-105' 
                                : 'opacity-80 hover:opacity-100 bg-gray-800 border-gray-600 text-gray-300 hover:scale-105'
                            }`}
                            style={{ 
                                backgroundColor: isActive ? color : undefined,
                                borderColor: isActive ? color : undefined,
                                color: isActive ? '#fff' : undefined,
                                textShadow: isActive ? '0px 1px 2px rgba(0,0,0,0.5)' : 'none'
                            }}
                        >
                            <span>{tag}</span>
                            <span className={`text-[9px] px-1.5 rounded-full ${isActive ? 'bg-black bg-opacity-20' : 'bg-gray-700 text-gray-400'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default SchemaToolbar;
