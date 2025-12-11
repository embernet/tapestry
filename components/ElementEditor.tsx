
import React, { useState, useMemo } from 'react';
import { Element, ColorScheme } from '../types';
import AttributesEditor from './AttributesEditor';
import ListEditor from './ListEditor';
import { normalizeTag, formatTag } from '../utils';

interface ElementEditorProps {
  elementData: Partial<Element>;
  onDataChange: (updatedData: Partial<Element>, immediate?: boolean) => void;
  onBlur?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
  colorSchemes: ColorScheme[];
  activeSchemeId: string | null;
  hideName?: boolean;
  isDarkMode?: boolean;
}

const ElementEditor: React.FC<ElementEditorProps> = ({ 
  elementData, 
  onDataChange, 
  onBlur, 
  nameInputRef, 
  colorSchemes, 
  activeSchemeId,
  hideName = false,
  isDarkMode = true
}) => {
  const [manualTagInput, setManualTagInput] = useState('');
  const [otherSchemaView, setOtherSchemaView] = useState<string>('none');

  const activeScheme = useMemo(() => 
    colorSchemes.find(s => s.id === activeSchemeId), 
    [colorSchemes, activeSchemeId]
  );

  const activeSchemeTags = useMemo(() => 
    activeScheme ? Object.keys(activeScheme.tagColors).sort() : [], 
    [activeScheme]
  );

  const otherSchemes = useMemo(() => 
    colorSchemes.filter(s => s.id !== activeSchemeId),
    [colorSchemes, activeSchemeId]
  );

  const mergedCustomLists = useMemo(() => {
      const elementLists = elementData.customLists || {};
      const schemaLists = activeScheme?.customLists || {};
      
      const merged: Record<string, string[]> = { ...elementLists };
      
      // Merge schema definitions if not present on element
      Object.entries(schemaLists).forEach(([key, defaultItems]) => {
          if (merged[key] === undefined) {
               // Cast to string[] to avoid iterator error if TS infers unknown
               merged[key] = [...(defaultItems as string[])]; 
          }
      });
      
      return merged;
  }, [elementData.customLists, activeScheme]);

  const displayedOtherTags = useMemo(() => {
    if (otherSchemaView === 'none') return [];
    if (otherSchemaView === 'all') {
      const tags = new Set<string>();
      otherSchemes.forEach(s => Object.keys(s.tagColors).forEach(t => tags.add(t)));
      return Array.from(tags).sort();
    }
    const scheme = colorSchemes.find(s => s.id === otherSchemaView);
    return scheme ? Object.keys(scheme.tagColors).sort() : [];
  }, [otherSchemaView, otherSchemes, colorSchemes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({ ...elementData, [name]: value }, false);
  };

  // Manual Tag Input
  const handleManualTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to prevent form submission in parent
        addTag(manualTagInput.trim());
        setManualTagInput('');
    }
  };

  const handleManualTagBlur = () => {
      if (manualTagInput.trim()) {
          addTag(manualTagInput.trim());
          setManualTagInput('');
      }
      if (onBlur) onBlur();
  };

  const addTag = (tag: string) => {
      if (!tag) return;
      const normalizedTag = normalizeTag(tag);
      const currentTags = elementData.tags || [];
      // Avoid duplicates
      if (!currentTags.includes(normalizedTag)) {
          const newTags = [...currentTags, normalizedTag];
          onDataChange({ ...elementData, tags: newTags }, true);
      }
  };

  const removeTag = (tagToRemove: string) => {
      const currentTags = elementData.tags || [];
      // tagToRemove is from the mapped list, so it is already normalized (lowercase)
      const newTags = currentTags.filter(t => t !== tagToRemove);
      onDataChange({ ...elementData, tags: newTags }, true);
  };

  const handleAttributesChange = (newAttributes: Record<string, string>) => {
      onDataChange({ ...elementData, attributes: newAttributes }, true); 
  };

  const handleCustomListsChange = (newLists: Record<string, string[]>) => {
      onDataChange({ ...elementData, customLists: newLists }, true);
  };

  const currentTags = useMemo(() => [...(elementData.tags || [])].sort((a, b) => a.localeCompare(b)), [elementData.tags]);

  return (
    <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {!hideName && (
        <div>
            <label className="block text-sm font-medium">Name</label>
            <input
            ref={nameInputRef}
            type="text"
            name="name"
            value={elementData.name || ''}
            onChange={handleInputChange}
            onBlur={onBlur}
            className={`mt-1 block w-full rounded-md px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        
        {/* Applied Tags Pills */}
        <div className="flex flex-wrap gap-2 mb-2">
            {currentTags.map(tag => {
                // Find color if available in ANY schema for styling
                // Tags are stored lowercase, so we compare lowercase
                let color = '#4b5563'; // gray-600 default
                for (const s of colorSchemes) {
                    const c = s.tagColors[Object.keys(s.tagColors).find(k => k.toLowerCase() === tag) || ''];
                    if (c) { color = c; break; }
                }
                
                return (
                    <span 
                        key={tag} 
                        onClick={() => removeTag(tag)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity shadow-sm border border-white/20"
                        style={{ backgroundColor: color, textShadow: '0px 1px 1px rgba(0,0,0,0.5)' }}
                        title="Click to remove"
                    >
                        {formatTag(tag)}
                        <span className="ml-1.5 text-white/70 hover:text-white font-bold">&times;</span>
                    </span>
                );
            })}
            <input
                type="text"
                value={manualTagInput}
                onChange={(e) => setManualTagInput(e.target.value)}
                onKeyDown={handleManualTagKeyDown}
                onBlur={handleManualTagBlur}
                placeholder="+ Add tag"
                className={`inline-block bg-transparent border-none text-sm placeholder-gray-500 focus:ring-0 focus:outline-none min-w-[80px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            />
        </div>

        <div className={`h-px w-full my-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

        {/* Active Schema Tags */}
        <div className="mb-3">
            <p className={`text-xs mb-1.5 font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {activeScheme?.name || 'Schema'} Tags:
            </p>
            <div className="flex flex-wrap gap-1.5">
                {activeSchemeTags.map(tag => {
                    const isApplied = currentTags.some(t => t === normalizeTag(tag));
                    const color = activeScheme?.tagColors[tag] || '#4b5563';
                    if (isApplied) return null;
                    
                    return (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="text-xs px-2.5 py-1 rounded-full text-white hover:scale-105 transition-all shadow-sm border border-black/10 hover:shadow-md"
                            style={{ backgroundColor: color, textShadow: '0px 1px 1px rgba(0,0,0,0.3)' }}
                        >
                            {tag}
                        </button>
                    );
                })}
                {activeSchemeTags.length === 0 && <span className="text-xs text-gray-500 italic">No tags in this schema.</span>}
            </div>
        </div>

        {/* Other Schemas Dropdown */}
        <div>
            <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Show other schema tags...</label>
                <select 
                    value={otherSchemaView} 
                    onChange={(e) => setOtherSchemaView(e.target.value)}
                    className={`rounded text-xs px-2 py-0.5 focus:outline-none border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                    <option value="none">None</option>
                    <option value="all">All Other Schemas</option>
                    {otherSchemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            
            {otherSchemaView !== 'none' && (
                <div className={`flex flex-wrap gap-1.5 p-2 rounded border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
                    {displayedOtherTags.map(tag => {
                         const isApplied = currentTags.some(t => t === normalizeTag(tag));
                         if (isApplied) return null;
                         
                         // Find color
                         let color = '#4b5563';
                         if (otherSchemaView !== 'all' && otherSchemaView !== 'none') {
                             const s = colorSchemes.find(sc => sc.id === otherSchemaView);
                             if (s && s.tagColors[tag]) color = s.tagColors[tag];
                         } else {
                             // Find first match in any schema
                             for (const s of colorSchemes) {
                                 if (s.tagColors[tag]) { color = s.tagColors[tag]; break; }
                             }
                         }

                         return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="text-xs px-2.5 py-1 rounded-full text-white hover:scale-105 transition-all shadow-sm border border-black/10 hover:shadow-md"
                                style={{ backgroundColor: color, textShadow: '0px 1px 1px rgba(0,0,0,0.3)' }}
                            >
                                {tag}
                            </button>
                        );
                    })}
                    {displayedOtherTags.length === 0 && <span className="text-xs text-gray-500 italic">No tags found.</span>}
                </div>
            )}
        </div>

      </div>

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          rows={4}
          value={elementData.notes || ''}
          onChange={handleInputChange}
          onBlur={onBlur}
          className={`mt-1 block w-full rounded-md px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        ></textarea>
      </div>

      <AttributesEditor 
        attributes={elementData.attributes || {}} 
        onChange={handleAttributesChange}
        isDarkMode={isDarkMode}
      />
      
      <ListEditor 
        lists={mergedCustomLists}
        descriptions={activeScheme?.customListDescriptions || {}}
        onChange={handleCustomListsChange}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ElementEditor;
