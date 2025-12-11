
import React, { useState, useRef, useEffect } from 'react';
import { GraphView } from '../types';

interface ViewSelectProps {
  views: GraphView[];
  activeViewId: string;
  onSelectView: (id: string) => void;
  onCreateView: () => void;
  onDuplicateView: () => void;
  onRenameView: (id: string, name: string) => void;
  onDeleteView: (id: string) => void;
  onEditView: () => void;
  isDarkMode: boolean;
}

export const ViewSelect: React.FC<ViewSelectProps> = ({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  onDuplicateView,
  onRenameView,
  onDeleteView,
  onEditView,
  isDarkMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewToDelete, setViewToDelete] = useState<GraphView | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeView = views.find(v => v.id === activeViewId);

  const handleEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onSelectView(id);
      onEditView();
      setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const view = views.find(v => v.id === id);
      if (view) {
          setViewToDelete(view);
          setIsOpen(false);
      }
  };

  const confirmDelete = () => {
      if (viewToDelete) {
          onDeleteView(viewToDelete.id);
          setViewToDelete(null);
      }
  };

  const bgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const textClass = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const activeClass = isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700';

  // Sort and separate views
  const fullGraphView = views.find(v => v.name === 'Full Graph');
  const otherViews = views.filter(v => v.name !== 'Full Graph').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${bgClass} ${textClass} hover:border-blue-500`}
        title="Switch View"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
        <span className="font-semibold text-sm max-w-[150px] truncate">{activeView?.name || 'Unknown View'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-xl border z-[1000] overflow-hidden ${bgClass}`}>
            <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider opacity-50 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                Graph Views
            </div>
            
            <div className="max-h-64 overflow-y-auto">
                {/* Full Graph View (Pinned Top, No Actions) */}
                {fullGraphView && (
                    <div 
                        key={fullGraphView.id}
                        onClick={() => { onSelectView(fullGraphView.id); setIsOpen(false); }}
                        className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${fullGraphView.id === activeViewId ? activeClass : `${textClass} ${hoverClass}`}`}
                    >
                        <span className="text-sm truncate flex-grow mr-2 font-bold">{fullGraphView.name}</span>
                    </div>
                )}

                {/* Separator */}
                {fullGraphView && otherViews.length > 0 && (
                    <div className={`border-t mx-2 my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                )}

                {/* Other Views (Sorted) */}
                {otherViews.map(view => (
                    <div 
                        key={view.id}
                        onClick={() => { onSelectView(view.id); setIsOpen(false); }}
                        className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${view.id === activeViewId ? activeClass : `${textClass} ${hoverClass}`}`}
                    >
                        <span className="text-sm truncate flex-grow mr-2">{view.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleEdit(e, view.id)}
                                className="p-1 hover:bg-black/20 rounded"
                                title="Edit Settings"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, view.id)}
                                className="p-1 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`p-2 border-t flex gap-2 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <button 
                    onClick={() => { onCreateView(); setIsOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 11-2 0v-5h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New
                </button>
                <button 
                    onClick={() => { onDuplicateView(); setIsOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    Clone
                </button>
            </div>
        </div>
      )}
    </div>

    {viewToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[2000] p-4" onClick={() => setViewToDelete(null)}>
            <div 
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg shadow-2xl max-w-md w-full p-6`} 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">Delete View?</h3>
                <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Are you sure you want to delete the view <strong>"{viewToDelete.name}"</strong>?
                    <br/><br/>
                    This will only remove the view configuration. All nodes and relationships will remain available in the "Full Graph" and other views.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setViewToDelete(null)}
                        className={`px-4 py-2 rounded font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-sm"
                    >
                        Delete View
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
