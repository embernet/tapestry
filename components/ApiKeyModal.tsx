
import React, { useState, useRef, useEffect } from 'react';
import { GlobalSettings, AIProvider } from '../types';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    globalSettings: GlobalSettings;
    onGlobalSettingsChange: (settings: GlobalSettings) => void;
    isDarkMode: boolean;
}

// Re-defining provider defaults here if not exported or just import if possible. 
// It was not exported in SettingsModal.tsx view I saw, so I will redefine or just use a local map.
// Actually, I can check if I can export it from SettingsModal or just duplicate for safety/speed.
// It is active in SettingsModal but not exported. I'll copy it.

const LOCAL_PROVIDER_DEFAULTS: Record<string, { url: string, model: string }> = {
    openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o' },
    anthropic: { url: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20240620' },
    grok: { url: 'https://api.x.ai/v1', model: 'grok-beta' },
    ollama: { url: 'http://localhost:11434/v1', model: 'llama3' },
    gemini: { url: '', model: 'gemini-2.5-flash' },
    custom: { url: '', model: '' }
};

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
    isOpen, onClose, globalSettings, onGlobalSettingsChange, isDarkMode
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

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

    const handleGlobalSettingChange = (key: keyof GlobalSettings, value: any) => {
        onGlobalSettingsChange({ ...globalSettings, [key]: value });
    };

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
    const defaultUrl = LOCAL_PROVIDER_DEFAULTS[globalSettings.activeProvider]?.url || '';

    // Theme Helpers
    const bgMain = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const bgHeader = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200';
    const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSub = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const borderMain = isDarkMode ? 'border-gray-600' : 'border-gray-200';
    const sectionBg = isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
    const inputBg = isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[2000] p-4">
            <div ref={modalRef} className={`${bgMain} rounded-lg w-full max-w-md shadow-2xl border ${borderMain} flex flex-col max-h-[90vh] animate-fade-in-up`}>

                {/* Header */}
                <div className={`p-4 border-b ${bgHeader} rounded-t-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10`}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${textMain}`}>API Key Required</h2>
                            <p className={`text-xs ${textMuted}`}>You need to configure an AI provider to use this feature.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">

                    <div className="space-y-2">
                        <label className={`block text-xs font-bold uppercase tracking-wide ${textSub}`}>Select Provider</label>
                        <select
                            value={globalSettings.activeProvider}
                            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                            className={`w-full rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border ${inputBg}`}
                        >
                            <option value="gemini">Google Gemini (Recommended)</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="grok">Grok (xAI)</option>
                            <option value="ollama">Ollama (Local)</option>
                            <option value="custom">Custom / Other</option>
                        </select>
                    </div>

                    <div className={`p-4 rounded-lg border space-y-4 ${sectionBg}`}>
                        {/* Specific Provider Guidance */}
                        {globalSettings.activeProvider === 'gemini' && (
                            <div className="text-xs text-blue-500 mb-2 flex gap-2 items-center bg-blue-50/10 p-2 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>
                                    Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-400">Get a Gemini API Key</a>
                                </span>
                            </div>
                        )}
                        {globalSettings.activeProvider === 'openai' && (
                            <div className="text-xs text-green-500 mb-2 flex gap-2 items-center bg-green-50/10 p-2 rounded">
                                <span>
                                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-green-400">Get an OpenAI API Key</a>
                                </span>
                            </div>
                        )}
                        {globalSettings.activeProvider === 'anthropic' && (
                            <div className="text-xs text-purple-500 mb-2 flex gap-2 items-center bg-purple-50/10 p-2 rounded">
                                <span>
                                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-purple-400">Get an Anthropic API Key</a>
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
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`block text-xs font-bold ${textSub}`}>Model ID</label>
                            <input
                                type="text"
                                value={activeConnection?.modelId || ''}
                                onChange={(e) => handleConnectionChange('modelId', e.target.value)}
                                placeholder={LOCAL_PROVIDER_DEFAULTS[globalSettings.activeProvider]?.model || 'e.g. gpt-4o'}
                                className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 font-mono text-sm border ${inputBg}`}
                            />
                        </div>

                        {globalSettings.activeProvider === 'custom' || globalSettings.activeProvider === 'ollama' ? (
                            <div className="space-y-2">
                                <label className={`block text-xs font-bold ${textSub}`}>Base URL</label>
                                <input
                                    type="text"
                                    value={activeConnection?.baseUrl !== undefined ? activeConnection.baseUrl : defaultUrl}
                                    onChange={(e) => handleConnectionChange('baseUrl', e.target.value)}
                                    placeholder={defaultUrl}
                                    className={`w-full rounded p-2 focus:outline-none focus:border-blue-500 font-mono text-sm border ${inputBg}`}
                                />
                            </div>
                        ) : null}
                    </div>

                </div>

                <div className={`p-4 border-t ${bgHeader} rounded-b-lg flex justify-end gap-2`}>
                    <button
                        onClick={onClose}
                        className={`text-sm font-semibold px-4 py-2 rounded hover:underline ${textMuted} hover:${textMain}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition duration-150 shadow-lg flex items-center gap-2"
                    >
                        Save & Continue
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
