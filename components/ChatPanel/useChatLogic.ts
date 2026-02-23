
import { useState, useRef, useEffect, useCallback } from 'react';
import { callAI, generateUUID, generateMarkdownFromGraph } from '../../utils';
import { promptStore } from '../../services/PromptStore';
import { ChatMessage, AIConfig, SystemPromptConfig, TapestryDocument, Element, Relationship } from '../../types';
import { FunctionCall, FunctionResponse, Content } from '@google/genai';
import { ToolDefinition } from './types';
import { TOOL_REGISTRY, CHAT_RESPONSE_SCHEMA } from './constants';
import { parseParameters } from './utils';

interface UseChatLogicProps {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    aiConfig: AIConfig;
    systemPromptConfig: SystemPromptConfig;
    documents?: TapestryDocument[];
    elements: Element[];
    relationships: Relationship[];
    executeFunctionCalls: (calls: FunctionCall[]) => FunctionResponse[];
    isVerboseMode?: boolean;
    planStatus: 'proposed' | 'executing' | 'completed' | 'paused';
    setActivePlan: (plan: any) => void;
    setPlanStatus: (status: 'proposed' | 'executing' | 'completed' | 'paused') => void;
    onShowApiKeyModal: () => void;
}

export const useChatLogic = ({
    messages,
    setMessages,
    aiConfig,
    systemPromptConfig,
    documents,
    elements,
    relationships,
    executeFunctionCalls,
    isVerboseMode,
    planStatus,
    setActivePlan,
    setPlanStatus,
    onShowApiKeyModal
}: UseChatLogicProps) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreativeMode, setIsCreativeMode] = useState(true);
    const [actionDecisions, setActionDecisions] = useState<Record<number, 'pending' | 'accepted' | 'rejected'>>({});
    const documentsRef = useRef<TapestryDocument[]>([]);

    useEffect(() => {
        if (documents) documentsRef.current = documents;
    }, [documents]);

    // Initialize decisions when a new pending message arrives
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.isPending && lastMsg.functionCalls) {
            const initialDecisions: Record<number, 'pending' | 'accepted' | 'rejected'> = {};
            // Default to accepted so applying immediately works without extra clicks
            lastMsg.functionCalls.forEach((_, i) => initialDecisions[i] = 'accepted');
            setActionDecisions(initialDecisions);
        }
    }, [messages]);

    const handleSelectAll = (msgIndex: number, select: boolean) => {
        if (!messages[msgIndex]?.functionCalls) return;
        const newDecisions = { ...actionDecisions };
        messages[msgIndex].functionCalls!.forEach((_, i) => {
            newDecisions[i] = select ? 'accepted' : 'rejected';
        });
        setActionDecisions(newDecisions);
    };

    const handleApplyPending = async (msgIndex: number) => {
        const msg = messages[msgIndex];
        if (!msg || !msg.functionCalls) return;

        setIsLoading(true);
        try {
            // Filter accepted calls
            const acceptedCalls = msg.functionCalls.filter((_, i) => actionDecisions[i] !== 'rejected');
            const rejectedCount = msg.functionCalls.length - acceptedCalls.length;

            if (acceptedCalls.length === 0 && rejectedCount === 0) {
                setIsLoading(false);
                return;
            }

            const responses = executeFunctionCalls(acceptedCalls);

            // Update history: Mark previous message as NOT pending, add user message with results
            setMessages(prev => {
                const updated = [...prev];
                updated[msgIndex] = { ...updated[msgIndex], isPending: false };

                // Add system result message
                const resultText = responses.map(r => `Action '${r.name}' executed. Result: ${JSON.stringify(r.response?.result)}`).join('\n');
                const rejectionText = rejectedCount > 0 ? `\n(${rejectedCount} actions rejected by user)` : '';

                // Simulate turn completion
                // We don't automatically call AI again here unless requested contextually?
                // Usually in chat, after tool use, we might want AI to summarize. 
                // But for now, just logging results is safer.

                return [...updated, {
                    role: 'user',
                    text: `[System] Applied ${acceptedCalls.length} actions.\n${resultText}${rejectionText}`,
                    functionResponses: responses
                }];
            });

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const buildApiHistory = (msgs: ChatMessage[]): Content[] => {
        const history: Content[] = [];

        for (const msg of msgs) {
            if (msg.isPending) continue;

            if (msg.role === 'user') {
                if (msg.functionResponses) {
                    const resultsText = msg.functionResponses.map(fr =>
                        `Action Result [${fr.name}]: ${JSON.stringify(fr.response?.result || "No result")}`
                    ).join('\n');
                    history.push({ role: 'user', parts: [{ text: resultsText }] });
                } else {
                    const text = msg.text || '';
                    if (text.trim()) {
                        history.push({ role: 'user', parts: [{ text }] });
                    }
                }
            } else {
                // Model
                const text = msg.text || '';
                if (text.trim() && !msg.isVerbose) { // Skip verbose logs in context?
                    history.push({ role: 'model', parts: [{ text }] });
                }
            }
        }
        return history;
    };

    const handleSendMessage = async (customPrompt?: string) => {
        if ((!input.trim() && !customPrompt) || isLoading) return;

        const userText = customPrompt || input;
        setInput('');
        setIsLoading(true);
        setError(null);

        const newMessage: ChatMessage = { role: 'user', text: userText };
        setMessages(prev => [...prev, newMessage]);

        // Check API Key
        if (!aiConfig.apiKey && aiConfig.provider !== 'ollama') {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: "Please provide an API Key to continue. I've opened the settings for you."
                }]);
                setIsLoading(false);
                onShowApiKeyModal();
            }, 500);
            return;
        }

        try {
            // Prepare Context
            const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
            let docContext = "";
            if (documentsRef.current && documentsRef.current.length > 0) {
                docContext = `CURRENT DOCUMENTS:\n${documentsRef.current.map(d => `- "${d.title}" (Length: ${d.content.length} chars)`).join('\n')}`;
            }

            // Tools Context
            const toolsContextString = Object.entries(TOOL_REGISTRY)
                .filter(([name]) => systemPromptConfig.enabledTools?.includes(name))
                .map(([name, def]) => {
                    const required = def.parameters.required?.join(", ") || "none";
                    const paramKeys = Object.keys(def.parameters.properties).join(", ");
                    return `- ${name}: ${def.description} (Params: ${paramKeys}. Required: ${required})`;
                }).join('\n');

            const systemInstruction = promptStore.get('chat:system', {
                defaultPrompt: systemPromptConfig.defaultPrompt,
                modeContext: isCreativeMode ? "MODE: Creative & Helpful." : "MODE: Strict, Precise, and Schematic.",
                schemaContext: ` CRITICAL RULES OF ENGAGEMENT:
1. RESPONSE FORMAT: You MUST respond with a valid JSON object adhering to the schema.
2. DISCRIMINATOR: 
   - IF the user asks to "create a graph", "plan a complex task", "analyze multiple items", or any multi-step workflow: YOU MUST GENERATE A 'plan'. 
   - DO NOT CHAT about the plan in the 'message' field. The 'message' field is for a brief 1-sentence confirmation only.
   - POPULATE the 'plan' array with specific, isolated steps.
3. IMMEDIATE ACTIONS:
   - ONLY use the 'actions' array for simple, single-step requests (e.g. "add a node named X").
   - IF a plan is present, 'actions' MUST be empty.
4. PLAN DESIGN:
   - Break the task into logical, dependent steps.
   - Each step's 'prompt' must be a self-contained instruction for an AI agent.
   - Use dependencies to ensure order.
`,
                docContext: docContext,
                toolsContext: toolsContextString,
                graphData: modelMarkdown
            });

            const history = buildApiHistory([...messages]); // Don't include the new one yet? Or do? 
            // The new message is 'userText'.
            const contents = [
                ...history,
                { role: 'user', parts: [{ text: userText }] }
            ];

            // Verbose Logging: Request
            if (isVerboseMode) {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: `**[VERBOSE] System Prompt:**\n\n${systemInstruction}\n\n**[VERBOSE] User Context:**\n${JSON.stringify(contents, null, 2)}`,
                    isVerbose: true
                }]);
            }

            const result = await callAI(
                aiConfig,
                contents,
                systemInstruction,
                undefined,
                CHAT_RESPONSE_SCHEMA
            );

            // Verbose Logging: Response
            if (isVerboseMode) {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: `**[VERBOSE] AI Response:**\n\n${result.text}`,
                    isVerbose: true
                }]);
            }

            // Parse response
            let responseJson;
            try {
                const cleanJson = result.text.replace(/```json\n?|```/g, '').trim();
                responseJson = JSON.parse(cleanJson);
            } catch (e) {
                console.warn("Failed to parse JSON", result.text);
                responseJson = { message: result.text };
            }

            let planSteps = (responseJson.plan && responseJson.plan.length > 0) ? responseJson.plan : undefined;

            // Initialize Plan State if proposed
            if (planSteps) {
                const initializedPlan = planSteps.map((s: any) => ({ ...s, status: 'pending' }));
                setPlanStatus('proposed');
                setActivePlan(initializedPlan);

                // Update the local variable for message creation so it matches activePlan reference
                planSteps = initializedPlan;
                responseJson.plan = initializedPlan;
            }

            // Critical: If a plan is proposed, IGNORE immediate actions to prevent auto-execution confusion.
            const toolRequests = planSteps ? [] : (responseJson.actions || []);

            const functionCalls = toolRequests.map((req: any) => ({
                name: req.tool,
                args: parseParameters(req.parameters),
                id: generateUUID()
            }));

            const modelMsg: ChatMessage = {
                role: 'model',
                text: responseJson.message || "(No message)",
                functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
                isPending: functionCalls.length > 0,
                // rawJson: responseJson, // Types might need update if I use rawJson
                plan: planSteps
            };

            setMessages(prev => [...prev, modelMsg]);

        } catch (err: any) {
            setError(err.message || "An error occurred.");
            setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        input,
        setInput,
        isLoading,
        error,
        setError,
        isCreativeMode,
        setIsCreativeMode,
        actionDecisions,
        setActionDecisions,
        handleSelectAll,
        handleApplyPending,
        handleSendMessage
    };
};
