
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Content, FunctionCall, FunctionResponse, Type, Schema } from '@google/genai';
import { Element, Relationship, ModelActions, ColorScheme, SystemPromptConfig, TapestryDocument, TapestryFolder, ChatMessage, PlanStep } from '../types';
import { generateMarkdownFromGraph, callAI, AIConfig, generateUUID } from '../utils';
import { promptStore } from '../services/PromptStore';

interface ChatPanelProps {
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
  initialInput?: string;
  activeModel?: string;
  aiConfig: AIConfig;
  isDarkMode: boolean;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

// --- Tool Registry & Schema Definitions ---

interface ToolDefinition {
  description: string;
  parameters: {
    type: Type;
    properties: Record<string, Schema>;
    required?: string[];
  };
}

const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  addElement: {
    description: "Add a new node to the graph.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the element" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tags (max 20 chars each)" },
        notes: { type: Type.STRING, description: "Additional details" },
        rationale: { type: Type.STRING, description: "Why this element is being added" }
      },
      required: ["name"]
    }
  },
  updateElement: {
    description: "Update an existing node's properties.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the element to update" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tags (max 20 chars each)" },
        notes: { type: Type.STRING },
        rationale: { type: Type.STRING }
      },
      required: ["name"]
    }
  },
  deleteElement: {
    description: "Delete a node from the graph.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the element to delete" },
        rationale: { type: Type.STRING }
      },
      required: ["name"]
    }
  },
  addRelationship: {
    description: "Connect two nodes with a relationship.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceName: { type: Type.STRING, description: "Name of the source element" },
        targetName: { type: Type.STRING, description: "Name of the target element" },
        label: { type: Type.STRING, description: "Label for the connection (e.g. 'causes')" },
        direction: { type: Type.STRING, enum: ["TO", "FROM", "BOTH", "NONE"], description: "Direction of the relationship" },
        rationale: { type: Type.STRING }
      },
      required: ["sourceName", "targetName", "label"]
    }
  },
  deleteRelationship: {
    description: "Remove a connection between two nodes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceName: { type: Type.STRING },
        targetName: { type: Type.STRING },
        rationale: { type: Type.STRING }
      },
      required: ["sourceName", "targetName"]
    }
  },
  setElementAttribute: {
    description: "Set a key-value pair attribute on a node.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        elementName: { type: Type.STRING },
        key: { type: Type.STRING },
        value: { type: Type.STRING },
        rationale: { type: Type.STRING }
      },
      required: ["elementName", "key", "value"]
    }
  },
  deleteElementAttribute: {
    description: "Remove a key-value attribute from a node.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        elementName: { type: Type.STRING },
        key: { type: Type.STRING },
        rationale: { type: Type.STRING }
      },
      required: ["elementName", "key"]
    }
  },
  setRelationshipAttribute: {
    description: "Set a key-value pair attribute on a relationship.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceName: { type: Type.STRING },
        targetName: { type: Type.STRING },
        key: { type: Type.STRING },
        value: { type: Type.STRING },
        rationale: { type: Type.STRING }
      },
      required: ["sourceName", "targetName", "key", "value"]
    }
  },
  deleteRelationshipAttribute: {
    description: "Remove a key-value attribute from a relationship.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceName: { type: Type.STRING },
        targetName: { type: Type.STRING },
        key: { type: Type.STRING },
        rationale: { type: Type.STRING }
      },
      required: ["sourceName", "targetName", "key"]
    }
  },
  readDocument: {
    description: "Read the content of a document.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING }
      },
      required: ["title"]
    }
  },
  createDocument: {
    description: "Create a new document. Content is mandatory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING, description: "The full Markdown text content of the document." }
      },
      required: ["title", "content"]
    }
  },
  updateDocument: {
    description: "Update an existing document.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING, description: "The full Markdown text content to add or replace." },
        mode: { type: Type.STRING, enum: ["replace", "append", "prepend"], description: "How to apply the content." }
      },
      required: ["title", "content"]
    }
  },
  openTool: {
    description: "Open a specific UI tool in the application.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tool: { type: Type.STRING, enum: ["triz", "lss", "toc", "ssm", "scamper", "mining", "tagcloud", "swot", "explorer"] },
        subTool: { type: Type.STRING }
      },
      required: ["tool"]
    }
  }
};

