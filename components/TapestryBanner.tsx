
import React, { useState, useEffect } from 'react';

export const TapestryBanner = () => {
    const [activeBanner, setActiveBanner] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveBanner(prev => (prev + 1) % 10);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const commonTextProps = {
        x: "50%",
        y: "55%",
        dominantBaseline: "middle" as const,
        textAnchor: "middle" as const,
        fontSize: "65",
        fontFamily: "Impact, sans-serif",
        strokeWidth: "3",
        stroke: "#ffffff",
        letterSpacing: "4",
        filter: "url(#banner-shadow)"
    };

    return (
        <div className="relative w-[600px] h-[150px] overflow-hidden rounded-lg shadow-2xl border border-gray-700 bg-gray-900 group">
            
            {/* 0. The Weave (Original) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 0 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="warpPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#1f2937" />
                            <line x1="2" y1="0" x2="2" y2="8" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
                            <line x1="6" y1="0" x2="6" y2="8" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" />
                        </pattern>
                        <pattern id="weftPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#1f2937" />
                            <line x1="0" y1="2" x2="8" y2="2" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
                            <line x1="0" y1="6" x2="8" y2="6" stroke="#ec4899" strokeWidth="1.5" opacity="0.8" />
                        </pattern>
                        <pattern id="weaveComposite" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <rect width="16" height="16" fill="#111827" />
                            <path d="M4 0v16 M12 0v16" stroke="#14b8a6" strokeWidth="4" />
                            <path d="M0 4h16 M0 12h16" stroke="#ec4899" strokeWidth="4" strokeDasharray="4 4" />
                            <path d="M0 4h16 M0 12h16" stroke="#f97316" strokeWidth="4" strokeDasharray="0 4 4 0" strokeDashoffset="4" />
                        </pattern>
                        <filter id="banner-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                            <feOffset dx="2" dy="2" result="offsetblur"/>
                            <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
                            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>
                    <rect width="600" height="150" fill="url(#warpPattern)" opacity="0.3" />
                    <text {...commonTextProps} fill="url(#weaveComposite)">TAPESTRY STUDIO</text>
                    <rect width="600" height="150" fill="url(#weftPattern)" opacity="0.1" style={{ mixBlendMode: 'overlay' }} pointerEvents="none" />
                </svg>
            </div>

            {/* 1. Highland (New) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 1 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="highlandBg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="#022c22" />
                            <rect x="0" y="10" width="40" height="20" fill="#065f46" opacity="0.3" />
                            <rect x="10" y="0" width="20" height="40" fill="#1e3a8a" opacity="0.3" />
                            <line x1="0" y1="5" x2="40" y2="5" stroke="#b91c1c" strokeWidth="1" opacity="0.5" />
                            <line x1="0" y1="35" x2="40" y2="35" stroke="#b91c1c" strokeWidth="1" opacity="0.5" />
                            <line x1="5" y1="0" x2="5" y2="40" stroke="#b91c1c" strokeWidth="1" opacity="0.5" />
                            <line x1="35" y1="0" x2="35" y2="40" stroke="#b91c1c" strokeWidth="1" opacity="0.5" />
                        </pattern>
                        <pattern id="highlandText" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="20" height="20" fill="#064e3b" />
                            <circle cx="10" cy="10" r="2" fill="#047857" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="url(#highlandBg)" />
                    <text {...commonTextProps} fill="url(#highlandText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 2. The Circuit (Existing) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 2 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="circuitPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="#0f172a" />
                            <path d="M5 20h5v-10h10v10h10v-5h5" stroke="#0ea5e9" strokeWidth="2" fill="none" strokeLinecap="square" />
                            <path d="M0 5h40" stroke="#1e293b" strokeWidth="1" />
                            <path d="M0 35h40" stroke="#1e293b" strokeWidth="1" />
                            <circle cx="10" cy="10" r="2" fill="#0ea5e9" />
                            <circle cx="30" cy="30" r="2" fill="#eab308" />
                            <rect x="18" y="18" width="4" height="4" fill="#eab308" />
                        </pattern>
                        <pattern id="circuitText" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                             <rect width="60" height="60" fill="#020617" />
                             <path d="M10 30h10 l 5 -10 h 10 l 5 10 h 10" stroke="#22d3ee" strokeWidth="3" fill="none" />
                             <path d="M10 10v40" stroke="#0f766e" strokeWidth="1" />
                             <circle cx="35" cy="20" r="3" fill="#facc15" />
                             <rect x="15" y="35" width="6" height="6" stroke="#22d3ee" strokeWidth="2" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="#0f172a" />
                    <rect width="600" height="150" fill="url(#circuitPattern)" opacity="0.1" />
                    <text {...commonTextProps} fill="url(#circuitText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 3. Heritage (New) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 3 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="heritageBg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <rect width="60" height="60" fill="#450a0a" />
                            <rect x="0" y="0" width="30" height="30" fill="#172554" opacity="0.4" />
                            <rect x="30" y="30" width="30" height="30" fill="#172554" opacity="0.4" />
                            <path d="M0 0L60 60 M60 0L0 60" stroke="#000" strokeWidth="1" opacity="0.2" />
                        </pattern>
                        <pattern id="heritageText" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <rect width="10" height="10" fill="#7f1d1d" />
                            <rect x="0" y="0" width="5" height="5" fill="#991b1b" />
                            <rect x="5" y="5" width="5" height="5" fill="#991b1b" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="url(#heritageBg)" />
                    <text {...commonTextProps} fill="url(#heritageText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 4. Process Flow (Existing) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 4 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <marker id="arrowMini" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M0 0L10 5L0 10z" fill="#9ca3af" />
                        </marker>
                        <pattern id="processPattern" x="0" y="0" width="50" height="30" patternUnits="userSpaceOnUse">
                            <rect width="50" height="30" fill="#1f2937" />
                            <rect x="5" y="10" width="8" height="8" rx="1" fill="#ef4444" opacity="0.8" />
                            <path d="M14 14h5" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrowMini)" />
                            <rect x="20" y="5" width="8" height="8" rx="1" fill="#22c55e" opacity="0.8" />
                            <path d="M28 9l3 3" stroke="#6b7280" strokeWidth="1" />
                            <rect x="35" y="12" width="8" height="8" rx="1" fill="#3b82f6" opacity="0.8" />
                        </pattern>
                        <pattern id="processText" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="#111827" />
                            <rect x="2" y="2" width="10" height="10" rx="2" fill="#f97316" />
                            <path d="M12 7h6" stroke="#fff" strokeWidth="2" />
                            <rect x="20" y="2" width="10" height="10" rx="2" fill="#8b5cf6" />
                            <path d="M30 7h6" stroke="#fff" strokeWidth="2" />
                            <rect x="2" y="22" width="10" height="10" rx="2" fill="#10b981" />
                            <path d="M12 27h6" stroke="#fff" strokeWidth="2" />
                            <rect x="20" y="22" width="10" height="10" rx="2" fill="#ef4444" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="#1f2937" />
                    <rect width="600" height="150" fill="url(#processPattern)" opacity="0.2" />
                    <text {...commonTextProps} fill="url(#processText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 5. Autumn (New) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 5 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="autumnBg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="#431407" />
                            <path d="M0 40L40 0" stroke="#92400e" strokeWidth="10" opacity="0.3" />
                            <path d="M-20 20L20 -20" stroke="#92400e" strokeWidth="10" opacity="0.3" />
                            <path d="M20 60L60 20" stroke="#92400e" strokeWidth="10" opacity="0.3" />
                            <path d="M0 0L40 40" stroke="#78350f" strokeWidth="2" opacity="0.5" />
                        </pattern>
                        <pattern id="autumnText" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <rect width="10" height="10" fill="#78350f" />
                            <path d="M0 10L10 0" stroke="#b45309" strokeWidth="2" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="url(#autumnBg)" />
                    <text {...commonTextProps} fill="url(#autumnText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 6. Constellation (Existing) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 6 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="starPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <rect width="60" height="60" fill="#020617" />
                            <circle cx="10" cy="10" r="1" fill="white" opacity="0.8" />
                            <circle cx="40" cy="50" r="1" fill="white" opacity="0.6" />
                            <circle cx="50" cy="10" r="1" fill="white" opacity="0.7" />
                            <path d="M10 10 L40 50 M10 10 L50 10" stroke="white" strokeWidth="0.5" opacity="0.2" />
                        </pattern>
                        <pattern id="constellationText" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                            <rect width="80" height="80" fill="#0f172a" />
                            <circle cx="20" cy="20" r="3" fill="#facc15" filter="url(#glow)" />
                            <circle cx="60" cy="30" r="2" fill="#fff" />
                            <circle cx="30" cy="60" r="2" fill="#fff" />
                            <path d="M20 20 L60 30 L30 60 Z" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.8" />
                        </pattern>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>
                    <rect width="600" height="150" fill="url(#starPattern)" opacity="0.5" />
                    <text {...commonTextProps} fill="url(#constellationText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 7. Loom (New) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 7 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="loomBg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="#374151" />
                            <rect x="0" y="0" width="20" height="20" fill="#4b5563" />
                            <rect x="20" y="20" width="20" height="20" fill="#4b5563" />
                            <line x1="0" y1="0" x2="40" y2="0" stroke="#1f2937" strokeWidth="1" />
                            <line x1="0" y1="20" x2="40" y2="20" stroke="#1f2937" strokeWidth="1" />
                            <line x1="20" y1="0" x2="20" y2="40" stroke="#1f2937" strokeWidth="1" />
                        </pattern>
                        <pattern id="loomText" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <rect width="10" height="10" fill="#1f2937" />
                            <rect x="2" y="2" width="6" height="6" fill="#4b5563" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="url(#loomBg)" />
                    <text {...commonTextProps} fill="url(#loomText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 8. DNA (Existing) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 8 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="dnaBg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                             <rect width="20" height="20" fill="#111827" />
                             <circle cx="10" cy="10" r="0.5" fill="#4b5563" />
                        </pattern>
                        <pattern id="dnaText" x="0" y="0" width="30" height="60" patternUnits="userSpaceOnUse">
                            <rect width="30" height="60" fill="#1f2937" />
                            <path d="M5 0 Q 15 15 5 30 T 5 60" stroke="#ec4899" strokeWidth="3" fill="none" />
                            <path d="M25 0 Q 15 15 25 30 T 25 60" stroke="#8b5cf6" strokeWidth="3" fill="none" />
                            <line x1="5" y1="5" x2="25" y2="5" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="10" y1="15" x2="20" y2="15" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="5" y1="25" x2="25" y2="25" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="5" y1="35" x2="25" y2="35" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="10" y1="45" x2="20" y2="45" stroke="#9ca3af" strokeWidth="1.5" />
                            <line x1="5" y1="55" x2="25" y2="55" stroke="#9ca3af" strokeWidth="1.5" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="url(#dnaBg)" />
                    <text {...commonTextProps} fill="url(#dnaText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

            {/* 9. Canvas (New) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeBanner === 9 ? 'opacity-100' : 'opacity-0'}`}>
                <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="canvasBg" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#312e81" />
                            <path d="M0 0L8 8 M8 0L0 8" stroke="#4338ca" strokeWidth="0.5" />
                        </pattern>
                        <pattern id="canvasText" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                            <rect width="4" height="4" fill="#3730a3" />
                            <circle cx="2" cy="2" r="1" fill="#6366f1" />
                        </pattern>
                    </defs>
                    <rect width="600" height="150" fill="url(#canvasBg)" />
                    <text {...commonTextProps} fill="url(#canvasText)">TAPESTRY STUDIO</text>
                </svg>
            </div>

        </div>
    );
};
