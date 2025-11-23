
import React, { useState, useEffect, useRef } from 'react';
import { ModelMetadata } from '../types';
import { TAGLINES } from '../constants';

// --- Patterns Data ---
export const TAPESTRY_PATTERNS = [
    {
        name: "The Weave",
        desc: "When shifting trends intersect with human emotion, the fabric of culture is woven.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M8 4V28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 4V28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M24 4V28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M4 8H28" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
                <path d="M4 16H28" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
                <path d="M4 24H28" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
            </svg>
        )
    },
    {
        name: "Highland",
        desc: "Traditional interlocking threads creating a sturdy, timeless foundation.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#022c22" rx="4" />
                <rect x="0" y="8" width="32" height="4" fill="#065f46" opacity="0.5" />
                <rect x="0" y="20" width="32" height="4" fill="#065f46" opacity="0.5" />
                <rect x="8" y="0" width="4" height="32" fill="#1e40af" opacity="0.5" />
                <rect x="20" y="0" width="4" height="32" fill="#1e40af" opacity="0.5" />
                <path d="M0 16H32 M16 0V32" stroke="#b91c1c" strokeWidth="0.5" opacity="0.8" />
            </svg>
        )
    },
    {
        name: "The Circuit",
        desc: "Information flows through logical gates, connecting distinct nodes into a unified system.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#111827" rx="4" />
                <path d="M6 16H10 M22 16H26 M16 6V10 M16 22V26" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="16" cy="16" r="6" stroke="#3b82f6" strokeWidth="2" />
                <rect x="4" y="14" width="4" height="4" fill="#3b82f6" />
                <rect x="24" y="14" width="4" height="4" fill="#3b82f6" />
                <circle cx="16" cy="8" r="2" fill="#3b82f6" />
                <circle cx="16" cy="24" r="2" fill="#3b82f6" />
            </svg>
        )
    },
    {
        name: "Heritage",
        desc: "A classic check pattern representing order and history.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#450a0a" rx="4" />
                <rect x="0" y="0" width="16" height="16" fill="#172554" opacity="0.4" />
                <rect x="16" y="16" width="16" height="16" fill="#172554" opacity="0.4" />
                <path d="M0 0L32 32" stroke="#000" strokeWidth="0.5" opacity="0.2" />
            </svg>
        )
    },
    {
        name: "The Process",
        desc: "Structured steps connected in a logical flow, driving efficiency and clarity.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <rect x="4" y="12" width="6" height="8" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <rect x="14" y="12" width="6" height="8" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <rect x="24" y="12" width="4" height="8" stroke="#3b82f6" strokeWidth="2" fill="none" />
                <path d="M10 16H14" stroke="#60a5fa" strokeWidth="1.5" markerEnd="url(#arrow-sm)" />
                <path d="M20 16H24" stroke="#60a5fa" strokeWidth="1.5" markerEnd="url(#arrow-sm)" />
            </svg>
        )
    },
    {
        name: "Autumn",
        desc: "Interwoven warmth creating a durable, textured fabric.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#431407" rx="4" />
                <path d="M-4 36L36 -4" stroke="#92400e" strokeWidth="4" opacity="0.5" />
                <path d="M4 36L36 4" stroke="#92400e" strokeWidth="4" opacity="0.5" />
                <path d="M-8 20L20 -8" stroke="#d97706" strokeWidth="2" opacity="0.4" />
            </svg>
        )
    },
    {
        name: "The Constellation",
        desc: "Stars aligned in the vast darkness, mapping myths onto the chaos of the night sky.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0f172a" rx="4" />
                <path d="M6 24L12 18L20 20L26 8" stroke="#e2e8f0" strokeWidth="1" opacity="0.6" />
                <circle cx="6" cy="24" r="2" fill="#f1f5f9" />
                <circle cx="12" cy="18" r="1.5" fill="#f1f5f9" />
                <circle cx="20" cy="20" r="1.5" fill="#f1f5f9" />
                <circle cx="26" cy="8" r="2.5" fill="#f1f5f9" />
            </svg>
        )
    },
    {
        name: "Loom",
        desc: "A complex grey-scale weave symbolizing industrial precision.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#374151" rx="4" />
                <rect x="4" y="4" width="10" height="10" fill="#6b7280" />
                <rect x="18" y="18" width="10" height="10" fill="#6b7280" />
                <rect x="18" y="4" width="10" height="10" fill="#4b5563" />
                <rect x="4" y="18" width="10" height="10" fill="#4b5563" />
            </svg>
        )
    },
    {
        name: "The Helix",
        desc: "The fundamental building blocks of life twist together in an eternal dance of evolution.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M10 4Q22 10 22 16T10 28" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                <path d="M22 4Q10 10 10 16T22 28" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                <line x1="12" y1="7" x2="20" y2="7" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                <line x1="12" y1="25" x2="20" y2="25" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
            </svg>
        )
    },
    {
        name: "Canvas",
        desc: "A tight, subdued mesh providing structure for creativity.",
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#312e81" rx="4" />
                <path d="M0 0L32 32 M32 0L0 32" stroke="#4f46e5" strokeWidth="0.5" opacity="0.5" />
                <path d="M16 0V32 M0 16H32" stroke="#4f46e5" strokeWidth="0.5" opacity="0.5" />
            </svg>
        )
    }
];