// Updated Schema to support DAG Plans
const CHAT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Internal reasoning about the user's request." },
    message: { type: Type.STRING, description: "The conversational response to show to the user." },
    plan: {
      type: Type.ARRAY,
      description: "A Directed Acyclic Graph (DAG) of execution steps for complex tasks. Each step is a self-contained instruction.",
      items: { 
          type: Type.OBJECT,
          properties: {
              id: { type: Type.STRING, description: "Unique ID for this step (e.g. '1', 'search-step')." },
              description: { type: Type.STRING, description: "Short description of what this step does." },
              prompt: { type: Type.STRING, description: "The specific, self-contained instruction to send to the AI for this step." },
              dependencies: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: "IDs of steps that must be completed before this step starts." 
              }
          },
          required: ["id", "description", "prompt", "dependencies"]
      }
    },
    actions: {
      type: Type.ARRAY,
      description: "List of immediate actions to perform (if no plan is needed).",
      items: {
        type: Type.OBJECT,
        properties: {
            tool: { type: Type.STRING, description: "The name of the tool to use (e.g., addElement)." },
            parameters: { type: Type.STRING, description: "JSON string of key-value pairs for the tool arguments." }
        },
        required: ["tool", "parameters"]
      }
    }
  },
  required: ["message"]
};

