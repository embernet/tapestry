
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TapestryDocument, TapestryFolder } from '../types';

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
                onDeleteDocument={onDeleteDocument} // Passed down
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

const DocumentItem: React.FC<{
    doc: TapestryDocument;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ doc, onOpen, onDelete }) => {
    const renderIcon = () => {
        if (doc.type === 'swot-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="7" height="7" rx="1" className="fill-green-500" />
                    <rect x="13" y="4" width="7" height="7" rx="1" className="fill-red-300" />
                    <rect x="4" y="13" width="7" height="7" rx="1" className="fill-yellow-400" />
                    <rect x="13" y="13" width="7" height="7" rx="1" className="fill-red-700" />
                </svg>
            );
        }
        if (doc.type === 'scamper-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="2" height="16" rx="0.5" fill="#06b6d4" />
                    <rect x="5" y="4" width="2" height="16" rx="0.5" fill="#3b82f6" />
                    <rect x="8" y="4" width="2" height="16" rx="0.5" fill="#8b5cf6" />
                    <rect x="11" y="4" width="2" height="16" rx="0.5" fill="#d946ef" />
                    <rect x="14" y="4" width="2" height="16" rx="0.5" fill="#ef4444" />
                    <rect x="17" y="4" width="2" height="16" rx="0.5" fill="#f97316" />
                    <rect x="20" y="4" width="2" height="16" rx="0.5" fill="#22c55e" />
                </svg>
            );
        }
        if (doc.type === 'triz-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            );
        }
        // Default Text/Report
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
        );
    };

    return (
        <div className="flex justify-between items-center p-2 hover:bg-gray-700 rounded group cursor-pointer" onClick={() => onOpen(doc.id)}>
            <div className="flex items-center gap-2 overflow-hidden">
                {renderIcon()}
                <span className="text-sm text-gray-300 truncate">{doc.title}</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

const FolderItem: React.FC<{
    folder: TapestryFolder;
    documents: TapestryDocument[];
    onOpenDocument: (id: string) => void;
    onCreateDocument: (folderId: string) => void;
    onDeleteFolder: (id: string) => void;
    onDeleteDocument: (id: string) => void;
}> = ({ folder, documents, onOpenDocument, onCreateDocument, onDeleteFolder, onDeleteDocument }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="select-none">
            <div className="flex items-center justify-between group hover:bg-gray-700 rounded px-2 py-1 cursor-pointer">
                <div className="flex items-center" onClick={() => setIsOpen(!isOpen)}>
                    <button className="text-gray-400 mr-1 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className="text-sm text-gray-300 font-medium">{folder.name}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onCreateDocument(folder.id); }}
                        className="text-gray-500 hover:text-blue-400 p-1"
                        title="Add Document"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                        className="text-gray-500 hover:text-red-400 p-1"
                        title="Delete Folder"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="ml-4 border-l border-gray-700 pl-1">
                    {documents.length > 0 ? (
                        documents.map(doc => (
                            <DocumentItem 
                                key={doc.id} 
                                doc={doc} 
                                onOpen={onOpenDocument} 
                                onDelete={onDeleteDocument}
                            />
                        ))
                    ) : (
                        <div className="text-xs text-gray-600 italic p-2">Empty</div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Document Editor ---

interface DocumentEditorPanelProps {
    document: TapestryDocument;
    onUpdate: (id: string, updates: Partial<TapestryDocument>) => void;
    onClose: () => void;
    initialViewMode?: 'edit' | 'preview';
}

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let currentListItems: React.ReactNode[] = [];
    
    const flushList = (keyPrefix: number) => {
        if (currentListItems.length > 0) {
            elements.push(
                <ul key={`list-${keyPrefix}`} className="list-disc list-inside mb-4 pl-4 text-gray-300 space-y-1">
                    {currentListItems}
                </ul>
            );
            currentListItems = [];
        }
    };

    const parseInline = (text: string): React.ReactNode[] => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-gray-700 px-1 rounded text-xs font-mono text-blue-300">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        if (!trimmed) {
            flushList(index);
            return;
        }

        if (trimmed.startsWith('# ')) {
            flushList(index);
            elements.push(<h1 key={`h1-${index}`} className="text-2xl font-bold text-white mb-4 mt-6 border-b border-gray-700 pb-2">{trimmed.substring(2)}</h1>);
        } else if (trimmed.startsWith('## ')) {
            flushList(index);
            elements.push(<h2 key={`h2-${index}`} className="text-xl font-bold text-blue-400 mb-3 mt-5">{trimmed.substring(3)}</h2>);
        } else if (trimmed.startsWith('### ')) {
            flushList(index);
            elements.push(<h3 key={`h3-${index}`} className="text-lg font-bold text-gray-200 mb-2 mt-4">{trimmed.substring(4)}</h3>);
        } else if (trimmed.startsWith('#### ')) {
            flushList(index);
            elements.push(<h4 key={`h4-${index}`} className="text-base font-bold text-gray-300 mb-2 mt-3">{trimmed.substring(5)}</h4>);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            currentListItems.push(<li key={`li-${index}`}>{parseInline(content)}</li>);
        } else if (/^\d+\.\s/.test(trimmed)) {
             flushList(index);
             elements.push(<p key={`p-${index}`} className="mb-2 text-gray-300 leading-relaxed">{parseInline(trimmed)}</p>);
        } else {
            flushList(index);
            elements.push(<p key={`p-${index}`} className="mb-2 text-gray-300 leading-relaxed">{parseInline(trimmed)}</p>);
        }
    });
    
    flushList(lines.length);

    return <div className="markdown-preview px-2">{elements}</div>;
};

export const DocumentEditorPanel: React.FC<DocumentEditorPanelProps> = ({ document, onUpdate, onClose, initialViewMode = 'edit' }) => {
    const [title, setTitle] = useState(document.title);
    const [content, setContent] = useState(document.content);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>(initialViewMode);

    useEffect(() => {
        setTitle(document.title);
        setContent(document.content);
    }, [document]);

    const handleSave = () => {
        onUpdate(document.id, { title, content });
    };

    const handleBlur = () => {
        if (title !== document.title || content !== document.content) {
            handleSave();
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-800">
            <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleBlur}
                    className="bg-transparent text-white font-bold text-lg outline-none placeholder-gray-500 w-full"
                    placeholder="Document Title"
                />
                <div className="flex gap-2">
                    <button onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')} className="text-gray-400 hover:text-white text-xs uppercase font-bold bg-gray-800 px-2 py-1 rounded">
                        {viewMode === 'edit' ? 'Preview' : 'Edit'}
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-hidden bg-gray-900 relative">
                {viewMode === 'edit' ? (
                    <textarea 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleBlur}
                        className="w-full h-full bg-gray-900 text-gray-300 p-4 outline-none resize-none font-mono text-sm"
                        placeholder="Start typing..."
                    />
                ) : (
                    <div className="w-full h-full p-6 overflow-y-auto text-gray-300">
                        <SimpleMarkdownRenderer content={content} />
                    </div>
                )}
            </div>
        </div>
    );
};
