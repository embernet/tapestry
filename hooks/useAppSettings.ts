
import { useState, useMemo, useCallback } from 'react';
import { GlobalSettings, SystemPromptConfig, AIConfig, CustomStrategyTool } from '../types';
import { DEFAULT_SYSTEM_PROMPT_CONFIG, DEFAULT_TOOL_PROMPTS } from '../constants';

const GLOBAL_SETTINGS_KEY = 'tapestry_global_settings';

export const useAppSettings = () => {
    // --- Settings State ---
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
        try {
            const savedSettings = localStorage.getItem(GLOBAL_SETTINGS_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                if (!parsed.customStrategies) parsed.customStrategies = [];
                if (!parsed.theme) parsed.theme = 'dark';
                if (!parsed.language) parsed.language = 'British English';
                // Add githubToken default if missing
                if (parsed.githubToken === undefined) parsed.githubToken = '';
                return parsed;
            }
            return {
                toolsBarOpenByDefault: true,
                theme: 'dark',
                activeProvider: 'gemini',
                aiConnections: {
                    gemini: { provider: 'gemini', apiKey: '', modelId: 'gemini-2.5-flash' },
                    openai: { provider: 'openai', apiKey: '', modelId: 'gpt-4o' },
                    anthropic: { provider: 'anthropic', apiKey: '', modelId: 'claude-3-5-sonnet-20240620' },
                    grok: { provider: 'grok', apiKey: '', modelId: 'grok-beta' },
                    ollama: { provider: 'ollama', apiKey: 'ollama', baseUrl: 'http://localhost:11434', modelId: 'llama3' },
                    custom: { provider: 'custom', apiKey: '', baseUrl: '', modelId: '' }
                },
                customStrategies: [],
                language: 'British English',
                githubToken: ''
            };
        } catch (e) {
            console.error("Failed to load global settings", e);
            return {
                toolsBarOpenByDefault: true,
                theme: 'dark',
                activeProvider: 'gemini',
                aiConnections: {
                    gemini: { provider: 'gemini', apiKey: '', modelId: 'gemini-2.5-flash' },
                },
                customStrategies: [],
                language: 'British English',
                githubToken: ''
            };
        }
    });

    const [systemPromptConfig, setSystemPromptConfig] = useState<SystemPromptConfig>(DEFAULT_SYSTEM_PROMPT_CONFIG);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'ai_settings' | 'ai_prompts' | 'ai_tools' | 'prompts'>('general');

    // --- Derived State ---
    const isDarkMode = useMemo(() => globalSettings.theme === 'dark', [globalSettings.theme]);

    const aiConfig = useMemo<AIConfig>(() => {
        const provider = globalSettings.activeProvider;
        const conn = globalSettings.aiConnections[provider];
        return {
            provider,
            apiKey: conn?.apiKey || '',
            modelId: conn?.modelId || 'gemini-2.5-flash',
            baseUrl: conn?.baseUrl,
            language: globalSettings.language || 'British English'
        };
    }, [globalSettings]);

    // --- Handlers ---

    const handleGlobalSettingsChange = useCallback((settings: GlobalSettings) => {
        setGlobalSettings(settings);
        localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
    }, []);

    const handleThemeToggle = useCallback(() => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        const newSettings: GlobalSettings = { ...globalSettings, theme: newTheme };
        handleGlobalSettingsChange(newSettings);
    }, [isDarkMode, globalSettings, handleGlobalSettingsChange]);

    const handleCustomStrategiesChange = useCallback((strategies: CustomStrategyTool[]) => {
        handleGlobalSettingsChange({ ...globalSettings, customStrategies: strategies });
    }, [globalSettings, handleGlobalSettingsChange]);

    const getToolPrompt = useCallback((tool: string, subTool?: string | null) => {
        const prompts = systemPromptConfig.toolPrompts || DEFAULT_TOOL_PROMPTS;
        if (subTool && prompts[`${tool}:${subTool}`]) {
            return prompts[`${tool}:${subTool}`];
        }
        if (prompts[tool]) {
            return prompts[tool];
        }
        return DEFAULT_TOOL_PROMPTS[tool];
    }, [systemPromptConfig]);

    return {
        globalSettings,
        setGlobalSettings,
        handleGlobalSettingsChange,
        
        systemPromptConfig,
        setSystemPromptConfig,
        
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        settingsInitialTab,
        setSettingsInitialTab,
        
        isDarkMode,
        handleThemeToggle,
        
        aiConfig,
        handleCustomStrategiesChange,
        getToolPrompt
    };
};
