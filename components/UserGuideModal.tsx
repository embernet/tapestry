
import React, { useRef, useEffect, useState } from 'react';

interface ModalProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

type GuideItem = {
    icon: React.ReactNode;
    name: string;
    desc: string;
    summary?: string;
    color?: string;
    subItems?: GuideItem[];
};

const INTERFACE_ITEMS: GuideItem[] = [
    { name: "New Model", desc: "Start a fresh, empty knowledge graph.", icon: <path d="M12 4v16m8-8H4" /> },
    { name: "Open Model", desc: "Load a previously saved JSON model from your computer.", icon: <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
    { name: "Save to Disk", desc: "Download the current model state as a JSON file.", icon: <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /> },
    { name: "Copy Selection", desc: "Copy selected nodes and relationships to clipboard (as text/internal data).", icon: <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /> },
    { name: "Paste", desc: "Paste nodes from clipboard into the current graph.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { name: "Tools Panel", desc: "Toggle the main toolbar for analysis and editing tools.", icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /> },
    { name: "Filter", desc: "Filter visible nodes by tags or date ranges.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> },
    { name: "Focus Mode", desc: "Toggle between Narrow (Selection only), Wide (Neighbors), and Zoom focus.", icon: <circle cx="12" cy="12" r="3" /> },
    { name: "Diagrams", desc: "Open the Mermaid.js diagram editor.", icon: <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /> },
    { name: "Documents", desc: "Manage text documents and analysis reports.", icon: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { name: "Kanban", desc: "View nodes as cards in a Kanban board.", icon: <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { name: "Story Mode", desc: "Create presentations by capturing graph views.", icon: <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
    { name: "Table", desc: "Edit nodes and properties in a spreadsheet view.", icon: <path d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /> },
    { name: "Matrix", desc: "View relationships as an adjacency matrix.", icon: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { name: "Grid", desc: "Plot nodes on an X/Y axis based on attributes.", icon: <path d="M4 4h7v7H4V4z M13 4h7v7h-7V4z M4 13h7v7H4v-7z M13 13h7v7h-7v-7z" /> },
    { name: "Markdown", desc: "Edit the graph using text-based markdown.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { name: "JSON", desc: "View/Edit raw JSON data.", icon: <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { name: "Report", desc: "Generate a readable text report of the model.", icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { name: "History", desc: "View log of AI interactions.", icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: "AI Chat", desc: "Chat with the graph using AI.", icon: <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
    { name: "Settings", desc: "Configure API keys and prompts.", icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    { name: "Zoom Fit", desc: "Center the graph.", icon: <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /> },
];

const TOOLS_DATA: GuideItem[] = [
    {
        name: "Schema",
        color: "text-teal-400",
        desc: "Define visual language.",
        summary: "The Schema tool provides a semantic framework for your knowledge graph, rooted in ontology engineering and data modeling principles. Its purpose is to enforce consistency and meaning across your model by defining standard tags and relationship types. Principles include type-safety and standardized vocabulary. Use this when starting a new domain model or standardizing a team's language. Tip: Define a 'Default Relationship' to speed up entry. Compliments: **Bulk Edit** allows you to quickly apply your new schema to existing nodes.",
        icon: <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
        subItems: [
            { name: "Active Schema", desc: "Switch between color/tag schemes (e.g. Business, Design Thinking).", icon: <path d="M7 7h.01M7 3h5" /> },
            { name: "Edit Schema", desc: "Customize tag colors and relationship definitions.", icon: <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> }
        ]
    },
    {
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
        ]
    },
    {
        name: "Analysis",
        color: "text-purple-400",
        desc: "Graph theory stats.",
        summary: "Derived from graph theory and social network analysis, this tool identifies structural importance within your network. Its purpose is to find key influencers, bottlenecks, and isolated clusters mathematically. Principles include centrality, degree distribution, and connectivity. Use this to identify single points of failure (Articulations) or key hubs. Tip: Use filters to focus analysis on specific sub-graphs. Compliments: **Strategy** tools help you plan actions based on the structural weaknesses identified here.",
        icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        subItems: [
            { name: "Simulation", desc: "Propagate impact (increase/decrease) through connections.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
            { name: "Highlight/Filter", desc: "Identify Isolated nodes, Hubs, Sources, Sinks, etc.", icon: <path d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /> }
        ]
    },
    {
        name: "SCAMPER",
        color: "text-cyan-400",
        desc: "Ideation technique.",
        summary: "Developed by Bob Eberle in 1971 as a simplified version of Alex Osborn's brainstorming techniques. Its purpose is to spark lateral thinking and innovation by forcing specific modifications to an idea. Principles revolve around the seven operators: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse. Use this when you are stuck or need to iterate on a product feature. Tip: Rapidly cycle through all letters for one node. Compliments: **TRIZ** offers more rigorous solutions if simple brainstorming isn't solving the technical contradiction.",
        icon: <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
        subItems: [
            { name: "S, C, A, M, P, E, R", desc: "Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse.", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> }
        ]
    },
    {
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
        ]
    },
    {
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
        ]
    },
    {
        name: "Theory of Constraints",
        color: "text-amber-400",
        desc: "Constraint Management.",
        summary: "Introduced by Eliyahu Goldratt in his 1984 novel 'The Goal'. Its purpose is to identify and manage the single biggest limiting factor (bottleneck) in a system. Principles state that a chain is no stronger than its weakest link. Use this when a system is underperforming despite local improvements. Tip: Focus all attention on the constraint; ignore non-constraints initially. Compliments: **Lean Six Sigma** provides the tools to exploit and elevate the constraint once identified.",
        icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "Current Reality Tree", desc: "Identify Core Constraints.", icon: <path d="M12 9v2" /> },
            { name: "Evaporating Cloud", desc: "Resolve Conflicts.", icon: <path d="M3 15a4 4 0 004 4" /> },
            { name: "Future Reality Tree", desc: "Visualize Solutions.", icon: <path d="M13 10V3" /> }
        ]
    },
    {
        name: "Soft Systems",
        color: "text-cyan-400",
        desc: "Complex Problem Solving.",
        summary: "Developed by Peter Checkland in the 1960s at Lancaster University. Its purpose is to tackle 'messy', ill-defined problem situations involving human complexity. Principles focus on holism and understanding diverse worldviews (CATWOE). Use this for organizational change, cultural issues, or stakeholder conflicts. Tip: Use 'Rich Pictures' to capture emotional and political connections, not just logic. Compliments: **Strategy** tools help formalize the soft insights into actionable plans.",
        icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />,
        subItems: [
            { name: "Rich Picture", desc: "Explore Relationships & Climate.", icon: <path d="M4 16l4.586-4.586" /> },
            { name: "CATWOE", desc: "Worldview Analysis.", icon: <path d="M3 11H5" /> },
            { name: "Activity Models", desc: "Root Definitions.", icon: <path d="M19 11H5" /> }
        ]
    },
    {
        name: "Strategy",
        color: "text-lime-400",
        desc: "Strategic Frameworks.",
        summary: "A collection of classic strategic frameworks (SWOT from the 60s, Porter's Five Forces from 1979). Its purpose is to assess internal and external environments for planning. Principles involve structured categorization of factors to reveal strategic fit. Use this for business planning, market analysis, or competitive positioning. Tip: Be specific; vague strengths lead to vague strategies. Compliments: **Analysis** tools can validate if your perceived 'Strengths' are actually structurally significant in your network.",
        icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
        subItems: [
            { name: "SWOT", desc: "Strengths, Weaknesses, Opportunities, Threats.", icon: <rect x="4" y="4" width="16" height="16" /> },
            { name: "PESTEL", desc: "Macro-environmental factors.", icon: <path d="M3 11H5" /> },
            { name: "Porter's 5 Forces", desc: "Competitive Analysis.", icon: <path d="M9 12l2 2" /> }
        ]
    },
    {
        name: "Explorer",
        color: "text-yellow-400",
        desc: "Visual Graph Analysis.",
        summary: "A visualization suite based on hierarchical data techniques like Treemaps (Shneiderman, 1990s). Its purpose is to provide macro-views of graph data that node-link diagrams cannot. Principles involve area-based visualization and radial trees. Use this to understand the distribution of tags or density of relationships. Tip: Use Treemaps to quickly see which topics dominate your knowledge base. Compliments: **Word Cloud** provides a text-content perspective to match this structural perspective.",
        icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        subItems: [
            { name: "Treemap", desc: "Hierarchical view of structure.", icon: <path d="M4 6h16" /> },
            { name: "Sunburst", desc: "Radial view of relationships.", icon: <path d="M12 3v1" /> },
            { name: "Tag Distribution", desc: "Tag frequency.", icon: <path d="M7 7h.01" /> }
        ]
    },
    {
        name: "Word Cloud",
        color: "text-pink-400",
        desc: "Text Analysis.",
        summary: "A text mining visualization technique popularised in the web 2.0 era. Its purpose is to reveal the prominence of terms within your graph's textual content. Principles involve frequency-based sizing. Use this to perform a quick content audit or sentiment check of your notes. Tip: Use 'Full Text' mode to find themes buried in descriptions. Compliments: **Explorer** (Tag Distribution) handles explicit categorization, while this handles implicit content.",
        icon: <path d="M7 7h.01M7 3h5" />,
        subItems: [
            { name: "Tag Cloud", desc: "Tag frequency cloud.", icon: <path d="M7 7h.01" /> },
            { name: "Relationship Cloud", desc: "Connectivity cloud.", icon: <path d="M13 10l-4 4" /> },
            { name: "Full Text", desc: "Analyze content text.", icon: <path d="M19 20H5" /> }
        ]
    },
    {
        name: "Diagrams",
        color: "text-cyan-400",
        desc: "Mermaid.js Editor.",
        summary: "Uses Mermaid.js, a syntax-based diagramming tool inspired by Markdown. Its purpose is to generate formal, documentation-ready diagrams (UML, Flowcharts) from your graph data. Principles involve code-as-infrastructure and separating content from formatting. Use this when you need to export your model for formal reports or presentations. Tip: Use the AI command bar to style the diagram code. Compliments: **Layout** provides the flexible, exploratory view, while this provides the rigid, presentation view.",
        icon: <path d="M7 12l3-3 3 3 4-4" />,
        subItems: [
            { name: "Editor", desc: "Text-to-diagram editor supporting Flowcharts, Sequence, etc.", icon: <path d="M4 5h14" /> }
        ]
    },
    {
        name: "Bulk Edit",
        color: "text-pink-400",
        desc: "Mass Tagging.",
        summary: "A productivity tool designed for batch operations. Its purpose is to speed up the taxonomy management of large graphs. Principles involve selection-based application. Use this when you import raw data and need to categorize it quickly. Tip: Use in conjunction with 'Filter' to tag specific subsets of nodes. Compliments: **Schema** defines the tags you apply here.",
        icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
        subItems: [
            { name: "Add/Remove Tags", desc: "Apply tags to nodes by clicking them.", icon: <path d="M7 7h.01" /> }
        ]
    },
    {
        name: "Command",
        color: "text-green-400",
        desc: "Quick Entry.",
        summary: "Inspired by command-line interfaces (CLI) and text-based adventure parsers. Its purpose is high-speed data entry without leaving the keyboard. Principles involve shorthand syntax (A->B). Use this for rapid brainstorming or taking meeting minutes directly into the graph. Tip: You can paste multiline text to create complex structures instantly. Compliments: **Markdown** offers a full-document editing experience for similar syntax.",
        icon: <path d="M8 9l3 3-3 3m5 0h3" />,
        subItems: [
            { name: "Quick Add", desc: "Add nodes/links via text: A -> B.", icon: <path d="M5 20h14" /> }
        ]
    }
];

export const UserGuideModal: React.FC<ModalProps> = ({ onClose, isDarkMode = true }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'interface' | 'tools'>('interface');

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose(); }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    const bgClass = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const headerBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const tabActive = isDarkMode ? 'border-blue-500 text-white bg-gray-800' : 'border-blue-500 text-black bg-white';
    const tabInactive = isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-800';
    const textHeader = isDarkMode ? 'text-white' : 'text-gray-900';
    const textDesc = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const itemBg = isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm';
    const iconBg = isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';
    const scrollBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
    const groupBg = isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200 shadow-sm';
    const groupHeaderBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200';
    const subItemBg = isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div ref={ref} className={`${bgClass} rounded-lg max-w-5xl w-full h-[85vh] shadow-2xl border flex flex-col overflow-hidden`}>
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center ${headerBg}`}>
                    <div>
                        <h2 className={`text-2xl font-bold ${textHeader}`}>User Guide</h2>
                        <p className={`text-sm ${textDesc} mt-1`}>Reference for tools and interface elements.</p>
                    </div>
                    <button onClick={onClose} className={`${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-black hover:bg-gray-200'} p-2 rounded-full transition-colors`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <button 
                        onClick={() => setActiveTab('interface')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interface' ? tabActive : tabInactive}`}
                    >
                        Interface & Navigation
                    </button>
                    <button 
                        onClick={() => setActiveTab('tools')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tools' ? tabActive : tabInactive}`}
                    >
                        Analysis & Creation Tools
                    </button>
                </div>

                {/* Content */}
                <div className={`flex-grow overflow-y-auto p-6 custom-scrollbar ${scrollBg}`}>
                    
                    {activeTab === 'interface' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {INTERFACE_ITEMS.map((item, idx) => (
                                <div key={idx} className={`flex items-start p-3 rounded border transition-colors group ${itemBg}`}>
                                    <div className={`p-2 rounded-lg group-hover:text-white mr-3 shrink-0 ${iconBg} ${isDarkMode ? 'group-hover:bg-gray-600' : 'group-hover:bg-gray-500'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            {item.icon}
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.name}</h3>
                                        <p className={`text-xs leading-snug ${textDesc}`}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-8">
                            {TOOLS_DATA.map((tool, idx) => (
                                <div key={idx} className={`border rounded-lg overflow-hidden ${groupBg}`}>
                                    <div className={`p-4 border-b flex flex-col gap-3 ${groupHeaderBg}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${tool.color}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {tool.icon}
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-bold ${tool.color}`}>{tool.name}</h3>
                                                <p className={`text-sm ${textDesc}`}>{tool.desc}</p>
                                            </div>
                                        </div>
                                        {tool.summary && (
                                            <p className={`text-xs leading-relaxed opacity-80 pl-11 ${textDesc}`}>
                                                {tool.summary}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {tool.subItems && tool.subItems.length > 0 && (
                                        <div className={`p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${subItemBg}`}>
                                            {tool.subItems.map((sub, sIdx) => (
                                                <div key={sIdx} className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            {sub.icon}
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{sub.name}</div>
                                                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{sub.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
