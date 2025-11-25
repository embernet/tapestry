
import React, { useState, useRef, useEffect } from 'react';
import { SystemPromptConfig, GlobalSettings, AIConfig, AIProvider } from '../types';
import { AVAILABLE_AI_TOOLS, DEFAULT_SYSTEM_PROMPT_CONFIG, DEFAULT_TOOL_PROMPTS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'tool_prompts';
  initialTool?: string;
  globalSettings: GlobalSettings;
  onGlobalSettingsChange: (settings: GlobalSettings) => void;
  modelSettings: SystemPromptConfig;
  onModelSettingsChange: (settings: SystemPromptConfig) => void;
  aiConfig: AIConfig;
  onAiConfigChange: (config: AIConfig) => void;
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

const PROVIDERS: { id: AIProvider, name: string, url: string, help: string }[] = [
    { id: 'google', name: 'Google Gemini', url: 'https://aistudio.google.com/app/apikey', help: 'Get your API key from Google AI Studio.' },
    { id: 'openai', name: 'OpenAI', url: 'https://platform.openai.com/api-keys', help: 'Get your API key from the OpenAI Platform.' },
    { id: 'anthropic', name: 'Anthropic', url: 'https://console.anthropic.com/settings/keys', help: 'Get your API key from the Anthropic Console.' },
    { id: 'grok', name: 'xAI (Grok)', url: 'https://console.x.ai/', help: 'Get your API key from the xAI Console.' },
    { id: 'ollama', name: 'Ollama (Local)', url: 'https://ollama.com', help: 'Ensure Ollama is running locally (default: http://localhost:11434).' },
    { id: 'custom', name: 'Custom / OpenAI Compatible', url: '', help: 'Connect to any OpenAI-compatible API endpoint (e.g. LM Studio, LocalAI).' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, initialTab = 'general', initialTool,
    globalSettings, onGlobalSettingsChange, 
    modelSettings, onModelSettingsChange,
    aiConfig, onAiConfigChange
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'tool_prompts'>(initialTab);
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

  const handleAiConfigFieldChange = (key: keyof AIConfig, value: any) => {
      let updates: Partial<AIConfig> = { [key]: value };
      
      // Smart defaults when switching provider
      if (key === 'provider') {
          const provider = value as AIProvider;
          if (provider === 'ollama') {
              updates.baseUrl = 'http://localhost:11434/v1';
              updates.modelId = 'llama3';
          } else if (provider === 'google') {
              updates.baseUrl = '';
              updates.modelId = 'gemini-2.5-flash';
          } else if (provider === 'openai') {
              updates.baseUrl = '';
              updates.modelId = 'gpt-4o';
          } else if (provider === 'anthropic') {
              updates.baseUrl = '';
              updates.modelId = 'claude-3-opus-20240229';
          } else if (provider === 'grok') {
              updates.baseUrl = 'https://api.x.ai/v1';
              updates.modelId = 'grok-beta';
          }
      }
      
      onAiConfigChange({ ...aiConfig, ...updates });
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

  const currentProviderInfo = PROVIDERS.find(p => p.id === aiConfig.provider);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
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
                    onClick={() => setActiveTab('tool_prompts')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'tool_prompts' ? 'bg-gray-700 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
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

            {/* --- AI SETTINGS TAB (New) --- */}
            {activeTab === 'ai_settings' && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        {/* Provider Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-400 uppercase mb-1">AI Provider</label>
                            <select
                                value={aiConfig.provider}
                                onChange={(e) => handleAiConfigFieldChange('provider', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Helper Block */}
                        {currentProviderInfo && (
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 flex gap-3 items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-gray-300">
                                    {currentProviderInfo.help}
                                    {currentProviderInfo.url && (
                                        <div className="mt-1">
                                            <a href={currentProviderInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                                Get API Key <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* API Key (Hidden for Ollama) */}
                        {aiConfig.provider !== 'ollama' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase mb-1">API Key</label>
                                <input
                                    type="password"
                                    value={aiConfig.apiKey}
                                    onChange={(e) => handleAiConfigFieldChange('apiKey', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="sk-..."
                                />
                            </div>
                        )}

                        {/* Model Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-400 uppercase mb-1">Model Name</label>
                            <input
                                type="text"
                                value={aiConfig.modelId}
                                onChange={(e) => handleAiConfigFieldChange('modelId', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder={aiConfig.provider === 'ollama' ? 'llama3' : 'gpt-4o'}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter the specific model ID (e.g. gpt-4o, gemini-1.5-pro, claude-3-opus).</p>
                        </div>

                        {/* Base URL (Visible for Ollama, Custom, Grok) */}
                        {(aiConfig.provider === 'ollama' || aiConfig.provider === 'custom' || aiConfig.provider === 'grok' || aiConfig.provider === 'openai') && (
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase mb-1">Base URL (Optional)</label>
                                <input
                                    type="text"
                                    value={aiConfig.baseUrl || ''}
                                    onChange={(e) => handleAiConfigFieldChange('baseUrl', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="https://api.example.com/v1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Override the default API endpoint. Useful for proxies or local servers.</p>
                            </div>
                        )}
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
                        <label className="font-semibold text-green-400 block">User Context / Custom Instructions</label>
                        <p className="text-xs text-gray-500 mb-2">Additional context about your specific domain or preferences (e.g. "Focus on healthcare", "Be concise").</p>
                        <textarea
                            value={modelSettings.userPrompt}
                            onChange={(e) => handleModelSettingChange('userPrompt', e.target.value)}
                            className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Enter custom context here..."
                        />
                    </div>
                </div>
            )}

            {/* --- AI TOOLS TAB (Enable/Disable) --- */}
            {activeTab === 'ai_tools' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">Select which AI tools are available in the chat.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AVAILABLE_AI_TOOLS.map(tool => {
                            const isEnabled = (modelSettings.enabledTools || AVAILABLE_AI_TOOLS.map(t => t.id)).includes(tool.id);
                            return (
                                <div key={tool.id} className={`p-4 rounded-lg border cursor-pointer transition-all ${isEnabled ? 'bg-gray-700 border-blue-500' : 'bg-gray-800 border-gray-700 opacity-70'}`} onClick={() => toggleTool(tool.id)}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-bold ${isEnabled ? 'text-white' : 'text-gray-400'}`}>{tool.name}</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isEnabled ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                            {isEnabled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">{tool.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- TOOL PROMPTS TAB (Detailed Configuration) --- */}
            {activeTab === 'tool_prompts' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400 mb-4">
                        Customize the AI instructions for each tool and its subtools. 
                        Specific subtool prompts override the category base prompt.
                    </p>
                    
                    {TOOL_STRUCTURE.map(tool => {
                        const isExpanded = expandedSubPromptTools.has(tool.id);
                        const baseKey = tool.id;
                        
                        return (
                            <div key={tool.id} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                                <button 
                                    onClick={() => toggleAccordion(tool.id, expandedSubPromptTools, setExpandedSubPromptTools)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                                >
                                    <span className="font-bold text-gray-200">{tool.name}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                {isExpanded && (
                                    <div className="p-4 space-y-6 border-t border-gray-700">
                                        {/* Base Category Prompt */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-xs font-bold text-blue-400 uppercase">Base {tool.name} Prompt</label>
                                                <button onClick={() => handleResetToolPrompt(baseKey)} className="text-[10px] text-gray-500 hover:text-red-400">Reset</button>
                                            </div>
                                            <textarea
                                                value={getPromptValue(baseKey)}
                                                onChange={(e) => handleToolPromptChange(baseKey, e.target.value)}
                                                className="w-full h-32 bg-gray-800 border border-gray-600 rounded p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 resize-y"
                                                placeholder={`Default prompt for ${tool.name}...`}
                                            />
                                        </div>

                                        {/* Subtools Accordion */}
                                        <div className="pl-4 border-l-2 border-gray-700 space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subtool Overrides</h4>
                                            {tool.subtools.map(sub => {
                                                const subKey = `${tool.id}:${sub.id}`;
                                                const subValue = (modelSettings.toolPrompts && modelSettings.toolPrompts[subKey]) || "";
                                                
                                                return (
                                                    <div key={sub.id} className="group">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-semibold text-gray-300">{sub.name}</label>
                                                            {subValue && (
                                                                <button onClick={() => handleResetToolPrompt(subKey)} className="text-[10px] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Clear Override</button>
                                                            )}
                                                        </div>
                                                        <textarea
                                                            value={subValue}
                                                            onChange={(e) => handleToolPromptChange(subKey, e.target.value)}
                                                            className={`w-full h-20 bg-gray-800 border rounded p-2 text-xs font-mono focus:outline-none focus:border-purple-500 resize-y ${subValue ? 'border-purple-500/50 text-white' : 'border-gray-600 text-gray-500'}`}
                                                            placeholder={`(Optional) Override prompt specifically for ${sub.name}. Leave empty to use Base Prompt.`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-900 rounded-b-lg flex-shrink-0">
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition duration-150">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
