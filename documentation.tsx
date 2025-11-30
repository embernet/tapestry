
import React from 'react';
import { GuidanceContent } from './types';

// ============================================================================
// TAPESTRY TOOL DOCUMENTATION & GUIDANCE REGISTRY
// ============================================================================
// 
// HOW TO ADD A NEW TOOL:
// 1. Add an entry to the TOOL_DOCUMENTATION array below.
// 2. 'icon', 'color', 'desc', 'summary', 'subItems': Used in the "User Guide" Modal.
// 3. 'guidance': Used in the "Guidance Panel" (Lightbulb button) specific to that tool.
//    - This allows you to write the help text ONCE and have it appear in both 
//      the manual and the context-sensitive help.
//
// ============================================================================

export interface ToolDocumentationItem {
    id: string; // Unique key for lookup
    name: string;
    color: string;
    desc: string; // Short description for list view
    summary: string; // Paragraph for User Guide
    icon: React.ReactNode;
    subItems?: { name: string; desc: string; icon: React.ReactNode }[];
    
    // The detailed content for the Guidance Panel (Lightbulb)
    guidance: GuidanceContent;
}

export const TOOL_DOCUMENTATION: ToolDocumentationItem[] = [
    {
        id: 'schema',
        name: "Schema",
        color: "text-teal-400",
        desc: "Define visual language.",
        summary: "The Schema tool provides a semantic framework for your knowledge graph, rooted in ontology engineering and data modeling principles. Its purpose is to enforce consistency and meaning across your model by defining standard tags and relationship types. Principles include type-safety and standardized vocabulary. Use this when starting a new domain model or standardizing a team's language. Tip: Define a 'Default Relationship' to speed up entry. Compliments: **Bulk Edit** allows you to quickly apply your new schema to existing nodes.",
        icon: <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
        subItems: [
            { name: "Active Schema", desc: "Switch between color/tag schemes (e.g. Business, Design Thinking).", icon: <path d="M7 7h.01M7 3h5" /> },
            { name: "Edit Schema", desc: "Customize tag colors and relationship definitions.", icon: <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> }
        ],
        guidance: {
            title: "Schema Management",
            sections: [
                {
                    title: "Why use Schemas?",
                    text: "Schemas act as the 'grammar' of your graph. By defining consistent colors for tags (e.g., 'Risk' is always red) and standardizing relationship names (e.g., 'causes' instead of 'leads to' or 'makes'), you make the graph readable by others and by AI tools."
                },
                {
                    title: "Quick Tips",
                    items: [
                        "Use **Active Schema** to quickly switch contexts (e.g., from 'Business' view to 'Technical' view).",
                        "Set a **Default Relation** if you are mapping a process where every step follows the same logic (e.g., 'then').",
                        "The **Default Tags** input allows you to auto-tag every new node you create, perfect for rapid brainstorming sessions."
                    ]
                }
            ]
        }
    },
    {
        id: 'layout',
        name: "Layout",
        color: "text-orange-400",
        desc: "Control graph physics.",
        summary: "Based on force-directed graph drawing algorithms used in network science, the Layout tool simulates physical forces to reveal clusters and structure. Its purpose is to untangle complex networks automatically. Principles involve repulsion between nodes and attraction along edges. Use this when a graph becomes messy or hard to read. Tip: Use 'Shake' if nodes get stuck in local minima. Compliments: **Explorer** offers alternative structural views (like Treemaps) when physics layout is insufficient.",
        icon: <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />,
        subItems: [
            { name: "Simulate", desc: "Start physics simulation to auto-arrange nodes.", icon: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> },
            { name: "Spread", desc: "Adjust the target distance between connected nodes.", icon: <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
            { name: "Repel", desc: "Adjust how strongly nodes push away from each other.", icon: <path d="M18 12H6" /> },
            { name: "Shake", desc: "Jiggle nodes to unstuck them.", icon: <path d="M12 8v4l3 3" /> }
        ],
        guidance: {
            title: "Physics & Layout",
            sections: [
                {
                    title: "Understanding Forces",
                    text: "The graph acts like a physical system. Nodes are charged particles that repel each other, while relationships are springs that pull connected nodes together."
                },
                {
                    title: "Controls",
                    items: [
                        "**Spread:** Determines the length of the 'springs'. Increase this to untangle dense clusters.",
                        "**Repel:** Determines the magnetic push between nodes. Increase this if nodes are overlapping.",
                        "**Simulate:** Runs the physics engine continuously. Use this to watch the graph organize itself.",
                        "**Shake:** Applies a sudden random force to all nodes. Useful if the graph settles in a 'tangled' state and needs a nudge to find a better arrangement."
                    ]
                }
            ]
        }
    },
    {
        id: 'analysis',
        name: "Analysis",
        color: "text-purple-400",
        desc: "Graph theory stats.",
        summary: "Derived from graph theory and social network analysis, this tool identifies structural importance within your network. Its purpose is to find key influencers, bottlenecks, and isolated clusters mathematically. Principles include centrality, degree distribution, and connectivity. Use this to identify single points of failure (Articulations) or key hubs. Tip: Use filters to focus analysis on specific sub-graphs. Compliments: **Strategy** tools help you plan actions based on the structural weaknesses identified here.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Simulation", desc: "Propagate impact (increase/decrease) through connections.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
            { name: "Highlight/Filter", desc: "Identify Isolated nodes, Hubs, Sources, Sinks, etc.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> }
        ],
        guidance: {
            title: "Structural Analysis",
            sections: [
                {
                    title: "Node Classification",
                    items: [
                        "**Isolated:** Nodes with no connections. Often represent forgotten ideas or gaps in modeling.",
                        "**Leaves:** Nodes with only one connection. These are often end-states or inputs.",
                        "**Hubs:** Nodes with many connections. These are critical infrastructure; if a hub fails, many things are affected.",
                        "**Sources:** Nodes that only have outgoing arrows (Inputs/Causes).",
                        "**Sinks:** Nodes that only have incoming arrows (Outputs/Effects)."
                    ]
                },
                {
                    title: "Impact Simulation",
                    text: "Clicking 'Play' in Simulation mode allows you to click a node and see how a change (Increase/Decrease) propagates through the network based on relationship types (e.g. 'causes' vs 'inhibits')."
                }
            ]
        }
    },
    {
        id: 'scamper',
        name: "SCAMPER",
        color: "text-cyan-400",
        desc: "Ideation technique.",
        summary: "Developed by Bob Eberle in 1971 as a simplified version of Alex Osborn's brainstorming techniques. Its purpose is to spark lateral thinking and innovation by forcing specific modifications to an idea. Principles revolve around the seven operators: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse. Use this when you are stuck or need to iterate on a product feature. Tip: Rapidly cycle through all letters for one node. Compliments: **TRIZ** offers more rigorous solutions if simple brainstorming isn't solving the technical contradiction.",
        icon: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
        subItems: [
            { name: "S, C, A, M, P, E, R", desc: "Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> }
        ],
        guidance: {
            title: "SCAMPER Ideation",
            sections: [
                {
                    text: "Select a node and apply one of the seven operators to generate new ideas.",
                    items: [
                        "**Substitute:** Who or what else could do this? Other materials? Other times?",
                        "**Combine:** Can we blend purposes? Combine units? Combine ideas?",
                        "**Adapt:** What else is like this? What can I copy? Who does this better?",
                        "**Modify:** Change meaning, color, motion, sound, smell, form, shape? Magnify? Minify?",
                        "**Put to another use:** New ways to use as is? Other uses if modified?",
                        "**Eliminate:** What to subtract? Smaller? Condensed? Lower?",
                        "**Reverse:** Transpose positive and negative? Turn it backward? Upside down? Reverse roles?"
                    ]
                }
            ]
        }
    },
    {
        id: 'triz',
        name: "TRIZ",
        color: "text-indigo-400",
        desc: "Inventive Problem Solving.",
        summary: "Created by Genrich Altshuller in 1946 after analyzing 40,000 patents, TRIZ (Theory of Inventive Problem Solving) is an algorithmic approach to innovation. Its purpose is to overcome technical contradictions without compromise. Principles include the 40 Inventive Principles and Evolution Trends. Use this for hard engineering or system problems where improving one thing breaks another. Tip: Abstract your specific problem into a generic system conflict first. Compliments: **SCAMPER** serves as a lighter, faster alternative for less technical problems.",
        icon: <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
        subItems: [
            { name: "Contradiction Matrix", desc: "Solve technical conflicts using 40 principles.", icon: <rect x="4" y="4" width="16" height="16" rx="2" /> },
            { name: "40 Principles", desc: "Apply inventive principles to specific nodes.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /> },
            { name: "ARIZ", desc: "Algorithm for Inventive Problem Solving.", icon: <path d="M19 11H5" /> },
            { name: "Su-Field", desc: "Substance-Field Analysis.", icon: <path d="M13 10V3L4 14" /> },
            { name: "Trends", desc: "Evolution Trends.", icon: <path d="M13 7h8m0 0v8" /> }
        ],
        guidance: {
            title: "TRIZ: Theory of Inventive Problem Solving",
            sections: [
                {
                    title: "Core Concept",
                    text: "TRIZ solves problems by identifying and resolving contradictions. A contradiction exists when improving one parameter (e.g., speed) worsens another (e.g., stability)."
                },
                {
                    title: "Tools",
                    items: [
                        "**Contradiction Matrix:** Maps 39 engineering parameters to 40 inventive principles.",
                        "**Su-Field Analysis:** Models systems as two substances and a field. If a system is incomplete, TRIZ suggests how to complete the triangle.",
                        "**Trends of Evolution:** Predicts how systems mature (e.g., towards micro-levels, towards increased dynamism)."
                    ]
                }
            ]
        }
    },
    {
        id: 'lss',
        name: "Lean Six Sigma",
        color: "text-blue-400",
        desc: "Process Improvement.",
        summary: "A fusion of Toyota's Lean manufacturing (waste reduction) and Motorola's Six Sigma (defect reduction). Its purpose is to improve process performance and quality systematically. Principles include DMAIC (Define, Measure, Analyze, Improve, Control) and flow optimization. Use this to analyze workflows, supply chains, or service delivery issues modeled in your graph. Tip: Map the 'Current State' before designing the 'Future State'. Compliments: **Theory of Constraints** helps identify *where* to apply LSS improvements for maximum system impact.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Project Charter", desc: "Problem, Scope, Goals.", icon: <path d="M9 12h6" /> },
            { name: "SIPOC", desc: "Suppliers, Inputs, Process, Outputs, Customers.", icon: <path d="M8 7h12" /> },
            { name: "VoC", desc: "Voice of Customer analysis.", icon: <path d="M11 5v14" /> },
            { name: "DMAIC", desc: "Define, Measure, Analyze, Improve, Control.", icon: <path d="M4 4v5h.5" /> },
            { name: "5 Whys", desc: "Root Cause Analysis.", icon: <path d="M8 9c.5 0 1" /> },
            { name: "Fishbone", desc: "Ishikawa Diagram.", icon: <path d="M4 12h16" /> }
        ],
        guidance: {
            title: "Lean Six Sigma",
            sections: [
                {
                    title: "DMAIC Framework",
                    items: [
                        "**Define:** What is the problem? Who is the customer?",
                        "**Measure:** What is the baseline performance?",
                        "**Analyze:** What are the root causes of defects or waste?",
                        "**Improve:** How can we fix the root cause?",
                        "**Control:** How do we sustain the gains?"
                    ]
                },
                {
                    title: "Common Tools",
                    items: [
                        "**SIPOC:** High-level process map (Suppliers, Inputs, Process, Outputs, Customers).",
                        "**5 Whys:** Drilling down to root cause by asking 'Why?' five times.",
                        "**Fishbone:** Categorizing causes (Man, Machine, Material, Method, Measurement, Environment)."
                    ]
                }
            ]
        }
    },
    {
        id: 'toc',
        name: "Theory of Constraints",
        color: "text-amber-400",
        desc: "Constraint Management.",
        summary: "Introduced by Eliyahu Goldratt in his 1984 novel 'The Goal'. Its purpose is to identify and manage the single biggest limiting factor (bottleneck) in a system. Principles state that a chain is no stronger than its weakest link. Use this when a system is underperforming despite local improvements. Tip: Focus all attention on the constraint; ignore non-constraints initially. Compliments: **Lean Six Sigma** provides the tools to exploit and elevate the constraint once identified.",
        icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "Current Reality Tree", desc: "Identify Core Constraints.", icon: <path d="M12 9v2" /> },
            { name: "Evaporating Cloud", desc: "Resolve Conflicts.", icon: <path d="M3 15a4 4 0 004 4" /> },
            { name: "Future Reality Tree", desc: "Visualize Solutions.", icon: <path d="M13 10V3" /> }
        ],
        guidance: {
            title: "Theory of Constraints (TOC)",
            sections: [
                {
                    text: "TOC posits that every system is limited by at least one constraint (bottleneck). Improving non-constraints does not improve system performance.",
                    items: [
                        "**Current Reality Tree (CRT):** Use logic to trace 'Undesirable Effects' back to a root cause.",
                        "**Evaporating Cloud:** Resolve conflicts by exposing invalid assumptions.",
                        "**Future Reality Tree (FRT):** Map out the 'what if' scenario of a solution injection to ensure it creates desirable effects without negative side effects."
                    ]
                }
            ]
        }
    },
    {
        id: 'ssm',
        name: "Soft Systems",
        color: "text-cyan-400",
        desc: "Complex Problem Solving.",
        summary: "Developed by Peter Checkland in the 1960s at Lancaster University. Its purpose is to tackle 'messy', ill-defined problem situations involving human complexity. Principles focus on holism and understanding diverse worldviews (CATWOE). Use this for organizational change, cultural issues, or stakeholder conflicts. Tip: Use 'Rich Pictures' to capture emotional and political connections, not just logic. Compliments: **Strategy** tools help formalize the soft insights into actionable plans.",
        icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />,
        subItems: [
            { name: "Rich Picture", desc: "Explore Relationships & Climate.", icon: <path d="M4 16l4.586-4.586" /> },
            { name: "CATWOE", desc: "Worldview Analysis.", icon: <path d="M3 11H5" /> },
            { name: "Activity Models", desc: "Root Definitions.", icon: <path d="M19 11H5" /> }
        ],
        guidance: {
            title: "Soft Systems Methodology (SSM)",
            sections: [
                {
                    title: "For 'Messy' Problems",
                    text: "Unlike engineering problems, human systems often have no clear definition of the problem itself. SSM helps structure this ambiguity."
                },
                {
                    title: "CATWOE Analysis",
                    items: [
                        "**C**ustomers: Beneficiaries/Victims.",
                        "**A**ctors: Who does the activities?",
                        "**T**ransformation: Input -> Output.",
                        "**W**orldview: What makes this T meaningful?",
                        "**O**wners: Who can stop T?",
                        "**E**nvironment: Constraints outside control."
                    ]
                }
            ]
        }
    },
    {
        id: 'strategy',
        name: "Strategy",
        color: "text-lime-400",
        desc: "Strategic Frameworks.",
        summary: "A collection of classic strategic frameworks (SWOT from the 60s, Porter's Five Forces from 1979). Its purpose is to assess internal and external environments for planning. Principles involve structured categorization of factors to reveal strategic fit. Use this for business planning, market analysis, or competitive positioning. Tip: Be specific; vague strengths lead to vague strategies. Compliments: **Analysis** tools can validate if your perceived 'Strengths' are actually structurally significant in your network.",
        icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "SWOT", desc: "Strengths, Weaknesses, Opportunities, Threats.", icon: <rect x="4" y="4" width="16" height="16" /> },
            { name: "PESTEL", desc: "Macro-environmental factors.", icon: <path d="M3 11H5" /> },
            { name: "Porter's 5 Forces", desc: "Competitive Analysis.", icon: <path d="M9 12l2 2" /> }
        ],
        guidance: {
            title: "Strategic Clarity: Analysis Frameworks",
            sections: [
                {
                    title: "Scanning the Horizon",
                    text: "Use these frameworks to systematically map internal capabilities against external realities.",
                    items: [
                        "**SWOT:** The fundamental balance sheet. internal attributes (Strengths/Weaknesses) vs external conditions (Opportunities/Threats).",
                        "**PESTEL & Variants:** Macro-environmental scanning. Look beyond competitors to Political, Economic, Social, and Tech shifts.",
                        "**Porter's Five Forces:** Industry structure. Assess profitability by looking at Supplier/Buyer power, Substitutes, and Rivalry.",
                        "**CAGE:** Global strategy. Measure Cultural, Administrative, Geographic, and Economic distances between markets."
                    ]
                },
                {
                    title: "AI-Augmented Strategy",
                    text: "The AI acts as a red-teamer and researcher.",
                    items: [
                        "**Blind Spot Detection:** The AI generates factors you might miss due to internal bias.",
                        "**Contextual Generation:** It reads your graph to tailor generic factors (e.g., 'Inflation') to your specific nodes (e.g., 'Rising costs of raw materials for Node X').",
                        "**Custom Strategies:** Define your own frameworks in the 'Custom' tab to guide the AI with bespoke logic."
                    ]
                }
            ]
        }
    },
    {
        id: 'explorer',
        name: "Explorer",
        color: "text-yellow-400",
        desc: "Visual Graph Analysis.",
        summary: "A visualization suite based on hierarchical data techniques like Treemaps (Shneiderman, 1990s). Its purpose is to provide macro-views of graph data that node-link diagrams cannot. Principles involve area-based visualization and radial trees. Use this to understand the distribution of tags or density of relationships. Tip: Use Treemaps to quickly see which topics dominate your knowledge base. Compliments: **Word Cloud** provides a text-content perspective to match this structural perspective.",
        icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        subItems: [
            { name: "Treemap", desc: "Hierarchical view of structure.", icon: <path d="M4 6h16" /> },
            { name: "Sunburst", desc: "Radial view of relationships.", icon: <path d="M12 3v1" /> },
            { name: "Tag Distribution", desc: "Tag frequency.", icon: <path d="M7 7h.01" /> }
        ],
        guidance: {
            title: "Exploring Structure",
            sections: [
                {
                    title: "Alternative Views",
                    text: "Node-link diagrams are great for paths, but poor for density. Use these tools to see the 'weight' of your model.",
                    items: [
                        "**Treemaps:** Good for spotting dominant tags or highly connected nodes at a glance.",
                        "**Sunburst:** Good for walking through the graph layer by layer from a central point."
                    ]
                }
            ]
        }
    },
    {
        id: 'wordcloud',
        name: "Word Cloud",
        color: "text-pink-400",
        desc: "Text Analysis.",
        summary: "A text mining visualization technique popularised in the web 2.0 era. Its purpose is to reveal the prominence of terms within your graph's textual content. Principles involve frequency-based sizing. Use this to perform a quick content audit or sentiment check of your notes. Tip: Use 'Full Text' mode to find themes buried in descriptions. Compliments: **Explorer** (Tag Distribution) handles explicit categorization, while this handles implicit content.",
        icon: <path d="M7 7h.01M7 3h5" />,
        subItems: [
            { name: "Tag Cloud", desc: "Tag frequency cloud.", icon: <path d="M7 7h.01" /> },
            { name: "Relationship Cloud", desc: "Connectivity cloud.", icon: <path d="M13 10l-4 4" /> },
            { name: "Full Text", desc: "Analyze content text.", icon: <path d="M19 20H5" /> }
        ],
        guidance: {
            title: "Beyond Frequency: Word Clouds as Creative Triggers",
            sections: [
                {
                    title: "Visualising Your Model",
                    items: [
                        "**Tag Cloud:** High-level categorisation. What themes dominate your taxonomy?",
                        "**Relationship Cloud:** Structural connectivity. Which nodes are the busiest hubs?",
                        "**Node Name Analysis:** Conceptual vocabulary. How are you naming your entities?",
                        "**Full Text Analysis:** Deep content context. What words appear most in your descriptions and notes?"
                    ]
                },
                {
                    title: "Lateral Thinking with AI View Modes",
                    text: "Words are often coloured by mood, situation, or bias. Use the AI Transformation modes to shift your perspective and break cognitive deadlock:",
                    items: [
                        "**Antonyms:** Invert the problem. If the cloud shows 'Chaos', the antonym 'Order' might define your goal state.",
                        "**Synonyms:** Explore nuance. Are there subtler, more precise words to describe the situation?",
                        "**Exaggerated:** Amplify the signal. See where things are heading if current trends continue unchecked.",
                        "**Understated:** Ground reality. Counteract over-optimism or panic to see the bare facts.",
                        "**Hypernyms:** Zoom Out. Move to abstract categories to see the 'Big Picture' (e.g., 'Car' → 'Vehicle').",
                        "**Hyponyms:** Zoom In. Get specific to find concrete examples and edge cases (e.g., 'Vehicle' → 'Truck').",
                        "**Related:** Lateral Hop. Find adjacent concepts to widen the scope of investigation.",
                        "**Metaphors:** Shift Paradigm. Break out of the domain by comparing your system to biology, mechanics, or art.",
                        "**Simplified:** Check Communication. Can technical jargon be explained in plain English?",
                        "**Formalised:** Increase Gravitas. Highlight the seriousness or professional weight of the topic."
                    ]
                }
            ]
        }
    },
    {
        id: 'diagrams',
        name: "Diagrams",
        color: "text-cyan-400",
        desc: "Mermaid.js Editor.",
        summary: "Uses Mermaid.js, a syntax-based diagramming tool inspired by Markdown. Its purpose is to generate formal, documentation-ready diagrams (UML, Flowcharts) from your graph data. Principles involve code-as-infrastructure and separating content from formatting. Use this when you need to export your model for formal reports or presentations. Tip: Use the AI command bar to style the diagram code. Compliments: **Layout** provides the flexible, exploratory view, while this provides the rigid, presentation view.",
        icon: <path d="M7 12l3-3 3 3 4-4" />,
        subItems: [
            { name: "Editor", desc: "Text-to-diagram editor supporting Flowcharts, Sequence, etc.", icon: <path d="M4 5h14" /> }
        ],
        guidance: {
            title: "Diagram Generation",
            sections: [
                {
                    title: "Mermaid.js Integration",
                    text: "You can convert your casual knowledge graph into formal diagrams (Flowcharts, Gantt, Sequence, Class Diagrams) using the Mermaid syntax."
                },
                {
                    title: "AI Styling",
                    text: "Use the AI Command bar in the diagram panel to say things like 'Make all red nodes circles' or 'Group by tag'."
                }
            ]
        }
    },
    {
        id: 'bulk',
        name: "Bulk Edit",
        color: "text-pink-400",
        desc: "Mass Tagging.",
        summary: "A productivity tool designed for batch operations. Its purpose is to speed up the taxonomy management of large graphs. Principles involve selection-based application. Use this when you import raw data and need to categorize it quickly. Tip: Use in conjunction with 'Filter' to tag specific subsets of nodes. Compliments: **Schema** defines the tags you apply here.",
        icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
        subItems: [
            { name: "Add/Remove Tags", desc: "Apply tags to nodes by clicking them.", icon: <path d="M7 7h.01" /> }
        ],
        guidance: {
            title: "Batch Operations",
            sections: [
                {
                    text: "Set a list of tags to Add and/or Remove. Activate the tool, then click nodes on the canvas. The changes are applied immediately to clicked nodes.",
                    items: ["Useful for quickly categorizing imported data.", "Combine with Filters to find and tag groups of nodes."]
                }
            ]
        }
    },
    {
        id: 'command',
        name: "Command",
        color: "text-green-400",
        desc: "Quick Entry.",
        summary: "Inspired by command-line interfaces (CLI) and text-based adventure parsers. Its purpose is high-speed data entry without leaving the keyboard. Principles involve shorthand syntax (A->B). Use this for rapid brainstorming or taking meeting minutes directly into the graph. Tip: You can paste multiline text to create complex structures instantly. Compliments: **Markdown** offers a full-document editing experience for similar syntax.",
        icon: <path d="M8 9l3 3-3 3m5 0h3" />,
        subItems: [
            { name: "Quick Add", desc: "Add nodes/links via text: A -> B.", icon: <path d="M5 20h14" /> }
        ],
        guidance: {
            title: "Command Syntax",
            sections: [
                {
                    title: "Quick Entry",
                    items: [
                        "`A -> B` creates a directed link.",
                        "`A -- B` creates a link with no direction.",
                        "`A -[label]-> B` adds a label.",
                        "`A:tag1,tag2` adds tags.",
                        "`A -> B; C -> D` handles multiple operations."
                    ]
                }
            ]
        }
    }
];
