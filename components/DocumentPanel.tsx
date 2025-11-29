import React, { useState, useMemo, useEffect } from 'react';
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
  isDarkMode: boolean;
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
  isDarkMode
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

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const headerBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
      <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${headerBgClass}`}>
        <h2 className={`text-xl font-bold ${textClass}`}>Documents</h2>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsCreatingFolder(true)}
                className={`p-1 ${subTextClass} hover:text-yellow-400 ${hoverClass} rounded`}
                title="New Folder"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    <path stroke={isDarkMode ? "#fff" : "#374151"} strokeWidth="2" d="M12 12h4m-2-2v4" strokeLinecap="round" />
                </svg>
            </button>
            <button 
                onClick={() => onCreateDocument(null)}
                className={`p-1 ${subTextClass} hover:text-blue-400 ${hoverClass} rounded`}
                title="New Document"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
            </button>
            <button onClick={onClose} className={`${subTextClass} hover:text-blue-500 ml-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </div>

      {isCreatingFolder && (
          <div className={`p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${borderClass} flex gap-2`}>
              <input 
                autoFocus
                type="text" 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                placeholder="Folder Name"
                className={`flex-grow ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border ${borderClass} rounded px-2 py-1 text-sm focus:outline-none`}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <button onClick={handleCreateFolder} className="text-green-500 hover:text-green-400 font-bold">✓</button>
              <button onClick={() => setIsCreatingFolder(false)} className="text-red-500 hover:text-red-400 font-bold">✕</button>
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
                onDeleteDocument={onDeleteDocument}
                isDarkMode={isDarkMode}
              />
          ))}
          {sortedRootDocs.map(doc => (
              <DocumentItem 
                key={doc.id} 
                doc={doc} 
                onOpen={onOpenDocument} 
                onDelete={onDeleteDocument}
                isDarkMode={isDarkMode}
              />
          ))}
          {sortedFolders.length === 0 && sortedRootDocs.length === 0 && (
              <div className={`text-center ${subTextClass} mt-8 italic text-sm`}>No documents yet.</div>
          )}
      </div>
    </div>
  );
};

const DocumentItem: React.FC<{
    doc: TapestryDocument;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
    isDarkMode: boolean;
}> = ({ doc, onOpen, onDelete, isDarkMode }) => {
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
        if (doc.type === 'five-forces-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            );
        }
        if (doc.type === 'pestel-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="6" height="6" rx="1" fill="#f87171" /> 
                    <rect x="9" y="4" width="6" height="6" rx="1" fill="#34d399" />
                    <rect x="16" y="4" width="6" height="6" rx="1" fill="#facc15" />
                    <rect x="2" y="11" width="6" height="6" rx="1" fill="#60a5fa" />
                    <rect x="9" y="11" width="6" height="6" rx="1" fill="#4ade80" />
                    <rect x="16" y="11" width="6" height="6" rx="1" fill="#94a3b8" />
                </svg>
            );
        }
        if (doc.type === 'steer-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            );
        }
        if (doc.type === 'destep-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            );
        }
        if (doc.type === 'longpest-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        }
        if (doc.type === 'cage-analysis') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            );
        }
        if (doc.type && doc.type.startsWith('custom-strategy-')) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lime-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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
        <div className={`flex justify-between items-center p-2 rounded group cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={() => onOpen(doc.id)}>
            <div className="flex items-center gap-2 overflow-hidden">
                {renderIcon()}
                <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{doc.title}</span>
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
    isDarkMode: boolean;
}> = ({ folder, documents, onOpenDocument, onCreateDocument, onDeleteFolder, onDeleteDocument, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(true);

    const folderTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const folderHoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

    return (
        <div className="select-none">
            <div className={`flex items-center justify-between group ${folderHoverClass} rounded px-2 py-1 cursor-pointer`}>
                <div className="flex items-center" onClick={() => setIsOpen(!isOpen)}>
                    <button className={`mr-1 hover:text-blue-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className={`text-sm font-medium ${folderTextClass}`}>{folder.name}</span>
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
                <div className={`pl-4 border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} ml-2 mt-1 space-y-1`}>
                    {documents.map(doc => (
                        <DocumentItem 
                            key={doc.id} 
                            doc={doc} 
                            onOpen={onOpenDocument} 
                            onDelete={onDeleteDocument}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                    {documents.length === 0 && (
                        <div className="text-gray-500 text-xs italic pl-2 py-1">Empty</div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Document Editor Panel ---

interface DocumentEditorPanelProps {
  document: TapestryDocument;
  onUpdate: (docId: string, updates: Partial<TapestryDocument>) => void;
  onClose: () => void;
  initialViewMode?: 'edit' | 'preview';
  isDarkMode: boolean;
}

export const DocumentEditorPanel: React.FC<DocumentEditorPanelProps> = ({ document, onUpdate, onClose, initialViewMode = 'edit', isDarkMode }) => {
    const [title, setTitle] = useState(document.title);
    const [content, setContent] = useState(document.content);
    const [mode, setMode] = useState<'edit' | 'preview'>(initialViewMode);

    useEffect(() => {
        setTitle(document.title);
        setContent(document.content);
    }, [document]);

    const handleSave = () => {
        onUpdate(document.id, { title, content });
    };

    // Auto-save on blur
    const handleBlur = () => {
        if (title !== document.title || content !== document.content) {
            handleSave();
        }
    };

    const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const headerBgClass = isDarkMode ? 'bg-gray-900' : 'bg-gray-100';
    const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const contentTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-800';

    return (
        <div className={`flex flex-col h-full ${bgClass} border-l ${borderClass}`}>
            <div className={`p-4 border-b ${borderClass} ${headerBgClass} flex justify-between items-center shrink-0`}>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleBlur}
                    className={`bg-transparent ${textClass} font-bold text-lg outline-none w-full mr-4`}
                    placeholder="Document Title"
                />
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                        className={`text-xs uppercase font-bold px-2 py-1 rounded transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                    >
                        {mode === 'edit' ? 'Preview' : 'Edit'}
                    </button>
                    <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-hidden relative">
                {mode === 'edit' ? (
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleBlur}
                        className={`w-full h-full ${bgClass} ${contentTextClass} p-4 outline-none resize-none font-mono text-sm`}
                        placeholder="Start typing..."
                    />
                ) : (
                    <div className={`w-full h-full ${bgClass} ${contentTextClass} p-4 overflow-y-auto prose ${isDarkMode ? 'prose-invert' : ''} prose-sm max-w-none whitespace-pre-wrap`}>
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
};