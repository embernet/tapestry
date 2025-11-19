
import React, { useState, useEffect } from 'react';
import { Element } from '../types';

interface ElementEditorProps {
  elementData: Partial<Element>;
  onDataChange: (updatedData: Partial<Element>, immediate?: boolean) => void;
  onBlur?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
  suggestedTags?: string[];
}

const ElementEditor: React.FC<ElementEditorProps> = ({ elementData, onDataChange, onBlur, nameInputRef, suggestedTags = [] }) => {
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    setTagsInput(elementData.tags?.join(', ') || '');
  }, [elementData.tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({ ...elementData, [name]: value }, false);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    onDataChange({ ...elementData, tags }, false);
  };

  const toggleTag = (tag: string) => {
      const currentTags = elementData.tags || [];
      let newTags;
      // Check case-insensitive, but preserve case when adding
      const existingIndex = currentTags.findIndex(t => t.toLowerCase() === tag.toLowerCase());
      
      if (existingIndex >= 0) {
          newTags = currentTags.filter((_, i) => i !== existingIndex);
      } else {
          newTags = [...currentTags, tag];
      }
      
      // Immediate update for pill clicks
      onDataChange({ ...elementData, tags: newTags }, true);
  };

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
        <label className="block text-sm font-medium">Tags</label>
        <input
          type="text"
          name="tags"
          value={tagsInput}
          onChange={handleTagsChange}
          onBlur={onBlur}
          placeholder="Enter tags comma separated..."
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suggestedTags.length > 0 && (
            <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Schema Tags:</p>
                <div className="flex flex-wrap gap-1">
                    {suggestedTags.map(tag => {
                        const isSelected = (elementData.tags || []).some(t => t.toLowerCase() === tag.toLowerCase());
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                    isSelected 
                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
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
    </div>
  );
};

export default ElementEditor;
