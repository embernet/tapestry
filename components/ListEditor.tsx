
import React, { useState, useRef, useEffect } from 'react';

interface ListEditorProps {
  lists: Record<string, string[]>;
  descriptions?: Record<string, string>;
  onChange: (newLists: Record<string, string[]>) => void;
  onDescriptionChange?: (newDescriptions: Record<string, string>) => void;
  isDarkMode?: boolean;
  hideHeader?: boolean;
}

const ListEditor: React.FC<ListEditorProps> = ({ lists, descriptions, onChange, onDescriptionChange, isDarkMode = true, hideHeader = false }) => {
  const [newListKey, setNewListKey] = useState('');
  const [inputState, setInputState] = useState<Record<string, string>>({});
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
      if (focusTarget) {
          const element = inputRefs.current[focusTarget];
          if (element) {
              element.focus();
              setFocusTarget(null);
          }
      }
  }, [lists, focusTarget]);

  const handleCreateList = () => {
    if (newListKey.trim()) {
      const key = newListKey.trim();
      onChange({ ...lists, [key]: [] });
      setNewListKey('');
      setFocusTarget(key);
    }
  };

  const handleDeleteList = (key: string) => {
    const next = { ...lists };
    delete next[key];
    onChange(next);
    
    if (onDescriptionChange && descriptions) {
        const nextDesc = { ...descriptions };
        delete nextDesc[key];
        onDescriptionChange(nextDesc);
    }
    
    if (inputRefs.current[key]) delete inputRefs.current[key];
  };

  const handleAddItem = (listKey: string) => {
      const val = inputState[listKey]?.trim();
      if (val) {
          const currentList = lists[listKey] || [];
          if (!currentList.includes(val)) {
              onChange({ ...lists, [listKey]: [...currentList, val] });
          }
          setInputState({ ...inputState, [listKey]: '' });
          setFocusTarget(listKey);
      }
  };

  const handleRemoveItem = (listKey: string, item: string) => {
      const currentList = lists[listKey] || [];
      onChange({ ...lists, [listKey]: currentList.filter(i => i !== item) });
  };

  const handleInputChange = (listKey: string, val: string) => {
      setInputState({ ...inputState, [listKey]: val });
  };

  const handleDescriptionUpdate = (key: string, val: string) => {
      if (onDescriptionChange) {
          onDescriptionChange({ ...(descriptions || {}), [key]: val });
      }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, listKey: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAddItem(listKey);
      }
  };

  const inputBg = isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const keyBg = isDarkMode ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300';
  const containerBg = isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200';
  const labelColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const emptyTextColor = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const buttonHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200';
  const pillClass = isDarkMode 
    ? 'bg-gray-800 text-gray-300 border-gray-600' 
    : 'bg-white text-gray-700 border-gray-300';

  return (
    <div className={`space-y-2 ${hideHeader ? '' : `pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mt-2`}`}>
        {!hideHeader && <label className={`block text-sm font-bold uppercase tracking-wider ${labelColor}`}>Custom Lists</label>}
        
        <div className="space-y-3">
            {Object.entries(lists || {}).map(([key, items]) => {
                const listItems = items as string[];
                return (
                <div key={key} className={`rounded border ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'} p-2`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${keyBg}`}>
                            {key}
                        </div>
                        <button onClick={() => handleDeleteList(key)} className={`text-red-400 hover:text-red-300 p-1 rounded transition-colors ${buttonHover}`} title="Delete List">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Description Input (Schema Mode) */}
                    {onDescriptionChange && (
                        <input 
                            type="text" 
                            value={descriptions?.[key] || ''} 
                            onChange={(e) => handleDescriptionUpdate(key, e.target.value)}
                            placeholder="Description for AI (e.g. 'Key people involved')"
                            className={`w-full text-[10px] px-2 py-1 rounded border mb-2 focus:outline-none focus:border-blue-500 ${inputBg}`}
                        />
                    )}
                    
                    {/* Description Display (Element Mode - read only) */}
                    {!onDescriptionChange && descriptions?.[key] && (
                        <div className="text-[10px] text-gray-500 italic mb-2 px-1">{descriptions[key]}</div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                        {listItems.map((item, idx) => (
                            <span key={`${item}-${idx}`} className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${pillClass}`}>
                                {item}
                                <button onClick={() => handleRemoveItem(key, item)} className="hover:text-red-500 font-bold ml-0.5">×</button>
                            </span>
                        ))}
                        {listItems.length === 0 && <span className={`text-[10px] italic ${emptyTextColor}`}>Empty list</span>}
                    </div>

                    <div className="flex gap-1">
                        <input 
                            ref={el => { inputRefs.current[key] = el; }}
                            type="text" 
                            placeholder="Add item..." 
                            value={inputState[key] || ''} 
                            onChange={e => handleInputChange(key, e.target.value)} 
                            onKeyDown={e => handleInputKeyDown(e, key)}
                            className={`text-xs px-2 py-1 rounded flex-grow border focus:border-blue-500 focus:outline-none ${inputBg}`} 
                        />
                        <button 
                            onClick={() => handleAddItem(key)}
                            className={`text-blue-500 hover:text-blue-400 p-1 rounded border border-transparent hover:border-blue-500/30 transition-colors ${buttonHover}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h5V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )})}
            {(!lists || Object.keys(lists).length === 0) && (
                <p className={`text-xs italic ${emptyTextColor}`}>No lists defined.</p>
            )}
        </div>

        <div className={`flex gap-2 items-center mt-2 p-2 rounded border border-dashed ${containerBg}`}>
             <input 
                type="text" 
                placeholder="New List Name (e.g. Stakeholders)" 
                value={newListKey} 
                onChange={e => setNewListKey(e.target.value)} 
                className={`text-xs px-2 py-1.5 rounded flex-grow border focus:border-green-500 focus:outline-none placeholder-gray-500 ${inputBg}`} 
                onKeyDown={e => e.key === 'Enter' && handleCreateList()} 
            />
             <button 
                onClick={handleCreateList} 
                disabled={!newListKey.trim()} 
                className={`text-green-500 hover:text-green-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors ${buttonHover}`}
                title="Create New List"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    </div>
  );
};

export default ListEditor;