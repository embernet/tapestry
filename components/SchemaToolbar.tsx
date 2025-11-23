
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ColorScheme, Element, RelationshipDefinition } from '../types';
import { generateUUID } from '../utils';
import { DEFAULT_COLOR_SCHEMES } from '../constants';

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
  onUpdateSchemes: (newSchemes: ColorScheme[]) => void;
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
  onUpdateSchemes,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Editor State ---
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#cccccc');
  const [newTagDesc, setNewTagDesc] = useState('');
  
  const [newRelLabel, setNewRelLabel] = useState('');
  const [newRelDesc, setNewRelDesc] = useState('');

  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(activeSchemeId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (activeSchemeId) setEditingSchemeId(activeSchemeId);
  }, [activeSchemeId]);

  const editingScheme = useMemo(() => schemes.find(s => s.id === editingSchemeId), [schemes, editingSchemeId]);

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

  // --- Schema Editor Logic ---

  const updateScheme = (id: string, updates: Partial<ColorScheme>) => {
      const updatedSchemes = schemes.map(s => s.id === id ? { ...s, ...updates } : s);
      onUpdateSchemes(updatedSchemes);
  };

  const handleCreateScheme = () => {
      const newId = generateUUID();
      const newScheme: ColorScheme = {
          id: newId,
          name: 'New Custom Schema',
          tagColors: { 'Idea': '#efef10' },
          tagDescriptions: { 'Idea': 'A generic concept or thought.' },
          relationshipDefinitions: [{ label: 'related to', description: 'A generic connection.' }],
          defaultRelationshipLabel: 'related to'
      };
      onUpdateSchemes([...schemes, newScheme]);
      setEditingSchemeId(newId);
      onSchemeChange(newId);
  };

  const handleDeleteScheme = () => {
      if (schemes.length <= 1) {
          alert("Cannot delete the last schema.");
          return;
      }
      if (editingSchemeId && confirm("Are you sure you want to delete this schema?")) {
          const remaining = schemes.filter(s => s.id !== editingSchemeId);
          onUpdateSchemes(remaining);
          setEditingSchemeId(remaining[0].id);
          if (activeSchemeId === editingSchemeId) onSchemeChange(remaining[0].id);
      }
  };

  const handleExportSchema = () => {
      if (!editingScheme) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editingScheme, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `schema-${editingScheme.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string) as ColorScheme;
              if (!json.name || !json.tagColors) {
                  throw new Error("Invalid schema format");
              }

              // Check if schema with same name exists
              const existing = schemes.find(s => s.name === json.name);
              
              if (existing) {
                  if (confirm(`A schema named "${json.name}" already exists. Update it?`)) {
                      // Update existing
                      const updatedSchemes = schemes.map(s => s.id === existing.id ? { ...json, id: existing.id } : s);
                      onUpdateSchemes(updatedSchemes);
                      setEditingSchemeId(existing.id);
                      if (activeSchemeId === existing.id) onSchemeChange(existing.id);
                  }
              } else {
                  // Create new
                  const newId = generateUUID();
                  const newScheme = { ...json, id: newId };
                  onUpdateSchemes([...schemes, newScheme]);
                  setEditingSchemeId(newId);
                  onSchemeChange(newId);
              }
          } catch (error) {
              console.error("Import failed", error);
              alert("Failed to import schema. Please ensure the file is a valid JSON schema export.");
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleLoadMissingDefaults = () => {
      const missing = DEFAULT_COLOR_SCHEMES.filter(def => 
          !schemes.some(s => s.id === def.id || s.name === def.name)
      );
      
      if (missing.length === 0) {
          alert("All standard schemas are already present.");
          return;
      }
      
      onUpdateSchemes([...schemes, ...missing]);
      alert(`Added ${missing.length} standard schemas.`);
  };

  // Tag Operations
  const handleAddTag = () => {
      if (newTagName && editingSchemeId && editingScheme) {
          const updatedTags = { ...editingScheme.tagColors, [newTagName]: newTagColor };
          const updatedDescs = { ...editingScheme.tagDescriptions, [newTagName]: newTagDesc };
          updateScheme(editingSchemeId, { tagColors: updatedTags, tagDescriptions: updatedDescs });
          setNewTagName('');
          setNewTagColor('#cccccc');
          setNewTagDesc('');
      }
  };

  const handleDeleteTag = (tag: string) => {
      if (editingSchemeId && editingScheme) {
          const updatedTags = { ...editingScheme.tagColors };
          const updatedDescs = { ...editingScheme.tagDescriptions };
          delete updatedTags[tag];
          delete updatedDescs[tag];
          updateScheme(editingSchemeId, { tagColors: updatedTags, tagDescriptions: updatedDescs });
      }
  };

  // Relation Operations
  const handleAddRel = () => {
      if (newRelLabel && editingSchemeId && editingScheme) {
          const newDef: RelationshipDefinition = { label: newRelLabel, description: newRelDesc };
          const currentDefs = editingScheme.relationshipDefinitions || [];
          updateScheme(editingSchemeId, { relationshipDefinitions: [...currentDefs, newDef] });
          setNewRelLabel('');
          setNewRelDesc('');
      }
  };

  const handleDeleteRel = (idx: number) => {
      if (editingSchemeId && editingScheme && editingScheme.relationshipDefinitions) {
          const updated = [...editingScheme.relationshipDefinitions];
          updated.splice(idx, 1);
          updateScheme(editingSchemeId, { relationshipDefinitions: updated });
      }
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
        <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
        
        <div className="bg-gray-800 bg-opacity-95 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden flex flex-col">
            
            {/* Top Bar */}
            <div className="flex items-stretch h-20">
                {/* Collapse Toggle */}
                <button 
                    onClick={onToggle}
                    className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-full gap-1 flex-shrink-0"
                    title={isCollapsed ? "Expand Schema Settings" : "Collapse Schema Settings"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-xs font-bold tracking-wider">SCHEMA</span>
                </button>

                {!isCollapsed && (
                    <div className="flex items-center gap-3 p-3 flex-grow overflow-hidden">
                        {/* Schema Selector */}
                        <div className="flex flex-col justify-center h-full">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Active Schema</label>
                            <div className="flex gap-2">
                                <select
                                    value={activeSchemeId || ''}
                                    onChange={(e) => {
                                        onSchemeChange(e.target.value);
                                        setEditingSchemeId(e.target.value);
                                    }}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
                                >
                                    {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button 
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`px-2 py-1 rounded text-xs border transition-colors ${isEditMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                    title="Edit Schema Definitions"
                                >
                                    Edit
                                </button>
                            </div>
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

            {/* Expanded Edit Panel */}
            {!isCollapsed && isEditMode && editingScheme && (
                <div className="border-t border-gray-600 bg-gray-900/95 p-4 max-h-[600px] overflow-y-auto animate-fade-in flex flex-col gap-4 w-[800px]">
                    
                    {/* AI Info Bar */}
                    <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded flex gap-3 items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm text-blue-200 leading-tight">
                            Element and relationship descriptions are provided to the AI. This helps it understand the model context better and allows it to create content that adheres to your chosen schema.
                        </p>
                    </div>

                    {/* Schema Meta Controls */}
                    <div className="flex flex-col gap-3 bg-gray-800 p-3 rounded border border-gray-700">
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Edit Schema Name</label>
                                <input 
                                    type="text" 
                                    value={editingScheme.name} 
                                    onChange={(e) => updateScheme(editingScheme.id, { name: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                                />
                            </div>
                            <button 
                                onClick={handleExportSchema}
                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors h-10"
                                title="Export Schema JSON"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleImportClick}
                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors h-10"
                                title="Import Schema JSON"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </button>
                            <button onClick={handleDeleteScheme} className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 rounded text-xs text-red-400 transition-colors whitespace-nowrap h-10">
                                Delete Schema
                            </button>
                        </div>
                        <div className="flex justify-between border-t border-gray-700 pt-2">
                             <button 
                                onClick={handleLoadMissingDefaults} 
                                className="px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Add Standard Schemas
                            </button>
                            <button 
                                onClick={handleCreateScheme} 
                                className="px-3 py-1.5 text-xs text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
                            >
                                + Create New Custom Schema
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Tags Editor */}
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-700 pb-2 mb-2">
                                Tag Definitions
                            </h3>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {Object.entries(editingScheme.tagColors).map(([tag, color]) => (
                                    <div key={tag} className="grid grid-cols-[30px_1fr_1.5fr_30px] gap-2 items-center bg-gray-800 p-2 rounded border border-gray-700">
                                        <input 
                                            type="color" 
                                            value={color} 
                                            onChange={(e) => updateScheme(editingScheme.id, { tagColors: { ...editingScheme.tagColors, [tag]: e.target.value } })}
                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                                            title="Tag Color"
                                        />
                                        <div className="font-bold text-sm text-white truncate" title={tag}>{tag}</div>
                                        <input 
                                            type="text"
                                            value={editingScheme.tagDescriptions?.[tag] || ''}
                                            onChange={(e) => updateScheme(editingScheme.id, { tagDescriptions: { ...editingScheme.tagDescriptions, [tag]: e.target.value } })}
                                            placeholder="Description for AI..."
                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
                                        />
                                        <button onClick={() => handleDeleteTag(tag)} className="text-gray-500 hover:text-red-400 flex justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Add Tag Row */}
                            <div className="grid grid-cols-[30px_1fr_1.5fr_30px] gap-2 items-center bg-gray-800/50 p-2 rounded border border-dashed border-gray-600 mt-2">
                                <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0" />
                                <input 
                                    type="text" 
                                    value={newTagName} 
                                    onChange={e => setNewTagName(e.target.value)} 
                                    placeholder="New Tag Name" 
                                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={newTagDesc} 
                                    onChange={e => setNewTagDesc(e.target.value)} 
                                    placeholder="Description..." 
                                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                />
                                <button onClick={handleAddTag} disabled={!newTagName} className="text-green-500 hover:text-green-400 disabled:opacity-50 font-bold text-lg leading-none">
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Relationships Editor */}
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-700 pb-2 mb-2">
                                Relationship Definitions
                            </h3>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {editingScheme.relationshipDefinitions?.map((def, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_1.5fr_30px] gap-2 items-center bg-gray-800 p-2 rounded border border-gray-700">
                                        <div className="font-bold text-sm text-white truncate pl-2" title={def.label}>{def.label}</div>
                                        <input 
                                            type="text"
                                            value={def.description || ''}
                                            onChange={(e) => {
                                                const updated = [...(editingScheme.relationshipDefinitions || [])];
                                                updated[idx] = { ...updated[idx], description: e.target.value };
                                                updateScheme(editingScheme.id, { relationshipDefinitions: updated });
                                            }}
                                            placeholder="Description for AI..."
                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
                                        />
                                        <button onClick={() => handleDeleteRel(idx)} className="text-gray-500 hover:text-red-400 flex justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Relation Row */}
                            <div className="grid grid-cols-[1fr_1.5fr_30px] gap-2 items-center bg-gray-800/50 p-2 rounded border border-dashed border-gray-600 mt-2">
                                <input 
                                    type="text" 
                                    value={newRelLabel} 
                                    onChange={e => setNewRelLabel(e.target.value)} 
                                    placeholder="New Relation Label" 
                                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={newRelDesc} 
                                    onChange={e => setNewRelDesc(e.target.value)} 
                                    placeholder="Description..." 
                                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleAddRel()}
                                />
                                <button onClick={handleAddRel} disabled={!newRelLabel} className="text-green-500 hover:text-green-400 disabled:opacity-50 font-bold text-lg leading-none">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {/* Quick Schema Tag Picker (Only when NOT editing) */}
        {!isCollapsed && !isEditMode && schemaTags.length > 0 && (
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
