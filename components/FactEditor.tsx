import React, { useState, useEffect } from 'react';
import { Fact } from '../types';

interface FactEditorProps {
  factData: Partial<Fact>;
  onDataChange: (updatedData: Partial<Fact>) => void;
  onBlur?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement>;
}

const FactEditor: React.FC<FactEditorProps> = ({ factData, onDataChange, onBlur, nameInputRef }) => {
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    setTagsInput(factData.tags?.join(', ') || '');
  }, [factData.tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({ ...factData, [name]: value });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    onDataChange({ ...factData, tags });
  };

  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          ref={nameInputRef}
          type="text"
          name="name"
          value={factData.name || ''}
          onChange={handleInputChange}
          onBlur={onBlur}
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Type</label>
        <input
          type="text"
          name="type"
          value={factData.type || ''}
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
          value={factData.notes || ''}
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

export default FactEditor;