const ChatPanel: React.FC<ChatPanelProps> = ({ 
    elements, relationships, colorSchemes, activeSchemeId, onClose, currentModelId, 
    modelActions, className, isOpen, onOpenPromptSettings, systemPromptConfig, 
    documents, folders, openDocIds, onLogHistory, onOpenHistory, onOpenTool, 
    initialInput, activeModel, aiConfig, isDarkMode, messages, setMessages
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreativeMode, setIsCreativeMode] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Plan State
  const [activePlan, setActivePlan] = useState<PlanStep[] | null>(null);
  const [planStatus, setPlanStatus] = useState<'proposed' | 'executing' | 'completed' | 'paused'>('proposed');
  const [executionStats, setExecutionStats] = useState<{ actions: number }>({ actions: 0 });
  const [isVerboseMode, setIsVerboseMode] = useState(false);
  
  // Ref to track latest documents state for the async planner loop
  const documentsRef = useRef<TapestryDocument[]>([]);
  useEffect(() => {
      if (documents) documentsRef.current = documents;
  }, [documents]);

  const planContextRef = useRef<string[]>([]);

  // Track decisions for pending actions: index -> status
  const [actionDecisions, setActionDecisions] = useState<Record<number, 'pending' | 'accepted' | 'rejected'>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Floating Window State
  // Initial positioning: Left side, below toolbar area, stretching down
  const [position, setPosition] = useState(() => ({ x: 20, y: 160 }));
  const [size, setSize] = useState(() => {
      const h = window.innerHeight - 160 - 20; // 160 top, 20 bottom padding
      return { width: 400, height: Math.max(400, h) };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
      if (isOpen) {
          if (initialInput) {
            setInput(initialInput);
          }
          
          setTimeout(() => {
              if (textareaRef.current) {
                  textareaRef.current.focus();
                  if (initialInput) {
                     const len = initialInput.length;
                     textareaRef.current.setSelectionRange(len, len);
                  }
              }
          }, 100);
      }
  }, [initialInput, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, actionDecisions, activePlan]);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, isOpen]);

  // Generate tool documentation string from registry
  const toolsContextString = useMemo(() => {
      return Object.entries(TOOL_REGISTRY).map(([name, def]) => {
          const required = def.parameters.required?.join(", ") || "none";
          const paramKeys = Object.keys(def.parameters.properties).join(", ");
          return `- ${name}: ${def.description} (Params: ${paramKeys}. Required: ${required})`;
      }).join('\n');
  }, []);

  const parseParameters = (params: any) => {
      if (typeof params === 'string') {
          try {
              return JSON.parse(params);
          } catch (e) {
              console.warn("Failed to parse tool parameters JSON:", params);
              return {};
          }
      }
      return params || {};
  };

  // --- Plan Execution Loop (DAG) ---
  useEffect(() => {
      if (planStatus === 'executing' && activePlan) {
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
                  text: `**Plan Completed.**\n\nExecuted ${activePlan.length} steps with ${executionStats.actions} total actions.` 
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

          // 4. Execute ready steps (For now, we pick the FIRST ready step to serialize execution and avoid rate limits/race conditions)
          // Ideally, we could execute parallel ready steps, but we'll keep it safe.
          const stepToExecute = readySteps[0];
          
          if (stepToExecute) {
              const executeStep = async () => {
                  const stepIndex = activePlan.findIndex(s => s.id === stepToExecute.id);
                  
                  // Mark as in progress
                  setActivePlan(prev => prev ? prev.map((s, i) => i === stepIndex ? { ...s, status: 'in_progress' } : s) : null);
                  
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
                          const depStep = activePlan.find(p => p.id === depId);
                          if (depStep && depStep.result) {
                              dependencyContext += `\nOutput from Step '${depId}':\n${depStep.result}\n`;
                          }
                      });

                      // Construct prompt for this specific step (Self-Contained)
                      // We do NOT send the full chat history. We only send system instruction + specific prompt.
                      const isolatedPrompt = `
                      TASK: ${stepToExecute.prompt}
                      
                      CONTEXT FROM PREVIOUS STEPS:
                      ${dependencyContext || "(None)"}
                      `;

                      if (isVerboseMode) {
                          setMessages(prev => [...prev, {
                              role: 'model',
                              text: `[SYSTEM] Execution Prompt:\n${isolatedPrompt}`,
                              isVerbose: true
                          }]);
                      }

                      // Construct dynamic system instructions with FRESH graph/doc state
                      const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
                      
                      let docContext = "";
                      // Use Ref for latest docs to avoid closure staleness
                      if (documentsRef.current && documentsRef.current.length > 0) {
                          docContext = `CURRENT DOCUMENTS:\n${documentsRef.current.map(d => `- "${d.title}" (Length: ${d.content.length} chars)`).join('\n')}`;
                      }

                      const systemInstruction = promptStore.get('chat:system', {
                        defaultPrompt: systemPromptConfig.defaultPrompt,
                        modeContext: "CONTEXT: You are an autonomous agent executing a specific step of a plan. You MUST output JSON. If the step implies modifying the graph (adding nodes, edges), you MUST use the provided tools in the 'actions' array.",
                        schemaContext: "", 
                        docContext: docContext,
                        toolsContext: toolsContextString,
                        graphData: modelMarkdown
                      });

                      // Helper: AI Call with Retry Logic
                      const performAiCall = async (msgs: any[]) => {
                          let retries = 3;
                          while (retries > 0) {
                              try {
                                  return await callAI(
                                      aiConfig,
                                      msgs,
                                      systemInstruction,
                                      undefined,
                                      CHAT_RESPONSE_SCHEMA,
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

                      // Call AI with isolated prompt
                      const contents = [{ role: 'user', parts: [{ text: isolatedPrompt }] }];
                      
                      let result = await performAiCall(contents);

                      if (isVerboseMode) {
                          setMessages(prev => [...prev, {
                              role: 'model',
                              text: `[SYSTEM] Raw AI Response:\n${result.text}`,
                              isVerbose: true
                          }]);
                      }

                      let responseJson;
                      try {
                        const cleanJson = result.text.replace(/```json\n?|```/g, '').trim();
                        responseJson = JSON.parse(cleanJson);
                      } catch (e) {
                        responseJson = { message: result.text, actions: [] };
                      }
                      
                      const toolRequests = responseJson.actions || [];
                      const message = responseJson.message || "";

                      // Execute Tools
                      let actionResultsText = "";
                      if (toolRequests.length > 0) {
                          const calls = toolRequests.map((req: any) => ({
                              name: req.tool,
                              args: parseParameters(req.parameters),
                              id: generateUUID()
                          }));
                          
                          const responses = executeFunctionCalls(calls);
                          
                          // Format results for the next step's context
                          actionResultsText = responses.map(r => `Action ${r.name} Result: ${JSON.stringify(r.response.result)}`).join('\n');
                          
                          if (isVerboseMode) {
                              setMessages(prev => [...prev, {
                                  role: 'model',
                                  text: `[SYSTEM] Tools Executed:\n${actionResultsText}`,
                                  isVerbose: true
                              }]);
                          }
                          
                          setExecutionStats(prev => ({ actions: prev.actions + calls.length }));
                      }

                      // Wait for state to settle
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      // Mark complete and pass result to next step
                      const finalResult = message + (actionResultsText ? `\n\nTOOL RESULTS:\n${actionResultsText}` : "");
                      
                      setActivePlan(prev => prev ? prev.map((s, i) => i === stepIndex ? { 
                          ...s, 
                          status: 'completed', 
                          result: finalResult
                      } : s) : null);

                  } catch (e: any) {
                      console.error("Plan execution error", e);
                      if (isVerboseMode) {
                          setMessages(prev => [...prev, {
                              role: 'model',
                              text: `[SYSTEM] Execution Error: ${e.message}`,
                              isVerbose: true
                          }]);
                      }
                      setActivePlan(prev => prev ? prev.map((s, i) => i === stepIndex ? { ...s, status: 'error', result: `Error: ${e.message}` } : s) : null);
                  }
              };
              
              executeStep();
          }
      }
  }, [planStatus, activePlan, aiConfig, messages, systemPromptConfig, executionStats, documents, elements, relationships, isVerboseMode]);


  // --- Drag & Resize Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
              setPosition({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y
              });
          }
          if (isResizing) {
              setSize({
                  width: Math.max(320, resizeStartRef.current.w + (e.clientX - resizeStartRef.current.x)),
                  height: Math.max(400, resizeStartRef.current.h + (e.clientY - resizeStartRef.current.y))
              });
          }
      };
      
      const handleMouseUp = () => {
          setIsDragging(false);
          setIsResizing(false);
      };

      if (isDragging || isResizing) {
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, isResizing]);

  const executeFunctionCalls = (functionCalls: FunctionCall[]) => {
      const responses: FunctionResponse[] = [];
      
      functionCalls.forEach((call, index) => {
          // If running a plan, assume accepted. If pending UI, check decisions.
          const decision = planStatus === 'executing' ? 'accepted' : (actionDecisions[index] || 'accepted');
          let result: any;
          const args = call.args as any;

          if (decision === 'rejected') {
              result = { skipped: true, message: "User rejected this action." };
          } else {
              try {
                  // Note: Input validation is now handled by the Schema in the AI request.
                  // We assume args match the schema defined in TOOL_REGISTRY.
                  
                  switch (call.name) {
                      case 'addElement':
                          const id = modelActions.addElement(args);
                          result = { success: true, message: `Added element '${args.name}' with ID ${id}` };
                          break;
                      case 'updateElement':
                          const updated = modelActions.updateElement(args.name as string, args);
                          result = { success: updated, message: updated ? `Updated '${args.name}'` : `Could not find element '${args.name}'` };
                          break;
                      case 'deleteElement':
                          const deleted = modelActions.deleteElement(args.name as string);
                          result = { success: deleted, message: deleted ? `Deleted '${args.name}'` : `Could not find element '${args.name}'` };
                          break;
                      case 'addRelationship':
                          // Some AI models might still output alias keys despite schema, but Schema should prevent it.
                          // Sticking to schema keys: sourceName, targetName
                          if (args.sourceName && args.targetName) {
                              const relAdded = modelActions.addRelationship(
                                  args.sourceName, 
                                  args.targetName, 
                                  args.label || '', 
                                  args.direction
                              );
                              result = { success: relAdded, message: relAdded ? `Connected '${args.sourceName}' to '${args.targetName}'` : `Failed to connect. Check nodes.` };
                          } else {
                              result = { success: false, message: "Missing sourceName or targetName" };
                          }
                          break;
                      case 'deleteRelationship':
                          const relDeleted = modelActions.deleteRelationship(args.sourceName, args.targetName);
                          result = { success: relDeleted, message: relDeleted ? `Removed connection.` : `Connection not found.` };
                          break;
                      case 'setElementAttribute':
                          const elAttrSet = modelActions.setElementAttribute(args.elementName, args.key, args.value);
                          result = { success: elAttrSet, message: elAttrSet ? `Attribute set.` : `Element not found` };
                          break;
                      case 'deleteElementAttribute':
                          const elAttrDel = modelActions.deleteElementAttribute(args.elementName, args.key);
                          result = { success: elAttrDel, message: elAttrDel ? `Attribute deleted.` : `Element not found` };
                          break;
                      case 'setRelationshipAttribute':
                          const relAttrSet = modelActions.setRelationshipAttribute(args.sourceName, args.targetName, args.key, args.value);
                          result = { success: relAttrSet, message: relAttrSet ? `Attribute set.` : `Relationship not found` };
                          break;
                      case 'deleteRelationshipAttribute':
                          const relAttrDel = modelActions.deleteRelationshipAttribute(args.sourceName, args.targetName, args.key);
                          result = { success: relAttrDel, message: relAttrDel ? `Attribute deleted.` : `Relationship not found` };
                          break;
                      case 'readDocument':
                          const content = modelActions.readDocument(args.title);
                          result = { success: content !== null, content: content !== null ? content : "Document not found." };
                          break;
                      case 'createDocument':
                          // Schema enforces 'content' existence
                          const newDocId = modelActions.createDocument(args.title, args.content);
                          result = { success: true, message: `Created document '${args.title}' (ID: ${newDocId}).`, docId: newDocId };
                          break;
                      case 'updateDocument':
                          // Schema enforces 'content' existence
                          const docUpdated = modelActions.updateDocument(args.title, args.content, args.mode);
                          result = { success: docUpdated, message: docUpdated ? `Updated document '${args.title}'.` : "Document not found." };
                          break;
                      case 'openTool':
                          if (onOpenTool) {
                              onOpenTool(args.tool, args.subTool);
                              result = { success: true, message: `Opened tool ${args.tool}` };
                          } else {
                              result = { success: false, message: "Tool opening not supported" };
                          }
                          break;
                      default:
                          result = { success: false, message: "Unknown function" };
                  }
              } catch (e) {
                  result = { success: false, message: `Error executing ${call.name}: ${e}` };
              }
          }
          
          responses.push({
              name: call.name,
              id: call.id, 
              response: { result }
          });
      });
      
      return responses;
  }

  // Reconstructs history as Text/JSON exchanges for the model context
  const buildApiHistory = (msgs: ChatMessage[]): Content[] => {
    const history: Content[] = [];
    
    for (const msg of msgs) {
        if (msg.isPending) continue; // Don't include pending turns

        if (msg.role === 'user') {
            // Check if this user message is actually a result of tool execution
            if (msg.functionResponses) {
                const resultsText = msg.functionResponses.map(fr => 
                    `Action Result [${fr.name}]: ${JSON.stringify(fr.response.result)}`
                ).join('\n');
                history.push({ role: 'user', parts: [{ text: resultsText }] });
            } else {
                // IMPORTANT: Filter out empty text to avoid API errors
                const text = msg.text || '';
                if (text.trim()) {
                    history.push({ role: 'user', parts: [{ text }] });
                }
            }
        } else {
            // Model Role
            // If we have the raw JSON the model generated, use that to maintain state
            if (msg.rawJson) {
                history.push({ role: 'model', parts: [{ text: JSON.stringify(msg.rawJson) }] });
            } else {
                // Ensure model text isn't empty if no JSON, though model messages can be just function calls
                // If it was just function calls, the next turn would be user function responses.
                // Here we just use what we have stored.
                const text = msg.text || '';
                if (text.trim()) {
                    history.push({ role: 'model', parts: [{ text }] });
                }
            }
        }
    }
    return history;
  };

  const getActionTitle = (fc: FunctionCall) => {
      const args = parseParameters(fc.args);
      switch(fc.name) {
          case 'addElement': return `Add Element: "${args.name}"`;
          case 'addRelationship': return `Add Connection`;
          case 'deleteElement': return `Delete Element: "${args.name}"`;
          case 'updateElement': return `Update Element: "${args.name}"`;
          case 'deleteRelationship': return `Disconnect: "${args.sourceName}" & "${args.targetName}"`;
          case 'readDocument': return `Read Document: "${args.title}"`;
          case 'createDocument': return `Create Document: "${args.title}"`;
          case 'updateDocument': return `Update Document: "${args.title}" (${args.mode || 'replace'})`;
          case 'openTool': return `Open Tool: ${args.tool}`;
          default: return fc.name;
      }
  };

  const renderActionContent = (fc: FunctionCall, isDark: boolean) => {
      const args = parseParameters(fc.args);
      const labelClass = isDark ? 'text-gray-400' : 'text-gray-500';
      const textClass = isDark ? 'text-gray-300' : 'text-gray-700';

      if (fc.name === 'addRelationship') {
          return (
            <div className="mt-1 space-y-1 text-xs">
                <div className="flex gap-2">
                    <span className={`${labelClass} font-semibold w-10`}>From:</span>
                    <span className={`${textClass} font-mono`}>{args.sourceName}</span>
                </div>
                <div className="flex gap-2">
                    <span className={`${labelClass} font-semibold w-10`}>To:</span>
                    <span className={`${textClass} font-mono`}>{args.targetName}</span>
                </div>
                <div className="flex gap-2">
                    <span className={`${labelClass} font-semibold w-10`}>Label:</span>
                    <span className={`${textClass} italic`}>{args.label || '(none)'}</span>
                </div>
                {args.rationale && (
                    <div className="flex gap-2 mt-1 border-t border-gray-700/50 pt-1">
                        <span className={`${labelClass} font-semibold w-10`}>Why:</span>
                        <span className={`${textClass} opacity-80`}>{args.rationale}</span>
                    </div>
                )}
            </div>
          );
      }

      if (fc.name === 'createDocument' || fc.name === 'updateDocument') {
          const contentPreview = args.content;
          return (
            <div className="mt-1 space-y-1 text-xs">
                <div className="flex gap-1">
                    <span className={`${labelClass} font-semibold`}>Title:</span>
                    <span className={textClass}>{args.title}</span>
                </div>
                {args.mode && (
                    <div className="flex gap-1">
                        <span className={`${labelClass} font-semibold`}>Mode:</span>
                        <span className={textClass}>{args.mode}</span>
                    </div>
                )}
                {contentPreview && (
                    <div className="mt-1 p-2 bg-black/10 rounded border border-white/5 font-mono max-h-20 overflow-y-auto">
                        {contentPreview.length > 100 ? contentPreview.substring(0, 100) + '...' : contentPreview}
                    </div>
                )}
            </div>
          );
      }

      return (
          <div className="mt-1 space-y-1 text-xs">
              {Object.entries(args).map(([k, v]) => {
                  if (k === 'name' || k === 'sourceName' || k === 'targetName') return null; // Already in title
                  return (
                      <div key={k} className="flex gap-1">
                          <span className={`${labelClass} font-semibold`}>{k}:</span>
                          <span className={textClass}>{JSON.stringify(v)}</span>
                      </div>
                  );
              })}
          </div>
      );
  };

  const handleSendMessage = async (customPrompt?: string) => {
    if ((!input.trim() && !customPrompt) || isLoading) return;

    // Handle modification of proposed plan
    if (planStatus === 'proposed' && activePlan) {
        const userModification = input.trim();
        const modificationPrompt = promptStore.get('chat:plan:modify', {
             currentPlan: JSON.stringify(activePlan.map(p => p.description)),
             userRequest: userModification
        });
        
        setInput('');
        setIsLoading(true);
        // ... (call AI with modification prompt)
        try {
             const contents = buildApiHistory(messages);
             const systemInstruction = `You are a planning assistant. Update the plan based on user feedback.
             OUTPUT FORMAT: JSON with a 'plan' array of objects matching the schema.`;
             
             // Ensure prompt is valid
             if (!modificationPrompt || !modificationPrompt.trim()) throw new Error("Modification prompt is empty");

             const result = await callAI(aiConfig, [{role: 'user', parts: [{text: modificationPrompt}]}], systemInstruction, undefined, CHAT_RESPONSE_SCHEMA, false);
             const responseJson = JSON.parse(result.text);
             
             if (responseJson.plan) {
                 const newPlan: PlanStep[] = responseJson.plan.map((p: any) => ({
                    id: p.id || generateUUID(),
                    description: p.description,
                    prompt: p.prompt,
                    dependencies: p.dependencies || [],
                    status: 'pending'
                }));
                setActivePlan(newPlan);
                setMessages(prev => [...prev, { role: 'user', text: `Modify plan: ${userModification}` }, { role: 'model', text: responseJson.message || "Plan updated." }]);
             }
        } catch (e) {
            console.error("Plan modification failed", e);
            setError("Failed to modify plan.");
        } finally {
            setIsLoading(false);
        }
        return;
    }

    const userMessageText = customPrompt || input.trim();
    if (!userMessageText) return; // double check

    const userMessage: ChatMessage = { role: 'user', text: userMessageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    setInput('');
    setIsLoading(true);
    setError(null);
    setShowErrorModal(false);

    try {
        const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
        
        let schemaContext = "No specific schema defined.";
        const activeScheme = colorSchemes.find(s => s.id === activeSchemeId);
        if (activeScheme) {
             const tagList = Object.keys(activeScheme.tagColors).join(', ');
             // Add lists
             let listContext = "";
             if (activeScheme.customLists && Object.keys(activeScheme.customLists).length > 0) {
                 listContext = "\nCustom Lists defined:\n";
                 Object.entries(activeScheme.customLists).forEach(([key, items]) => {
                     const listItems = items as string[];
                     const desc = activeScheme.customListDescriptions?.[key] ? ` (${activeScheme.customListDescriptions[key]})` : "";
                     const defaults = listItems.length > 0 ? ` Defaults: ${listItems.join(', ')}` : "";
                     listContext += `- ${key}${desc}${defaults}\n`;
                 });
             }
             schemaContext = `ACTIVE SCHEMA: "${activeScheme.name}"\nTags: ${tagList}${listContext}`;
        }

        let docContext = "";
        if (documents && documents.length > 0) {
            docContext = `AVAILABLE DOCUMENTS:\n${documents.map(d => `- "${d.title}"`).join('\n')}`;
        }

        const systemInstruction = promptStore.get('chat:system', {
            defaultPrompt: systemPromptConfig.defaultPrompt,
            modeContext: isCreativeMode ? 'MODE: CREATIVE PARTNER (Proactive, suggest ideas)' : 'MODE: STRICT ANALYST (Only facts)',
            schemaContext,
            docContext,
            toolsContext: toolsContextString,
            graphData: modelMarkdown
        });

        const contents: Content[] = buildApiHistory(newMessages);
        
        const requestPayload = {
            config: aiConfig,
            systemInstruction,
            contents,
            schema: CHAT_RESPONSE_SCHEMA
        };

        // Pass generated schema to force strictly typed JSON output (with params as string)
        const result = await callAI(aiConfig, contents, systemInstruction, undefined, CHAT_RESPONSE_SCHEMA, false);

        const responseJson = JSON.parse(result.text);
        
        // Handle Plan
        let planSteps: PlanStep[] | undefined = undefined;
        if (responseJson.plan && Array.isArray(responseJson.plan) && responseJson.plan.length > 0) {
            planSteps = responseJson.plan.map((p: any) => ({
                id: p.id || generateUUID(),
                description: p.description,
                prompt: p.prompt,
                dependencies: p.dependencies || [],
                status: 'pending'
            }));
            setActivePlan(planSteps);
            setPlanStatus('proposed');
            setExecutionStats({ actions: 0 });
            planContextRef.current = []; // Reset accumulated history for new plan
        }

        const toolRequests = responseJson.actions || [];
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
            rawJson: responseJson,
            requestPayload: requestPayload,
            plan: planSteps
        };

        setMessages(prev => [...prev, modelMsg]);

        // Log to Main App History if valid
        if (onLogHistory && (responseJson.message || functionCalls.length > 0)) {
            const actionSummary = functionCalls.length > 0 ? `\nSuggested Actions: ${functionCalls.length}` : '';
            const summary = responseJson.message.substring(0, 100) + (responseJson.message.length > 100 ? '...' : '');
            
            onLogHistory(
                'AI Chat',
                `**User:** ${userMessageText}\n\n**AI:** ${responseJson.message}${actionSummary}`,
                summary,
                'chat'
            );
        }

    } catch (e: any) {
        console.error("AI Error:", e);
        setError(e.message || "Failed to generate response");
        setMessages(prev => prev.slice(0, -1)); // Remove failed user message
    } finally {
        setIsLoading(false);
    }
  };

  const handleApplyPending = async (msgIndex: number) => {
      const msg = messages[msgIndex];
      if (!msg.functionCalls) return;

      setIsLoading(true);
      
      // Execute accepted calls
      const functionResponses = executeFunctionCalls(msg.functionCalls);
      
      setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[msgIndex] = { ...msg, isPending: false, functionResponses: functionResponses.map(r => r.response as FunctionResponse) };
          return newMsgs;
      });
      
      setIsLoading(false);
  };

  const handleSelectAll = (msgIndex: number, select: boolean) => {
      const msg = messages[msgIndex];
      if (!msg?.functionCalls || !msg.isPending) return;
      
      const newDecisions: Record<number, 'pending' | 'accepted' | 'rejected'> = { ...actionDecisions };
      msg.functionCalls.forEach((_, i) => {
          newDecisions[i] = select ? 'accepted' : 'rejected';
      });
      setActionDecisions(newDecisions);
  };

  const handleExecutePlan = () => {
      setPlanStatus('executing');
      planContextRef.current = []; // Ensure context is clean when execution starts
  };

  const handleDiscardPlan = () => {
      setActivePlan(null);
      setPlanStatus('proposed');
  };

  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const messageUserBg = 'bg-blue-600 text-white';
  const messageModelBg = isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
  const actionBg = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300';
  const inputBg = isDarkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  return (
    <>
    <div 
        className={`fixed ${bgClass} border ${borderClass} rounded-lg shadow-2xl flex flex-col z-30 ${className} ${isOpen ? '' : 'hidden'}`}
        style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
        {/* Header - Draggable */}
        <div 
            className={`p-4 border-b ${borderClass} flex justify-between items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-t-lg cursor-move select-none`}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h2 className={`text-lg font-bold ${textClass}`}>AI Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onOpenHistory} 
                    className={`${subTextClass} hover:text-blue-500 p-1 flex items-center gap-1 bg-gray-700/30 rounded border border-transparent hover:border-blue-500/50`} 
                    title="Open AI History"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold">History</span>
                </button>
                <div className="w-px h-4 bg-gray-600 mx-1"></div>
                <button onClick={onOpenPromptSettings} className={`${subTextClass} hover:text-blue-500 p-1`} title="Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={onClose} className={`${subTextClass} hover:text-red-500 p-1`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
            {messages.map((msg, idx) => {
                if (msg.isVerbose) {
                    return (
                        <div key={idx} className="w-full px-4 mb-2">
                            <div className={`text-[10px] font-mono whitespace-pre-wrap p-2 rounded border-l-2 ${isDarkMode ? 'bg-black/20 text-green-400 border-green-600' : 'bg-gray-100 text-green-700 border-green-500'}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                }

                return (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.text && (
                        <div className={`p-3 rounded-lg max-w-[90%] text-sm whitespace-pre-wrap ${msg.role === 'user' ? messageUserBg : messageModelBg}`}>
                            {msg.text}
                        </div>
                    )}
                    
                    {/* Plan Render within message context (if newly proposed) */}
                    {msg.plan && planStatus === 'proposed' && activePlan === msg.plan && (
                        <div className={`mt-2 ${actionBg} border rounded-lg p-3 w-full max-w-[95%] shadow-lg border-l-4 border-l-purple-500`}>
                            <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Proposed Plan</h4>
                            <div className="space-y-2">
                                {msg.plan.map((step, i) => (
                                    <div key={i} className="flex gap-2 text-xs text-gray-300">
                                        <span className="font-mono text-gray-500 w-6">{step.id}.</span>
                                        <div className="flex flex-col">
                                            <span>{step.description}</span>
                                            {step.dependencies.length > 0 && (
                                                <span className="text-[10px] text-gray-500">Wait for: {step.dependencies.join(', ')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="flex justify-end gap-2 items-center">
                                    <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none hover:text-blue-500 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={isVerboseMode} 
                                            onChange={(e) => setIsVerboseMode(e.target.checked)} 
                                            className="rounded border-gray-600 bg-transparent focus:ring-0 w-3 h-3 text-blue-500"
                                        />
                                        Verbose Mode (Debug)
                                    </label>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={handleDiscardPlan} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1">Discard</button>
                                    <button onClick={handleExecutePlan} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold">Execute Plan</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {msg.functionCalls && (
                        <div className={`mt-2 ${actionBg} border rounded-lg p-2 w-full max-w-[95%] shadow-lg`}>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <div className={`text-xs font-bold ${subTextClass} uppercase tracking-wider`}>Proposed Actions</div>
                                {msg.isPending && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSelectAll(idx, true)} className="text-[10px] text-blue-500 hover:underline font-semibold">Select All</button>
                                        <button onClick={() => handleSelectAll(idx, false)} className="text-[10px] text-blue-500 hover:underline font-semibold">Select None</button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                {msg.functionCalls.map((fc, i) => (
                                    <div key={i} className={`flex items-start gap-2 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} p-2 rounded text-xs`}>
                                        {msg.isPending && (
                                            <input 
                                                type="checkbox" 
                                                checked={actionDecisions[i] === 'accepted'}
                                                onChange={() => setActionDecisions(prev => ({ ...prev, [i]: prev[i] === 'accepted' ? 'rejected' : 'accepted' }))}
                                                className="cursor-pointer mt-0.5"
                                            />
                                        )}
                                        <div className={`flex-grow ${actionDecisions[i] === 'rejected' ? 'opacity-50 line-through' : ''}`}>
                                            <span className="font-bold text-blue-500">{getActionTitle(fc)}</span>
                                            {renderActionContent(fc, isDarkMode)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {msg.isPending ? (
                                <div className="mt-3 flex justify-end">
                                    <button 
                                        onClick={() => handleApplyPending(idx)}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold"
                                    >
                                        Apply Selected
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-2 text-[10px] text-gray-500 text-right italic border-t border-gray-700 pt-1">
                                    Processed
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )})}
            {isLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs animate-pulse">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Thinking...
                </div>
            )}
            
            {/* Active Plan Execution UI (Sticky at bottom of messages) */}
            {activePlan && (planStatus === 'executing' || planStatus === 'paused') && (
                <div className={`mt-auto sticky bottom-0 ${isDarkMode ? 'bg-gray-800 border-t-4 border-purple-500' : 'bg-white border-t-4 border-purple-500'} p-3 rounded-t shadow-lg z-10`}>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider animate-pulse">Executing Plan...</h4>
                        <button onClick={() => setPlanStatus('paused')} className="text-[10px] text-gray-400 hover:text-white">Pause</button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {activePlan.map((step, i) => (
                            <div key={i} className="flex gap-2 items-center text-xs">
                                <span className="font-mono text-gray-500 min-w-[20px]">{step.id}</span>
                                <div className="flex-grow truncate text-gray-300">
                                    {step.description}
                                    {step.status === 'pending' && step.dependencies.length > 0 && 
                                       <span className="text-gray-600 ml-2">(waits for {step.dependencies.join(', ')})</span>
                                    }
                                </div>
                                <div className="w-4">
                                    {step.status === 'pending' && <span className="text-gray-600">○</span>}
                                    {step.status === 'in_progress' && <span className="text-blue-400 animate-spin">◐</span>}
                                    {step.status === 'completed' && <span className="text-green-500">✓</span>}
                                    {step.status === 'error' && <span className="text-red-500">✕</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${borderClass}`}>
            <div className="flex gap-2 relative">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={planStatus === 'proposed' ? "Type to modify the proposed plan..." : "Ask a question or request changes..."}
                    className={`w-full ${inputBg} text-sm rounded p-2 border focus:border-blue-500 outline-none resize-none max-h-32 scrollbar-thin ${planStatus === 'proposed' ? 'border-purple-500 ring-1 ring-purple-500' : ''}`}
                    rows={1}
                />
                <button 
                    onClick={() => handleSendMessage()} 
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed self-end h-9 w-9 flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
                <button onClick={() => setIsCreativeMode(!isCreativeMode)} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${isCreativeMode ? 'border-purple-500 text-purple-500' : `${isDarkMode ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'}`}`}>
                    {isCreativeMode ? 'Creative Mode' : 'Strict Mode'}
                </button>
                {error ? (
                    <button 
                        onClick={() => setShowErrorModal(true)}
                        className="bg-red-900/50 hover:bg-red-900 border border-red-500 text-red-400 text-xs px-2 py-0.5 rounded flex items-center gap-1 transition-colors max-w-[200px]"
                    >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="truncate">Error (Click to view)</span>
                    </button>
                ) : <span></span>}
            </div>
        </div>

        {/* Resize Handle */}
        <div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-40 flex items-end justify-end p-0.5"
            onMouseDown={handleResizeStart}
        >
             <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-500 opacity-50">
                <path d="M10 10 L10 0 L0 10 Z" fill="currentColor" />
            </svg>
        </div>
    </div>

    {/* Error Modal */}
    {showErrorModal && error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-lg ${isDarkMode ? 'bg-gray-800 border-red-500' : 'bg-white border-red-400'} border-2 rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden`}>
                <div className="p-3 bg-red-900/20 border-b border-red-500/30 flex justify-between items-center">
                    <h3 className="text-red-400 font-bold text-sm uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Error Details
                    </h3>
                    <button onClick={() => setShowErrorModal(false)} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto font-mono text-xs text-red-300 whitespace-pre-wrap break-words flex-grow bg-black/20">
                    {error}
                </div>
                <div className="p-3 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-2">
                    <button 
                        onClick={() => { navigator.clipboard.writeText(error); setShowErrorModal(false); }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded transition-colors"
                    >
                        Copy & Close
                    </button>
                    <button 
                        onClick={() => setShowErrorModal(false)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default ChatPanel;
