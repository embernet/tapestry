
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TAPESTRY_PATTERNS } from './PatternAssets';

interface ModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

interface PatternCardProps {
    pattern: any;
    isDarkMode: boolean;
    isActive: boolean;
    flipOverride: boolean | null;
    onRegister: (el: HTMLDivElement | null) => void;
    readingTime: number; // For auto-scroll calculation
    onClick: () => void;
}

const PatternCard: React.FC<PatternCardProps> = ({ pattern, isDarkMode, isActive, flipOverride, onRegister, readingTime, onClick }) => {
    const [isFlippedLocal, setIsFlippedLocal] = useState(false);
    const backRef = useRef<HTMLDivElement>(null);
    
    // Use override if provided (for Explore mode), otherwise local state
    const isFlipped = flipOverride !== null ? flipOverride : isFlippedLocal;

    // Reset local flip if override changes to null (cleanup after auto-explore passes)
    useEffect(() => {
        if (flipOverride === null) {
            setIsFlippedLocal(false);
        }
    }, [flipOverride]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (flipOverride === null) {
            // Normal behavior
            setIsFlippedLocal(!isFlippedLocal);
        }
        // Notify parent (for auto-explore interruption)
        onClick();
    };

    // Auto-scroll logic
    useEffect(() => {
        if (isActive && isFlipped && backRef.current && readingTime > 2000) {
            const el = backRef.current;
            
            // Reset to top
            el.scrollTop = 0;

            if (el.scrollHeight > el.clientHeight) {
                const maxScroll = el.scrollHeight - el.clientHeight;
                const stepSize = 1; // Smoother 1px steps
                const totalDistance = maxScroll;
                
                // Calculate speed to fit within reading time
                // We reserve 500ms at start and 1000ms at end static
                const availableTime = readingTime - 1500;
                
                if (availableTime > 0 && totalDistance > 0) {
                    const stepTime = availableTime / totalDistance;
                    
                    const startTimeout = setTimeout(() => {
                        let currentScroll = 0;
                        const scrollInterval = setInterval(() => {
                            currentScroll += stepSize;
                            if (currentScroll >= maxScroll) {
                                currentScroll = maxScroll;
                                clearInterval(scrollInterval);
                            }
                            el.scrollTop = currentScroll;
                        }, stepTime);
                        
                        return () => clearInterval(scrollInterval);
                    }, 500);

                    return () => clearTimeout(startTimeout);
                }
            }
        }
    }, [isActive, isFlipped, readingTime]);

    const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm';
    const textDesc = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const svgContainerBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300';
    const flipClass = isFlipped ? '[transform:rotateY(180deg)]' : '';
    
    const activeClass = isActive 
        ? 'ring-4 ring-yellow-400 ring-opacity-70 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] scale-105 z-10' 
        : 'hover:border-blue-500';

    return (
        <div 
            ref={onRegister}
            className={`group h-80 w-full [perspective:1000px] cursor-pointer transition-transform duration-500 flex-shrink-0 ${isActive ? 'scale-105' : ''}`}
            onClick={handleClick}
        >
            <div className={`relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] ${flipClass}`}>
                
                {/* FRONT FACE */}
                <div className={`absolute inset-0 h-full w-full [backface-visibility:hidden] ${cardBg} border rounded-lg p-4 flex flex-col transition-all duration-300 ${activeClass}`}>
                    <div className={`h-32 w-full mb-4 rounded flex items-center justify-center overflow-hidden border ${svgContainerBg} flex-shrink-0`}>
                        <div className="w-16 h-16 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                            {pattern.svg}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-blue-400 mb-2">{pattern.name}</h3>
                    <p className={`text-sm ${textDesc} leading-relaxed line-clamp-3`}>{pattern.desc}</p>
                    
                    <div className={`mt-auto text-[10px] text-center uppercase tracking-widest font-bold opacity-50 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click to Flip</div>
                </div>

                {/* BACK FACE */}
                <div 
                    ref={backRef}
                    className={`absolute inset-0 h-full w-full [transform:rotateY(180deg)] [backface-visibility:hidden] ${cardBg} border rounded-lg p-4 flex flex-col overflow-y-auto custom-scrollbar ${activeClass}`}
                >
                    <div className="flex items-start gap-4 mb-4 flex-shrink-0">
                        <div className={`w-12 h-12 shrink-0 rounded flex items-center justify-center border ${svgContainerBg}`}>
                            <div className="w-8 h-8">{pattern.svg}</div>
                        </div>
                        <div className="flex items-center">
                             <h3 className="text-lg font-bold text-blue-400 leading-tight">{pattern.name}</h3>
                        </div>
                    </div>
                    
                    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-3 flex-grow`}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Applied Examples</h4>
                        <ul className={`space-y-3 text-xs ${textDesc}`}>
                            {pattern.examples && pattern.examples.map((ex: string, i: number) => (
                                <li key={i} className="leading-relaxed">
                                    <span className={`font-bold block mb-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {ex.split(':')[0]}
                                    </span>
                                    {ex.split(':').slice(1).join(':')}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Intro Card Component ---
const IntroCard: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm';
    const textHeader = isDarkMode ? 'text-white' : 'text-gray-900';
    const textDesc = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const highlightBorder = isDarkMode ? 'border-blue-500/50' : 'border-blue-400';
    const highlightText = isDarkMode ? 'text-gray-300' : 'text-gray-700';

    return (
        <div className={`col-span-full ${cardBg} border rounded-lg p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start shadow-lg`}>
            <div className="flex-1 space-y-4">
                <h3 className={`text-2xl font-bold ${textHeader} tracking-tight`}>The Architecture of Thought</h3>
                <p className={`text-sm leading-relaxed ${textDesc}`}>
                    Creativity arises when ideas clash and form structure that drives cognition. Blank pages present challenges because they contain no stimulus.
                </p>
                <div className={`pl-4 border-l-4 ${highlightBorder} italic text-sm ${highlightText}`}>
                    <p>
                        Patterns, ideas, structure, axes of change, tensions, conflicts of interest, goals, risks, and understanding of the nuances of trade-offs demand and drive creativity as a psychological imperative.
                    </p>
                </div>
                <p className={`text-sm ${textDesc}`}>
                     Seek the edges, the boundaries, the differences, find people with other perspectives and engage in dialogue. Creativity will flow like a river.
                </p>
            </div>
            <div className={`hidden md:flex w-1/3 flex-col justify-center items-center opacity-80 self-stretch border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pl-6`}>
                 <div className="w-24 h-24 text-blue-500 mb-4">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                     </svg>
                 </div>
                 <span className={`text-xs uppercase tracking-widest font-bold ${textDesc}`}>System Patterns</span>
            </div>
        </div>
    );
};

// --- Shared View Component ---

interface PatternGalleryViewProps {
    isDarkMode: boolean;
}

export const PatternGalleryView: React.FC<PatternGalleryViewProps> = ({ 
    isDarkMode
}) => {
    // Exploration State
    const [isExploring, setIsExploring] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [flipState, setFlipState] = useState<boolean | null>(null);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);

    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    // Use Ref for visited set to avoid dependency cycles in useCallback
    const visitedIndicesRef = useRef<Set<number>>(new Set());
    
    // Timer refs
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    const getReadingTime = (pattern: any) => {
        const descText = pattern.desc || "";
        const examplesText = pattern.examples ? pattern.examples.join(" ") : "";
        const fullText = descText + " " + examplesText;
        const wordCount = fullText.split(/\s+/).length;
        
        // 200ms per word = approx 300 WPM reading speed (fairly brisk)
        const time = (wordCount * 200) / speedMultiplier; 
        
        // Clamp time: Min 2s, Max 12s to ensure it doesn't get "stuck" on long cards
        return Math.max(2000 / speedMultiplier, Math.min(time, 12000 / speedMultiplier)); 
    };

    const pickNext = useCallback(() => {
        if (!isExploring) return;

        const total = TAPESTRY_PATTERNS.length;
        let unvisited = Array.from({ length: total }, (_, i) => i).filter(i => !visitedIndicesRef.current.has(i));
        
        // Reset if all visited
        if (unvisited.length === 0) {
            unvisited = Array.from({ length: total }, (_, i) => i);
            visitedIndicesRef.current.clear();
        }

        // Pick random next
        const nextIndex = unvisited[Math.floor(Math.random() * unvisited.length)];
        
        visitedIndicesRef.current.add(nextIndex);
        setActiveIndex(nextIndex);
    }, [isExploring]);

    const runSequence = useCallback((index: number) => {
        // Clear any pending ops from previous sequence
        clearTimers();

        const pattern = TAPESTRY_PATTERNS[index];
        const readingTime = getReadingTime(pattern);
        
        // Scroll to card
        const card = cardRefs.current[index];
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Sequence
        // 1. Initial Gaze (Wait before flip - 2.5s base)
        const t1 = setTimeout(() => {
            setFlipState(true); // Flip Back
            
            // 2. Reading Time (Wait while reading the back)
            const t2 = setTimeout(() => {
                setFlipState(false); // Flip Front
                
                // 3. Post-Read Pause (Wait 1s before moving to next)
                const t3 = setTimeout(() => {
                    setFlipState(null); // Reset override state
                    pickNext(); // Trigger next card
                }, 1000 / speedMultiplier);
                
                timersRef.current.push(t3);

            }, readingTime);
            
            timersRef.current.push(t2);

        }, 2500 / speedMultiplier); 
        
        timersRef.current.push(t1);
    }, [pickNext, speedMultiplier]);

    // Effect to trigger sequence when activeIndex changes during exploration
    // We do NOT depend on runSequence here to avoid loops if runSequence is unstable,
    // though useCallback makes it stable. Ideally this is fine.
    useEffect(() => {
        if (isExploring && activeIndex !== null) {
            runSequence(activeIndex);
        }
    }, [activeIndex, isExploring, runSequence]);

    // Effect: Bootstrap exploration (Handle start button click)
    // Only runs when isExploring turns true and we haven't started yet
    useEffect(() => {
        if (isExploring && activeIndex === null) {
            pickNext();
        }
    }, [isExploring, activeIndex, pickNext]);

    const startExploration = () => {
        visitedIndicesRef.current.clear();
        setActiveIndex(null); // Ensure we trigger the start effect
        setIsExploring(true);
    };

    const stopExploration = () => {
        clearTimers();
        setIsExploring(false);
        setActiveIndex(null);
        setFlipState(null);
        setSpeedMultiplier(1);
    };

    const handleCardClick = (index: number) => {
        if (isExploring) {
            // Interrupt current flow
            clearTimers();
            
            // Reset state of currently active card instantly
            setFlipState(null);
            
            // Update visited state manually
            visitedIndicesRef.current.add(index);

            // Allow a brief tick for the reset to render, then start new sequence
            setTimeout(() => {
                setActiveIndex(index);
            }, 50);
        } else {
             // Just highlight if not exploring
             setActiveIndex(index);
        }
    };

    const handleSpeedChange = (delta: number) => {
        setSpeedMultiplier(prev => Math.max(0.25, Math.min(5, prev + delta)));
    };

    const textHeader = isDarkMode ? 'text-white' : 'text-gray-900';
    const toolbarBg = isDarkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-200';
    
    return (
        <div className="flex flex-col h-full overflow-hidden">
            
            {/* Sticky Toolbar */}
            <div className={`sticky top-0 z-30 backdrop-blur-md border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 ${toolbarBg}`}>
                <div className="flex items-center gap-4">
                    <h4 className={`text-2xl font-bold ${textHeader}`}>Patterns</h4>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        {TAPESTRY_PATTERNS.length} Patterns
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {!isExploring ? (
                        <button 
                            onClick={startExploration}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Auto-Explore
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-800 rounded-full p-1 border border-gray-700">
                             <button 
                                onClick={() => handleSpeedChange(-0.25)}
                                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                title="Slower"
                                disabled={speedMultiplier <= 0.25}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-xs font-mono w-12 text-center text-blue-400">{speedMultiplier.toFixed(2)}x</span>
                            <button 
                                onClick={() => handleSpeedChange(0.25)}
                                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                title="Faster"
                                disabled={speedMultiplier >= 5}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <div className="w-px h-6 bg-gray-700 mx-1"></div>
                            <button 
                                onClick={stopExploration}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Stop
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Gallery Content */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    {/* Architecture of Thought Intro Card - Spans full width */}
                    <IntroCard isDarkMode={isDarkMode} />
                    
                    {/* Pattern Cards */}
                    {TAPESTRY_PATTERNS.map((pattern, idx) => (
                        <div key={idx} className="flex justify-center">
                            <PatternCard 
                                pattern={pattern} 
                                isDarkMode={isDarkMode}
                                isActive={idx === activeIndex}
                                flipOverride={idx === activeIndex && flipState !== null ? flipState : null}
                                onRegister={(el) => (cardRefs.current[idx] = el)}
                                readingTime={idx === activeIndex ? getReadingTime(pattern) : 0} 
                                onClick={() => handleCardClick(idx)}
                            />
                        </div>
                    ))}
                </div>
                
                <div className={`mt-16 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-sm max-w-2xl mx-auto`}>
                    <p>
                        Pattern recognition is the first step to systems thinking. Use these cards to prompt new ways of seeing your graph.
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- Main Modal Wrapper ---

export const PatternGalleryModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true }) => {
    // Window State
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
    const [windowPos, setWindowPos] = useState({ x: 50, y: 100 }); 
    const [isMovingWindow, setIsMovingWindow] = useState(false);
    const [isResizingWindow, setIsResizingWindow] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialDimRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

    // Handle Window Move
    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsMovingWindow(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialDimRef.current = { ...windowSize, ...windowPos };
    };

    // Handle Window Resize
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizingWindow(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialDimRef.current = { ...windowSize, ...windowPos };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isMovingWindow) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setWindowPos({
                    x: initialDimRef.current.x + dx,
                    y: initialDimRef.current.y + dy
                });
            }
            if (isResizingWindow) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setWindowSize({
                    width: Math.max(600, initialDimRef.current.width + dx),
                    height: Math.max(400, initialDimRef.current.height + dy)
                });
            }
        };
        const handleMouseUp = () => {
            setIsMovingWindow(false);
            setIsResizingWindow(false);
        };
        if (isMovingWindow || isResizingWindow) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMovingWindow, isResizingWindow]);
    
    const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const headerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';

    return (
        <div className="fixed inset-0 pointer-events-none z-[1200]">
            <div 
                className={`absolute flex flex-col rounded-lg border ${bgClass} shadow-2xl pointer-events-auto overflow-hidden`}
                style={{ 
                    width: windowSize.width, 
                    height: windowSize.height,
                    left: windowPos.x,
                    top: windowPos.y
                }}
            >
                <div 
                    className={`p-4 border-b flex justify-between items-center ${headerClass} flex-shrink-0 cursor-move select-none`}
                    onMouseDown={handleHeaderMouseDown}
                >
                    <div className="flex items-center gap-4">
                        <h2 className={`text-lg font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pattern Gallery</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col">
                    <PatternGalleryView isDarkMode={isDarkMode} />
                </div>

                {/* Resize Handle */}
                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-50"
                    onMouseDown={handleResizeMouseDown}
                >
                    <svg viewBox="0 0 10 10" className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <path d="M10 10 L10 2 L2 10 Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
