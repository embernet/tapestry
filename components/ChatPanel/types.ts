
import { Element, Relationship, ColorScheme, ModelActions, AIConfig, SystemPromptConfig, TapestryDocument, TapestryFolder, KanbanBoard, ChatMessage } from '../../types';
import { Type, Schema } from '@google/genai';

export interface ChatPanelProps {
    elements: Element[];
    relationships: Relationship[];
    colorSchemes: ColorScheme[];
    activeSchemeId: string | null;
    onClose: () => void;
    currentModelId: string | null;
    modelActions: ModelActions;
    className?: string;
    isOpen?: boolean;
    onOpenPromptSettings: () => void;
    systemPromptConfig: SystemPromptConfig;
    documents?: TapestryDocument[];
    folders?: TapestryFolder[];
    openDocIds?: string[];
    onLogHistory?: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
    onOpenHistory?: () => void;
    onOpenTool?: (tool: string, subTool?: string) => void;
    onAnalyzeWithChat: (context: string) => void;
    // Kanban Props
    kanbanBoards: KanbanBoard[];
    setKanbanBoards: React.Dispatch<React.SetStateAction<KanbanBoard[]>>;
    activeKanbanBoardId: string | null;
    setActiveKanbanBoardId: (id: string | null) => void;
    initialInput?: string;
    activeModel?: string;
    aiConfig: AIConfig;
    isDarkMode: boolean;
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    allocateZIndex: () => number;
    onShowApiKeyModal: () => void;
}

export interface ToolDefinition {
    description: string;
    parameters: {
        type: Type;
        properties: Record<string, Schema>;
        required?: string[];
    };
}
