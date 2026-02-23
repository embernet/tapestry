
import { useState, useRef, useEffect, useCallback } from 'react';
import { PlanStep, ChatMessage, AIConfig, SystemPromptConfig, Element, Relationship, TapestryDocument } from '../../types';
import { callAI, generateUUID, generateMarkdownFromGraph } from '../../utils';
import { promptStore } from '../../services/PromptStore';
import { EXECUTION_RESPONSE_SCHEMA, TOOL_REGISTRY } from './constants';
import { parseParameters } from './utils';
import { FunctionCall, FunctionResponse } from '@google/genai';

interface UsePlanExecutionProps {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    aiConfig: AIConfig;
    systemPromptConfig: SystemPromptConfig;
    elements: Element[];
    relationships: Relationship[];
    documents?: TapestryDocument[];
    executeFunctionCalls: (calls: FunctionCall[]) => FunctionResponse[];
    isVerboseMode: boolean;
}

export const usePlanExecution = ({
    messages,
    setMessages,
    aiConfig,
    systemPromptConfig,
    elements,
    relationships,
    documents,
    executeFunctionCalls,
    isVerboseMode
}: UsePlanExecutionProps) => {
    const [activePlan, setActivePlan] = useState<PlanStep[] | null>(null);
    const [planStatus, setPlanStatus] = useState<'proposed' | 'executing' | 'completed' | 'paused'>('proposed');
    const [executionStats, setExecutionStats] = useState<{ actions: number }>({ actions: 0 });

    const documentsRef = useRef<TapestryDocument[]>([]);
    const executionStartedRef = useRef(false);

    useEffect(() => {
        if (documents) documentsRef.current = documents;
    }, [documents]);

    const updateStepStatus = useCallback((stepId: string, status: PlanStep['status'], result?: string) => {
        setActivePlan(prev => {
            if (!prev) return null;
            // Check if status is actually changing to avoid unnecessary updates
            const currentStep = prev.find(s => s.id === stepId);
            if (currentStep && currentStep.status === status && currentStep.result === (result || currentStep.result)) {
                return prev;
            }
            return prev.map(s => s.id === stepId ? { ...s, status, result: result || s.result } : s);
        });

        // Sync to messages - use functional update to avoid dependency on activePlan/messages state
        setMessages(prev => prev.map(msg => {
            // Check if this message contains the step we are updating
            if (msg.plan && msg.plan.some(s => s.id === stepId)) {
                return {
                    ...msg,
                    plan: msg.plan.map(s => s.id === stepId ? { ...s, status, result: result || s.result } : s)
                };
            }
            return msg;
        }));
    }, [setMessages, setActivePlan]);

    // Reset execution flag when status is proposed
    useEffect(() => {
        if (planStatus === 'proposed') {
            executionStartedRef.current = false;
        }
    }, [planStatus]);

    // --- Plan Execution Loop (DAG) ---
    useEffect(() => {
        if (planStatus === 'executing' && activePlan && executionStartedRef.current) {
            // 1. Identify ready steps: Status Pending AND all dependencies are Completed
            const readySteps = activePlan.filter(step =>
                step.status === 'pending' &&
                step.dependencies.every(depId =>
                    activePlan.find(p => p.id === depId)?.status === 'completed'
                )
            );

            // 2. Check if we are done
            const allDone = activePlan.every(s => s.status === 'completed');
            if (allDone) {
                setPlanStatus('completed');
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: `**Plan Completed.**\n\nExecuted ${activePlan.length} steps with ${executionStats.actions} total actions.`,
                    plan: activePlan
                }]);
                return;
            }

            // 3. Stop if stuck (pending steps but dependencies failed/error)
            const stuck = activePlan.filter(s => s.status === 'pending').length > 0 && readySteps.length === 0 && !activePlan.some(s => s.status === 'in_progress');
            if (stuck) {
                setPlanStatus('paused');
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: `**Plan Paused.**\n\nDependency chain broken. Check for errors.`
                }]);
                return;
            }

            // 4. Parallel Execution: Launch ALL ready steps
            // Filter out steps already marked 'in_progress' to avoid double execution
            const newReadySteps = readySteps.filter(s => s.status !== 'in_progress');

            newReadySteps.forEach(stepToExecute => {
                executeStep(stepToExecute);
            });

            // Define executeStep outside the loop for clarity (or just inside logic if simple)
            async function executeStep(stepToExecute: PlanStep) {
                // Mark as in progress IMMEDIATELY to prevent re-selection
                updateStepStatus(stepToExecute.id, 'in_progress');

                if (isVerboseMode) {
                    setMessages(prev => [...prev, {
                        role: 'model',
                        text: `[SYSTEM] Starting Step ${stepToExecute.id}: "${stepToExecute.description}"`,
                        isVerbose: true
                    }]);
                }



                try {
                    // Gather outputs from dependencies
                    let dependencyContext = "";
                    stepToExecute.dependencies.forEach(depId => {
                        const depStep = activePlan!.find(p => p.id === depId);
                        if (depStep && depStep.result) {
                            dependencyContext += `\nOutput from Step '${depId}':\n${depStep.result}\n`;
                        }
                    });

                    const isolatedPrompt = `
                        TASK: ${stepToExecute.prompt}
                        
                        CONTEXT FROM PREVIOUS STEPS:
                        ${dependencyContext || "(None)"}
                        `;

                    const modelMarkdown = generateMarkdownFromGraph(elements, relationships);

                    let docContext = "";
                    if (documentsRef.current && documentsRef.current.length > 0) {
                        docContext = `CURRENT DOCUMENTS:\n${documentsRef.current.map(d => `- "${d.title}" (Length: ${d.content.length} chars)`).join('\n')}`;
                    }
                    const toolsContextString = Object.entries(TOOL_REGISTRY)
                        .filter(([name]) => systemPromptConfig.enabledTools?.includes(name))
                        .map(([name, def]) => {
                            const required = def.parameters.required?.join(", ") || "none";
                            const paramKeys = Object.keys(def.parameters.properties).join(", ");
                            return `- ${name}: ${def.description} (Params: ${paramKeys}. Required: ${required})`;
                        }).join('\n');

                    const systemInstruction = promptStore.get('chat:system', {
                        defaultPrompt: systemPromptConfig.defaultPrompt,
                        modeContext: "CONTEXT: You are an autonomous agent executing a single active step of a plan. The planning phase is COMPLETE. You are in EXECUTION MODE.\nCRITICAL RULE: Do NOT generate a 'plan' array. You MUST output a SINGLE JSON object with an 'actions' array containing tool calls. Do NOT output multiple JSON objects. 'parameters' must be an object, not a string. ALSO, you SHOULD provide a 'message' field with a brief, user-facing status update.",
                        schemaContext: "",
                        docContext: docContext,
                        toolsContext: toolsContextString,
                        graphData: modelMarkdown
                    });

                    const performAiCall = async (msgs: any[]) => {
                        let retries = 3;
                        while (retries > 0) {
                            try {
                                return await callAI(
                                    aiConfig,
                                    msgs,
                                    systemInstruction,
                                    undefined,
                                    EXECUTION_RESPONSE_SCHEMA,
                                    false
                                );
                            } catch (err: any) {
                                const isServerError = err.message && (err.message.includes('500') || err.message.includes('Internal') || err.message.includes('Overloaded'));
                                if (isServerError) {
                                    retries--;
                                    if (retries === 0) throw err;
                                    const delay = Math.pow(2, 3 - retries) * 1000;
                                    console.warn(`AI Service Error (${err.message}). Retrying in ${delay}ms...`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                } else {
                                    throw err;
                                }
                            }
                        }
                        throw new Error("AI unavailable after retries");
                    };

                    const contents = [{ role: 'user', parts: [{ text: isolatedPrompt }] }];

                    // Verbose Logging: Execution Request
                    if (isVerboseMode) {
                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: `**[VERBOSE] Execution Step ${stepToExecute.id} Prompt:**\n\n${systemInstruction}\n\n**[VERBOSE] User Inputs:**\n${JSON.stringify(contents, null, 2)}`,
                            isVerbose: true
                        }]);
                    }

                    // Add Timeout
                    const timeoutMs = 60000; // 60s timeout per step
                    const result = await Promise.race([
                        performAiCall(contents),
                        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Execution timed out")), timeoutMs))
                    ]);

                    // Verbose Logging: Execution Response
                    if (isVerboseMode) {
                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: `**[VERBOSE] Execution Step ${stepToExecute.id} Response:**\n\n${result.text}`,
                            isVerbose: true
                        }]);
                    }

                    let responseJson;
                    try {
                        const text = result.text;
                        // Attempt to parse as a single JSON object first
                        const jsonStart = text.indexOf('{');
                        const jsonEnd = text.lastIndexOf('}');

                        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                            const jsonStr = text.substring(jsonStart, jsonEnd + 1);
                            try {
                                responseJson = JSON.parse(jsonStr);
                            } catch (jsonErr) {
                                // Fallback: Check for multiple JSON objects (NDJSON)
                                const matches = text.match(/\{[\s\S]*?\}(?=\s*\{|\s*$)/g);
                                if (matches && matches.length > 1) {
                                    const objects = matches.map(m => {
                                        try { return JSON.parse(m); } catch (e) { return null; }
                                    }).filter(o => o !== null);

                                    // Synthesize into one response
                                    const actions = objects.filter(o => o.tool).map(o => ({
                                        tool: o.tool,
                                        parameters: o.parameters
                                    }));

                                    // Find a main response object if any (one that has 'message' or 'analysis')
                                    const mainObj = objects.find(o => o.message || o.analysis) || {};

                                    responseJson = {
                                        analysis: mainObj.analysis || "Synthesized from multiple JSON outputs",
                                        message: mainObj.message || "",
                                        actions: actions.length > 0 ? actions : (mainObj.actions || [])
                                    };
                                    if (actions.length > 0 && (!responseJson.actions || responseJson.actions.length === 0)) {
                                        responseJson.actions = actions;
                                    }
                                } else {
                                    throw jsonErr;
                                }
                            }
                        } else {
                            responseJson = JSON.parse(text);
                        }
                    } catch (e) {
                        console.error("JSON Parse Error on Step Response:", result.text);
                        throw new Error("Failed to parse AI response. " + result.text);
                    }

                    let toolRequests = responseJson.actions || [];
                    console.log('[DEBUG] executeStep AI Response:', responseJson);
                    console.log('[DEBUG] toolRequests derived:', toolRequests);
                    let message = responseJson.message || "";

                    let actionResultsText = "";
                    if (toolRequests.length > 0) {
                        const calls = toolRequests.map((req: any) => ({
                            name: req.tool,
                            args: parseParameters(req.parameters),
                            id: generateUUID()
                        }));

                        const responses = executeFunctionCalls(calls);

                        actionResultsText = responses.map((r, i) => `Action ${r.name}\nParams: ${JSON.stringify(calls[i].args)}\nResult: ${JSON.stringify(r.response?.result || "No result")}`).join('\n\n');
                        setExecutionStats(prev => ({ actions: prev.actions + calls.length }));
                    } else {
                        // Warning if no actions taken on an execution step, unless message explains it
                        if (!message) {
                            message = "(Step completed with no actions)";
                        }
                    }

                    // Small delay for realism/pacing
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const finalResult = message + (actionResultsText ? `\n\nTOOL RESULTS:\n${actionResultsText}` : "");
                    updateStepStatus(stepToExecute.id, 'completed', finalResult);

                } catch (e: any) {
                    console.error("Plan execution error", e);
                    updateStepStatus(stepToExecute.id, 'error', `Error: ${e.message}`);
                }
            }
        }
    }, [planStatus, activePlan, aiConfig, messages, systemPromptConfig, executionStats, documents, elements, relationships, isVerboseMode, executeFunctionCalls, updateStepStatus]);

    const handleExecutePlan = () => {
        executionStartedRef.current = true;
        setPlanStatus('executing');
    };

    const handleDiscardPlan = () => {
        setActivePlan(null);
        setPlanStatus('proposed');
    };

    return {
        activePlan,
        setActivePlan,
        planStatus,
        setPlanStatus,
        executionStats,
        setExecutionStats,
        handleExecutePlan,
        handleDiscardPlan
    };
};
