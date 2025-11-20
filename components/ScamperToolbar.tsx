
import React from 'react';

interface ScamperToolbarProps {
  selectedElementId: string | null;
  onScamper: (operator: string, label: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const SCAMPER_OPS = [
  { letter: 'S', name: 'Substitute', color: '#06b6d4' }, // Cyan
  { letter: 'C', name: 'Combine', color: '#3b82f6' },    // Blue
  { letter: 'A', name: 'Adapt', color: '#8b5cf6' },      // Violet
  { letter: 'M', name: 'Modify', color: '#d946ef' },     // Fuchsia
  { letter: 'P', name: 'Put to use', color: '#ef4444' }, // Red
  { letter: 'E', name: 'Eliminate', color: '#f97316' },  // Orange
  { letter: 'R', name: 'Reverse', color: '#22c55e' },    // Green
];

const ScamperToolbar: React.FC<ScamperToolbarProps> = ({
  selectedElementId,
  onScamper,
  isCollapsed,
  onToggle,
}) => {

  const handleOpClick = (op: typeof SCAMPER_OPS[0]) => {
      if (!selectedElementId) {
          alert("Please select a node first to apply SCAMPER.");
          return;
      }
      onScamper(op.name, op.letter);
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none transition-all duration-300">
      <div className="flex items-stretch gap-0 bg-gray-800 bg-opacity-90 rounded-lg border border-gray-600 shadow-lg pointer-events-auto overflow-hidden">
        {/* Collapse Toggle */}
        <button 
            onClick={onToggle}
            className="bg-gray-700 hover:bg-gray-600 border-r border-gray-600 w-20 flex flex-col items-center justify-center transition-colors h-20 flex-shrink-0 gap-1"
            title={isCollapsed ? "Expand SCAMPER Tool" : "Collapse SCAMPER Tool"}
        >
            <div className="flex items-end gap-0.5 h-8">
                {SCAMPER_OPS.map(op => (
                    <div key={op.letter} className="w-1.5 rounded-t-sm" style={{ backgroundColor: op.color, height: '100%' }}></div>
                ))}
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-300">SCAMPER</span>
        </button>

        {!isCollapsed && (
            <div className="flex items-center p-3 animate-fade-in bg-gray-800 h-20 gap-1">
                 {SCAMPER_OPS.map(op => (
                     <button
                        key={op.letter}
                        onClick={() => handleOpClick(op)}
                        className="flex flex-col h-full w-10 items-center justify-end group transition-transform hover:scale-105 hover:-translate-y-1 relative"
                        title={`${op.letter} - ${op.name}`}
                     >
                         <div className="text-[10px] font-bold text-gray-400 mb-1 group-hover:text-white">{op.letter}</div>
                         <div 
                            className="w-full rounded-md transition-all group-hover:brightness-110 shadow-md" 
                            style={{ backgroundColor: op.color, height: '60%' }}
                         ></div>
                     </button>
                 ))}
                 <div className="ml-2 pl-2 border-l border-gray-600 h-12 flex flex-col justify-center">
                     <span className="text-[9px] text-gray-500 uppercase font-bold w-16 leading-tight">
                        {selectedElementId ? "Ready to Generate" : "Select a Node"}
                     </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ScamperToolbar;
