
import React, { useState, useEffect } from 'react';
import { Element } from '../types';

interface ElementEditorProps {
  elementData: Partial<Element>;
  onDataChange: (updatedData: Partial<Element>) => void;
  onBlur?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
}

const ElementEditor: React.FC<ElementEditorProps> = ({ elementData, onDataChange, onBlur, nameInputRef }) => {
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    setTagsInput(elementData.tags?.join(', ') || '');
  }, [elementData.tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({ ...elementData, [name]: value });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    onDataChange({ ...elementData, tags });
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
      <div>
        <label className="block text-sm font-medium">Tags (comma-separated)</label>
        <input
          type="text"
          name="tags"
          value={tagsInput}
          onChange={handleTagsChange}
          onBlur={onBlur}
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default ElementEditor;
