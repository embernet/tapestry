import React, { useState, useEffect, useRef } from 'react';
// Fix: Import GoogleGenAI and Chat from the official SDK
import { GoogleGenAI, Chat } from '@google/genai';
import { Element, Relationship } from '../types';
import { generateMarkdownFromGraph } from '../utils';

interface ChatPanelProps {
  elements: Element[];
  relationships: Relationship[];
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ elements, relationships, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  // Fix: Use the Chat object from the SDK to manage conversation state.
  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // This effect re-initializes the chat session whenever the graph data changes.
  useEffect(() => {
    const modelMarkdown = generateMarkdownFromGraph(elements, relationships);
    const systemInstruction = `You are an AI assistant for a visual graphing tool called Tapestry. The user is currently viewing a model. You have been provided the entire model's data in a simplified markdown-like format. Use this data as your context to answer the user's questions about their model. Do not mention that you are using markdown, just use the data as your knowledge base. Be helpful and concise. Here is the model:\n\n---\n${modelMarkdown}\n---`;
    
    // Fix: Initialize the SDK and create a new chat session.
    // As per guidelines, the API key is assumed to be available in process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    setChat(newChat);


    // Reset the chat state
    setMessages([{ role: 'model', text: "Hello! I'm your AI assistant. Ask me anything about your current model." }]);
    setError(null);
    setIsLoading(false);
  }, [elements, relationships]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    // Fix: Check for the chat object before sending a message.
    if (!input.trim() || isLoading || !chat) return;

    const userMessageText = input.trim();
    const userMessage: Message = { role: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMessage]);
    
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
        // Fix: Use the chat object's sendMessage method, which handles history and API calls.
        const response = await chat.sendMessage({ message: userMessageText });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-800 border-r border-gray-700 h-full w-1/3 max-w-lg flex-shrink-0 z-20 flex flex-col">
      <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI Assistant
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md p-3 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
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