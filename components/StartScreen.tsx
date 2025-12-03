
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
}

export const StartScreen: React.FC<StartScreenProps> = ({
  isDarkMode,
  persistence,
  importFileRef,
  onAbout
}) => {
  return (
    <div className={`w-full h-full flex-col items-center justify-center space-y-10 p-8 flex relative ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4"><TapestryBanner /></div>
        <div className="text-xl text-gray-400 font-light tracking-wide min-w-[300px]"><TextAnimator /></div>
      </div>
      <div className="flex space-x-8">
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
      </div>
      <div className="w-[600px] text-center space-y-4">
        <p className="font-bold text-blue-400">This project is in Alpha release and is in active development.</p>
        <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tapestry Studio is an AI-powered knowledge graph editor, creativity, and problem solving tool that brings together many Science, Engineering, Business, and Innovation tools and uses AI to bring them to life.</p>
        <AiDisclaimer isDarkMode={isDarkMode} />
      </div>
      {persistence.modelsIndex.length > 0 && (
        <div className="mt-4 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4 px-2"><h3 className="text-lg font-semibold text-gray-400">Recent Models (Recovered)</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {persistence.modelsIndex.slice(0, 4).map(model => (
              <button key={model.id} onClick={() => persistence.handleLoadModel(model.id)} className={`border p-4 rounded-lg text-left transition group flex flex-col ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                <span className={`font-medium group-hover:text-blue-400 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{model.name}</span>
                <span className="text-xs text-gray-500 mt-1">Last updated: {new Date(model.updatedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
          <div className="text-center mt-4"><button onClick={() => persistence.setIsOpenModelModalOpen(true)} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">View All Recovered Models</button></div>
        </div>
      )}
      <CreatorInfo className="mt-8" isDarkMode={isDarkMode} onAboutClick={onAbout} />
    </div>
  );
};
