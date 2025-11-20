
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Content, Part, Type, Tool, FunctionCall, FunctionResponse } from '@google/genai';
import { Element, Relationship, ModelActions, ColorScheme } from '../types';
import { generateMarkdownFromGraph } from '../utils';

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
}

interface Message {
  role: 'user' | 'model';
  text?: string;
  functionCalls?: FunctionCall[]; // To display tool usage
  functionResponses?: FunctionResponse[];
  isPending?: boolean; // If true, the tool calls are waiting for user confirmation
}

const ChatPanel: React.FC<ChatPanelProps> = ({ elements, relationships, colorSchemes, activeSchemeId, onClose, currentModelId, modelActions, className, isOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreativeMode, setIsCreativeMode] = useState(false);
  
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // This effect resets the chat if a new model is loaded.
  useEffect(() => {
    setMessages([{ role: 'model', text: "Hello! I'm your AI assistant. Ask me anything about your current model, or ask me to make changes to it." }]);
    setError(null);
    setIsLoading(false);
  }, [currentModelId]);

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
                          notes: { type: Type.STRING, description: "Optional descriptive notes." }
                      },
                      required: ["name"]
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
                          notes: { type: Type.STRING, description: "New notes content." }
                      },
                      required: ["name"]
                  }
              },
              {
                  name: "deleteElement",
                  description: "Deletes an element and its relationships from the graph.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          name: { type: Type.STRING, description: "The name of the element to delete." }
                      },
                      required: ["name"]
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
                          direction: { type: Type.STRING, description: "Direction: 'TO', 'FROM', or 'NONE'. Default is 'TO'." }
                      },
                      required: ["sourceName", "targetName", "label"]
                  }
              },
              {
                  name: "deleteRelationship",
                  description: "Removes a relationship between two elements.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          sourceName: { type: Type.STRING, description: "The name of the source element." },
                          targetName: { type: Type.STRING, description: "The name of the target element." }
                      },
                      required: ["sourceName", "targetName"]
                  }
              }
          ]
      }
  ];

  const executeFunctionCalls = (functionCalls: FunctionCall[]) => {
      const responses: FunctionResponse[] = [];
      for (const call of functionCalls) {
          let result: any = { success: false, message: "Unknown function" };
          
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
              }
          } catch (e) {
              result = { success: false, message: `Error executing ${call.name}: ${e}` };
          }
          
          responses.push({
              name: call.name,
              id: call.id, 
              response: { result }
          });
      }
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

  const formatFunctionCall = (fc: FunctionCall) => {
      const args = fc.args as any;
      switch(fc.name) {
          case 'addElement':
              return `Add Element: "${args.name}"` + (args.tags?.length ? ` [${args.tags.join(', ')}]` : '');
          case 'addRelationship':
              return `Connect: "${args.sourceName}" --[${args.label}]--> "${args.targetName}"`;
          case 'deleteElement':
              return `Delete Element: "${args.name}"`;
          case 'updateElement':
              return `Update Element: "${args.name}"`;
          case 'deleteRelationship':
               return `Disconnect: "${args.sourceName}" and "${args.targetName}"`;
          default:
              return `${fc.name}: ${JSON.stringify(args)}`;
      }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
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

        const systemInstruction = `You are an AI assistant for a visual graphing tool called Tapestry. 
        
        ${isCreativeMode ? creativeInstruction : strictInstruction}

        ${schemaContext}
        
        Context:
        The user is viewing a knowledge graph. You have been provided the graph data in a markdown-like format below. 
        
        CRITICAL RULES:
        1. Use the markdown data as your base context.
        2. **IF THE USER ASKS A QUESTION:** Answer it using text based on the context. **DO NOT** call any tools. Tools are ONLY for modifying the graph.
        3. **IF THE USER ASKS TO MODIFY THE GRAPH:** (e.g. "add a node", "connect A to B", "delete X"), then use the appropriate tools.
        4. When referring to elements, use their exact Names.
        5. When adding or updating elements, ALWAYS consult the Active Schema above and apply the most relevant tag from the list if possible.
        6. **BATCHING:** If a user request involves creating multiple elements and connecting them (e.g. "Add 3 actions to mitigate X"), you MUST generate ALL the necessary 'addElement' and 'addRelationship' tool calls in a SINGLE response. Do not ask for confirmation between individual steps of a single logical request.
        
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
  
  const handleConfirmAction = async () => {
      // Find the pending message
      const pendingIndex = messages.findIndex(m => m.isPending);
      if (pendingIndex === -1) return;
      
      const pendingMessage = messages[pendingIndex];
      if (!pendingMessage.functionCalls) return;

      setIsLoading(true);

      try {
          // 1. Execute the tools
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
          Summarize what you did based on the tool outputs.
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
          }

      } catch (e) {
          console.error("Error confirming action:", e);
          setError("Failed to execute actions.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleCancelAction = () => {
      // Remove the pending message (last one usually)
      setMessages(prev => prev.filter(m => !m.isPending));
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
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI Assistant
        </h2>
        <div className="flex items-center space-x-2">
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

              {/* Function Call / Confirmation Block */}
              {msg.functionCalls && msg.functionCalls.length > 0 && (
                  <div className={`mt-2 w-full max-w-md rounded-lg border ${msg.isPending ? 'bg-gray-800 border-yellow-600' : 'bg-gray-700 border-gray-600'} p-3`}>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${msg.isPending ? 'text-yellow-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span className={`text-sm font-bold ${msg.isPending ? 'text-yellow-500' : 'text-gray-300'}`}>
                              {msg.isPending ? 'Proposed Actions' : 'Executed Actions'}
                          </span>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-300 font-mono">
                          {msg.functionCalls.map((fc, i) => (
                              <li key={i} className="flex items-start gap-2">
                                  <span className="text-gray-500 mt-0.5">•</span>
                                  <div className="break-all">
                                    {formatFunctionCall(fc)}
                                  </div>
                              </li>
                          ))}
                      </ul>
                      
                      {msg.isPending && (
                          <div className="mt-4 flex justify-end gap-2">
                                <button 
                                    onClick={handleCancelAction}
                                    className="bg-red-900 bg-opacity-50 hover:bg-opacity-80 hover:bg-red-800 text-red-200 p-2 rounded-md transition flex items-center gap-1"
                                    title="Cancel Action"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={handleConfirmAction}
                                    className="bg-green-900 bg-opacity-50 hover:bg-opacity-80 hover:bg-green-800 text-green-200 p-2 rounded-md transition flex items-center gap-1"
                                    title="Confirm Action"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                          </div>
                      )}
                  </div>
              )}

              {/* Message Utilities (Copy/Delete) */}
              {msg.role === 'model' && msg.text && !msg.isPending && index > 0 && (
                  <div className="flex gap-2 mt-1 px-1 opacity-50 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopy(msg.text!, index)}
                      title={copiedMessageIndex === index ? "Copied!" : "Copy"}
                      className="p-1 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white"
                    >
                      {copiedMessageIndex === index ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDelete(index)}
                      title="Delete"
                      className="p-1 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-md p-3 rounded-lg bg-gray-700 text-gray-200">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="p-4 text-sm text-red-400 border-t border-gray-700">{error}</div>}

      <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
        <div className={`flex items-end space-x-2 bg-gray-700 border border-gray-600 rounded-lg p-2 ${isWaitingForConfirmation ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isWaitingForConfirmation ? "Please confirm action above..." : "Ask AI to improve your model..."}
            disabled={isLoading || isWaitingForConfirmation}
            className="flex-grow bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none max-h-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || isWaitingForConfirmation || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
