
import React, { useState, useEffect, useRef } from 'react';
import { Content, FunctionCall, FunctionResponse, Type } from '@google/genai';
import { Element, Relationship, ModelActions, ColorScheme, SystemPromptConfig, TapestryDocument, TapestryFolder, ChatMessage } from '../types';
import { generateMarkdownFromGraph, callAI, AIConfig, generateUUID } from '../utils';

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

// Schema to enforce structured output from the AI
const CHAT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Internal reasoning about the user's request, the graph state, and why specific actions are chosen." },
    message: { type: Type.STRING, description: "The conversational response to show to the user. CRITICAL: If you are providing a list, plan, or detailed explanation, put the FULL text here using Markdown formatting. Do not truncate." },
    actions: {
      type: Type.ARRAY,
      description: "List of actions to perform on the graph.",
      items: {
        type: Type.OBJECT,
        properties: {
          tool: { 
            type: Type.STRING, 
            enum: [
              "addElement", "updateElement", "deleteElement", 
              "addRelationship", "deleteRelationship", 
              "setElementAttribute", "deleteElementAttribute", 
              "setRelationshipAttribute", "deleteRelationshipAttribute", 
              "readDocument", "createDocument", "updateDocument", "openTool"
            ] 
          },
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              notes: { type: Type.STRING },
              rationale: { type: Type.STRING },
              sourceName: { type: Type.STRING },
              targetName: { type: Type.STRING },
              label: { type: Type.STRING },
              direction: { type: Type.STRING },
              elementName: { type: Type.STRING },
              key: { type: Type.STRING },
              value: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              mode: { type: Type.STRING },
              tool: { type: Type.STRING },
              subTool: { type: Type.STRING },
              source: { type: Type.STRING }, // Fallback for relationship
              target: { type: Type.STRING }, // Fallback for relationship
              from: { type: Type.STRING }, // Fallback for relationship
              to: { type: Type.STRING } // Fallback for relationship
            }
          }
        },
        required: ["tool", "parameters"]
      }
    }
  },
  required: ["message", "actions"]
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
  
  // Track decisions for pending actions: index -> status
  const [actionDecisions, setActionDecisions] = useState<Record<number, 'pending' | 'accepted' | 'rejected'>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Floating Window State
  const [position, setPosition] = useState({ x: 20, y: 550 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
      if (initialInput && isOpen) {
          setInput(initialInput);
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

  // Tool Definitions for Documentation generation
  const TOOL_DEFINITIONS = [
      { name: "addElement", description: "Add a new node.", parameters: "name (required), tags (array), notes, rationale" },
      { name: "updateElement", description: "Update existing node.", parameters: "name (required target), tags, notes, rationale" },
      { name: "deleteElement", description: "Delete a node.", parameters: "name (required), rationale" },
      { name: "addRelationship", description: "Connect two nodes.", parameters: "sourceName, targetName, label, direction ('TO', 'FROM', 'NONE'), rationale" },
      { name: "deleteRelationship", description: "Remove connection.", parameters: "sourceName, targetName, rationale" },
      { name: "setElementAttribute", description: "Set key-value pair on node.", parameters: "elementName, key, value, rationale" },
      { name: "deleteElementAttribute", description: "Remove attribute from node.", parameters: "elementName, key, rationale" },
      { name: "setRelationshipAttribute", description: "Set key-value pair on link.", parameters: "sourceName, targetName, key, value, rationale" },
      { name: "deleteRelationshipAttribute", description: "Remove attribute from link.", parameters: "sourceName, targetName, key, rationale" },
      { name: "readDocument", description: "Read doc content.", parameters: "title" },
      { name: "createDocument", description: "Create new doc.", parameters: "title, content" },
      { name: "updateDocument", description: "Update doc content.", parameters: "title, content, mode ('replace'|'append')" },
      { name: "openTool", description: "Open UI tool.", parameters: "tool ('triz','lss','toc','ssm','scamper','mining','tagcloud'), subTool" }
  ];

  const executeFunctionCalls = (functionCalls: FunctionCall[]) => {
      const responses: FunctionResponse[] = [];
      
      functionCalls.forEach((call, index) => {
          const decision = actionDecisions[index];
          let result: any;
          const args = call.args as any;

          if (decision === 'rejected') {
              result = { skipped: true, message: "User rejected this action." };
          } else {
              try {
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
                          // Handle inconsistent naming from LLM (sourceName vs source)
                          const src = args.sourceName || args.source || args.from;
                          const tgt = args.targetName || args.target || args.to;
                          
                          if (src && tgt) {
                              const relAdded = modelActions.addRelationship(
                                  src, 
                                  tgt, 
                                  args.label || '', 
                                  args.direction
                              );
                              result = { success: relAdded, message: relAdded ? `Connected '${src}' to '${tgt}'` : `Failed to connect '${src}' to '${tgt}'. Check if both nodes exist.` };
                          } else {
                              result = { success: false, message: "Missing source or target name" };
                          }
                          break;
                      case 'deleteRelationship':
                          const delSrc = args.sourceName || args.source;
                          const delTgt = args.targetName || args.target;
                          const relDeleted = modelActions.deleteRelationship(delSrc, delTgt);
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
                          const newDocId = modelActions.createDocument(args.title, args.content);
                          result = { success: true, message: `Created document.`, docId: newDocId };
                          break;
                      case 'updateDocument':
                          const docUpdated = modelActions.updateDocument(args.title, args.content, args.mode);
                          result = { success: docUpdated, message: docUpdated ? `Updated document.` : "Document not found." };
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
                history.push({ role: 'user', parts: [{ text: msg.text || '' }] });
            }
        } else {
            // Model Role
            // If we have the raw JSON the model generated, use that to maintain state
            if (msg.rawJson) {
                history.push({ role: 'model', parts: [{ text: JSON.stringify(msg.rawJson) }] });
            } else {
                history.push({ role: 'model', parts: [{ text: msg.text || '' }] });
            }
        }
    }
    return history;
  };

  const getActionTitle = (fc: FunctionCall) => {
      const args = fc.args as any;
      switch(fc.name) {
          case 'addElement': return `Add Element: "${args.name}"`;
          case 'addRelationship': return `Add Connection`;
          case 'deleteElement': return `Delete Element: "${args.name}"`;
          case 'updateElement': return `Update Element: "${args.name}"`;
          case 'deleteRelationship': return `Disconnect: "${args.sourceName || args.source}" & "${args.targetName || args.target}"`;
          case 'readDocument': return `Read Document: "${args.title}"`;
          case 'createDocument': return `Create Document: "${args.title}"`;
          case 'openTool': return `Open Tool: ${args.tool}`;
          default: return fc.name;
      }
  };

  const renderActionContent = (fc: FunctionCall, isDark: boolean) => {
      const args = fc.args as any;
      const labelClass = isDark ? 'text-gray-400' : 'text-gray-500';
      const textClass = isDark ? 'text-gray-300' : 'text-gray-700';

      if (fc.name === 'addRelationship') {
          return (
            <div className="mt-1 space-y-1 text-xs">
                <div className="flex gap-2">
                    <span className={`${labelClass} font-semibold w-10`}>From:</span>
                    <span className={`${textClass} font-mono`}>{args.sourceName || args.source}</span>
                </div>
                <div className="flex gap-2">
                    <span className={`${labelClass} font-semibold w-10`}>To:</span>
                    <span className={`${textClass} font-mono`}>{args.targetName || args.target}</span>
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

    const userMessageText = customPrompt || input.trim();
    const userMessage: ChatMessage = { role: 'user', text: userMessageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    setInput('');
    setIsLoading(true);
    setError(null);
    setShowErrorModal(false);

    try {
        const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
        
        const toolsContext = TOOL_DEFINITIONS.map(t => `- ${t.name}: ${t.description} Params: {${t.parameters}}`).join('\n');

        let schemaContext = "No specific schema defined.";
        const activeScheme = colorSchemes.find(s => s.id === activeSchemeId);
        if (activeScheme) {
             schemaContext = `ACTIVE SCHEMA: "${activeScheme.name}"\nTags: ${Object.keys(activeScheme.tagColors).join(', ')}`;
        }

        let docContext = "";
        if (documents && documents.length > 0) {
            docContext = `AVAILABLE DOCUMENTS:\n${documents.map(d => `- "${d.title}"`).join('\n')}`;
        }

        const systemInstruction = `
        You are Tapestry AI, an expert knowledge graph assistant.
        
        ${systemPromptConfig.defaultPrompt}
        
        ${isCreativeMode ? 'MODE: CREATIVE PARTNER (Proactive, suggest ideas)' : 'MODE: STRICT ANALYST (Only facts)'}

        ${schemaContext}
        ${docContext}

        AVAILABLE TOOLS:
        You have access to the following tools. You must output a JSON object to use them.
        ${toolsContext}

        OUTPUT FORMAT:
        You must respond with a JSON object strictly adhering to this schema:
        {
          "analysis": "Your internal thought process...",
          "message": "The text response to show the user...",
          "actions": [ { "tool": "toolName", "parameters": { ...args } }, ... ]
        }

        CRITICAL RULES:
        1. Always return valid JSON.
        2. If you want to modify the graph or open a tool, add an item to the "actions" array.
        3. If you just want to talk, leave "actions" empty.
        4. Refer to nodes by their exact names.
        5. Use 'rationale' parameter to explain why an action is taken.
        6. IMPORTANT: For lists, long explanations, or detailed answers, put the ENTIRE content in the "message" field. Do not truncate.

        GRAPH DATA:
        ${modelMarkdown}
        `;

        const contents: Content[] = buildApiHistory(newMessages);
        
        const requestPayload = {
            config: aiConfig,
            systemInstruction,
            contents,
            schema: CHAT_RESPONSE_SCHEMA
        };

        // Pass schema to force JSON output
        // skipLog is set to FALSE so that AI Assistant interactions appear in the Debug Panel
        const result = await callAI(aiConfig, contents, systemInstruction, undefined, CHAT_RESPONSE_SCHEMA, false);

        const responseJson = JSON.parse(result.text);
        
        const toolRequests = responseJson.actions || [];
        const functionCalls = toolRequests.map((req: any) => ({
            name: req.tool,
            args: req.parameters,
            id: generateUUID()
        }));

        const modelMsg: ChatMessage = {
            role: 'model',
            text: responseJson.message || "(No message)",
            functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
            isPending: functionCalls.length > 0,
            rawJson: responseJson,
            requestPayload: requestPayload
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
      
      // We don't send back to model immediately in this flow unless we want a confirmation message.
      // For now, we just mark as processed and show results in history if user continues chatting.
      
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
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.text && (
                        <div className={`p-3 rounded-lg max-w-[90%] text-sm whitespace-pre-wrap ${msg.role === 'user' ? messageUserBg : messageModelBg}`}>
                            {msg.text}
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
                    placeholder="Ask to create nodes, analyze connections..."
                    className={`w-full ${inputBg} text-sm rounded p-2 border focus:border-blue-500 outline-none resize-none max-h-32 scrollbar-thin`}
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