// --- Components ---

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
        fontSize: "110",
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
                    <text {...commonTextProps} fill="url(#weaveComposite)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#highlandText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#circuitText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#heritageText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#processText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#autumnText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#constellationText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#loomText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#dnaText)">TAPESTRY</text>
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
                    <text {...commonTextProps} fill="url(#canvasText)">TAPESTRY</text>
                </svg>
            </div>

        </div>
    );
};

export const TapestryAnimator = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TAPESTRY_PATTERNS.length);
    }, 4000); // 4 seconds
    return () => clearInterval(timer);
  }, []);

  const currentPattern = TAPESTRY_PATTERNS[index];

  return (
    <div className="w-20 h-20 relative flex items-center justify-center bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg" title={currentPattern.name}>
      <div className="w-full h-full p-2 opacity-80 transition-all duration-1000 ease-in-out key={index}">
         {currentPattern.svg}
      </div>
    </div>
  );
};

export const TextAnimator = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  // blink cursor
  useEffect(() => {
    if (index >= TAGLINES.length) {
        setIndex(0);
        return;
    }

    if (subIndex === TAGLINES[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % TAGLINES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 30 : 60);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <span className="inline-block min-h-[1.5em]">
      {TAGLINES[index % TAGLINES.length].substring(0, subIndex)}
      <span className="animate-pulse border-r-2 border-blue-400 ml-1">&nbsp;</span>
    </span>
  );
};

interface ModalProps {
  onClose: () => void;
  children?: React.ReactNode;
}

export const AboutModal: React.FC<ModalProps> = ({ onClose }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] shadow-2xl border border-gray-700 flex flex-col relative overflow-hidden">
                
                {/* Close X Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <div className="flex items-center gap-6 mb-8">
                        <div className="shrink-0">
                            <TapestryAnimator />
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold text-white tracking-tight">Tapestry</h2>
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Visual Knowledge Graph</p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                        Tapestry is a tool for creating and exploring knowledge graphs. It helps you understand the relationships between ideas, people, organisations, and actions to find ways to improve situations and plan what to do next. It is a space for reflection, communication, and innovation.
                    </p>

                    <div className="border-t border-gray-700 my-6"></div>

                    {/* Creator */}
                    <p className="text-gray-400 mb-4 font-medium">Created by Mark Burnett</p>

                    {/* Social Links */}
                    <div className="flex gap-6 mb-8">
                        <a href="https://www.linkedin.com/in/markburnett" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                             <svg className="w-6 h-6 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                            </svg>
                            <span>LinkedIn</span>
                        </a>
                        <a href="https://github.com/embernet/tapestry" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                            <svg className="w-6 h-6 group-hover:text-gray-100 transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            <span>GitHub</span>
                        </a>
                    </div>

                    {/* License */}
                    <div className="bg-gray-900 p-4 rounded border border-gray-700 text-xs text-gray-500 font-mono leading-relaxed">
                        <p className="font-bold text-gray-400 mb-2">MIT License</p>
                        <p className="mb-2">Copyright (c) 2025 Mark Burnett</p>
                        <p className="mb-4">
                            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                        </p>
                        <p className="mb-4">
                            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                        </p>
                        <p>
                            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PatternGalleryModal: React.FC<ModalProps> = ({ onClose }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className="bg-gray-900 rounded-lg max-w-5xl w-full h-[80vh] p-0 shadow-2xl border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-lg">
                    <h2 className="text-xl font-bold text-white">System Patterns Gallery</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TAPESTRY_PATTERNS.map((pattern, idx) => (
                            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group">
                                <div className="h-32 w-full mb-4 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
                                    <div className="w-16 h-16 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                                        {pattern.svg}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-blue-400 mb-2">{pattern.name}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{pattern.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const HelpMenu: React.FC<ModalProps & { onAbout: () => void, onPatternGallery: () => void }> = ({ onClose, onAbout, onPatternGallery }) => {
     return (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
            <button onClick={() => { onPatternGallery(); onClose(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Pattern Gallery</button>
            <button onClick={() => { onAbout(); onClose(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">About Tapestry</button>
            <div className="border-t border-gray-700 my-1"></div>
            <a href="https://github.com/embernet/tapestry" target="_blank" rel="noopener noreferrer" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Documentation</a>
        </div>
     );
};

export const ConflictResolutionModal: React.FC<{ 
    localMetadata: ModelMetadata, 
    diskMetadata: ModelMetadata, 
    localData: any, 
    diskData: any,
    onCancel: () => void, 
    onChooseLocal: () => void, 
    onChooseDisk: () => void 
}> = ({ localMetadata, diskMetadata, onCancel, onChooseLocal, onChooseDisk }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
             <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-red-500/50 text-white">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Version Conflict Detected</h2>
                <p className="text-gray-300 mb-6">
                    The file you are importing has a different version history than the one currently in your browser storage.
                    This usually happens if you edited the file on another device or browser.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <h3 className="font-bold text-blue-400 mb-2">Local Browser Version</h3>
                        <p className="text-sm text-gray-400">Updated: {new Date(localMetadata.updatedAt).toLocaleString()}</p>
                    </div>
                     <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <h3 className="font-bold text-green-400 mb-2">File / Disk Version</h3>
                        <p className="text-sm text-gray-400">Updated: {new Date(diskMetadata.updatedAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700 text-gray-300">Cancel Import</button>
                    <button onClick={onChooseLocal} className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white">Keep Browser Version</button>
                    <button onClick={onChooseDisk} className="px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white">Overwrite with File</button>
                </div>
             </div>
        </div>
    );
}

export const ContextMenu: React.FC<{ x: number, y: number, onClose: () => void, onAddRelationship: () => void, onDeleteElement: () => void }> = ({ x, y, onClose, onAddRelationship, onDeleteElement }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Prevent going off screen
    const style = {
        top: Math.min(y, window.innerHeight - 100),
        left: Math.min(x, window.innerWidth - 150)
    };

    return (
        <div ref={ref} className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 w-48" style={style}>
            <button onClick={onAddRelationship} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white">Add Connection...</button>
            <div className="border-t border-gray-700 my-1"></div>
            <button onClick={onDeleteElement} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-red-200">Delete Node</button>
        </div>
    );
}

export const CanvasContextMenu: React.FC<{ 
    x: number, y: number, onClose: () => void, 
    onZoomToFit: () => void, onAutoLayout: () => void,
    onToggleReport: () => void, onToggleMarkdown: () => void, onToggleJSON: () => void, 
    onToggleFilter: () => void, onToggleMatrix: () => void, onToggleTable: () => void, onToggleGrid: () => void,
    onOpenModel: () => void, onSaveModel: () => void, onCreateModel: () => void, onSaveAs: () => void,
    isReportOpen: boolean, isMarkdownOpen: boolean, isJSONOpen: boolean, isFilterOpen: boolean, isMatrixOpen: boolean, isTableOpen: boolean, isGridOpen: boolean
}> = (props) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) props.onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [props]);

    const style = {
        top: Math.min(props.y, window.innerHeight - 300),
        left: Math.min(props.x, window.innerWidth - 200)
    };

    return (
        <div ref={ref} className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 w-56" style={style}>
            <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase">View</div>
            <button onClick={props.onZoomToFit} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Zoom to Fit</button>
            <button onClick={props.onAutoLayout} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Auto Layout</button>
            
            <div className="border-t border-gray-700 my-1"></div>
            <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase">Panels</div>
            
            <button onClick={props.onToggleReport} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Report</span> {props.isReportOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleTable} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Table</span> {props.isTableOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleMatrix} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Matrix</span> {props.isMatrixOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleGrid} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Grid</span> {props.isGridOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleMarkdown} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>Markdown</span> {props.isMarkdownOpen && <span className="text-blue-400">✓</span>}
            </button>
            <button onClick={props.onToggleJSON} className="flex justify-between w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700">
                <span>JSON</span> {props.isJSONOpen && <span className="text-blue-400">✓</span>}
            </button>

             <div className="border-t border-gray-700 my-1"></div>
            <div className="px-4 py-1 text-xs font-bold text-gray-500 uppercase">File</div>
            <button onClick={props.onSaveModel} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Save to Disk</button>
            <button onClick={props.onSaveAs} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Save As...</button>
            <button onClick={props.onOpenModel} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Open Model...</button>
             <button onClick={props.onCreateModel} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">New Model...</button>
        </div>
    );
}

export const CreateModelModal: React.FC<{ onCreate: (name: string, desc: string) => void, onClose: () => void, isInitialSetup: boolean }> = ({ onCreate, onClose, isInitialSetup }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            onCreate(name, desc);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-600 text-white">
                <h2 className="text-2xl font-bold mb-6">{isInitialSetup ? 'Welcome to Tapestry' : 'Create New Model'}</h2>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Model Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="My Knowledge Graph"
                            autoFocus
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
                        <textarea 
                            value={desc} 
                            onChange={e => setDesc(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            placeholder="What is this model about?"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    {!isInitialSetup && <button onClick={onClose} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700">Cancel</button>}
                    <button 
                        onClick={() => onCreate(name, desc)} 
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded bg-green-600 hover:bg-green-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Model
                    </button>
                </div>
            </div>
        </div>
    );
}

export const SaveAsModal: React.FC<{ 
    currentName: string, 
    currentDesc: string, 
    onSave: (name: string, desc: string) => void, 
    onClose: () => void 
}> = ({ currentName, currentDesc, onSave, onClose }) => {
    const [name, setName] = useState(`Copy of ${currentName}`);
    const [desc, setDesc] = useState(currentDesc);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            onSave(name, desc);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-600 text-white">
                <h2 className="text-2xl font-bold mb-6">Save As...</h2>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Model Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
                        <textarea 
                            value={desc} 
                            onChange={e => setDesc(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700">Cancel</button>
                    <button 
                        onClick={() => onSave(name, desc)} 
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Copy
                    </button>
                </div>
            </div>
        </div>
    );
}

export const OpenModelModal: React.FC<{ models: ModelMetadata[], onLoad: (id: string) => void, onClose: () => void, onTriggerCreate: () => void }> = ({ models, onLoad, onClose, onTriggerCreate }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-gray-600 text-white h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Open Model</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                
                <div className="flex-grow overflow-y-auto mb-6 space-y-2">
                    {models.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            <p className="mb-4">No models found in browser storage.</p>
                            <button onClick={onTriggerCreate} className="text-blue-400 underline">Create a new model</button>
                        </div>
                    ) : (
                        models.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => onLoad(m.id)}
                                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 group transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{m.name}</h3>
                                    <span className="text-xs text-gray-400">{new Date(m.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1 truncate">{m.description || "No description"}</p>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button onClick={onTriggerCreate} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold">Create New</button>
                </div>
            </div>
        </div>
    );
}

export const SchemaUpdateModal: React.FC<{ changes: string[], onClose: () => void }> = ({ changes, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-2xl border border-blue-500/50 text-white flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-blue-400">Schema Updates Applied</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                    The following standard schemas in your model were updated to match the latest system definitions:
                </p>
                <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-60 overflow-y-auto mb-6 text-xs font-mono text-gray-300">
                    <ul className="list-disc list-inside space-y-1">
                        {changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-colors">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
