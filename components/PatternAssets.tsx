
import React from 'react';

export const TAPESTRY_PATTERNS = [
    {
        name: "The Weave",
        desc: "When shifting trends intersect with human emotion, the fabric of culture is woven.",
        examples: [
            "Sociology: Multicultural societies where distinct traditions blend into a unified, resilient culture.",
            "Business: Cross-functional teams (e.g. Engineering + Design) integrating to break down silos.",
            "Textiles: The physical interlocking of warp and weft threads to create fabric."
        ],
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
        examples: [
            "Architecture: Grid-based city planning (e.g., Barcelona's Eixample) creating resilient urban flow.",
            "Engineering: Reinforced concrete where steel mesh provides tensile strength to the cement.",
            "Law: Common law systems building upon past precedents to create a stable legal framework."
        ],
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
        examples: [
            "Software Development: Microservices communicating via APIs to form a complex application.",
            "Economics: Global supply chains connecting raw material extraction to end consumers.",
            "Neuroscience: Neural pathways forming circuits to process sensory information."
        ],
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
        examples: [
            "Organisational Design: Establishing strong corporate values based on founding history to guide future decisions.",
            "Urban Planning: Preserving historic districts to maintain cultural identity within a modern city.",
            "Education: Curriculums that build upon classical foundations before introducing modern theories."
        ],
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
        examples: [
            "Manufacturing: Assembly lines optimizing efficiency by sequencing discrete tasks.",
            "Public Policy: Bureaucratic procedures designed to ensure fairness and repeatability.",
            "Software Development: CI/CD pipelines automating the journey from code commit to deployment."
        ],
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
        examples: [
            "Agriculture: Crop rotation cycles allowing soil to rest and regenerate.",
            "Psychology: The acceptance of loss and change as necessary precursors to new growth.",
            "Economics: Market corrections that clear out inefficiencies to allow for healthy recovery."
        ],
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
        examples: [
            "Marketing: Brand ecosystems where distinct products reinforce a central narrative identity.",
            "Data Science: Clustering algorithms finding meaningful patterns in seemingly random data sets.",
            "Sociology: Social networks where loose ties connect distant groups."
        ],
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
        examples: [
            "Transportation: Integrated transport networks weaving rail, bus, and cycle routes.",
            "Education: Interdisciplinary curriculums that weave arts and sciences together.",
            "Manufacturing: Supply chain logistics ensuring parts arrive exactly when needed (JIT)."
        ],
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
        examples: [
            "Product Development: Iterative design cycles (build-measure-learn) that evolve a product.",
            "Biology: DNA replication ensuring continuity while allowing for mutation.",
            "History: The dialectical process (Thesis-Antithesis-Synthesis) driving societal change."
        ],
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
        examples: [
            "Software: Platform-as-a-Service (PaaS) providing the infrastructure for others to build apps.",
            "Urban Planning: Zoning laws that provide a framework for diverse architectural expression.",
            "Creative Industries: Open-source software allowing community modification."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#312e81" rx="4" />
                <path d="M0 0L32 32 M32 0L0 32" stroke="#4f46e5" strokeWidth="0.5" opacity="0.5" />
                <path d="M16 0V32 M0 16H32" stroke="#4f46e5" strokeWidth="0.5" opacity="0.5" />
            </svg>
        )
    },
    {
        name: "The Patchwork",
        desc: "Distinct modules stitched together to form a cohesive whole.",
        examples: [
            "Technology: Microservices architecture where independent services form a single app.",
            "Logistics: Container shipping standardising the movement of diverse goods.",
            "Society: Federal systems where states retain identity while forming a nation."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#292524" rx="4" />
                <rect x="4" y="4" width="12" height="12" fill="#f87171" />
                <rect x="16" y="4" width="12" height="12" fill="#fbbf24" />
                <rect x="4" y="16" width="12" height="12" fill="#60a5fa" />
                <rect x="16" y="16" width="12" height="12" fill="#34d399" />
                <path d="M16 4V28 M4 16H28" stroke="#44403c" strokeWidth="2" strokeDasharray="2 2" />
            </svg>
        )
    },
    {
        name: "The Knot",
        desc: "A point of convergence that binds disparate threads together.",
        examples: [
            "Transport: Hub-and-spoke logistics networks (e.g. FedEx in Memphis).",
            "Politics: Centralized governance binding different regions.",
            "Nature: Nerve ganglions concentrating signals."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#4a044e" rx="4" />
                <path d="M4 4 C 12 12, 20 12, 28 4" stroke="#e879f9" strokeWidth="2" />
                <path d="M4 28 C 12 20, 20 20, 28 28" stroke="#e879f9" strokeWidth="2" />
                <circle cx="16" cy="16" r="5" stroke="#d946ef" strokeWidth="3" fill="#86198f" />
            </svg>
        )
    },
    {
        name: "The Shuttle",
        desc: "An agent that moves back and forth to weave structure.",
        examples: [
            "Computing: Data buses transferring information between CPU and memory.",
            "Biology: Motor proteins transporting cargo along microtubules.",
            "Commerce: Trade routes connecting distant markets."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0f172a" rx="4" />
                <line x1="8" y1="4" x2="8" y2="28" stroke="#334155" strokeWidth="1" />
                <line x1="16" y1="4" x2="16" y2="28" stroke="#334155" strokeWidth="1" />
                <line x1="24" y1="4" x2="24" y2="28" stroke="#334155" strokeWidth="1" />
                <path d="M4 16h24" stroke="#38bdf8" strokeWidth="2" />
                <path d="M22 16l-4-3v6z" fill="#38bdf8" />
            </svg>
        )
    },
    {
        name: "The Seam",
        desc: "The visible join where two distinct planes meet and reinforce.",
        examples: [
            "Geology: Plate tectonics creating mountain ranges at collision points.",
            "Innovation: The 'adjacent possible' where two fields collide (e.g. Bio-Tech).",
            "Diplomacy: Treaties binding nations at their borders."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1e293b" rx="4" />
                <rect x="4" y="4" width="10" height="24" fill="#334155" />
                <rect x="18" y="4" width="10" height="24" fill="#475569" />
                <path d="M14 6l4 4l-4 4l4 4l-4 4l4 4" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        name: "The Fringe",
        desc: "The loose ends at the edge where innovation happens.",
        examples: [
            "Evolution: Adaptive radiation occurring at the edges of ecosystems.",
            "Culture: Counter-culture movements influencing the mainstream.",
            "Physics: Quantum effects visible only at extremes."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#022c22" rx="4" />
                <rect x="4" y="4" width="24" height="16" fill="#047857" />
                <line x1="6" y1="20" x2="6" y2="28" stroke="#34d399" strokeWidth="2" />
                <line x1="11" y1="20" x2="11" y2="26" stroke="#34d399" strokeWidth="2" />
                <line x1="16" y1="20" x2="16" y2="28" stroke="#34d399" strokeWidth="2" />
                <line x1="21" y1="20" x2="21" y2="25" stroke="#34d399" strokeWidth="2" />
                <line x1="26" y1="20" x2="26" y2="28" stroke="#34d399" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Spindle",
        desc: "Cyclical winding of energy or resources.",
        examples: [
            "Economics: The business cycle of boom and bust.",
            "Nature: The water cycle recycling finite resources.",
            "History: The rise and fall of empires."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#172554" rx="4" />
                <path d="M16 16 m -8 0 a 8 8 0 1 1 16 0 a 8 8 0 1 1 -16 0" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M16 16 m -5 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0" stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.6" />
                <path d="M16 16 m -2 0 a 2 2 0 1 1 4 0 a 2 2 0 1 1 -4 0" stroke="#60a5fa" strokeWidth="3" />
            </svg>
        )
    },
    {
        name: "The Warp",
        desc: "The tension that holds the structure together.",
        examples: [
            "Architecture: Tensegrity structures where tension maintains integrity.",
            "Politics: The balance of power preventing tyranny (Checks and Balances).",
            "Economics: Supply vs Demand maintaining price stability."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#451a03" rx="4" />
                <line x1="8" y1="2" x2="8" y2="30" stroke="#f97316" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="30" stroke="#f97316" strokeWidth="2" />
                <line x1="24" y1="2" x2="24" y2="30" stroke="#f97316" strokeWidth="2" />
                <circle cx="8" cy="28" r="2" fill="#fdba74" />
                <circle cx="16" cy="28" r="2" fill="#fdba74" />
                <circle cx="24" cy="28" r="2" fill="#fdba74" />
            </svg>
        )
    },
    {
        name: "The Dye",
        desc: "Transformation through absorption or influence.",
        examples: [
            "Marketing: Branding that colours public perception.",
            "Chemistry: Catalysts changing the rate of reaction.",
            "Culture: Soft power influencing global norms."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#be185d" rx="4" />
                <defs>
                    <linearGradient id="dyeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0" />
                        <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="32" height="32" fill="url(#dyeGrad)" />
                <path d="M4 4h24v4h-24z" fill="#fff" fillOpacity="0.1" />
            </svg>
        )
    },
    {
        name: "The Net",
        desc: "Interconnected nodes creating a resilient catch-all.",
        examples: [
            "Technology: The Internet (distributed resilience).",
            "Biology: Mycelial networks connecting forests.",
            "Society: Social safety nets protecting the vulnerable."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0c4a6e" rx="4" />
                <path d="M0 8 L32 24 M32 8 L0 24" stroke="#38bdf8" strokeWidth="1" />
                <circle cx="16" cy="16" r="2" fill="#7dd3fc" />
                <circle cx="8" cy="12" r="1.5" fill="#0ea5e9" />
                <circle cx="24" cy="12" r="1.5" fill="#0ea5e9" />
                <circle cx="8" cy="20" r="1.5" fill="#0ea5e9" />
                <circle cx="24" cy="20" r="1.5" fill="#0ea5e9" />
            </svg>
        )
    },
    {
        name: "The Pleat",
        desc: "Folding space to increase capacity or flexibility.",
        examples: [
            "Biology: The surface area of the lungs or brain.",
            "Engineering: Crumple zones in cars absorbing energy.",
            "Data: Compression algorithms storing more in less space."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#374151" rx="4" />
                <path d="M4 4 L8 28 L12 4 L16 28 L20 4 L24 28 L28 4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        name: "The Bias",
        desc: "Cutting against the grain to gain flexibility.",
        examples: [
            "Business: Agile methodology valuing response to change over following a plan.",
            "Biology: Evolution favoring adaptability over rigidity.",
            "Economics: Elastic pricing responding to demand."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#111827" rx="4" />
                <path d="M8 4V28 M16 4V28 M24 4V28" stroke="#374151" strokeWidth="1" />
                <path d="M4 8H28 M4 16H28 M4 24H28" stroke="#374151" strokeWidth="1" />
                <path d="M4 20 L20 4" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Selvage",
        desc: "A reinforced edge protecting the system from unravelling.",
        examples: [
            "Biology: Cell membranes regulating input/output.",
            "Politics: National borders defining jurisdiction.",
            "Engineering: Firewalls protecting a network."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#581c87" rx="4" />
                <rect x="4" y="4" width="24" height="24" fill="#6b21a8" opacity="0.5" />
                <rect x="0" y="0" width="4" height="32" fill="#c084fc" />
                <path d="M2 2v28" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
        )
    },
    {
        name: "The Nap",
        desc: "Directional texture that facilitates flow one way and resists the other.",
        examples: [
            "Technology: Diode logic (one-way current).",
            "Biology: Vein valves ensuring blood flows to the heart.",
            "Business: Sales funnels guiding customers to purchase."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#134e4a" rx="4" />
                <path d="M4 10L8 6M12 10L16 6M20 10L24 6" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 18L8 14M12 18L16 14M20 18L24 14" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 26L8 22M12 26L16 22M20 26L24 22" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Brocade",
        desc: "Complex, specialized patterns floating over a sturdy base structure.",
        examples: [
            "Software: Application layers running on top of an OS kernel.",
            "Cities: Cultural districts thriving on top of utility infrastructure.",
            "Ecology: Specialized species niches within a biome."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#7f1d1d" rx="4" />
                <path d="M0 0L32 32 M32 0L0 32" stroke="#991b1b" strokeWidth="1" />
                <circle cx="16" cy="16" r="8" fill="none" stroke="#fca5a5" strokeWidth="2" />
                <path d="M16 8L20 16L16 24L12 16Z" fill="#fecaca" />
            </svg>
        )
    },
    {
        name: "The Felt",
        desc: "Compression of chaotic elements into a unified material.",
        examples: [
            "Data Science: Aggregating millions of data points into a trend line.",
            "Physics: Gas pressure emerging from random molecule movement.",
            "Sociology: Public opinion forming from millions of individual voices."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#3f3f46" rx="4" />
                <path d="M4 8l4 4m-2-6l6 2m-1 8l-5-3" stroke="#a1a1aa" strokeWidth="1" />
                <path d="M20 20l-4 6m8-2l-6-4m2-4l3 5" stroke="#a1a1aa" strokeWidth="1" />
                <path d="M12 12l8 8m-8 0l8-8" stroke="#d4d4d8" strokeWidth="1" opacity="0.5" />
            </svg>
        )
    },
    {
        name: "The Quilt",
        desc: "Stitching together distinct histories into a larger narrative.",
        examples: [
            "History: Nation building by uniting diverse tribes or states.",
            "Law: Common law built from centuries of distinct case judgments.",
            "Art: Films that weave separate storylines into a conclusion (e.g., Pulp Fiction)."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <rect x="4" y="4" width="12" height="12" fill="#60a5fa" />
                <path d="M4 4L16 16M16 4L4 16" stroke="#1d4ed8" strokeWidth="1" />
                <rect x="16" y="4" width="12" height="12" fill="#f87171" />
                <circle cx="22" cy="10" r="3" fill="#b91c1c" />
                <rect x="4" y="16" width="12" height="12" fill="#facc15" />
                <rect x="16" y="16" width="12" height="12" fill="#34d399" />
            </svg>
        )
    },
    {
        name: "The Unravel",
        desc: "The breakdown of structure into chaos or raw material.",
        examples: [
            "Physics: Entropy and the heat death of the universe.",
            "Economics: Market crashes where trust evaporates.",
            "Biology: Decomposition returning nutrients to the soil."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#000000" rx="4" />
                <path d="M8 4V16 M16 4V16 M24 4V16" stroke="#9ca3af" strokeWidth="2" />
                <path d="M8 20Q12 24 6 28 M16 20Q20 26 14 30 M24 20Q28 24 30 18" stroke="#9ca3af" strokeWidth="1.5" />
            </svg>
        )
    },
    {
        name: "The Bobbin",
        desc: "Potential energy wound tightly, waiting to be deployed.",
        examples: [
            "Physics: Potential energy in a spring or battery.",
            "Finance: Capital reserves saved for a strategic acquisition.",
            "Education: Knowledge learned but not yet applied."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#451a03" rx="4" />
                <rect x="10" y="6" width="12" height="20" fill="#d97706" rx="2" />
                <path d="M10 10H22 M10 14H22 M10 18H22 M10 22H22" stroke="#fcd34d" strokeWidth="1" />
                <line x1="16" y1="2" x2="16" y2="30" stroke="#78350f" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Interlace",
        desc: "Complex dependencies where elements pass over and under each other.",
        examples: [
            "Ecology: Food webs where species have multiple predator/prey roles.",
            "Project Management: Critical paths with multiple dependencies.",
            "Software: Spaghetti code or circular dependencies."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1e1b4b" rx="4" />
                <path d="M8 4V28" stroke="#818cf8" strokeWidth="4" />
                <path d="M24 4V28" stroke="#818cf8" strokeWidth="4" />
                <path d="M4 16H28" stroke="#c7d2fe" strokeWidth="4" />
                <rect x="6" y="14" width="4" height="4" fill="#1e1b4b" />
                <rect x="22" y="14" width="4" height="4" fill="#1e1b4b" />
            </svg>
        )
    },
    {
        name: "Equilibrium",
        desc: "Forces in balance. Stability achieved through opposing tensions.",
        examples: [
            "Economics: Supply and demand finding a market clearing price.",
            "Ecology: Predator-prey relationships stabilizing populations.",
            "Political Science: Separation of powers (Checks and Balances) in government."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#111827" rx="4" />
                <path d="M4 16H28" stroke="#9ca3af" strokeWidth="1" />
                <circle cx="16" cy="16" r="4" stroke="#3b82f6" strokeWidth="2" />
                <rect x="6" y="12" width="8" height="8" stroke="#ef4444" strokeWidth="2" fill="none" />
                <rect x="18" y="12" width="8" height="8" stroke="#22c55e" strokeWidth="2" fill="none" />
            </svg>
        )
    },
    {
        name: "The Catalyst",
        desc: "A small spark that accelerates reaction without being consumed.",
        examples: [
            "Social Change: A single activist or event sparking a nationwide movement.",
            "Chemistry: Enzymes speeding up metabolic reactions essential for life.",
            "Business: A 'Loss Leader' product that drives traffic to a store."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <circle cx="16" cy="16" r="10" stroke="#4b5563" strokeWidth="2" strokeDasharray="4 2" />
                <path d="M16 8L18 14H24L19 18L21 24L16 20L11 24L13 18L8 14H14L16 8Z" fill="#fbbf24" />
            </svg>
        )
    },
    {
        name: "Fractal",
        desc: "Self-similarity at different scales. Recursion and infinite depth.",
        examples: [
            "Nature: Coastlines or fern leaves repeating patterns at every scale.",
            "Organisational Design: Holacratic circles where small teams mirror the structure of the larger org.",
            "Economics: Market price fluctuations looking similar on hourly and yearly charts."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0f172a" rx="4" />
                <path d="M16 4L28 28H4L16 4Z" stroke="#a855f7" strokeWidth="1.5" />
                <path d="M16 10L22 22H10L16 10Z" stroke="#d8b4fe" strokeWidth="1" />
                <path d="M16 13L19 19H13L16 13Z" fill="#e9d5ff" />
            </svg>
        )
    },
    {
        name: "Entropy",
        desc: "The inevitable drift from order to disorder. Randomness increasing.",
        examples: [
            "Information Theory: Signal degradation over noisy channels.",
            "Environmental Management: Waste management strategies to combat pollution.",
            "Organisational Design: The tendency for bureaucracy to grow and efficiency to drop over time."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#18181b" rx="4" />
                <rect x="4" y="4" width="6" height="6" fill="#ec4899" />
                <rect x="12" y="4" width="6" height="6" fill="#ec4899" />
                <rect x="6" y="14" width="4" height="4" fill="#f472b6" />
                <circle cx="16" cy="16" r="2" fill="#f472b6" />
                <circle cx="24" cy="20" r="1.5" fill="#fbcfe8" />
                <circle cx="28" cy="28" r="1" fill="#fbcfe8" />
            </svg>
        )
    },
    {
        name: "Feedback Loop",
        desc: "Circular causality where outputs become inputs. Reinforcement.",
        examples: [
            "Engineering: Thermostats regulating temperature based on output.",
            "Economics: Viral marketing where user growth drives more user growth.",
            "Psychology: Cognitive behavioural loops reinforcing or breaking thought patterns."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#022c22" rx="4" />
                <path d="M16 6 A10 10 0 1 1 6 16" stroke="#34d399" strokeWidth="2" fill="none" />
                <path d="M6 16 L9 13 M6 16 L9 19" stroke="#34d399" strokeWidth="2" />
                <circle cx="16" cy="16" r="3" fill="#10b981" />
            </svg>
        )
    },
    {
        name: "Critical Mass",
        desc: "The tipping point where a system changes state irreversibly.",
        examples: [
            "Marketing: The point of viral adoption for a new product or platform.",
            "Nuclear Physics: Chain reactions becoming self-sustaining.",
            "Sociology: The percentage of a population needed to overturn a social norm."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1e1b4b" rx="4" />
                <path d="M4 28L28 4" stroke="#6366f1" strokeWidth="1" opacity="0.5" />
                <circle cx="10" cy="22" r="2" fill="#818cf8" />
                <circle cx="14" cy="18" r="2" fill="#818cf8" />
                <circle cx="18" cy="14" r="3" fill="#c7d2fe" />
                <circle cx="24" cy="8" r="4" fill="#ffffff" />
            </svg>
        )
    },
    {
        name: "The Prism",
        desc: "Splitting a single perspective into a spectrum of possibilities.",
        examples: [
            "Journalism: Analysing a single event through multiple political lenses.",
            "Product Design: Taking a core feature and adapting it for different user segments.",
            "Optics: Dispersion of white light into component wavelengths."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#000000" rx="4" />
                <path d="M10 4L22 28H4L10 4Z" stroke="#ffffff" strokeWidth="1" fill="#ffffff" fillOpacity="0.1" />
                <path d="M0 14H8" stroke="#ffffff" strokeWidth="2" />
                <path d="M18 18L32 12" stroke="#ef4444" strokeWidth="1" />
                <path d="M19 20L32 20" stroke="#22c55e" strokeWidth="1" />
                <path d="M17 22L32 28" stroke="#3b82f6" strokeWidth="1" />
            </svg>
        )
    },
    {
        name: "The Archive",
        desc: "Layers of history and memory, accumulated over time.",
        examples: [
            "Geology: Sedimentary rock layers recording earth's history.",
            "Data Science: Data warehouses storing historical transactions for trend analysis.",
            "Law: Case law archives establishing precedence."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#27272a" rx="4" />
                <rect x="8" y="22" width="16" height="4" rx="1" fill="#71717a" />
                <rect x="8" y="16" width="16" height="4" rx="1" fill="#a1a1aa" />
                <rect x="8" y="10" width="16" height="4" rx="1" fill="#e4e4e7" />
                <path d="M6 28H26" stroke="#3f3f46" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Network",
        desc: "Distributed connections. Resilience through decentralization.",
        examples: [
            "Technology: The decentralized structure of the internet.",
            "Energy Systems: Smart grids distributing power generation across many small sources.",
            "Epidemiology: Tracking contact networks to model disease spread."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0f172a" rx="4" />
                <path d="M8 8L24 24 M8 24L24 8 M16 4L16 28 M4 16L28 16" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />
                <circle cx="8" cy="8" r="2" fill="#38bdf8" />
                <circle cx="24" cy="8" r="2" fill="#38bdf8" />
                <circle cx="8" cy="24" r="2" fill="#38bdf8" />
                <circle cx="24" cy="24" r="2" fill="#38bdf8" />
                <circle cx="16" cy="16" r="3" fill="#bae6fd" />
            </svg>
        )
    },
    {
        name: "Oscillation",
        desc: "Rhythmic movement between states. Tides and waves.",
        examples: [
            "Politics: The swing between left and right wing governments over decades.",
            "Economics: Business cycles of boom and recession.",
            "Ecology: Seasonal migration patterns of birds."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#172554" rx="4" />
                <path d="M0 16 Q8 4 16 16 T32 16" stroke="#60a5fa" strokeWidth="3" fill="none" />
                <path d="M0 16 Q8 28 16 16 T32 16" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.5" />
            </svg>
        )
    },
    {
        name: "Metamorphosis",
        desc: "Radical change of form. The caterpillar to the butterfly.",
        examples: [
            "Business: A startup pivoting from a product company to a service company.",
            "Urban Planning: Gentrification changing the character and economy of a neighbourhood.",
            "Biology: Complete metamorphosis in insects."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#3f3f46" rx="4" />
                <rect x="4" y="12" width="8" height="8" fill="#a1a1aa" />
                <path d="M14 16H18" stroke="#d4d4d8" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx="24" cy="16" r="5" fill="#ffffff" />
            </svg>
        )
    },
    {
        name: "The Anchor",
        desc: "Stability amidst turbulence. Holding fast to core values.",
        examples: [
            "Finance: Gold reserves or pegged currencies stabilizing an economy.",
            "Psychology: Core beliefs or family relationships providing stability during trauma.",
            "Brand Strategy: A flagship product that defines a brand's identity."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0c4a6e" rx="4" />
                <path d="M16 6V22 M8 18Q16 28 24 18" stroke="#f0f9ff" strokeWidth="3" strokeLinecap="round" />
                <circle cx="16" cy="6" r="2" stroke="#f0f9ff" strokeWidth="2" fill="none" />
                <line x1="12" y1="10" x2="20" y2="10" stroke="#f0f9ff" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Filter",
        desc: "Removing noise to find the signal. Selection and refinement.",
        examples: [
            "Recruitment: Screening processes to find the best candidates from a large pool.",
            "Environmental Management: Wetlands acting as bio-filters for pollutants.",
            "Data Science: Filtering out outliers to train accurate machine learning models."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1f2937" rx="4" />
                <path d="M4 6H28L18 18V26L14 28V18L4 6Z" fill="#374151" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="16" cy="22" r="1" fill="#f3f4f6" />
            </svg>
        )
    },
    {
        name: "Symbiosis",
        desc: "Mutual interdependence. Two unlike things strengthening each other.",
        examples: [
            "Ecology: The relationship between bees and flowers.",
            "Business: Strategic partnerships where companies integrate hardware and software.",
            "Urban Planning: Mixed-use developments where residential and retail support each other."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#064e3b" rx="4" />
                <path d="M10 6 Q20 16 10 26" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
                <path d="M22 6 Q12 16 22 26" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Orbit",
        desc: "Gravity and attraction. Influence acting at a distance.",
        examples: [
            "Leadership: Charismatic leaders attracting followers and setting cultural norms.",
            "Astronomy: Planetary systems and gravitational pulls.",
            "Economics: Satellite economies revolving around a major economic superpower."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#111827" rx="4" />
                <circle cx="16" cy="16" r="4" fill="#f59e0b" />
                <ellipse cx="16" cy="16" rx="10" ry="6" stroke="#4b5563" strokeWidth="1" transform="rotate(-45 16 16)" />
                <circle cx="23" cy="9" r="2" fill="#60a5fa" />
            </svg>
        )
    },
    {
        name: "The Mosaic",
        desc: "Disparate fragments assembled to create a unified image.",
        examples: [
            "Data Integration: Combining data from SQL, NoSQL, and APIs into a single dashboard.",
            "Sociology: Diverse communities retaining individual identities while forming a society.",
            "Art: Collages or mosaics creating a whole from broken parts."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#262626" rx="4" />
                <path d="M8 4h8v8h-8z" fill="#ef4444" />
                <path d="M16 4h8v8h-8z" fill="#3b82f6" />
                <path d="M8 12h8v8h-8z" fill="#eab308" />
                <path d="M16 12h8v8h-8z" fill="#22c55e" />
                <path d="M4 20h24v8h-24z" fill="#a855f7" />
            </svg>
        )
    },
    {
        name: "The Echo",
        desc: "Action at a distance, reflection, and diminishing returns.",
        examples: [
            "History: Historical events repeating in patterns ('history rhymes').",
            "Acoustics: Sound reflection used in sonar or architectural design.",
            "Economics: The ripple effect of a financial crash across global markets."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0f172a" rx="4" />
                <path d="M16 20 A6 6 0 0 1 16 8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <path d="M22 24 A10 10 0 0 1 22 4" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
                <path d="M28 28 A14 14 0 0 1 28 0" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
                <circle cx="10" cy="14" r="2" fill="#ffffff" />
            </svg>
        )
    },
    {
        name: "The Labyrinth",
        desc: "Complexity and the non-linear path to the center.",
        examples: [
            "Problem Solving: Navigating complex bureaucratic processes or legal systems.",
            "Psychology: The journey of self-discovery.",
            "Security: Designing defence-in-depth layers to protect a core asset."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#451a03" rx="4" />
                <path d="M4 4h24v24h-24z M8 8v16h16v-16z M12 12h8v8h-8z" stroke="#d97706" strokeWidth="2" fill="none" />
                <path d="M16 4v4 M28 16h-4 M16 28v-4 M4 16h4" stroke="#d97706" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Seed",
        desc: "Potential energy. Small beginnings leading to massive growth.",
        examples: [
            "Venture Capital: Seed funding for startups that grow into unicorns.",
            "Agriculture: Planting strategies for future harvests.",
            "Education: Teaching fundamental concepts that allow students to derive complex theories later."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#3f2c22" rx="4" />
                <circle cx="16" cy="20" r="3" fill="#fbbf24" />
                <path d="M16 20v-8" stroke="#86efac" strokeWidth="2" />
                <path d="M16 12 Q20 8 24 10" stroke="#22c55e" strokeWidth="2" fill="none" />
                <path d="M16 12 Q12 8 8 10" stroke="#22c55e" strokeWidth="2" fill="none" />
            </svg>
        )
    },
    {
        name: "The Tides",
        desc: "Inevitable cyclic forces. Ebb and flow.",
        examples: [
            "Economics: Navigating predictable market cycles.",
            "Oceanography: Harnessing tidal energy.",
            "Retail: Managing inventory for seasonal shopping trends."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1e3a8a" rx="4" />
                <path d="M0 16 Q8 6 16 16 T32 16" fill="none" stroke="#93c5fd" strokeWidth="2" />
                <path d="M0 24 Q8 14 16 24 T32 24" fill="none" stroke="#60a5fa" strokeWidth="2" />
                <circle cx="16" cy="6" r="2" fill="#ffffff" opacity="0.8" />
            </svg>
        )
    },
    {
        name: "Refraction",
        desc: "Changing direction when passing through a new medium.",
        examples: [
            "Public Policy: International laws being interpreted differently in local courts.",
            "Marketing: A global campaign message being adapted (refracted) for local cultures.",
            "Physics: Lenses bending light."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#111827" rx="4" />
                <rect x="10" y="0" width="12" height="32" fill="#374151" opacity="0.5" />
                <path d="M0 10 L10 16 L22 12 L32 18" stroke="#f472b6" strokeWidth="2" />
            </svg>
        )
    },
    {
        name: "The Alloy",
        desc: "Combination creating something stronger than its parts.",
        examples: [
            "Materials Science: Creating steel from iron and carbon.",
            "Team Building: Diverse teams outperforming homogenous ones by combining skillsets.",
            "Cooking: Creating emulsions like mayonnaise from oil and vinegar."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#334155" rx="4" />
                <circle cx="12" cy="16" r="6" fill="#94a3b8" opacity="0.7" />
                <circle cx="20" cy="16" r="6" fill="#cbd5e1" opacity="0.7" />
                <path d="M16 12L16 20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "The Quantum",
        desc: "Discrete states. Jumping without crossing the space between.",
        examples: [
            "Innovation: Disruptive technology leaps rather than incremental improvement.",
            "Physics: Electron energy levels.",
            "Career: Changing industries completely rather than climbing the corporate ladder."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#020617" rx="4" />
                <line x1="4" y1="24" x2="28" y2="24" stroke="#334155" strokeWidth="1" />
                <line x1="4" y1="16" x2="28" y2="16" stroke="#475569" strokeWidth="1" />
                <line x1="4" y1="8" x2="28" y2="8" stroke="#64748b" strokeWidth="1" />
                <circle cx="8" cy="24" r="2" fill="#22d3ee" />
                <circle cx="24" cy="8" r="2" fill="#22d3ee" />
                <path d="M10 22 L22 10" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
            </svg>
        )
    },
    {
        name: "The Vector",
        desc: "Direction and magnitude. Purposeful force.",
        examples: [
            "Corporate Strategy: Aligning all departments to 'row in the same direction'.",
            "Physics: Calculating velocity vs speed.",
            "Project Management: Defining the critical path."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#18181b" rx="4" />
                <path d="M6 26L24 8" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                <path d="M24 8L16 8 M24 8L24 16" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: "Stratification",
        desc: "Layers of sediment, class, or logic building up over time.",
        examples: [
            "Sociology: Analyzing social classes and mobility.",
            "Software Architecture: The OSI model of networking layers.",
            "Geology: Studying rock strata to understand geological history."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#292524" rx="4" />
                <path d="M0 24H32V32H0z" fill="#44403c" />
                <path d="M0 16H32V24H0z" fill="#57534e" />
                <path d="M0 8H32V16H0z" fill="#78716c" />
                <path d="M0 0H32V8H0z" fill="#a8a29e" />
            </svg>
        )
    },
    {
        name: "Resonance",
        desc: "Amplification through matching frequencies.",
        examples: [
            "Marketing: Brand messaging that 'resonates' emotionally with a target audience.",
            "Engineering: Avoiding structural failure (e.g., Tacoma Narrows Bridge).",
            "Music: Using acoustics to amplify sound naturally."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#4c1d95" rx="4" />
                <path d="M4 16 Q16 0 28 16" stroke="#c4b5fd" strokeWidth="1" fill="none" />
                <path d="M4 16 Q16 8 28 16" stroke="#c4b5fd" strokeWidth="2" fill="none" />
                <path d="M4 16 Q16 24 28 16" stroke="#c4b5fd" strokeWidth="1" fill="none" />
                <line x1="16" y1="4" x2="16" y2="28" stroke="#fff" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
        )
    },
    {
        name: "The Blueprint",
        desc: "The plan before the reality. Abstract structure.",
        examples: [
            "Architecture: Floor plans determining the flow of a building.",
            "Genetics: DNA acting as the blueprint for an organism.",
            "Software: UML diagrams planning system architecture before coding."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#1e3a8a" rx="4" />
                <path d="M4 4h24v24h-24z" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="4" y1="16" x2="28" y2="16" stroke="#ffffff" strokeWidth="0.5" />
                <line x1="16" y1="4" x2="16" y2="28" stroke="#ffffff" strokeWidth="0.5" />
                <circle cx="16" cy="16" r="6" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
        )
    },
    {
        name: "Evolution",
        desc: "Gradual improvement and adaptation over generations.",
        examples: [
            "Technology: The iteration of the mobile phone from brick to smartphone.",
            "Biology: Natural selection adapting species to their environment.",
            "Language: The gradual shift in vocabulary and grammar over centuries."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#064e3b" rx="4" />
                <rect x="4" y="20" width="6" height="6" fill="#34d399" />
                <rect x="12" y="16" width="6" height="10" fill="#34d399" />
                <rect x="20" y="10" width="8" height="16" fill="#34d399" />
            </svg>
        )
    },
    {
        name: "The Horizon",
        desc: "The limit of sight. The boundary between known and unknown.",
        examples: [
            "Futures Studies: Horizon scanning for emerging trends.",
            "Exploration: Seeking new lands or scientific frontiers.",
            "Philosophy: The limits of human knowledge and perception."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#0f172a" rx="4" />
                <path d="M0 20H32" stroke="#38bdf8" strokeWidth="1" />
                <path d="M16 20 Q22 8 28 20" fill="#facc15" opacity="0.5" />
                <circle cx="16" cy="20" r="6" fill="#facc15" />
            </svg>
        )
    },
    {
        name: "The Bridge",
        desc: "Connecting two separated entities over a divide.",
        examples: [
            "Diplomacy: Bridging cultural divides to forge treaties.",
            "Infrastructure: Connecting islands or cities physically.",
            "Education: Bridging the gap between theory and practice."
        ],
        svg: (
            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="#374151" rx="4" />
                <rect x="0" y="16" width="8" height="16" fill="#1f2937" />
                <rect x="24" y="16" width="8" height="16" fill="#1f2937" />
                <path d="M8 16 Q16 8 24 16" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                <line x1="8" y1="16" x2="24" y2="16" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
        )
    }
];
