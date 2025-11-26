
import React, { useState, useEffect, useRef } from 'react';
import { Content, Part, Type, Tool, FunctionCall, FunctionResponse } from '@google/genai';
import { Element, Relationship, ModelActions, ColorScheme, SystemPromptConfig, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph, callAI, AIConfig } from '../utils';
import { AVAILABLE_AI_TOOLS } from '../constants';

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
}

interface Message {
  role: 'user' | 'model';
  text?: string;
  functionCalls?: FunctionCall[]; // To display tool usage
  functionResponses?: FunctionResponse[];
  isPending?: boolean; // If true, the tool calls are waiting for user confirmation
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
    elements, relationships, colorSchemes, activeSchemeId, onClose, currentModelId, 
    modelActions, className, isOpen, onOpenPromptSettings, systemPromptConfig, 
    documents, folders, openDocIds, onLogHistory, onOpenHistory, onOpenTool, 
    initialInput, activeModel, aiConfig 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreativeMode, setIsCreativeMode] = useState(true);
  
  // Track decisions for pending actions: index -> status
  const [actionDecisions, setActionDecisions] = useState<Record<number, 'pending' | 'accepted' | 'rejected'>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      if (initialInput && isOpen) {
          setInput(initialInput);
          // Auto focus
          setTimeout(() => {
              textareaRef.current?.focus();
              textareaRef.current?.setSelectionRange(initialInput.length, initialInput.length);
          }, 100);
      }
  }, [initialInput, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, actionDecisions]);

  // This effect resets the chat if a new model is loaded.
  useEffect(() => {
    setMessages([{ role: 'model', text: "Hello! I'm your AI assistant. Ask me anything about your current model, or ask me to make changes to it." }]);
    setError(null);
    setIsLoading(false);
    setActionDecisions({});
  }, [currentModelId]);

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

  const tools: Tool[] = [
      {
          functionDeclarations: [
              {
                  name: "addElement",
                  description: "Adds a new element (node) to the graph. Use this when the user wants to create a new idea, person, or entity.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          name: { type: Type.STRING, description: "The name of the element." },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional tags for categorization. Refer to the Active Schema for standard tags." },
                          notes: { type: Type.STRING, description: "Optional descriptive notes." },
                          rationale: { type: Type.STRING, description: "A short note explaining WHY you are proposing to add this element." }
                      },
                      required: ["name", "rationale"]
                  }
              },
              {
                  name: "updateElement",
                  description: "Updates an existing element. Use this to add tags or update notes.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          name: { type: Type.STRING, description: "The name of the element to update (must match existing name)." },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "New tags to add." },
                          notes: { type: Type.STRING, description: "New notes content." },
                          rationale: { type: Type.STRING, description: "A short note explaining WHY you are proposing this update." }
                      },
                      required: ["name", "rationale"]
                  }
              },
              {
                  name: "deleteElement",
                  description: "Deletes an element and its relationships from the graph.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          name: { type: Type.STRING, description: "The name of the element to delete." },
                          rationale: { type: Type.STRING, description: "A short note explaining WHY you are proposing to delete this." }
                      },
                      required: ["name", "rationale"]
                  }
              },
              {
                  name: "addRelationship",
                  description: "Connects two existing elements with a relationship.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          sourceName: { type: Type.STRING, description: "The name of the starting element." },
                          targetName: { type: Type.STRING, description: "The name of the ending element." },
                          label: { type: Type.STRING, description: "The label describing the relationship (e.g., 'causes', 'belongs to'). Check Schema for standard labels." },
                          direction: { type: Type.STRING, description: "Direction: 'TO', 'FROM', or 'NONE'. Default is 'TO'." },
                          rationale: { type: Type.STRING, description: "A short note explaining WHY you are proposing this connection." }
                      },
                      required: ["sourceName", "targetName", "label", "rationale"]
                  }
              },
              {
                  name: "deleteRelationship",
                  description: "Removes a relationship between two elements.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          sourceName: { type: Type.STRING, description: "The name of the source element." },
                          targetName: { type: Type.STRING, description: "The name of the target element." },
                          rationale: { type: Type.STRING, description: "A short note explaining WHY you are proposing to remove this connection." }
                      },
                      required: ["sourceName", "targetName", "rationale"]
                  }
              },
              {
                  name: "setElementAttribute",
                  description: "Sets a custom attribute (key-value pair) on an element.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          elementName: { type: Type.STRING, description: "The name of the element." },
                          key: { type: Type.STRING, description: "The attribute key (e.g., 'cost', 'priority')." },
                          value: { type: Type.STRING, description: "The attribute value." },
                          rationale: { type: Type.STRING, description: "Why this attribute is being added/updated." }
                      },
                      required: ["elementName", "key", "value", "rationale"]
                  }
              },
              {
                  name: "deleteElementAttribute",
                  description: "Deletes a custom attribute from an element.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          elementName: { type: Type.STRING, description: "The name of the element." },
                          key: { type: Type.STRING, description: "The attribute key to remove." },
                          rationale: { type: Type.STRING, description: "Why this attribute is being removed." }
                      },
                      required: ["elementName", "key", "rationale"]
                  }
              },
              {
                  name: "setRelationshipAttribute",
                  description: "Sets a custom attribute (key-value pair) on a relationship.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          sourceName: { type: Type.STRING, description: "The source element name." },
                          targetName: { type: Type.STRING, description: "The target element name." },
                          key: { type: Type.STRING, description: "The attribute key." },
                          value: { type: Type.STRING, description: "The attribute value." },
                          rationale: { type: Type.STRING, description: "Why this attribute is being added/updated." }
                      },
                      required: ["sourceName", "targetName", "key", "value", "rationale"]
                  }
              },
              {
                  name: "deleteRelationshipAttribute",
                  description: "Deletes a custom attribute from a relationship.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          sourceName: { type: Type.STRING, description: "The source element name." },
                          targetName: { type: Type.STRING, description: "The target element name." },
                          key: { type: Type.STRING, description: "The attribute key to remove." },
                          rationale: { type: Type.STRING, description: "Why this attribute is being removed." }
                      },
                      required: ["sourceName", "targetName", "key", "rationale"]
                  }
              },
              // Document Actions
              {
                  name: "readDocument",
                  description: "Reads the full content of a document by its title.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING, description: "The title of the document to read." }
                      },
                      required: ["title"]
                  }
              },
              {
                  name: "createDocument",
                  description: "Creates a new text document.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING, description: "The title of the new document." },
                          content: { type: Type.STRING, description: "The initial content of the document." }
                      },
                      required: ["title", "content"]
                  }
              },
              {
                  name: "updateDocument",
                  description: "Updates the content of an existing document.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING, description: "The title of the document to update." },
                          content: { type: Type.STRING, description: "The content to add or replace." },
                          mode: { type: Type.STRING, enum: ["replace", "append"], description: "Whether to 'replace' the entire content or 'append' to the end." }
                      },
                      required: ["title", "content", "mode"]
                  }
              },
              {
                  name: "openTool",
                  description: "Opens a specific UI tool in the application for the user.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          tool: { type: Type.STRING, enum: ["triz", "lss", "toc", "ssm", "scamper", "mining", "tagcloud"], description: "The main tool category." },
                          subTool: { type: Type.STRING, description: "The specific sub-tool (e.g., 'contradiction' for triz, 'dmaic' for lss, 'crt' for toc)." }
                      },
                      required: ["tool"]
                  }
              }
          ]
      }
  ];

  const executeFunctionCalls = (functionCalls: FunctionCall[]) => {
      const responses: FunctionResponse[] = [];
      
      functionCalls.forEach((call, index) => {
          const decision = actionDecisions[index];
          let result: any;

          if (decision === 'rejected') {
              result = { skipped: true, message: "User rejected this action." };
          } else {
              // Default to accepted if pending (when Apply All is clicked) or explicitly accepted
              try {
                  switch (call.name) {
                      case 'addElement':
                          const id = modelActions.addElement(call.args as any);
                          result = { success: true, message: `Added element '${call.args.name}' with ID ${id}` };
                          break;
                      case 'updateElement':
                          const updated = modelActions.updateElement(call.args.name as string, call.args as any);
                          result = { success: updated, message: updated ? `Updated '${call.args.name}'` : `Could not find element '${call.args.name}'` };
                          break;
                      case 'deleteElement':
                          const deleted = modelActions.deleteElement(call.args.name as string);
                          result = { success: deleted, message: deleted ? `Deleted '${call.args.name}'` : `Could not find element '${call.args.name}'` };
                          break;
                      case 'addRelationship':
                          const relAdded = modelActions.addRelationship(
                              call.args.sourceName as string, 
                              call.args.targetName as string, 
                              call.args.label as string, 
                              call.args.direction as string
                          );
                          result = { success: relAdded, message: relAdded ? `Connected '${call.args.sourceName}' to '${call.args.targetName}'` : `Failed to connect. Check if both elements exist.` };
                          break;
                      case 'deleteRelationship':
                          const relDeleted = modelActions.deleteRelationship(call.args.sourceName as string, call.args.targetName as string);
                          result = { success: relDeleted, message: relDeleted ? `Removed connection between '${call.args.sourceName}' and '${call.args.targetName}'` : `Connection not found.` };
                          break;
                      case 'setElementAttribute':
                          const elAttrSet = modelActions.setElementAttribute(call.args.elementName as string, call.args.key as string, call.args.value as string);
                          result = { success: elAttrSet, message: elAttrSet ? `Set attribute '${call.args.key}' on '${call.args.elementName}'` : `Element not found` };
                          break;
                      case 'deleteElementAttribute':
                          const elAttrDel = modelActions.deleteElementAttribute(call.args.elementName as string, call.args.key as string);
                          result = { success: elAttrDel, message: elAttrDel ? `Deleted attribute '${call.args.key}' from '${call.args.elementName}'` : `Element not found` };
                          break;
                      case 'setRelationshipAttribute':
                          const relAttrSet = modelActions.setRelationshipAttribute(call.args.sourceName as string, call.args.targetName as string, call.args.key as string, call.args.value as string);
                          result = { success: relAttrSet, message: relAttrSet ? `Set attribute '${call.args.key}' on relationship` : `Relationship not found` };
                          break;
                      case 'deleteRelationshipAttribute':
                          const relAttrDel = modelActions.deleteRelationshipAttribute(call.args.sourceName as string, call.args.targetName as string, call.args.key as string);
                          result = { success: relAttrDel, message: relAttrDel ? `Deleted attribute '${call.args.key}' from relationship` : `Relationship not found` };
                          break;
                      // Document Actions
                      case 'readDocument':
                          const content = modelActions.readDocument(call.args.title as string);
                          result = { success: content !== null, content: content !== null ? content : "Document not found." };
                          break;
                      case 'createDocument':
                          const newDocId = modelActions.createDocument(call.args.title as string, call.args.content as string);
                          result = { success: true, message: `Created document '${call.args.title}'`, docId: newDocId };
                          break;
                      case 'updateDocument':
                          const docUpdated = modelActions.updateDocument(call.args.title as string, call.args.content as string, call.args.mode as any);
                          result = { success: docUpdated, message: docUpdated ? `Updated document '${call.args.title}'` : "Document not found." };
                          break;
                      case 'openTool':
                          if (onOpenTool) {
                              onOpenTool(call.args.tool as string, call.args.subTool as string);
                              result = { success: true, message: `Opened tool ${call.args.tool}` };
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

  // Helper to merge consecutive messages for API history
  const buildApiHistory = (msgs: Message[]): Content[] => {
    const history: Content[] = [];
    let currentContent: Content | null = null;

    for (const msg of msgs) {
        // Don't include pending messages in history sent to API until they are confirmed
        if (msg.isPending) continue;

        const parts: Part[] = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.functionCalls) msg.functionCalls.forEach(fc => parts.push({ functionCall: fc }));
        if (msg.functionResponses) msg.functionResponses.forEach(fr => parts.push({ functionResponse: fr }));
        
        if (parts.length === 0) continue;

        if (currentContent && currentContent.role === msg.role) {
            currentContent.parts.push(...parts);
        } else {
            if (currentContent) history.push(currentContent);
            currentContent = { role: msg.role, parts };
        }
    }
    if (currentContent) history.push(currentContent);
    return history;
  };

  const getActionTitle = (fc: FunctionCall) => {
      const args = fc.args as any;
      switch(fc.name) {
          case 'addElement': return `Add Element: "${args.name}"`;
          case 'addRelationship': return `Connect: "${args.sourceName}" → "${args.targetName}"`;
          case 'deleteElement': return `Delete Element: "${args.name}"`;
          case 'updateElement': return `Update Element: "${args.name}"`;
          case 'deleteRelationship': return `Disconnect: "${args.sourceName}" & "${args.targetName}"`;
          case 'setElementAttribute': return `Set Attribute: "${args.key}" on "${args.elementName}"`;
          case 'deleteElementAttribute': return `Delete Attribute: "${args.key}" from "${args.elementName}"`;
          case 'setRelationshipAttribute': return `Set Link Attribute: "${args.key}"`;
          case 'deleteRelationshipAttribute': return `Delete Link Attribute: "${args.key}"`;
          case 'readDocument': return `Read Document: "${args.title}"`;
          case 'createDocument': return `Create Document: "${args.title}"`;
          case 'updateDocument': return `Update Document: "${args.title}" (${args.mode})`;
          case 'openTool': return `Open Tool: ${args.tool}${args.subTool ? ` / ${args.subTool}` : ''}`;
          default: return fc.name;
      }
  };

  const getActionDetails = (fc: FunctionCall) => {
      const args = fc.args as any;
      const details = [];
      if (args.label) details.push(`Label: ${args.label}`);
      if (args.tags) details.push(`Tags: ${args.tags.join(', ')}`);
      if (args.notes) details.push(`Notes: ${args.notes.substring(0, 30)}...`);
      if (args.key && args.value) details.push(`${args.key} = ${args.value}`);
      if (args.title) details.push(`Title: ${args.title}`);
      if (args.content) details.push(`Content Length: ${args.content.length}`);
      if (fc.name === 'openTool') return '';
      return details.join(' | ');
  }

  const handleSendMessage = async (customPrompt?: string) => {
    if ((!input.trim() && !customPrompt) || isLoading) return;

    const userMessageText = customPrompt || input.trim();
    const userMessage: Message = { role: 'user', text: userMessageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
        const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
        
        const strictInstruction = `
        MODE: STRICT ANALYST
        - You are a strict analyst.
        - Answer questions solely based on the information provided in the graph data.
        - Do not introduce outside facts, general knowledge, or creativity unless explicitly asked for definitions.
        - Focus on structural analysis and retrieving information contained strictly within the current model.
        `;

        const creativeInstruction = `
        MODE: CREATIVE PARTNER
        - You are a creative collaborator and innovation assistant.
        - Use the graph data as a foundation, but combine it with your extensive general knowledge to suggest improvements.
        - Proactively look for 'Harmful', 'Challenge', or negative nodes and suggest new 'Action', 'Idea', or 'Useful' nodes to counteract them.
        - Identify gaps in logic, missing perspectives, or emerging trends and ask the user questions to fill them.
        - You are encouraged to propose adding new elements using the 'addElement' tool if they add value, solve problems, or represent creative solutions.
        - Draw parallels with design patterns, historical events, or business strategies where appropriate.
        - When adding new elements to counteract others, ALWAYS try to link them back to the problem element using 'addRelationship' with an appropriate label (e.g. 'mitigates', 'solves').
        `;

        let schemaContext = "NO ACTIVE SCHEMA DEFINED. You can use any tags or relationship labels, but prefer standard ones like 'Action', 'Idea', 'Person' and 'causes', 'related to'.";
        const activeScheme = colorSchemes.find(s => s.id === activeSchemeId);
        if (activeScheme) {
             const definitions = activeScheme.relationshipDefinitions || [];
             const defaultRel = activeScheme.defaultRelationshipLabel;
             schemaContext = `
        ACTIVE SCHEMA: "${activeScheme.name}"
        The following tags are explicitly defined in the current schema. These tags govern the visual appearance of nodes.
        You MUST use these specific tags when categorizing elements to ensure they integrate correctly with the user's model:
        ${Object.keys(activeScheme.tagColors).map(tag => `- "${tag}"`).join('\n')}
        
        The following standard relationship definitions (label: description) are defined in the current schema:
        ${definitions.map(d => `- "${d.label}": ${d.description || 'No description'}`).join('\n')}
        ${defaultRel ? `The DEFAULT relationship label for this schema is: "${defaultRel}". Use this if no specific relationship type is implied.` : ''}
        
        RULES FOR SCHEMA USAGE:
        1. When the user asks to add a specific type of agent (e.g. "add an Idea", "add an Action"), map their request to one of the tags above and include it in the 'tags' list for that element.
        2. When connecting elements with 'addRelationship', CAREFULLY REVIEW the relationship definitions above. Choose the label whose description best matches the semantic relationship you are trying to create. If none fit well, use a concise custom label.
        `;
        }

        // Document Context
        let docContext = "No documents available.";
        if (documents && documents.length > 0) {
            const openDocs = documents.filter(d => openDocIds?.includes(d.id));
            docContext = `AVAILABLE DOCUMENTS:\n${documents.map(d => `- "${d.title}" (in folder: ${d.folderId ? folders?.find(f => f.id === d.folderId)?.name : 'Root'})`).join('\n')}\n\nOPEN DOCUMENTS (Currently Visible): ${openDocs.length > 0 ? openDocs.map(d => `"${d.title}"`).join(', ') : 'None'}`;
        }

        // Build Tools Description dynamically based on enabled tools
        const enabledToolIds = systemPromptConfig.enabledTools || AVAILABLE_AI_TOOLS.map(t => t.id);
        const toolDescriptions = {
            'triz': `- TRIZ ('triz'): Problem solving. Subtools: 'contradiction' (Matrix), 'principles' (40 Principles), 'ariz', 'sufield', 'trends'.`,
            'lss': `- Lean Six Sigma ('lss'): Process improvement. Subtools: 'dmaic', '5whys', 'fishbone', 'fmea', 'vsm'.`,
            'toc': `- Theory of Constraints ('toc'): Bottleneck analysis. Subtools: 'crt' (Current Reality), 'ec' (Evaporating Cloud), 'frt' (Future Reality), 'tt' (Transition Tree).`,
            'ssm': `- Soft Systems Methodology ('ssm'): Complex problems. Subtools: 'rich_picture', 'catwoe', 'activity_models', 'comparison'.`,
            'scamper': `- SCAMPER ('scamper'): Ideation.`,
            'mining': `- Data Mining ('mining'): Dashboard.`,
            'tagcloud': `- Tag Cloud ('tagcloud'): Visualization.`,
            'swot': `- SWOT Analysis ('swot'): Identify internal Strengths/Weaknesses and external Opportunities/Threats. Use 'addElement' with tags 'Strength', 'Weakness', 'Opportunity', 'Threat'.`
        };

        const availableToolsContext = enabledToolIds.map(id => toolDescriptions[id as keyof typeof toolDescriptions]).filter(Boolean).join('\n');

        const systemInstruction = `${systemPromptConfig.defaultPrompt}
        
        ${isCreativeMode ? creativeInstruction : strictInstruction}

        ${schemaContext}
        
        ${systemPromptConfig.userContext ? `USER CONTEXT:\n${systemPromptConfig.userContext}` : ''}
        ${systemPromptConfig.responseStyle ? `RESPONSE STYLE:\n${systemPromptConfig.responseStyle}` : ''}
        ${systemPromptConfig.userPrompt ? `ADDITIONAL USER INSTRUCTIONS:\n${systemPromptConfig.userPrompt}` : ''}
        
        Context:
        The user is viewing a knowledge graph. You have been provided the graph data in a markdown-like format below. 
        You also have access to a document system. You can read, create, and edit text documents using tools.
        
        ${docContext}
        
        AVAILABLE UI TOOLS:
        You can open specific analysis tools for the user using the 'openTool' function.
        ${availableToolsContext || "No analysis tools enabled."}

        CRITICAL RULES:
        1. Use the markdown data as your base context.
        2. **IF THE USER ASKS A QUESTION:** Answer it using text based on the context. **DO NOT** call any tools unless they explicitly ask to modify data or open a tool.
        3. **IF THE USER ASKS TO MODIFY THE GRAPH:** (e.g. "add a node", "connect A to B", "delete X"), then use the appropriate tools.
        4. **IF THE USER ASKS FOR ANALYSIS:** You can provide analysis in text OR suggest opening a relevant tool (e.g. "I can open the Fishbone diagram tool for you"). If they agree, use 'openTool'.
        5. When referring to elements, use their exact Names.
        6. When adding or updating elements, ALWAYS consult the Active Schema above and apply the most relevant tag from the list if possible.
        7. **BATCHING:** If a user request involves creating multiple elements and connecting them (e.g. "Add 3 actions to mitigate X"), you MUST generate ALL the necessary 'addElement' and 'addRelationship' tool calls in a SINGLE response. Do not ask for confirmation between individual steps of a single logical request.
        8. **RATIONALE:** You MUST provide a clear 'rationale' parameter for every tool call, explaining why you are proposing this specific action.
        9. **ATTRIBUTES:** You can read custom attributes from the context (e.g. {cost="high"}) and modify them using 'setElementAttribute' or 'setRelationshipAttribute'.
        
        GRAPH DATA:
        ${modelMarkdown}
        `;

        const contents: Content[] = buildApiHistory(newMessages);
        
        const result = await callAI(aiConfig, contents, systemInstruction, tools[0].functionDeclarations);

        const text = result.text;
        const functionCalls = result.functionCalls;

        const modelMsg: Message = {
            role: 'model',
            text,
            functionCalls: functionCalls && functionCalls.length > 0 ? functionCalls : undefined,
            isPending: functionCalls && functionCalls.length > 0 ? true : false
        };

        setMessages(prev => [...prev, modelMsg]);

    } catch (e: any) {
        setError(e.message || "Error communicating with AI.");
        setMessages(prev => prev.slice(0, -1));
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
      
      // Send responses back to model
      try {
          const currentHistory = buildApiHistory(messages.slice(0, msgIndex)); // History before this message
          
          // Add the model message with tool calls
          const modelParts: Part[] = [];
          if (msg.text) modelParts.push({ text: msg.text });
          msg.functionCalls.forEach(fc => modelParts.push({ functionCall: fc }));
          currentHistory.push({ role: 'model', parts: modelParts });
          
          // Add the function responses
          const responseParts: Part[] = functionResponses.map(fr => ({ functionResponse: fr }));
          currentHistory.push({ role: 'user', parts: responseParts });

          const result = await callAI(
              aiConfig, 
              currentHistory, 
              systemPromptConfig.defaultPrompt // Use default prompt for tool follow-up
          );
          
          const responseText = result.text;
          const nextCalls = result.functionCalls;
          
          setMessages(prev => {
              const newMsgs = [...prev];
              // Mark current as processed
              newMsgs[msgIndex] = { ...msg, isPending: false, functionResponses: functionResponses.map(r => r.response as FunctionResponse) };
              // Add model response
              newMsgs.push({ 
                  role: 'model', 
                  text: responseText,
                  functionCalls: nextCalls && nextCalls.length > 0 ? nextCalls : undefined,
                  isPending: nextCalls && nextCalls.length > 0 ? true : false
              });
              return newMsgs;
          });

      } catch (e) {
          setError("Failed to send tool results to AI.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className={`fixed top-20 right-4 w-96 bottom-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-30 ${className} ${isOpen ? '' : 'hidden'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h2 className="text-lg font-bold text-white">AI Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onOpenPromptSettings} className="text-gray-400 hover:text-white p-1" title="Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.text && (
                        <div className={`p-3 rounded-lg max-w-[90%] text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            {msg.text}
                        </div>
                    )}
                    {msg.functionCalls && (
                        <div className="mt-2 bg-gray-800 border border-gray-600 rounded-lg p-2 w-full max-w-[95%] shadow-lg">
                            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider px-1">Suggested Actions</div>
                            <div className="space-y-1">
                                {msg.functionCalls.map((fc, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded text-xs">
                                        {msg.isPending && (
                                            <input 
                                                type="checkbox" 
                                                checked={actionDecisions[i] === 'accepted'}
                                                onChange={() => setActionDecisions(prev => ({ ...prev, [i]: prev[i] === 'accepted' ? 'rejected' : 'accepted' }))}
                                                className="cursor-pointer"
                                            />
                                        )}
                                        <div className={`flex-grow ${actionDecisions[i] === 'rejected' ? 'opacity-50 line-through' : ''}`}>
                                            <span className="font-bold text-blue-400">{fc.name}</span>
                                            <span className="text-gray-400 ml-1">{getActionDetails(fc)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {msg.isPending && (
                                <div className="mt-3 flex justify-end">
                                    <button 
                                        onClick={() => handleApplyPending(idx)}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold"
                                    >
                                        Apply Selected
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {isLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs animate-pulse">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Thinking...
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-gray-800 border-t border-gray-700">
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
                    placeholder="Ask to create nodes, analyze connections..."
                    className="w-full bg-gray-900 text-white text-sm rounded p-2 border border-gray-600 focus:border-blue-500 outline-none resize-none max-h-32 scrollbar-thin"
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
                <button onClick={() => setIsCreativeMode(!isCreativeMode)} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${isCreativeMode ? 'border-purple-500 text-purple-400' : 'border-gray-600 text-gray-500'}`}>
                    {isCreativeMode ? 'Creative Mode' : 'Strict Mode'}
                </button>
                {error && <span className="text-red-400 text-xs truncate max-w-[200px]" title={error}>{error}</span>}
            </div>
        </div>
    </div>
  );
};

export default ChatPanel;
