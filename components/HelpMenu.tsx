
import React from 'react';

interface HelpMenuProps {
  onClose: () => void;
  onAbout: () => void;
  onPatternGallery: () => void;
  onUserGuide: () => void;
  onSelfTest?: () => void;
  isDarkMode: boolean;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ onClose, onAbout, onPatternGallery, onUserGuide, onSelfTest, isDarkMode }) => {
     const bgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
     const textClass = isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black';
     const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
     const dividerClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

     return (
        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border ${bgClass}`}>
            <button onClick={() => { onUserGuide(); onClose(); }} className={`block w-full text-left px-4 py-2 text-sm font-bold text-blue-400 ${hoverClass} ${isDarkMode ? 'hover:text-white' : ''}`}>User Guide</button>
            <div className={`border-t ${dividerClass} my-1`}></div>
            <button onClick={() => { onPatternGallery(); onClose(); }} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>Pattern Gallery</button>
            <button onClick={() => { onAbout(); onClose(); }} className={`block w-full text-left px-4 py-2 text-sm ${textClass} ${hoverClass}`}>About Tapestry Studio</button>
            {onSelfTest && (
                <>
                    <div className={`border-t ${dividerClass} my-1`}></div>
                    {/* Do not remove this from here even though it is also in the system menu. */}
                    <button onClick={() => { onSelfTest(); onClose(); }} className={`block w-full text-left px-4 py-2 text-sm text-green-500 hover:text-green-400 ${hoverClass}`}>Run Self Test</button>
                </>
            )}
        </div>
     );
};
