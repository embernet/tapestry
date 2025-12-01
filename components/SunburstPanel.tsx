
import React, { useEffect } from 'react';

interface SunburstPanelProps {
  centerNodeName: string | null;
  hops: number;
  visibleCount: number;
  maxHops?: number;
  onHopsChange: (newHops: number) => void;
  onRestart: () => void;
  onReset: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}

export const SunburstPanel: React.FC<SunburstPanelProps> = ({
  centerNodeName,
  hops,
  visibleCount,
  maxHops,
  onHopsChange,
  onRestart,
  onReset,
  onClose,
  isDarkMode
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent interference if user is typing in an input elsewhere
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            if (maxHops === undefined || hops < maxHops) {
                onHopsChange(hops + 1);
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            onHopsChange(Math.max(0, hops - 1));
        } else if (/^\d$/.test(e.key)) {
            const val = parseInt(e.key, 10);
            if (maxHops === undefined || val <= maxHops) {
                onHopsChange(val);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hops, onHopsChange, maxHops]);

  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const headerBgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200';
  const titleColor = isDarkMode ? 'text-orange-400' : 'text-orange-600';
  const closeBtnColor = isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black';
  const emptyStateColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const labelColor = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const centerNodeClass = isDarkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300 shadow-sm';
  const controlBtnClass = isDarkMode 
    ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm';
  const hopsCountColor = isDarkMode ? 'text-orange-400' : 'text-orange-600';
  const badgeClass = isDarkMode ? 'text-gray-400 bg-gray-900/50' : 'text-gray-600 bg-gray-100 border border-gray-200';
  const footerBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  
  const resetBtnClass = isDarkMode 
    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm';
    
  const pickBtnClass = isDarkMode 
    ? 'bg-orange-700 hover:bg-orange-600 text-white' 
    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm';

  const shortcutsBg = isDarkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-gray-50 border-gray-200';
  const shortcutTitleBorder = isDarkMode ? 'border-gray-700/50' : 'border-gray-200';
  const shortcutKeyColor = isDarkMode ? 'text-gray-500' : 'text-gray-400';
  const shortcutDescColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`w-full h-full flex flex-col ${bgClass}`}>
      <div className={`p-4 border-b flex justify-between items-center ${headerBgClass}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${titleColor}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Sunburst
        </h2>
        <button onClick={onClose} className={closeBtnColor}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 items-center justify-center flex-grow text-center overflow-y-auto">
        {!centerNodeName ? (
            <div className={`animate-pulse ${emptyStateColor}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="font-semibold">Click any node on the canvas</p>
                <p className="text-sm mt-1">to set it as the center of the sunburst.</p>
            </div>
        ) : (
            <>
                <div className="w-full">
                    <div className={`text-xs uppercase font-bold tracking-wider mb-2 ${labelColor}`}>Center Node</div>
                    <div className={`text-xl font-bold px-4 py-2 rounded-lg border truncate shadow-lg ${centerNodeClass}`}>
                        {centerNodeName}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                    <div className={`text-xs uppercase font-bold tracking-wider ${labelColor}`}>Degree of Separation</div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onHopsChange(Math.max(0, hops - 1))}
                            className={`w-10 h-10 rounded-full font-bold text-xl flex items-center justify-center transition-transform active:scale-95 border ${controlBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={hops <= 0}
                            title="Less Detail (Left/Down Arrow)"
                        >
                            -
                        </button>
                        <div className="flex flex-col items-center w-20">
                            <span className={`text-3xl font-black ${hopsCountColor}`}>{hops}</span>
                            <span className={`text-[10px] uppercase ${labelColor}`}>Hops</span>
                        </div>
                        <button 
                            onClick={() => onHopsChange(hops + 1)}
                            className={`w-10 h-10 rounded-full font-bold text-xl flex items-center justify-center transition-transform active:scale-95 border ${controlBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={maxHops !== undefined && hops >= maxHops ? "Max depth reached" : "More Detail (Right/Up Arrow)"}
                            disabled={maxHops !== undefined && hops >= maxHops}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className={`text-sm px-3 py-1 rounded-full ${badgeClass}`}>
                    Showing <strong>{visibleCount}</strong> connected nodes
                </div>

                <div className={`grid grid-cols-2 gap-3 w-full mt-2 pt-4 border-t ${footerBorder}`}>
                    <button 
                        onClick={onReset}
                        className={`text-xs font-bold py-2 px-4 rounded transition-colors ${resetBtnClass}`}
                    >
                        Reset to Center
                    </button>
                    <button 
                        onClick={onRestart}
                        className={`text-xs font-bold py-2 px-4 rounded transition-colors ${pickBtnClass}`}
                    >
                        Pick New Center
                    </button>
                </div>

                {/* Shortcuts Info Panel */}
                <div className={`w-full mt-2 rounded border p-3 text-left ${shortcutsBg}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 border-b pb-1 ${labelColor} ${shortcutTitleBorder}`}>
                        Keyboard Shortcuts
                    </div>
                    <div className={`grid grid-cols-2 gap-x-2 gap-y-1 text-xs ${shortcutDescColor}`}>
                        <div className="flex justify-between">
                            <span className={`font-mono ${shortcutKeyColor}`}>↑ / →</span>
                            <span>Increase Hops</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={`font-mono ${shortcutKeyColor}`}>↓ / ←</span>
                            <span>Decrease Hops</span>
                        </div>
                        <div className={`flex justify-between col-span-2 mt-1 pt-1 border-t ${shortcutTitleBorder}`}>
                            <span className={`font-mono ${shortcutKeyColor}`}>0 - 9</span>
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
