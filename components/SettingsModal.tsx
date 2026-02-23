
import React, { useState, useRef, useEffect } from 'react';
import { SystemPromptConfig, GlobalSettings, AIProvider } from '../types';
import { AVAILABLE_AI_TOOLS, DEFAULT_SYSTEM_PROMPT_CONFIG, DEFAULT_TOOL_PROMPTS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'prompts';
  initialTool?: string;
  globalSettings: GlobalSettings;
  onGlobalSettingsChange: (settings: GlobalSettings) => void;
  modelSettings: SystemPromptConfig;
  onModelSettingsChange: (settings: SystemPromptConfig) => void;
  isDarkMode: boolean;
}

const TOOL_STRUCTURE = [
    {
        id: 'scamper',
        name: 'SCAMPER',
        subtools: [
            { id: 'S', name: 'Substitute' },
            { id: 'C', name: 'Combine' },
            { id: 'A', name: 'Adapt' },
            { id: 'M', name: 'Modify' },
            { id: 'P', name: 'Put to another use' },
            { id: 'E', name: 'Eliminate' },
            { id: 'R', name: 'Reverse' }
        ]
    },
    {
        id: 'triz',
        name: 'TRIZ',
        subtools: [
            { id: 'contradiction', name: 'Contradiction Matrix' },
            { id: 'principles', name: '40 Principles' },
            { id: 'ariz', name: 'ARIZ' },
            { id: 'sufield', name: 'Su-Field Analysis' },
            { id: 'trends', name: 'Evolution Trends' }
        ]
    },
    {
        id: 'lss',
        name: 'Lean Six Sigma',
        subtools: [
            { id: 'charter', name: 'Project Charter' },
            { id: 'sipoc', name: 'SIPOC' },
            { id: 'voc', name: 'Voice of Customer' },
            { id: 'ctq', name: 'CTQ Tree' },
            { id: 'stakeholder', name: 'Stakeholder Analysis' },
            { id: 'dmaic', name: 'DMAIC' },
            { id: '5whys', name: '5 Whys' },
            { id: 'fishbone', name: 'Fishbone (Ishikawa)' },
            { id: 'fmea', name: 'FMEA' },
            { id: 'vsm', name: 'Value Stream Mapping' }
        ]
    },
    {
        id: 'toc',
        name: 'Theory of Constraints',
        subtools: [
            { id: 'crt', name: 'Current Reality Tree' },
            { id: 'ec', name: 'Evaporating Cloud' },
            { id: 'frt', name: 'Future Reality Tree' },
            { id: 'tt', name: 'Transition Tree' }
        ]
    },
    {
        id: 'ssm',
        name: 'Soft Systems Methodology',
        subtools: [
            { id: 'rich_picture', name: 'Rich Picture' },
            { id: 'catwoe', name: 'CATWOE' },
            { id: 'activity_models', name: 'Activity Models' },
            { id: 'comparison', name: 'Comparison' }
        ]
    },
    {
        id: 'swot',
        name: 'Strategic Analysis',
        subtools: [
            { id: 'matrix', name: 'SWOT Matrix' },
            { id: 'pestel', name: 'PESTEL' },
            { id: 'steer', name: 'STEER' },
            { id: 'destep', name: 'DESTEP' },
            { id: 'longpest', name: 'LoNGPEST' },
            { id: 'five_forces', name: 'Porter’s Five Forces' },
            { id: 'cage', name: 'CAGE Framework' }
        ]
    }
];

