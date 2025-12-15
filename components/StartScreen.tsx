
import React from 'react';
import { TapestryBanner, TextAnimator, AiDisclaimer, CreatorInfo } from './ModalComponents';
import { ModelMetadata } from '../types';

interface StartScreenProps {
  isDarkMode: boolean;
  persistence: {
    setIsCreateModelModalOpen: (open: boolean) => void;
    handleImportClick: (ref: React.RefObject<HTMLInputElement>) => void;
    modelsIndex: ModelMetadata[];
    handleLoadModel: (id: string) => void;
    setIsOpenModelModalOpen: (open: boolean) => void;
  };
  importFileRef: React.RefObject<HTMLInputElement>;
  onAbout: () => void;
  onUserGuide?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  isDarkMode,
  persistence,
  importFileRef,
  onAbout,
  onUserGuide
}) => {
  return (
    <div className={`w-full h-full relative overflow-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center space-y-4 w-full max-w-4xl flex flex-col items-center">
          <div className="flex items-center justify-center w-full"><TapestryBanner /></div>
          <div className="text-xl text-gray-400 font-light tracking-wide w-full min-w-0"><TextAnimator /></div>
        </div>



        {/* Desktop Controls */}
        <div className="hidden md:flex flex-wrap justify-center gap-8 mt-10 max-w-5xl">
          <button onClick={() => persistence.setIsCreateModelModalOpen(true)} className={`flex flex-col items-center justify-center w-56 h-56 border-2 rounded-2xl hover:border-blue-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all group ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <div className={`rounded-full p-4 mb-4 group-hover:bg-blue-900 group-hover:bg-opacity-30 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
            <span className={`text-xl font-semibold group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Create Model</span>
            <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Start a new blank canvas</span>
          </button>

          <button onClick={() => persistence.handleImportClick(importFileRef)} className={`flex flex-col items-center justify-center w-56 h-56 border-2 rounded-2xl hover:border-green-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 transition-all group ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <div className={`rounded-full p-4 mb-4 group-hover:bg-green-900 group-hover:bg-opacity-30 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
            <span className={`text-xl font-semibold group-hover:text-green-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Open Model</span>
            <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">Open a JSON file from Disk</span>
          </button>

          {persistence.modelsIndex.length > 0 && (
            <button onClick={() => persistence.setIsOpenModelModalOpen(true)} className={`relative flex flex-col items-center justify-center w-56 h-56 border-2 rounded-2xl hover:border-yellow-500 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20 transition-all group ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              <div className="absolute top-2 right-2 group/info">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-blue-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-xs rounded shadow-lg hidden group-hover/info:block z-10 pointer-events-none">
                  Models are auto saved to local storage in the browser. If a model hasn't been saved to disk since it was changed, it will appear in this list.
                </div>
              </div>
              <div className={`rounded-full p-4 mb-4 group-hover:bg-yellow-900 group-hover:bg-opacity-30 transition-colors ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </div>
              <span className={`text-xl font-semibold group-hover:text-yellow-500 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recovered Models</span>
              <span className="text-sm text-gray-500 mt-2 text-center px-4 group-hover:text-gray-400">{persistence.modelsIndex.length} recovered models available</span>
            </button>
          )}
        </div>

        {/* Mobile Message */}
        <div className="flex md:hidden flex-col items-center mt-8 p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-center max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tapestry Studio is designed for desktop use however you can browse the user guide.
          </p>
          {onUserGuide && (
            <button
              onClick={onUserGuide}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm w-full shadow-lg"
            >
              Browse User Guide
            </button>
          )}
        </div>

        <div className="w-full max-w-[600px] text-center space-y-4 mt-8">
          <p className="font-bold text-blue-400 text-xs md:text-base">This project is in Alpha release and is in active development.</p>
          <p className={`text-sm md:text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tapestry Studio is an AI-powered knowledge graph editor, creativity, and problem solving tool that brings together many Science, Engineering, Business, and Innovation tools and uses AI to bring them to life.</p>

          {/* Hide disclaimer on mobile to save space */}
          <div className="hidden md:block">
            <AiDisclaimer isDarkMode={isDarkMode} />
          </div>
        </div>


        <CreatorInfo className="mt-8" isDarkMode={isDarkMode} onAboutClick={onAbout} />
      </div>
    </div >
  );
};
