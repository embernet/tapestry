import React from 'react';

interface FilterPanelProps {
  allTags: string[];
  hiddenTags: Set<string>;
  onHiddenTagsChange: (newHiddenTags: Set<string>) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ allTags, hiddenTags, onHiddenTagsChange, onClose }) => {

  const handleToggleTag = (tag: string) => {
    const newHiddenTags = new Set(hiddenTags);
    if (newHiddenTags.has(tag)) {
      newHiddenTags.delete(tag);
    } else {
      newHiddenTags.add(tag);
    }
    onHiddenTagsChange(newHiddenTags);
  };

  const handleShowAll = () => {
    onHiddenTagsChange(new Set());
  };

  const handleHideAll = () => {
    onHiddenTagsChange(new Set(allTags));
  };
  
  return (
    <div className="bg-gray-800 border-r border-gray-700 h-full w-80 flex-shrink-0 z-20 flex flex-col">
      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Filter by Tags</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-shrink-0 px-6 pb-4 flex justify-between items-center space-x-2">
        <button onClick={handleShowAll} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-150">
          Show All
        </button>
        <button onClick={handleHideAll} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-150">
          Hide All
        </button>
      </div>

      <div className="flex-grow p-6 pt-0 overflow-y-auto">
        {allTags.length > 0 ? (
          <div className="space-y-3">
            {allTags.map(tag => (
              <label key={tag} className="flex items-center space-x-3 cursor-pointer text-white">
                <input
                  type="checkbox"
                  checked={!hiddenTags.has(tag)}
                  onChange={() => handleToggleTag(tag)}
                  className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="select-none">{tag}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No tags found in this model.</p>
        )}
      </div>

      <div className="flex-shrink-0 p-6 flex justify-end items-center">
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
