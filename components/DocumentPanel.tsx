
import React, { useState, useMemo, useRef } from 'react';
import { TapestryDocument, TapestryFolder } from '../types';
import { GoogleGenAI } from '@google/genai';

// --- Document Manager Panel ---

interface DocumentManagerPanelProps {
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onOpenDocument: (docId: string) => void;
  onCreateFolder: (name: string) => void;
  onCreateDocument: (folderId: string | null) => void;
  onDeleteDocument: (docId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onClose: () => void;
}

export const DocumentManagerPanel: React.FC<DocumentManagerPanelProps> = ({
  documents,
  folders,
  onOpenDocument,
  onCreateFolder,
  onCreateDocument,
  onDeleteDocument,
  onDeleteFolder,
  onClose,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Sort folders and docs
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.name.localeCompare(b.name)), [folders]);
  const sortedRootDocs = useMemo(() => documents.filter(d => !d.folderId).sort((a, b) => a.title.localeCompare(b.title)), [documents]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
        <h2 className="text-xl font-bold text-white">Documents</h2>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsCreatingFolder(true)}
                className="p-1 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded"
                title="New Folder"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    <path stroke="#fff" strokeWidth="2" d="M12 12h4m-2-2v4" strokeLinecap="round" />
                </svg>
            </button>
            <button 
                onClick={() => onCreateDocument(null)}
                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded"
                title="New Document"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </div>

      {isCreatingFolder && (
          <div className="p-2 bg-gray-700 border-b border-gray-600 flex gap-2">
              <input 
                autoFocus
                type="text" 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                placeholder="Folder Name"
                className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <button onClick={handleCreateFolder} className="text-green-400 hover:text-green-300 font-bold">✓</button>
              <button onClick={() => setIsCreatingFolder(false)} className="text-red-400 hover:text-red-300 font-bold">✕</button>
          </div>
      )}

      <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {sortedFolders.map(folder => (
              <FolderItem 
                key={folder.id} 
                folder={folder} 
                documents={documents.filter(d => d.folderId === folder.id)}
                onOpenDocument={onOpenDocument}
                onCreateDocument={onCreateDocument}
                onDeleteFolder={onDeleteFolder}
              />
          ))}
          {sortedRootDocs.map(doc => (
              <DocumentItem 
                key={doc.id} 
                doc={doc} 
                onOpen={onOpenDocument} 
                onDelete={onDeleteDocument}
              />
          ))}
          {sortedFolders.length === 0 && sortedRootDocs.length === 0 && (
              <div className="text-center text-gray-500 mt-8 italic text-sm">No documents yet.</div>
          )}
      </div>
    </div>
  );
};

// --- Subcomponents ---

const FolderItem: React.FC<{
    folder: TapestryFolder;
    documents: TapestryDocument[];
    onOpenDocument: (id: string) => void;
    onCreateDocument: (folderId: string) => void;
    onDeleteFolder: (id: string) => void;
}> = ({ folder, documents, onOpenDocument, onCreateDocument, onDeleteFolder }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="select-none">
            <div className="flex items-center group hover:bg-gray-700 rounded px-2 py-1 cursor-pointer">
                <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 mr-1 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <span className="text-yellow-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                </span>
                <span className="text-gray-200 text-sm font-medium flex-grow truncate" onClick={() => setIsOpen(!isOpen)}>{folder.name}</span>
                
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={() => onCreateDocument(folder.id)} className="text-blue-400 hover:text-blue-300 p-0.5" title="Add Doc to Folder">+</button>
                    <button onClick={() => onDeleteFolder(folder.id)} className="text-red-400 hover:text-red-300 p-0.5" title="Delete Folder">×</button>
                </div>
            </div>
            {isOpen && (
                <div className="ml-6 border-l border-gray-700 pl-1 mt-1 space-y-1">
                    {documents.map(doc => (
                        <DocumentItem key={doc.id} doc={doc} onOpen={onOpenDocument} />
                    ))}
                    {documents.length === 0 && <div className="text-xs text-gray-600 italic px-2">Empty</div>}
                </div>
            )}
        </div>
    );
};

const DocumentItem: React.FC<{ doc: TapestryDocument, onOpen: (id: string) => void, onDelete?: (id: string) => void }> = ({ doc, onOpen, onDelete }) => {
    return (
        <div className="flex items-center group hover:bg-gray-700 rounded px-2 py-1 cursor-pointer" onClick={() => onOpen(doc.id)}>
            <span className="text-blue-400 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            </span>
            <span className="text-gray-300 text-sm flex-grow truncate">{doc.title}</span>
            {onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }} 
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5"
                >
                    ×
                </button>
            )}
        </div>
    );
};

// --- Markdown Renderer Helper ---

const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={idx} className="text-gray-300">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={idx} className="bg-gray-700 px-1 rounded text-xs text-red-300">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

const SimpleMarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return <div className="text-gray-500 italic">No content.</div>;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Headers
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-2xl font-bold mb-3 text-blue-400 border-b border-gray-700 pb-1 mt-4">{parseInline(line.slice(2))}</h1>);
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-xl font-bold mb-2 mt-3 text-blue-300">{parseInline(line.slice(3))}</h2>);
            continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-lg font-bold mb-1 mt-2 text-blue-200">{parseInline(line.slice(4))}</h3>);
            continue;
        }
        
        // Lists
        if (line.match(/^[-*] /)) {
            elements.push(
                <div key={i} className="flex gap-2 ml-4 mb-1">
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{parseInline(line.slice(2))}</span>
                </div>
            );
            continue;
        }
        if (line.match(/^\d+\. /)) {
             const match = line.match(/^\d+\. /);
             const prefix = match ? match[0] : '';
             const text = line.replace(/^\d+\. /, '');
             elements.push(
                <div key={i} className="flex gap-2 ml-4 mb-1">
                    <span className="text-gray-400 font-mono text-xs pt-0.5">{prefix}</span>
                    <span className="text-gray-300">{parseInline(text)}</span>
                </div>
             );
             continue;
        }

        // Empty line
        if (line.trim() === '') {
            elements.push(<div key={i} className="h-2"></div>);
            continue;
        }

        // Paragraph
        elements.push(<p key={i} className="mb-2 text-gray-300 leading-relaxed">{parseInline(line)}</p>);
    }

    return <div className="overflow-y-auto h-full pr-2">{elements}</div>;
};


// --- Document Editor Panel ---

interface DocumentEditorPanelProps {
    document: TapestryDocument;
    onUpdate: (docId: string, updates: Partial<TapestryDocument>) => void;
    onClose: () => void;
    initialViewMode?: 'edit' | 'preview';
}

export const DocumentEditorPanel: React.FC<DocumentEditorPanelProps> = ({ document, onUpdate, onClose, initialViewMode = 'edit' }) => {
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>(initialViewMode);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleAIRequest = async () => {
        if (!aiInput.trim() || isAiLoading) return;
        setIsAiLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
            You are an AI writing assistant.
            The user wants you to edit or add to the following document.
            
            Document Title: "${document.title}"
            Current Content:
            """
            ${document.content}
            """
            
            User Request: "${aiInput}"
            
            Instructions:
            - Return the NEW FULL CONTENT of the document.
            - Do not return markdown fences like \`\`\`. Just the raw text content.
            - If the user asks to add something, append it logically or insert where appropriate.
            - If the user asks to rewrite, rewrite it.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const newContent = response.text;
            if (newContent) {
                onUpdate(document.id, { content: newContent });
                setAiInput('');
            }
        } catch (e) {
            console.error("AI Edit failed", e);
            alert("Failed to process AI request.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const insertFormat = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = document.content || '';
        const selection = text.substring(start, end);
        
        const newText = text.substring(0, start) + before + selection + after + text.substring(end);
        onUpdate(document.id, { content: newText });
        
        // Defer focus
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertList = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const text = document.content || '';
        
        // Find start of current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        
        const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
        onUpdate(document.id, { content: newText });
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }, 0);
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-800">
            {/* Header */}
            <div className="p-2 border-b border-gray-700 bg-gray-900 flex gap-2 items-center">
                <div className="flex-grow">
                    <input 
                        type="text" 
                        value={document.title} 
                        onChange={(e) => onUpdate(document.id, { title: e.target.value })}
                        className="w-full bg-transparent text-white font-bold text-lg px-2 py-1 focus:bg-gray-800 rounded focus:outline-none border border-transparent focus:border-blue-500 transition-all"
                        placeholder="Untitled Document"
                    />
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {/* AI Edit Bar */}
            <div className="bg-gray-700 p-2 flex gap-2 items-center border-b border-gray-600">
                <div className="text-purple-400 px-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 5a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1V8a1 1 0 011-1zm5-5a1 1 0 011 1v15a1 1 0 11-2 0V3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask AI to edit or add to this doc..."
                    className="flex-grow bg-gray-800 text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleAIRequest()}
                    disabled={isAiLoading}
                />
                <button 
                    onClick={handleAIRequest}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                >
                    {isAiLoading ? '...' : 'Generate'}
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700 p-1 flex items-center justify-between">
                <div className="flex gap-1">
                    {viewMode === 'edit' && (
                        <>
                            <button onClick={() => insertFormat('**', '**')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold" title="Bold">B</button>
                            <button onClick={() => insertFormat('*', '*')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded italic" title="Italic">I</button>
                            <div className="w-px h-4 bg-gray-700 mx-1 self-center"></div>
                            <button onClick={() => insertList('# ')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold text-sm" title="Heading 1">H1</button>
                            <button onClick={() => insertList('## ')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold text-xs" title="Heading 2">H2</button>
                            <button onClick={() => insertList('### ')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded font-bold text-[10px]" title="Heading 3">H3</button>
                            <div className="w-px h-4 bg-gray-700 mx-1 self-center"></div>
                            <button onClick={() => insertList('- ')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Bullet List">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={() => insertList('1. ')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Numbered List">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                            </button>
                        </>
                    )}
                </div>
                <div className="flex bg-gray-900 rounded p-0.5 border border-gray-700">
                    <button 
                        onClick={() => setViewMode('edit')} 
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${viewMode === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => setViewMode('preview')} 
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            <div className="flex-grow flex flex-col p-4 bg-gray-800 relative overflow-hidden">
                {viewMode === 'edit' ? (
                    <textarea 
                        ref={textareaRef}
                        value={document.content} 
                        onChange={(e) => onUpdate(document.id, { content: e.target.value })}
                        className="flex-grow w-full bg-transparent text-gray-200 resize-none focus:outline-none font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-600"
                        placeholder="Start typing markdown..."
                    />
                ) : (
                    <SimpleMarkdownPreview content={document.content} />
                )}
                <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2 text-right flex-shrink-0">
                    Last updated: {new Date(document.updatedAt).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
