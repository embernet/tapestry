
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Content, Part, Type, Tool, FunctionCall, FunctionResponse } from '@google/genai';
import { Element, Relationship, ModelActions, ColorScheme, SystemPromptConfig, TapestryDocument, TapestryFolder } from '../types';
import { generateMarkdownFromGraph } from '../utils';
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
  onLogHistory?: (tool: string, content: string, summary?: string) => void;
  onOpenHistory?: () => void;
  onOpenTool?: (tool: string, subTool?: string) => void;
  initialInput?: string;
}

interface Message {
  role: 'user' | 'model';
  text?: string;
  functionCalls?: FunctionCall[]; // To display tool usage
  functionResponses?: FunctionResponse[];
  isPending?: boolean; // If true, the tool calls are waiting for user confirmation
}

const ChatPanel: React.FC<ChatPanelProps> = ({ elements, relationships, colorSchemes, activeSchemeId, onClose, currentModelId, modelActions, className, isOpen, onOpenPromptSettings, systemPromptConfig, documents, folders, openDocIds, onLogHistory, onOpenHistory, onOpenTool, initialInput }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreativeMode, setIsCreativeMode] = useState(true);
  
  // Track decisions for pending actions: index -> status
  const [actionDecisions, setActionDecisions] = useState<Record<number, 'pending' | 'accepted' | 'rejected'>>({});
  
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  
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
  
  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        10. **DOCUMENTS:** If the user asks to edit "the open document" and there is only one open, infer which one it is. If ambiguous, ask. Use 'readDocument' to get content before editing if you need context.
        
        Current Model Data:
        ---\n${modelMarkdown}\n---`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const chatHistory = buildApiHistory(newMessages);

        // Step 1: Send User Message
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: chatHistory,
            config: {
                systemInstruction: systemInstruction,
                tools: tools
            }
        });

        const text = response.text;
        const functionCalls = response.functionCalls;
        
        const nextMessages = [...newMessages];

        // If there is text, add it as a message
        if (text) {
            nextMessages.push({ role: 'model', text });
            // Log history
            if (onLogHistory) {
                onLogHistory('Chat', text, userMessageText.substring(0, 50));
            }
        }

        // If there are function calls, add them as a SEPARATE pending message
        if (functionCalls && functionCalls.length > 0) {
            nextMessages.push({ 
                role: 'model', 
                functionCalls: functionCalls, 
                isPending: true 
            });
        } else if (!text) {
             throw new Error("No text or function call received.");
        }

        setMessages(nextMessages);

    } catch (e) {
        console.error("Error sending message:", e);
        const errorMessage = e instanceof Error ? e.message : "Sorry, I couldn't get a response. Please check your API key and network connection.";
        setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDecision = (index: number, status: 'accepted' | 'rejected') => {
      setActionDecisions(prev => ({ ...prev, [index]: status }));
  };

  const handleAcceptAll = () => {
      const pendingIndex = messages.findIndex(m => m.isPending);
      if (pendingIndex !== -1) {
          const msg = messages[pendingIndex];
          const newDecisions = { ...actionDecisions };
          msg.functionCalls?.forEach((_, i) => {
              newDecisions[i] = 'accepted';
          });
          setActionDecisions(newDecisions);
      }
  };

  const handleRejectAll = () => {
      const pendingIndex = messages.findIndex(m => m.isPending);
      if (pendingIndex !== -1) {
          const msg = messages[pendingIndex];
          const newDecisions = { ...actionDecisions };
          msg.functionCalls?.forEach((_, i) => {
              newDecisions[i] = 'rejected';
          });
          setActionDecisions(newDecisions);
      }
  };

  const handleApplyDecisions = async () => {
      // Find the pending message
      const pendingIndex = messages.findIndex(m => m.isPending);
      if (pendingIndex === -1) return;
      
      const pendingMessage = messages[pendingIndex];
      if (!pendingMessage.functionCalls) return;

      setIsLoading(true);

      try {
          // 1. Execute the tools (only accepted ones, but generate responses for all)
          const responses = executeFunctionCalls(pendingMessage.functionCalls);

          // 2. Update the pending message to be confirmed (not pending)
          const confirmedMessages = [...messages];
          confirmedMessages[pendingIndex] = { ...pendingMessage, isPending: false };
          
          // 3. Add the tool responses to the history
          const historyWithResponses = [
              ...confirmedMessages,
              { role: 'user' as const, functionResponses: responses }
          ];

          setMessages(historyWithResponses); // Update UI state optimistically

          // 4. Get the final text response from the model
          const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
          const systemInstruction = `You are an AI assistant for Tapestry. You have just executed tools to modify the graph. 
          Summarize what you did based on the tool outputs. If some actions were skipped/rejected by the user, mention that.
          Current Model Data: ---\n${modelMarkdown}\n---`;
          
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const apiHistory = buildApiHistory(historyWithResponses);

          const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: apiHistory,
            config: { systemInstruction }
          });

          if (finalResponse.text) {
              setMessages(prev => [...prev, { role: 'model', text: finalResponse.text }]);
              // Log post-action summary to history
              if (onLogHistory) {
                  onLogHistory('Chat (Action Summary)', finalResponse.text, "Actions applied");
              }
          }

      } catch (e) {
          console.error("Error confirming action:", e);
          setError("Failed to execute actions.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleRegenerate = () => {
      // 1. Remove the pending message
      const messagesWithoutPending = messages.filter(m => !m.isPending);
      setMessages(messagesWithoutPending);
      
      // 2. Automatically trigger a new request asking for alternatives
      handleSendMessage("Those proposed actions weren't quite right. Please suggest a different set of actions or alternatives.");
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const handleDelete = (indexToDelete: number) => {
    // Deletes the model's message and the user's prompt that preceded it.
    const newMessages = messages.filter((_, i) => i !== indexToDelete && i !== indexToDelete - 1);
    setMessages(newMessages);
  };
  
  const handleExport = (format: 'json' | 'md') => {
    let content = '';
    let mimeType = '';
    let fileExtension = '';

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else { // markdown
      content = messages.map(msg => {
          let text = `**${msg.role === 'user' ? 'You' : 'AI Assistant'}**:`;
          if (msg.text) text += `\n\n${msg.text}`;
          if (msg.functionCalls) {
              text += `\n\n*Executed Actions:*\n` + msg.functionCalls.map(f => `- ${f.name}(${JSON.stringify(f.args)})`).join('\n');
          }
          return text;
      }).join('\n\n---\n\n');
      mimeType = 'text/markdown';
      fileExtension = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tapestry-chat-export.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const isWaitingForConfirmation = messages.some(m => m.isPending);

  return (
    <div className={`absolute top-44 left-4 bottom-4 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-30 flex flex-col ${className || ''}`}>
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700 bg-gray-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI Assistant
        </h2>
        <div className="flex items-center space-x-2">
          {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                title="View AI History"
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </button>
          )}
          <button
            onClick={onOpenPromptSettings}
            title="AI Settings (Context, Style, Tools)"
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setIsCreativeMode(!isCreativeMode)}
            title={isCreativeMode ? "Creative Mode: ENABLED. AI uses general knowledge to suggest improvements. Click to switch to Strict Context." : "Creative Mode: DISABLED. AI is restricted to current graph data. Click to enable Creativity."}
            className={`p-2 rounded-md transition ${isCreativeMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            {isCreativeMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
            )}
          </button>

          <div ref={exportButtonRef} className="relative">
            <button 
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              title="Export Chat"
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-600 rounded-md shadow-lg py-1 z-10">
                <button onClick={() => handleExport('md')} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">As Markdown (.md)</button>
                <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">As JSON (.json)</button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Text Bubble */}
              {(msg.text || (msg.role === 'model' && !msg.functionCalls && !msg.isPending)) && (
                  <div className={`max-w-md p-3 rounded-lg ${ msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200' }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.text || <span className="italic text-gray-400">Processing...</span>}</p>
                  </div>
              )}

              {/* Function Call / Proposed Actions Block */}
              {msg.functionCalls && msg.functionCalls.length > 0 && (
                  <div className={`mt-2 w-full max-w-[340px] rounded-lg border ${msg.isPending ? 'bg-gray-800 border-yellow-600' : 'bg-gray-700 border-gray-600'} p-0 overflow-hidden`}>
                      <div className={`flex items-center gap-2 p-3 border-b ${msg.isPending ? 'border-yellow-600/50 bg-yellow-900/20' : 'border-gray-600 bg-gray-700'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${msg.isPending ? 'text-yellow-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {msg.isPending 
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            }
                          </svg>
                          <span className={`text-sm font-bold ${msg.isPending ? 'text-yellow-500' : 'text-gray-300'}`}>
                              {msg.isPending ? 'Proposed Actions' : 'Executed Actions'}
                          </span>
                      </div>
                      
                      <div className="flex flex-col gap-2 p-2">
                          {msg.functionCalls.map((fc, i) => {
                              const decision = msg.isPending ? (actionDecisions[i] || 'accepted') : 'accepted';
                              const isAccepted = decision === 'accepted';
                              const isRejected = decision === 'rejected';
                              
                              const isAttributeAction = fc.name.includes('Attribute');
                              const isDelete = fc.name.includes('delete');
                              const isDocument = fc.name.toLowerCase().includes('document');
                              const isOpenTool = fc.name === 'openTool';
                              
                              return (
                                <div 
                                    key={i} 
                                    className={`rounded p-2 border flex flex-col gap-1 transition-colors ${
                                        msg.isPending
                                            ? isRejected ? 'bg-red-900/10 border-red-500/20 opacity-60' : 'bg-green-900/20 border-green-500/50'
                                            : 'bg-gray-800 border-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {/* Icon based on action type */}
                                            {isDelete ? <span className="text-red-400">🗑️</span> :
                                             isOpenTool ? <span className="text-blue-400">🔧</span> :
                                             isDocument ? <span className="text-yellow-400">📄</span> :
                                             isAttributeAction ? <span className="text-purple-400">🏷️</span> :
                                             <span className="text-green-400">⚡</span>}
                                            
                                            <span className="text-xs font-mono text-gray-300 truncate" title={getActionTitle(fc)}>
                                                {getActionTitle(fc)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-[10px] text-gray-500 pl-6">
                                        {getActionDetails(fc)}
                                    </div>
                                    
                                    {/* Rationale */}
                                    {(fc.args as any).rationale && (
                                        <div className="text-[10px] text-gray-400 italic pl-6 mt-0.5 border-l-2 border-gray-600 ml-1">
                                            "{(fc.args as any).rationale}"
                                        </div>
                                    )}

                                    {/* Decision Buttons for Pending */}
                                    {msg.isPending && (
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button 
                                                onClick={() => handleDecision(i, 'accepted')}
                                                className={`px-2 py-0.5 text-[10px] rounded border ${isAccepted ? 'bg-green-700 border-green-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-green-500'}`}
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => handleDecision(i, 'rejected')}
                                                className={`px-2 py-0.5 text-[10px] rounded border ${isRejected ? 'bg-red-900 border-red-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-red-500'}`}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                              );
                          })}
                      </div>
                      
                      {msg.isPending && (
                          <div className="p-2 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                              <div className="flex gap-2">
                                  <button onClick={handleAcceptAll} className="text-[10px] text-green-400 hover:text-green-300 hover:underline">All</button>
                                  <span className="text-gray-600">|</span>
                                  <button onClick={handleRejectAll} className="text-[10px] text-red-400 hover:text-red-300 hover:underline">None</button>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={handleRegenerate} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition">Retry</button>
                                  <button 
                                      onClick={handleApplyDecisions}
                                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition shadow-sm flex items-center gap-1"
                                  >
                                      Confirm
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* Message Actions */}
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleCopy(msg.text || JSON.stringify(msg.functionCalls), index)} className="text-gray-500 hover:text-white text-xs">
                      {copiedMessageIndex === index ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => handleDelete(index)} className="text-gray-500 hover:text-red-400 text-xs">
                      Delete
                  </button>
              </div>
            </div>
          ))}
          
          {isLoading && (
              <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-300 p-3 rounded-lg rounded-tl-none flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
              </div>
          )}
          {error && (
              <div className="flex justify-center my-2">
                  <span className="text-red-400 text-xs bg-red-900/20 border border-red-900 px-2 py-1 rounded">{error}</span>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg">
          <div className="relative">
              <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isWaitingForConfirmation ? "Please confirm actions above first..." : "Ask a question or request a change..."}
                  disabled={isWaitingForConfirmation || isLoading}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
                  rows={1}
              />
              <button 
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading || isWaitingForConfirmation}
                  className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
              </button>
          </div>
          <div className="text-[10px] text-gray-500 mt-2 text-center">
              AI can make mistakes. Review proposed actions carefully.
          </div>
      </div>
    </div>
  );
};

export default ChatPanel;
