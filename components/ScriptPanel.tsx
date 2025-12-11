
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Script, ScriptSnippet } from '../types';
import { ScriptEngine, ScriptParser, ScriptProgram, RuntimeContext } from '../services/ScriptEngine';
import { toolRegistry } from '../services/ToolRegistry';
import { toolEventBus } from '../services/ToolEventBus';
import { DEFAULT_SNIPPETS, TSCRIPT_DOCS } from '../constants';
import { generateUUID, callAI, AIConfig } from '../utils';
import { Type } from '@google/genai';

interface ScriptPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scripts: Script[];
  onSaveScript: (script: Script) => void;
  onCreateScript: (name: string) => void;
  onDeleteScript: (id: string) => void;
  isDarkMode: boolean;
  aiConfig: AIConfig;
}

const DEFAULT_SCRIPT = `# Welcome to Tapestry Script (TScript)
# Click 'Record' to capture your actions, or type Python-like commands below.

name = "My Node"
graph.add_node(name=name)
sleep(0.5)
canvas.select_node(id=name)
`;

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  isOpen,
  onClose,
  scripts,
  onSaveScript,
  onCreateScript,
  onDeleteScript,
  isDarkMode,
  aiConfig
}) => {
  // --- State ---
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [code, setCode] = useState(DEFAULT_SCRIPT);
  const [isRecording, setIsRecording] = useState(false);
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Window State
  const [position, setPosition] = useState({ x: Math.max(100, window.innerWidth - 650), y: 100 });
  const [size, setSize] = useState({ width: 650, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Console Resize State
  const [consoleHeight, setConsoleHeight] = useState(150);
  const [isResizingConsole, setIsResizingConsole] = useState(false);

  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [snippets, setSnippets] = useState<ScriptSnippet[]>(DEFAULT_SNIPPETS);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSnippetId, setExpandedSnippetId] = useState<string | null>(null);

  // AI Chat State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Refs ---
  const engine = useMemo(() => new ScriptEngine(), []);
  const runtimeContextRef = useRef<RuntimeContext | null>(null);
  const programRef = useRef<ScriptProgram | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialRectRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const consoleResizeRef = useRef({ startY: 0, startHeight: 0, containerHeight: 0 });
  
  // --- Initialization: Select first script if none selected ---
  useEffect(() => {
    if (!activeScriptId && scripts.length > 0) {
      setActiveScriptId(scripts[0].id);
    }
  }, [scripts, activeScriptId]);

  // --- Load Active Script (One-way sync: Props -> State) ---
  useEffect(() => {
    if (activeScriptId) {
      const script = scripts.find(s => s.id === activeScriptId);
      if (script) {
        setCode(script.code);
      }
    }
  }, [activeScriptId]); 

  // --- Auto-Save (One-way sync: State -> Props) ---
  useEffect(() => {
    if (!activeScriptId) return;

    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
        const script = scripts.find(s => s.id === activeScriptId);
        // Only save if content is different
        if (script && script.code !== code) {
            onSaveScript({ ...script, code, updatedAt: new Date().toISOString() });
        }
    }, 1000); // 1 second debounce

    return () => clearTimeout(saveTimeoutRef.current);
  }, [code, activeScriptId, onSaveScript, scripts]);

  // --- Recording Logic ---
  useEffect(() => {
    if (!isRecording) return;

    const unsubscribe = toolEventBus.subscribe((event) => {
        // Convert event to Python-like syntax: tool.action(arg1="val", arg2="val")
        let argsList = [];
        
        if (event.args) {
            for (const [key, value] of Object.entries(event.args)) {
                let valStr = String(value);
                if (typeof value === 'string') {
                    // Simple quote escaping
                    valStr = `"${valStr.replace(/"/g, '\\"')}"`;
                } else if (value === null || value === undefined) {
                    valStr = 'None';
                }
                argsList.push(`${key}=${valStr}`);
            }
        }
        
        let line = `${event.toolId}.${event.action}(${argsList.join(', ')})`;
        
        setCode(prev => prev + line + '\n');
        
        // Auto-scroll
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    });

    return unsubscribe;
  }, [isRecording]);

  // Scroll to bottom of chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiOpen]);

  // --- Scroll Sync ---
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (backdropRef.current) {
          backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      }
  };

  // --- Window Interaction Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
      // Prevent drag if clicking buttons/inputs
      if ((e.target as HTMLElement).closest('button, select, input, textarea, .scroll-area')) return;
      
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialRectRef.current = { ...position, ...size };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialRectRef.current = { ...position, ...size };
  };

  const handleConsoleResizeStart = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizingConsole(true);
      consoleResizeRef.current = {
          startY: e.clientY,
          startHeight: consoleHeight,
          containerHeight: size.height
      };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              setPosition({
                  x: initialRectRef.current.x + dx,
                  y: initialRectRef.current.y + dy
              });
          }
          if (isResizing) {
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              setSize({
                  width: Math.max(350, initialRectRef.current.width + dx),
                  height: Math.max(400, initialRectRef.current.height + dy)
              });
          }
          if (isResizingConsole) {
              const { startY, startHeight, containerHeight } = consoleResizeRef.current;
              const dy = e.clientY - startY;
              // Dragging down (positive dy) -> decrease height
              // Dragging up (negative dy) -> increase height
              const newHeight = Math.max(30, Math.min(containerHeight - 150, startHeight - dy));
              setConsoleHeight(newHeight);
          }
      };

      const handleMouseUp = () => {
          setIsDragging(false);
          setIsResizing(false);
          setIsResizingConsole(false);
      };

      if (isDragging || isResizing || isResizingConsole) {
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, isResizing, isResizingConsole]);

  // --- Execution Logic ---

  const initRuntime = () => {
    const parsed = ScriptParser.parse(code);
    if (parsed.error) {
        setErrorMessage(`Syntax Error: ${parsed.error}`);
        setExecutionState('error');
        return false;
    }
    
    programRef.current = parsed;
    
    const ctx = engine.createContext(toolRegistry, {
        log: (msg) => setLogs(prev => [...prev, msg]),
        highlightLine: (line) => {
            setCurrentLine(line);
        }
    });
    
    runtimeContextRef.current = ctx;
    setLogs([]);
    setErrorMessage(null);
    return true;
  };

  const handlePlay = async () => {
    if (executionState === 'idle' || executionState === 'error') {
        if (!initRuntime()) return;
    }
    
    setExecutionState('running');
    
    try {
        if (!programRef.current || !runtimeContextRef.current) return;
        
        while (runtimeContextRef.current.status !== 'completed' && runtimeContextRef.current.status !== 'error') {
            await engine.step(programRef.current, runtimeContextRef.current);
            if ((runtimeContextRef.current.status as string) === 'error') {
                throw new Error("Runtime Error");
            }
        }
        setExecutionState('idle');
        setCurrentLine(null);
    } catch (e: any) {
        setExecutionState('error');
        setErrorMessage(e.message || "Execution failed");
    }
  };

  const handleStep = async () => {
      if (executionState === 'idle' || executionState === 'error') {
          if (!initRuntime()) return;
          setExecutionState('paused'); 
      }

      try {
          if (!programRef.current || !runtimeContextRef.current) return;
          
          await engine.step(programRef.current, runtimeContextRef.current);
          
          if (runtimeContextRef.current.status === 'completed') {
              setExecutionState('idle');
              setCurrentLine(null);
          } else if (runtimeContextRef.current.status === 'error') {
              setExecutionState('error');
          }
      } catch (e: any) {
          setExecutionState('error');
      }
  };

  const handleStop = () => {
      setExecutionState('idle');
      setCurrentLine(null);
      setErrorMessage(null);
      runtimeContextRef.current = null;
      programRef.current = null;
  };

  const handleCreateNew = () => {
      const name = prompt("Script Name:");
      if (name) {
          onCreateScript(name);
      }
  };

  const handleDelete = () => {
      if (activeScriptId && confirm("Delete this script?")) {
          onDeleteScript(activeScriptId);
          setActiveScriptId(null);
          setCode('');
      }
  };

  // --- Snippet Library Logic ---
  const filteredSnippets = useMemo(() => {
      if (!searchTerm) return snippets;
      const lower = searchTerm.toLowerCase();
      return snippets.filter(s => s.name.toLowerCase().includes(lower));
  }, [snippets, searchTerm]);

  const handleInsertSnippet = (snippetCode: string) => {
      if (!textAreaRef.current) return;
      
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      
      const newCode = code.substring(0, start) + snippetCode + code.substring(end);
      setCode(newCode);
      
      // Defer focus to allow state update
      setTimeout(() => {
          textAreaRef.current?.focus();
          const newCursorPos = start + snippetCode.length;
          textAreaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
  };

  const handleAddSnippet = () => {
      let snippetCode = '';
      
      // Use selected text if available
      if (textAreaRef.current && textAreaRef.current.selectionStart !== textAreaRef.current.selectionEnd) {
          snippetCode = code.substring(textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd);
      }
      
      const name = prompt("Enter snippet name:");
      if (!name) return;
      
      const desc = prompt("Enter description (optional):") || "";
      if (!snippetCode) {
           // If no selection, check clipboard or prompt
           // Simple prompt for now
           const userCode = prompt("Enter snippet code (or paste):");
           if (userCode) snippetCode = userCode;
           else return;
      }
      
      const newSnippet: ScriptSnippet = {
          id: generateUUID(),
          name,
          description: desc,
          code: snippetCode,
          isSystem: false
      };
      
      setSnippets(prev => [...prev, newSnippet]);
  };

  const handleDeleteSnippet = (id: string) => {
      if (confirm("Delete this snippet?")) {
          setSnippets(prev => prev.filter(s => s.id !== id));
      }
  };

  // --- AI Logic ---
  const handleAiSend = async () => {
      if (!aiInput.trim()) return;
      setIsAiLoading(true);
      
      const userText = aiInput;
      setAiMessages(prev => [...prev, { role: 'user', text: userText }]);
      setAiInput('');

      try {
          const systemPrompt = `You are an expert TScript developer for the Tapestry Studio application.
          
          ${TSCRIPT_DOCS}
          
          Your goal is to help the user write, debug, or extend TScript code.
          You have access to a tool 'updateScript' which can replace the current editor content. 
          Use this tool if the user asks you to write code or fix the current script.
          
          Current Script Content:
          \`\`\`
          ${code}
          \`\`\`
          `;
          
          const toolDeclarations = [
            {
                name: 'updateScript',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        newCode: { type: Type.STRING, description: 'The full TScript code to replace the editor content with.' }
                    },
                    required: ['newCode']
                }
            }
          ];
          
          const response = await callAI(
              aiConfig,
              [...aiMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userText }] }],
              systemPrompt,
              toolDeclarations
          );
          
          let aiText = response.text || "";
          
          // Handle tool calls
          if (response.functionCalls && response.functionCalls.length > 0) {
              for (const fc of response.functionCalls) {
                  if (fc.name === 'updateScript') {
                      const args = fc.args as any;
                      if (args.newCode) {
                          setCode(args.newCode);
                          aiText += "\n\n[Script updated automatically]";
                      }
                  }
              }
          }
          
          setAiMessages(prev => [...prev, { role: 'model', text: aiText }]);
      } catch (e: any) {
          console.error("AI Script Error", e);
          setAiMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}` }]);
      } finally {
          setIsAiLoading(false);
      }
  };

  // --- UI Helpers ---
  const lineNumbers = useMemo(() => code.split('\n').map((_, i) => i + 1), [code]);

  const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const editorBg = isDarkMode ? 'bg-gray-950' : 'bg-gray-50';
  const highlightColor = isDarkMode ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 255, 0, 0.3)';
  const lineNumberColor = isDarkMode ? 'text-gray-600 border-gray-800' : 'text-gray-400 border-gray-300';
  const sidebarBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const itemHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

  if (!isOpen) return null;

  return (
    <div 
        className={`fixed z-[800] rounded-lg shadow-2xl border flex flex-col ${bgClass}`}
        style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
        {/* Header (Draggable) */}
        <div 
            className={`p-3 border-b flex justify-between items-center cursor-move select-none ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-500">TScript</span>
                <select 
                    value={activeScriptId || ''} 
                    onChange={(e) => setActiveScriptId(e.target.value)}
                    className={`text-xs rounded border p-1 max-w-[140px] outline-none ${isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                    <option value="" disabled>Select Script</option>
                    {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={handleCreateNew} className="text-green-500 hover:text-green-400 font-bold px-1">+</button>
                <button onClick={handleDelete} className="text-red-500 hover:text-red-400 font-bold px-1">×</button>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Toolbar */}
        <div className={`p-2 flex gap-2 border-b items-center ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <button 
                onClick={() => { setIsLibraryOpen(!isLibraryOpen); setIsAiOpen(false); }} 
                className={`p-1.5 rounded border transition-colors ${isLibraryOpen ? 'bg-blue-600 border-blue-500 text-white' : `border-gray-500 text-blue-500 hover:bg-blue-500 hover:text-white`}`}
                title="Toggle Snippet Library"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>
            
            <button 
                onClick={() => { setIsAiOpen(!isAiOpen); setIsLibraryOpen(false); }}
                className={`p-1.5 rounded border transition-colors ${isAiOpen ? 'bg-purple-600 border-purple-500 text-white' : `border-gray-500 text-purple-400 hover:bg-purple-500 hover:text-white`}`}
                title="AI Assistant"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="currentColor" fillOpacity="0.2" />
                    <path d="M18 15L19 18L22 19L19 20L18 23L17 20L14 19L17 18L18 15Z" fill="currentColor" fillOpacity="0.2" />
                    <path d="M6 15L7 18L10 19L7 20L6 23L5 20L2 19L5 18L6 15Z" fill="currentColor" fillOpacity="0.2" />
                </svg>
            </button>

            <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

            <button 
                onClick={() => setIsRecording(!isRecording)} 
                className={`p-1.5 rounded border transition-colors ${isRecording ? 'bg-red-600 border-red-500 text-white animate-pulse' : `border-gray-500 text-red-500 hover:bg-red-500 hover:text-white`}`}
                title="Record Actions"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /></svg>
            </button>
            <button 
                onClick={handlePlay}
                disabled={executionState === 'running'}
                className={`p-1.5 rounded border transition-colors ${executionState === 'running' ? 'bg-green-600 text-white' : 'text-green-500 border-green-500 hover:bg-green-500 hover:text-white disabled:opacity-50'}`}
                title="Run Script"
            >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button 
                onClick={handleStep}
                className={`p-1.5 rounded border text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white transition-colors`}
                title="Step Over"
            >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
            <button 
                onClick={handleStop}
                className={`p-1.5 rounded border text-gray-400 border-gray-400 hover:bg-gray-600 hover:text-white transition-colors`}
                title="Stop / Reset"
            >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
            </button>
        </div>

        {/* Main Flex Area */}
        <div className="flex flex-grow relative overflow-hidden">
            
            {/* Snippet Library Sidebar */}
            {isLibraryOpen && (
                <div className={`w-64 flex flex-col border-r ${sidebarBg} scroll-area`}>
                    <div className={`p-2 border-b flex gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`flex-grow text-xs rounded border px-2 py-1 outline-none ${isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <button 
                            onClick={handleAddSnippet}
                            className={`p-1 rounded border hover:bg-blue-500 hover:text-white transition ${isDarkMode ? 'border-gray-600 text-blue-400' : 'border-gray-300 text-blue-600'}`}
                            title="Add Snippet (from selection)"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-1 custom-scrollbar">
                        {filteredSnippets.map(snippet => (
                            <div key={snippet.id} className={`mb-1 rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className={`flex items-center justify-between p-2 text-xs cursor-pointer ${itemHover}`} onClick={() => setExpandedSnippetId(expandedSnippetId === snippet.id ? null : snippet.id)}>
                                    <span className={`font-bold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{snippet.name}</span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleInsertSnippet(snippet.code); }}
                                            className="text-green-500 hover:text-green-400 p-0.5" 
                                            title="Insert"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </button>
                                        {!snippet.isSystem && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); }}
                                                className="text-gray-500 hover:text-red-500 p-0.5"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {expandedSnippetId === snippet.id && (
                                    <div className={`p-2 border-t text-[10px] ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className="italic mb-1 opacity-70">{snippet.description}</p>
                                        <pre className={`p-1 rounded overflow-x-auto ${isDarkMode ? 'bg-black text-gray-300' : 'bg-white text-gray-800 border border-gray-300'}`}>
                                            {snippet.code}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Assistant Sidebar */}
            {isAiOpen && (
                <div className={`w-80 flex flex-col border-r ${sidebarBg} scroll-area`}>
                    <div className={`p-2 border-b text-xs font-bold uppercase tracking-wider text-purple-400 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        TScript Assistant
                    </div>
                    <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {aiMessages.map((msg, i) => (
                            <div key={i} className={`p-2 rounded text-xs whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white self-end ml-4' : (isDarkMode ? 'bg-gray-700 text-gray-200 mr-4' : 'bg-gray-200 text-gray-800 mr-4')}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isAiLoading && <div className="text-xs text-gray-500 italic animate-pulse">Thinking...</div>}
                        <div ref={chatEndRef} />
                    </div>
                    <div className={`p-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="Ask AI to write script..." 
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                                className={`flex-grow text-xs rounded border px-2 py-1 outline-none ${isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            />
                            <button 
                                onClick={handleAiSend}
                                disabled={isAiLoading || !aiInput.trim()}
                                className={`p-1.5 rounded border hover:bg-purple-600 hover:text-white transition ${isDarkMode ? 'border-gray-600 text-purple-400' : 'border-gray-300 text-purple-600'}`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div className={`flex-grow relative overflow-hidden flex text-xs font-mono ${editorBg}`}>
                {/* Backdrop Layer (Lines & Highlights) */}
                <div 
                    ref={backdropRef}
                    className="absolute inset-0 flex overflow-hidden pointer-events-none"
                >
                    {/* Line Numbers */}
                    <div className={`w-8 flex-shrink-0 text-right pr-2 pt-2 select-none opacity-50 border-r ${lineNumberColor}`} style={{ lineHeight: '1.5rem', minHeight: '100%' }}>
                        {lineNumbers.map(n => <div key={n}>{n}</div>)}
                    </div>
                    
                    {/* Highlights */}
                    <div className="flex-grow relative pt-2 pl-2" style={{ lineHeight: '1.5rem' }}>
                        {lineNumbers.map(n => (
                            <div key={n} style={{ height: '1.5rem', width: '100%', backgroundColor: currentLine === n ? highlightColor : 'transparent' }}></div>
                        ))}
                    </div>
                </div>

                {/* Input Layer (Transparent Textarea) */}
                <textarea
                    ref={textAreaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleScroll}
                    className="flex-grow bg-transparent outline-none resize-none p-2 pl-10 leading-[1.5rem] z-10 w-full h-full absolute inset-0 scroll-area"
                    spellCheck={false}
                    style={{ color: isDarkMode ? '#d1d5db' : '#374151', caretColor: isDarkMode ? 'white' : 'black' }}
                />
            </div>

        </div>

        {/* Console Resize Handle */}
        <div 
            className={`h-1.5 cursor-row-resize flex-shrink-0 flex items-center justify-center hover:bg-blue-500/50 transition-colors z-10 select-none ${isDarkMode ? 'bg-gray-800 border-t border-b border-gray-700' : 'bg-gray-200 border-t border-b border-gray-300'}`}
            onMouseDown={handleConsoleResizeStart}
            title="Drag to resize console"
        >
             <div className={`w-8 h-0.5 rounded-full opacity-50 ${isDarkMode ? 'bg-gray-50' : 'bg-gray-400'}`}></div>
        </div>

        {/* Console / Status Footer */}
        <div 
            className={`flex-shrink-0 flex flex-col overflow-hidden ${isDarkMode ? 'bg-black' : 'bg-white'}`}
            style={{ height: consoleHeight }}
        >
            <div className={`px-2 py-1 text-[10px] uppercase font-bold flex justify-between ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <span>Console</span>
                <span className={
                    executionState === 'error' ? 'text-red-500' : 
                    executionState === 'running' ? 'text-green-500' : 
                    isRecording ? 'text-red-400 animate-pulse' : 'text-gray-500'
                }>
                    {isRecording ? 'RECORDING' : executionState.toUpperCase()}
                </span>
            </div>
            <div className="flex-grow overflow-y-auto p-2 font-mono text-[10px] space-y-1 custom-scrollbar">
                {errorMessage && (
                    <div className="text-red-500 font-bold">{errorMessage}</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="text-blue-400">{log}</div>
                ))}
                {logs.length === 0 && !errorMessage && <div className="text-gray-600 italic">Ready.</div>}
            </div>
        </div>

        {/* Resize Handle */}
        <div 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-50"
            onMouseDown={handleResizeStart}
        >
            <svg viewBox="0 0 10 10" className={`w-3 h-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <path d="M10 10 L10 2 L2 10 Z" fill="currentColor" />
            </svg>
        </div>

    </div>
  );
};
