
import React, { useState, useEffect } from 'react';
import { ColorScheme } from '../types';

interface BulkEditToolbarProps {
  activeColorScheme: ColorScheme | undefined;
  tagsToAdd: string[];
  tagsToRemove: string[];
  onTagsToAddChange: (tags: string[]) => void;
  onTagsToRemoveChange: (tags: string[]) => void;
  isActive: boolean;
  onToggleActive: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const BulkEditToolbar: React.FC<BulkEditToolbarProps> = ({
  activeColorScheme,
  tagsToAdd,
  tagsToRemove,
  onTagsToAddChange,
  onTagsToRemoveChange,
  isActive,
  onToggleActive,
  isCollapsed,
  onToggle,
}) => {
  const [addInput, setAddInput] = useState('');
  const [removeInput, setRemoveInput] = useState('');
  const [focusedField, setFocusedField] = useState<'add' | 'remove'>('add');

  // Sync inputs with props
  useEffect(() => {
    setAddInput(tagsToAdd.join(', '));
  }, [tagsToAdd]);

  useEffect(() => {
    setRemoveInput(tagsToRemove.join(', '));
  }, [tagsToRemove]);

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddInput(e.target.value);
    const newTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    
    // Ensure tags in Add list are removed from Remove list
    const toRemoveSet = new Set(tagsToRemove.map(t => t.toLowerCase()));
    const filteredRemove = tagsToRemove.filter(t => !newTags.some(nt => nt.toLowerCase() === t.toLowerCase()));
    
    if (filteredRemove.length !== tagsToRemove.length) {
        onTagsToRemoveChange(filteredRemove);
    }
    onTagsToAddChange(newTags);
  };

  const handleRemoveInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemoveInput(e.target.value);
    const newTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);

    // Ensure tags in Remove list are removed from Add list
    const toAddSet = new Set(tagsToAdd.map(t => t.toLowerCase()));
    const filteredAdd = tagsToAdd.filter(t => !newTags.some(nt => nt.toLowerCase() === t.toLowerCase()));
    
    if (filteredAdd.length !== tagsToAdd.length) {
        onTagsToAddChange(filteredAdd);
    }
    onTagsToRemoveChange(newTags);
  };

  const toggleTag = (tag: string) => {
    if (focusedField === 'add') {
        // Toggle in Add list
        const lower = tagsToAdd.map(t => t.toLowerCase());
        let newAdd = [...tagsToAdd];
        
        if (lower.includes(tag.toLowerCase())) {
            newAdd = tagsToAdd.filter(t => t.toLowerCase() !== tag.toLowerCase());
        } else {
            newAdd.push(tag);
        }
        
        // Ensure removed from Remove list
        const newRemove = tagsToRemove.filter(t => t.toLowerCase() !== tag.toLowerCase());
        
        onTagsToAddChange(newAdd);
        if (newRemove.length !== tagsToRemove.length) onTagsToRemoveChange(newRemove);

    } else {
        // Toggle in Remove list
        const lower = tagsToRemove.map(t => t.toLowerCase());
        let newRemove = [...tagsToRemove];
        
        if (lower.includes(tag.toLowerCase())) {
            newRemove = tagsToRemove.filter(t => t.toLowerCase() !== tag.toLowerCase());
        } else {
            newRemove.push(tag);
        }
        
        // Ensure removed from Add list
        const newAdd = tagsToAdd.filter(t => t.toLowerCase() !== tag.toLowerCase());
        
        onTagsToRemoveChange(newRemove);
        if (newAdd.length !== tagsToAdd.length) onTagsToAddChange(newAdd);
    }
  };

  const schemaTags = activeColorScheme ? Object.keys(activeColorScheme.tagColors) : [];

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
        {/* Collapse Toggle */}
        <button 
            onClick={onToggle}
            className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1"
            title={isCollapsed ? "Expand Bulk Editor" : "Collapse Bulk Editor"}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11l2 2m-2-2l2 -2m-2 2l-2 2m2-2l-2 -2" />
            </svg>
            <span className="text-xs font-bold tracking-wider">BULK</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center gap-4 p-3 animate-fade-in bg-gray-800 h-20">
                
                {/* Inputs Area */}
                <div className="flex flex-col justify-center h-full w-64 space-y-2">
                    <div className="flex items-center">
                        <label className="w-24 text-[10px] text-green-400 font-bold uppercase tracking-wider text-right mr-2">Add Tags:</label>
                        <input 
                            type="text" 
                            value={addInput}
                            onChange={handleAddInputChange}
                            onFocus={() => setFocusedField('add')}
                            placeholder="Tags to add..."
                            className={`bg-gray-900 border rounded px-2 py-1 text-xs text-white focus:outline-none w-full ${focusedField === 'add' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-600'}`}
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="w-24 text-[10px] text-red-400 font-bold uppercase tracking-wider text-right mr-2">Remove Tags:</label>
                        <input 
                            type="text" 
                            value={removeInput}
                            onChange={handleRemoveInputChange}
                            onFocus={() => setFocusedField('remove')}
                            placeholder="Tags to remove..."
                            className={`bg-gray-900 border rounded px-2 py-1 text-xs text-white focus:outline-none w-full ${focusedField === 'remove' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'}`}
                        />
                    </div>
                </div>

                <div className="w-px h-12 bg-gray-600 mx-1"></div>

                {/* Activation Button */}
                <div className="flex flex-col items-center justify-center w-24">
                    <button
                        onClick={onToggleActive}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-lg mb-1 ${
                            isActive 
                            ? 'bg-pink-600 border-white scale-110 text-white animate-pulse' 
                            : 'bg-gray-700 border-gray-500 text-gray-400 hover:bg-gray-600 hover:text-white hover:border-white'
                        }`}
                        title={isActive ? "Bulk Mode Active: Click elements to apply changes" : "Activate Bulk Mode"}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-pink-400' : 'text-gray-500'}`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>
                
                {/* Status Text */}
                <div className="flex flex-col justify-center h-full w-32 text-[10px] font-bold uppercase tracking-wider text-center leading-tight border-l border-gray-600 pl-4">
                    {isActive ? (
                        <span className="text-green-400 animate-pulse">Click nodes to add/remove tags</span>
                    ) : (
                        <span className="text-gray-500">Set tags and activate to apply</span>
                    )}
                </div>

            </div>
        )}
      </div>
      
      {/* Quick Schema Tag Picker (Pills) - Overlay similar to SchemaToolbar */}
      {!isCollapsed && schemaTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pointer-events-auto pl-24 animate-fade-in-down max-w-[600px]">
                {schemaTags.map(tag => {
                    const inAdd = tagsToAdd.some(t => t.toLowerCase() === tag.toLowerCase());
                    const inRemove = tagsToRemove.some(t => t.toLowerCase() === tag.toLowerCase());
                    const color = activeColorScheme?.tagColors[tag];
                    
                    return (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`text-[10px] px-2.5 py-1 rounded-full border shadow-sm transition-all flex items-center gap-1.5 opacity-80 hover:opacity-100 bg-gray-800 text-gray-300 hover:scale-105 border-gray-600`}
                            style={{ 
                                borderLeftWidth: '4px',
                                borderLeftColor: color || undefined
                            }}
                            title={`Click to ${focusedField} this tag`}
                        >
                            <span>{tag}</span>
                            {inAdd && <span className="text-green-400 font-bold text-[9px]">+</span>}
                            {inRemove && <span className="text-red-400 font-bold text-[9px]">-</span>}
                        </button>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default BulkEditToolbar;
