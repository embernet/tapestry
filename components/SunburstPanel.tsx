
import React, { useEffect } from 'react';

interface SunburstPanelProps {
  centerNodeName: string | null;
  hops: number;
  visibleCount: number;
  onHopsChange: (newHops: number) => void;
  onRestart: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const SunburstPanel: React.FC<SunburstPanelProps> = ({
  centerNodeName,
  hops,
  visibleCount,
  onHopsChange,
  onRestart,
  onReset,
  onClose
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent interference if user is typing in an input elsewhere (unlikely here but good practice)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            onHopsChange(hops + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            onHopsChange(Math.max(0, hops - 1));
        } else if (/^\d$/.test(e.key)) {
            onHopsChange(parseInt(e.key, 10));
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hops, onHopsChange]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
        <h2 className="text-lg font-bold text-orange-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Sunburst
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 items-center justify-center flex-grow text-center overflow-y-auto">
        {!centerNodeName ? (
            <div className="animate-pulse text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="font-semibold">Click any node on the canvas</p>
                <p className="text-sm mt-1">to set it as the center of the sunburst.</p>
            </div>
        ) : (
            <>
                <div className="w-full">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Center Node</div>
                    <div className="text-xl font-bold text-white bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 truncate shadow-lg">
                        {centerNodeName}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Degree of Separation</div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onHopsChange(Math.max(0, hops - 1))}
                            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center transition-transform active:scale-95 border border-gray-600"
                            disabled={hops <= 0}
                            title="Less Detail (Left/Down Arrow)"
                        >
                            -
                        </button>
                        <div className="flex flex-col items-center w-20">
                            <span className="text-3xl font-black text-orange-400">{hops}</span>
                            <span className="text-[10px] text-gray-400 uppercase">Hops</span>
                        </div>
                        <button 
                            onClick={() => onHopsChange(hops + 1)}
                            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center transition-transform active:scale-95 border border-gray-600"
                            title="More Detail (Right/Up Arrow)"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full">
                    Showing <strong>{visibleCount}</strong> connected nodes
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-2 pt-4 border-t border-gray-700">
                    <button 
                        onClick={onReset}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-4 rounded transition-colors"
                    >
                        Reset to Center
                    </button>
                    <button 
                        onClick={onRestart}
                        className="bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded transition-colors"
                    >
                        Pick New Center
                    </button>
                </div>

                {/* Shortcuts Info Panel */}
                <div className="w-full mt-2 bg-gray-900/40 rounded border border-gray-700/50 p-3 text-left">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-700/50 pb-1">
                        Keyboard Shortcuts
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-400">
                        <div className="flex justify-between">
                            <span className="font-mono text-gray-500">↑ / →</span>
                            <span>Increase Hops</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-mono text-gray-500">↓ / ←</span>
                            <span>Decrease Hops</span>
                        </div>
                        <div className="flex justify-between col-span-2 mt-1 pt-1 border-t border-gray-700/30">
                            <span className="font-mono text-gray-500">0 - 9</span>
                            <span>Jump to Level</span>
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
