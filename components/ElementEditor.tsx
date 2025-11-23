import React, { useState, useMemo } from 'react';
import { Element, ColorScheme } from '../types';
import AttributesEditor from './AttributesEditor';

interface ElementEditorProps {
  elementData: Partial<Element>;
  onDataChange: (updatedData: Partial<Element>, immediate?: boolean) => void;
  onBlur?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
  colorSchemes: ColorScheme[];
  activeSchemeId: string | null;
}

const ElementEditor: React.FC<ElementEditorProps> = ({ 
  elementData, 
  onDataChange, 
  onBlur, 
  nameInputRef, 
  colorSchemes, 
  activeSchemeId 
}) => {
  const [manualTagInput, setManualTagInput] = useState('');
  const [otherSchemaView, setOtherSchemaView] = useState<string>('none');

  const activeScheme = useMemo(() => 
    colorSchemes.find(s => s.id === activeSchemeId), 
    [colorSchemes, activeSchemeId]
  );

  const activeSchemeTags = useMemo(() => 
    activeScheme ? Object.keys(activeScheme.tagColors) : [], 
    [activeScheme]
  );

  const otherSchemes = useMemo(() => 
    colorSchemes.filter(s => s.id !== activeSchemeId),
    [colorSchemes, activeSchemeId]
  );

  const displayedOtherTags = useMemo(() => {
    if (otherSchemaView === 'none') return [];
    if (otherSchemaView === 'all') {
      const tags = new Set<string>();
      otherSchemes.forEach(s => Object.keys(s.tagColors).forEach(t => tags.add(t)));
      return Array.from(tags);
    }
    const scheme = colorSchemes.find(s => s.id === otherSchemaView);
    return scheme ? Object.keys(scheme.tagColors) : [];
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
      const currentTags = elementData.tags || [];
      // Avoid duplicates (case insensitive check, preserve case of new tag)
      if (!currentTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
          const newTags = [...currentTags, tag];
          onDataChange({ ...elementData, tags: newTags }, true);
      }
  };

  const removeTag = (tagToRemove: string) => {
      const currentTags = elementData.tags || [];
      const newTags = currentTags.filter(t => t !== tagToRemove);
      onDataChange({ ...elementData, tags: newTags }, true);
  };

  const handleAttributesChange = (newAttributes: Record<string, string>) => {
      onDataChange({ ...elementData, attributes: newAttributes }, true); 
  };

  const currentTags = elementData.tags || [];

  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          ref={nameInputRef}
          type="text"
          name="name"
          value={elementData.name || ''}
          onChange={handleInputChange}
          onBlur={onBlur}
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        
        {/* Applied Tags Pills */}
        <div className="flex flex-wrap gap-2 mb-2">
            {currentTags.map(tag => {
                // Find color if available in ANY schema for styling
                let color = '#4b5563'; // gray-600 default
                for (const s of colorSchemes) {
                    const c = s.tagColors[Object.keys(s.tagColors).find(k => k.toLowerCase() === tag.toLowerCase()) || ''];
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
                        {tag}
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
                className="inline-block bg-transparent border-none text-sm text-gray-300 placeholder-gray-500 focus:ring-0 focus:outline-none min-w-[80px]"
            />
        </div>

        <div className="h-px bg-gray-700 w-full my-3"></div>

        {/* Active Schema Tags */}
        <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                {activeScheme?.name || 'Schema'} Tags:
            </p>
            <div className="flex flex-wrap gap-1.5">
                {activeSchemeTags.map(tag => {
                    const isApplied = currentTags.some(t => t.toLowerCase() === tag.toLowerCase());
                    const color = activeScheme?.tagColors[tag];
                    if (isApplied) return null;
                    
                    return (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="text-xs px-2 py-1 rounded-full border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-105 transition-all"
                            style={{ borderLeft: `3px solid ${color}` }}
                        >
                            {tag}
                        </button>
                    );
                })}
                {activeSchemeTags.length === 0 && <span className="text-xs text-gray-600 italic">No tags in this schema.</span>}
            </div>
        </div>

        {/* Other Schemas Dropdown */}
        <div>
            <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Show other schema tags...</label>
                <select 
                    value={otherSchemaView} 
                    onChange={(e) => setOtherSchemaView(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 px-2 py-0.5 focus:outline-none"
                >
                    <option value="none">None</option>
                    <option value="all">All Other Schemas</option>
                    {otherSchemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            
            {otherSchemaView !== 'none' && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-800/50 rounded border border-gray-700/50">
                    {displayedOtherTags.map(tag => {
                         const isApplied = currentTags.some(t => t.toLowerCase() === tag.toLowerCase());
                         if (isApplied) return null;
                         
                         // Find color
                         let color = undefined;
                         if (otherSchemaView !== 'all' && otherSchemaView !== 'none') {
                             const s = colorSchemes.find(sc => sc.id === otherSchemaView);
                             if (s) color = s.tagColors[tag];
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
                                className="text-xs px-2 py-1 rounded-full border border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                                style={{ borderLeft: color ? `3px solid ${color}` : undefined }}
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
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <AttributesEditor 
        attributes={elementData.attributes || {}} 
        onChange={handleAttributesChange} 
      />
    </div>
  );
};

export default ElementEditor;