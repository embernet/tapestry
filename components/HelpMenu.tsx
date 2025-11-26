
import React from 'react';

interface HelpMenuProps {
  onClose: () => void;
  onAbout: () => void;
  onPatternGallery: () => void;
  onSelfTest: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ onClose, onAbout, onPatternGallery, onSelfTest }) => {
     return (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
            <button onClick={() => { onPatternGallery(); onClose(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Pattern Gallery</button>
            <button onClick={() => { onSelfTest(); onClose(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700">Run Self Test</button>
            <button onClick={() => { onAbout(); onClose(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">About Tapestry</button>
            <div className="border-t border-gray-700 my-1"></div>
            <a href="https://github.com/embernet/tapestry" target="_blank" rel="noopener noreferrer" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Documentation</a>
        </div>
     );
};
