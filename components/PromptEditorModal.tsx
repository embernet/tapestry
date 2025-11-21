
import React, { useState, useRef, useEffect } from 'react';
import { SystemPromptConfig } from '../types';
import { DEFAULT_SYSTEM_PROMPT_CONFIG } from '../constants';

interface PromptEditorModalProps {
  config: SystemPromptConfig;
  onSave: (config: SystemPromptConfig) => void;
  onClose: () => void;
}

const PromptEditorModal: React.FC<PromptEditorModalProps> = ({ config, onSave, onClose }) => {
  const [defaultPrompt, setDefaultPrompt] = useState(config.defaultPrompt);
  const [userPrompt, setUserPrompt] = useState(config.userPrompt);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [onClose]);

  const handleResetDefault = () => {
    if (confirm("Are you sure you want to reset the Default Prompt to its original state?")) {
        setDefaultPrompt(DEFAULT_SYSTEM_PROMPT_CONFIG.defaultPrompt);
    }
  };

  const handleSave = () => {
    onSave({ defaultPrompt, userPrompt });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div ref={modalRef} className="bg-gray-800 rounded-lg w-full max-w-4xl shadow-xl border border-gray-600 text-white flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">AI System Prompts</h2>
          <p className="text-sm text-gray-400 mt-1">Configure how the AI behaves for this model.</p>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {/* Default Prompt Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="font-semibold text-blue-400">Default System Prompt</label>
                <button 
                    onClick={handleResetDefault}
                    className="text-xs text-gray-400 hover:text-white underline"
                >
                    Reset to Factory Default
                </button>
            </div>
            <p className="text-xs text-gray-500">This defines the core personality, rules, and analysis style of the AI. It is recommended to keep the core rules intact.</p>
            <textarea
              value={defaultPrompt}
              onChange={(e) => setDefaultPrompt(e.target.value)}
              className="w-full h-64 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* User Prompt Section */}
          <div className="space-y-2">
            <label className="font-semibold text-green-400">User System Prompt</label>
            <p className="text-xs text-gray-500">Add your own specific instructions, rules, or context that should always apply to this model (e.g., "Always respond in French", "Focus on financial risks").</p>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter custom instructions here..."
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end space-x-4 bg-gray-900 rounded-b-lg">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorModal;
