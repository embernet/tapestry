
import React, { useState } from 'react';
import { KanbanBoard } from '../types';

interface KanbanToolbarProps {
    boards: KanbanBoard[];
    activeBoardId: string | null;
    onSelectBoard: (boardId: string) => void;
    onCreateBoard: (name: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
    onOpenKanbanPanel: () => void;
    isDarkMode: boolean;
}

const KanbanToolbar: React.FC<KanbanToolbarProps> = ({
    boards, activeBoardId, onSelectBoard, onCreateBoard, isCollapsed, onToggle, onOpenKanbanPanel, isDarkMode
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');

    const handleCreate = () => {
        if (newBoardName.trim()) {
            onCreateBoard(newBoardName.trim());
            setIsCreating(false);
            setNewBoardName('');
        }
    };

    const bgClass = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
    const textClass = isDarkMode ? 'text-gray-200' : 'text-gray-700';
    const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

    return (
        <div className="relative">
            <div className={`w-20 h-20 rounded-lg border shadow-lg overflow-hidden ${bgClass}`}>
                <button
                    onClick={onToggle}
                    className={`w-full h-full flex flex-col items-center justify-center gap-1 ${hoverClass}`}
                    title="Kanban Boards"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                    <span className={`text-[10px] font-bold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>BOARDS</span>
                </button>
            </div>

            {!isCollapsed && (
                <div className={`absolute top-[calc(100%+0.5rem)] left-0 w-64 border shadow-xl rounded-lg overflow-hidden z-[600] ${bgClass}`}>
                    <div className="p-3 flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <label className={`text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Select Board</label>
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    onClick={() => { onSelectBoard(board.id); onOpenKanbanPanel(); onToggle(); }}
                                    className={`flex items-center justify-between px-3 py-2 rounded text-sm ${activeBoardId === board.id ? (isDarkMode ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700' : 'bg-indigo-50 text-indigo-700 border border-indigo-200') : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}
                                >
                                    <span className="truncate">{board.name}</span>
                                    {activeBoardId === board.id && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            {isCreating ? (
                                <div className="flex flex-col gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        className={`w-full px-2 py-1.5 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        placeholder="Board Name"
                                        value={newBoardName}
                                        onChange={e => setNewBoardName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsCreating(false)} className={`text-xs ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Cancel</button>
                                        <button onClick={handleCreate} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">Create</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className={`w-full py-2 rounded border border-dashed text-sm flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    New Board
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanToolbar;
