

import React, { useState, useEffect } from 'react';

interface MarkdownPanelProps {
  initialText: string;
  onApply: (text: string) => void;
  onClose: () => void;
}

const MarkdownPanel: React.FC<MarkdownPanelProps> = ({ initialText, onApply, onClose }) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleApply = () => {
    onApply(text);
  };

  return (
    <div className="bg-gray-800 border-r border-gray-700 h-full w-1/3 max-w-lg flex-shrink-0 z-20 flex flex-col">
      <div className="p-6 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Markdown View</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-grow p-6 pt-0 flex flex-col">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full flex-grow bg-gray-900 border border-gray-600 rounded-md p-4 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Fact with spaces (Type):tag -[label]-> Another Fact\nFact A -[rel]-> Fact B; Fact C`}
          />
      </div>
      
      <div className="flex-shrink-0 p-6 flex justify-end items-center space-x-4">
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default MarkdownPanel;