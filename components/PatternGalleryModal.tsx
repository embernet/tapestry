
import React, { useRef, useEffect, useState } from 'react';
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
    readingTime: number; // New prop
}

const PatternCard: React.FC<PatternCardProps> = ({ pattern, isDarkMode, isActive, flipOverride, onRegister, readingTime }) => {
    const [isFlippedLocal, setIsFlippedLocal] = useState(false);
    const backRef = useRef<HTMLDivElement>(null); // Ref for the back face content
    
    // Use override if provided (for Explore mode), otherwise local state
    const isFlipped = flipOverride !== null ? flipOverride : isFlippedLocal;

    // Auto-scroll logic
    useEffect(() => {
        if (isActive && isFlipped && backRef.current && readingTime > 3000) {
            const el = backRef.current;
            
            // Reset to top initially
            el.scrollTop = 0;

            // Check if scrolling is needed
            if (el.scrollHeight > el.clientHeight) {
                const maxScroll = el.scrollHeight - el.clientHeight;
                const visibleHeight = el.clientHeight;
                
                // Calculate step size (1/3 of visible height)
                const stepSize = visibleHeight / 3;
                
                // Calculate how many steps needed to reach bottom
                const steps = Math.ceil(maxScroll / stepSize);
                
                if (steps > 0) {
                    const startBuffer = 1000; // Wait 1s before starting
                    const endBuffer = 2000;   // Leave 2s at the end
                    const availableTime = readingTime - startBuffer - endBuffer;
                    
                    // Ensure we have positive time
                    if (availableTime > 0) {
                        const intervalTime = availableTime / steps;
                        let currentStep = 0;

                        // Initial delay
                        const startTimeout = setTimeout(() => {
                            const scrollInterval = setInterval(() => {
                                currentStep++;
                                const targetScroll = Math.min(maxScroll, currentStep * stepSize);
                                
                                el.scrollTo({
                                    top: targetScroll,
                                    behavior: 'smooth'
                                });

                                if (currentStep >= steps) {
                                    clearInterval(scrollInterval);
                                }
                            }, intervalTime);
                        }, startBuffer);

                        return () => {
                            clearTimeout(startTimeout);
                        };
                    }
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
            className={`group h-80 w-72 [perspective:1000px] cursor-pointer transition-transform duration-500 flex-shrink-0 ${isActive ? 'scale-105' : ''}`}
            onClick={() => setIsFlippedLocal(!isFlippedLocal)}
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
                    <p className={`text-sm ${textDesc} leading-relaxed`}>{pattern.desc}</p>
                    
                    <div className={`mt-auto text-[10px] text-center uppercase tracking-widest font-bold opacity-50 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click to Flip</div>
                </div>

                {/* BACK FACE */}
                <div 
                    ref={backRef} // Attach ref for scrolling
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

export const PatternGalleryModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true }) => {
    // Window State
    const [windowSize, setWindowSize] = useState({ width: 1000, height: 700 });
    const [windowPos, setWindowPos] = useState({ x: 100, y: 208 }); // pt-52 equivalent (208px) to clear toolbar
    const [isMovingWindow, setIsMovingWindow] = useState(false);
    const [isResizingWindow, setIsResizingWindow] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialDimRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

    // Exploration State
    const [isExploring, setIsExploring] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [flipState, setFlipState] = useState<boolean | null>(null);
    const [currentReadingTime, setCurrentReadingTime] = useState(0);

    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set());

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
    
    const handleClose = () => {
        setIsExploring(false);
        onClose();
    };

    const getReadingTime = (pattern: any) => {
        const descText = pattern.desc || "";
        const examplesText = pattern.examples ? pattern.examples.join(" ") : "";
        const fullText = descText + " " + examplesText;
        const wordCount = fullText.split(/\s+/).length;
        // 0.6 seconds per word
        const time = wordCount * 600; 
        return Math.max(5000, time); // Minimum 5 seconds
    };

    useEffect(() => {
        if (!isExploring) return;

        let timer: any;
        
        const step = () => {
            const total = TAPESTRY_PATTERNS.length;
            const unvisited = Array.from({ length: total }, (_, i) => i).filter(i => !visitedIndices.has(i));
            
            if (unvisited.length === 0) {
                setIsExploring(false);
                setVisitedIndices(new Set());
                setActiveIndex(null);
                setFlipState(null);
                return;
            }

            // Pick next
            const nextIndex = unvisited[Math.floor(Math.random() * unvisited.length)];
            const pattern = TAPESTRY_PATTERNS[nextIndex];
            const readingTime = getReadingTime(pattern);
            
            setActiveIndex(nextIndex);
            setCurrentReadingTime(readingTime);
            setVisitedIndices(prev => new Set([...prev, nextIndex]));
            
            // Scroll
            const card = cardRefs.current[nextIndex];
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Sequence
            // 1. Wait 5s for scroll/focus/viewing the front
            timer = setTimeout(() => {
                setFlipState(true); // Flip Back
                
                // 2. Wait reading time (scrolls happen during this time inside component)
                timer = setTimeout(() => {
                    setFlipState(false); // Flip Front
                    
                    // 3. Wait 1s before next
                    timer = setTimeout(() => {
                        setFlipState(null);
                        step();
                    }, 1000);
                }, readingTime);
            }, 5000);
        };

        if (activeIndex === null) {
            step();
        }

        return () => clearTimeout(timer);
    }, [isExploring]);

    const startExploration = () => {
        setVisitedIndices(new Set());
        setIsExploring(true);
    };

    const stopExploration = () => {
        setIsExploring(false);
        setActiveIndex(null);
        setFlipState(null);
    };

    const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const headerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const textClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';

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
                        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pattern Gallery</h2>
                        <span className={`text-xs font-mono px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                            {TAPESTRY_PATTERNS.length} Patterns
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isExploring ? (
                            <button 
                                onClick={startExploration}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-lg hover:shadow-blue-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Auto-Explore
                            </button>
                        ) : (
                            <button 
                                onClick={stopExploration}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Stop
                            </button>
                        )}
                        <button onClick={handleClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    <div className="flex flex-wrap gap-6 justify-center">
                        {TAPESTRY_PATTERNS.map((pattern, idx) => (
                            <PatternCard 
                                key={idx} 
                                pattern={pattern} 
                                isDarkMode={isDarkMode}
                                isActive={idx === activeIndex}
                                flipOverride={idx === activeIndex && flipState !== null ? flipState : null}
                                onRegister={(el) => (cardRefs.current[idx] = el)}
                                readingTime={idx === activeIndex ? currentReadingTime : 0}
                            />
                        ))}
                    </div>
                    
                    <div className={`mt-12 text-center ${textClass} text-sm max-w-2xl mx-auto leading-relaxed border-t pt-8 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <p className="font-bold mb-2">Why Patterns?</p>
                        <p>
                            Complex systems often repeat the same structural motifs. Recognizing these patterns—like <strong>Feedback Loops</strong>, <strong>Critical Mass</strong>, or <strong>The Anchor</strong>—helps you diagnose problems faster and apply proven solutions from other domains.
                        </p>
                    </div>
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
