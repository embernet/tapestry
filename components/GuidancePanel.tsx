
import React from 'react';
import { GuidanceContent } from '../types';

interface GuidancePanelProps {
  content: GuidanceContent | null;
  onClose: () => void;
  isDarkMode: boolean;
}

export const GuidancePanel: React.FC<GuidancePanelProps> = ({ content, onClose, isDarkMode }) => {
  if (!content) return null;

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const headerClass = isDarkMode ? 'text-white border-gray-700 bg-gray-900' : 'text-gray-900 border-gray-200 bg-gray-50';
  const sectionTitleClass = isDarkMode ? 'text-blue-400' : 'text-blue-600';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
      <div className={`p-4 border-b flex-shrink-0 flex justify-between items-center ${headerClass}`}>
        <h2 className="text-xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            {content.title}
        </h2>
        <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className={`flex-grow overflow-y-auto p-6 space-y-6 ${textClass} text-sm leading-relaxed custom-scrollbar`}>
        {content.sections.map((section, idx) => (
            <div key={idx}>
                {section.title && <h3 className={`text-lg font-bold mb-3 ${sectionTitleClass}`}>{section.title}</h3>}
                {section.text && <p className="mb-3">{section.text}</p>}
                {section.items && (
                    <ul className="list-disc pl-5 space-y-2">
                        {section.items.map((item, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        ))}
                    </ul>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};
