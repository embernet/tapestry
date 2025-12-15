
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ColorScheme, Element, RelationshipDefinition } from '../types';
import { generateUUID } from '../utils';
import { DEFAULT_COLOR_SCHEMES } from '../constants';
import ListEditor from './ListEditor';

interface SchemaToolbarProps {
    schemes: ColorScheme[];
    activeSchemeId: string | null;
    onSchemeChange: (id: string) => void;
    activeColorScheme: ColorScheme | undefined;
    onDefaultRelationshipChange: (label: string) => void;
    defaultTags: string[]; // This is the global/override tags
    onDefaultTagsChange: (tags: string[]) => void;
    defaultRelationOverride: string | null;
    onDefaultRelationOverrideChange: (label: string | null) => void;
    elements: Element[];
    isCollapsed: boolean;
    onToggle: () => void;
    onUpdateSchemes: (newSchemes: ColorScheme[]) => void;
    isQuickDefaultsOpen: boolean;
    setIsQuickDefaultsOpen: (isOpen: boolean) => void;
    isDarkMode: boolean;
}

const SchemaToolbar: React.FC<SchemaToolbarProps> = ({
    schemes,
    activeSchemeId,
    onSchemeChange,
    activeColorScheme,
    onDefaultRelationshipChange,
    defaultTags,
    onDefaultTagsChange,
    defaultRelationOverride,
    onDefaultRelationOverrideChange,
    elements,
    isCollapsed,
    onToggle,
    onUpdateSchemes,
    isQuickDefaultsOpen,
    setIsQuickDefaultsOpen,
    isDarkMode
}) => {
    const [tagInput, setTagInput] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    // isQuickDefaultsOpen is now a prop
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- Editor State ---
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#cccccc');
    const [newTagDesc, setNewTagDesc] = useState('');

    const [newRelLabel, setNewRelLabel] = useState('');
    const [newRelDesc, setNewRelDesc] = useState('');

    // New state for Schema Defaults editing (inside edit panel)
    const [defaultTagInput, setDefaultTagInput] = useState('');

    const [editingSchemeId, setEditingSchemeId] = useState<string | null>(activeSchemeId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeSchemeId && !isEditMode) setEditingSchemeId(activeSchemeId);
    }, [activeSchemeId, isEditMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const editingScheme = useMemo(() => schemes.find(s => s.id === editingSchemeId), [schemes, editingSchemeId]);

    // Compute available schema tags for suggestions (from active scheme)
    const schemaTags = activeColorScheme ? Object.keys(activeColorScheme.tagColors) : [];
    const relationshipLabels = activeColorScheme?.relationshipDefinitions?.map(d => d.label) || [];

    // For editing schema defaults
    const editingSchemaTags = editingScheme ? Object.keys(editingScheme.tagColors) : [];
    const editingRelationshipLabels = editingScheme?.relationshipDefinitions?.map(d => d.label) || [];

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

    // Quick Defaults Tag Input
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

    const removeTag = (tag: string) => {
        onDefaultTagsChange(defaultTags.filter(t => t !== tag));
    };

    const toggleTag = (tag: string) => {
        if (defaultTags.includes(tag)) {
            onDefaultTagsChange(defaultTags.filter(t => t !== tag));
        } else {
            onDefaultTagsChange([...defaultTags, tag]);
        }
    };

    const handleClearQuickDefaults = () => {
        onDefaultTagsChange([]);
        onDefaultRelationOverrideChange(null);
    };

    // --- Schema Editor Logic ---

    const updateScheme = (id: string, updates: Partial<ColorScheme>) => {
        const updatedSchemes = schemes.map(s => s.id === id ? { ...s, ...updates } : s);
        onUpdateSchemes(updatedSchemes);
    };

    // Schema Default Tags Logic
    const handleSchemaDefaultTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && editingScheme) {
            const val = defaultTagInput.trim();
            const currentDefaults = editingScheme.defaultTags || [];
            if (val && !currentDefaults.includes(val)) {
                updateScheme(editingScheme.id, { defaultTags: [...currentDefaults, val] });
                setDefaultTagInput('');
            }
        }
    };

    const removeSchemaDefaultTag = (tag: string) => {
        if (editingScheme && editingScheme.defaultTags) {
            updateScheme(editingScheme.id, { defaultTags: editingScheme.defaultTags.filter(t => t !== tag) });
        }
    };

    const handleCreateScheme = () => {
        const newId = generateUUID();
        const newScheme: ColorScheme = {
            id: newId,
            name: 'New Custom Schema',
            tagColors: { 'Idea': '#efef10' },
            tagDescriptions: { 'Idea': 'A generic concept or thought.' },
            relationshipDefinitions: [{ label: 'related to', description: 'A generic connection.' }],
            defaultRelationshipLabel: 'related to',
            defaultTags: [],
            customLists: {},
            customListDescriptions: {}
        };
        onUpdateSchemes([...schemes, newScheme]);
        setEditingSchemeId(newId);
        // Wait to switch until saved? Or switch immediately.
        // Usually creating implies switching context.
        onSchemeChange(newId);
        setIsEditMode(true);
        setIsQuickDefaultsOpen(false);
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

    // Custom Lists Operations
    const handleCustomListsChange = (newLists: Record<string, string[]>) => {
        if (editingSchemeId && editingScheme) {
            updateScheme(editingSchemeId, { customLists: newLists });
        }
    };

    const handleCustomListDescriptionsChange = (newDescriptions: Record<string, string>) => {
        if (editingSchemeId && editingScheme) {
            updateScheme(editingSchemeId, { customListDescriptions: newDescriptions });
        }
    };

    // Classes matching ScriptsToolbar for consistency
    const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
    const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
    const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
    const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
    const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const textHeader = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const textItem = isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black';
    const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

    const editPanelBg = isDarkMode ? 'bg-gray-900/95 border-gray-600' : 'bg-white/95 border-gray-200 shadow-lg';
    const editSubBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
    const editInputBg = isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';
    const selectBgClass = isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';
    const labelClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className="relative pointer-events-auto">
            <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />

            {/* Main Toggle Button */}
            <div className="relative">
                <button
                    onClick={onToggle}
                    className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-blue-500' : ''}`}
                    title={isCollapsed ? "Expand Schema Settings" : "Close Schema Settings"}
                >
                    <div className="relative w-8 h-8 flex items-center justify-center text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <span className={`text-xs font-bold tracking-wider ${textMain}`}>SCHEMAS</span>
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Dropdown Menu (Only shown if NOT in edit mode, or should edit mode replace it?) */}
                    {/* We'll hide the dropdown list if editing, to show the edit panel in its place (or next to it) */}
                    {!isEditMode && (
                        <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-[950] flex flex-col max-h-[70vh] animate-fade-in-down overflow-hidden ${dropdownBg}`}>

                            {/* Quick Defaults Header Item */}
                            <button
                                onClick={() => {
                                    setIsQuickDefaultsOpen(true);
                                    // Close dropdown
                                    onToggle();
                                }}
                                className={`flex items-start text-left p-4 border-b transition-colors group ${itemHover}`}
                            >
                                <div className="mr-3 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110 text-purple-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={`font-bold text-sm mb-0.5 ${textItem}`}>Quick Defaults</div>
                                    <p className={`text-xs leading-tight ${textDesc}`}>
                                        Override active schema settings correctly
                                    </p>
                                </div>
                            </button>

                            {/* Separator / Header */}
                            <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider text-center ${headerBg} ${textHeader}`}>
                                Available Schemas
                            </div>

                            {/* Schema List */}
                            <div className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-600">
                                {schemes.map(s => (
                                    <div
                                        key={s.id}
                                        className={`flex items-center justify-between p-3 border-b last:border-0 transition-colors group cursor-pointer ${itemHover} ${s.id === activeSchemeId ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}
                                        onClick={() => onSchemeChange(s.id)}
                                    >
                                        <div className="flex-grow min-w-0 pr-2">
                                            <div className={`font-bold text-sm mb-0.5 truncate ${textItem} ${s.id === activeSchemeId ? 'text-blue-500' : ''}`}>
                                                {s.name}
                                            </div>
                                            {s.id === activeSchemeId && (
                                                <span className="text-[10px] uppercase font-bold text-blue-500">Active</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSchemeChange(s.id); // Ensure active
                                                setEditingSchemeId(s.id);
                                                setIsEditMode(true);
                                            }}
                                            className={`p-1.5 rounded hover:bg-opacity-20 transition-colors ${isDarkMode ? 'hover:bg-white text-gray-500 hover:text-white' : 'hover:bg-black text-gray-400 hover:text-black'}`}
                                            title="Edit Schema"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className={`p-2 border-t ${headerBg}`}>
                                <button
                                    onClick={handleCreateScheme}
                                    className={`w-full text-center text-xs py-2 border border-dashed rounded opacity-60 hover:opacity-100 transition-opacity ${textDesc} border-current`}
                                >
                                    + Create New Schema
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Edit Panel (Positioned identically to dropdown but wider) */}
                    {isEditMode && editingScheme && (
                        <div className={`absolute top-full left-0 mt-2 w-[800px] rounded-lg shadow-2xl z-[950] animate-fade-in flex flex-col max-h-[80vh] overflow-hidden ${editPanelBg}`}>
                            {/* Edit Panel Content */}
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <h3 className={`font-bold uppercase tracking-wide flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                        Editing: <span className="text-blue-500">{editingScheme.name}</span>
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsEditMode(false)}
                                            className="px-3 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-grow overflow-y-auto p-4 space-y-4">

                                    {/* AI Info Bar */}
                                    <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded flex gap-3 items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className={`text-sm leading-tight ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                                            Edit schema definitions to guide the AI and enforce structure.
                                        </p>
                                    </div>

                                    {/* Schema Meta Controls & DEFAULTS */}
                                    <div className={`p-4 rounded border ${editSubBg}`}>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className={`text-xs font-bold uppercase block mb-1 ${labelClass}`}>Schema Name</label>
                                                <input
                                                    type="text"
                                                    value={editingScheme.name}
                                                    onChange={(e) => updateScheme(editingScheme.id, { name: e.target.value })}
                                                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold ${editInputBg}`}
                                                />
                                            </div>

                                            <div className="flex items-end gap-2 justify-end">
                                                <button
                                                    onClick={handleExportSchema}
                                                    className={`px-3 py-2 border rounded transition-colors h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300 hover:text-white' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-600'}`}
                                                    title="Export Schema JSON"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={handleImportClick}
                                                    className={`px-3 py-2 border rounded transition-colors h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300 hover:text-white' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-600'}`}
                                                    title="Import Schema JSON"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                </button>
                                                <button onClick={handleDeleteScheme} className="px-3 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded text-xs text-red-500 transition-colors whitespace-nowrap h-10">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Defaults Section */}
                                        <div className={`border-t pt-3 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                                            <h4 className={`text-xs font-bold uppercase mb-2 opacity-80 ${labelClass}`}>Schema Defaults</h4>
                                            <div className="flex gap-4 items-start">
                                                {/* Default Relation */}
                                                <div>
                                                    <label className={`text-[10px] block mb-1 ${labelClass}`}>Default Link Label</label>
                                                    <select
                                                        value={editingScheme.defaultRelationshipLabel || ''}
                                                        onChange={(e) => updateScheme(editingScheme.id, { defaultRelationshipLabel: e.target.value })}
                                                        className={`border rounded px-2 py-1 text-xs w-48 ${selectBgClass}`}
                                                    >
                                                        <option value="">-- None --</option>
                                                        {editingRelationshipLabels.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>

                                                {/* Default Tags */}
                                                <div className="flex-grow">
                                                    <label className={`text-[10px] block mb-1 ${labelClass}`}>Default Tags</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={defaultTagInput}
                                                            onChange={(e) => setDefaultTagInput(e.target.value)}
                                                            onKeyDown={handleSchemaDefaultTagKeyDown}
                                                            placeholder="Add default tag..."
                                                            className={`border rounded px-2 py-1 text-xs w-32 ${editInputBg}`}
                                                        />
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            {editingScheme.defaultTags?.map(tag => (
                                                                <span key={tag} className="flex items-center gap-1 bg-blue-600/20 text-blue-500 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                                                    {tag}
                                                                    <button onClick={() => removeSchemaDefaultTag(tag)} className="hover:text-red-400 font-bold ml-0.5">×</button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Tags Editor - Reused logic but cleaner wrapper */}
                                        <div className="flex flex-col gap-2">
                                            <h3 className={`text-sm font-bold uppercase tracking-wide border-b pb-2 mb-2 ${isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>
                                                Tag Definitions
                                            </h3>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.entries(editingScheme.tagColors).map(([tag, color]) => (
                                                    <div key={tag} className={`grid grid-cols-[30px_1fr_1.5fr_30px] gap-2 items-center p-2 rounded border ${editSubBg}`}>
                                                        <input type="color" value={color} onChange={(e) => updateScheme(editingScheme.id, { tagColors: { ...editingScheme.tagColors, [tag]: e.target.value } })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0" title="Tag Color" />
                                                        <div className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`} title={tag}>{tag}</div>
                                                        <input type="text" value={editingScheme.tagDescriptions?.[tag] || ''} onChange={(e) => updateScheme(editingScheme.id, { tagDescriptions: { ...editingScheme.tagDescriptions, [tag]: e.target.value } })} placeholder="Description..." className={`border rounded px-2 py-1 text-xs focus:outline-none ${editInputBg}`} />
                                                        <button onClick={() => handleDeleteTag(tag)} className="text-gray-500 hover:text-red-400 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Add Tag */}
                                            <div className={`grid grid-cols-[30px_1fr_1.5fr_30px] gap-2 items-center p-2 rounded border border-dashed mt-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0" />
                                                <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="New Tag" className={`border rounded px-2 py-1 text-xs focus:outline-none ${editInputBg}`} />
                                                <input type="text" value={newTagDesc} onChange={e => setNewTagDesc(e.target.value)} placeholder="Description..." className={`border rounded px-2 py-1 text-xs focus:outline-none ${editInputBg}`} onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                                                <button onClick={handleAddTag} disabled={!newTagName} className="text-green-500 hover:text-green-400 disabled:opacity-50 font-bold text-lg leading-none">+</button>
                                            </div>
                                        </div>

                                        {/* Relationships Editor */}
                                        <div className="flex flex-col gap-2">
                                            <h3 className={`text-sm font-bold uppercase tracking-wide border-b pb-2 mb-2 ${isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>
                                                Relationship Definitions
                                            </h3>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {editingScheme.relationshipDefinitions?.map((def, idx) => (
                                                    <div key={idx} className={`grid grid-cols-[1fr_1.5fr_30px] gap-2 items-center p-2 rounded border ${editSubBg}`}>
                                                        <div className={`font-bold text-sm truncate pl-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} title={def.label}>{def.label}</div>
                                                        <input type="text" value={def.description || ''} onChange={(e) => { const updated = [...(editingScheme.relationshipDefinitions || [])]; updated[idx] = { ...updated[idx], description: e.target.value }; updateScheme(editingScheme.id, { relationshipDefinitions: updated }); }} placeholder="Description..." className={`border rounded px-2 py-1 text-xs focus:outline-none ${editInputBg}`} />
                                                        <button onClick={() => handleDeleteRel(idx)} className="text-gray-500 hover:text-red-400 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Add Rel */}
                                            <div className={`grid grid-cols-[1fr_1.5fr_30px] gap-2 items-center p-2 rounded border border-dashed mt-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                <input type="text" value={newRelLabel} onChange={e => setNewRelLabel(e.target.value)} placeholder="New Link" className={`border rounded px-2 py-1 text-xs focus:outline-none ${editInputBg}`} />
                                                <input type="text" value={newRelDesc} onChange={e => setNewRelDesc(e.target.value)} placeholder="Description..." className={`border rounded px-2 py-1 text-xs focus:outline-none ${editInputBg}`} onKeyDown={e => e.key === 'Enter' && handleAddRel()} />
                                                <button onClick={handleAddRel} disabled={!newRelLabel} className="text-green-500 hover:text-green-400 disabled:opacity-50 font-bold text-lg leading-none">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Lists (Collapsed by default or small) */}
                                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-700/50">
                                        <h3 className={`text-sm font-bold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Custom Lists</h3>
                                        <div className="max-h-40 overflow-y-auto pr-2">
                                            <ListEditor lists={editingScheme.customLists || {}} descriptions={editingScheme.customListDescriptions || {}} onChange={handleCustomListsChange} onDescriptionChange={handleCustomListDescriptionsChange} isDarkMode={isDarkMode} hideHeader={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SchemaToolbar;