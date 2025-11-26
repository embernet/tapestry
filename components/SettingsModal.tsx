
import React, { useState, useRef, useEffect } from 'react';
import { SystemPromptConfig, GlobalSettings } from '../types';
import { AVAILABLE_AI_TOOLS, DEFAULT_SYSTEM_PROMPT_CONFIG, DEFAULT_TOOL_PROMPTS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'ai' | 'tools' | 'prompts';
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

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, initialTab = 'general', initialTool,
    globalSettings, onGlobalSettingsChange, 
    modelSettings, onModelSettingsChange 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'tools' | 'prompts'>(initialTab);
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
                    onClick={() => setActiveTab('ai')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    AI Advisor
                </button>
                <button 
                    onClick={() => setActiveTab('tools')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors whitespace-nowrap ${activeTab === 'tools' ? 'bg-gray-700 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    Tools
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

            {/* --- AI ADVISOR TAB --- */}
            {activeTab === 'ai' && (
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

            {/* --- TOOLS TAB (Enable/Disable) --- */}
            {activeTab === 'tools' && (
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
            {activeTab === 'prompts' && (
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
