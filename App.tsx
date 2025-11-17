

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Element, Relationship, ColorScheme, RelationshipDirection, ModelMetadata, PanelState } from './types';
import { DEFAULT_COLOR_SCHEMES } from './constants';
import GraphCanvas, { GraphCanvasRef } from './components/GraphCanvas';
import ElementDetailsPanel from './components/FactDetailsPanel';
import RelationshipDetailsPanel from './components/RelationshipDetailsPanel';
import AddRelationshipPanel from './components/AddRelationshipPanel';
import MarkdownPanel from './components/MarkdownPanel';
import FilterPanel from './components/FilterPanel';
// Fix: Changed to a named import to resolve module resolution error.
import { ReportPanel } from './components/ReportPanel';

/**
 * A simple UUID v4 generator.
 * This is used to avoid potential TypeScript typing issues with `crypto.randomUUID()`
 * across different environments and `tsconfig.json` settings.
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


// --- Storage Keys ---
const MODELS_INDEX_KEY = 'factWeaver_models_index';
const LAST_OPENED_MODEL_ID_KEY = 'factWeaver_last_opened_model_id';
const MODEL_DATA_PREFIX = 'factWeaver_model_data_';


// Helper Hook for detecting clicks outside an element
const useClickOutside = <T extends HTMLElement,>(ref: React.RefObject<T>, handler: (event: MouseEvent | TouchEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// --- Helper Components defined in App.tsx to reduce file count ---

// Node ContextMenu Component
interface ContextMenuProps {
  x: number;
  y: number;
  onAddRelationship: () => void;
  onDeleteElement: () => void;
  onClose: () => void;
}
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onAddRelationship, onDeleteElement, onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose);

  return (
    <div
      ref={menuRef}
      className="absolute bg-gray-800 border border-gray-600 rounded-md shadow-lg py-2 z-50 text-white"
      style={{ top: y, left: x }}
    >
      <button onClick={onAddRelationship} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">
        Add Relationship
      </button>
      <button onClick={onDeleteElement} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
        Delete Element
      </button>
    </div>
  );
};


// Canvas ContextMenu Component
interface CanvasContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onZoomToFit: () => void;
  onAutoLayout: () => void;
  onToggleReport: () => void;
  onToggleMarkdown: () => void;
  onToggleFilter: () => void;
  onOpenModel: () => void;
  onCreateModel: () => void;
  isReportOpen: boolean;
  isMarkdownOpen: boolean;
  isFilterOpen: boolean;
}
const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ x, y, onClose, onZoomToFit, onAutoLayout, onToggleReport, onToggleMarkdown, onToggleFilter, onOpenModel, onCreateModel, isReportOpen, isMarkdownOpen, isFilterOpen }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose);

  // Combine handlers with onClose to close the menu after an action
  const createHandler = (handler: () => void) => () => {
    handler();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute bg-gray-800 border border-gray-600 rounded-md shadow-lg py-2 z-50 text-white text-sm"
      style={{ top: y, left: x }}
    >
      <button onClick={createHandler(onZoomToFit)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Zoom to Fit</button>
      <button onClick={createHandler(onAutoLayout)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Auto-Layout</button>
      <div className="border-t border-gray-600 my-1"></div>
      <button onClick={createHandler(onToggleReport)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isReportOpen ? 'Hide' : 'Show'} Report View</button>
      <button onClick={createHandler(onToggleMarkdown)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isMarkdownOpen ? 'Hide' : 'Show'} Markdown View</button>
      <button onClick={createHandler(onToggleFilter)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">{isFilterOpen ? 'Hide' : 'Show'} Filter</button>
      <div className="border-t border-gray-600 my-1"></div>
      <button onClick={createHandler(onOpenModel)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Open Model...</button>
      <button onClick={createHandler(onCreateModel)} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Create New Model...</button>
    </div>
  );
};


// SettingsModal Component
interface SettingsModalProps {
  initialSchemes: ColorScheme[];
  initialActiveSchemeId: string | null;
  onSave: (schemes: ColorScheme[], activeSchemeId: string | null) => void;
  onClose: () => void;
}
const SettingsModal: React.FC<SettingsModalProps> = ({ initialSchemes, initialActiveSchemeId, onSave, onClose }) => {
  const [schemes, setSchemes] = useState<ColorScheme[]>(initialSchemes);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(initialActiveSchemeId);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

  const selectedScheme = useMemo(() => schemes.find(s => s.id === activeSchemeId), [schemes, activeSchemeId]);

  const handleCreateScheme = () => {
    const name = prompt('Enter new scheme name:');
    if (name) {
      const newScheme: ColorScheme = { id: generateUUID(), name, tagColors: {} };
      setSchemes(prev => [...prev, newScheme]);
      setActiveSchemeId(newScheme.id);
    }
  };
  
  const handleAddTag = () => {
    const trimmedNewTag = newTagName.trim();
    if (trimmedNewTag && selectedScheme) {
      const existingTags = Object.keys(selectedScheme.tagColors);
      if (existingTags.some(t => t.toLowerCase() === trimmedNewTag.toLowerCase())) {
        alert(`Tag "${trimmedNewTag}" already exists in this scheme.`);
        return;
      }
      handleTagColorChange(trimmedNewTag, '#ffffff');
      setNewTagName('');
    }
  };

  const handleTagColorChange = (tag: string, color: string) => {
    if (!activeSchemeId) return;
    setSchemes(prev => prev.map(s => 
      s.id === activeSchemeId 
        ? { ...s, tagColors: { ...s.tagColors, [tag]: color } } 
        : s
    ));
  };
  
  const handleTagDelete = (tag: string) => {
     if (!activeSchemeId) return;
     setSchemes(prev => prev.map(s => {
        if (s.id !== activeSchemeId) return s;
        const newTagColors = {...s.tagColors};
        delete newTagColors[tag];
        return { ...s, tagColors: newTagColors };
     }));
  };

  const handleStartEditingTag = (tag: string) => {
    setEditingTag(tag);
    setEditingTagName(tag);
  };

  const handleCancelEditing = () => {
    setEditingTag(null);
    setEditingTagName('');
  };

  const handleTagRename = () => {
    if (!activeSchemeId || !editingTag || !editingTagName.trim()) {
      handleCancelEditing();
      return;
    }

    const newTagName = editingTagName.trim();
    if (newTagName === editingTag) { // No change
      handleCancelEditing();
      return;
    }

    setSchemes(prev => prev.map(s => {
      if (s.id !== activeSchemeId) return s;

      const existingTags = Object.keys(s.tagColors).filter(t => t !== editingTag);
      if (existingTags.some(t => t.toLowerCase() === newTagName.toLowerCase())) {
        alert(`Tag "${newTagName}" already exists in this scheme.`);
        return s; // Abort change
      }

      const newTagColors = { ...s.tagColors };
      const color = newTagColors[editingTag];
      delete newTagColors[editingTag];
      newTagColors[newTagName] = color;
      
      return { ...s, tagColors: newTagColors };
    }));

    handleCancelEditing();
  };


  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl shadow-xl border border-gray-600">
        <h2 className="text-2xl font-bold mb-6 text-white">Color Schemes</h2>
        
        <div className="flex gap-4 items-center mb-6">
            <select
              value={activeSchemeId || ''}
              onChange={(e) => setActiveSchemeId(e.target.value)}
              className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={handleCreateScheme} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">New Scheme</button>
        </div>

        {selectedScheme && (
            <>
              <h3 className="text-xl font-semibold mb-4 text-white">Edit: {selectedScheme.name}</h3>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2 mb-6">
                {Object.entries(selectedScheme.tagColors).map(([tag, color]) => (
                  <div key={tag} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                    {editingTag === tag ? (
                      <input 
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        onBlur={handleTagRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTagRename();
                          if (e.key === 'Escape') handleCancelEditing();
                        }}
                        autoFocus
                        className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span 
                        onClick={() => handleStartEditingTag(tag)}
                        className="text-gray-300 font-mono cursor-pointer hover:text-white"
                      >
                        {tag}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleTagColorChange(tag, e.target.value)}
                          className="w-12 h-8 p-0 border-none rounded bg-transparent"
                        />
                        <button onClick={() => handleTagDelete(tag)} className="text-red-400 hover:text-red-300 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="New tag name..."
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleAddTag} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Add Tag</button>
              </div>
            </>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Cancel</button>
          <button onClick={() => onSave(schemes, activeSchemeId)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Save</button>
        </div>
      </div>
    </div>
  );
};


// CreateModelModal Component
interface CreateModelModalProps {
  onCreate: (name: string, description: string) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}
const CreateModelModal: React.FC<CreateModelModalProps> = ({ onCreate, onClose, isInitialSetup = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
    }
  };

  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, () => {
    if (!isInitialSetup) onClose?.();
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-lg shadow-xl border border-gray-600 text-white">
        <h2 className="text-2xl font-bold mb-6">{isInitialSetup ? 'Welcome to Tapestry' : 'Create New Model'}</h2>
        {isInitialSetup && <p className="text-gray-400 mb-6">To get started, please give your new knowledge graph a name.</p>}

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Model Name (e.g., Project Phoenix)"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          {!isInitialSetup && <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Cancel</button>}
          <button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150" disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
};

// OpenModelModal Component
interface OpenModelModalProps {
  models: ModelMetadata[];
  onLoad: (modelId: string) => void;
  onClose: () => void;
  onTriggerCreate: () => void;
}
const OpenModelModal: React.FC<OpenModelModalProps> = ({ models, onLoad, onClose, onTriggerCreate }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl shadow-xl border border-gray-600 text-white">
        <h2 className="text-2xl font-bold mb-6">Open Model</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {models.length > 0 ? (
            models.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(model => (
              <div key={model.id} onClick={() => onLoad(model.id)} className="bg-gray-700 p-4 rounded-lg hover:bg-blue-900 hover:bg-opacity-50 border border-transparent hover:border-blue-500 cursor-pointer transition">
                <h3 className="font-bold text-lg">{model.name}</h3>
                <p className="text-sm text-gray-400">{model.description || 'No description'}</p>
                <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(model.updatedAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No models found. Create one to get started!</p>
          )}
        </div>
        <div className="mt-8 flex justify-between items-center">
          <button onClick={onTriggerCreate} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Create New Model</button>
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">Close</button>
        </div>
      </div>
    </div>
  );
};


const generateMarkdownFromGraph = (elements: Element[], relationships: Relationship[]): string => {
  const elementMap = new Map(elements.map(f => [f.id, f]));
  const handledElementIds = new Set<string>();
  const lines: string[] = [];

  const formatElement = (element: Element) => {
    // Quote name if it contains characters that could be ambiguous for the parser.
    const needsQuotes = /[():]/.test(element.name);
    let str = needsQuotes ? `"${element.name}"` : element.name;

    if (element.type && element.type !== 'Default') {
      str += `(${element.type})`;
    }
    if (element.tags && element.tags.length > 0) {
      str += `:${element.tags.join(',')}`;
    }
    return str;
  };

  // Group relationships by source, label, and direction to handle one-to-many syntax
  const relGroups = new Map<string, string[]>(); // key: `sourceId:label:direction`, value: formatted target strings
  relationships.forEach(rel => {
      const source = elementMap.get(rel.source as string);
      const target = elementMap.get(rel.target as string);
      if (!source || !target) return;

      const key = `${source.id}:${rel.label}:${rel.direction}`;
      if (!relGroups.has(key)) {
          relGroups.set(key, []);
      }
      relGroups.get(key)!.push(formatElement(target));

      handledElementIds.add(source.id);
      handledElementIds.add(target.id);
  });

  relGroups.forEach((targetStrs, key) => {
      const [sourceId, label, direction] = key.split(':');
      const source = elementMap.get(sourceId)!;
      const sourceStr = formatElement(source);

      let connector = '';
      switch (direction as RelationshipDirection) {
        case RelationshipDirection.From:
          connector = ` <-[${label}]- `;
          break;
        case RelationshipDirection.None:
          connector = ` -[${label}]- `;
          break;
        case RelationshipDirection.To:
        default:
          connector = ` -[${label}]-> `;
          break;
      }
      lines.push(`${sourceStr}${connector}${targetStrs.join('; ')}`);
  });


  // Add elements that have no relationships
  elements.forEach(element => {
    if (!handledElementIds.has(element.id)) {
      lines.push(formatElement(element));
    }
  });

  return lines.join('\n');
};


// --- Main App Component ---

export default function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>(DEFAULT_COLOR_SCHEMES);
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(DEFAULT_COLOR_SCHEMES[0]?.id || null);


  const [modelsIndex, setModelsIndex] = useState<ModelMetadata[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  
  // UI State
  const [focusMode, setFocusMode] = useState<'narrow' | 'wide' | 'zoom'>('narrow');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number, y: number } | null>(null);

  const [panelState, setPanelState] = useState<PanelState>({
    view: 'details',
    sourceElementId: null,
    targetElementId: null,
    isNewTarget: false,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
  const [isOpenModelModalOpen, setIsOpenModelModalOpen] = useState(false);
  const [isMarkdownPanelOpen, setIsMarkdownPanelOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  
  const [tagFilter, setTagFilter] = useState<{ included: Set<string>, excluded: Set<string> }>({
    included: new Set(),
    excluded: new Set(),
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPhysicsModeActive, setIsPhysicsModeActive] = useState(false);
  const [originalElements, setOriginalElements] = useState<Element[] | null>(null);
  const graphCanvasRef = useRef<GraphCanvasRef>(null);

  const importFileRef = useRef<HTMLInputElement>(null);

  const currentModelName = useMemo(() => modelsIndex.find(m => m.id === currentModelId)?.name || 'Loading...', [modelsIndex, currentModelId]);

  // --- Filtering Logic ---
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    elements.forEach(element => {
      element.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [elements]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    elements.forEach(element => {
      element.tags.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return counts;
  }, [elements]);

  useEffect(() => {
    // This effect synchronizes the filter state with the available tags in the model.
    setTagFilter(prevFilter => {
        const allTagsSet = new Set(allTags);
        
        // Build a new included set. A tag is included if:
        // 1. It's a brand new tag (not in old included or old excluded sets).
        // 2. It's an existing tag and was already included.
        const newIncluded = new Set<string>();
        for (const tag of allTags) {
            const wasPreviouslyIncluded = prevFilter.included.has(tag);
            const wasPreviouslyExcluded = prevFilter.excluded.has(tag);
            if (wasPreviouslyIncluded) {
                newIncluded.add(tag);
            } else if (!wasPreviouslyExcluded) {
                // This is a new tag, or a tag that was previously un-included.
                // Default is to include it.
                newIncluded.add(tag);
            }
        }

        // Clean up excluded set for tags that no longer exist
        const newExcluded = new Set<string>();
        for (const tag of prevFilter.excluded) {
            if (allTagsSet.has(tag)) {
                newExcluded.add(tag);
            }
        }
        
        return { included: newIncluded, excluded: newExcluded };
    });
  }, [allTags]);


  const filteredElements = useMemo(() => {
    const { included, excluded } = tagFilter;
    if (excluded.size === 0 && included.size === allTags.length) {
      return elements;
    }
    return elements.filter(element => {
      // Rule 1: If an element has ANY excluded tag, it's hidden.
      if (element.tags.some(tag => excluded.has(tag))) {
        return false;
      }
      
      // Rule 2: If an element has no tags, it's visible.
      if (element.tags.length === 0) {
        return true; 
      }
      
      // Rule 3: If an element has tags, at least one must be in the included list.
      return element.tags.some(tag => included.has(tag));
    });
  }, [elements, tagFilter, allTags]);

  const filteredRelationships = useMemo(() => {
    const { included, excluded } = tagFilter;
    if (excluded.size === 0 && included.size === allTags.length) {
      return relationships;
    }
    const visibleElementIds = new Set(filteredElements.map(f => f.id));
    return relationships.filter(rel =>
      visibleElementIds.has(rel.source as string) && visibleElementIds.has(rel.target as string)
    );
  }, [relationships, filteredElements, tagFilter, allTags]);


  // --- Model Management ---

  const handleLoadModel = useCallback((modelId: string) => {
    const modelDataString = localStorage.getItem(`${MODEL_DATA_PREFIX}${modelId}`);
    if (modelDataString) {
      const data = JSON.parse(modelDataString);
      setElements(data.elements || data.facts || []); // data.facts for backward compatibility
      setRelationships(data.relationships || []);
      setColorSchemes(data.colorSchemes || DEFAULT_COLOR_SCHEMES);
      setActiveSchemeId(data.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null);
      setCurrentModelId(modelId);
      localStorage.setItem(LAST_OPENED_MODEL_ID_KEY, modelId);
      setIsOpenModelModalOpen(false);
      setTagFilter({ included: new Set(), excluded: new Set() }); // Reset filters on model load
    }
  }, []);

  // Initial load from localStorage
  useEffect(() => {
    if (!isInitialLoad) return;

    try {
      const indexStr = localStorage.getItem(MODELS_INDEX_KEY);
      const index = indexStr ? JSON.parse(indexStr) : [];
      setModelsIndex(index);
      
      if (index.length === 0) {
        setIsCreateModelModalOpen(true);
      } else {
        const lastId = localStorage.getItem(LAST_OPENED_MODEL_ID_KEY);
        const modelToLoad = index.find((m: ModelMetadata) => m.id === lastId) || index[0];
        if (modelToLoad) {
          handleLoadModel(modelToLoad.id);
        } else {
          setIsCreateModelModalOpen(true);
        }
      }
    } catch (error) {
        console.error("Failed to load models index:", error);
        setModelsIndex([]);
        setIsCreateModelModalOpen(true);
    }
    
    setIsInitialLoad(false);
  }, [isInitialLoad, handleLoadModel]);

  // BUG FIX: Centralized persistence for the models index.
  // This single effect is responsible for writing the index to localStorage,
  // preventing race conditions from multiple save points.
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem(MODELS_INDEX_KEY, JSON.stringify(modelsIndex));
    }
  }, [modelsIndex, isInitialLoad]);


  // Auto-save model data and update timestamp on any data change
  useEffect(() => {
    if (currentModelId && !isInitialLoad) {
      const modelData = { elements, relationships, colorSchemes, activeSchemeId };
      localStorage.setItem(`${MODEL_DATA_PREFIX}${currentModelId}`, JSON.stringify(modelData));

      // Update timestamp in the index state. The centralized effect will persist it.
      setModelsIndex(prevIndex => {
        const now = new Date().toISOString();
        return prevIndex.map(m =>
          m.id === currentModelId ? { ...m, updatedAt: now } : m
        );
      });
    }
  }, [elements, relationships, colorSchemes, activeSchemeId, currentModelId, isInitialLoad]);

  const handleCreateModel = useCallback((name: string, description: string) => {
    const now = new Date().toISOString();
    const newModel: ModelMetadata = {
      // FIX: Use a self-contained UUID generator to prevent environment-specific type errors.
      id: generateUUID(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };

    setModelsIndex(prevIndex => [...prevIndex, newModel]);

    const newModelData = {
      elements: [],
      relationships: [],
      colorSchemes: DEFAULT_COLOR_SCHEMES,
      activeSchemeId: DEFAULT_COLOR_SCHEMES[0]?.id || null,
    };
    localStorage.setItem(`${MODEL_DATA_PREFIX}${newModel.id}`, JSON.stringify(newModelData));

    handleLoadModel(newModel.id);
    setIsCreateModelModalOpen(false);
  }, [handleLoadModel]);
  

  const handleAddElement = useCallback((coords: { x: number; y: number; }) => {
    const now = new Date().toISOString();
    const newElement: Element = {
      id: generateUUID(),
      name: 'New Element',
      type: 'Default',
      notes: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      x: coords.x,
      y: coords.y,
      fx: coords.x,
      fy: coords.y,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setSelectedRelationshipId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  }, []);

  const handleUpdateElement = useCallback((updatedElement: Element) => {
    setElements(prev => prev.map(f => f.id === updatedElement.id ? { ...updatedElement, updatedAt: new Date().toISOString() } : f));
  }, []);
  
  const handleDeleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(f => f.id !== elementId));
    setRelationships(prev => prev.filter(r => r.source !== elementId && r.target !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const handleAddRelationship = useCallback((relationship: Omit<Relationship, 'id' | 'tags'>, newElementData?: Omit<Element, 'id' | 'createdAt' | 'updatedAt'>) => {
    let finalRelationship: Relationship = { ...relationship, id: generateUUID(), tags: [] };

    if (newElementData) {
      const now = new Date().toISOString();
      const newElement: Element = {
        ...newElementData,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setElements(prev => [...prev, newElement]);
      finalRelationship.target = newElement.id;
    }
    
    setRelationships(prev => [...prev, finalRelationship]);
    setSelectedElementId(panelState.sourceElementId || null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  }, [panelState.sourceElementId]);

  const handleCancelAddRelationship = useCallback(() => {
    // If we were cancelling the creation of a relationship to a NEW element,
    // delete that newly created (and now orphaned) element.
    if (panelState.isNewTarget && panelState.targetElementId) {
      handleDeleteElement(panelState.targetElementId);
    }
    
    // Return to showing the details of the original source element.
    setSelectedElementId(panelState.sourceElementId || null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
  }, [panelState, handleDeleteElement]);

  const handleUpdateRelationship = useCallback((updatedRelationship: Relationship) => {
    setRelationships(prev => prev.map(r => r.id === updatedRelationship.id ? updatedRelationship : r));
  }, []);
  
  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    setSelectedRelationshipId(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!currentModelId) {
        alert("No active model to export.");
        return;
    }
    const modelMetadata = modelsIndex.find(m => m.id === currentModelId);

    if (!modelMetadata) {
        alert("Could not find model metadata to export.");
        return;
    }

    // Use current state as the source of truth for the export
    const exportData = {
        metadata: modelMetadata,
        data: {
            elements,
            relationships,
            colorSchemes,
            activeSchemeId,
        },
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelMetadata.name.replace(/ /g, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentModelId, modelsIndex, elements, relationships, colorSchemes, activeSchemeId]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const imported = JSON.parse(text);

            if (!imported.metadata || !imported.metadata.name || !imported.data || (!Array.isArray(imported.data.elements) && !Array.isArray(imported.data.facts)) || !Array.isArray(imported.data.relationships)) {
                throw new Error('Invalid file format. The file must be a valid Tapestry export.');
            }
            
            let modelName = imported.metadata.name;
            // Handle potential name collisions by suggesting a new name
            if (modelsIndex.some(m => m.name === modelName)) {
                modelName = `${modelName} (Imported)`;
            }
            let i = 1;
            let finalModelName = modelName;
            while(modelsIndex.some(m => m.name === finalModelName)) {
                i++;
                finalModelName = `${modelName} ${i}`;
            }

            if (window.confirm(`This will create a new model named "${finalModelName}". Proceed?`)) {
                const now = new Date().toISOString();
                const newModelId = generateUUID();
                
                const newMetadata: ModelMetadata = {
                    id: newModelId,
                    name: finalModelName,
                    description: imported.metadata.description || '',
                    createdAt: now,
                    updatedAt: now,
                };

                const newModelData = {
                    elements: imported.data.elements || imported.data.facts || [],
                    relationships: imported.data.relationships || [],
                    colorSchemes: imported.data.colorSchemes || DEFAULT_COLOR_SCHEMES,
                    activeSchemeId: imported.data.activeSchemeId || DEFAULT_COLOR_SCHEMES[0]?.id || null,
                };
                
                setModelsIndex(prev => [...prev, newMetadata]);
                localStorage.setItem(`${MODEL_DATA_PREFIX}${newModelId}`, JSON.stringify(newModelData));
                
                handleLoadModel(newModelId);

                alert(`Successfully imported model "${finalModelName}".`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            alert(`Failed to import file: ${message}`);
            console.error("Import failed:", error);
        } finally {
            if (importFileRef.current) importFileRef.current.value = '';
        }
    };
    reader.readAsText(file);
  }, [modelsIndex, handleLoadModel]);
  
  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const closeCanvasContextMenu = useCallback(() => setCanvasContextMenu(null), []);

  const handleNodeClick = useCallback((elementId: string) => {
    setSelectedElementId(elementId);
    setSelectedRelationshipId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    closeContextMenu();
  }, [closeContextMenu]);
  
  const handleLinkClick = useCallback((relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
    setSelectedElementId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    closeContextMenu();
  }, [closeContextMenu]);

  const handleCanvasClick = useCallback(() => {
    setSelectedElementId(null);
    setSelectedRelationshipId(null);
    setPanelState({ view: 'details', sourceElementId: null, targetElementId: null, isNewTarget: false });
    closeContextMenu();
    closeCanvasContextMenu();
  }, [closeContextMenu, closeCanvasContextMenu]);
  
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, elementId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, elementId });
    closeCanvasContextMenu();
  }, [closeCanvasContextMenu]);
  
  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setCanvasContextMenu({ x: event.clientX, y: event.clientY });
    closeContextMenu();
  }, [closeContextMenu]);

  const handleNodeConnect = useCallback((sourceId: string, targetId: string) => {
    setPanelState({ view: 'addRelationship', sourceElementId: sourceId, targetElementId: targetId, isNewTarget: false });
    setSelectedElementId(null);
    setSelectedRelationshipId(null);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleNodeConnectToNew = useCallback((sourceId: string, coords: { x: number, y: number }) => {
    const now = new Date().toISOString();
    const newElement: Element = {
      id: generateUUID(),
      name: 'New Element',
      type: 'Default',
      notes: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      x: coords.x,
      y: coords.y,
      fx: coords.x,
      fy: coords.y,
    };
    setElements(prev => [...prev, newElement]);
    
    // Open the relationship panel with the new element as the target
    setPanelState({ view: 'addRelationship', sourceElementId: sourceId, targetElementId: newElement.id, isNewTarget: true });
    setSelectedElementId(null);
    setSelectedRelationshipId(null);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleToggleFocusMode = () => {
    setFocusMode(prev => {
      if (prev === 'narrow') return 'wide';
      if (prev === 'wide') return 'zoom';
      return 'narrow';
    });
  };

  const handleApplyMarkdown = (markdown: string) => {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');
    
    const parsedElements = new Map<string, { type: string, tags: string[] }>();
    const parsedRels: { sourceName: string, targetName: string, label: string, direction: RelationshipDirection }[] = [];

    const parseElementStr = (str: string) => {
        let workStr = str.trim();
        if (!workStr) return null;

        let name: string;
        let type = 'Default';
        let tags: string[] = [];

        // 1. Tags (parse from right)
        const lastColonIndex = workStr.lastIndexOf(':');
        const lastParenOpenIndex = workStr.lastIndexOf('(');
        if (lastColonIndex > lastParenOpenIndex) {
            const tagsStr = workStr.substring(lastColonIndex + 1);
            tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
            workStr = workStr.substring(0, lastColonIndex).trim();
        }

        // 2. Type (parse from right)
        if (workStr.endsWith(')')) {
            const openParenIndex = workStr.lastIndexOf('(');
            // Heuristic: if there is content before the opening parenthesis, it's a type.
            if (openParenIndex > -1 && workStr.substring(0, openParenIndex).trim().length > 0) {
                type = workStr.substring(openParenIndex + 1, workStr.length - 1).trim() || 'Default';
                workStr = workStr.substring(0, openParenIndex).trim();
            }
        }

        // 3. The rest is the name
        name = workStr;
        if (name.startsWith('"') && name.endsWith('"')) {
            name = name.substring(1, name.length - 1);
        }

        if (!name) return null;

        return { name, type, tags };
    };

    const updateParsedElement = (elementData: { name: string, type: string, tags: string[] }) => {
      const existing = parsedElements.get(elementData.name);
      if (existing) {
        const newType = elementData.type !== 'Default' ? elementData.type : existing.type;
        const newTags = [...new Set([...existing.tags, ...elementData.tags])];
        parsedElements.set(elementData.name, { type: newType, tags: newTags });
      } else {
        parsedElements.set(elementData.name, { type: elementData.type, tags: elementData.tags });
      }
    };

    for (const line of lines) {
      // Use a global regex to split by relationships, keeping the delimiters
      const relSeparatorRegex = /(<?-\[.*?]->?)/g;
      const parts = line.split(relSeparatorRegex);
      const tokens = parts.map(p => p.trim()).filter(Boolean);

      if (tokens.length === 0) continue;

      if (tokens.length === 1) { // It's a single element definition
          const element = parseElementStr(tokens[0]);
          if (element) {
              updateParsedElement(element);
          }
          continue;
      }

      // Process chains and one-to-many relationships
      let currentSourceElementStr = tokens.shift();
      while (tokens.length > 0) {
          const relStr = tokens.shift();
          const targetsStr = tokens.shift();
          if (!currentSourceElementStr || !relStr || !targetsStr) break;

          const sourceElementData = parseElementStr(currentSourceElementStr);
          if (!sourceElementData) {
              console.warn(`Could not parse source element: ${currentSourceElementStr}`);
              break;
          }
          updateParsedElement(sourceElementData);

          const singleRelRegex = /<?-\[(.*?)]->?/;
          const relMatch = relStr.match(singleRelRegex);
          if (!relMatch) {
              console.warn(`Could not parse relationship: ${relStr}`);
              break;
          }
          const label = relMatch[1];
          let direction = RelationshipDirection.None;
          if (relStr.startsWith('<-')) direction = RelationshipDirection.From;
          else if (relStr.endsWith('->')) direction = RelationshipDirection.To;

          // Handle one-to-many targets separated by semicolons
          const targetElementStrs = targetsStr.split(';').map(t => t.trim()).filter(Boolean);

          for (const targetElementStr of targetElementStrs) {
              const targetElementData = parseElementStr(targetElementStr);
              if (targetElementData) {
                  updateParsedElement(targetElementData);
                  parsedRels.push({ sourceName: sourceElementData.name, targetName: targetElementData.name, label, direction });
              } else {
                   console.warn(`Could not parse target element: ${targetElementStr}`);
              }
          }
          
          // The last target becomes the next source for chaining, but only if it's not a one-to-many relationship.
          if (targetElementStrs.length === 1) {
              currentSourceElementStr = targetElementStrs[0];
          } else {
              break; // Stop chaining after a one-to-many relationship to avoid ambiguity
          }
      }
    }

    const existingElementsByName = new Map(elements.map(f => [f.name, f]));
    const nextElements: Element[] = [];
    const nameToIdMap = new Map<string, string>();
    const newElementNames = new Set<string>();

    parsedElements.forEach(({ type, tags }, name) => {
        const existingElement = existingElementsByName.get(name);
        if (existingElement) {
            const updatedElement: Element = { ...existingElement, type, tags, updatedAt: new Date().toISOString() };
            nextElements.push(updatedElement);
            nameToIdMap.set(name, existingElement.id);
        } else {
            const now = new Date().toISOString();
            const newElement: Element = {
                id: generateUUID(),
                name, type, tags, notes: '',
                createdAt: now, updatedAt: now,
            };
            nextElements.push(newElement);
            nameToIdMap.set(name, newElement.id);
            newElementNames.add(name);
        }
    });

    const nextRelationships: Relationship[] = parsedRels.map(({ sourceName, targetName, label, direction }) => ({
        id: generateUUID(),
        source: nameToIdMap.get(sourceName)!,
        target: nameToIdMap.get(targetName)!,
        label, direction, tags: []
    }));
    
    // Position new elements
    let placedNewElementsCount = 0;
    const positionNewElements = () => {
        nextElements.forEach(element => {
            if (newElementNames.has(element.name) && element.x === undefined) {
                let connectedAnchor: Element | undefined;
                
                for (const rel of nextRelationships) {
                    let anchorId: string | undefined;
                    if (rel.source === element.id) anchorId = rel.target;
                    else if (rel.target === element.id) anchorId = rel.source;

                    if (anchorId) {
                       const potentialAnchor = nextElements.find(f => f.id === anchorId && f.x !== undefined);
                       if (potentialAnchor) {
                           connectedAnchor = potentialAnchor;
                           break;
                       }
                    }
                }

                if (connectedAnchor && connectedAnchor.x && connectedAnchor.y) {
                    element.x = connectedAnchor.x + (Math.random() - 0.5) * 300;
                    element.y = connectedAnchor.y + (Math.random() - 0.5) * 300;
                } else {
                    element.x = 200 + (placedNewElementsCount * 50);
                    element.y = 200 + (placedNewElementsCount * 50);
                    placedNewElementsCount++;
                }
                element.fx = element.x;
                element.fy = element.y;
            }
        });
    }
    
    // Position multiple times to resolve chains of new elements
    positionNewElements();
    positionNewElements();

    setElements(nextElements);
    setRelationships(nextRelationships);
    setIsMarkdownPanelOpen(false);
  };
  
  const handleStartPhysicsLayout = () => {
    setOriginalElements(elements);
    // Unpin all nodes to let the simulation run freely at the start
    setElements(prev => prev.map(f => ({ ...f, fx: null, fy: null })));
    setIsPhysicsModeActive(true);
  };

  const handleAcceptLayout = () => {
    const finalPositions = graphCanvasRef.current?.getFinalNodePositions();
    if (finalPositions) {
      const positionsMap = new Map(finalPositions.map(p => [p.id, p]));
      // Apply the final positions from the simulation as fixed positions
      setElements(prev => prev.map(element => {
        const pos = positionsMap.get(element.id);
        return pos ? { ...element, x: pos.x, y: pos.y, fx: pos.x, fy: pos.y } : element;
      }));
    }
    setIsPhysicsModeActive(false);
    setOriginalElements(null);
  };

  const handleRejectLayout = () => {
    if (originalElements) {
      setElements(originalElements); // Revert to the original element positions
    }
    setIsPhysicsModeActive(false);
    setOriginalElements(null);
  };

  const handleZoomToFit = () => {
    graphCanvasRef.current?.zoomToFit();
  };


  const selectedElement = useMemo(() => elements.find(f => f.id === selectedElementId), [elements, selectedElementId]);
  const selectedRelationship = useMemo(() => relationships.find(r => r.id === selectedRelationshipId), [relationships, selectedRelationshipId]);
  const addRelationshipSourceElement = useMemo(() => elements.find(f => f.id === panelState.sourceElementId), [elements, panelState.sourceElementId]);
  const activeColorScheme = useMemo(() => colorSchemes.find(s => s.id === activeSchemeId), [colorSchemes, activeSchemeId]);

  if (isInitialLoad && !isCreateModelModalOpen) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  const focusButtonTitle = () => {
    if (focusMode === 'narrow') return 'Switch to Wide Focus';
    if (focusMode === 'wide') return 'Switch to Zoom Focus';
    return 'Switch to Narrow Focus';
  };


  return (
    <div className="w-screen h-screen overflow-hidden flex relative">
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />
      <div className="absolute top-4 left-4 z-10 bg-gray-800 bg-opacity-80 p-2 rounded-lg flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8c2-2 4-2 6 0s4 2 6 0" />
                <path d="M4 12c2-2 4-2 6 0s4 2 6 0" />
                <path d="M4 16c2-2 4-2 6 0s4 2 6 0" />
            </svg>
            <span className="text-xl font-bold">Tapestry</span>
        </div>
        <div className="border-l border-gray-600 h-6 mx-1"></div>
        <button onClick={() => setIsOpenModelModalOpen(true)} title="Open Model" className="p-2 rounded-md hover:bg-gray-700 transition">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
        </button>
        <button onClick={() => importFileRef.current?.click()} title="Import" className="p-2 rounded-md hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        </button>
        <button onClick={handleExport} title="Export" className="p-2 rounded-md hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
        <button onClick={() => setIsSettingsModalOpen(true)} title="Settings" className="p-2 rounded-md hover:bg-gray-700 transition">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <button onClick={() => setIsFilterPanelOpen(prev => !prev)} title="Filter by Tag" className="p-2 rounded-md hover:bg-gray-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        <button onClick={handleToggleFocusMode} title={focusButtonTitle()} className="p-2 rounded-md hover:bg-gray-700 transition">
            {focusMode === 'narrow' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
            {focusMode === 'wide' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
            )}
            {focusMode === 'zoom' && (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6V2h4 M22 6V2h-4 M2 18v4h4 M22 18v4h-4" />
                </svg>
            )}
        </button>
        <button onClick={() => setIsMarkdownPanelOpen(prev => !prev)} title="Markdown View" className="p-2 rounded-md hover:bg-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
        <button onClick={() => setIsReportPanelOpen(prev => !prev)} title="Report View" className="p-2 rounded-md hover:bg-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </button>
        <button onClick={handleZoomToFit} title="Zoom to Fit" className="p-2 rounded-md hover:bg-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
        </button>
         <div className="bg-gray-700 rounded-md flex">
            {!isPhysicsModeActive ? (
                <button onClick={handleStartPhysicsLayout} title="Auto-Layout" className="p-2 hover:bg-gray-600 rounded-md transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="none">
                        <circle cx="6" cy="18" r="3" fill="currentColor" />
                        <circle cx="18" cy="6" r="3" fill="currentColor" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M 8 16 Q 4 12, 12 12 T 16 8" />
                    </svg>
                </button>
            ) : (
                <div className="flex items-center">
                    <button onClick={handleAcceptLayout} title="Accept Layout" className="p-2 hover:bg-gray-600 rounded-md transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button onClick={handleRejectLayout} title="Reject Layout" className="p-2 hover:bg-gray-600 rounded-md transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
        <div className="border-l border-gray-600 h-6 mx-2"></div>
        <span className="text-gray-400 text-sm font-semibold pr-2">Current Model: {currentModelName}</span>
      </div>

      {isFilterPanelOpen && (
        <FilterPanel
            allTags={allTags}
            tagCounts={tagCounts}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            onClose={() => setIsFilterPanelOpen(false)}
        />
      )}
      
      {isMarkdownPanelOpen && (
        <MarkdownPanel
            initialText={generateMarkdownFromGraph(elements, relationships)}
            onApply={handleApplyMarkdown}
            onClose={() => setIsMarkdownPanelOpen(false)}
        />
      )}

      {currentModelId ? (
        <GraphCanvas
          ref={graphCanvasRef}
          elements={filteredElements}
          relationships={filteredRelationships}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onCanvasClick={handleCanvasClick}
          onCanvasDoubleClick={handleAddElement}
          onNodeContextMenu={handleNodeContextMenu}
          onCanvasContextMenu={handleCanvasContextMenu}
          onNodeConnect={handleNodeConnect}
          onNodeConnectToNew={handleNodeConnectToNew}
          activeColorScheme={activeColorScheme}
          selectedElementId={selectedElementId}
          selectedRelationshipId={selectedRelationshipId}
          focusMode={focusMode}
          setElements={setElements}
          isPhysicsModeActive={isPhysicsModeActive}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
             {/* This space is intentionally left blank for the initial modal */}
        </div>
      )}
      
      <div className="flex-shrink-0 z-20">
        {panelState.view === 'addRelationship' && addRelationshipSourceElement ? (
            <AddRelationshipPanel
            sourceElement={addRelationshipSourceElement}
            targetElementId={panelState.targetElementId}
            isNewTarget={panelState.isNewTarget}
            allElements={elements}
            onCreate={handleAddRelationship}
            onUpdateElement={handleUpdateElement}
            onCancel={handleCancelAddRelationship}
            />
        ) : selectedRelationship ? (
            <RelationshipDetailsPanel
                relationship={selectedRelationship}
                elements={elements}
                onUpdate={handleUpdateRelationship}
                onDelete={handleDeleteRelationship}
            />
        ) : (
            <ElementDetailsPanel
                element={selectedElement}
                onUpdate={handleUpdateElement}
                onDelete={handleDeleteElement}
            />
        )}
      </div>

      {isReportPanelOpen && (
          <ReportPanel
              elements={filteredElements}
              relationships={filteredRelationships}
              onClose={() => setIsReportPanelOpen(false)}
              onNodeClick={handleNodeClick}
          />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onAddRelationship={() => {
            setPanelState({ view: 'addRelationship', sourceElementId: contextMenu.elementId, targetElementId: null, isNewTarget: false });
            setSelectedElementId(null);
            setSelectedRelationshipId(null);
            closeContextMenu();
          }}
          onDeleteElement={() => {
             handleDeleteElement(contextMenu.elementId);
             closeContextMenu();
          }}
        />
      )}

      {canvasContextMenu && (
        <CanvasContextMenu
            x={canvasContextMenu.x}
            y={canvasContextMenu.y}
            onClose={closeCanvasContextMenu}
            onZoomToFit={handleZoomToFit}
            onAutoLayout={handleStartPhysicsLayout}
            onToggleReport={() => setIsReportPanelOpen(p => !p)}
            onToggleMarkdown={() => setIsMarkdownPanelOpen(p => !p)}
            onToggleFilter={() => setIsFilterPanelOpen(p => !p)}
            onOpenModel={() => setIsOpenModelModalOpen(true)}
            onCreateModel={() => setIsCreateModelModalOpen(true)}
            isReportOpen={isReportPanelOpen}
            isMarkdownOpen={isMarkdownPanelOpen}
            isFilterOpen={isFilterPanelOpen}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal 
          initialSchemes={colorSchemes}
          initialActiveSchemeId={activeSchemeId}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(newSchemes, newActiveId) => {
            setColorSchemes(newSchemes);
            setActiveSchemeId(newActiveId);
            setIsSettingsModalOpen(false);
          }}
        />
      )}

      {isCreateModelModalOpen && (
        <CreateModelModal
          onCreate={handleCreateModel}
          onClose={() => setIsCreateModelModalOpen(false)}
          isInitialSetup={!modelsIndex || modelsIndex.length === 0}
        />
      )}

      {isOpenModelModalOpen && (
        <OpenModelModal
          models={modelsIndex}
          onLoad={handleLoadModel}
          onClose={() => setIsOpenModelModalOpen(false)}
          onTriggerCreate={() => {
            setIsOpenModelModalOpen(false);
            setIsCreateModelModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