const PROVIDER_DEFAULTS: Record<string, { url: string, model: string }> = {
    openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o' },
    anthropic: { url: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20240620' },
    grok: { url: 'https://api.x.ai/v1', model: 'grok-beta' },
    ollama: { url: 'http://localhost:11434/v1', model: 'llama3' },
    gemini: { url: '', model: 'gemini-2.5-flash' },
    custom: { url: '', model: '' }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, initialTab = 'general', initialTool,
    globalSettings, onGlobalSettingsChange, 
    modelSettings, onModelSettingsChange, isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'prompts'>(initialTab);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set(initialTool ? [initialTool] : []));
  const [expandedSubPromptTools, setExpandedSubPromptTools] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (isOpen) {
          setActiveTab(initialTab);
          if (initialTool) {
              setExpandedTools(new Set([initialTool]));
              setExpandedSubPromptTools(new Set([initialTool]));
          }
      }
  }, [isOpen, initialTab, initialTool]);

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

  const handleToolPromptChange = (key: string, value: string) => {
      const currentPrompts = modelSettings.toolPrompts || DEFAULT_TOOL_PROMPTS;
      handleModelSettingChange('toolPrompts', { ...currentPrompts, [key]: value });
  };

  const handleResetToolPrompt = (key: string) => {
      if (confirm(`Reset this prompt to default?`)) {
          const currentPrompts = { ...(modelSettings.toolPrompts || DEFAULT_TOOL_PROMPTS) };
          
          // If it is a category base prompt, revert to default constant
          if (DEFAULT_TOOL_PROMPTS[key]) {
              currentPrompts[key] = DEFAULT_TOOL_PROMPTS[key];
          } else {
              // If it is a subtool override, just delete it so it falls back to category
              delete currentPrompts[key];
          }
          
          handleModelSettingChange('toolPrompts', currentPrompts);
      }
  };

  const toggleAccordion = (toolId: string, set: Set<string>, setState: React.Dispatch<React.SetStateAction<Set<string>>>) => {
      const newSet = new Set(set);
      if (newSet.has(toolId)) {
          newSet.delete(toolId);
      } else {
          newSet.add(toolId);
      }
      setState(newSet);
  };

  const getPromptValue = (key: string, fallbackKey?: string) => {
      const prompts = modelSettings.toolPrompts || DEFAULT_TOOL_PROMPTS;
      
      // 1. If explicitly defined in user settings (even as empty string), return it
      if (prompts[key] !== undefined) return prompts[key];
      
      // 2. If no user setting, check for a specific default constant
      if (DEFAULT_TOOL_PROMPTS[key] !== undefined) return DEFAULT_TOOL_PROMPTS[key];

      // 3. Fallback to parent category if neither exist
      if (fallbackKey && prompts[fallbackKey] !== undefined) return ""; // Empty to show placeholder
      
      return "";
  };

  // AI Connection Logic
  const handleProviderChange = (provider: AIProvider) => {
      handleGlobalSettingChange('activeProvider', provider);
  };

  const handleConnectionChange = (key: string, value: string) => {
      const provider = globalSettings.activeProvider;
      const currentConnection = globalSettings.aiConnections[provider] || { provider, apiKey: '', modelId: '' };
      
      const updatedConnections = {
          ...globalSettings.aiConnections,
          [provider]: {
              ...currentConnection,
              [key]: value
          }
      };
      
      handleGlobalSettingChange('aiConnections', updatedConnections);
  };

  const activeConnection = globalSettings.aiConnections[globalSettings.activeProvider];
  const defaultUrl = PROVIDER_DEFAULTS[globalSettings.activeProvider]?.url || '';

  // Theme Helpers
  const bgMain = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const bgHeader = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderMain = isDarkMode ? 'border-gray-600' : 'border-gray-200';
  const sectionBg = isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const tabActive = isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-blue-600 shadow-sm border border-gray-200';
  const tabInactive = isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-black hover:bg-gray-100';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div ref={modalRef} className={`${bgMain} rounded-lg w-full max-w-4xl shadow-xl border ${borderMain} flex flex-col max-h-[90vh]`}>
        
        {/* Header & Tabs */}
        <div className={`flex items-center justify-between p-4 border-b ${bgHeader} rounded-t-lg flex-shrink-0`}>
            <div className="flex gap-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'general' ? tabActive : tabInactive}`}
                >
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('ai_settings')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai_settings' ? (isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-yellow-600 shadow-sm border border-gray-200') : tabInactive}`}
                >
                    AI Settings
                </button>
                <button 
                    onClick={() => setActiveTab('ai_prompts')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai_prompts' ? (isDarkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600 shadow-sm border border-gray-200') : tabInactive}`}
                >
                    AI Prompts
                </button>
                <button 
                    onClick={() => setActiveTab('ai_tools')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai_tools' ? (isDarkMode ? 'bg-gray-700 text-green-400' : 'bg-white text-green-600 shadow-sm border border-gray-200') : tabInactive}`}
                >
                    AI Tools
                </button>
                <button 
                    onClick={() => setActiveTab('prompts')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'prompts' ? (isDarkMode ? 'bg-gray-700 text-purple-400' : 'bg-white text-purple-600 shadow-sm border border-gray-200') : tabInactive}`}
                >
                    Tool Prompts
                </button>
            </div>
            <button onClick={onClose} className={`${textMuted} hover:${textMain} p-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className={`flex items-center justify-between p-4 rounded-lg border ${sectionBg}`}>
                        <div>
                            <h3 className={`font-bold text-lg ${textMain}`}>Theme</h3>
                            <p className={`text-sm ${textMuted}`}>Choose your preferred visual appearance.</p>
                        </div>
                        <div className={`flex rounded-lg p-1 border ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-200 border-gray-300'}`}>
                            <button
                                onClick={() => handleGlobalSettingChange('theme', 'light')}
                                className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${globalSettings.theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => handleGlobalSettingChange('theme', 'dark')}
                                className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${globalSettings.theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-lg border ${sectionBg}`}>
                        <div>
                            <h3 className={`font-bold text-lg ${textMain}`}>Tools Panel Default</h3>
                            <p className={`text-sm ${textMuted}`}>Should the tools panel be open when you load a model?</p>
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

                    <div className={`p-4 rounded-lg border ${sectionBg}`}>
                        <h3 className={`font-bold text-lg mb-2 ${textMain}`}>GitHub Integration</h3>
                        <p className={`text-sm mb-4 ${textMuted}`}>Enter a Personal Access Token (classic) with 'gist' scope to enable saving models to your GitHub Gists.</p>
                        <input 
                            type="password"
                            value={globalSettings.githubToken || ''}
                            onChange={(e) => handleGlobalSettingChange('githubToken', e.target.value)}
                            placeholder="ghp_..."
                            className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 border ${inputBg}`}
                        />
                        <p className={`text-[10px] mt-1 ${textMuted}`}>Your token is saved locally in your browser.</p>
                    </div>
                </div>
            )}

            {/* --- AI SETTINGS TAB --- */}
            {activeTab === 'ai_settings' && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <p className={`text-sm ${textSub} p-3 rounded border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                            Configure your AI provider. Tapestry connects directly to the provider's API from your browser. 
                            Your API key is stored locally in your browser and is never sent to our servers.
                        </p>

                        <div className="space-y-2">
                            <label className={`block text-sm font-bold uppercase tracking-wide ${textMain}`}>Active Provider</label>
                            <select 
                                value={globalSettings.activeProvider} 
                                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                                className={`w-full rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 border ${inputBg}`}
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                                <option value="grok">Grok (xAI)</option>
                                <option value="ollama">Ollama (Local)</option>
                                <option value="custom">Custom / Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={`block text-sm font-bold uppercase tracking-wide ${textMain}`}>Response Language</label>
                            <input 
                                type="text" 
                                value={globalSettings.language || 'British English'} 
                                onChange={(e) => handleGlobalSettingChange('language', e.target.value)}
                                className={`w-full rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 border ${inputBg}`}
                                placeholder="e.g. British English, French, Spanish"
                            />
                        </div>

                        <div className={`p-4 rounded-lg border space-y-4 ${sectionBg}`}>
                            {/* Specific Provider Guidance */}
                            {globalSettings.activeProvider === 'gemini' && (
                                <div className="text-xs text-blue-500 mb-2 flex gap-2 items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>
                                        Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-700">Get a Gemini API Key</a>
                                    </span>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label className={`block text-xs font-bold ${textSub}`}>API Key</label>
                                <input 
                                    type="password" 
                                    value={activeConnection?.apiKey || ''} 
                                    onChange={(e) => handleConnectionChange('apiKey', e.target.value)}
                                    placeholder={globalSettings.activeProvider === 'ollama' ? 'Not required for Ollama' : 'sk-...'}
                                    className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 border ${inputBg}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-xs font-bold ${textSub}`}>Model ID</label>
                                <input 
                                    type="text" 
                                    value={activeConnection?.modelId || ''} 
                                    onChange={(e) => handleConnectionChange('modelId', e.target.value)}
                                    placeholder={PROVIDER_DEFAULTS[globalSettings.activeProvider]?.model || 'e.g. gpt-4o'}
                                    className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 font-mono text-sm border ${inputBg}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-xs font-bold ${textSub}`}>Base URL</label>
                                <input 
                                    type="text" 
                                    value={activeConnection?.baseUrl !== undefined ? activeConnection.baseUrl : defaultUrl} 
                                    onChange={(e) => handleConnectionChange('baseUrl', e.target.value)}
                                    placeholder={defaultUrl}
                                    className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 font-mono text-sm border ${inputBg}`}
                                />
                                <p className={`text-[10px] ${textMuted}`}>Leave empty to use default provider URL. Use full URL (e.g., include /v1).</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- AI PROMPTS TAB --- */}
            {activeTab === 'ai_prompts' && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="font-semibold text-blue-500 block">Core System Persona</label>
                            <button onClick={handleResetDefaultPrompt} className={`text-xs ${textMuted} hover:${textMain} underline`}>Reset to Default</button>
                        </div>
                        <p className={`text-xs ${textMuted} mb-2`}>The foundational instructions for the AI Analyst.</p>
                        <textarea
                            value={modelSettings.defaultPrompt}
                            onChange={(e) => handleModelSettingChange('defaultPrompt', e.target.value)}
                            className={`w-full h-48 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none border ${inputBg}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-semibold text-green-500 block">User Context / Style Instructions</label>
                        <p className={`text-xs ${textMuted}`}>Add custom instructions that apply to all queries in this model (e.g., "Always act as a business consultant").</p>
                        <textarea
                            value={modelSettings.userContext || ''}
                            onChange={(e) => handleModelSettingChange('userContext', e.target.value)}
                            placeholder="Enter custom instructions here..."
                            className={`w-full h-32 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none border ${inputBg}`}
                        />
                    </div>
                </div>
            )}

            {/* --- AI TOOLS TAB --- */}
            {activeTab === 'ai_tools' && (
                <div className="space-y-4">
                    <p className={`text-sm ${textSub}`}>
                        Select which tools the AI should know about. Disabling irrelevant tools can improve focus and reduce token usage.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AVAILABLE_AI_TOOLS.map(tool => (
                            <div key={tool.id} className={`border rounded-lg p-3 flex items-start gap-3 ${sectionBg}`}>
                                <input 
                                    type="checkbox" 
                                    checked={(modelSettings.enabledTools || []).includes(tool.id)}
                                    onChange={() => toggleTool(tool.id)}
                                    className="mt-1 rounded border-gray-500 text-green-500 focus:ring-green-500"
                                />
                                <div>
                                    <div className={`font-bold text-sm ${textMain}`}>{tool.name}</div>
                                    <div className={`text-xs leading-snug ${textMuted}`}>{tool.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- PROMPTS TAB --- */}
            {activeTab === 'prompts' && (
                <div className="space-y-6">
                    <p className={`text-sm ${textSub}`}>Customize the prompts used by specific tools.</p>
                    
                    {TOOL_STRUCTURE.map(toolGroup => (
                        <div key={toolGroup.id} className={`border ${borderMain} rounded-lg overflow-hidden`}>
                            <button 
                                onClick={() => toggleAccordion(toolGroup.id, expandedSubPromptTools, setExpandedSubPromptTools)}
                                className={`w-full flex justify-between items-center p-3 transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                <span className={`font-bold ${textMain}`}>{toolGroup.name}</span>
                                <span className={`${textMuted} text-xs`}>{expandedSubPromptTools.has(toolGroup.id) ? 'Hide' : 'Show'}</span>
                            </button>
                            
                            {expandedSubPromptTools.has(toolGroup.id) && (
                                <div className={`p-4 space-y-6 border-t ${borderMain} ${bgMain}`}>
                                    {/* Base Prompt */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-blue-500 uppercase">Base Prompt</label>
                                            <button onClick={() => handleResetToolPrompt(toolGroup.id)} className={`text-[10px] ${textMuted} hover:${textMain} underline`}>Reset</button>
                                        </div>
                                        <textarea
                                            value={getPromptValue(toolGroup.id)}
                                            onChange={(e) => handleToolPromptChange(toolGroup.id, e.target.value)}
                                            className={`w-full h-24 rounded p-2 text-xs font-mono focus:outline-none focus:border-blue-500 resize-y border ${inputBg}`}
                                        />
                                    </div>

                                    {/* Subtool Prompts */}
                                    <div className={`pl-4 border-l-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} space-y-4`}>
                                        {toolGroup.subtools.map(sub => {
                                            const key = `${toolGroup.id}:${sub.id}`;
                                            const fallback = toolGroup.id;
                                            return (
                                                <div key={sub.id}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className={`text-xs font-bold ${textSub}`}>{sub.name} ({sub.id})</label>
                                                        <button onClick={() => handleResetToolPrompt(key)} className={`text-[10px] ${textMuted} hover:${textMain} underline`}>Reset</button>
                                                    </div>
                                                    <textarea
                                                        value={getPromptValue(key, fallback)}
                                                        onChange={(e) => handleToolPromptChange(key, e.target.value)}
                                                        placeholder={`(Inherits from ${toolGroup.name} base prompt if empty)`}
                                                        className={`w-full h-20 rounded p-2 text-xs font-mono focus:outline-none focus:border-purple-500 resize-y border ${inputBg}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

        </div>

        <div className={`p-4 border-t ${bgHeader} rounded-b-lg flex-shrink-0 flex justify-end`}>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition duration-150 shadow-lg">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
