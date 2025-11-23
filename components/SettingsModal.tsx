
import React, { useState, useRef, useEffect } from 'react';
import { SystemPromptConfig, GlobalSettings } from '../types';
import { AVAILABLE_AI_TOOLS, DEFAULT_SYSTEM_PROMPT_CONFIG } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'ai';
  globalSettings: GlobalSettings;
  onGlobalSettingsChange: (settings: GlobalSettings) => void;
  modelSettings: SystemPromptConfig;
  onModelSettingsChange: (settings: SystemPromptConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, initialTab = 'general', 
    globalSettings, onGlobalSettingsChange, 
    modelSettings, onModelSettingsChange 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>(initialTab);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (isOpen) {
          setActiveTab(initialTab);
      }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener('mousedown', listener);
    }
    return () => document.removeEventListener('mousedown', listener);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleModelSettingChange = (key: keyof SystemPromptConfig, value: any) => {
      onModelSettingsChange({ ...modelSettings, [key]: value });
  };

  const handleGlobalSettingChange = (key: keyof GlobalSettings, value: any) => {
      onGlobalSettingsChange({ ...globalSettings, [key]: value });
  };

  const toggleTool = (toolId: string) => {
      const current = modelSettings.enabledTools || [];
      let next;
      if (current.includes(toolId)) {
          next = current.filter(t => t !== toolId);
      } else {
          next = [...current, toolId];
      }
      handleModelSettingChange('enabledTools', next);
  };

  const handleResetDefaultPrompt = () => {
      if (confirm("Reset the core System Prompt to default?")) {
          handleModelSettingChange('defaultPrompt', DEFAULT_SYSTEM_PROMPT_CONFIG.defaultPrompt);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div ref={modalRef} className="bg-gray-800 rounded-lg w-full max-w-4xl shadow-xl border border-gray-600 text-white flex flex-col max-h-[90vh]">
        
        {/* Header & Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900 rounded-t-lg">
            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors ${activeTab === 'general' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    General Settings
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors ${activeTab === 'ai' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    AI Advisor
                </button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Application Preferences</h3>
                        <div className="flex items-center justify-between bg-gray-700 p-4 rounded border border-gray-600">
                            <div>
                                <div className="font-semibold text-gray-200">Tools Bar Open by Default</div>
                                <div className="text-xs text-gray-400">Automatically expand the tools panel when the application loads.</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={globalSettings.toolsBarOpenByDefault} 
                                    onChange={(e) => handleGlobalSettingChange('toolsBarOpenByDefault', e.target.checked)}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ai' && (
                <div className="space-y-8">
                    {/* Tool Awareness */}
                    <div className="bg-gray-700/50 p-4 rounded border border-gray-600">
                        <h3 className="text-md font-bold text-blue-300 mb-2">Tool Awareness</h3>
                        <p className="text-xs text-gray-400 mb-4">Select which tools the AI should know about and recommend during analysis.</p>
                        <div className="grid grid-cols-1 gap-3">
                            {AVAILABLE_AI_TOOLS.map(tool => (
                                <label key={tool.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded hover:bg-gray-700 transition border border-gray-600/50 bg-gray-800/50">
                                    <input 
                                        type="checkbox" 
                                        checked={(modelSettings.enabledTools || []).includes(tool.id)}
                                        onChange={() => toggleTool(tool.id)}
                                        className="mt-1 form-checkbox h-4 w-4 text-blue-600 rounded border-gray-500 bg-gray-800 focus:ring-blue-500 focus:ring-offset-gray-800 flex-shrink-0"
                                    />
                                    <div>
                                        <span className="text-sm font-bold text-gray-200 block">{tool.name}</span>
                                        <span className="text-xs text-gray-400 leading-relaxed">{tool.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Context & Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-green-400 uppercase tracking-wider">User Context</label>
                            <p className="text-xs text-gray-500">Provide background info the AI should always know (e.g., "I am a structural engineer", "This is for a fictional story").</p>
                            <textarea
                                value={modelSettings.userContext || ''}
                                onChange={(e) => handleModelSettingChange('userContext', e.target.value)}
                                placeholder="Enter context here..."
                                className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-purple-400 uppercase tracking-wider">Response Style</label>
                            <p className="text-xs text-gray-500">Direct how the AI should communicate (e.g., "Be concise", "Use Socratic questioning", "Explain like I'm 5").</p>
                            <textarea
                                value={modelSettings.responseStyle || ''}
                                onChange={(e) => handleModelSettingChange('responseStyle', e.target.value)}
                                placeholder="Enter style instructions here..."
                                className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <div>
                        <button 
                            onClick={() => setShowAdvancedPrompt(!showAdvancedPrompt)}
                            className="flex items-center text-xs text-gray-500 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 transform transition-transform ${showAdvancedPrompt ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Advanced System Prompts
                        </button>

                        {showAdvancedPrompt && (
                            <div className="mt-4 space-y-4 pl-4 border-l border-gray-700 animate-fade-in">
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="font-semibold text-gray-400 text-xs">Core System Prompt (Default)</label>
                                        <button onClick={handleResetDefaultPrompt} className="text-[10px] text-red-400 hover:underline">Reset Default</button>
                                    </div>
                                    <textarea
                                        value={modelSettings.defaultPrompt}
                                        onChange={(e) => handleModelSettingChange('defaultPrompt', e.target.value)}
                                        className="w-full h-48 bg-gray-900 border border-gray-600 rounded-md p-3 text-xs font-mono text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-semibold text-gray-400 text-xs">Additional User Instructions (Legacy)</label>
                                    <textarea
                                        value={modelSettings.userPrompt}
                                        onChange={(e) => handleModelSettingChange('userPrompt', e.target.value)}
                                        className="w-full h-24 bg-gray-900 border border-gray-600 rounded-md p-3 text-xs font-mono text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg flex justify-end">
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition shadow-lg">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
