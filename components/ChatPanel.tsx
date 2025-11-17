import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Content } from '@google/genai';
import { Element, Relationship } from '../types';
import { generateMarkdownFromGraph } from '../utils';

interface ChatPanelProps {
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
  currentModelId: string | null;
  className?: string;
  isOpen?: boolean;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ elements, relationships, onClose, currentModelId, className, isOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    setMessages([{ role: 'model', text: "Hello! I'm your AI assistant. Ask me anything about your current model." }]);
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
        const systemInstruction = `You are an AI assistant for a visual graphing tool called Tapestry. The user is currently viewing a model. You have been provided the entire model's data in a simplified markdown-like format. Use this data as your context to answer the user's questions about their model. Do not mention that you are using markdown, just use the data as your knowledge base. Be helpful and concise. Here is the model:\n\n---\n${modelMarkdown}\n---`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Format the entire history for the API call
        const history: Content[] = newMessages
          .filter(m => m.role === 'user' || m.role === 'model') // Exclude any potential system messages
          .map(msg => ({
              role: msg.role,
              parts: [{ text: msg.text }],
          }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const modelResponseText = response.text;

        if (!modelResponseText) {
            throw new Error("Received an invalid response from the API.");
        }

        const modelMessage: Message = { role: 'model', text: modelResponseText };
        setMessages(prev => [...prev, modelMessage]);

    } catch (e) {
        console.error("Error sending message:", e);
        const errorMessage = e instanceof Error ? e.message : "Sorry, I couldn't get a response. Please check your API key and network connection.";
        setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
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
      content = messages.map(msg => `**${msg.role === 'user' ? 'You' : 'AI Assistant'}**:\n\n${msg.text}`).join('\n\n---\n\n');
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

  return (
    <div className={`bg-gray-800 border-r border-gray-700 h-full w-1/3 max-w-lg flex-shrink-0 z-20 flex flex-col ${className || ''}`}>
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI Assistant
        </h2>
        <div className="flex items-center space-x-2">
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
            <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-lg ${ msg.role === 'user' ? 'bg-blue-600 text-white order-2' : 'bg-gray-700 text-gray-200' }`}>
                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
              </div>
              {msg.role === 'model' && index > 0 && ( // Don't show actions for the initial welcome message
                  <div className="flex flex-col space-y-1 opacity-50 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopy(msg.text, index)}
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
                      title="Delete this message and its prompt"
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
        <div className="flex items-end space-x-2 bg-gray-700 border border-gray-600 rounded-lg p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your model..."
            disabled={isLoading}
            className="flex-grow bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none max-h-40"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
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