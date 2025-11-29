
import React from 'react';

interface ScamperToolbarProps {
  selectedElementId: string | null;
  onScamper: (operator: string, label: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
}

const SCAMPER_OPS = [
  { letter: 'S', name: 'Substitute', description: 'Replace parts, materials, or people.', color: '#06b6d4' },
  { letter: 'C', name: 'Combine', description: 'Merge functions, units, or ideas.', color: '#3b82f6' },
  { letter: 'A', name: 'Adapt', description: 'Adjust to new contexts or purposes.', color: '#8b5cf6' },
  { letter: 'M', name: 'Modify', description: 'Change shape, scale, or attributes.', color: '#d946ef' },
  { letter: 'P', name: 'Put to another use', description: 'Repurpose for different problems.', color: '#ef4444' },
  { letter: 'E', name: 'Eliminate', description: 'Remove non-essentials or waste.', color: '#f97316' },
  { letter: 'R', name: 'Reverse', description: 'Invert processes or rearrange.', color: '#22c55e' },
];

const ScamperToolbar: React.FC<ScamperToolbarProps> = ({
  selectedElementId,
  onScamper,
  isCollapsed,
  onToggle,
  onOpenSettings,
  isDarkMode
}) => {

  const handleOpClick = (op: typeof SCAMPER_OPS[0]) => {
      if (!selectedElementId) {
          alert("Please select a node first to apply SCAMPER.");
          return;
      }
      onScamper(op.name, op.letter);
  };

  const bgClass = isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-200';
  const dropdownBg = isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200';
  const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const itemHover = isDarkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-100';
  const textMain = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textHeader = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textItem = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const textDesc = isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700';

  return (
    <div className="relative pointer-events-auto">
        {/* Collapse Toggle / Main Button */}
        <div className="relative">
            <button 
                onClick={onToggle}
                className={`h-20 w-20 border shadow-lg rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${!isCollapsed ? 'ring-2 ring-cyan-500' : ''}`}
                title={isCollapsed ? "Expand SCAMPER Tool" : "Close SCAMPER Tool"}
            >
                <div className="flex items-end gap-0.5 h-8">
                    {SCAMPER_OPS.map(op => (
                        <div key={op.letter} className="w-1.5 rounded-t-sm" style={{ backgroundColor: op.color, height: '100%' }}></div>
                    ))}
                </div>
                <span className={`text-xs font-bold tracking-wider ${textMain}`}>SCAMPER</span>
            </button>
        </div>

        {!isCollapsed && (
            <div className={`absolute top-full left-0 mt-2 w-72 border rounded-lg shadow-2xl z-50 flex flex-col max-h-[60vh] overflow-y-auto animate-fade-in-down scrollbar-thin scrollbar-thumb-gray-600 ${dropdownBg}`}>
                 <div className={`p-2 border-b flex justify-between items-center sticky top-0 z-10 ${headerBg}`}>
                     <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${textHeader}`}>
                        {selectedElementId ? "Generate Ideas" : "Select Node"}
                     </span>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
                        className={`transition-colors p-1 rounded ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
                        title="SCAMPER Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                 </div>
                 
                 {SCAMPER_OPS.map(op => (
                     <button
                        key={op.letter}
                        onClick={() => handleOpClick(op)}
                        disabled={!selectedElementId}
                        className={`flex items-start text-left p-3 border-b last:border-0 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed ${itemHover}`}
                     >
                         <div className="w-2 self-stretch rounded-sm mr-3 flex-shrink-0" style={{ backgroundColor: op.color }}></div>
                         <div>
                             <div className="flex items-center gap-2 mb-0.5">
                                 <span className="font-black text-lg leading-none w-5" style={{ color: op.color }}>{op.letter}</span>
                                 <span className={`font-bold text-sm ${textItem}`}>{op.name}</span>
                             </div>
                             <p className={`text-xs leading-tight ${textDesc}`}>
                                 {op.description}
                             </p>
                         </div>
                     </button>
                 ))}
            </div>
        )}
    </div>
  );
};

export default ScamperToolbar;
