import React from 'react';

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