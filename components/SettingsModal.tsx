
import React, { useState, useRef, useEffect } from 'react';
import { SystemPromptConfig, GlobalSettings } from '../types';
import { AVAILABLE_AI_TOOLS, DEFAULT_SYSTEM_PROMPT_CONFIG, DEFAULT_TOOL_PROMPTS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'ai' | 'tools';
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
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'tools'>(initialTab);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set(initialTool ? [initialTool] : []));
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (isOpen) {
          setActiveTab(initialTab);
          if (initialTool) {
              setExpandedTools(new Set([initialTool]));
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
          // If it's a subtool, we might just delete the key to fall back to main, 
          // or we need to know the default if one exists.
          // For now, let's delete the custom override if it exists.
          delete currentPrompts[key];
          
          // If it's a main tool key, restore from constant
          if (DEFAULT_TOOL_PROMPTS[key]) {
              currentPrompts[key] = DEFAULT_TOOL_PROMPTS[key];
          }
          
          handleModelSettingChange('toolPrompts', currentPrompts);
      }
  };

  const toggleAccordion = (toolId: string) => {
      const newSet = new Set(expandedTools);
      if (newSet.has(toolId)) {
          newSet.delete(toolId);
      } else {
          newSet.add(toolId);
      }
      setExpandedTools(newSet);
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
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`text-sm font-bold uppercase tracking-wide px-3 py-2 rounded transition-colors ${activeTab === 'ai' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    AI Advisor
                </button>
                <button 
                    onClick={() => setActiveTab('tools')}
                    className={`text-sm font-bold uppercase tracking-wide px