
import React, { useState } from 'react';
import { ChatMessage } from '../types';

interface DebugPanelProps {
  messages: ChatMessage[];
  onClose: () => void;
  isDarkMode: boolean;
}

const JsonView: React.FC<{ data: any, isDarkMode: boolean }> = ({ data, isDarkMode }) => {
    return (
        <pre className={`text-[10px] font-mono whitespace-pre-wrap break-all p-2 rounded ${isDarkMode ? 'bg-black text-green-400' : 'bg-gray-100 text-green-700'}`}>
            {JSON.stringify(data, null, 2)}
        </pre>
    );
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ messages, onClose, isDarkMode }) => {
  const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const headerBgClass = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center ${headerBgClass}`}>
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Debug: AI Chat Stream</h2>
        <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">No messages yet.</div>
          )}
          
          {messages.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold uppercase ${msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>
                          {msg.role}
                      </span>
                      {msg.isPending && <span className="text-xs text-yellow-500 font-mono">[PENDING ACTION]</span>}
                  </div>
                  
                  <div className="space-y-2">
                      {msg.text && (
                          <div>
                              <div className="text-[10px] uppercase text-gray-500 mb-1">Text Content</div>
                              <div className={`text-sm ${textClass} whitespace-pre-wrap font-mono p-2 rounded ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                                  {msg.text}
                              </div>
                          </div>
                      )}
                      
                      {msg.requestPayload && (
                          <div>
                              <div className="text-[10px] uppercase text-gray-500 mb-1">Request Payload (Sent)</div>
                              <JsonView data={msg.requestPayload} isDarkMode={isDarkMode} />
                          </div>
                      )}

                      {msg.rawJson && (
                          <div>
                              <div className="text-[10px] uppercase text-gray-500 mb-1">Raw JSON Response</div>
                              <JsonView data={msg.rawJson} isDarkMode={isDarkMode} />
                          </div>
                      )}

                      {msg.functionCalls && (
                          <div>
                              <div className="text-[10px] uppercase text-gray-500 mb-1">Tool Calls</div>
                              <JsonView data={msg.functionCalls} isDarkMode={isDarkMode} />
                          </div>
                      )}

                      {msg.functionResponses && (
                          <div>
                              <div className="text-[10px] uppercase text-gray-500 mb-1">Tool Responses</div>
                              <JsonView data={msg.functionResponses} isDarkMode={isDarkMode} />
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
