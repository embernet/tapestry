
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
    modelSettings, onModelSettingsChange 
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
      if (prompts[key] !== undefined) return prompts[key];
      if (fallbackKey && prompts[fallbackKey] !== undefined) return ""; // Return empty to show placeholder
      return DEFAULT_TOOL_PROMPTS[key] || "";
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[3000] p-4">
      <div ref={modalRef} className="bg-gray-800 rounded-lg w-full max-w-4xl shadow-xl border border-gray-600 text-white flex flex-col max-h-[90vh]">
        
        {/* Header & Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900 rounded-t-lg flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('ai_settings')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai_settings' ? 'bg-gray-700 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    AI Settings
                </button>
                <button 
                    onClick={() => setActiveTab('ai_prompts')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai_prompts' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    AI Prompts
                </button>
                <button 
                    onClick={() => setActiveTab('ai_tools')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai_tools' ? 'bg-gray-700 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    AI Tools
                </button>
                <button 
                    onClick={() => setActiveTab('prompts')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'prompts' ? 'bg-gray-700 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    Tool Prompts
                </button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg border border-gray-600">
                        <div>
                            <h3 className="font-bold text-lg text-white">Tools Panel Default</h3>
                            <p className="text-sm text-gray-400">Should the tools panel be open when you load a model?</p>
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
            )}

            {/* --- AI SETTINGS TAB --- */}
            {activeTab === 'ai_settings' && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-300 bg-gray-900 p-3 rounded border border-gray-700">
                            Configure your AI provider. Tapestry connects directly to the provider's API from your browser. 
                            Your API key is stored locally in your browser and is never sent to our servers.
                        </p>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-white uppercase tracking-wide">Active Provider</label>
                            <select 
                                value={globalSettings.activeProvider} 
                                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                                <option value="grok">Grok (xAI)</option>
                                <option value="ollama">Ollama (Local)</option>
                                <option value="custom">Custom / Other</option>
                            </select>
                        </div>

                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600 space-y-4">
                            {/* Specific Provider Guidance */}
                            {globalSettings.activeProvider === 'gemini' && (
                                <div className="text-xs text-blue-200 mb-2 flex gap-2 items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>
                                        Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white">Get a Gemini API Key</a>
                                    </span>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-300">API Key</label>
                                <input 
                                    type="password" 
                                    value={activeConnection?.apiKey || ''} 
                                    onChange={(e) => handleConnectionChange('apiKey', e.target.value)}
                                    placeholder={globalSettings.activeProvider === 'ollama' ? 'Not required for Ollama' : 'sk-...'}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-300">Model ID</label>
                                <input 
                                    type="text" 
                                    value={activeConnection?.modelId || ''} 
                                    onChange={(e) => handleConnectionChange('modelId', e.target.value)}
                                    placeholder={PROVIDER_DEFAULTS[globalSettings.activeProvider]?.model || 'e.g. gpt-4o'}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-300">Base URL</label>
                                <input 
                                    type="text" 
                                    value={activeConnection?.baseUrl !== undefined ? activeConnection.baseUrl : defaultUrl} 
                                    onChange={(e) => handleConnectionChange('baseUrl', e.target.value)}
                                    placeholder={defaultUrl}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                                />
                                <p className="text-[10px] text-gray-400">Leave empty to use default provider URL. Use full URL (e.g., include /v1).</p>
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
                            <label className="font-semibold text-blue-400 block">Core System Persona</label>
                            <button onClick={handleResetDefaultPrompt} className="text-xs text-gray-500 hover:text-white underline">Reset to Default</button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">The foundational instructions for the AI Analyst.</p>
                        <textarea
                            value={modelSettings.defaultPrompt}
                            onChange={(e) => handleModelSettingChange('defaultPrompt', e.target.value)}
                            className="w-full h-48 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-semibold text-green-400 block">User Context / Style Instructions</label>
                        <p className="text-xs text-gray-500">Add custom instructions that apply to all queries in this model (e.g., "Always act as a business consultant").</p>
                        <textarea
                            value={modelSettings.userContext || ''}
                            onChange={(e) => handleModelSettingChange('userContext', e.target.value)}
                            placeholder="Enter custom instructions here..."
                            className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                    </div>
                </div>
            )}

            {/* --- AI TOOLS TAB --- */}
            {activeTab === 'ai_tools' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                        Select which tools the AI should know about. Disabling irrelevant tools can improve focus and reduce token usage.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AVAILABLE_AI_TOOLS.map(tool => (
                            <div key={tool.id} className="bg-gray-700 border border-gray-600 rounded-lg p-3 flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={(modelSettings.enabledTools || []).includes(tool.id)}
                                    onChange={() => toggleTool(tool.id)}
                                    className="mt-1 rounded bg-gray-900 border-gray-500 text-green-500 focus:ring-green-500"
                                />
                                <div>
                                    <div className="font-bold text-white text-sm">{tool.name}</div>
                                    <div className="text-xs text-gray-400 leading-snug">{tool.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- PROMPTS TAB --- */}
            {activeTab === 'prompts' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-300">Customize the prompts used by specific tools.</p>
                    
                    {TOOL_STRUCTURE.map(toolGroup => (
                        <div key={toolGroup.id} className="border border-gray-600 rounded-lg overflow-hidden">
                            <button 
                                onClick={() => toggleAccordion(toolGroup.id, expandedSubPromptTools, setExpandedSubPromptTools)}
                                className="w-full flex justify-between items-center p-3 bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                <span className="font-bold text-white">{toolGroup.name}</span>
                                <span className="text-gray-400 text-xs">{expandedSubPromptTools.has(toolGroup.id) ? 'Hide' : 'Show'}</span>
                            </button>
                            
                            {expandedSubPromptTools.has(toolGroup.id) && (
                                <div className="p-4 bg-gray-800 space-y-6 border-t border-gray-600">
                                    {/* Base Prompt */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-blue-400 uppercase">Base Prompt</label>
                                            <button onClick={() => handleResetToolPrompt(toolGroup.id)} className="text-[10px] text-gray-500 hover:text-white underline">Reset</button>
                                        </div>
                                        <textarea
                                            value={getPromptValue(toolGroup.id)}
                                            onChange={(e) => handleToolPromptChange(toolGroup.id, e.target.value)}
                                            className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 resize-y"
                                        />
                                    </div>

                                    {/* Subtool Prompts */}
                                    <div className="pl-4 border-l-2 border-gray-700 space-y-4">
                                        {toolGroup.subtools.map(sub => {
                                            const key = `${toolGroup.id}:${sub.id}`;
                                            const fallback = toolGroup.id;
                                            return (
                                                <div key={sub.id}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-xs font-bold text-gray-400">{sub.name} ({sub.id})</label>
                                                        <button onClick={() => handleResetToolPrompt(key)} className="text-[10px] text-gray-500 hover:text-white underline">Reset</button>
                                                    </div>
                                                    <textarea
                                                        value={getPromptValue(key, fallback)}
                                                        onChange={(e) => handleToolPromptChange(key, e.target.value)}
                                                        placeholder={`(Inherits from ${toolGroup.name} base prompt if empty)`}
                                                        className="w-full h-20 bg-gray-900 border border-gray-600 rounded p-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500 resize-y placeholder-gray-600"
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

        <div className="p-4 border-t border-gray-700 flex justify-end space-x-4 bg-gray-900 rounded-b-lg flex-shrink-0">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition duration-150 shadow-lg">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
